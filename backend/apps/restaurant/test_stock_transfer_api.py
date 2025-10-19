from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from decimal import Decimal
from apps.restaurant.models import (
    Restaurant, Branch, Inventory, StockTransfer, InventoryTransaction
)

User = get_user_model()


class StockTransferAPITestCase(TestCase):
    """Test stock transfer API with automatic unit and price conversion"""

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            email='warehouse@example.com',
            password='testpass123',
            first_name='Warehouse',
            last_name='Manager'
        )

        # Create restaurant and branch
        self.restaurant = Restaurant.objects.create(
            name='Test Restaurant',
            address='Test Address'
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Main Branch',
            address='Main Address'
        )

        # Create warehouse item (kg)
        self.warehouse_rice = Inventory.objects.create(
            branch=self.branch,
            name='Beras Premium',
            unit='kg',
            quantity=Decimal('100.00'),  # 100 kg
            min_quantity=Decimal('20.00'),
            cost_per_unit=Decimal('15000.00'),  # Rp 15,000 per kg
            location='WAREHOUSE'
        )

        # Get kitchen item (auto-created by signal)
        self.kitchen_rice = Inventory.objects.get(
            branch=self.branch,
            name='Beras Premium',
            location='KITCHEN'
        )
        # Update to gram with correct cost
        self.kitchen_rice.unit = 'gram'
        self.kitchen_rice.quantity = Decimal('5000.00')  # 5 kg = 5,000 grams
        self.kitchen_rice.cost_per_unit = Decimal('15.00')  # Rp 15 per gram
        self.kitchen_rice.save()

        # Setup API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_stock_transfer_with_unit_conversion(self):
        """Test transferring stock from warehouse (kg) to kitchen (gram)"""

        print("\n=== TEST: Stock Transfer with Unit Conversion ===\n")

        # Initial state
        print("BEFORE TRANSFER:")
        print(f"Warehouse: {self.warehouse_rice.quantity} {self.warehouse_rice.unit} @ Rp {self.warehouse_rice.cost_per_unit}/{self.warehouse_rice.unit}")
        print(f"Kitchen: {self.kitchen_rice.quantity} {self.kitchen_rice.unit} @ Rp {self.kitchen_rice.cost_per_unit}/{self.kitchen_rice.unit}")

        initial_warehouse_qty = self.warehouse_rice.quantity
        initial_kitchen_qty = self.kitchen_rice.quantity

        # Transfer 10 kg from warehouse to kitchen
        transfer_qty_kg = Decimal('10.00')
        expected_kitchen_receive = transfer_qty_kg * 1000  # 10,000 grams

        response = self.client.post('/api/stock-transfers/', {
            'warehouse_item_id': self.warehouse_rice.id,
            'kitchen_item_id': self.kitchen_rice.id,
            'quantity': str(transfer_qty_kg),
            'notes': 'Transfer 10 kg for kitchen use'
        })

        # Verify response
        self.assertEqual(response.status_code, 201, f"Failed: {response.data}")

        # Refresh from database
        self.warehouse_rice.refresh_from_db()
        self.kitchen_rice.refresh_from_db()

        print("\nAFTER TRANSFER:")
        print(f"Warehouse: {self.warehouse_rice.quantity} {self.warehouse_rice.unit} @ Rp {self.warehouse_rice.cost_per_unit}/{self.warehouse_rice.unit}")
        print(f"Kitchen: {self.kitchen_rice.quantity} {self.kitchen_rice.unit} @ Rp {self.kitchen_rice.cost_per_unit}/{self.kitchen_rice.unit}")

        # Verify warehouse quantity reduced
        self.assertEqual(
            self.warehouse_rice.quantity,
            initial_warehouse_qty - transfer_qty_kg
        )

        # Verify kitchen quantity increased by converted amount
        self.assertEqual(
            self.kitchen_rice.quantity,
            initial_kitchen_qty + expected_kitchen_receive
        )

        # Verify kitchen cost is still Rp 15/gram (moving average of same price)
        self.assertEqual(
            self.kitchen_rice.cost_per_unit,
            Decimal('15.00')
        )

        # Verify total value preserved
        warehouse_value = self.warehouse_rice.quantity * self.warehouse_rice.cost_per_unit
        kitchen_value = self.kitchen_rice.quantity * self.kitchen_rice.cost_per_unit
        initial_total = (initial_warehouse_qty * Decimal('15000')) + (initial_kitchen_qty * Decimal('15'))
        final_total = warehouse_value + kitchen_value

        print(f"\nVALUE VERIFICATION:")
        print(f"Initial total value: Rp {initial_total:,.2f}")
        print(f"Final total value: Rp {final_total:,.2f}")
        print(f"Warehouse value: Rp {warehouse_value:,.2f}")
        print(f"Kitchen value: Rp {kitchen_value:,.2f}")

        self.assertEqual(initial_total, final_total)

        # Verify transfer record created
        transfer = StockTransfer.objects.filter(
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice
        ).first()
        self.assertIsNotNone(transfer)
        self.assertEqual(transfer.quantity, transfer_qty_kg)
        self.assertEqual(transfer.unit, 'kg')

        # Verify inventory transactions created
        warehouse_transaction = InventoryTransaction.objects.filter(
            inventory=self.warehouse_rice,
            transaction_type='TRANSFER',
            reference_number=f'TRF-{transfer.id}'
        ).first()
        self.assertIsNotNone(warehouse_transaction)
        self.assertEqual(warehouse_transaction.quantity, transfer_qty_kg)

        kitchen_transaction = InventoryTransaction.objects.filter(
            inventory=self.kitchen_rice,
            transaction_type='TRANSFER',
            reference_number=f'TRF-{transfer.id}'
        ).first()
        self.assertIsNotNone(kitchen_transaction)
        self.assertEqual(kitchen_transaction.quantity, expected_kitchen_receive)

        print("\n✓ All verifications passed!")
        print("✓ Unit conversion: 10 kg → 10,000 grams")
        print("✓ Price conversion: Rp 15,000/kg → Rp 15/gram")
        print("✓ Total value preserved")
        print("✓ Transfer and transaction records created")

    def test_insufficient_warehouse_stock(self):
        """Test that transfer fails when warehouse stock is insufficient"""

        response = self.client.post('/api/stock-transfers/', {
            'warehouse_item_id': self.warehouse_rice.id,
            'kitchen_item_id': self.kitchen_rice.id,
            'quantity': '150',  # Want 150 kg but only 100 kg available
            'notes': 'This should fail'
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn('quantity', response.data)

    def test_mismatched_items(self):
        """Test that transfer fails when warehouse and kitchen items don't match"""

        # Create another item
        warehouse_oil = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='liter',
            quantity=Decimal('50.00'),
            min_quantity=Decimal('10.00'),
            cost_per_unit=Decimal('25000.00'),
            location='WAREHOUSE'
        )

        # Try to transfer oil from warehouse but receive as rice in kitchen
        response = self.client.post('/api/stock-transfers/', {
            'warehouse_item_id': warehouse_oil.id,
            'kitchen_item_id': self.kitchen_rice.id,
            'quantity': '5',
            'notes': 'This should fail - mismatched items'
        })

        self.assertEqual(response.status_code, 400)
        self.assertIn('kitchen_item_id', response.data)
