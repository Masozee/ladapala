from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Sum, F
from django.utils import timezone
from .models import (
    WarehouseCategory,
    Supplier,
    WarehouseItem,
    DepartmentBuffer,
    StockTransfer,
    PurchaseOrder,
    PurchaseOrderItem,
    StockAdjustment
)
from .serializers import (
    WarehouseCategorySerializer,
    SupplierSerializer,
    WarehouseItemSerializer,
    WarehouseItemListSerializer,
    DepartmentBufferSerializer,
    StockTransferSerializer,
    PurchaseOrderSerializer,
    PurchaseOrderItemSerializer,
    StockAdjustmentSerializer
)


class WarehouseCategoryViewSet(viewsets.ModelViewSet):
    queryset = WarehouseCategory.objects.all()
    serializer_class = WarehouseCategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['for_hotel', 'for_restaurant', 'is_active', 'parent_category']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def hotel_categories(self, request):
        """Get categories available for hotel"""
        categories = self.queryset.filter(for_hotel=True, is_active=True)
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def restaurant_categories(self, request):
        """Get categories available for restaurant"""
        categories = self.queryset.filter(for_restaurant=True, is_active=True)
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)


class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['is_active', 'rating']
    search_fields = ['name', 'contact_person', 'email', 'phone']
    ordering_fields = ['name', 'rating', 'created_at']
    ordering = ['name']

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active suppliers"""
        suppliers = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(suppliers, many=True)
        return Response(serializer.data)


class WarehouseItemViewSet(viewsets.ModelViewSet):
    queryset = WarehouseItem.objects.select_related('category', 'supplier').all()
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'item_type', 'supplier', 'is_active']
    search_fields = ['code', 'name', 'description']
    ordering_fields = ['name', 'quantity', 'cost_per_unit', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.action == 'list':
            return WarehouseItemListSerializer
        return WarehouseItemSerializer

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get items with low stock"""
        items = self.queryset.filter(quantity__lte=F('min_quantity'), is_active=True)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def needs_reorder(self, request):
        """Get items that need reordering"""
        items = self.queryset.filter(quantity__lte=F('reorder_point'), is_active=True)
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def expiring_soon(self, request):
        """Get items expiring in the next 30 days"""
        thirty_days_from_now = timezone.now().date() + timezone.timedelta(days=30)
        items = self.queryset.filter(
            expiry_date__isnull=False,
            expiry_date__lte=thirty_days_from_now,
            expiry_date__gte=timezone.now().date(),
            is_active=True
        )
        serializer = self.get_serializer(items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stock_summary(self, request):
        """Get warehouse stock summary"""
        total_items = self.queryset.filter(is_active=True).count()
        total_value = sum(item.stock_value for item in self.queryset.filter(is_active=True))
        low_stock_count = self.queryset.filter(
            quantity__lte=F('min_quantity'),
            is_active=True
        ).count()
        reorder_count = self.queryset.filter(
            quantity__lte=F('reorder_point'),
            is_active=True
        ).count()

        return Response({
            'total_items': total_items,
            'total_value': total_value,
            'low_stock_count': low_stock_count,
            'reorder_count': reorder_count
        })


class DepartmentBufferViewSet(viewsets.ModelViewSet):
    queryset = DepartmentBuffer.objects.select_related('item').all()
    serializer_class = DepartmentBufferSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['department', 'item']
    search_fields = ['item__code', 'item__name', 'location']
    ordering_fields = ['department', 'current_stock', 'last_restocked']
    ordering = ['department', 'item__name']

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        """Get buffers by department"""
        department = request.query_params.get('dept')
        if not department:
            return Response(
                {'error': 'Department parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        buffers = self.queryset.filter(department=department)
        serializer = self.get_serializer(buffers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def low_stock_buffers(self, request):
        """Get department buffers with low stock"""
        buffers = self.queryset.filter(current_stock__lte=F('min_stock'))
        serializer = self.get_serializer(buffers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def hotel_buffers(self, request):
        """Get all hotel department buffers"""
        hotel_depts = ['HOTEL_HOUSEKEEPING', 'HOTEL_FRONT_DESK', 'HOTEL_MAINTENANCE',
                       'HOTEL_LAUNDRY', 'HOTEL_FB', 'HOTEL_ENGINEERING']
        buffers = self.queryset.filter(department__in=hotel_depts)
        serializer = self.get_serializer(buffers, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def restaurant_buffers(self, request):
        """Get all restaurant department buffers"""
        resto_depts = ['RESTO_KITCHEN', 'RESTO_BAR', 'RESTO_SERVICE', 'RESTO_STORAGE']
        buffers = self.queryset.filter(department__in=resto_depts)
        serializer = self.get_serializer(buffers, many=True)
        return Response(serializer.data)


class StockTransferViewSet(viewsets.ModelViewSet):
    queryset = StockTransfer.objects.select_related(
        'requested_by', 'approved_by', 'completed_by', 'warehouse_item'
    ).all()
    serializer_class = StockTransferSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'transfer_type', 'from_department', 'to_department']
    search_fields = ['transfer_number', 'notes']
    ordering_fields = ['request_date', 'approved_date', 'completed_date']
    ordering = ['-request_date']

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a pending transfer"""
        transfer = self.get_object()

        if transfer.status != 'PENDING':
            return Response(
                {'error': 'Only pending transfers can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transfer.status = 'IN_TRANSIT'
        transfer.approved_by = request.user
        transfer.approved_date = timezone.now()
        transfer.save()

        serializer = self.get_serializer(transfer)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete an approved transfer"""
        transfer = self.get_object()

        if transfer.status != 'IN_TRANSIT':
            return Response(
                {'error': 'Only in-transit transfers can be completed'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Process stock movements
        item = transfer.warehouse_item
        qty = transfer.quantity

        # Reduce warehouse stock
        if transfer.transfer_type == 'WAREHOUSE_TO_DEPT':
            item.quantity -= qty
            item.save()

            # Increase department buffer
            buffer, created = DepartmentBuffer.objects.get_or_create(
                item=item,
                department=transfer.to_department,
                defaults={'current_stock': 0, 'min_stock': 0, 'max_stock': 0}
            )
            buffer.current_stock += qty
            buffer.last_restocked = timezone.now()
            buffer.save()

        transfer.status = 'COMPLETED'
        transfer.completed_by = request.user
        transfer.completed_date = timezone.now()
        transfer.save()

        serializer = self.get_serializer(transfer)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a transfer"""
        transfer = self.get_object()

        if transfer.status == 'COMPLETED':
            return Response(
                {'error': 'Completed transfers cannot be cancelled'},
                status=status.HTTP_400_BAD_REQUEST
            )

        transfer.status = 'CANCELLED'
        transfer.save()

        serializer = self.get_serializer(transfer)
        return Response(serializer.data)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    queryset = PurchaseOrder.objects.select_related(
        'supplier', 'created_by', 'approved_by', 'received_by'
    ).prefetch_related('items__item').all()
    serializer_class = PurchaseOrderSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'supplier']
    search_fields = ['po_number', 'notes']
    ordering_fields = ['order_date', 'expected_delivery_date', 'actual_delivery_date']
    ordering = ['-order_date']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit a draft PO"""
        po = self.get_object()

        if po.status != 'DRAFT':
            return Response(
                {'error': 'Only draft POs can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        po.status = 'SUBMITTED'
        po.save()

        serializer = self.get_serializer(po)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a submitted PO"""
        po = self.get_object()

        if po.status != 'SUBMITTED':
            return Response(
                {'error': 'Only submitted POs can be approved'},
                status=status.HTTP_400_BAD_REQUEST
            )

        po.status = 'APPROVED'
        po.approved_by = request.user
        po.save()

        serializer = self.get_serializer(po)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def order(self, request, pk=None):
        """Mark PO as ordered"""
        po = self.get_object()

        if po.status != 'APPROVED':
            return Response(
                {'error': 'Only approved POs can be ordered'},
                status=status.HTTP_400_BAD_REQUEST
            )

        po.status = 'ORDERED'
        po.save()

        serializer = self.get_serializer(po)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """Receive goods from PO"""
        po = self.get_object()

        if po.status != 'ORDERED':
            return Response(
                {'error': 'Only ordered POs can be received'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update warehouse stock with received items
        for po_item in po.items.all():
            item = po_item.warehouse_item
            qty_received = po_item.received_quantity or po_item.quantity

            # Update moving average cost
            old_value = item.quantity * item.cost_per_unit
            new_value = qty_received * po_item.unit_price
            total_qty = item.quantity + qty_received

            if total_qty > 0:
                item.cost_per_unit = (old_value + new_value) / total_qty

            item.quantity += qty_received
            item.save()

        po.status = 'RECEIVED'
        po.actual_delivery = timezone.now().date()
        po.save()

        serializer = self.get_serializer(po)
        return Response(serializer.data)


class StockAdjustmentViewSet(viewsets.ModelViewSet):
    queryset = StockAdjustment.objects.select_related('item', 'adjusted_by').all()
    serializer_class = StockAdjustmentSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['adjustment_type', 'item']
    search_fields = ['reference_number', 'reason', 'notes']
    ordering_fields = ['adjustment_date', 'created_at']
    ordering = ['-adjustment_date']

    def perform_create(self, serializer):
        """Create adjustment and update stock"""
        item = serializer.validated_data['warehouse_item']
        quantity_adjusted = serializer.validated_data['quantity']
        department_buffer = serializer.validated_data.get('department_buffer')

        # Update item or buffer quantity
        if department_buffer:
            # Adjust department buffer stock
            department_buffer.current_stock += quantity_adjusted
            department_buffer.save()
        else:
            # Adjust warehouse stock
            item.quantity += quantity_adjusted
            item.save()

        # Save adjustment
        serializer.save(adjusted_by=self.request.user)
