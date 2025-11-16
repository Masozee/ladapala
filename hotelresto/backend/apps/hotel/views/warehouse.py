from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db import transaction

from ..models import PurchaseOrder, PurchaseOrderItem, StockMovement, InventoryItem
from ..serializers import (
    PurchaseOrderSerializer, PurchaseOrderItemSerializer,
    StockMovementSerializer, InventoryItemSerializer
)


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    """ViewSet for managing purchase orders"""
    queryset = PurchaseOrder.objects.all().prefetch_related('items__inventory_item')
    serializer_class = PurchaseOrderSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'supplier', 'order_date']
    ordering_fields = ['order_date', 'created_at', 'po_number']
    ordering = ['-order_date', '-created_at']

    def perform_create(self, serializer):
        """Set created_by user when creating PO"""
        serializer.save(created_by=self.request.user if self.request.user.is_authenticated else None)

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        """Submit a purchase order (change status from DRAFT to SUBMITTED)"""
        purchase_order = self.get_object()

        if purchase_order.status != 'DRAFT':
            return Response(
                {'error': 'Only draft purchase orders can be submitted'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not purchase_order.items.exists():
            return Response(
                {'error': 'Cannot submit purchase order without items'},
                status=status.HTTP_400_BAD_REQUEST
            )

        purchase_order.status = 'SUBMITTED'
        purchase_order.save(update_fields=['status', 'updated_at'])

        # Recalculate total
        purchase_order.calculate_total()

        serializer = self.get_serializer(purchase_order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def receive(self, request, pk=None):
        """
        Receive goods from purchase order
        Expected payload: { "items": [{"id": 1, "quantity_received": 10}, ...] }
        """
        purchase_order = self.get_object()

        if purchase_order.status not in ['SUBMITTED', 'RECEIVED']:
            return Response(
                {'error': 'Can only receive goods from submitted purchase orders'},
                status=status.HTTP_400_BAD_REQUEST
            )

        items_data = request.data.get('items', [])
        if not items_data:
            return Response(
                {'error': 'No items provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            with transaction.atomic():
                for item_data in items_data:
                    po_item_id = item_data.get('id')
                    quantity_to_receive = item_data.get('quantity_received', 0)

                    if quantity_to_receive <= 0:
                        continue

                    try:
                        po_item = purchase_order.items.get(id=po_item_id)
                    except PurchaseOrderItem.DoesNotExist:
                        return Response(
                            {'error': f'Purchase order item {po_item_id} not found'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # Update quantity received
                    po_item.quantity_received += quantity_to_receive
                    po_item.save(update_fields=['quantity_received', 'updated_at'])

                    # Update inventory stock
                    inventory_item = po_item.inventory_item
                    old_stock = inventory_item.current_stock
                    inventory_item.current_stock += quantity_to_receive
                    inventory_item.last_restocked = timezone.now().date()
                    inventory_item.save(update_fields=['current_stock', 'last_restocked', 'updated_at'])

                    # Create stock movement record
                    StockMovement.objects.create(
                        inventory_item=inventory_item,
                        movement_type='PURCHASE',
                        quantity=quantity_to_receive,
                        balance_after=inventory_item.current_stock,
                        reference=purchase_order.po_number,
                        notes=f'Received from PO {purchase_order.po_number}',
                        movement_date=timezone.now(),
                        created_by=request.user if request.user.is_authenticated else None
                    )

                # Check if all items are fully received
                all_received = all(item.is_fully_received for item in purchase_order.items.all())

                if all_received and purchase_order.status != 'RECEIVED':
                    purchase_order.status = 'RECEIVED'
                    purchase_order.received_by = request.user if request.user.is_authenticated else None
                    purchase_order.received_date = timezone.now()
                    purchase_order.save(update_fields=['status', 'received_by', 'received_date', 'updated_at'])

                serializer = self.get_serializer(purchase_order)
                return Response(serializer.data)

        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a purchase order"""
        purchase_order = self.get_object()

        if purchase_order.status == 'RECEIVED':
            return Response(
                {'error': 'Cannot cancel a received purchase order'},
                status=status.HTTP_400_BAD_REQUEST
            )

        purchase_order.status = 'CANCELLED'
        purchase_order.save(update_fields=['status', 'updated_at'])

        serializer = self.get_serializer(purchase_order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_item(self, request, pk=None):
        """Add item to purchase order"""
        purchase_order = self.get_object()

        if purchase_order.status != 'DRAFT':
            return Response(
                {'error': 'Can only add items to draft purchase orders'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = PurchaseOrderItemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(purchase_order=purchase_order)
            purchase_order.calculate_total()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PurchaseOrderItemViewSet(viewsets.ModelViewSet):
    """ViewSet for managing purchase order items"""
    queryset = PurchaseOrderItem.objects.all().select_related('purchase_order', 'inventory_item')
    serializer_class = PurchaseOrderItemSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['purchase_order', 'inventory_item']


class StockMovementViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing stock movements (read-only)"""
    queryset = StockMovement.objects.all().select_related('inventory_item', 'created_by')
    serializer_class = StockMovementSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['inventory_item', 'movement_type', 'movement_date']
    ordering_fields = ['movement_date', 'created_at']
    ordering = ['-movement_date', '-created_at']

    @action(detail=False, methods=['post'])
    def create_adjustment(self, request):
        """
        Create a stock adjustment
        Payload: {"inventory_item": 1, "quantity": 5, "notes": "Manual adjustment"}
        """
        inventory_item_id = request.data.get('inventory_item')
        quantity = request.data.get('quantity', 0)
        notes = request.data.get('notes', '')

        try:
            inventory_item = InventoryItem.objects.get(id=inventory_item_id)
        except InventoryItem.DoesNotExist:
            return Response(
                {'error': 'Inventory item not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update stock
        inventory_item.current_stock += quantity
        if inventory_item.current_stock < 0:
            inventory_item.current_stock = 0

        inventory_item.save(update_fields=['current_stock', 'updated_at'])

        # Create movement record
        movement = StockMovement.objects.create(
            inventory_item=inventory_item,
            movement_type='ADJUSTMENT',
            quantity=quantity,
            balance_after=inventory_item.current_stock,
            notes=notes,
            movement_date=timezone.now(),
            created_by=request.user if request.user.is_authenticated else None
        )

        serializer = StockMovementSerializer(movement)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
