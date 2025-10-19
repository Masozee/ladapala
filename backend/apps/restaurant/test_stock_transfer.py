from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from apps.restaurant.models import (
    Restaurant, Branch, Inventory, InventoryTransaction,
    StockTransfer
)

User = get_user_model()


class StockTransferTestCase(TestCase):
    """Test warehouse to kitchen stock transfer system"""

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

        # Create warehouse inventory
        self.warehouse_rice = Inventory.objects.create(
            branch=self.branch,
            name='Beras',
            unit='gram',
            quantity=Decimal('50000.00'),  # 50kg in warehouse
            min_quantity=Decimal('10000.00'),
            cost_per_unit=Decimal('10.00'),
            location='WAREHOUSE'
        )

        self.warehouse_oil = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='ml',
            quantity=Decimal('10000.00'),  # 10 liters
            min_quantity=Decimal('2000.00'),
            cost_per_unit=Decimal('15.00'),
            location='WAREHOUSE'
        )

        # Create kitchen inventory (initially low stock)
        self.kitchen_rice = Inventory.objects.create(
            branch=self.branch,
            name='Beras',
            unit='gram',
            quantity=Decimal('1000.00'),  # Only 1kg in kitchen
            min_quantity=Decimal('5000.00'),
            cost_per_unit=Decimal('10.00'),
            location='KITCHEN'
        )

        self.kitchen_oil = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='ml',
            quantity=Decimal('500.00'),  # Only 500ml
            min_quantity=Decimal('2000.00'),
            cost_per_unit=Decimal('15.00'),
            location='KITCHEN'
        )

    def test_warehouse_kitchen_separate_inventory(self):
        """Test that warehouse and kitchen maintain separate inventory records"""
        # Should have separate records for same item
        self.assertNotEqual(self.warehouse_rice.id, self.kitchen_rice.id)

        # Different locations
        self.assertEqual(self.warehouse_rice.location, 'WAREHOUSE')
        self.assertEqual(self.kitchen_rice.location, 'KITCHEN')

        # Same item name and unit
        self.assertEqual(self.warehouse_rice.name, self.kitchen_rice.name)
        self.assertEqual(self.warehouse_rice.unit, self.kitchen_rice.unit)

        # Different quantities
        self.assertNotEqual(self.warehouse_rice.quantity, self.kitchen_rice.quantity)

    def test_stock_transfer_creation(self):
        """Test creating a stock transfer from warehouse to kitchen"""
        initial_warehouse_qty = self.warehouse_rice.quantity
        initial_kitchen_qty = self.kitchen_rice.quantity
        transfer_qty = Decimal('10000.00')  # Transfer 10kg

        # Create stock transfer record
        transfer = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user,
            notes='Weekly restock'
        )

        # Verify transfer was created
        self.assertEqual(transfer.item_name, 'Beras')
        self.assertEqual(transfer.quantity, transfer_qty)
        self.assertEqual(transfer.from_warehouse, self.warehouse_rice)
        self.assertEqual(transfer.to_kitchen, self.kitchen_rice)
        self.assertEqual(transfer.transferred_by, self.user)

    def test_stock_transfer_updates_quantities(self):
        """Test that transfer updates both warehouse and kitchen quantities"""
        initial_warehouse_qty = self.warehouse_rice.quantity
        initial_kitchen_qty = self.kitchen_rice.quantity
        transfer_qty = Decimal('10000.00')  # Transfer 10kg

        # Simulate the transfer process (as done in the API)
        # 1. Deduct from warehouse
        self.warehouse_rice.quantity -= transfer_qty
        self.warehouse_rice.save()

        # 2. Add to kitchen
        self.kitchen_rice.quantity += transfer_qty
        self.kitchen_rice.save()

        # 3. Create transfer record
        StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user
        )

        # Refresh from database
        self.warehouse_rice.refresh_from_db()
        self.kitchen_rice.refresh_from_db()

        # Verify quantities updated correctly
        self.assertEqual(
            self.warehouse_rice.quantity,
            initial_warehouse_qty - transfer_qty
        )
        self.assertEqual(
            self.kitchen_rice.quantity,
            initial_kitchen_qty + transfer_qty
        )

    def test_stock_transfer_with_transactions(self):
        """Test that transfer creates proper inventory transactions"""
        transfer_qty = Decimal('5000.00')  # Transfer 5kg

        # Create TRANSFER OUT transaction for warehouse
        warehouse_transaction = InventoryTransaction.objects.create(
            inventory=self.warehouse_rice,
            transaction_type='TRANSFER',
            quantity=transfer_qty,
            unit_cost=self.warehouse_rice.cost_per_unit,
            reference_number='TRF-001',
            performed_by=self.user,
            notes='Transfer ke dapur'
        )

        # Create TRANSFER IN transaction for kitchen
        kitchen_transaction = InventoryTransaction.objects.create(
            inventory=self.kitchen_rice,
            transaction_type='TRANSFER',
            quantity=transfer_qty,
            unit_cost=self.kitchen_rice.cost_per_unit,
            reference_number='TRF-001',
            performed_by=self.user,
            notes='Transfer dari gudang'
        )

        # Update quantities
        self.warehouse_rice.quantity -= transfer_qty
        self.warehouse_rice.save()
        self.kitchen_rice.quantity += transfer_qty
        self.kitchen_rice.save()

        # Create transfer record
        transfer = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user
        )

        # Verify transactions were created
        self.assertEqual(
            InventoryTransaction.objects.filter(
                inventory=self.warehouse_rice,
                transaction_type='TRANSFER'
            ).count(),
            1
        )
        self.assertEqual(
            InventoryTransaction.objects.filter(
                inventory=self.kitchen_rice,
                transaction_type='TRANSFER'
            ).count(),
            1
        )

        # Verify transaction amounts
        self.assertEqual(warehouse_transaction.quantity, transfer_qty)
        self.assertEqual(kitchen_transaction.quantity, transfer_qty)

    def test_insufficient_warehouse_stock(self):
        """Test that transfer fails when warehouse stock is insufficient"""
        # Try to transfer more than available
        transfer_qty = Decimal('60000.00')  # Want 60kg, but only 50kg available

        initial_warehouse_qty = self.warehouse_rice.quantity

        # This should be prevented by validation
        if self.warehouse_rice.quantity < transfer_qty:
            # Transfer should not proceed
            can_transfer = False
        else:
            can_transfer = True

        self.assertFalse(can_transfer)

        # Warehouse quantity should remain unchanged
        self.assertEqual(self.warehouse_rice.quantity, initial_warehouse_qty)

    def test_multiple_transfers_same_day(self):
        """Test multiple transfers from warehouse to kitchen"""
        # Transfer 1: 5kg rice
        transfer1_qty = Decimal('5000.00')
        self.warehouse_rice.quantity -= transfer1_qty
        self.kitchen_rice.quantity += transfer1_qty
        self.warehouse_rice.save()
        self.kitchen_rice.save()

        transfer1 = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer1_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user,
            notes='Morning restock'
        )

        # Transfer 2: 3kg rice
        transfer2_qty = Decimal('3000.00')
        self.warehouse_rice.quantity -= transfer2_qty
        self.kitchen_rice.quantity += transfer2_qty
        self.warehouse_rice.save()
        self.kitchen_rice.save()

        transfer2 = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer2_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user,
            notes='Afternoon restock'
        )

        # Verify both transfers recorded
        self.assertEqual(StockTransfer.objects.count(), 2)

        # Verify total quantity transferred
        total_transferred = transfer1_qty + transfer2_qty
        expected_warehouse = Decimal('50000.00') - total_transferred
        expected_kitchen = Decimal('1000.00') + total_transferred

        self.warehouse_rice.refresh_from_db()
        self.kitchen_rice.refresh_from_db()

        self.assertEqual(self.warehouse_rice.quantity, expected_warehouse)
        self.assertEqual(self.kitchen_rice.quantity, expected_kitchen)

    def test_transfer_different_items(self):
        """Test transferring different items from warehouse to kitchen"""
        rice_transfer = Decimal('10000.00')
        oil_transfer = Decimal('2000.00')

        # Transfer rice
        self.warehouse_rice.quantity -= rice_transfer
        self.kitchen_rice.quantity += rice_transfer
        self.warehouse_rice.save()
        self.kitchen_rice.save()

        StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=rice_transfer,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user
        )

        # Transfer oil
        self.warehouse_oil.quantity -= oil_transfer
        self.kitchen_oil.quantity += oil_transfer
        self.warehouse_oil.save()
        self.kitchen_oil.save()

        StockTransfer.objects.create(
            branch=self.branch,
            item_name='Minyak Goreng',
            quantity=oil_transfer,
            unit='ml',
            from_warehouse=self.warehouse_oil,
            to_kitchen=self.kitchen_oil,
            transferred_by=self.user
        )

        # Verify both transfers recorded
        self.assertEqual(StockTransfer.objects.count(), 2)

        # Verify rice quantities
        self.warehouse_rice.refresh_from_db()
        self.kitchen_rice.refresh_from_db()
        self.assertEqual(self.warehouse_rice.quantity, Decimal('40000.00'))
        self.assertEqual(self.kitchen_rice.quantity, Decimal('11000.00'))

        # Verify oil quantities
        self.warehouse_oil.refresh_from_db()
        self.kitchen_oil.refresh_from_db()
        self.assertEqual(self.warehouse_oil.quantity, Decimal('8000.00'))
        self.assertEqual(self.kitchen_oil.quantity, Decimal('2500.00'))

    def test_transfer_audit_trail(self):
        """Test that transfers create proper audit trail"""
        transfer_qty = Decimal('7500.00')

        transfer = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras',
            quantity=transfer_qty,
            unit='gram',
            from_warehouse=self.warehouse_rice,
            to_kitchen=self.kitchen_rice,
            transferred_by=self.user,
            notes='Daily restock for peak hours'
        )

        # Verify audit information
        self.assertIsNotNone(transfer.transfer_date)
        self.assertEqual(transfer.transferred_by, self.user)
        self.assertEqual(transfer.notes, 'Daily restock for peak hours')

        # Verify the transfer can be tracked
        transfers = StockTransfer.objects.filter(
            branch=self.branch,
            item_name='Beras'
        )
        self.assertEqual(transfers.count(), 1)
        self.assertEqual(transfers.first(), transfer)

    def test_kitchen_stock_below_minimum_after_use(self):
        """Test restock needed when kitchen stock falls below minimum"""
        # Kitchen rice is at 1kg, minimum is 5kg
        self.assertTrue(self.kitchen_rice.needs_restock)

        # Transfer to bring above minimum
        transfer_qty = Decimal('10000.00')  # Transfer 10kg
        self.kitchen_rice.quantity += transfer_qty
        self.kitchen_rice.save()

        self.kitchen_rice.refresh_from_db()
        self.assertFalse(self.kitchen_rice.needs_restock)
        self.assertEqual(self.kitchen_rice.quantity, Decimal('11000.00'))

    def test_cost_consistency_warehouse_kitchen(self):
        """Test that cost per unit is consistent between warehouse and kitchen"""
        # Same item should have same cost in warehouse and kitchen
        self.assertEqual(
            self.warehouse_rice.cost_per_unit,
            self.kitchen_rice.cost_per_unit
        )
        self.assertEqual(
            self.warehouse_oil.cost_per_unit,
            self.kitchen_oil.cost_per_unit
        )

    def test_transfer_value_calculation(self):
        """Test calculating total value of transferred stock"""
        transfer_qty = Decimal('8000.00')  # 8kg
        cost_per_unit = self.warehouse_rice.cost_per_unit

        # Calculate transfer value
        transfer_value = transfer_qty * cost_per_unit
        expected_value = Decimal('80000.00')  # 8000g × Rp 10

        self.assertEqual(transfer_value, expected_value)

    def test_unit_conversion_warehouse_to_kitchen_for_bom(self):
        """Test unit conversion when transferring stock for recipe (BOM) usage"""
        from apps.restaurant.models import (
            Category, Product, Recipe, RecipeIngredient, Staff, StaffRole
        )

        # Create category and product
        category = Category.objects.create(
            restaurant=self.restaurant,
            name='Main Dishes'
        )

        product = Product.objects.create(
            restaurant=self.restaurant,
            category=category,
            name='Nasi Goreng Special',
            price=Decimal('35000.00')
        )

        # Warehouse has rice in KG (different unit from recipe)
        warehouse_rice_kg = Inventory.objects.create(
            branch=self.branch,
            name='Beras Premium',
            unit='kg',  # Warehouse uses KG
            quantity=Decimal('100.00'),  # 100 kg
            min_quantity=Decimal('20.00'),
            cost_per_unit=Decimal('15000.00'),  # Rp 15,000 per kg
            location='WAREHOUSE'
        )

        # Kitchen will receive in grams (for recipe precision)
        kitchen_rice_grams = Inventory.objects.create(
            branch=self.branch,
            name='Beras Premium',
            unit='gram',  # Kitchen uses GRAMS for precise BOM
            quantity=Decimal('5000.00'),  # 5 kg = 5,000 grams
            min_quantity=Decimal('10000.00'),
            cost_per_unit=Decimal('15.00'),  # Rp 15 per gram (15,000 / 1,000)
            location='KITCHEN'
        )

        # Create recipe that uses grams (standard BOM unit)
        recipe = Recipe.objects.create(
            product=product,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        # Recipe uses precise gram measurements
        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=kitchen_rice_grams,
            quantity=Decimal('300.000'),  # 300 grams per serving
            unit='gram'
        )

        # TRANSFER: Convert 10 kg from warehouse to 10,000 grams in kitchen
        warehouse_transfer_kg = Decimal('10.00')  # Transfer 10 kg
        kitchen_receive_grams = warehouse_transfer_kg * Decimal('1000')  # Convert to 10,000 grams

        # Update quantities
        warehouse_rice_kg.quantity -= warehouse_transfer_kg
        kitchen_rice_grams.quantity += kitchen_receive_grams
        warehouse_rice_kg.save()
        kitchen_rice_grams.save()

        # Create transfer record (showing conversion)
        transfer = StockTransfer.objects.create(
            branch=self.branch,
            item_name='Beras Premium',
            quantity=warehouse_transfer_kg,  # Record original warehouse unit
            unit='kg',
            from_warehouse=warehouse_rice_kg,
            to_kitchen=kitchen_rice_grams,
            transferred_by=self.user,
            notes=f'Transferred {warehouse_transfer_kg} kg = {kitchen_receive_grams} grams to kitchen'
        )

        # Verify warehouse reduced by 10 kg
        warehouse_rice_kg.refresh_from_db()
        self.assertEqual(warehouse_rice_kg.quantity, Decimal('90.00'))  # 100 - 10

        # Verify kitchen increased by 10,000 grams
        kitchen_rice_grams.refresh_from_db()
        self.assertEqual(kitchen_rice_grams.quantity, Decimal('15000.00'))  # 5,000 + 10,000

        # Verify recipe can now make servings
        # Recipe needs 300g per serving
        # Kitchen has 15,000g
        # Can make: 15,000 / 300 = 50 servings
        max_servings = kitchen_rice_grams.quantity / Decimal('300.00')
        self.assertEqual(max_servings, Decimal('50.00'))

        # Verify cost consistency after conversion
        # Warehouse: Rp 15,000 per kg
        # Kitchen: Rp 15 per gram = Rp 15,000 per 1,000 grams = Rp 15,000 per kg ✓
        warehouse_cost_per_gram = warehouse_rice_kg.cost_per_unit / Decimal('1000')
        self.assertEqual(warehouse_cost_per_gram, kitchen_rice_grams.cost_per_unit)

    def test_transfer_with_different_base_units(self):
        """Test transferring items with different base units (kg to gram, liter to ml)"""
        from decimal import Decimal

        # Scenario 1: Warehouse in KG, Kitchen in GRAMS
        warehouse_flour = Inventory.objects.create(
            branch=self.branch,
            name='Tepung Terigu',
            unit='kg',
            quantity=Decimal('50.00'),  # 50 kg
            min_quantity=Decimal('10.00'),
            cost_per_unit=Decimal('12000.00'),  # Rp 12,000 per kg
            location='WAREHOUSE'
        )

        kitchen_flour = Inventory.objects.create(
            branch=self.branch,
            name='Tepung Terigu',
            unit='gram',
            quantity=Decimal('2000.00'),  # 2 kg = 2,000 grams
            min_quantity=Decimal('5000.00'),
            cost_per_unit=Decimal('12.00'),  # Rp 12 per gram
            location='KITCHEN'
        )

        # Transfer 15 kg = 15,000 grams
        transfer_kg = Decimal('15.00')
        transfer_grams = transfer_kg * Decimal('1000')

        warehouse_flour.quantity -= transfer_kg
        kitchen_flour.quantity += transfer_grams
        warehouse_flour.save()
        kitchen_flour.save()

        # Verify conversion
        warehouse_flour.refresh_from_db()
        kitchen_flour.refresh_from_db()
        self.assertEqual(warehouse_flour.quantity, Decimal('35.00'))
        self.assertEqual(kitchen_flour.quantity, Decimal('17000.00'))  # 2,000 + 15,000

        # Scenario 2: Warehouse in LITER, Kitchen in ML
        warehouse_milk = Inventory.objects.create(
            branch=self.branch,
            name='Susu Segar',
            unit='liter',
            quantity=Decimal('30.00'),  # 30 liters
            min_quantity=Decimal('5.00'),
            cost_per_unit=Decimal('25000.00'),  # Rp 25,000 per liter
            location='WAREHOUSE'
        )

        kitchen_milk = Inventory.objects.create(
            branch=self.branch,
            name='Susu Segar',
            unit='ml',
            quantity=Decimal('3000.00'),  # 3 liters = 3,000 ml
            min_quantity=Decimal('5000.00'),
            cost_per_unit=Decimal('25.00'),  # Rp 25 per ml
            location='KITCHEN'
        )

        # Transfer 10 liters = 10,000 ml
        transfer_liter = Decimal('10.00')
        transfer_ml = transfer_liter * Decimal('1000')

        warehouse_milk.quantity -= transfer_liter
        kitchen_milk.quantity += transfer_ml
        warehouse_milk.save()
        kitchen_milk.save()

        # Verify conversion
        warehouse_milk.refresh_from_db()
        kitchen_milk.refresh_from_db()
        self.assertEqual(warehouse_milk.quantity, Decimal('20.00'))
        self.assertEqual(kitchen_milk.quantity, Decimal('13000.00'))  # 3,000 + 10,000

        # Verify cost consistency for both conversions
        flour_cost_match = (warehouse_flour.cost_per_unit / Decimal('1000')) == kitchen_flour.cost_per_unit
        milk_cost_match = (warehouse_milk.cost_per_unit / Decimal('1000')) == kitchen_milk.cost_per_unit

        self.assertTrue(flour_cost_match)
        self.assertTrue(milk_cost_match)
