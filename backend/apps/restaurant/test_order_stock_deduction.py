from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from apps.restaurant.models import (
    Restaurant, Branch, Staff, StaffRole,
    Category, Product, Inventory, InventoryTransaction,
    Recipe, RecipeIngredient,
    Order, OrderItem, Payment, CashierSession
)

User = get_user_model()


class OrderStockDeductionTestCase(TestCase):
    """Test that kitchen stock is deducted when orders are paid"""

    def setUp(self):
        """Set up test data"""
        # Create user
        self.user = User.objects.create_user(
            email='cashier@example.com',
            password='testpass123',
            first_name='Cashier',
            last_name='Test'
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

        # Create staff (cashier)
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role=StaffRole.CASHIER,
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

        # Create products
        self.nasi_goreng = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Nasi Goreng',
            price=Decimal('25000.00'),
            is_available=True
        )

        self.ayam_goreng = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Ayam Goreng',
            price=Decimal('30000.00'),
            is_available=True
        )

        # Create kitchen inventory (BOM precision units)
        self.kitchen_beras = Inventory.objects.create(
            branch=self.branch,
            name='Beras Premium',
            unit='gram',
            quantity=Decimal('50000.00'),  # 50kg = 50,000 grams
            min_quantity=Decimal('10000.00'),
            cost_per_unit=Decimal('12.00'),
            location='KITCHEN'
        )

        self.kitchen_ayam = Inventory.objects.create(
            branch=self.branch,
            name='Ayam Kampung',
            unit='gram',
            quantity=Decimal('20000.00'),  # 20kg = 20,000 grams
            min_quantity=Decimal('5000.00'),
            cost_per_unit=Decimal('37.50'),
            location='KITCHEN'
        )

        self.kitchen_minyak = Inventory.objects.create(
            branch=self.branch,
            name='Minyak Goreng',
            unit='ml',
            quantity=Decimal('10000.00'),  # 10 liters = 10,000 ml
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

        # Create recipe for Nasi Goreng
        self.recipe_nasi_goreng = Recipe.objects.create(
            product=self.nasi_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        # Nasi Goreng ingredients per serving
        RecipeIngredient.objects.create(
            recipe=self.recipe_nasi_goreng,
            inventory_item=self.kitchen_beras,
            quantity=Decimal('250.000'),  # 250 grams
            unit='gram'
        )

        RecipeIngredient.objects.create(
            recipe=self.recipe_nasi_goreng,
            inventory_item=self.kitchen_minyak,
            quantity=Decimal('30.000'),  # 30 ml
            unit='ml'
        )

        RecipeIngredient.objects.create(
            recipe=self.recipe_nasi_goreng,
            inventory_item=self.kitchen_bawang,
            quantity=Decimal('50.000'),  # 50 grams
            unit='gram'
        )

        # Create recipe for Ayam Goreng
        self.recipe_ayam_goreng = Recipe.objects.create(
            product=self.ayam_goreng,
            branch=self.branch,
            serving_size=Decimal('1.00')
        )

        # Ayam Goreng ingredients per serving
        RecipeIngredient.objects.create(
            recipe=self.recipe_ayam_goreng,
            inventory_item=self.kitchen_ayam,
            quantity=Decimal('300.000'),  # 300 grams
            unit='gram'
        )

        RecipeIngredient.objects.create(
            recipe=self.recipe_ayam_goreng,
            inventory_item=self.kitchen_minyak,
            quantity=Decimal('50.000'),  # 50 ml
            unit='ml'
        )

    def deduct_ingredients_for_order(self, order):
        """Simulate the ingredient deduction process from PaymentViewSet"""
        for order_item in order.items.all():
            try:
                recipe = order_item.product.recipe
                quantity_ordered = order_item.quantity

                for recipe_ingredient in recipe.ingredients.all():
                    inventory_item = recipe_ingredient.inventory_item
                    total_quantity_needed = float(recipe_ingredient.quantity) * quantity_ordered

                    # Update inventory quantity
                    inventory_item.quantity -= Decimal(str(total_quantity_needed))
                    inventory_item.save()

                    # Create inventory transaction record
                    InventoryTransaction.objects.create(
                        inventory=inventory_item,
                        transaction_type='OUT',
                        quantity=Decimal(str(total_quantity_needed)),
                        unit_cost=inventory_item.cost_per_unit,
                        reference_number=f"ORDER-{order.id}",
                        performed_by=self.user,
                        notes=f"Auto-deduction for {quantity_ordered}x {order_item.product.name}"
                    )
            except Recipe.DoesNotExist:
                pass

    def test_single_order_deducts_kitchen_stock(self):
        """Test that ordering 1 Nasi Goreng deducts correct amounts from kitchen"""
        # Store initial quantities
        initial_beras = self.kitchen_beras.quantity
        initial_minyak = self.kitchen_minyak.quantity
        initial_bawang = self.kitchen_bawang.quantity

        # Create order for 1 Nasi Goreng
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

        # Process payment (triggers stock deduction)
        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        # Deduct ingredients
        self.deduct_ingredients_for_order(order)

        # Refresh inventory from database
        self.kitchen_beras.refresh_from_db()
        self.kitchen_minyak.refresh_from_db()
        self.kitchen_bawang.refresh_from_db()

        # Expected deductions for 1 serving Nasi Goreng:
        # Beras: 250g, Minyak: 30ml, Bawang: 50g
        self.assertEqual(self.kitchen_beras.quantity, initial_beras - Decimal('250.00'))
        self.assertEqual(self.kitchen_minyak.quantity, initial_minyak - Decimal('30.00'))
        self.assertEqual(self.kitchen_bawang.quantity, initial_bawang - Decimal('50.00'))

    def test_multiple_servings_deducts_correctly(self):
        """Test that ordering 5 Nasi Goreng deducts 5x the ingredients"""
        initial_beras = self.kitchen_beras.quantity
        initial_minyak = self.kitchen_minyak.quantity
        initial_bawang = self.kitchen_bawang.quantity

        # Order 5 servings
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=5,
            unit_price=self.nasi_goreng.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        # Refresh
        self.kitchen_beras.refresh_from_db()
        self.kitchen_minyak.refresh_from_db()
        self.kitchen_bawang.refresh_from_db()

        # Expected: 5x the recipe amounts
        # Beras: 5 × 250g = 1,250g
        # Minyak: 5 × 30ml = 150ml
        # Bawang: 5 × 50g = 250g
        self.assertEqual(self.kitchen_beras.quantity, initial_beras - Decimal('1250.00'))
        self.assertEqual(self.kitchen_minyak.quantity, initial_minyak - Decimal('150.00'))
        self.assertEqual(self.kitchen_bawang.quantity, initial_bawang - Decimal('250.00'))

    def test_multiple_items_in_order(self):
        """Test ordering multiple different items in one order"""
        initial_beras = self.kitchen_beras.quantity
        initial_ayam = self.kitchen_ayam.quantity
        initial_minyak = self.kitchen_minyak.quantity
        initial_bawang = self.kitchen_bawang.quantity

        # Order 2 Nasi Goreng + 3 Ayam Goreng
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=2,
            unit_price=self.nasi_goreng.price
        )

        OrderItem.objects.create(
            order=order,
            product=self.ayam_goreng,
            quantity=3,
            unit_price=self.ayam_goreng.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        # Refresh
        self.kitchen_beras.refresh_from_db()
        self.kitchen_ayam.refresh_from_db()
        self.kitchen_minyak.refresh_from_db()
        self.kitchen_bawang.refresh_from_db()

        # Expected deductions:
        # Nasi Goreng (2x): Beras 500g, Minyak 60ml, Bawang 100g
        # Ayam Goreng (3x): Ayam 900g, Minyak 150ml
        # Total: Beras 500g, Ayam 900g, Minyak 210ml, Bawang 100g
        self.assertEqual(self.kitchen_beras.quantity, initial_beras - Decimal('500.00'))
        self.assertEqual(self.kitchen_ayam.quantity, initial_ayam - Decimal('900.00'))
        self.assertEqual(self.kitchen_minyak.quantity, initial_minyak - Decimal('210.00'))  # 60 + 150
        self.assertEqual(self.kitchen_bawang.quantity, initial_bawang - Decimal('100.00'))

    def test_inventory_transactions_created(self):
        """Test that inventory OUT transactions are created for each ingredient"""
        initial_transaction_count = InventoryTransaction.objects.filter(
            transaction_type='OUT'
        ).count()

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

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        # Nasi Goreng has 3 ingredients, should create 3 OUT transactions
        new_transaction_count = InventoryTransaction.objects.filter(
            transaction_type='OUT'
        ).count()

        self.assertEqual(new_transaction_count, initial_transaction_count + 3)

        # Verify transaction details
        beras_transaction = InventoryTransaction.objects.filter(
            inventory=self.kitchen_beras,
            transaction_type='OUT',
            reference_number=f'ORDER-{order.id}'
        ).first()

        self.assertIsNotNone(beras_transaction)
        self.assertEqual(beras_transaction.quantity, Decimal('250.00'))
        self.assertEqual(beras_transaction.notes, f'Auto-deduction for 1x Nasi Goreng')

    def test_shared_ingredient_across_recipes(self):
        """Test that shared ingredients (minyak) are deducted correctly across different dishes"""
        initial_minyak = self.kitchen_minyak.quantity

        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        # Both dishes use minyak
        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=1,  # Uses 30ml minyak
            unit_price=self.nasi_goreng.price
        )

        OrderItem.objects.create(
            order=order,
            product=self.ayam_goreng,
            quantity=1,  # Uses 50ml minyak
            unit_price=self.ayam_goreng.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        self.kitchen_minyak.refresh_from_db()

        # Should deduct total: 30ml + 50ml = 80ml
        self.assertEqual(self.kitchen_minyak.quantity, initial_minyak - Decimal('80.00'))

    def test_stock_value_decreases_after_deduction(self):
        """Test that total inventory value decreases after ingredient deduction"""
        # Calculate initial total value
        initial_value = sum([
            self.kitchen_beras.total_value,
            self.kitchen_ayam.total_value,
            self.kitchen_minyak.total_value,
            self.kitchen_bawang.total_value
        ])

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

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        # Refresh all inventory items
        self.kitchen_beras.refresh_from_db()
        self.kitchen_ayam.refresh_from_db()
        self.kitchen_minyak.refresh_from_db()
        self.kitchen_bawang.refresh_from_db()

        # Calculate new total value
        new_value = sum([
            self.kitchen_beras.total_value,
            self.kitchen_ayam.total_value,
            self.kitchen_minyak.total_value,
            self.kitchen_bawang.total_value
        ])

        # Value should decrease
        self.assertLess(new_value, initial_value)

    def test_low_stock_detection_after_deduction(self):
        """Test that low stock is detected when inventory falls below minimum"""
        # Set bawang to just above minimum
        self.kitchen_bawang.quantity = Decimal('1100.00')  # Min is 1000g
        self.kitchen_bawang.save()

        self.assertFalse(self.kitchen_bawang.needs_restock)

        # Order that will bring it below minimum
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=3,  # Uses 3 × 50g = 150g bawang
            unit_price=self.nasi_goreng.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        self.deduct_ingredients_for_order(order)

        self.kitchen_bawang.refresh_from_db()

        # Should be 1100 - 150 = 950g, which is below minimum of 1000g
        self.assertEqual(self.kitchen_bawang.quantity, Decimal('950.00'))
        self.assertTrue(self.kitchen_bawang.needs_restock)

    def test_product_without_recipe_no_deduction(self):
        """Test that products without recipes don't cause errors and don't deduct stock"""
        # Create product without recipe
        drink = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Es Teh',
            price=Decimal('5000.00'),
            is_available=True
        )

        initial_beras = self.kitchen_beras.quantity

        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='COMPLETED'
        )

        OrderItem.objects.create(
            order=order,
            product=drink,
            quantity=2,
            unit_price=drink.price
        )

        Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method='CASH',
            status='COMPLETED',
            processed_by=self.staff,
            cashier_session=self.session
        )

        # Should not raise error
        self.deduct_ingredients_for_order(order)

        # No stock should be deducted
        self.kitchen_beras.refresh_from_db()
        self.assertEqual(self.kitchen_beras.quantity, initial_beras)
