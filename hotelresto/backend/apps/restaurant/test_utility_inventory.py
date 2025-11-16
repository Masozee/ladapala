"""
Tests for Utility Inventory Management
Tests non-food items like cleaning supplies, serving items, packaging, etc.
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from datetime import date, timedelta

from apps.restaurant.models import (
    Restaurant, Branch, Inventory, InventoryTransaction,
    InventoryItemType, InventoryCategory, InventoryLocation
)

User = get_user_model()


class UtilityInventoryTestCase(TestCase):
    """Test utility inventory items (non-food items)"""

    def setUp(self):
        """Set up test data"""
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

        # Create user
        self.user = User.objects.create_user(
            email='warehouse@test.com',
            password='test123'
        )

    def test_create_utility_item(self):
        """Test creating a utility inventory item"""
        item = Inventory.objects.create(
            branch=self.branch,
            name='Plate Ceramic 10"',
            description='White ceramic plate 10 inch diameter',
            unit='pcs',
            quantity=150,
            min_quantity=100,
            cost_per_unit=Decimal('25000.00'),
            location=InventoryLocation.KITCHEN,
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.SERVING,
            is_durable=True,
            par_stock_level=Decimal('120'),
            lifespan_days=730  # 2 years
        )

        self.assertEqual(item.item_type, InventoryItemType.UTILITY)
        self.assertEqual(item.category, InventoryCategory.SERVING)
        self.assertTrue(item.is_durable)
        self.assertEqual(item.par_stock_level, Decimal('120'))

    def test_create_cleaning_supply(self):
        """Test creating cleaning supply item"""
        item = Inventory.objects.create(
            branch=self.branch,
            name='Detergent 5L',
            description='Dishwashing liquid detergent',
            unit='bottle',
            quantity=8,
            min_quantity=3,
            cost_per_unit=Decimal('45000.00'),
            location=InventoryLocation.KITCHEN,
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.CLEANING,
            is_durable=False,
            par_stock_level=Decimal('5')
        )

        self.assertEqual(item.item_type, InventoryItemType.UTILITY)
        self.assertEqual(item.category, InventoryCategory.CLEANING)
        self.assertFalse(item.is_durable)

    def test_create_packaging_item(self):
        """Test creating packaging item"""
        item = Inventory.objects.create(
            branch=self.branch,
            name='Takeaway Box Large',
            description='Paper takeaway box large size',
            unit='pcs',
            quantity=500,
            min_quantity=200,
            cost_per_unit=Decimal('2500.00'),
            location=InventoryLocation.WAREHOUSE,
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.PACKAGING,
            is_durable=False,
            par_stock_level=Decimal('250')
        )

        self.assertEqual(item.category, InventoryCategory.PACKAGING)
        self.assertFalse(item.is_durable)

    def test_par_stock_level_check(self):
        """Test par stock level checking for utility items"""
        item = Inventory.objects.create(
            branch=self.branch,
            name='Fork Stainless',
            unit='pcs',
            quantity=100,
            par_stock_level=Decimal('120'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.SERVING,
            cost_per_unit=Decimal('15000.00')
        )

        # Below par stock
        self.assertTrue(item.below_par_stock)
        self.assertTrue(item.needs_restock)

        # Above par stock
        item.quantity = Decimal('150')
        item.save()
        self.assertFalse(item.below_par_stock)
        self.assertFalse(item.needs_restock)

    def test_breakage_tracking(self):
        """Test breakage tracking for durable utility items"""
        item = Inventory.objects.create(
            branch=self.branch,
            name='Glass Tumbler',
            unit='pcs',
            quantity=200,
            cost_per_unit=Decimal('12000.00'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.SERVING,
            is_durable=True,
            par_stock_level=Decimal('180'),
            breakage_count=0
        )

        # Initial breakage count
        self.assertEqual(item.breakage_count, 0)

        # Record breakage transaction
        breakage_tx = InventoryTransaction.objects.create(
            inventory=item,
            transaction_type='BREAKAGE',
            quantity=Decimal('5'),
            unit_cost=item.cost_per_unit,
            notes='Broken during washing',
            performed_by=self.user
        )

        # Update item quantity and breakage count
        item.quantity -= Decimal('5')
        item.breakage_count += 5
        item.save()

        self.assertEqual(item.quantity, Decimal('195'))
        self.assertEqual(item.breakage_count, 5)

    def test_breakage_rate_calculation(self):
        """Test breakage rate calculation"""
        item = Inventory.objects.create(
            branch=self.branch,
            name='Plate White 8"',
            unit='pcs',
            quantity=180,
            cost_per_unit=Decimal('20000.00'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.SERVING,
            is_durable=True,
            breakage_count=0
        )

        # Receive 200 pieces
        InventoryTransaction.objects.create(
            inventory=item,
            transaction_type='IN',
            quantity=Decimal('200'),
            unit_cost=item.cost_per_unit,
            notes='Initial stock',
            performed_by=self.user
        )

        # Record 10 breakages
        item.breakage_count = 10
        item.save()

        # Breakage rate should be 5% (10/200)
        breakage_rate = item.breakage_rate
        self.assertEqual(breakage_rate, 5.0)

    def test_stock_in_transaction(self):
        """Test receiving stock for utility items"""
        item = Inventory.objects.create(
            branch=self.branch,
            name='Napkin Paper',
            unit='pack',
            quantity=Decimal('20'),
            cost_per_unit=Decimal('15000.00'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.DISPOSABLES,
            par_stock_level=Decimal('30')
        )

        initial_qty = item.quantity

        # Receive new stock
        tx = InventoryTransaction.objects.create(
            inventory=item,
            transaction_type='IN',
            quantity=Decimal('50'),
            unit_cost=Decimal('15000.00'),
            notes='Restocking napkins',
            performed_by=self.user
        )

        # Update item
        item.quantity += tx.quantity
        item.last_restock_date = date.today()
        item.save()

        self.assertEqual(item.quantity, initial_qty + Decimal('50'))
        self.assertEqual(item.last_restock_date, date.today())

    def test_stock_out_transaction(self):
        """Test stock out for consumable utilities"""
        item = Inventory.objects.create(
            branch=self.branch,
            name='Plastic Bag Small',
            unit='pcs',
            quantity=Decimal('1000'),
            cost_per_unit=Decimal('500.00'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.PACKAGING,
            par_stock_level=Decimal('500')
        )

        # Use 200 bags
        tx = InventoryTransaction.objects.create(
            inventory=item,
            transaction_type='OUT',
            quantity=Decimal('200'),
            unit_cost=item.cost_per_unit,
            notes='Daily usage',
            performed_by=self.user
        )

        item.quantity -= tx.quantity
        item.save()

        self.assertEqual(item.quantity, Decimal('800'))

    def test_utility_vs_consumable_differentiation(self):
        """Test that utility and consumable items are properly differentiated"""
        # Create consumable (food item)
        food_item = Inventory.objects.create(
            branch=self.branch,
            name='Chicken Breast',
            unit='kg',
            quantity=Decimal('10'),
            min_quantity=Decimal('5'),
            cost_per_unit=Decimal('65000.00'),
            item_type=InventoryItemType.CONSUMABLE,
            category=InventoryCategory.FOOD,
            location=InventoryLocation.WAREHOUSE
        )

        # Create utility item
        utility_item = Inventory.objects.create(
            branch=self.branch,
            name='Spoon Stainless',
            unit='pcs',
            quantity=Decimal('150'),
            cost_per_unit=Decimal('8000.00'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.SERVING,
            is_durable=True,
            par_stock_level=Decimal('120')
        )

        # Verify they're different types
        self.assertEqual(food_item.item_type, InventoryItemType.CONSUMABLE)
        self.assertEqual(utility_item.item_type, InventoryItemType.UTILITY)

        # Consumable should not have par stock level
        self.assertIsNone(food_item.par_stock_level)

        # Utility should have par stock level
        self.assertIsNotNone(utility_item.par_stock_level)

    def test_query_utility_items_only(self):
        """Test querying only utility items"""
        # Create mix of items
        Inventory.objects.create(
            branch=self.branch,
            name='Rice',
            unit='kg',
            quantity=Decimal('50'),
            item_type=InventoryItemType.CONSUMABLE,
            category=InventoryCategory.FOOD,
            cost_per_unit=Decimal('12000.00')
        )

        Inventory.objects.create(
            branch=self.branch,
            name='Knife Set',
            unit='set',
            quantity=Decimal('5'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.KITCHEN_TOOLS,
            cost_per_unit=Decimal('250000.00')
        )

        Inventory.objects.create(
            branch=self.branch,
            name='Mop',
            unit='pcs',
            quantity=Decimal('8'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.CLEANING,
            cost_per_unit=Decimal('45000.00')
        )

        # Query only utilities
        utility_items = Inventory.objects.filter(item_type=InventoryItemType.UTILITY)

        self.assertEqual(utility_items.count(), 2)
        for item in utility_items:
            self.assertEqual(item.item_type, InventoryItemType.UTILITY)

    def test_query_by_category(self):
        """Test querying items by category"""
        # Create serving items
        Inventory.objects.create(
            branch=self.branch,
            name='Cup',
            unit='pcs',
            quantity=Decimal('100'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.SERVING,
            cost_per_unit=Decimal('15000.00')
        )

        Inventory.objects.create(
            branch=self.branch,
            name='Bowl',
            unit='pcs',
            quantity=Decimal('80'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.SERVING,
            cost_per_unit=Decimal('20000.00')
        )

        # Create cleaning item
        Inventory.objects.create(
            branch=self.branch,
            name='Broom',
            unit='pcs',
            quantity=Decimal('5'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.CLEANING,
            cost_per_unit=Decimal('35000.00')
        )

        # Query serving items
        serving_items = Inventory.objects.filter(category=InventoryCategory.SERVING)

        self.assertEqual(serving_items.count(), 2)
        for item in serving_items:
            self.assertEqual(item.category, InventoryCategory.SERVING)

    def test_equipment_type(self):
        """Test equipment (durable, long-lifespan) items"""
        item = Inventory.objects.create(
            branch=self.branch,
            name='Commercial Mixer',
            unit='unit',
            quantity=Decimal('2'),
            cost_per_unit=Decimal('5500000.00'),
            item_type=InventoryItemType.EQUIPMENT,
            category=InventoryCategory.KITCHEN_TOOLS,
            is_durable=True,
            lifespan_days=1825  # 5 years
        )

        self.assertEqual(item.item_type, InventoryItemType.EQUIPMENT)
        self.assertTrue(item.is_durable)
        self.assertEqual(item.lifespan_days, 1825)

    def test_last_restock_date_tracking(self):
        """Test tracking last restock date"""
        item = Inventory.objects.create(
            branch=self.branch,
            name='Tissue Box',
            unit='box',
            quantity=Decimal('30'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.DISPOSABLES,
            cost_per_unit=Decimal('8000.00'),
            par_stock_level=Decimal('20')
        )

        # Initially no restock date
        self.assertIsNone(item.last_restock_date)

        # Receive stock
        InventoryTransaction.objects.create(
            inventory=item,
            transaction_type='IN',
            quantity=Decimal('50'),
            unit_cost=item.cost_per_unit,
            performed_by=self.user
        )

        # Update last restock date
        item.last_restock_date = date.today()
        item.save()

        self.assertEqual(item.last_restock_date, date.today())

    def test_total_value_calculation(self):
        """Test total value calculation for utility items"""
        item = Inventory.objects.create(
            branch=self.branch,
            name='Chopsticks Wooden',
            unit='pair',
            quantity=Decimal('500'),
            cost_per_unit=Decimal('1500.00'),
            item_type=InventoryItemType.UTILITY,
            category=InventoryCategory.SERVING
        )

        expected_value = Decimal('500') * Decimal('1500.00')
        self.assertEqual(item.total_value, expected_value)
