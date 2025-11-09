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
from ..serializers import DepartmentInventorySerializer, StockMovementSerializer


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

        Request body:
        {
            "quantity": 50,
            "notes": "Monthly restock"
        }
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
                    'error': f'Insufficient warehouse stock. Available: {warehouse_item.current_stock}, Requested: {quantity}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if transfer would exceed max capacity
        new_dept_stock = dept_inventory.current_stock + quantity
        if dept_inventory.max_stock and new_dept_stock > dept_inventory.max_stock:
            return Response(
                {
                    'error': f'Transfer would exceed department max capacity. Max: {dept_inventory.max_stock}, After transfer: {new_dept_stock}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Perform transfer
        # 1. Deduct from warehouse
        warehouse_item.current_stock -= int(quantity)
        warehouse_item.save(update_fields=['current_stock'])

        # 2. Add to department
        dept_inventory.current_stock += quantity
        dept_inventory.last_restocked = timezone.now()
        dept_inventory.save(update_fields=['current_stock', 'last_restocked'])

        # 3. Create stock movement for warehouse
        StockMovement.objects.create(
            inventory_item=warehouse_item,
            movement_type='WAREHOUSE_TO_DEPARTMENT',
            quantity=-int(quantity),  # Negative because it's leaving warehouse
            balance_after=warehouse_item.current_stock,
            to_department=dept_inventory.department,
            department_inventory=dept_inventory,
            reference=f'Transfer to {dept_inventory.get_department_display()}',
            notes=notes,
            created_by=request.user
        )

        # 4. Create stock movement for department
        StockMovement.objects.create(
            inventory_item=warehouse_item,
            movement_type='WAREHOUSE_TO_DEPARTMENT',
            quantity=int(quantity),  # Positive for department
            balance_after=int(dept_inventory.current_stock),
            from_department='WAREHOUSE',
            to_department=dept_inventory.department,
            department_inventory=dept_inventory,
            reference=f'Transfer from Warehouse',
            notes=notes,
            created_by=request.user
        )

        serializer = self.get_serializer(dept_inventory)
        return Response({
            'message': f'Successfully transferred {quantity} units to {dept_inventory.get_department_display()}',
            'department_inventory': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def return_to_warehouse(self, request, pk=None):
        """
        Return stock from department buffer back to main warehouse

        Request body:
        {
            "quantity": 20,
            "reason": "Excess stock"
        }
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
                    'error': f'Insufficient department stock. Available: {dept_inventory.current_stock}, Requested: {quantity}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Perform return
        warehouse_item = dept_inventory.inventory_item

        # 1. Remove from department
        dept_inventory.current_stock -= quantity
        dept_inventory.save(update_fields=['current_stock'])

        # 2. Add back to warehouse
        warehouse_item.current_stock += int(quantity)
        warehouse_item.save(update_fields=['current_stock'])

        # 3. Create stock movements
        StockMovement.objects.create(
            inventory_item=warehouse_item,
            movement_type='DEPARTMENT_TO_WAREHOUSE',
            quantity=int(quantity),
            balance_after=warehouse_item.current_stock,
            from_department=dept_inventory.department,
            department_inventory=dept_inventory,
            reference=f'Return from {dept_inventory.get_department_display()}',
            notes=reason,
            created_by=request.user
        )

        serializer = self.get_serializer(dept_inventory)
        return Response({
            'message': f'Successfully returned {quantity} units to warehouse',
            'department_inventory': serializer.data
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def bulk_create(self, request):
        """
        Create department inventory records in bulk for a specific department

        Request body:
        {
            "department": "HOUSEKEEPING",
            "items": [
                {
                    "inventory_item_id": 1,
                    "min_stock": 10,
                    "max_stock": 100,
                    "location": "HK Storage Room"
                },
                ...
            ]
        }
        """
        department = request.data.get('department')
        items = request.data.get('items', [])

        if not department or not items:
            return Response(
                {'error': 'Department and items are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        created_items = []
        errors = []

        for item_data in items:
            try:
                inventory_item = InventoryItem.objects.get(id=item_data['inventory_item_id'])

                # Check if already exists
                if DepartmentInventory.objects.filter(
                    department=department,
                    inventory_item=inventory_item
                ).exists():
                    errors.append(f'{inventory_item.name} already exists for this department')
                    continue

                dept_inv = DepartmentInventory.objects.create(
                    department=department,
                    inventory_item=inventory_item,
                    min_stock=item_data.get('min_stock', 0),
                    max_stock=item_data.get('max_stock', 100),
                    location=item_data.get('location', '')
                )
                created_items.append(dept_inv)
            except InventoryItem.DoesNotExist:
                errors.append(f'Inventory item {item_data.get("inventory_item_id")} not found')
            except Exception as e:
                errors.append(str(e))

        serializer = self.get_serializer(created_items, many=True)
        return Response({
            'created': len(created_items),
            'errors': errors,
            'items': serializer.data
        }, status=status.HTTP_201_CREATED if created_items else status.HTTP_400_BAD_REQUEST)
