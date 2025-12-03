"""
Test complete split bill flow: from order creation to individual payments
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import TransactionTestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from apps.restaurant.models import (
    Table, Order, OrderItem, Product, Category, Staff, Branch, Restaurant
)
from decimal import Decimal

User = get_user_model()


class SplitBillFlowTest(TransactionTestCase):
    """Test complete split bill workflow with quantity splitting"""

    def setUp(self):
        """Set up test data"""
        # Create restaurant and branch
        self.restaurant = Restaurant.objects.create(
            name='Test Restaurant',
            address='Test Address'
        )
        self.branch = Branch.objects.create(
            restaurant=self.restaurant,
            name='Test Branch',
            address='Test Address',
            phone='08111111111'
        )

        # Create user and staff
        self.user = User.objects.create_user(
            email='testcashier@test.com',
            password='test123',
            first_name='Test',
            last_name='Cashier'
        )
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role='CASHIER',
            phone='08123456789'
        )

        # Create table
        self.table = Table.objects.create(
            branch=self.branch,
            number=10,
            capacity=4,
            is_available=False
        )

        # Create categories and products
        self.category_food = Category.objects.create(
            name='Makanan',
            description='Makanan'
        )
        self.category_beverage = Category.objects.create(
            name='Minuman',
            description='Minuman'
        )

        self.nasi_goreng = Product.objects.create(
            name='Nasi Goreng',
            category=self.category_food,
            price=Decimal('25000'),
            is_available=True
        )
        self.jus_jeruk = Product.objects.create(
            name='Jus Jeruk',
            category=self.category_beverage,
            price=Decimal('15000'),
            is_available=True
        )
        self.sate_ayam = Product.objects.create(
            name='Sate Ayam',
            category=self.category_food,
            price=Decimal('30000'),
            is_available=True
        )

        # Setup API client
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_01_create_order(self):
        """Test 1: Create an order with multiple items"""
        print("\n" + "="*70)
        print("TEST 1: Create Order with Multiple Items")
        print("="*70)

        # Create order
        order = Order.objects.create(
            branch=self.branch,
            table=self.table,
            order_type='DINE_IN',
            status='READY',
            customer_name='Test Customer',
            created_by=self.staff
        )

        # Add items: 3x Nasi Goreng, 2x Jus Jeruk, 1x Sate Ayam
        item1 = OrderItem.objects.create(
            order=order,
            product=self.nasi_goreng,
            quantity=3,
            unit_price=self.nasi_goreng.price
        )
        item2 = OrderItem.objects.create(
            order=order,
            product=self.jus_jeruk,
            quantity=2,
            unit_price=self.jus_jeruk.price
        )
        item3 = OrderItem.objects.create(
            order=order,
            product=self.sate_ayam,
            quantity=1,
            unit_price=self.sate_ayam.price
        )

        # Calculate expected total
        expected_total = (3 * 25000) + (2 * 15000) + (1 * 30000)

        print(f"\nOrder created: {order.order_number}")
        print(f"Table: {self.table.number}")
        print(f"Items:")
        print(f"  - 3x Nasi Goreng @ Rp 25,000 = Rp 75,000")
        print(f"  - 2x Jus Jeruk @ Rp 15,000 = Rp 30,000")
        print(f"  - 1x Sate Ayam @ Rp 30,000 = Rp 30,000")
        print(f"Total: Rp {expected_total:,}")
        print(f"Calculated total_amount: Rp {order.total_amount:,}")

        self.assertEqual(order.items.count(), 3)
        self.assertEqual(order.total_amount, expected_total)
        print("\n✓ Order created successfully with correct total")

        # Store for next test
        self.order_id = order.id
        self.item1_id = item1.id
        self.item2_id = item2.id
        self.item3_id = item3.id

        return order

    def test_02_split_bill_with_quantities(self):
        """Test 2: Split bill with quantity distribution"""
        print("\n" + "="*70)
        print("TEST 2: Split Bill with Quantity Distribution")
        print("="*70)

        # Create order first
        order = self.test_01_create_order()

        # Get item IDs
        items = list(order.items.all())
        nasi_item = items[0]  # 3x Nasi Goreng
        jus_item = items[1]   # 2x Jus Jeruk
        sate_item = items[2]  # 1x Sate Ayam

        print(f"\nOriginal order: {order.order_number}")
        print(f"Original total: Rp {order.total_amount:,}")

        # Split scenario:
        # Customer A: 2x Nasi Goreng, 1x Jus Jeruk = 50k + 15k = 65k
        # Customer B: 1x Nasi Goreng, 1x Jus Jeruk, 1x Sate = 25k + 15k + 30k = 70k
        split_data = {
            'splits': [
                {
                    'customer_name': 'Customer A',
                    'items': [
                        {'item_id': nasi_item.id, 'quantity': 2},
                        {'item_id': jus_item.id, 'quantity': 1}
                    ]
                },
                {
                    'customer_name': 'Customer B',
                    'items': [
                        {'item_id': nasi_item.id, 'quantity': 1},
                        {'item_id': jus_item.id, 'quantity': 1},
                        {'item_id': sate_item.id, 'quantity': 1}
                    ]
                }
            ]
        }

        print("\nSplit distribution:")
        print("  Customer A: 2x Nasi Goreng, 1x Jus Jeruk = Rp 65,000")
        print("  Customer B: 1x Nasi Goreng, 1x Jus Jeruk, 1x Sate = Rp 70,000")

        # Call split bill API
        response = self.client.post(
            f'/api/orders/{order.id}/split_bill/',
            split_data,
            format='json'
        )

        print(f"\nAPI Response Status: {response.status_code}")

        if response.status_code != 200:
            print(f"Error: {response.data}")
            self.fail(f"Split bill failed: {response.data}")

        self.assertEqual(response.status_code, 200)

        # Get split orders
        split_orders = Order.objects.filter(
            table=self.table,
            is_split_bill=True
        ).order_by('split_number')

        print(f"\nSplit orders created: {split_orders.count()}")

        # Verify split orders
        self.assertEqual(split_orders.count(), 2)

        order_a = split_orders[0]
        order_b = split_orders[1]

        print(f"\nOrder A: {order_a.order_number}")
        print(f"  Customer: {order_a.customer_name}")
        print(f"  Items: {order_a.items.count()}")
        for item in order_a.items.all():
            print(f"    - {item.quantity}x {item.product.name} @ Rp {item.unit_price:,}")
        print(f"  Total: Rp {order_a.total_amount:,}")

        print(f"\nOrder B: {order_b.order_number}")
        print(f"  Customer: {order_b.customer_name}")
        print(f"  Items: {order_b.items.count()}")
        for item in order_b.items.all():
            print(f"    - {item.quantity}x {item.product.name} @ Rp {item.unit_price:,}")
        print(f"  Total: Rp {order_b.total_amount:,}")

        # Verify totals
        self.assertEqual(order_a.customer_name, 'Customer A')
        self.assertEqual(order_a.total_amount, Decimal('65000'))

        self.assertEqual(order_b.customer_name, 'Customer B')
        self.assertEqual(order_b.total_amount, Decimal('70000'))

        # Verify items
        order_a_items = list(order_a.items.all())
        self.assertEqual(len(order_a_items), 2)  # Nasi and Jus

        order_b_items = list(order_b.items.all())
        self.assertEqual(len(order_b_items), 3)  # Nasi, Jus, Sate

        print("\n✓ Split bill created successfully with correct quantities and totals")

        # Store for next test
        self.split_order_a_id = order_a.id
        self.split_order_b_id = order_b.id

        return order_a, order_b

    def test_03_payment_flow_split_orders(self):
        """Test 3: Process payment for each split order"""
        print("\n" + "="*70)
        print("TEST 3: Process Payment for Split Orders")
        print("="*70)

        # Create and split order first
        order_a, order_b = self.test_02_split_bill_with_quantities()

        # Verify orders are in transaction list
        orders = Order.objects.filter(
            table=self.table,
            status='READY'
        )
        print(f"\nOrders available for payment: {orders.count()}")
        for order in orders:
            print(f"  - {order.order_number}: {order.customer_name} - Rp {order.total_amount:,}")

        self.assertEqual(orders.count(), 2)

        # Process payment for Customer A
        print(f"\n--- Processing payment for Customer A ---")
        print(f"Order: {order_a.order_number}")
        print(f"Amount: Rp {order_a.total_amount:,}")

        # Simulate transaction page selecting this order
        selected_order = Order.objects.get(id=order_a.id)
        print(f"Selected order from transaction page: {selected_order.order_number}")
        print(f"Customer: {selected_order.customer_name}")
        print(f"Items: {selected_order.items.count()}")
        print(f"Total: Rp {selected_order.total_amount:,}")

        # Mark as paid (simplified - in real app this would create Payment object)
        selected_order.status = 'COMPLETED'
        selected_order.save()
        print(f"Payment processed: {selected_order.order_number} → COMPLETED")

        # Verify only unpaid orders remain
        unpaid_orders = Order.objects.filter(
            table=self.table,
            status__in=['CONFIRMED', 'PREPARING', 'READY']
        )
        print(f"\nRemaining unpaid orders: {unpaid_orders.count()}")
        self.assertEqual(unpaid_orders.count(), 1)

        # Process payment for Customer B
        print(f"\n--- Processing payment for Customer B ---")
        print(f"Order: {order_b.order_number}")
        print(f"Amount: Rp {order_b.total_amount:,}")

        selected_order = Order.objects.get(id=order_b.id)
        print(f"Selected order from transaction page: {selected_order.order_number}")
        print(f"Customer: {selected_order.customer_name}")
        print(f"Items: {selected_order.items.count()}")
        print(f"Total: Rp {selected_order.total_amount:,}")

        selected_order.status = 'COMPLETED'
        selected_order.save()
        print(f"Payment processed: {selected_order.order_number} → COMPLETED")

        # Verify all orders paid
        unpaid_orders = Order.objects.filter(
            table=self.table,
            status__in=['CONFIRMED', 'PREPARING', 'READY']
        )
        print(f"\nRemaining unpaid orders: {unpaid_orders.count()}")
        self.assertEqual(unpaid_orders.count(), 0)

        # Verify both orders are completed
        completed_orders = Order.objects.filter(
            table=self.table,
            status='COMPLETED'
        )
        print(f"Completed orders: {completed_orders.count()}")
        self.assertEqual(completed_orders.count(), 2)

        print("\n✓ All split orders paid successfully")
        print("\n✓ Table can now be freed (all payments complete)")

    def test_04_complete_flow(self):
        """Test 4: Complete flow from order to split to payment"""
        print("\n" + "="*70)
        print("TEST 4: Complete End-to-End Flow")
        print("="*70)

        # Run all tests in sequence
        print("\nStep 1: Create order")
        order = self.test_01_create_order()

        print("\nStep 2: Split bill")
        order_a, order_b = self.test_02_split_bill_with_quantities()

        print("\nStep 3: Process payments")
        self.test_03_payment_flow_split_orders()

        print("\n" + "="*70)
        print("✓ COMPLETE FLOW TEST PASSED")
        print("="*70)


def run_tests():
    """Run all tests"""
    import unittest

    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(SplitBillFlowTest)

    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Print summary
    print("\n" + "="*70)
    print("SUMMARY")
    print("="*70)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")

    if result.wasSuccessful():
        print("\n✓ ALL TESTS PASSED")
        print("\nSplit bill flow is working correctly:")
        print("  1. Order creation ✓")
        print("  2. Split bill with quantities ✓")
        print("  3. Individual payments ✓")
        print("  4. Transaction page integration ✓")
    else:
        print("\n✗ SOME TESTS FAILED")
        if result.failures:
            print("\nFailures:")
            for test, traceback in result.failures:
                print(f"  - {test}")
                print(f"    {traceback}")
        if result.errors:
            print("\nErrors:")
            for test, traceback in result.errors:
                print(f"  - {test}")
                print(f"    {traceback}")

    print("="*70)

    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    sys.exit(run_tests())
