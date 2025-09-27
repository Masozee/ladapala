from django.test import TestCase
from django.contrib.auth.models import User
from datetime import datetime, timedelta
from apps.restaurant.models import (
    Restaurant, Branch, Staff, StaffRole, Category, Product, 
    Order, OrderItem, KitchenOrder, KitchenOrderItem, Table
)
from apps.restaurant.services.kitchen_printer import KitchenTicketPrinter, KitchenOrderQueue


class KitchenPrinterTestCase(TestCase):
    def setUp(self):
        # Create test data
        self.restaurant = Restaurant.objects.create(
            name="Test Restaurant",
            address="123 Test St"
        )
        
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name="Main Branch",
            address="456 Branch St"
        )
        
        self.user = User.objects.create_user(
            username="cashier",
            password="testpass"
        )
        
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role=StaffRole.CASHIER
        )
        
        self.category = Category.objects.create(
            restaurant=self.restaurant,
            name="Main Dishes"
        )
        
        self.product1 = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name="Grilled Chicken",
            price=15.99,
            preparation_time=20
        )
        
        self.product2 = Product.objects.create(
            restaurant=self.restaurant,
            category=self.category,
            name="Caesar Salad",
            price=8.99,
            preparation_time=10
        )
        
        self.table = Table.objects.create(
            branch=self.branch,
            number="T5",
            capacity=4
        )
        
        self.printer = KitchenTicketPrinter()
        self.queue = KitchenOrderQueue()
    
    def create_test_order(self, order_type='DINE_IN', priority=0):
        """Helper method to create a test order"""
        order = Order.objects.create(
            branch=self.branch,
            table=self.table if order_type == 'DINE_IN' else None,
            order_type=order_type,
            status='PENDING',
            created_by=self.staff,
            customer_name="John Doe" if order_type != 'DINE_IN' else "",
            customer_phone="+1234567890" if order_type != 'DINE_IN' else "",
            notes="Extra spicy, no onions"
        )
        
        # Add items
        OrderItem.objects.create(
            order=order,
            product=self.product1,
            quantity=2,
            unit_price=self.product1.price,
            notes="Well done"
        )
        
        OrderItem.objects.create(
            order=order,
            product=self.product2,
            quantity=1,
            unit_price=self.product2.price,
            notes="Dressing on side"
        )
        
        # Get the kitchen order created by signals and update its priority
        kitchen_order = KitchenOrder.objects.get(order=order)
        if priority != 0:
            kitchen_order.priority = priority
            kitchen_order.save()
        
        return kitchen_order


class KitchenTicketPrinterTests(KitchenPrinterTestCase):
    
    def test_format_header(self):
        """Test kitchen ticket header formatting"""
        kitchen_order = self.create_test_order()
        
        order_data = {
            'order_number': kitchen_order.order.order_number,
            'order_type': 'DINE_IN',
            'table_number': 'T5',
            'priority': 5,
            'created_at': datetime.now(),
            'estimated_prep_time': 20,
            'notes': 'Extra spicy',
            'created_by': 'John Cashier'
        }
        
        header = self.printer.format_header(order_data)
        
        self.assertIn('KITCHEN ORDER', header)
        self.assertIn(kitchen_order.order.order_number, header)
        self.assertIn('DINE_IN', header)
        self.assertIn('T5', header)
        self.assertIn('PRIORITY: 🔥 HIGH (5)', header)
    
    def test_format_items(self):
        """Test order items formatting"""
        items = [
            {
                'quantity': 2,
                'product_name': 'Grilled Chicken',
                'notes': 'Well done',
                'modifiers': ['Extra cheese']
            },
            {
                'quantity': 1,
                'product_name': 'Caesar Salad',
                'notes': 'Dressing on side',
                'modifiers': []
            }
        ]
        
        formatted_items = self.printer.format_items(items)
        
        self.assertIn('2X GRILLED CHICKEN', formatted_items)
        self.assertIn('1X CAESAR SALAD', formatted_items)
        self.assertIn('Note: Well done', formatted_items)
        self.assertIn('Note: Dressing on side', formatted_items)
        self.assertIn('- Extra cheese', formatted_items)
    
    def test_priority_text_conversion(self):
        """Test priority number to text conversion"""
        self.assertEqual(self.printer.get_priority_text(15), "⚡ RUSH (15)")
        self.assertEqual(self.printer.get_priority_text(7), "🔥 HIGH (7)")
        self.assertEqual(self.printer.get_priority_text(3), "📍 NORMAL (3)")
        self.assertEqual(self.printer.get_priority_text(0), "STANDARD")
    
    def test_complete_ticket_generation(self):
        """Test complete ticket generation"""
        kitchen_order = self.create_test_order(priority=8)
        
        order_data = {
            'order_number': kitchen_order.order.order_number,
            'order_type': 'DINE_IN',
            'table_number': 'T5',
            'priority': 8,
            'created_at': datetime.now(),
            'estimated_prep_time': 20,
            'notes': 'Extra spicy, no onions',
            'created_by': 'John Cashier'
        }
        
        items = [
            {
                'quantity': 2,
                'product_name': 'Grilled Chicken',
                'notes': 'Well done',
                'modifiers': []
            }
        ]
        
        ticket = self.printer.print_ticket(order_data, items)
        
        # Check all major components are present
        self.assertIn('KITCHEN ORDER', ticket)
        self.assertIn(kitchen_order.order.order_number, ticket)
        self.assertIn('2X GRILLED CHICKEN', ticket)
        self.assertIn('SPECIAL INSTRUCTIONS:', ticket)
        self.assertIn('Extra spicy, no onions', ticket)
        self.assertIn('SERVER: John Cashier', ticket)
        self.assertIn('CUT HERE', ticket)
    
    def test_summary_ticket(self):
        """Test queue summary ticket generation"""
        # Create multiple orders
        ko1 = self.create_test_order('DINE_IN', priority=10)
        ko2 = self.create_test_order('TAKEAWAY', priority=5)
        ko3 = self.create_test_order('DELIVERY', priority=1)
        
        orders = [
            {
                'order_number': ko1.order.order_number,
                'order_type': 'DINE_IN',
                'table_number': 'T5',
                'priority': 10,
                'created_at': ko1.created_at
            },
            {
                'order_number': ko2.order.order_number,
                'order_type': 'TAKEAWAY',
                'table_number': None,
                'priority': 5,
                'created_at': ko2.created_at
            },
            {
                'order_number': ko3.order.order_number,
                'order_type': 'DELIVERY',
                'table_number': None,
                'priority': 1,
                'created_at': ko3.created_at
            }
        ]
        
        summary = self.printer.print_summary_ticket(orders)
        
        self.assertIn('KITCHEN ORDER QUEUE', summary)
        self.assertIn('Total pending: 3 orders', summary)
        # Check that order numbers appear (last 7 chars)
        self.assertIn(ko1.order.order_number[-7:], summary)
        self.assertIn(ko2.order.order_number[-7:], summary)
        self.assertIn(ko3.order.order_number[-7:], summary)


class KitchenOrderQueueTests(KitchenPrinterTestCase):
    
    def test_add_order_to_queue(self):
        """Test adding orders to the kitchen queue"""
        kitchen_order = self.create_test_order(priority=5)
        
        order_data = {
            'order_number': kitchen_order.order.order_number,
            'priority': 5,
            'created_at': kitchen_order.created_at,
            'order_type': 'DINE_IN'
        }
        
        self.queue.add_order(order_data)
        
        self.assertEqual(len(self.queue.orders), 1)
        self.assertIn('calculated_priority', self.queue.orders[0])
    
    def test_priority_calculation(self):
        """Test dynamic priority calculation"""
        from django.utils import timezone
        # Create an order that's been waiting
        old_time = timezone.now() - timedelta(minutes=15)
        
        order_data = {
            'order_number': 'TEST001',
            'priority': 5,
            'created_at': old_time,
            'order_type': 'DINE_IN'
        }
        
        calculated_priority = self.queue.calculate_priority(order_data)
        
        # Should be base (5) + time bonus (3 for 15 mins) + type bonus (2 for dine-in) = 10
        self.assertGreaterEqual(calculated_priority, 9)  # Allow some variation
    
    def test_get_next_order_priority(self):
        """Test getting next order based on priority"""
        from django.utils import timezone
        # Add orders with different priorities
        orders = [
            {'order_number': 'LOW', 'priority': 1, 'created_at': timezone.now(), 'order_type': 'DELIVERY'},
            {'order_number': 'HIGH', 'priority': 10, 'created_at': timezone.now(), 'order_type': 'DINE_IN'},
            {'order_number': 'MED', 'priority': 5, 'created_at': timezone.now(), 'order_type': 'TAKEAWAY'}
        ]
        
        for order in orders:
            self.queue.add_order(order)
        
        next_order = self.queue.get_next_order()
        
        # Should get the high priority order
        self.assertEqual(next_order['order_number'], 'HIGH')
    
    def test_remove_completed_order(self):
        """Test removing completed orders from queue"""
        kitchen_order = self.create_test_order()
        
        order_data = {
            'order_number': kitchen_order.order.order_number,
            'priority': 5,
            'created_at': kitchen_order.created_at,
            'order_type': 'DINE_IN'
        }
        
        self.queue.add_order(order_data)
        self.assertEqual(len(self.queue.orders), 1)
        
        removed = self.queue.remove_order(kitchen_order.order.order_number)
        
        self.assertTrue(removed)
        self.assertEqual(len(self.queue.orders), 0)
    
    def test_queue_status(self):
        """Test getting queue status with priorities"""
        from django.utils import timezone
        # Add multiple orders
        orders = [
            {'order_number': 'ORD1', 'priority': 3, 'created_at': timezone.now(), 'order_type': 'DINE_IN'},
            {'order_number': 'ORD2', 'priority': 7, 'created_at': timezone.now(), 'order_type': 'TAKEAWAY'},
            {'order_number': 'ORD3', 'priority': 1, 'created_at': timezone.now(), 'order_type': 'DELIVERY'}
        ]
        
        for order in orders:
            self.queue.add_order(order)
        
        status = self.queue.get_queue_status()
        
        # Should be sorted by calculated priority (highest first)
        self.assertEqual(len(status), 3)
        self.assertGreaterEqual(status[0]['calculated_priority'], status[1]['calculated_priority'])
        self.assertGreaterEqual(status[1]['calculated_priority'], status[2]['calculated_priority'])


class KitchenOrderSignalTests(KitchenPrinterTestCase):
    
    def test_kitchen_order_auto_creation(self):
        """Test that kitchen orders are automatically created when orders are placed"""
        # Create an order (this should trigger the signal)
        order = Order.objects.create(
            branch=self.branch,
            table=self.table,
            order_type='DINE_IN',
            status='PENDING',
            created_by=self.staff
        )
        
        # Add an order item
        OrderItem.objects.create(
            order=order,
            product=self.product1,
            quantity=1,
            unit_price=self.product1.price
        )
        
        # Check that kitchen order was created
        kitchen_orders = KitchenOrder.objects.filter(order=order)
        self.assertEqual(kitchen_orders.count(), 1)
        
        kitchen_order = kitchen_orders.first()
        self.assertEqual(kitchen_order.status, 'PENDING')
        self.assertEqual(kitchen_order.priority, 5)  # DINE_IN priority
    
    def test_priority_assignment_by_order_type(self):
        """Test that different order types get appropriate priorities"""
        order_types = [
            ('DINE_IN', 5),
            ('TAKEAWAY', 3),
            ('DELIVERY', 1)
        ]
        
        for order_type, expected_priority in order_types:
            order = Order.objects.create(
                branch=self.branch,
                order_type=order_type,
                status='PENDING',
                created_by=self.staff
            )
            
            kitchen_order = KitchenOrder.objects.get(order=order)
            self.assertEqual(kitchen_order.priority, expected_priority)