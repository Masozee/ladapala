"""
Test moving average pricing and unit conversions
Tests the complete flow: PO → Warehouse → Transfer to Kitchen
"""
from django.test import TestCase
from decimal import Decimal
from apps.restaurant.models import (
    Branch, Restaurant, Inventory, PurchaseOrder, PurchaseOrderItem,
    Staff, InventoryTransaction
)
from apps.user.models import User


class MovingAveragePricingTest(TestCase):
    """Test moving average cost calculation from Purchase Orders"""

    def setUp(self):
        """Set up test data"""
        # Create restaurant and branch
        self.restaurant = Restaurant.objects.create(name="Test Restaurant")
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Test Branch"
        )

        # Create user and staff
        self.user = User.objects.create_user(
            email="test@example.com",
            password="testpass123"
        )
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role='ADMIN'
        )

        # Create inventory items - Garlic in both warehouse and kitchen
        # Warehouse: in KG, Kitchen: in GRAM
        # Note: Creating warehouse item will auto-create kitchen item via signal
        self.warehouse_garlic = Inventory.objects.create(
            branch=self.branch,
            name="Bawang Putih",
            description="Garlic",
            unit="kg",
            quantity=Decimal('0'),
            min_quantity=Decimal('5'),
            cost_per_unit=Decimal('0'),
            location='WAREHOUSE'
        )

        # Get the auto-created kitchen item and update its unit to gram
        self.kitchen_garlic = Inventory.objects.get(
            branch=self.branch,
            name="Bawang Putih",
            location='KITCHEN'
        )
        # Update to use gram instead of kg
        self.kitchen_garlic.unit = 'gram'
        self.kitchen_garlic.min_quantity = Decimal('500')
        self.kitchen_garlic.save()

    def test_01_initial_state(self):
        """Test: Initial inventory should be empty with zero cost"""
        print("\n=== TEST 1: Initial State ===")
        print(f"Warehouse: {self.warehouse_garlic.quantity} {self.warehouse_garlic.unit}")
        print(f"Warehouse Cost: Rp {self.warehouse_garlic.cost_per_unit}")
        print(f"Kitchen: {self.kitchen_garlic.quantity} {self.kitchen_garlic.unit}")
        print(f"Kitchen Cost: Rp {self.kitchen_garlic.cost_per_unit}")

        self.assertEqual(self.warehouse_garlic.quantity, Decimal('0'))
        self.assertEqual(self.warehouse_garlic.cost_per_unit, Decimal('0'))
        self.assertEqual(self.kitchen_garlic.quantity, Decimal('0'))
        self.assertEqual(self.kitchen_garlic.cost_per_unit, Decimal('0'))

    def test_02_first_purchase_order(self):
        """Test: First PO should set initial cost"""
        print("\n=== TEST 2: First Purchase Order ===")

        # Create PO: Buy 10 kg of garlic at Rp 45,000/kg
        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name="Garlic Supplier A",
            created_by=self.staff,
            status='DRAFT'
        )

        po_item = PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.warehouse_garlic,
            quantity=Decimal('10'),  # 10 kg
            unit_price=Decimal('45000')  # Rp 45,000/kg
        )

        print(f"Created PO: {po.po_number}")
        print(f"Ordered: {po_item.quantity} {self.warehouse_garlic.unit} @ Rp {po_item.unit_price}/{self.warehouse_garlic.unit}")

        # Mark as RECEIVED - this should trigger cost update
        po.status = 'RECEIVED'
        po.save()

        # Refresh from database
        self.warehouse_garlic.refresh_from_db()

        print(f"\nAfter receiving PO:")
        print(f"Warehouse Quantity: {self.warehouse_garlic.quantity} {self.warehouse_garlic.unit}")
        print(f"Warehouse Cost: Rp {self.warehouse_garlic.cost_per_unit}/{self.warehouse_garlic.unit}")

        # Assertions
        self.assertEqual(self.warehouse_garlic.quantity, Decimal('10'))
        self.assertEqual(self.warehouse_garlic.cost_per_unit, Decimal('45000'))

    def test_03_second_purchase_order_moving_average(self):
        """Test: Second PO with different price should calculate moving average"""
        print("\n=== TEST 3: Second PO - Moving Average ===")

        # First PO: 10 kg @ Rp 45,000/kg
        po1 = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name="Supplier A",
            created_by=self.staff,
            status='DRAFT'
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po1,
            inventory_item=self.warehouse_garlic,
            quantity=Decimal('10'),
            unit_price=Decimal('45000')
        )
        po1.status = 'RECEIVED'
        po1.save()

        self.warehouse_garlic.refresh_from_db()
        print(f"After PO1: {self.warehouse_garlic.quantity} kg @ Rp {self.warehouse_garlic.cost_per_unit}/kg")

        # Second PO: 5 kg @ Rp 48,000/kg (higher price)
        po2 = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name="Supplier B",
            created_by=self.staff,
            status='DRAFT'
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po2,
            inventory_item=self.warehouse_garlic,
            quantity=Decimal('5'),
            unit_price=Decimal('48000')
        )
        po2.status = 'RECEIVED'
        po2.save()

        self.warehouse_garlic.refresh_from_db()
        print(f"After PO2: {self.warehouse_garlic.quantity} kg @ Rp {self.warehouse_garlic.cost_per_unit}/kg")

        # Calculate expected moving average
        # (10 kg × Rp 45,000 + 5 kg × Rp 48,000) / 15 kg = Rp 46,000
        expected_avg = ((Decimal('10') * Decimal('45000')) + (Decimal('5') * Decimal('48000'))) / Decimal('15')
        print(f"\nExpected moving average: Rp {expected_avg}/kg")
        print(f"Actual cost: Rp {self.warehouse_garlic.cost_per_unit}/kg")

        self.assertEqual(self.warehouse_garlic.quantity, Decimal('15'))
        self.assertEqual(self.warehouse_garlic.cost_per_unit, expected_avg)

    def test_04_transfer_warehouse_to_kitchen_with_conversion(self):
        """
        Test: Transfer from warehouse (kg) to kitchen (gram)
        Should convert BOTH quantity AND price per unit
        """
        print("\n=== TEST 4: Transfer with Unit Conversion ===")

        # Setup: Receive PO to warehouse
        po = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name="Supplier",
            created_by=self.staff,
            status='DRAFT'
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po,
            inventory_item=self.warehouse_garlic,
            quantity=Decimal('10'),  # 10 kg
            unit_price=Decimal('45000')  # Rp 45,000/kg
        )
        po.status = 'RECEIVED'
        po.save()

        self.warehouse_garlic.refresh_from_db()
        print(f"\nWarehouse before transfer:")
        print(f"  Quantity: {self.warehouse_garlic.quantity} {self.warehouse_garlic.unit}")
        print(f"  Cost: Rp {self.warehouse_garlic.cost_per_unit}/{self.warehouse_garlic.unit}")
        print(f"  Total value: Rp {self.warehouse_garlic.quantity * self.warehouse_garlic.cost_per_unit:,.2f}")

        # Transfer 3 kg from warehouse to kitchen
        transfer_qty_kg = Decimal('3')
        transfer_qty_gram = transfer_qty_kg * 1000  # 3 kg = 3,000 grams

        # Cost conversion: Rp 45,000/kg = Rp 45/gram
        cost_per_kg = self.warehouse_garlic.cost_per_unit
        cost_per_gram = cost_per_kg / 1000

        print(f"\nTransferring {transfer_qty_kg} kg from warehouse to kitchen")
        print(f"  = {transfer_qty_gram} grams to kitchen")
        print(f"  Cost conversion: Rp {cost_per_kg}/kg = Rp {cost_per_gram}/gram")

        # Create transfer transactions
        # OUT from warehouse
        InventoryTransaction.objects.create(
            inventory=self.warehouse_garlic,
            transaction_type='TRANSFER',
            quantity=-transfer_qty_kg,  # Negative for OUT
            unit_cost=cost_per_kg,
            notes='Transfer to kitchen'
        )

        # Update warehouse
        self.warehouse_garlic.quantity -= transfer_qty_kg
        self.warehouse_garlic.save()

        # IN to kitchen with converted units
        # Kitchen uses moving average for cost updates
        self.kitchen_garlic.update_cost_moving_average(
            new_quantity=transfer_qty_gram,
            new_unit_cost=cost_per_gram
        )
        self.kitchen_garlic.quantity += transfer_qty_gram
        self.kitchen_garlic.save()

        # Create transfer transaction for kitchen
        InventoryTransaction.objects.create(
            inventory=self.kitchen_garlic,
            transaction_type='TRANSFER',
            quantity=transfer_qty_gram,
            unit_cost=cost_per_gram,
            notes='Transfer from warehouse'
        )

        # Refresh from database
        self.warehouse_garlic.refresh_from_db()
        self.kitchen_garlic.refresh_from_db()

        print(f"\nWarehouse after transfer:")
        print(f"  Quantity: {self.warehouse_garlic.quantity} {self.warehouse_garlic.unit}")
        print(f"  Cost: Rp {self.warehouse_garlic.cost_per_unit}/{self.warehouse_garlic.unit}")
        print(f"  Total value: Rp {self.warehouse_garlic.quantity * self.warehouse_garlic.cost_per_unit:,.2f}")

        print(f"\nKitchen after transfer:")
        print(f"  Quantity: {self.kitchen_garlic.quantity} {self.kitchen_garlic.unit}")
        print(f"  Cost: Rp {self.kitchen_garlic.cost_per_unit}/{self.kitchen_garlic.unit}")
        print(f"  Total value: Rp {self.kitchen_garlic.quantity * self.kitchen_garlic.cost_per_unit:,.2f}")

        # Assertions
        self.assertEqual(self.warehouse_garlic.quantity, Decimal('7'))  # 10 - 3 = 7 kg
        self.assertEqual(self.warehouse_garlic.cost_per_unit, Decimal('45000'))  # Still Rp 45,000/kg

        self.assertEqual(self.kitchen_garlic.quantity, Decimal('3000'))  # 3,000 grams
        self.assertEqual(self.kitchen_garlic.cost_per_unit, Decimal('45'))  # Rp 45/gram

        # Verify total value consistency
        # Warehouse: 7 kg × Rp 45,000 = Rp 315,000
        # Kitchen: 3,000 gram × Rp 45 = Rp 135,000
        # Total: Rp 450,000 (same as initial 10 kg × Rp 45,000)
        warehouse_value = self.warehouse_garlic.quantity * self.warehouse_garlic.cost_per_unit
        kitchen_value = self.kitchen_garlic.quantity * self.kitchen_garlic.cost_per_unit
        total_value = warehouse_value + kitchen_value
        expected_total = Decimal('10') * Decimal('45000')

        print(f"\nValue verification:")
        print(f"  Warehouse value: Rp {warehouse_value:,.2f}")
        print(f"  Kitchen value: Rp {kitchen_value:,.2f}")
        print(f"  Total value: Rp {total_value:,.2f}")
        print(f"  Expected total: Rp {expected_total:,.2f}")

        self.assertEqual(total_value, expected_total)
        print("\n✓ Total value preserved after transfer with unit conversion!")

    def test_05_multiple_transfers_moving_average_in_kitchen(self):
        """
        Test: Multiple transfers to kitchen should update moving average in kitchen
        """
        print("\n=== TEST 5: Multiple Transfers - Kitchen Moving Average ===")

        # First PO: 10 kg @ Rp 45,000/kg
        po1 = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name="Supplier A",
            created_by=self.staff,
            status='DRAFT'
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po1,
            inventory_item=self.warehouse_garlic,
            quantity=Decimal('10'),
            unit_price=Decimal('45000')
        )
        po1.status = 'RECEIVED'
        po1.save()

        self.warehouse_garlic.refresh_from_db()

        # First transfer: 2 kg to kitchen
        transfer1_kg = Decimal('2')
        transfer1_gram = transfer1_kg * 1000
        cost_per_gram_1 = self.warehouse_garlic.cost_per_unit / 1000

        self.kitchen_garlic.update_cost_moving_average(transfer1_gram, cost_per_gram_1)
        self.kitchen_garlic.quantity += transfer1_gram
        self.kitchen_garlic.save()

        self.warehouse_garlic.quantity -= transfer1_kg
        self.warehouse_garlic.save()

        self.kitchen_garlic.refresh_from_db()
        print(f"After 1st transfer:")
        print(f"  Kitchen: {self.kitchen_garlic.quantity} gram @ Rp {self.kitchen_garlic.cost_per_unit}/gram")

        # Second PO with different price: 5 kg @ Rp 48,000/kg
        po2 = PurchaseOrder.objects.create(
            branch=self.branch,
            supplier_name="Supplier B",
            created_by=self.staff,
            status='DRAFT'
        )
        PurchaseOrderItem.objects.create(
            purchase_order=po2,
            inventory_item=self.warehouse_garlic,
            quantity=Decimal('5'),
            unit_price=Decimal('48000')
        )
        po2.status = 'RECEIVED'
        po2.save()

        self.warehouse_garlic.refresh_from_db()
        print(f"After 2nd PO:")
        print(f"  Warehouse: {self.warehouse_garlic.quantity} kg @ Rp {self.warehouse_garlic.cost_per_unit}/kg")

        # Second transfer: 3 kg to kitchen (at new average warehouse cost)
        transfer2_kg = Decimal('3')
        transfer2_gram = transfer2_kg * 1000
        cost_per_gram_2 = self.warehouse_garlic.cost_per_unit / 1000

        self.kitchen_garlic.update_cost_moving_average(transfer2_gram, cost_per_gram_2)
        self.kitchen_garlic.quantity += transfer2_gram
        self.kitchen_garlic.save()

        self.warehouse_garlic.quantity -= transfer2_kg
        self.warehouse_garlic.save()

        self.kitchen_garlic.refresh_from_db()
        print(f"After 2nd transfer:")
        print(f"  Kitchen: {self.kitchen_garlic.quantity} gram @ Rp {self.kitchen_garlic.cost_per_unit}/gram")

        # Calculate expected kitchen moving average
        # Transfer 1: 2,000 gram @ Rp 45/gram (from first PO)
        # Transfer 2: 3,000 gram @ warehouse cost after PO2 / 1000
        # First need to calculate warehouse moving average after PO2:
        # PO1: 10 kg @ 45,000 + PO2: 5 kg @ 48,000 = (450,000 + 240,000) / 15 kg = 46,000/kg
        # But warehouse already used 2 kg, so: (8 kg × 45,000 + 5 kg × 48,000) / 13 kg = 46,153.85/kg
        warehouse_avg_after_po2 = ((Decimal('8') * Decimal('45000')) + (Decimal('5') * Decimal('48000'))) / Decimal('13')
        cost_per_gram_2 = warehouse_avg_after_po2 / 1000

        # Kitchen avg = (2,000 × 45 + 3,000 × 46.15385) / 5,000
        expected_kitchen_avg = ((Decimal('2000') * Decimal('45')) + (Decimal('3000') * cost_per_gram_2)) / Decimal('5000')
        # Round to 2 decimal places to match database field precision
        expected_kitchen_avg = expected_kitchen_avg.quantize(Decimal('0.01'))

        print(f"\nExpected kitchen average: Rp {expected_kitchen_avg}/gram")
        print(f"Actual kitchen cost: Rp {self.kitchen_garlic.cost_per_unit}/gram")

        self.assertEqual(self.kitchen_garlic.quantity, Decimal('5000'))  # 2,000 + 3,000
        self.assertEqual(self.kitchen_garlic.cost_per_unit, expected_kitchen_avg)

        print("\n✓ Kitchen moving average calculated correctly across multiple transfers!")


if __name__ == '__main__':
    import django
    django.setup()

    from django.test.runner import DiscoverRunner
    runner = DiscoverRunner(verbosity=2)
    runner.run_tests(['apps.restaurant.test_moving_average'])
