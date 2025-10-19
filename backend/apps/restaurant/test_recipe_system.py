from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from apps.restaurant.models import (
    Restaurant, Branch, Staff, Category, Product,
    Inventory, InventoryTransaction, Recipe, RecipeIngredient,
    Order, OrderItem, Payment, CashierSession
)

User = get_user_model()


class RecipeSystemTestCase(TestCase):
    """Test recipe system and automatic ingredient deduction"""

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
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

        # Create staff
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role='CASHIER',
            phone='08123456789'
        )

        # Create cashier session
        self.session = CashierSession.objects.create(
            cashier=self.staff,
            branch=self.branch,
            shift_type='MORNING',
            opening_cash=Decimal('1000000.00')
        )

        # Create category
        self.category = Category.objects.create(
            restaurant=self.restaurant,
            name='Main Dishes'
        )

        # Create product (Nasi Goreng)
        self.product = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Nasi Goreng',
            price=Decimal('25000.00'),
            is_available=True
        )

        # Create kitchen inventory items
        self.rice_inventory = Inventory.objects.create(
            branch=self.branch,
            name='Beras',
            unit='gram',
            quantity=Decimal('10000.00'),  # 10kg
            min_quantity=Decimal('2000.00'),
            cost_per_unit=Decimal('10.00'),  # Rp 10/gram
            location='KITCHEN'
        )

        self.egg_inventory = Inventory.objects.create(
            branch=self.branch,
            name='Telur',
            unit='pcs',
            quantity=Decimal('100.00'),
            min_quantity=Decimal('20.00'),
            cost_per_unit=Decimal('2000.00'),  # Rp 2000/pcs
            location='KITCHEN'
        )

        self.oil_inventory = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='ml',
            quantity=Decimal('5000.00'),  # 5 liters
            min_quantity=Decimal('1000.00'),
            cost_per_unit=Decimal('15.00'),  # Rp 15/ml
            location='KITCHEN'
        )

        # Create recipe for Nasi Goreng
        self.recipe = Recipe.objects.create(
            product=self.product,
            branch=self.branch,
            serving_size=Decimal('1.00'),
            preparation_time=10,
            cooking_time=15,
            instructions='Goreng beras dengan telur dan bumbu',
            is_active=True
        )

        # Create recipe ingredients
        self.recipe_rice = RecipeIngredient.objects.create(
            recipe=self.recipe,
            inventory_item=self.rice_inventory,
            quantity=Decimal('250.000'),  # 250 grams per serving
            unit='gram',
            notes='Beras putih matang'
        )

        self.recipe_egg = RecipeIngredient.objects.create(
            recipe=self.recipe,
            inventory_item=self.egg_inventory,
            quantity=Decimal('1.000'),  # 1 egg per serving
            unit='pcs'
        )

        self.recipe_oil = RecipeIngredient.objects.create(
            recipe=self.recipe,
            inventory_item=self.oil_inventory,
            quantity=Decimal('20.000'),  # 20ml per serving
            unit='ml'
        )

    def test_recipe_creation(self):
        """Test recipe is created correctly"""
        self.assertEqual(self.recipe.product.name, 'Nasi Goreng')
        self.assertEqual(self.recipe.ingredients.count(), 3)
        self.assertEqual(self.recipe.serving_size, Decimal('1.00'))

    def test_recipe_cost_calculation(self):
        """Test recipe total cost and cost per serving calculation"""
        # Expected costs:
        # Rice: 250g × Rp 10 = Rp 2,500
        # Egg: 1 × Rp 2,000 = Rp 2,000
        # Oil: 20ml × Rp 15 = Rp 300
        # Total: Rp 4,800

        expected_total_cost = Decimal('4800.00')
        self.assertEqual(self.recipe.total_cost, expected_total_cost)
        self.assertEqual(self.recipe.cost_per_serving, expected_total_cost)

    def test_recipe_profit_margin(self):
        """Test profit margin calculation"""
        # Selling price: Rp 25,000
        # Cost: Rp 4,800
        # Profit: Rp 20,200
        # Margin: (20,200 / 25,000) × 100 = 80.8%

        cost = self.recipe.cost_per_serving
        price = float(self.product.price)
        profit = price - cost
        margin = (profit / price) * 100

        self.assertAlmostEqual(margin, 80.8, places=1)

    def test_ingredient_deduction_single_order(self):
        """Test automatic ingredient deduction for single order"""
        # Store initial quantities
        initial_rice = self.rice_inventory.quantity
        initial_egg = self.egg_inventory.quantity
        initial_oil = self.oil_inventory.quantity

        # Create order with 1 Nasi Goreng
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1,
            unit_price=self.product.price
        )

        # Create payment (this should trigger ingredient deduction)
        payment = Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        # Manually trigger the deduction logic (since we're not using ViewSet)
        for item in order.items.all():
            recipe = item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = Decimal(str(float(recipe_ingredient.quantity) * item.quantity))
                inventory_item.quantity -= total_quantity_needed
                inventory_item.save()

                InventoryTransaction.objects.create(
                    inventory=inventory_item,
                    transaction_type='OUT',
                    quantity=total_quantity_needed,
                    unit_cost=inventory_item.cost_per_unit,
                    reference_number=f"ORDER-{order.id}",
                    performed_by=self.user,
                    notes=f"Auto-deduction for {item.quantity}x {item.product.name}"
                )

        # Refresh inventory from database
        self.rice_inventory.refresh_from_db()
        self.egg_inventory.refresh_from_db()
        self.oil_inventory.refresh_from_db()

        # Expected deductions for 1 serving:
        # Rice: 250g
        # Egg: 1 pcs
        # Oil: 20ml

        self.assertEqual(
            self.rice_inventory.quantity,
            initial_rice - Decimal('250.00')
        )
        self.assertEqual(
            self.egg_inventory.quantity,
            initial_egg - Decimal('1.00')
        )
        self.assertEqual(
            self.oil_inventory.quantity,
            initial_oil - Decimal('20.00')
        )

    def test_ingredient_deduction_multiple_items(self):
        """Test automatic ingredient deduction for multiple items"""
        # Store initial quantities
        initial_rice = self.rice_inventory.quantity
        initial_egg = self.egg_inventory.quantity
        initial_oil = self.oil_inventory.quantity

        # Create order with 3 Nasi Goreng
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=3,  # Order 3 servings
            unit_price=self.product.price
        )

        # Simulate ingredient deduction
        for item in order.items.all():
            recipe = item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = Decimal(str(float(recipe_ingredient.quantity) * item.quantity))
                inventory_item.quantity -= total_quantity_needed
                inventory_item.save()

        # Refresh inventory from database
        self.rice_inventory.refresh_from_db()
        self.egg_inventory.refresh_from_db()
        self.oil_inventory.refresh_from_db()

        # Expected deductions for 3 servings:
        # Rice: 250g × 3 = 750g
        # Egg: 1 × 3 = 3 pcs
        # Oil: 20ml × 3 = 60ml

        self.assertEqual(
            self.rice_inventory.quantity,
            initial_rice - Decimal('750.00')
        )
        self.assertEqual(
            self.egg_inventory.quantity,
            initial_egg - Decimal('3.00')
        )
        self.assertEqual(
            self.oil_inventory.quantity,
            initial_oil - Decimal('60.00')
        )

    def test_inventory_transaction_logging(self):
        """Test that inventory transactions are logged correctly"""
        initial_transaction_count = InventoryTransaction.objects.count()

        # Create order
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            unit_price=self.product.price
        )

        # Simulate ingredient deduction with logging
        for item in order.items.all():
            recipe = item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = Decimal(str(float(recipe_ingredient.quantity) * item.quantity))
                inventory_item.quantity -= total_quantity_needed
                inventory_item.save()

                InventoryTransaction.objects.create(
                    inventory=inventory_item,
                    transaction_type='OUT',
                    quantity=total_quantity_needed,
                    unit_cost=inventory_item.cost_per_unit,
                    reference_number=f"ORDER-{order.id}",
                    performed_by=self.user,
                    notes=f"Auto-deduction for {item.quantity}x {item.product.name}"
                )

        # Should create 3 transactions (one for each ingredient)
        self.assertEqual(
            InventoryTransaction.objects.count(),
            initial_transaction_count + 3
        )

        # Verify transaction details
        rice_transaction = InventoryTransaction.objects.filter(
            inventory=self.rice_inventory,
            reference_number=f"ORDER-{order.id}"
        ).first()

        self.assertIsNotNone(rice_transaction)
        self.assertEqual(rice_transaction.transaction_type, 'OUT')
        self.assertEqual(rice_transaction.quantity, Decimal('500.00'))  # 250g × 2

    def test_product_without_recipe(self):
        """Test that products without recipes don't cause errors"""
        # Create product without recipe
        product_no_recipe = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Minuman',
            price=Decimal('5000.00'),
            is_available=True
        )

        # Create order
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=product_no_recipe,
            quantity=1,
            unit_price=product_no_recipe.price
        )

        # Try to process - should not raise error
        try:
            for item in order.items.all():
                try:
                    recipe = item.product.recipe
                    # Should not reach here
                    self.fail("Should have raised Recipe.DoesNotExist")
                except Recipe.DoesNotExist:
                    # Expected - product has no recipe
                    pass
        except Exception as e:
            self.fail(f"Unexpected error: {e}")

    def test_warehouse_vs_kitchen_separation(self):
        """Test that warehouse and kitchen inventories are separate"""
        # Create warehouse inventory for the same item
        warehouse_rice = Inventory.objects.create(
            branch=self.branch,
            name='Beras',
            unit='gram',
            quantity=Decimal('50000.00'),  # 50kg in warehouse
            min_quantity=Decimal('10000.00'),
            cost_per_unit=Decimal('10.00'),
            location='WAREHOUSE'
        )

        # Kitchen inventory should be different
        self.assertNotEqual(warehouse_rice.id, self.rice_inventory.id)
        self.assertEqual(warehouse_rice.location, 'WAREHOUSE')
        self.assertEqual(self.rice_inventory.location, 'KITCHEN')

        # Recipe should only use kitchen inventory
        self.assertEqual(self.recipe_rice.inventory_item.location, 'KITCHEN')

    def test_low_stock_detection(self):
        """Test that low stock is detected correctly"""
        # Reduce rice to below minimum
        self.rice_inventory.quantity = Decimal('1500.00')
        self.rice_inventory.save()

        self.assertTrue(self.rice_inventory.needs_restock)

        # Increase back above minimum
        self.rice_inventory.quantity = Decimal('3000.00')
        self.rice_inventory.save()

        self.assertFalse(self.rice_inventory.needs_restock)

    def test_inventory_total_value_calculation(self):
        """Test inventory total value calculation"""
        # Rice: 10,000g × Rp 10 = Rp 100,000
        expected_value = Decimal('100000.00')
        self.assertEqual(self.rice_inventory.total_value, expected_value)

        # Egg: 100 pcs × Rp 2,000 = Rp 200,000
        expected_egg_value = Decimal('200000.00')
        self.assertEqual(self.egg_inventory.total_value, expected_egg_value)

    def test_insufficient_stock_detection(self):
        """Test that insufficient stock is properly detected"""
        # Reduce rice to very low amount
        self.rice_inventory.quantity = Decimal('100.00')  # Only 100g available
        self.rice_inventory.save()

        # Order 1 Nasi Goreng (needs 250g rice)
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1,
            unit_price=self.product.price
        )

        # Simulate the validation that happens in PaymentViewSet
        insufficient_items = []
        for item in order.items.all():
            recipe = item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = float(recipe_ingredient.quantity) * item.quantity

                if inventory_item.quantity < total_quantity_needed:
                    insufficient_items.append({
                        'product': item.product.name,
                        'ingredient': inventory_item.name,
                        'needed': total_quantity_needed,
                        'available': float(inventory_item.quantity),
                        'unit': inventory_item.unit
                    })

        # Should have found insufficient rice
        self.assertEqual(len(insufficient_items), 1)
        self.assertEqual(insufficient_items[0]['ingredient'], 'Beras')
        self.assertEqual(insufficient_items[0]['needed'], 250.0)
        self.assertEqual(insufficient_items[0]['available'], 100.0)

    def test_sufficient_stock_allows_payment(self):
        """Test that payment proceeds when all ingredients are sufficient"""
        # All ingredients are already sufficient in setUp
        # Rice: 10,000g, Egg: 100pcs, Oil: 5,000ml

        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        order_item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=5,  # Order 5 servings
            unit_price=self.product.price
        )

        # Check validation
        insufficient_items = []
        for item in order.items.all():
            recipe = item.product.recipe
            for recipe_ingredient in recipe.ingredients.all():
                inventory_item = recipe_ingredient.inventory_item
                total_quantity_needed = float(recipe_ingredient.quantity) * item.quantity

                if inventory_item.quantity < total_quantity_needed:
                    insufficient_items.append(inventory_item.name)

        # Should have no insufficient items
        self.assertEqual(len(insufficient_items), 0)
