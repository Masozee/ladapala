"""
Department Inventory Views
Manage buffer stock allocated to each department
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction, models
from django.utils import timezone
from decimal import Decimal

from ..models import DepartmentInventory, InventoryItem, StockMovement
from ..serializers import DepartmentInventorySerializer


class DepartmentInventoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing department inventory buffers
    """
    queryset = DepartmentInventory.objects.select_related('inventory_item', 'inventory_item__category').all()
    serializer_class = DepartmentInventorySerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['department', 'is_active', 'inventory_item']
    search_fields = ['inventory_item__name', 'department', 'location']
    ordering_fields = ['department', 'inventory_item__name', 'current_stock', 'last_restocked']
    ordering = ['department', 'inventory_item__name']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filter by low stock
        if self.request.query_params.get('low_stock') == 'true':
            queryset = queryset.filter(current_stock__lte=models.F('min_stock'))

        return queryset

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Get all department buffers running low on stock"""
        low_stock_items = self.queryset.filter(
            current_stock__lte=models.F('min_stock'),
            is_active=True
        )
        serializer = self.get_serializer(low_stock_items, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_department(self, request):
        """Get inventory grouped by department"""
        department = request.query_params.get('dept')
        if not department:
            return Response(
                {'error': 'Department parameter required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        dept_inventory = self.queryset.filter(
            department=department,
            is_active=True
        )
        serializer = self.get_serializer(dept_inventory, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def transfer_from_warehouse(self, request, pk=None):
        """
        Transfer stock from main warehouse to department buffer
        """
        dept_inventory = self.get_object()
        quantity = request.data.get('quantity')
        notes = request.data.get('notes', '')

        if not quantity:
            return Response(
                {'error': 'Quantity is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = Decimal(str(quantity))
            if quantity <= 0:
                return Response(
                    {'error': 'Quantity must be positive'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid quantity format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check warehouse stock
        warehouse_item = dept_inventory.inventory_item
        if warehouse_item.current_stock < quantity:
            return Response(
                {
                    'error': f'Insufficient warehouse stock. Available: {warehouse_item.current_stock}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if transfer would exceed max capacity
        new_dept_stock = dept_inventory.current_stock + quantity
        if dept_inventory.max_stock and new_dept_stock > dept_inventory.max_stock:
            return Response(
                {
                    'error': f'Transfer would exceed department max capacity'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Perform transfer
        warehouse_item.current_stock -= int(quantity)
        warehouse_item.save(update_fields=['current_stock'])

        dept_inventory.current_stock += quantity
        dept_inventory.last_restocked = timezone.now()
        dept_inventory.save(update_fields=['current_stock', 'last_restocked'])

        # Create stock movement record
        StockMovement.objects.create(
            inventory_item=warehouse_item,
            movement_type='USAGE',
            quantity=-int(quantity),
            balance_after=warehouse_item.current_stock,
            reference=f'Transfer to {dept_inventory.get_department_display()}',
            notes=notes,
            created_by=request.user
        )

        serializer = self.get_serializer(dept_inventory)
        return Response({
            'message': f'Successfully transferred {quantity} units',
            'department_inventory': serializer.data
        })

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def return_to_warehouse(self, request, pk=None):
        """
        Return stock from department buffer back to main warehouse
        """
        dept_inventory = self.get_object()
        quantity = request.data.get('quantity')
        reason = request.data.get('reason', '')

        if not quantity:
            return Response(
                {'error': 'Quantity is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            quantity = Decimal(str(quantity))
            if quantity <= 0:
                return Response(
                    {'error': 'Quantity must be positive'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid quantity format'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check department stock
        if dept_inventory.current_stock < quantity:
            return Response(
                {
                    'error': f'Insufficient department stock'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Perform return
        warehouse_item = dept_inventory.inventory_item

        dept_inventory.current_stock -= quantity
        dept_inventory.save(update_fields=['current_stock'])

        warehouse_item.current_stock += int(quantity)
        warehouse_item.save(update_fields=['current_stock'])

        # Create stock movement
        StockMovement.objects.create(
            inventory_item=warehouse_item,
            movement_type='RETURN',
            quantity=int(quantity),
            balance_after=warehouse_item.current_stock,
            reference=f'Return from {dept_inventory.get_department_display()}',
            notes=reason,
            created_by=request.user
        )

        serializer = self.get_serializer(dept_inventory)
        return Response({
            'message': f'Successfully returned {quantity} units to warehouse',
            'department_inventory': serializer.data
        })
