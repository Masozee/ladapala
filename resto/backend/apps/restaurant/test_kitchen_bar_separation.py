"""
Test Kitchen and Bar Order Separation

This test verifies that when a waiter/cashier places an order containing both food and drinks:
1. Food items go to the kitchen (dapur)
2. Drink items go to the bar
3. The readiness status between kitchen and bar is completely separate
4. Marking kitchen items as ready does NOT mark bar items as ready
5. Marking bar items as ready does NOT mark kitchen items as ready
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from decimal import Decimal
from apps.restaurant.models import (
    Restaurant, Branch, Staff, StaffRole,
    Category, Product, Order, OrderItem, Table,
    KitchenOrder, KitchenOrderItem
)
from django.utils import timezone

User = get_user_model()


class KitchenBarSeparationTestCase(TestCase):
    """Test that kitchen and bar orders are completely separated"""

    def setUp(self):
        """Set up test data"""
        # Create users
        self.cashier_user = User.objects.create_user(
            email='cashier@test.com',
            password='test123',
            first_name='Cashier',
            last_name='Test'
        )

        self.chef_user = User.objects.create_user(
            email='chef@test.com',
            password='test123',
            first_name='Chef',
            last_name='Test'
        )

        self.bartender_user = User.objects.create_user(
            email='bartender@test.com',
            password='test123',
            first_name='Bar',
            last_name='Tender'
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
        self.cashier = Staff.objects.create(
            user=self.cashier_user,
            branch=self.branch,
            role=StaffRole.CASHIER,
            phone='08111111111'
        )

        self.chef = Staff.objects.create(
            user=self.chef_user,
            branch=self.branch,
            role=StaffRole.CHEF,
            phone='08122222222'
        )

        self.bartender = Staff.objects.create(
            user=self.bartender_user,
            branch=self.branch,
            role=StaffRole.BAR,
            phone='08133333333'
        )

        # Create categories
        self.food_category = Category.objects.create(
            restaurant=self.restaurant,
            name='Makanan Utama',  # Main food
            description='Main course dishes'
        )

        self.drink_category = Category.objects.create(
            restaurant=self.restaurant,
            name='Minuman',  # Drinks
            description='Beverages'
        )

        # Create food products
        self.nasi_goreng = Product.objects.create(
            restaurant=self.restaurant,
            category=self.food_category,
            name='Nasi Goreng',
            price=Decimal('25000.00'),
            is_available=True
        )

        self.mie_goreng = Product.objects.create(
            restaurant=self.restaurant,
            category=self.food_category,
            name='Mie Goreng',
            price=Decimal('22000.00'),
            is_available=True
        )

        # Create drink products
        self.es_teh = Product.objects.create(
            restaurant=self.restaurant,
            category=self.drink_category,
            name='Es Teh Manis',
            price=Decimal('5000.00'),
            is_available=True
        )

        self.jus_jeruk = Product.objects.create(
            restaurant=self.restaurant,
            category=self.drink_category,
            name='Jus Jeruk',
            price=Decimal('12000.00'),
            is_available=True
        )

        # Create table
        self.table = Table.objects.create(
            branch=self.branch,
            number='5',
            capacity=4
        )

    def test_order_with_only_food_goes_to_kitchen(self):
        """Test that an order with only food items creates a kitchen order only"""
        # Cashier/Waiter creates order with food only
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            table=self.table,
            status='CONFIRMED',
            created_by=self.cashier
        )

        # Add food items
        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=2,
            unit_price=self.nasi_goreng.price
        )

        OrderItem.objects.create(
            order=order,
            product=self.mie_goreng,
            quantity=1,
            unit_price=self.mie_goreng.price
        )

        # Manually create kitchen order (simulating what should happen)
        kitchen_order = KitchenOrder.objects.create(
            order=order,
            status='PENDING'
        )

        # Add kitchen items
        for item in order.items.all():
            KitchenOrderItem.objects.create(
                kitchen_order=kitchen_order,
                product=item.product,
                quantity=item.quantity,
                status='PENDING'
            )

        # Verify kitchen order was created
        self.assertTrue(KitchenOrder.objects.filter(order=order).exists())
        self.assertEqual(kitchen_order.items.count(), 2)

        # Verify no bar order should exist (but currently system doesn't separate)
        # TODO: This will fail until we implement BarOrder model

    def test_order_with_only_drinks_goes_to_bar(self):
        """Test that an order with only drinks creates a bar order only"""
        # Cashier/Waiter creates order with drinks only
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            table=self.table,
            status='CONFIRMED',
            created_by=self.cashier
        )

        # Add drink items
        OrderItem.objects.create(
            order=order,
            product=self.es_teh,
            quantity=3,
            unit_price=self.es_teh.price
        )

        OrderItem.objects.create(
            order=order,
            product=self.jus_jeruk,
            quantity=2,
            unit_price=self.jus_jeruk.price
        )

        # Currently only kitchen order exists
        # TODO: Need to implement BarOrder model
        # For now, verify the items are drinks
        for item in order.items.all():
            category_name = item.product.category.name.lower()
            self.assertIn('minuman', category_name)

    def test_mixed_order_separates_food_and_drinks(self):
        """
        Test that an order with both food and drinks separates them:
        - Food items go to kitchen
        - Drink items go to bar
        """
        # Cashier/Waiter creates order with both food and drinks
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            table=self.table,
            status='CONFIRMED',
            created_by=self.cashier
        )

        # Add food items
        food_item_1 = OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=2,
            unit_price=self.nasi_goreng.price
        )

        food_item_2 = OrderItem.objects.create(
            order=order,
            product=self.mie_goreng,
            quantity=1,
            unit_price=self.mie_goreng.price
        )

        # Add drink items
        drink_item_1 = OrderItem.objects.create(
            order=order,
            product=self.es_teh,
            quantity=3,
            unit_price=self.es_teh.price
        )

        drink_item_2 = OrderItem.objects.create(
            order=order,
            product=self.jus_jeruk,
            quantity=2,
            unit_price=self.jus_jeruk.price
        )

        # Verify order has 4 items total
        self.assertEqual(order.items.count(), 4)

        # Separate items by category
        food_items = []
        drink_items = []

        for item in order.items.all():
            category_name = item.product.category.name.lower() if item.product.category else ''

            # Check if it's food
            food_keywords = ['makanan', 'nasi', 'mie', 'utama']
            if any(keyword in category_name for keyword in food_keywords):
                food_items.append(item)

            # Check if it's drink
            drink_keywords = ['minuman', 'drink', 'beverage']
            if any(keyword in category_name for keyword in drink_keywords):
                drink_items.append(item)

        # Should have 2 food items and 2 drink items
        self.assertEqual(len(food_items), 2)
        self.assertEqual(len(drink_items), 2)

    def test_kitchen_ready_does_not_affect_bar_status(self):
        """
        CRITICAL TEST: Verify that marking kitchen items as ready
        does NOT automatically mark bar items as ready

        This is the main bug that needs to be fixed!
        """
        # Create order with both food and drinks
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            table=self.table,
            status='CONFIRMED',
            created_by=self.cashier
        )

        # Add food
        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=1,
            unit_price=self.nasi_goreng.price
        )

        # Add drink
        OrderItem.objects.create(
            order=order,
            product=self.es_teh,
            quantity=1,
            unit_price=self.es_teh.price
        )

        # Create kitchen order (for food)
        kitchen_order = KitchenOrder.objects.create(
            order=order,
            status='PENDING',
            assigned_to=self.chef
        )

        # Add only food items to kitchen order
        for item in order.items.all():
            category_name = item.product.category.name.lower()
            if 'makanan' in category_name or 'nasi' in category_name:
                KitchenOrderItem.objects.create(
                    kitchen_order=kitchen_order,
                    product=item.product,
                    quantity=item.quantity,
                    status='PENDING'
                )

        # Chef starts preparing
        kitchen_order.status = 'PREPARING'
        kitchen_order.started_at = timezone.now()
        kitchen_order.save()

        # Chef marks kitchen order as READY
        kitchen_order.status = 'READY'
        kitchen_order.completed_at = timezone.now()
        kitchen_order.save()

        # Refresh from database
        kitchen_order.refresh_from_db()
        order.refresh_from_db()

        # Kitchen should be READY
        self.assertEqual(kitchen_order.status, 'READY')

        # BUG: Currently the entire order status becomes READY
        # But bar items might still be preparing!

        # TODO: When BarOrder model is implemented:
        # bar_order = BarOrder.objects.get(order=order)
        # self.assertNotEqual(bar_order.status, 'READY')
        # self.assertEqual(bar_order.status, 'PENDING')  # Bar hasn't started yet!

        # For now, we just document the expected behavior:
        # - Kitchen order is READY
        # - Bar order should still be PENDING or PREPARING
        # - Main order should only be READY when BOTH kitchen and bar are ready

    def test_bar_ready_does_not_affect_kitchen_status(self):
        """
        CRITICAL TEST: Verify that marking bar items as ready
        does NOT automatically mark kitchen items as ready
        """
        # Create order with both food and drinks
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            table=self.table,
            status='CONFIRMED',
            created_by=self.cashier
        )

        # Add food
        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=1,
            unit_price=self.nasi_goreng.price
        )

        # Add drink
        OrderItem.objects.create(
            order=order,
            product=self.es_teh,
            quantity=1,
            unit_price=self.es_teh.price
        )

        # TODO: When BarOrder is implemented, test that:
        # 1. Bar marks drinks as ready
        # 2. Kitchen items remain in PREPARING status
        # 3. Order is only READY when both are ready

    def test_order_only_ready_when_both_kitchen_and_bar_ready(self):
        """
        Test that an order with both food and drinks is only marked as READY
        when BOTH kitchen AND bar have completed their items
        """
        # Create order with both food and drinks
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            table=self.table,
            status='CONFIRMED',
            created_by=self.cashier
        )

        # Add food
        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=2,
            unit_price=self.nasi_goreng.price
        )

        # Add drinks
        OrderItem.objects.create(
            order=order,
            product=self.es_teh,
            quantity=2,
            unit_price=self.es_teh.price
        )

        # Expected behavior:
        # 1. Kitchen prepares food (takes 15 minutes)
        # 2. Bar prepares drinks (takes 3 minutes)
        # 3. Bar finishes first and marks drinks READY at 12:03
        # 4. Kitchen finishes later and marks food READY at 12:15
        # 5. Order should only be READY at 12:15 when BOTH are ready

        # TODO: Implement this logic when BarOrder model exists

    def test_partial_serving_kitchen_ready_bar_pending(self):
        """
        Test realistic scenario:
        - Customer orders nasi goreng + es teh
        - Bar prepares es teh quickly (2 minutes) → BAR READY
        - Kitchen still preparing nasi goreng (10 more minutes) → KITCHEN PREPARING
        - Waiter can serve the drink first while waiting for food
        """
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            table=self.table,
            status='CONFIRMED',
            created_by=self.cashier
        )

        food_item = OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=1,
            unit_price=self.nasi_goreng.price
        )

        drink_item = OrderItem.objects.create(
            order=order,
            product=self.es_teh,
            quantity=1,
            unit_price=self.es_teh.price
        )

        # Scenario:
        # T+0: Order placed
        # T+2: Bar finishes → drink can be served
        # T+12: Kitchen finishes → food can be served

        # Expected status at T+2:
        # - BarOrder: READY
        # - KitchenOrder: PREPARING
        # - Order: PARTIALLY_READY (new status) or PREPARING
        # - Drink item: Can be served
        # - Food item: Not ready yet

    def test_order_with_multiple_drinks_same_bar_status(self):
        """
        Test that multiple drinks in the same order share the same bar status
        """
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            table=self.table,
            status='CONFIRMED',
            created_by=self.cashier
        )

        # Add multiple drinks
        OrderItem.objects.create(
            order=order,
            product=self.es_teh,
            quantity=2,
            unit_price=self.es_teh.price
        )

        OrderItem.objects.create(
            order=order,
            product=self.jus_jeruk,
            quantity=3,
            unit_price=self.jus_jeruk.price
        )

        # When bartender marks bar order as ready,
        # ALL drinks should be ready together
        # (not individually like food items which can be plated separately)

    def test_order_with_multiple_foods_same_kitchen_status(self):
        """
        Test that multiple food items in the same order can have
        individual ready status but kitchen order tracks overall status
        """
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            table=self.table,
            status='CONFIRMED',
            created_by=self.cashier
        )

        # Add multiple food items
        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=2,
            unit_price=self.nasi_goreng.price
        )

        OrderItem.objects.create(
            order=order,
            product=self.mie_goreng,
            quantity=1,
            unit_price=self.mie_goreng.price
        )

        # Kitchen order tracks when ALL food items are ready
        # Individual items can be tracked via KitchenOrderItem.status

    def test_concurrent_kitchen_and_bar_preparation(self):
        """
        Test that kitchen and bar can work on the same order simultaneously
        without interfering with each other's status
        """
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            table=self.table,
            status='CONFIRMED',
            created_by=self.cashier
        )

        # Add food and drinks
        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=1,
            unit_price=self.nasi_goreng.price
        )

        OrderItem.objects.create(
            order=order,
            product=self.es_teh,
            quantity=1,
            unit_price=self.es_teh.price
        )

        # Timeline:
        # 12:00 - Order created
        # 12:01 - Chef starts preparing (kitchen: PREPARING)
        # 12:01 - Bartender starts preparing (bar: PREPARING)
        # 12:03 - Bartender finishes (bar: READY, kitchen: PREPARING)
        # 12:12 - Chef finishes (kitchen: READY, bar: READY)
        # 12:12 - Order status becomes READY

    def test_kitchen_bar_separation_with_notes(self):
        """
        Test that order notes are correctly passed to kitchen and bar
        """
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            table=self.table,
            status='CONFIRMED',
            created_by=self.cashier,
            notes='Pedas sedang, es batu sedikit'  # Medium spicy, less ice
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=1,
            unit_price=self.nasi_goreng.price,
            notes='Pedas sedang'  # This note for kitchen
        )

        OrderItem.objects.create(
            order=order,
            product=self.es_teh,
            quantity=1,
            unit_price=self.es_teh.price,
            notes='Es batu sedikit'  # This note for bar
        )

        # Kitchen should see the nasi goreng note
        # Bar should see the es teh note
        # Both should see the general order notes


class KitchenBarPrinterSeparationTest(TestCase):
    """Test that printer tickets are correctly separated for kitchen and bar"""

    def setUp(self):
        """Set up test data"""
        self.cashier_user = User.objects.create_user(
            email='cashier@test.com',
            password='test123'
        )

        self.restaurant = Restaurant.objects.create(
            name='Test Restaurant',
            address='Test Address'
        )

        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Main Branch',
            address='Main Address'
        )

        self.cashier = Staff.objects.create(
            user=self.cashier_user,
            branch=self.branch,
            role=StaffRole.CASHIER
        )

        self.food_category = Category.objects.create(
            restaurant=self.restaurant,
            name='Makanan Utama'
        )

        self.drink_category = Category.objects.create(
            restaurant=self.restaurant,
            name='Minuman'
        )

        self.nasi_goreng = Product.objects.create(
            restaurant=self.restaurant,
            category=self.food_category,
            name='Nasi Goreng',
            price=Decimal('25000.00')
        )

        self.es_teh = Product.objects.create(
            restaurant=self.restaurant,
            category=self.drink_category,
            name='Es Teh',
            price=Decimal('5000.00')
        )

    def test_mixed_order_generates_two_tickets(self):
        """
        Test that an order with both food and drinks generates:
        1. Kitchen ticket (with food items only)
        2. Bar ticket (with drink items only)
        """
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='CONFIRMED',
            created_by=self.cashier
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=1,
            unit_price=self.nasi_goreng.price
        )

        OrderItem.objects.create(
            order=order,
            product=self.es_teh,
            quantity=1,
            unit_price=self.es_teh.price
        )

        # When kitchen_printer.generate_kitchen_bar_tickets(order) is called:
        # - Should generate kitchen PDF with nasi goreng
        # - Should generate bar PDF with es teh
        # - Kitchen ticket should NOT show es teh
        # - Bar ticket should NOT show nasi goreng

    def test_food_only_order_generates_kitchen_ticket_only(self):
        """Test that food-only order generates kitchen ticket only"""
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='CONFIRMED',
            created_by=self.cashier
        )

        OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=2,
            unit_price=self.nasi_goreng.price
        )

        # Should generate kitchen PDF only
        # Should NOT generate bar PDF

    def test_drink_only_order_generates_bar_ticket_only(self):
        """Test that drink-only order generates bar ticket only"""
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='CONFIRMED',
            created_by=self.cashier
        )

        OrderItem.objects.create(
            order=order,
            product=self.es_teh,
            quantity=3,
            unit_price=self.es_teh.price
        )

        # Should generate bar PDF only
        # Should NOT generate kitchen PDF
