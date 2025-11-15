"""
Tests for Staff Session and Order Tracking Feature
Tests the new functionality for tracking who takes, prepares, and serves orders
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.core.exceptions import ValidationError
from django.utils import timezone
from decimal import Decimal
from datetime import date, time, timedelta

from apps.restaurant.models import (
    Restaurant, Branch, Staff, StaffRole,
    StaffSession, Schedule, Order, OrderItem,
    Product, Category
)

User = get_user_model()


# =============================================================================
# STAFF SESSION TESTS
# =============================================================================

class StaffSessionTestCase(TestCase):
    """Test StaffSession model and session management"""

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

        # Create users and staff
        self.chef_user = User.objects.create_user(
            email='chef@test.com',
            password='test123',
            first_name='Chef',
            last_name='Ridwan'
        )
        self.chef = Staff.objects.create(
            user=self.chef_user,
            branch=self.branch,
            role=StaffRole.CHEF,
            phone='08123456789'
        )

        self.waitress_user = User.objects.create_user(
            email='waitress@test.com',
            password='test123',
            first_name='Ayu',
            last_name='Lestari'
        )
        self.waitress = Staff.objects.create(
            user=self.waitress_user,
            branch=self.branch,
            role=StaffRole.WAITRESS,
            phone='08123456790'
        )

        self.bar_user = User.objects.create_user(
            email='bar@test.com',
            password='test123',
            first_name='Rizki',
            last_name='Bar'
        )
        self.bar_staff = Staff.objects.create(
            user=self.bar_user,
            branch=self.branch,
            role=StaffRole.BAR,
            phone='08123456791'
        )

        self.manager_user = User.objects.create_user(
            email='manager@test.com',
            password='test123',
            first_name='Manager',
            last_name='Test'
        )
        self.manager = Staff.objects.create(
            user=self.manager_user,
            branch=self.branch,
            role=StaffRole.MANAGER,
            phone='08123456792'
        )

        # Create schedule for today
        today = date.today()
        self.chef_schedule = Schedule.objects.create(
            staff=self.chef,
            date=today,
            shift_type='MORNING',
            start_time=time(7, 0),
            end_time=time(15, 0),
            is_confirmed=True
        )

        self.waitress_schedule = Schedule.objects.create(
            staff=self.waitress,
            date=today,
            shift_type='MORNING',
            start_time=time(7, 0),
            end_time=time(15, 0),
            is_confirmed=True
        )

    def test_create_staff_session_with_schedule(self):
        """Test creating a staff session when staff has a valid schedule"""
        session = StaffSession.objects.create(
            staff=self.chef,
            branch=self.branch,
            schedule=self.chef_schedule,
            shift_type='MORNING'
        )

        self.assertEqual(session.staff, self.chef)
        self.assertEqual(session.branch, self.branch)
        self.assertEqual(session.shift_type, 'MORNING')
        self.assertEqual(session.status, 'OPEN')
        self.assertIsNotNone(session.opened_at)
        self.assertIsNone(session.closed_at)

    def test_cannot_have_multiple_open_sessions(self):
        """Test that a staff member cannot have multiple open sessions"""
        # Create first session
        StaffSession.objects.create(
            staff=self.chef,
            branch=self.branch,
            schedule=self.chef_schedule,
            shift_type='MORNING'
        )

        # Try to create second session - should fail validation
        with self.assertRaises(ValidationError):
            session2 = StaffSession(
                staff=self.chef,
                branch=self.branch,
                shift_type='MORNING'
            )
            session2.full_clean()

    def test_session_with_manager_override(self):
        """Test creating session without schedule using manager override"""
        session = StaffSession.objects.create(
            staff=self.bar_staff,
            branch=self.branch,
            shift_type='EVENING',
            override_by=self.manager,
            override_reason='Emergency coverage needed'
        )

        self.assertEqual(session.staff, self.bar_staff)
        self.assertEqual(session.override_by, self.manager)
        self.assertEqual(session.override_reason, 'Emergency coverage needed')
        self.assertIsNone(session.schedule)

    def test_close_session(self):
        """Test closing a staff session"""
        session = StaffSession.objects.create(
            staff=self.chef,
            branch=self.branch,
            schedule=self.chef_schedule,
            shift_type='MORNING'
        )

        self.assertEqual(session.status, 'OPEN')
        self.assertIsNone(session.closed_at)

        # Close the session
        session.close_session()

        self.assertEqual(session.status, 'CLOSED')
        self.assertIsNotNone(session.closed_at)

    def test_session_duration_calculation(self):
        """Test session duration calculation"""
        session = StaffSession.objects.create(
            staff=self.chef,
            branch=self.branch,
            schedule=self.chef_schedule,
            shift_type='MORNING'
        )

        # Duration should be calculated from opened_at to now
        duration = session.duration
        self.assertGreater(duration, 0)
        self.assertIsInstance(duration, float)

    def test_performance_metrics_initialization(self):
        """Test that performance metrics start at zero"""
        session = StaffSession.objects.create(
            staff=self.chef,
            branch=self.branch,
            schedule=self.chef_schedule,
            shift_type='MORNING'
        )

        self.assertEqual(session.orders_taken_count, 0)
        self.assertEqual(session.orders_prepared_count, 0)
        self.assertEqual(session.orders_served_count, 0)
        self.assertEqual(session.items_prepared_count, 0)

    def test_multiple_staff_same_shift(self):
        """Test multiple staff can have sessions in the same shift"""
        chef_session = StaffSession.objects.create(
            staff=self.chef,
            branch=self.branch,
            schedule=self.chef_schedule,
            shift_type='MORNING'
        )

        waitress_session = StaffSession.objects.create(
            staff=self.waitress,
            branch=self.branch,
            schedule=self.waitress_schedule,
            shift_type='MORNING'
        )

        self.assertEqual(chef_session.shift_type, waitress_session.shift_type)
        self.assertNotEqual(chef_session.staff, waitress_session.staff)

    def test_session_string_representation(self):
        """Test session string representation"""
        session = StaffSession.objects.create(
            staff=self.chef,
            branch=self.branch,
            schedule=self.chef_schedule,
            shift_type='MORNING'
        )

        string_repr = str(session)
        self.assertIn('Chef Ridwan', string_repr)
        self.assertIn('MORNING', string_repr)
        self.assertIn('OPEN', string_repr)


# =============================================================================
# ORDER TRACKING TESTS
# =============================================================================

class OrderTrackingTestCase(TestCase):
    """Test order tracking with staff assignment"""

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

        # Create category and product
        self.category = Category.objects.create(
            restaurant=self.restaurant,
            name='Main Dishes'
        )
        self.product = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Nasi Goreng',
            price=Decimal('25000.00'),
            is_available=True
        )

        # Create staff members
        self.waitress_user = User.objects.create_user(
            email='waitress@test.com',
            password='test123',
            first_name='Ayu',
            last_name='Lestari'
        )
        self.waitress = Staff.objects.create(
            user=self.waitress_user,
            branch=self.branch,
            role=StaffRole.WAITRESS,
            phone='08123456789'
        )

        self.chef_user = User.objects.create_user(
            email='chef@test.com',
            password='test123',
            first_name='Chef',
            last_name='Ridwan'
        )
        self.chef = Staff.objects.create(
            user=self.chef_user,
            branch=self.branch,
            role=StaffRole.CHEF,
            phone='08123456790'
        )

        # Create sessions
        today = date.today()
        self.waitress_schedule = Schedule.objects.create(
            staff=self.waitress,
            date=today,
            shift_type='MORNING',
            start_time=time(7, 0),
            end_time=time(15, 0),
            is_confirmed=True
        )

        self.waitress_session = StaffSession.objects.create(
            staff=self.waitress,
            branch=self.branch,
            schedule=self.waitress_schedule,
            shift_type='MORNING'
        )

        self.chef_schedule = Schedule.objects.create(
            staff=self.chef,
            date=today,
            shift_type='MORNING',
            start_time=time(7, 0),
            end_time=time(15, 0),
            is_confirmed=True
        )

        self.chef_session = StaffSession.objects.create(
            staff=self.chef,
            branch=self.branch,
            schedule=self.chef_schedule,
            shift_type='MORNING'
        )

    def test_order_taken_by_waitress(self):
        """Test assigning order_taken_by to waitress"""
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='CONFIRMED',
            order_taken_by=self.waitress,
            waitress_session=self.waitress_session,
            taken_at=timezone.now()
        )

        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1,
            unit_price=self.product.price
        )

        self.assertEqual(order.order_taken_by, self.waitress)
        self.assertEqual(order.waitress_session, self.waitress_session)
        self.assertIsNotNone(order.taken_at)

    def test_order_claimed_by_chef(self):
        """Test chef claiming an order"""
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='CONFIRMED',
            order_taken_by=self.waitress
        )

        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1,
            unit_price=self.product.price
        )

        # Chef claims the order
        order.prepared_by = self.chef
        order.preparation_started_at = timezone.now()
        order.status = 'PREPARING'
        order.save()

        # Update chef session counter
        self.chef_session.orders_prepared_count += 1
        self.chef_session.save()

        self.assertEqual(order.prepared_by, self.chef)
        self.assertEqual(order.status, 'PREPARING')
        self.assertIsNotNone(order.preparation_started_at)
        self.assertEqual(self.chef_session.orders_prepared_count, 1)

    def test_order_completed_cycle(self):
        """Test complete order lifecycle with tracking"""
        # 1. Waitress takes order
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='CONFIRMED',
            order_taken_by=self.waitress,
            waitress_session=self.waitress_session,
            taken_at=timezone.now()
        )

        OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=2,
            unit_price=self.product.price
        )

        # Update waitress session
        self.waitress_session.orders_taken_count += 1
        self.waitress_session.save()

        # 2. Chef claims and prepares
        order.prepared_by = self.chef
        order.preparation_started_at = timezone.now()
        order.status = 'PREPARING'
        order.save()

        self.chef_session.orders_prepared_count += 1
        self.chef_session.save()

        # 3. Chef marks as ready
        order.preparation_completed_at = timezone.now()
        order.status = 'READY'
        order.save()

        # 4. Waitress serves
        order.served_by = self.waitress
        order.served_at = timezone.now()
        order.status = 'COMPLETED'
        order.save()

        self.waitress_session.orders_served_count += 1
        self.waitress_session.save()

        # Verify complete tracking
        self.assertEqual(order.order_taken_by, self.waitress)
        self.assertEqual(order.prepared_by, self.chef)
        self.assertEqual(order.served_by, self.waitress)
        self.assertEqual(order.status, 'COMPLETED')

        self.assertIsNotNone(order.taken_at)
        self.assertIsNotNone(order.preparation_started_at)
        self.assertIsNotNone(order.preparation_completed_at)
        self.assertIsNotNone(order.served_at)

        # Verify session counters
        self.assertEqual(self.waitress_session.orders_taken_count, 1)
        self.assertEqual(self.chef_session.orders_prepared_count, 1)
        self.assertEqual(self.waitress_session.orders_served_count, 1)

    def test_order_item_per_item_tracking(self):
        """Test per-item preparation tracking"""
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='CONFIRMED',
            order_taken_by=self.waitress
        )

        item1 = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1,
            unit_price=self.product.price
        )

        # Chef starts preparing this specific item
        item1.prepared_by = self.chef
        item1.preparation_started_at = timezone.now()
        item1.status = 'PREPARING'
        item1.save()

        # Chef completes this item
        item1.preparation_completed_at = timezone.now()
        item1.status = 'READY'
        item1.save()

        self.assertEqual(item1.prepared_by, self.chef)
        self.assertIsNotNone(item1.preparation_started_at)
        self.assertIsNotNone(item1.preparation_completed_at)

    def test_multiple_chefs_same_order(self):
        """Test multiple chefs working on different items in same order"""
        chef2_user = User.objects.create_user(
            email='chef2@test.com',
            password='test123',
            first_name='Chef',
            last_name='Anisa'
        )
        chef2 = Staff.objects.create(
            user=chef2_user,
            branch=self.branch,
            role=StaffRole.CHEF,
            phone='08123456791'
        )

        product2 = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name='Ayam Goreng',
            price=Decimal('30000.00'),
            is_available=True
        )

        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='CONFIRMED',
            order_taken_by=self.waitress
        )

        # Two different items
        item1 = OrderItem.objects.create(
            order=order,
            product=self.product,
            quantity=1,
            unit_price=self.product.price,
            prepared_by=self.chef
        )

        item2 = OrderItem.objects.create(
            order=order,
            product=product2,
            quantity=1,
            unit_price=product2.price,
            prepared_by=chef2
        )

        # Verify different chefs
        self.assertEqual(item1.prepared_by, self.chef)
        self.assertEqual(item2.prepared_by, chef2)
        self.assertNotEqual(item1.prepared_by, item2.prepared_by)

    def test_unassigned_order_query(self):
        """Test querying unassigned orders"""
        # Create assigned order
        assigned_order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='PREPARING',
            prepared_by=self.chef
        )

        # Create unassigned order
        unassigned_order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='CONFIRMED',
            prepared_by=None
        )

        # Query unassigned orders
        unassigned = Order.objects.filter(
            status__in=['CONFIRMED', 'PREPARING'],
            prepared_by__isnull=True
        )

        self.assertEqual(unassigned.count(), 1)
        self.assertEqual(unassigned.first(), unassigned_order)

    def test_preparation_time_calculation(self):
        """Test calculating preparation time for an order"""
        order = Order.objects.create(
            branch=self.branch,
            order_type='DINE_IN',
            status='CONFIRMED',
            order_taken_by=self.waitress,
            prepared_by=self.chef
        )

        # Set specific times for testing
        start_time = timezone.now()
        end_time = start_time + timedelta(minutes=15)

        order.preparation_started_at = start_time
        order.preparation_completed_at = end_time
        order.save()

        # Calculate preparation time
        prep_time = (order.preparation_completed_at - order.preparation_started_at).total_seconds() / 60

        self.assertEqual(prep_time, 15.0)  # 15 minutes

    def test_session_performance_summary(self):
        """Test session performance summary after multiple orders"""
        # Create and process 5 orders
        for i in range(5):
            order = Order.objects.create(
                branch=self.branch,
                order_type='DINE_IN',
                status='COMPLETED',
                order_taken_by=self.waitress,
                prepared_by=self.chef,
                served_by=self.waitress
            )

            OrderItem.objects.create(
                order=order,
                product=self.product,
                quantity=1,
                unit_price=self.product.price
            )

            # Update counters
            self.waitress_session.orders_taken_count += 1
            self.waitress_session.orders_served_count += 1
            self.chef_session.orders_prepared_count += 1

        self.waitress_session.save()
        self.chef_session.save()

        # Verify counters
        self.assertEqual(self.waitress_session.orders_taken_count, 5)
        self.assertEqual(self.waitress_session.orders_served_count, 5)
        self.assertEqual(self.chef_session.orders_prepared_count, 5)
