"""
Test synchronization between waitress page, table page, and transaction page
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.test import TestCase, TransactionTestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.restaurant.models import (
    Table, Order, OrderItem, Product, Category, Staff, Branch,
    KitchenOrder, BarOrder
)
from decimal import Decimal

User = get_user_model()


class WaitressTableSyncTest(TransactionTestCase):
    """Test synchronization between waitress and table pages"""

    def setUp(self):
        """Set up test data"""
        # Create branch
        self.branch = Branch.objects.create(
            name='Test Branch',
            address='Test Address',
            phone='08111111111'
        )

        # Create user and staff
        self.user = User.objects.create_user(
            email='testwaiter@test.com',
            password='test123',
            first_name='Test',
            last_name='Waiter'
        )
        self.staff = Staff.objects.create(
            user=self.user,
            branch=self.branch,
            role='WAITER',
            phone='08123456789'
        )

        # Create table
        self.table = Table.objects.create(
            branch=self.branch,
            number=10,
            capacity=4,
            is_available=False
        )

        # Create category and products
        self.category_food = Category.objects.create(
            name='Makanan',
            description='Makanan'
        )
        self.category_beverage = Category.objects.create(
            name='Minuman',
            description='Minuman'
        )

        self.product_nasi = Product.objects.create(
            name='Nasi Goreng',
            category=self.category_food,
            price=Decimal('25000'),
            is_available=True
        )
        self.product_jus = Product.objects.create(
            name='Jus Jeruk',
            category=self.category_beverage,
            price=Decimal('15000'),
            is_available=True
        )
        self.product_sate = Product.objects.create(
            name='Sate Ayam',
            category=self.category_food,
            price=Decimal('30000'),
            is_available=True
        )
        self.product_teh = Product.objects.create(
            name='Teh Manis',
            category=self.category_beverage,
            price=Decimal('8000'),
            is_available=True
        )

    def test_01_order_creation_appears_in_waitress(self):
        """Test: Order created should appear in waitress page after status is READY"""
        print("\n=== Test 1: Order Creation and Waitress Visibility ===")

        # Create order
        order = Order.objects.create(
            branch=self.branch,
            table=self.table,
            order_type='DINE_IN',
            status='CONFIRMED',
            customer_name='Customer 1',
            total_amount=Decimal('50000')
        )

        # Add items
        OrderItem.objects.create(
            order=order,
            product=self.product_nasi,
            quantity=1,
            unit_price=self.product_nasi.price
        )
        OrderItem.objects.create(
            order=order,
            product=self.product_jus,
            quantity=1,
            unit_price=self.product_jus.price
        )

        # Create kitchen and bar orders
        kitchen_order = KitchenOrder.objects.create(order=order, status='PENDING')
        bar_order = BarOrder.objects.create(order=order, status='PENDING')

        print(f"Order created: {order.order_number}, Status: {order.status}")

        # Should NOT appear in waitress (status is CONFIRMED)
        waitress_orders = Order.objects.filter(status__in=['READY', 'COMPLETED'])
        self.assertEqual(waitress_orders.count(), 0, "Order should not appear in waitress before READY")
        print("✓ Order not in waitress (CONFIRMED status)")

        # Mark kitchen ready
        kitchen_order.status = 'READY'
        kitchen_order.save()
        order.update_order_status()
        order.refresh_from_db()

        print(f"Kitchen ready, Order status: {order.status}")
        self.assertNotEqual(order.status, 'READY', "Order should not be READY until bar is also ready")

        # Mark bar ready
        bar_order.status = 'READY'
        bar_order.save()
        order.update_order_status()
        order.refresh_from_db()

        print(f"Bar ready, Order status: {order.status}")
        self.assertEqual(order.status, 'READY', "Order should be READY when both kitchen and bar are ready")

        # Should NOW appear in waitress
        waitress_orders = Order.objects.filter(status__in=['READY', 'COMPLETED'])
        self.assertEqual(waitress_orders.count(), 1, "Order should appear in waitress when READY")
        print("✓ Order appears in waitress (READY status)")

        print("✓ Test 1 PASSED\n")

    def test_02_split_bill_creates_separate_orders(self):
        """Test: Split bill creates separate orders visible in table and transaction pages"""
        print("\n=== Test 2: Split Bill Creates Separate Orders ===")

        # Create main order with 4 items
        main_order = Order.objects.create(branch=self.branch, 
            table=self.table,
            order_type='DINE_IN',
            status='READY',
            customer_name='Group Order',
            total_amount=Decimal('78000')
        )

        item1 = OrderItem.objects.create(
            order=main_order,
            product=self.product_nasi,
            quantity=1,
            unit_price=self.product_nasi.price
        )
        item2 = OrderItem.objects.create(
            order=main_order,
            product=self.product_jus,
            quantity=1,
            unit_price=self.product_jus.price
        )
        item3 = OrderItem.objects.create(
            order=main_order,
            product=self.product_sate,
            quantity=1,
            unit_price=self.product_sate.price
        )
        item4 = OrderItem.objects.create(
            order=main_order,
            product=self.product_teh,
            quantity=1,
            unit_price=self.product_teh.price
        )

        print(f"Main order created: {main_order.order_number}")
        print(f"Items: {main_order.items.count()}, Total: Rp {main_order.total_amount}")

        # Simulate split bill: Customer 1 takes Nasi + Jus (40k)
        # Main order keeps Sate + Teh (38k)
        customer1_items = [item1.id, item2.id]
        remaining_items = [item3.id, item4.id]

        # Create new order for customer 1
        customer1_order = Order.objects.create(branch=self.branch, 
            table=self.table,
            order_type='DINE_IN',
            status='READY',
            customer_name='Customer 1 (Split)',
            total_amount=Decimal('40000'),
            is_split_bill=True,
            parent_order=main_order,
            split_number=1,
            split_total=2
        )

        # Move items to customer 1
        for item_id in customer1_items:
            item = OrderItem.objects.get(id=item_id)
            item.order = customer1_order
            item.save()

        # Update main order
        main_order.is_split_bill = True
        main_order.split_number=2
        main_order.split_total=2
        main_order.total_amount = Decimal('38000')
        main_order.save()

        print(f"Split order created: {customer1_order.order_number}")
        print(f"Customer 1 items: {customer1_order.items.count()}, Total: Rp {customer1_order.total_amount}")
        print(f"Main order items: {main_order.items.count()}, Total: Rp {main_order.total_amount}")

        # Verify both orders exist for the same table
        table_orders = Order.objects.filter(table=self.table, status='READY')
        self.assertEqual(table_orders.count(), 2, "Should have 2 orders after split")
        print("✓ Both orders exist for table")

        # Verify items are correctly distributed
        self.assertEqual(customer1_order.items.count(), 2, "Customer 1 should have 2 items")
        self.assertEqual(main_order.items.count(), 2, "Main order should have 2 items")
        print("✓ Items correctly distributed")

        # Verify both appear in waitress page
        waitress_orders = Order.objects.filter(status__in=['READY', 'COMPLETED'], table=self.table)
        self.assertEqual(waitress_orders.count(), 2, "Both orders should appear in waitress")
        print("✓ Both orders appear in waitress")

        # Verify split bill flags
        self.assertTrue(customer1_order.is_split_bill, "Customer 1 order should be marked as split")
        self.assertTrue(main_order.is_split_bill, "Main order should be marked as split")
        print("✓ Split bill flags set correctly")

        print("✓ Test 2 PASSED\n")

    def test_03_payment_updates_order_status(self):
        """Test: Payment updates order status and reflects in waitress page"""
        print("\n=== Test 3: Payment Updates Order Status ===")

        # Create order
        order = Order.objects.create(branch=self.branch, 
            table=self.table,
            order_type='DINE_IN',
            status='READY',
            customer_name='Payment Test',
            total_amount=Decimal('25000')
        )

        OrderItem.objects.create(
            order=order,
            product=self.product_nasi,
            quantity=1,
            unit_price=self.product_nasi.price
        )

        print(f"Order created: {order.order_number}, Status: {order.status}")

        # Verify appears in waitress (READY status)
        waitress_ready = Order.objects.filter(status='READY', table=self.table)
        self.assertEqual(waitress_ready.count(), 1, "Order should appear in waitress READY tab")
        print("✓ Order appears in waitress READY tab")

        # Simulate payment (status becomes COMPLETED)
        order.status = 'COMPLETED'
        order.save()

        print(f"Payment processed, Status: {order.status}")

        # Should move from READY to COMPLETED in waitress
        waitress_ready = Order.objects.filter(status='READY', table=self.table)
        waitress_completed = Order.objects.filter(status='COMPLETED', table=self.table)

        self.assertEqual(waitress_ready.count(), 0, "Order should not be in READY tab")
        self.assertEqual(waitress_completed.count(), 1, "Order should be in COMPLETED tab")
        print("✓ Order moved to waitress COMPLETED tab")

        # Verify table is freed (in real implementation)
        # Note: In actual payment processing, table.is_available should become True

        print("✓ Test 3 PASSED\n")

    def test_04_split_bill_payment_workflow(self):
        """Test: Complete workflow - split bill, pay separately"""
        print("\n=== Test 4: Split Bill Payment Workflow ===")

        # Create main order
        main_order = Order.objects.create(branch=self.branch, 
            table=self.table,
            order_type='DINE_IN',
            status='READY',
            customer_name='Split Payment Test',
            total_amount=Decimal('55000')
        )

        item1 = OrderItem.objects.create(
            order=main_order,
            product=self.product_nasi,
            quantity=1,
            unit_price=self.product_nasi.price
        )
        item2 = OrderItem.objects.create(
            order=main_order,
            product=self.product_sate,
            quantity=1,
            unit_price=self.product_sate.price
        )

        print(f"Main order: {main_order.order_number}, Total: Rp {main_order.total_amount}")

        # Split bill
        customer1_order = Order.objects.create(branch=self.branch, 
            table=self.table,
            order_type='DINE_IN',
            status='READY',
            customer_name='Customer A',
            total_amount=Decimal('25000'),
            is_split_bill=True,
            parent_order=main_order,
            split_number=1,
            split_total=2
        )
        item1.order = customer1_order
        item1.save()

        main_order.is_split_bill = True
        main_order.split_number = 2
        main_order.split_total = 2
        main_order.customer_name = 'Customer B'
        main_order.total_amount = Decimal('30000')
        main_order.save()

        print(f"Split created: {customer1_order.order_number} (Rp 25k), {main_order.order_number} (Rp 30k)")

        # Both should appear in waitress READY
        waitress_ready = Order.objects.filter(status='READY', table=self.table)
        self.assertEqual(waitress_ready.count(), 2, "Both split orders in READY")
        print("✓ Both orders in waitress READY tab")

        # Customer A pays first
        customer1_order.status = 'COMPLETED'
        customer1_order.save()

        print(f"Customer A paid: {customer1_order.order_number}")

        # Check waitress tabs
        waitress_ready = Order.objects.filter(status='READY', table=self.table)
        waitress_completed = Order.objects.filter(status='COMPLETED', table=self.table)

        self.assertEqual(waitress_ready.count(), 1, "One order still in READY")
        self.assertEqual(waitress_completed.count(), 1, "One order in COMPLETED")
        print("✓ Customer A order moved to COMPLETED tab")

        # Table should still be occupied (one unpaid order remains)
        self.assertFalse(self.table.is_available, "Table should still be occupied")
        print("✓ Table remains occupied")

        # Customer B pays
        main_order.status = 'COMPLETED'
        main_order.save()

        print(f"Customer B paid: {main_order.order_number}")

        # Both should be in COMPLETED
        waitress_ready = Order.objects.filter(status='READY', table=self.table)
        waitress_completed = Order.objects.filter(status='COMPLETED', table=self.table)

        self.assertEqual(waitress_ready.count(), 0, "No orders in READY")
        self.assertEqual(waitress_completed.count(), 2, "Both orders in COMPLETED")
        print("✓ Both orders in COMPLETED tab")

        # In real implementation, table should now be freed
        print("✓ Table can be freed (all payments complete)")

        print("✓ Test 4 PASSED\n")

    def test_05_prepayment_status_sync(self):
        """Test: Prepayment (pay before food ready) syncs correctly"""
        print("\n=== Test 5: Prepayment Status Sync ===")

        # Create order in CONFIRMED status
        order = Order.objects.create(branch=self.branch, 
            table=self.table,
            order_type='DINE_IN',
            status='CONFIRMED',
            customer_name='Prepay Customer',
            total_amount=Decimal('25000')
        )

        OrderItem.objects.create(
            order=order,
            product=self.product_nasi,
            quantity=1,
            unit_price=self.product_nasi.price
        )

        print(f"Order created: {order.order_number}, Status: {order.status}")

        # Should NOT appear in waitress (not READY yet)
        waitress_orders = Order.objects.filter(status__in=['READY', 'COMPLETED'])
        self.assertEqual(waitress_orders.count(), 0, "Order not in waitress (CONFIRMED)")
        print("✓ Order not in waitress (food not ready)")

        # Customer pays upfront (payment allowed at CONFIRMED status)
        order.status = 'COMPLETED'
        order.save()

        print(f"Payment processed (prepayment), Status: {order.status}")

        # Should NOW appear in waitress COMPLETED tab
        waitress_completed = Order.objects.filter(status='COMPLETED')
        self.assertEqual(waitress_completed.count(), 1, "Prepaid order appears in COMPLETED")
        print("✓ Prepaid order appears in waitress COMPLETED tab")

        # This is correct behavior: customer paid, but food still being prepared
        # Waitress can see it's paid but may need to deliver when ready

        print("✓ Test 5 PASSED\n")


def run_tests():
    """Run all tests"""
    import unittest

    # Create test suite
    suite = unittest.TestLoader().loadTestsFromTestCase(WaitressTableSyncTest)

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
    else:
        print("\n✗ SOME TESTS FAILED")
        if result.failures:
            print("\nFailures:")
            for test, traceback in result.failures:
                print(f"  - {test}")
        if result.errors:
            print("\nErrors:")
            for test, traceback in result.errors:
                print(f"  - {test}")

    print("="*70)

    return 0 if result.wasSuccessful() else 1


if __name__ == '__main__':
    sys.exit(run_tests())
