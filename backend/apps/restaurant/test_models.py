from django.test import TestCase
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from datetime import timedelta
from apps.restaurant.models import (
    Restaurant, Branch, Staff, StaffRole,
    Category, Product, Inventory, InventoryTransaction,
    Order, OrderItem, Payment, Table,
    KitchenOrder, KitchenOrderItem,
    Promotion, Schedule, Report
)


class RestaurantModelTest(TestCase):
    def setUp(self):
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant",
            address="123 Test St",
            phone="+1234567890",
            email="test@restaurant.com"
        )

    def test_restaurant_creation(self):
        self.assertEqual(self.restaurant.name, "Test Restaurant")
        self.assertEqual(self.restaurant.address, "123 Test St")
        self.assertTrue(self.restaurant.is_active)

    def test_restaurant_str(self):
        self.assertEqual(str(self.restaurant), "Test Restaurant")


class BranchModelTest(TestCase):
    def setUp(self):
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant",
            address="123 Test St"
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Main Branch",
            address="456 Branch St",
            phone="+9876543210"
        )

    def test_branch_creation(self):
        self.assertEqual(self.branch.name, "Main Branch")
        self.assertEqual(self.branch.restaurant, self.restaurant)
        self.assertTrue(self.branch.is_active)

    def test_branch_str(self):
        self.assertEqual(str(self.branch), "Test Restaurant - Main Branch")


class StaffModelTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="teststaff",
            password="testpass123"
        )
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant"
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Main Branch"
        )
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role=StaffRole.CASHIER,
            phone="+1234567890"
        )

    def test_staff_creation(self):
        self.assertEqual(self.staff.user, self.user)
        self.assertEqual(self.staff.role, StaffRole.CASHIER)
        self.assertTrue(self.staff.is_active)

    def test_staff_role_choices(self):
        roles = [StaffRole.ADMIN, StaffRole.MANAGER, StaffRole.CASHIER, 
                StaffRole.KITCHEN, StaffRole.WAREHOUSE]
        for role in roles:
            staff = Staff.objects.create(
                user=User.objects.create_user(f"user_{role}"),
                branch=self.branch,
                role=role
            )
            self.assertEqual(staff.role, role)


class ProductModelTest(TestCase):
    def setUp(self):
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant"
        )
        self.category = Category.objects.create(
            restaurant=self.restaurant,
            name="Main Dishes"
        )
        self.product = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name="Test Dish",
            description="Delicious test dish",
            price=Decimal("19.99"),
            cost=Decimal("8.00")
        )

    def test_product_creation(self):
        self.assertEqual(self.product.name, "Test Dish")
        self.assertEqual(self.product.price, Decimal("19.99"))
        self.assertEqual(self.product.cost, Decimal("8.00"))
        self.assertTrue(self.product.is_available)

    def test_product_profit_margin(self):
        expected_margin = ((Decimal("19.99") - Decimal("8.00")) / Decimal("19.99")) * 100
        self.assertAlmostEqual(
            self.product.profit_margin, 
            expected_margin, 
            places=2
        )


class InventoryModelTest(TestCase):
    def setUp(self):
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant"
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Main Branch"
        )
        self.inventory = Inventory.objects.create(
            branch=self.branch,
            name="Rice",
            unit="kg",
            quantity=100,
            min_quantity=20,
            cost_per_unit=Decimal("2.50")
        )

    def test_inventory_creation(self):
        self.assertEqual(self.inventory.name, "Rice")
        self.assertEqual(self.inventory.quantity, 100)
        self.assertEqual(self.inventory.unit, "kg")

    def test_inventory_needs_restock(self):
        self.assertFalse(self.inventory.needs_restock)
        self.inventory.quantity = 15
        self.inventory.save()
        self.assertTrue(self.inventory.needs_restock)

    def test_inventory_transaction(self):
        user = User.objects.create_user("warehouse_user")
        transaction = InventoryTransaction.objects.create(
            inventory=self.inventory,
            transaction_type="IN",
            quantity=50,
            unit_cost=Decimal("2.40"),
            performed_by=user,
            notes="Restocking"
        )
        self.assertEqual(transaction.total_cost, Decimal("120.00"))


class OrderModelTest(TestCase):
    def setUp(self):
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant"
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Main Branch"
        )
        self.user = User.objects.create_user("cashier")
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role=StaffRole.CASHIER
        )
        self.category = Category.objects.create(
            restaurant=self.restaurant,
            name="Main"
        )
        self.product = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name="Burger",
            price=Decimal("9.99")
        )
        self.table = Table.objects.create(
            branch=self.branch,
            number="T1",
            capacity=4
        )

    def test_order_creation(self):
        order = Order.objects.create(
            branch=self.branch,
            table=self.table,
            order_type="DINE_IN",
            status="PENDING",
            created_by=self.staff
        )
        self.assertEqual(order.order_type, "DINE_IN")
        self.assertEqual(order.status, "PENDING")
        self.assertIsNotNone(order.order_number)

    def test_order_with_items(self):
        order = Order.objects.create(
            branch=self.branch,
            order_type="TAKEAWAY",
            created_by=self.staff
        )
        item = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            unit_price=self.product.price
        )
        self.assertEqual(item.subtotal, Decimal("19.98"))
        
    def test_order_total_calculation(self):
        order = Order.objects.create(
            branch=self.branch,
            order_type="DELIVERY",
            created_by=self.staff
        )
        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=3,
            unit_price=self.product.price
        )
        self.assertEqual(order.total_amount, Decimal("29.97"))


class KitchenOrderModelTest(TestCase):
    def setUp(self):
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant"
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Main Branch"
        )
        self.user = User.objects.create_user("cashier")
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role=StaffRole.CASHIER
        )
        self.kitchen_staff = Staff.objects.create(
            user=User.objects.create_user("chef"),
            branch=self.branch,
            role=StaffRole.KITCHEN
        )
        self.category = Category.objects.create(
            restaurant=self.restaurant,
            name="Main"
        )
        self.product = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name="Pizza",
            price=Decimal("15.99"),
            preparation_time=20
        )
        self.order = Order.objects.create(
            branch=self.branch,
            order_type="DINE_IN",
            created_by=self.staff
        )

    def test_kitchen_order_creation(self):
        kitchen_order = KitchenOrder.objects.create(
            order=self.order,
            status="PENDING",
            priority=1
        )
        self.assertEqual(kitchen_order.status, "PENDING")
        self.assertEqual(kitchen_order.priority, 1)

    def test_kitchen_order_item(self):
        kitchen_order = KitchenOrder.objects.create(
            order=self.order,
            status="PREPARING"
        )
        item = KitchenOrderItem.objects.create(
            kitchen_order=kitchen_order,
            product=self.product,
            quantity=2,
            status="PENDING"
        )
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.status, "PENDING")


class PromotionModelTest(TestCase):
    def setUp(self):
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant"
        )
        self.category = Category.objects.create(
            restaurant=self.restaurant,
            name="Drinks"
        )
        self.product = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name="Coffee",
            price=Decimal("4.99")
        )

    def test_promotion_creation(self):
        promotion = Promotion.objects.create(
            restaurant=self.restaurant,
            name="Happy Hour",
            description="50% off all drinks",
            discount_type="PERCENTAGE",
            discount_value=Decimal("50.00"),
            start_date=timezone.now(),
            end_date=timezone.now() + timedelta(days=7)
        )
        self.assertEqual(promotion.name, "Happy Hour")
        self.assertEqual(promotion.discount_type, "PERCENTAGE")
        self.assertTrue(promotion.is_active)

    def test_promotion_validity(self):
        past_promotion = Promotion.objects.create(
            restaurant=self.restaurant,
            name="Old Promo",
            discount_type="FIXED",
            discount_value=Decimal("5.00"),
            start_date=timezone.now() - timedelta(days=10),
            end_date=timezone.now() - timedelta(days=3)
        )
        self.assertFalse(past_promotion.is_valid())

        current_promotion = Promotion.objects.create(
            restaurant=self.restaurant,
            name="Current Promo",
            discount_type="FIXED",
            discount_value=Decimal("5.00"),
            start_date=timezone.now() - timedelta(days=1),
            end_date=timezone.now() + timedelta(days=5)
        )
        self.assertTrue(current_promotion.is_valid())


class ScheduleModelTest(TestCase):
    def setUp(self):
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant"
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Main Branch"
        )
        self.user = User.objects.create_user("staff1")
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role=StaffRole.CASHIER
        )

    def test_schedule_creation(self):
        schedule = Schedule.objects.create(
            staff=self.staff,
            date=timezone.now().date(),
            shift_type="MORNING",
            start_time=timezone.now().time(),
            end_time=(timezone.now() + timedelta(hours=8)).time()
        )
        self.assertEqual(schedule.shift_type, "MORNING")
        self.assertEqual(schedule.staff, self.staff)

    def test_schedule_conflicts(self):
        date = timezone.now().date()
        Schedule.objects.create(
            staff=self.staff,
            date=date,
            shift_type="MORNING",
            start_time="08:00",
            end_time="16:00"
        )
        
        with self.assertRaises(ValidationError):
            conflicting = Schedule(
                staff=self.staff,
                date=date,
                shift_type="AFTERNOON",
                start_time="14:00",
                end_time="22:00"
            )
            conflicting.full_clean()