from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from apps.hotel.models import StockOpname, StockOpnameItem, InventoryItem, StockMovement, WarehouseAuditLog
from apps.hotel.serializers.stock_opname import (
    StockOpnameListSerializer,
    StockOpnameDetailSerializer,
    StockOpnameCreateSerializer,
    StockOpnameItemSerializer
)


class StockOpnameViewSet(viewsets.ModelViewSet):
    """ViewSet for Stock Opname (Physical Inventory Count)"""
    queryset = StockOpname.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return StockOpnameCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return StockOpnameDetailSerializer
        return StockOpnameListSerializer

    def get_queryset(self):
        queryset = StockOpname.objects.all()

        # Filter by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        if date_from:
            queryset = queryset.filter(opname_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(opname_date__lte=date_to)

        return queryset

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """Start the counting process (change status to IN_PROGRESS)"""
        opname = self.get_object()

        if opname.status != 'DRAFT':
            return Response(
                {'error': 'Can only start opname in DRAFT status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        opname.status = 'IN_PROGRESS'
        opname.started_at = timezone.now()
        opname.save()

        # Log audit
        WarehouseAuditLog.log_action(
            action_type='UPDATE',
            model_name='StockOpname',
            object_id=opname.id,
            object_repr=str(opname),
            user=request.user,
            changes={'status': {'old': 'DRAFT', 'new': 'IN_PROGRESS'}},
            notes='Started stock opname counting'
        )

        serializer = StockOpnameDetailSerializer(opname)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def complete(self, request, pk=None):
        """
        Complete the opname and apply stock adjustments
        Only items with discrepancies will create stock movements
        """
        opname = self.get_object()

        if opname.status not in ['DRAFT', 'IN_PROGRESS']:
            return Response(
                {'error': 'Can only complete opname in DRAFT or IN_PROGRESS status'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if all items have been counted
        uncounted_items = opname.items.filter(counted_stock__isnull=True).count()
        if uncounted_items > 0:
            return Response(
                {'error': f'{uncounted_items} items have not been counted yet'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Apply stock adjustments for items with discrepancies
        adjustments_made = []
        for item in opname.items.all():
            if item.has_discrepancy:
                # Update inventory stock
                inventory_item = item.inventory_item
                old_stock = inventory_item.current_stock
                inventory_item.current_stock = item.counted_stock
                inventory_item.save()

                # Create stock movement record
                movement = StockMovement.objects.create(
                    inventory_item=inventory_item,
                    movement_type='ADJUSTMENT',
                    quantity=item.difference,
                    balance_after=item.counted_stock,
                    reference=opname.opname_number,
                    notes=f'Stock opname adjustment. Reason: {item.reason or "N/A"}',
                    created_by=request.user
                )

                adjustments_made.append({
                    'item': inventory_item.name,
                    'old_stock': old_stock,
                    'new_stock': item.counted_stock,
                    'difference': item.difference
                })

                # Log audit
                WarehouseAuditLog.log_action(
                    action_type='ADJUST',
                    model_name='InventoryItem',
                    object_id=inventory_item.id,
                    object_repr=str(inventory_item),
                    user=request.user,
                    changes={
                        'current_stock': {
                            'old': old_stock,
                            'new': item.counted_stock
                        }
                    },
                    notes=f'Stock opname {opname.opname_number} adjustment'
                )

        # Update opname status
        opname.status = 'COMPLETED'
        opname.completed_at = timezone.now()
        opname.completed_by = request.user
        opname.calculate_summary()
        opname.save()

        # Log opname completion
        WarehouseAuditLog.log_action(
            action_type='COMPLETE',
            model_name='StockOpname',
            object_id=opname.id,
            object_repr=str(opname),
            user=request.user,
            notes=f'Completed stock opname. {len(adjustments_made)} adjustments made.'
        )

        return Response({
            'message': 'Stock opname completed successfully',
            'opname_number': opname.opname_number,
            'total_items': opname.total_items_counted,
            'total_discrepancies': opname.total_discrepancies,
            'adjustments_made': adjustments_made
        })

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel the opname (cannot cancel if already completed)"""
        opname = self.get_object()

        if opname.status == 'COMPLETED':
            return Response(
                {'error': 'Cannot cancel completed opname'},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = opname.status
        opname.status = 'CANCELLED'
        opname.save()

        # Log audit
        WarehouseAuditLog.log_action(
            action_type='CANCEL',
            model_name='StockOpname',
            object_id=opname.id,
            object_repr=str(opname),
            user=request.user,
            changes={'status': {'old': old_status, 'new': 'CANCELLED'}},
            notes='Cancelled stock opname'
        )

        serializer = StockOpnameDetailSerializer(opname)
        return Response(serializer.data)


class StockOpnameItemViewSet(viewsets.ModelViewSet):
    """ViewSet for Stock Opname Items"""
    queryset = StockOpnameItem.objects.all()
    serializer_class = StockOpnameItemSerializer

    def get_queryset(self):
        queryset = StockOpnameItem.objects.all()

        # Filter by stock opname
        opname_id = self.request.query_params.get('stock_opname')
        if opname_id:
            queryset = queryset.filter(stock_opname_id=opname_id)

        # Filter by discrepancy status
        has_discrepancy = self.request.query_params.get('has_discrepancy')
        if has_discrepancy == 'true':
            queryset = queryset.exclude(difference=0)
        elif has_discrepancy == 'false':
            queryset = queryset.filter(difference=0)

        return queryset

    def perform_update(self, serializer):
        """Log audit when item is updated"""
        instance = self.get_object()
        old_counted = instance.counted_stock

        serializer.save()

        # Log if counted_stock was updated
        if 'counted_stock' in serializer.validated_data:
            new_counted = serializer.validated_data['counted_stock']
            if old_counted != new_counted:
                WarehouseAuditLog.log_action(
                    action_type='COUNT',
                    model_name='StockOpnameItem',
                    object_id=instance.id,
                    object_repr=str(instance),
                    user=self.request.user,
                    changes={
                        'counted_stock': {
                            'old': old_counted,
                            'new': new_counted
                        },
                        'difference': {
                            'old': old_counted - instance.system_stock if old_counted else None,
                            'new': instance.difference
                        }
                    },
                    notes=f'Updated count for {instance.inventory_item.name}'
                )
