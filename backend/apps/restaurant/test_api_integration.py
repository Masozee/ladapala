"""
Integration tests for Recipe API and Kitchen Stock synchronization
Tests the complete flow: Kitchen Stock → Recipes → Menu Availability → Order Processing
"""

from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from decimal import Decimal
import json

from apps.restaurant.models import (
    Restaurant, Branch, Staff, StaffRole,
    Category, Product, Inventory, InventoryTransaction,
    Recipe, RecipeIngredient,
    Order, OrderItem, Payment, CashierSession
)

User = get_user_model()


class RecipeAPIIntegrationTestCase(TestCase):
    """Test Recipe API integration with Kitchen Stock and Menu"""

    def setUp(self):
        """Set up test data and API client"""
        self.client = Client()

        # Create user
        self.user = User.objects.create_user(
            email='chef@ladapala.co.id',
            password='testpass123',
            first_name='Chef',
            last_name='Test'
        )

        # Create restaurant and branch
        self.restaurant = Restaurant.objects.create(
            name='Ladapala Restaurant',
            address='Test Address'
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Main Branch',
            address='Main Address'
        )

        # Create staff (manager for recipe creation)
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role=StaffRole.MANAGER,
            phone='08123456789'
        )

        # Create cashier for orders
        self.cashier_user = User.objects.create_user(
            email='cashier@ladapala.co.id',
            password='testpass123',
            first_name='Cashier',
            last_name='Test'
        )
        self.cashier = Staff.objects.create(
            user=self.cashier_user,
            branch=self.branch,
            role=StaffRole.CASHIER,
            phone='08123456788'
        )

        # Create cashier session
        self.session = CashierSession.objects.create(
            cashier=self.cashier,
            branch=self.branch,
            shift_type='MORNING',
            opening_cash=Decimal('1000000.00')
        )

        # Create category
        self.category = Category.objects.create(
            restaurant=self.restaurant,
            name='Main Dishes'
        )

        # Create products
        self.nasi_goreng = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Nasi Goreng Special',
            price=Decimal('25000.00'),
            is_available=True
        )

        self.mie_goreng = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Mie Goreng',
            price=Decimal('22000.00'),
            is_available=True
        )

        # Create kitchen inventory with sufficient stock
        self.kitchen_beras = Inventory.objects.create(
            branch=self.branch,
            name='Beras Premium',
            unit='gram',
            quantity=Decimal('50000.00'),  # 50kg
            min_quantity=Decimal('10000.00'),
            cost_per_unit=Decimal('12.00'),
            location='KITCHEN'
        )

        self.kitchen_mie = Inventory.objects.create(
            branch=self.branch,
            name='Mie',
            unit='gram',
            quantity=Decimal('500.00'),  # Only 500g - INSUFFICIENT
            min_quantity=Decimal('2000.00'),
            cost_per_unit=Decimal('20.00'),
            location='KITCHEN'
        )

        self.kitchen_minyak = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='ml',
            quantity=Decimal('10000.00'),  # 10 liters
            min_quantity=Decimal('2000.00'),
            cost_per_unit=Decimal('14.00'),
            location='KITCHEN'
        )

        self.kitchen_bawang = Inventory.objects.create(
            branch=self.branch,
            name='Bawang Merah',
            unit='gram',
            quantity=Decimal('5000.00'),  # 5kg
            min_quantity=Decimal('1000.00'),
            cost_per_unit=Decimal('35.00'),
            location='KITCHEN'
        )

        # Login
        self.client.login(username='chef@ladapala.co.id', password='testpass123')

    def test_01_create_recipe_via_api(self):
        """Test creating a recipe through the API"""
        # Create recipe for Nasi Goreng
        recipe_data = {
            'product': self.nasi_goreng.id,
            'branch': self.branch.id,
            'serving_size': 1,
            'preparation_time': 10,
            'cooking_time': 15,
            'instructions': 'Goreng beras dengan bumbu dan telur',
            'is_active': True
        }

        response = self.client.post(
            '/api/recipes/',
            data=json.dumps(recipe_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 201)
        recipe = Recipe.objects.get(product=self.nasi_goreng)
        self.assertEqual(recipe.serving_size, Decimal('1.00'))

    def test_02_add_recipe_ingredients_via_api(self):
        """Test adding ingredients to recipe through API"""
        # Create recipe
        recipe = Recipe.objects.create(
            product=self.nasi_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00'),
            preparation_time=10,
            cooking_time=15
        )

        # Add ingredients
        ingredients = [
            {
                'recipe': recipe.id,
                'inventory_item': self.kitchen_beras.id,
                'quantity': 250.0,
                'unit': 'gram',
                'notes': 'Beras putih matang'
            },
            {
                'recipe': recipe.id,
                'inventory_item': self.kitchen_minyak.id,
                'quantity': 30.0,
                'unit': 'ml'
            },
            {
                'recipe': recipe.id,
                'inventory_item': self.kitchen_bawang.id,
                'quantity': 50.0,
                'unit': 'gram'
            }
        ]

        for ingredient_data in ingredients:
            response = self.client.post(
                '/api/recipe-ingredients/',
                data=json.dumps(ingredient_data),
                content_type='application/json'
            )
            self.assertEqual(response.status_code, 201)

        # Verify all ingredients added
        self.assertEqual(recipe.ingredients.count(), 3)

    def test_03_check_menu_availability_with_sufficient_stock(self):
        """Test that products with sufficient stock are marked as available"""
        # Create recipe for Nasi Goreng (sufficient stock)
        recipe = Recipe.objects.create(
            product=self.nasi_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_beras,
            quantity=Decimal('250.00'),
            unit='gram'
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_minyak,
            quantity=Decimal('30.00'),
            unit='ml'
        )

        # Check availability via API
        response = self.client.get('/api/products/check_stock_availability/')
        self.assertEqual(response.status_code, 200)

        data = response.json()
        nasi_goreng_availability = next(
            (item for item in data if item['id'] == self.nasi_goreng.id),
            None
        )

        self.assertIsNotNone(nasi_goreng_availability)
        self.assertTrue(nasi_goreng_availability['can_be_made'])
        self.assertEqual(len(nasi_goreng_availability['insufficient_ingredients']), 0)

    def test_04_check_menu_availability_with_insufficient_stock(self):
        """Test that products with insufficient stock are marked as unavailable"""
        # Create recipe for Mie Goreng (INSUFFICIENT stock - only 500g available, needs 800g)
        recipe = Recipe.objects.create(
            product=self.mie_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_mie,
            quantity=Decimal('800.00'),  # Needs 800g but only 500g available
            unit='gram'
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_minyak,
            quantity=Decimal('30.00'),
            unit='ml'
        )

        # Check availability via API
        response = self.client.get('/api/products/check_stock_availability/')
        self.assertEqual(response.status_code, 200)

        data = response.json()
        mie_goreng_availability = next(
            (item for item in data if item['id'] == self.mie_goreng.id),
            None
        )

        self.assertIsNotNone(mie_goreng_availability)
        self.assertFalse(mie_goreng_availability['can_be_made'])
        self.assertGreater(len(mie_goreng_availability['insufficient_ingredients']), 0)

        # Check insufficient ingredient details
        insufficient = mie_goreng_availability['insufficient_ingredients'][0]
        self.assertEqual(insufficient['name'], 'Mie')
        self.assertEqual(insufficient['needed'], 800.0)
        self.assertEqual(insufficient['available'], 500.0)
        self.assertEqual(insufficient['unit'], 'gram')

    def test_05_order_creation_validates_stock(self):
        """Test that order creation validates kitchen stock availability"""
        # Create recipe for Mie Goreng with insufficient stock
        recipe = Recipe.objects.create(
            product=self.mie_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_mie,
            quantity=Decimal('800.00'),  # Needs 800g but only 500g available
            unit='gram'
        )

        # Try to create order - should FAIL validation
        order_data = {
            'branch': self.branch.id,
            'order_type': 'DINE_IN',
            'status': 'CONFIRMED',
            'items': [
                {
                    'product': self.mie_goreng.id,
                    'quantity': 1,
                    'unit_price': str(self.mie_goreng.price)
                }
            ]
        }

        response = self.client.post(
            '/api/orders/',
            data=json.dumps(order_data),
            content_type='application/json'
        )

        # Should return 400 Bad Request due to insufficient stock
        self.assertEqual(response.status_code, 400)
        error_data = response.json()
        self.assertIn('error', error_data)
        self.assertIn('Stok bahan tidak mencukupi', error_data['error'])

    def test_06_order_creation_succeeds_with_sufficient_stock(self):
        """Test that order creation succeeds when stock is sufficient"""
        # Create recipe for Nasi Goreng with sufficient stock
        recipe = Recipe.objects.create(
            product=self.nasi_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_beras,
            quantity=Decimal('250.00'),
            unit='gram'
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_minyak,
            quantity=Decimal('30.00'),
            unit='ml'
        )

        # Create order - should SUCCEED
        order_data = {
            'branch': self.branch.id,
            'order_type': 'DINE_IN',
            'status': 'CONFIRMED',
            'items': [
                {
                    'product': self.nasi_goreng.id,
                    'quantity': 2,
                    'unit_price': str(self.nasi_goreng.price)
                }
            ]
        }

        response = self.client.post(
            '/api/orders/',
            data=json.dumps(order_data),
            content_type='application/json'
        )

        # Should succeed
        self.assertEqual(response.status_code, 201)
        order = Order.objects.latest('id')
        self.assertEqual(order.items.count(), 1)
        self.assertEqual(order.items.first().quantity, 2)

    def test_07_payment_deducts_kitchen_stock(self):
        """Test that payment processing deducts kitchen stock"""
        # Create recipe
        recipe = Recipe.objects.create(
            product=self.nasi_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_beras,
            quantity=Decimal('250.00'),
            unit='gram'
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_minyak,
            quantity=Decimal('30.00'),
            unit='ml'
        )

        # Store initial quantities
        initial_beras = self.kitchen_beras.quantity
        initial_minyak = self.kitchen_minyak.quantity

        # Create order
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=3,
            unit_price=self.nasi_goreng.price
        )

        # Create payment via API
        payment_data = {
            'order': order.id,
            'amount': str(order.total_amount),
            'payment_method': 'CASH',
            'status': 'COMPLETED',
            'processed_by': self.cashier.id,
            'cashier_session': self.session.id
        }

        response = self.client.post(
            '/api/payments/',
            data=json.dumps(payment_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 201)

        # Verify stock was deducted
        self.kitchen_beras.refresh_from_db()
        self.kitchen_minyak.refresh_from_db()

        # Expected: 3 servings × 250g = 750g beras
        # Expected: 3 servings × 30ml = 90ml minyak
        self.assertEqual(self.kitchen_beras.quantity, initial_beras - Decimal('750.00'))
        self.assertEqual(self.kitchen_minyak.quantity, initial_minyak - Decimal('90.00'))

    def test_08_stock_availability_updates_after_order(self):
        """Test that menu availability updates correctly after order depletes stock"""
        # Create recipe that will deplete stock
        recipe = Recipe.objects.create(
            product=self.mie_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_mie,
            quantity=Decimal('200.00'),  # 200g per serving
            unit='gram'
        )

        # Initially should be available (500g stock, needs 200g)
        response = self.client.get('/api/products/check_stock_availability/')
        data = response.json()
        mie_availability = next((item for item in data if item['id'] == self.mie_goreng.id), None)
        self.assertTrue(mie_availability['can_be_made'])

        # Create and pay for order that uses 400g (2 servings)
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.mie_goreng,
            quantity=2,  # 2 × 200g = 400g
            unit_price=self.mie_goreng.price
        )

        # Manually deduct stock (simulating payment)
        self.kitchen_mie.quantity -= Decimal('400.00')
        self.kitchen_mie.save()

        # Now only 100g left, should be UNAVAILABLE for next order (needs 200g)
        response = self.client.get('/api/products/check_stock_availability/')
        data = response.json()
        mie_availability = next((item for item in data if item['id'] == self.mie_goreng.id), None)
        self.assertFalse(mie_availability['can_be_made'])
        self.assertEqual(mie_availability['insufficient_ingredients'][0]['available'], 100.0)

    def test_09_recipe_cost_calculation(self):
        """Test that recipe cost is calculated correctly from kitchen inventory"""
        # Create recipe
        recipe = Recipe.objects.create(
            product=self.nasi_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_beras,
            quantity=Decimal('250.00'),  # 250g @ Rp 12/g = Rp 3,000
            unit='gram'
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_minyak,
            quantity=Decimal('30.00'),  # 30ml @ Rp 14/ml = Rp 420
            unit='ml'
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_bawang,
            quantity=Decimal('50.00'),  # 50g @ Rp 35/g = Rp 1,750
            unit='gram'
        )

        # Total cost: 3,000 + 420 + 1,750 = Rp 5,170
        expected_cost = Decimal('5170.00')
        self.assertEqual(recipe.total_cost, expected_cost)
        self.assertEqual(recipe.cost_per_serving, expected_cost)

        # Profit margin: (25,000 - 5,170) / 25,000 × 100 = 79.32%
        expected_margin = ((25000 - 5170) / 25000) * 100
        self.assertAlmostEqual(float(recipe.profit_margin), expected_margin, places=1)

    def test_10_inventory_transactions_created_on_payment(self):
        """Test that inventory transactions are created when payment is processed"""
        # Create recipe
        recipe = Recipe.objects.create(
            product=self.nasi_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_beras,
            quantity=Decimal('250.00'),
            unit='gram'
        )

        RecipeIngredient.objects.create(
            recipe=recipe,
            inventory_item=self.kitchen_minyak,
            quantity=Decimal('30.00'),
            unit='ml'
        )

        initial_transaction_count = InventoryTransaction.objects.count()

        # Create order
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=1,
            unit_price=self.nasi_goreng.price
        )

        # Create payment via API
        payment_data = {
            'order': order.id,
            'amount': str(order.total_amount),
            'payment_method': 'CASH',
            'status': 'COMPLETED',
            'processed_by': self.cashier.id,
            'cashier_session': self.session.id
        }

        response = self.client.post(
            '/api/payments/',
            data=json.dumps(payment_data),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 201)

        # Should create 2 inventory transactions (one for each ingredient)
        new_transaction_count = InventoryTransaction.objects.count()
        self.assertEqual(new_transaction_count, initial_transaction_count + 2)

        # Verify transaction details
        beras_transaction = InventoryTransaction.objects.filter(
            inventory=self.kitchen_beras,
            transaction_type='OUT'
        ).latest('created_at')

        self.assertEqual(beras_transaction.quantity, Decimal('250.00'))
        self.assertIn('ORDER', beras_transaction.reference_number)
