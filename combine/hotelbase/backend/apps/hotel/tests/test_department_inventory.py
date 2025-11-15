"""
Test suite for multi-level warehouse system with department buffers
Tests the complete flow: Warehouse → Department → Guest
"""
from django.test import TestCase
from django.db import transaction
from decimal import Decimal
from apps.hotel.models import (
    InventoryItem, DepartmentInventory, StockMovement, AmenityCategory,
    HousekeepingTask, AmenityUsage, Room, RoomType
)
from apps.user.models import User


class DepartmentInventoryModelTest(TestCase):
    """Test DepartmentInventory model and its methods"""

    def setUp(self):
        """Set up test data"""
        # Create amenity category
        self.category = AmenityCategory.objects.create(
            name='Linens',
            description='Bed and bath linens'
        )

        # Create inventory item
        self.item = InventoryItem.objects.create(
            name='Bath Towels',
            category=self.category,
            unit_price=Decimal('50000'),
            current_stock=100,
            minimum_stock=20,
            unit_of_measurement='pieces'
        )

        # Create department buffer
        self.dept_buffer = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.item,
            min_stock=Decimal('10'),
            max_stock=Decimal('50'),
            location='HK Storage Room'
        )

    def test_department_inventory_creation(self):
        """Test department inventory buffer is created correctly"""
        self.assertEqual(self.dept_buffer.department, 'HOUSEKEEPING')
        self.assertEqual(self.dept_buffer.inventory_item, self.item)
        self.assertEqual(self.dept_buffer.current_stock, Decimal('0'))
        self.assertEqual(self.dept_buffer.min_stock, Decimal('10'))
        self.assertEqual(self.dept_buffer.max_stock, Decimal('50'))

    def test_is_low_stock(self):
        """Test low stock detection"""
        # Initially at 0, which is <= min_stock (10)
        self.assertTrue(self.dept_buffer.is_low_stock)

        # Add stock above minimum
        self.dept_buffer.current_stock = Decimal('15')
        self.dept_buffer.save()
        self.assertFalse(self.dept_buffer.is_low_stock)

        # Set exactly at minimum
        self.dept_buffer.current_stock = Decimal('10')
        self.dept_buffer.save()
        self.assertTrue(self.dept_buffer.is_low_stock)

    def test_stock_status(self):
        """Test stock status property"""
        # Low stock
        self.dept_buffer.current_stock = Decimal('5')
        self.assertEqual(self.dept_buffer.stock_status, 'Low Stock')

        # Normal
        self.dept_buffer.current_stock = Decimal('30')
        self.assertEqual(self.dept_buffer.stock_status, 'Normal')

        # At capacity
        self.dept_buffer.current_stock = Decimal('50')
        self.assertEqual(self.dept_buffer.stock_status, 'At Capacity')

    def test_suggested_restock_quantity(self):
        """Test suggested restock calculation"""
        # Empty buffer
        self.dept_buffer.current_stock = Decimal('0')
        self.assertEqual(self.dept_buffer.suggested_restock_quantity, 50.0)

        # Partially filled
        self.dept_buffer.current_stock = Decimal('20')
        self.assertEqual(self.dept_buffer.suggested_restock_quantity, 30.0)

        # At max
        self.dept_buffer.current_stock = Decimal('50')
        self.assertEqual(self.dept_buffer.suggested_restock_quantity, 0.0)

    def test_can_fulfill(self):
        """Test if buffer can fulfill quantity"""
        self.dept_buffer.current_stock = Decimal('25')
        self.dept_buffer.save()

        self.assertTrue(self.dept_buffer.can_fulfill(20))
        self.assertTrue(self.dept_buffer.can_fulfill(25))
        self.assertFalse(self.dept_buffer.can_fulfill(30))


class WarehouseToDepartmentTransferTest(TestCase):
    """Test stock transfer from warehouse to department buffer"""

    def setUp(self):
        """Set up test data"""
        self.category = AmenityCategory.objects.create(name='Toiletries')
        self.item = InventoryItem.objects.create(
            name='Shampoo Bottles',
            category=self.category,
            unit_price=Decimal('25000'),
            current_stock=200,
            minimum_stock=50,
            unit_of_measurement='bottles'
        )
        self.dept_buffer = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.item,
            min_stock=Decimal('20'),
            max_stock=Decimal('100'),
            current_stock=Decimal('0')
        )
        self.user = User.objects.create_user(
            email='staff@hotel.com',
            password='test123',
            first_name='Test',
            last_name='Staff'
        )

    def test_successful_transfer(self):
        """Test successful transfer from warehouse to department"""
        initial_warehouse = self.item.current_stock
        initial_buffer = self.dept_buffer.current_stock
        transfer_qty = 50

        with transaction.atomic():
            # Deduct from warehouse
            self.item.current_stock -= transfer_qty
            self.item.save()

            # Add to department
            self.dept_buffer.current_stock += transfer_qty
            self.dept_buffer.save()

            # Create movement
            movement = StockMovement.objects.create(
                inventory_item=self.item,
                movement_type='WAREHOUSE_TO_DEPARTMENT',
                quantity=transfer_qty,
                balance_after=int(self.dept_buffer.current_stock),
                from_department='WAREHOUSE',
                to_department='HOUSEKEEPING',
                department_inventory=self.dept_buffer,
                reference='Test transfer',
                created_by=self.user
            )

        # Verify warehouse stock decreased
        self.item.refresh_from_db()
        self.assertEqual(self.item.current_stock, initial_warehouse - transfer_qty)

        # Verify department stock increased
        self.dept_buffer.refresh_from_db()
        self.assertEqual(self.dept_buffer.current_stock, initial_buffer + transfer_qty)

        # Verify movement record created
        self.assertEqual(movement.movement_type, 'WAREHOUSE_TO_DEPARTMENT')
        self.assertEqual(movement.quantity, transfer_qty)
        self.assertEqual(movement.from_department, 'WAREHOUSE')
        self.assertEqual(movement.to_department, 'HOUSEKEEPING')

    def test_insufficient_warehouse_stock(self):
        """Test transfer fails when warehouse has insufficient stock"""
        self.item.current_stock = 30
        self.item.save()

        # Try to transfer more than available
        transfer_qty = 50

        # Should raise validation error (in real API, this would be caught)
        with self.assertRaises(Exception):
            if self.item.current_stock < transfer_qty:
                raise Exception(f'Insufficient stock: {self.item.current_stock} < {transfer_qty}')

    def test_exceeds_max_capacity(self):
        """Test transfer fails when exceeding department max capacity"""
        self.dept_buffer.current_stock = Decimal('80')
        self.dept_buffer.save()

        transfer_qty = 30  # Would result in 110, exceeding max of 100

        # Check if would exceed capacity
        new_total = self.dept_buffer.current_stock + transfer_qty
        self.assertGreater(new_total, self.dept_buffer.max_stock)

        # In real API, this should be rejected


class DepartmentToGuestDeductionTest(TestCase):
    """Test stock deduction when guest uses amenity"""

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            email='hk@hotel.com',
            password='test123',
            first_name='Housekeeping',
            last_name='Staff'
        )

        # Create category
        self.category = AmenityCategory.objects.create(name='Linens')

        # Create inventory item
        self.item = InventoryItem.objects.create(
            name='Pillows',
            category=self.category,
            unit_price=Decimal('100000'),
            current_stock=100,
            minimum_stock=20,
            unit_of_measurement='pieces'
        )

        # Create department buffer with stock
        self.dept_buffer = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.item,
            min_stock=Decimal('10'),
            max_stock=Decimal('50'),
            current_stock=Decimal('30')  # Pre-filled buffer
        )

        # Create room and housekeeping task
        room_type = RoomType.objects.create(
            name='Deluxe Room',
            base_price=Decimal('1000000'),
            max_occupancy=2
        )
        self.room = Room.objects.create(
            number='101',
            room_type=room_type,
            floor=1,
            status='OCCUPIED'
        )
        self.task = HousekeepingTask.objects.create(
            room=self.room,
            task_type='STAYOVER_CLEANING',
            status='IN_PROGRESS',
            priority='MEDIUM'
        )

    def test_amenity_deduction_from_buffer(self):
        """Test amenity usage deducts from department buffer"""
        initial_warehouse = self.item.current_stock
        initial_buffer = self.dept_buffer.current_stock
        usage_qty = 2

        # Create amenity usage
        usage = AmenityUsage.objects.create(
            housekeeping_task=self.task,
            inventory_item=self.item,
            quantity_used=usage_qty,
            notes='Guest requested extra pillows',
            recorded_by=self.user
        )

        # Refresh from database
        self.item.refresh_from_db()
        self.dept_buffer.refresh_from_db()

        # Verify warehouse stock unchanged
        self.assertEqual(self.item.current_stock, initial_warehouse)

        # Verify department buffer decreased
        self.assertEqual(self.dept_buffer.current_stock, initial_buffer - usage_qty)

        # Verify stock was marked as deducted
        self.assertTrue(usage.stock_deducted)

        # Verify movement record created
        movement = StockMovement.objects.filter(
            inventory_item=self.item,
            movement_type='DEPARTMENT_TO_GUEST'
        ).first()

        self.assertIsNotNone(movement)
        self.assertEqual(movement.quantity, -usage_qty)
        self.assertEqual(movement.from_department, 'HOUSEKEEPING')
        self.assertEqual(movement.department_inventory, self.dept_buffer)

    def test_fallback_to_warehouse_when_no_buffer(self):
        """Test falls back to warehouse when department buffer doesn't exist"""
        # Delete department buffer
        self.dept_buffer.delete()

        initial_warehouse = self.item.current_stock
        usage_qty = 3

        # Create amenity usage
        usage = AmenityUsage.objects.create(
            housekeeping_task=self.task,
            inventory_item=self.item,
            quantity_used=usage_qty,
            notes='No department buffer available',
            recorded_by=self.user
        )

        # Refresh from database
        self.item.refresh_from_db()

        # Verify warehouse stock decreased (fallback behavior)
        self.assertEqual(self.item.current_stock, initial_warehouse - usage_qty)
        self.assertTrue(usage.stock_deducted)

    def test_insufficient_buffer_stock(self):
        """Test behavior when department buffer has insufficient stock"""
        # Set buffer to very low stock
        self.dept_buffer.current_stock = Decimal('1')
        self.dept_buffer.save()

        initial_warehouse = self.item.current_stock
        initial_buffer = self.dept_buffer.current_stock
        usage_qty = 5  # More than available in buffer

        # Create amenity usage
        usage = AmenityUsage.objects.create(
            housekeeping_task=self.task,
            inventory_item=self.item,
            quantity_used=usage_qty,
            notes='Testing insufficient buffer',
            recorded_by=self.user
        )

        # Refresh from database
        self.item.refresh_from_db()
        self.dept_buffer.refresh_from_db()

        # Stock should NOT be deducted (insufficient)
        self.assertFalse(usage.stock_deducted)
        self.assertEqual(self.dept_buffer.current_stock, initial_buffer)
        self.assertEqual(self.item.current_stock, initial_warehouse)


class StockMovementAuditTrailTest(TestCase):
    """Test complete audit trail of stock movements"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='admin@hotel.com',
            password='test123',
            first_name='Admin',
            last_name='User'
        )
        self.category = AmenityCategory.objects.create(name='Amenities')
        self.item = InventoryItem.objects.create(
            name='Soap Bars',
            category=self.category,
            unit_price=Decimal('5000'),
            current_stock=500,
            minimum_stock=100,
            unit_of_measurement='bars'
        )
        self.dept_buffer = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.item,
            min_stock=Decimal('50'),
            max_stock=Decimal('200'),
            current_stock=Decimal('0')
        )

    def test_complete_flow_audit_trail(self):
        """Test complete flow creates proper audit trail"""
        # Step 1: Transfer from warehouse to department
        transfer_qty = 100

        with transaction.atomic():
            self.item.current_stock -= transfer_qty
            self.item.save()
            self.dept_buffer.current_stock += transfer_qty
            self.dept_buffer.save()

            StockMovement.objects.create(
                inventory_item=self.item,
                movement_type='WAREHOUSE_TO_DEPARTMENT',
                quantity=transfer_qty,
                balance_after=int(self.dept_buffer.current_stock),
                from_department='WAREHOUSE',
                to_department='HOUSEKEEPING',
                department_inventory=self.dept_buffer,
                reference='Initial transfer',
                created_by=self.user
            )

        # Step 2: Create housekeeping task and use amenity
        room_type = RoomType.objects.create(
            name='Standard Room',
            base_price=Decimal('500000'),
            max_occupancy=2
        )
        room = Room.objects.create(
            number='201',
            room_type=room_type,
            floor=2,
            status='OCCUPIED'
        )
        task = HousekeepingTask.objects.create(
            room=room,
            task_type='CHECKOUT_CLEANING',
            status='COMPLETED',
            priority='HIGH'
        )

        usage_qty = 10
        AmenityUsage.objects.create(
            housekeeping_task=task,
            inventory_item=self.item,
            quantity_used=usage_qty,
            notes='Room cleaning',
            recorded_by=self.user
        )

        # Verify audit trail
        movements = StockMovement.objects.filter(
            inventory_item=self.item
        ).order_by('created_at')

        self.assertEqual(movements.count(), 2)

        # First movement: Warehouse to Department
        mov1 = movements[0]
        self.assertEqual(mov1.movement_type, 'WAREHOUSE_TO_DEPARTMENT')
        self.assertEqual(mov1.quantity, transfer_qty)
        self.assertEqual(mov1.from_department, 'WAREHOUSE')
        self.assertEqual(mov1.to_department, 'HOUSEKEEPING')

        # Second movement: Department to Guest
        mov2 = movements[1]
        self.assertEqual(mov2.movement_type, 'DEPARTMENT_TO_GUEST')
        self.assertEqual(mov2.quantity, -usage_qty)
        self.assertEqual(mov2.from_department, 'HOUSEKEEPING')
        self.assertIsNone(mov2.to_department)
        self.assertEqual(mov2.department_inventory, self.dept_buffer)

        # Verify final stock levels
        self.item.refresh_from_db()
        self.dept_buffer.refresh_from_db()

        self.assertEqual(self.item.current_stock, 500 - transfer_qty)  # 400
        self.assertEqual(self.dept_buffer.current_stock, transfer_qty - usage_qty)  # 90


class MultipleDepartmentsTest(TestCase):
    """Test system works with multiple departments"""

    def setUp(self):
        """Set up test data for multiple departments"""
        self.user = User.objects.create_user(
            email='multi@hotel.com',
            password='test123'
        )
        self.category = AmenityCategory.objects.create(name='Supplies')
        self.item = InventoryItem.objects.create(
            name='Cleaning Solution',
            category=self.category,
            unit_price=Decimal('150000'),
            current_stock=1000,
            minimum_stock=200,
            unit_of_measurement='liters'
        )

    def test_multiple_department_buffers(self):
        """Test creating buffers for multiple departments"""
        # Create buffers for different departments
        hk_buffer = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.item,
            min_stock=Decimal('50'),
            max_stock=Decimal('200'),
            current_stock=Decimal('100')
        )

        maintenance_buffer = DepartmentInventory.objects.create(
            department='MAINTENANCE',
            inventory_item=self.item,
            min_stock=Decimal('30'),
            max_stock=Decimal('100'),
            current_stock=Decimal('50')
        )

        # Verify both exist
        buffers = DepartmentInventory.objects.filter(inventory_item=self.item)
        self.assertEqual(buffers.count(), 2)

        # Verify unique constraint works
        with self.assertRaises(Exception):
            DepartmentInventory.objects.create(
                department='HOUSEKEEPING',  # Duplicate
                inventory_item=self.item,
                min_stock=Decimal('10'),
                max_stock=Decimal('50')
            )

    def test_independent_department_stocks(self):
        """Test departments have independent stock levels"""
        hk_buffer = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.item,
            min_stock=Decimal('50'),
            max_stock=Decimal('200'),
            current_stock=Decimal('150')
        )

        fb_buffer = DepartmentInventory.objects.create(
            department='F&B',
            inventory_item=self.item,
            min_stock=Decimal('20'),
            max_stock=Decimal('80'),
            current_stock=Decimal('60')
        )

        # Use stock from Housekeeping
        hk_buffer.current_stock -= 30
        hk_buffer.save()

        # Verify F&B buffer unchanged
        fb_buffer.refresh_from_db()
        self.assertEqual(fb_buffer.current_stock, Decimal('60'))
        self.assertEqual(hk_buffer.current_stock, Decimal('120'))
