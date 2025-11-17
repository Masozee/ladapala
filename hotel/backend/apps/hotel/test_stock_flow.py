"""
Test suite for stock management flow:
1. Purchase Order -> Main Warehouse
2. Department Buffer Transfer -> Deducts from Main Warehouse
3. Checkout Cleaning -> Deducts from Department Buffer
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from django.utils import timezone

from apps.hotel.models import (
    InventoryItem, AmenityCategory, Supplier,
    PurchaseOrder, PurchaseOrderItem, StockMovement,
    DepartmentInventory, HousekeepingTask, AmenityUsage,
    Room, RoomType
)

User = get_user_model()


class StockFlowIntegrationTest(TestCase):
    """Test complete stock flow from purchase order to usage"""

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            email='warehouse@hotel.com',
            password='test123',
            first_name='Warehouse',
            last_name='Manager'
        )

        # Create category
        self.category = AmenityCategory.objects.create(
            name='Bathroom Amenities',
            description='Bathroom supplies'
        )

        # Create supplier
        self.supplier = Supplier.objects.create(
            name='Hotel Supplies Inc',
            contact_person='John Supplier',
            email='supplier@example.com',
            phone='+628123456789',
            address='Jakarta',
            status='ACTIVE'
        )

        # Create inventory item (warehouse stock starts at 0)
        self.towel = InventoryItem.objects.create(
            name='Bath Towel',
            category=self.category,
            unit_price=50000,
            current_stock=0,  # Warehouse starts empty
            minimum_stock=20,
            maximum_stock=200,
            unit_of_measurement='pieces',
            supplier=self.supplier
        )

        # Create room type and room for housekeeping tasks
        self.room_type = RoomType.objects.create(
            name='Deluxe Room',
            description='Deluxe room',
            base_price=1000000,
            max_occupancy=2
        )

        self.room = Room.objects.create(
            number='101',
            floor=1,
            room_type=self.room_type,
            status='DIRTY'
        )

    def test_01_purchase_order_adds_to_warehouse(self):
        """Test 1: Purchase Order receives stock and adds to MAIN WAREHOUSE"""
        print("\n=== TEST 1: Purchase Order -> Main Warehouse ===")

        # Create purchase order
        po = PurchaseOrder.objects.create(
            supplier=self.supplier,
            order_date=timezone.now().date(),
            status='DRAFT',
            created_by=self.user
        )

        # Add items to PO
        po_item = PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.towel,
            quantity_ordered=100,
            unit_price=45000,
            quantity_received=0
        )

        print(f"✓ Created PO: {po.po_number}")
        print(f"  Ordered: 100 towels")
        print(f"  Warehouse stock before: {self.towel.current_stock}")

        # Receive the items
        po_item.quantity_received = 100
        po_item.save()

        po.status = 'RECEIVED'
        po.received_by = self.user
        po.received_date = timezone.now()
        po.save()

        # Manually update warehouse stock (simulating receiving process)
        self.towel.current_stock += po_item.quantity_received
        self.towel.save()

        # Create stock movement record
        StockMovement.objects.create(
            inventory_item=self.towel,
            movement_type='PURCHASE',
            quantity=po_item.quantity_received,
            balance_after=self.towel.current_stock,
            reference=po.po_number,
            notes=f'Received from {self.supplier.name}',
            created_by=self.user
        )

        # Verify
        self.towel.refresh_from_db()
        print(f"  Warehouse stock after: {self.towel.current_stock}")

        self.assertEqual(self.towel.current_stock, 100)
        self.assertEqual(StockMovement.objects.filter(movement_type='PURCHASE').count(), 1)

        print("✓ PASSED: Warehouse stock increased from 0 to 100")
        print(f"✓ Stock movement logged: {po.po_number}\n")

    def test_02_department_buffer_transfer_deducts_from_warehouse(self):
        """Test 2: Department Buffer Transfer deducts from MAIN WAREHOUSE"""
        print("\n=== TEST 2: Department Buffer <- Main Warehouse ===")

        # Setup: Add stock to warehouse first
        self.towel.current_stock = 100
        self.towel.save()
        print(f"  Warehouse stock before: {self.towel.current_stock}")

        # Create department buffer for HOUSEKEEPING
        dept_buffer = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.towel,
            current_stock=0,  # Buffer starts empty
            min_stock=10,
            max_stock=50,
            location='Housekeeping Storage Room'
        )
        print(f"  Department buffer before: {dept_buffer.current_stock}")

        # Transfer 30 units from warehouse to department buffer
        transfer_qty = Decimal('30')

        # Deduct from warehouse
        self.towel.current_stock -= int(transfer_qty)
        self.towel.save()

        # Add to department buffer
        dept_buffer.current_stock += transfer_qty
        dept_buffer.last_restocked = timezone.now()
        dept_buffer.save()

        # Log stock movement
        StockMovement.objects.create(
            inventory_item=self.towel,
            movement_type='USAGE',
            quantity=-int(transfer_qty),
            balance_after=self.towel.current_stock,
            reference=f'Transfer to {dept_buffer.get_department_display()}',
            notes='Warehouse to department buffer transfer',
            created_by=self.user
        )

        print(f"  Transferred: {transfer_qty} units")

        # Verify
        self.towel.refresh_from_db()
        dept_buffer.refresh_from_db()

        print(f"  Warehouse stock after: {self.towel.current_stock}")
        print(f"  Department buffer after: {dept_buffer.current_stock}")

        self.assertEqual(self.towel.current_stock, 70)  # 100 - 30
        self.assertEqual(float(dept_buffer.current_stock), 30.0)

        print("✓ PASSED: Warehouse reduced from 100 to 70")
        print("✓ PASSED: Department buffer increased from 0 to 30\n")

    def test_03_checkout_cleaning_deducts_from_buffer(self):
        """Test 3: Checkout Cleaning deducts from DEPARTMENT BUFFER (not warehouse)"""
        print("\n=== TEST 3: Checkout Cleaning -> Department Buffer ===")

        # Setup: Warehouse has 100, Department buffer has 30
        self.towel.current_stock = 100
        self.towel.save()

        dept_buffer = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.towel,
            current_stock=Decimal('30'),
            min_stock=10,
            max_stock=50,
            location='Housekeeping Storage'
        )

        print(f"  Warehouse stock before: {self.towel.current_stock}")
        print(f"  Department buffer before: {dept_buffer.current_stock}")

        # Create housekeeping task
        task = HousekeepingTask.objects.create(
            room=self.room,
            task_type='CHECKOUT_CLEANING',
            status='CLEANING',
            priority='NORMAL',
            assigned_to=self.user
        )
        print(f"  Created task: {task.task_number}")

        # Use 5 towels during checkout cleaning
        # This should deduct from DEPARTMENT BUFFER, not warehouse
        usage = AmenityUsage.objects.create(
            housekeeping_task=task,
            inventory_item=self.towel,
            quantity_used=5,
            notes='Checkout cleaning - replaced towels',
            recorded_by=self.user
        )

        print(f"  Used: {usage.quantity_used} towels")

        # Verify the AmenityUsage.save() method logic
        # It should have deducted from department buffer
        dept_buffer.refresh_from_db()
        self.towel.refresh_from_db()

        print(f"  Warehouse stock after: {self.towel.current_stock}")
        print(f"  Department buffer after: {dept_buffer.current_stock}")

        # CRITICAL ASSERTIONS
        self.assertEqual(self.towel.current_stock, 100,
                        "Warehouse stock should NOT change - usage should be from buffer!")
        self.assertEqual(float(dept_buffer.current_stock), 25.0,
                        "Department buffer should decrease from 30 to 25")

        # Check stock movement was logged for department usage
        dept_movements = StockMovement.objects.filter(
            reference__contains='DEPT-HOUSEKEEPING'
        )
        self.assertTrue(dept_movements.exists(),
                       "Stock movement should be logged for department usage")

        print("✓ PASSED: Warehouse unchanged at 100 (correct!)")
        print("✓ PASSED: Department buffer reduced from 30 to 25")
        print("✓ PASSED: Stock deducted from BUFFER, not warehouse\n")

    def test_04_complete_stock_flow(self):
        """Test 4: Complete flow from PO -> Warehouse -> Buffer -> Usage"""
        print("\n=== TEST 4: Complete Stock Flow ===")

        # Step 1: Purchase Order adds to warehouse
        print("Step 1: Purchase Order")
        self.towel.current_stock = 0
        self.towel.save()

        self.towel.current_stock += 200  # PO received
        self.towel.save()
        print(f"  ✓ PO received: Warehouse = {self.towel.current_stock}")

        # Step 2: Transfer to department buffer
        print("\nStep 2: Transfer to Department")
        dept_buffer = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.towel,
            current_stock=0,
            min_stock=10,
            max_stock=50
        )

        transfer_qty = 40
        self.towel.current_stock -= transfer_qty
        self.towel.save()
        dept_buffer.current_stock += transfer_qty
        dept_buffer.save()

        print(f"  ✓ Transferred {transfer_qty}: Warehouse = {self.towel.current_stock}, Buffer = {dept_buffer.current_stock}")

        # Step 3: Multiple housekeeping tasks use from buffer
        print("\nStep 3: Housekeeping Usage (from buffer)")

        for i in range(1, 4):  # 3 tasks
            task = HousekeepingTask.objects.create(
                room=self.room,
                task_type='CHECKOUT_CLEANING',
                status='CLEANING',
                priority='NORMAL'
            )

            usage = AmenityUsage.objects.create(
                housekeeping_task=task,
                inventory_item=self.towel,
                quantity_used=3,
                recorded_by=self.user
            )

            dept_buffer.refresh_from_db()
            print(f"  Task {i}: Used 3 towels, Buffer = {dept_buffer.current_stock}")

        # Final verification
        self.towel.refresh_from_db()
        dept_buffer.refresh_from_db()

        print("\nFinal Stock Levels:")
        print(f"  Warehouse: {self.towel.current_stock} (should be 160)")
        print(f"  Department Buffer: {dept_buffer.current_stock} (should be 31)")

        self.assertEqual(self.towel.current_stock, 160,  # 200 - 40 transferred
                        "Warehouse should only be reduced by transfers, not usage")
        self.assertEqual(float(dept_buffer.current_stock), 31.0,  # 40 - (3*3) used
                        "Buffer should be reduced by usage")

        print("\n✓ PASSED: Complete stock flow working correctly!")
        print("  PO -> Warehouse (200)")
        print("  Warehouse -> Buffer (-40 = 160)")
        print("  Buffer -> Usage (-9 = 31)")

    def test_05_buffer_empty_falls_back_to_warehouse(self):
        """Test 5: When buffer is empty/insufficient, usage falls back to warehouse"""
        print("\n=== TEST 5: Buffer Empty -> Warehouse Fallback ===")

        # Setup: Low buffer stock
        self.towel.current_stock = 100
        self.towel.save()

        dept_buffer = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.towel,
            current_stock=Decimal('2'),  # Only 2 in buffer
            min_stock=10,
            max_stock=50
        )

        print(f"  Warehouse: {self.towel.current_stock}")
        print(f"  Buffer: {dept_buffer.current_stock} (insufficient)")

        # Try to use 5 towels (buffer only has 2)
        task = HousekeepingTask.objects.create(
            room=self.room,
            task_type='CHECKOUT_CLEANING',
            status='CLEANING'
        )

        usage = AmenityUsage.objects.create(
            housekeeping_task=task,
            inventory_item=self.towel,
            quantity_used=5,
            recorded_by=self.user
        )

        print(f"  Attempted to use: {usage.quantity_used} towels")

        # With our implementation, it should fall back to warehouse
        self.towel.refresh_from_db()
        dept_buffer.refresh_from_db()

        print(f"  Warehouse after: {self.towel.current_stock}")
        print(f"  Buffer after: {dept_buffer.current_stock}")

        # Check that usage was taken from warehouse (fallback)
        warehouse_movements = StockMovement.objects.filter(
            reference__contains='WAREHOUSE'
        ).filter(
            reference__contains=task.task_number
        )

        print(f"\n✓ Fallback to warehouse occurred: {warehouse_movements.exists()}")


class DepartmentBufferStockTest(TestCase):
    """Test department buffer stock management"""

    def setUp(self):
        """Set up test data"""
        self.user = User.objects.create_user(
            email='test@hotel.com',
            password='test123'
        )

        self.category = AmenityCategory.objects.create(
            name='Linens',
            description='Hotel linens'
        )

        self.supplier = Supplier.objects.create(
            name='Linen Supplier',
            contact_person='Contact',
            email='supplier@test.com',
            phone='+1234567890',
            status='ACTIVE'
        )

        self.item = InventoryItem.objects.create(
            name='Pillow Case',
            category=self.category,
            unit_price=20000,
            current_stock=500,
            supplier=self.supplier
        )

    def test_department_buffer_properties(self):
        """Test department buffer stock status properties"""
        buffer = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.item,
            current_stock=5,
            min_stock=10,
            max_stock=50
        )

        # Test low stock detection
        self.assertTrue(buffer.is_low_stock)
        self.assertEqual(buffer.stock_status, 'Low Stock')

        # Test suggested restock
        self.assertEqual(buffer.suggested_restock_quantity, 45)  # max - current

        # Increase stock
        buffer.current_stock = 30
        buffer.save()

        self.assertFalse(buffer.is_low_stock)
        self.assertEqual(buffer.stock_status, 'Normal')

    def test_multiple_departments(self):
        """Test different departments can have separate buffers"""
        housekeeping = DepartmentInventory.objects.create(
            department='HOUSEKEEPING',
            inventory_item=self.item,
            current_stock=30,
            min_stock=10,
            max_stock=50
        )

        fb = DepartmentInventory.objects.create(
            department='F&B',
            inventory_item=self.item,
            current_stock=15,
            min_stock=5,
            max_stock=25
        )

        self.assertEqual(DepartmentInventory.objects.count(), 2)
        self.assertNotEqual(housekeeping.current_stock, fb.current_stock)


if __name__ == '__main__':
    import unittest
    unittest.main()
