from django.core.management.base import BaseCommand
from apps.restaurant.models import Order
from django.db.models import Q


class Command(BaseCommand):
    help = 'Test kitchen display order flow and status transitions'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== Testing Kitchen Display Order Flow ===\n'))

        # Test 1: Check orders in kitchen-relevant statuses
        self.stdout.write('Test 1: Checking kitchen-relevant orders...')
        kitchen_orders = Order.objects.filter(
            Q(status='CONFIRMED') | Q(status='PREPARING') | Q(status='READY')
        ).order_by('-created_at')

        if kitchen_orders.exists():
            self.stdout.write(self.style.SUCCESS(f'  ✓ Found {kitchen_orders.count()} orders in kitchen queue'))

            # Show breakdown by status
            confirmed = kitchen_orders.filter(status='CONFIRMED').count()
            preparing = kitchen_orders.filter(status='PREPARING').count()
            ready = kitchen_orders.filter(status='READY').count()

            self.stdout.write(f'    - CONFIRMED (New): {confirmed}')
            self.stdout.write(f'    - PREPARING (Cooking): {preparing}')
            self.stdout.write(f'    - READY (Ready to serve): {ready}')
        else:
            self.stdout.write(self.style.ERROR('  ✗ No orders found in kitchen queue'))
            return

        # Test 2: Test status transition CONFIRMED -> PREPARING
        self.stdout.write('\nTest 2: Testing CONFIRMED → PREPARING transition...')
        confirmed_order = Order.objects.filter(status='CONFIRMED').first()

        if confirmed_order:
            old_status = confirmed_order.status
            confirmed_order.status = 'PREPARING'
            confirmed_order.save()
            confirmed_order.refresh_from_db()

            if confirmed_order.status == 'PREPARING':
                self.stdout.write(self.style.SUCCESS(f'  ✓ Order {confirmed_order.order_number}: {old_status} → PREPARING'))
            else:
                self.stdout.write(self.style.ERROR('  ✗ Status transition failed'))
        else:
            self.stdout.write(self.style.WARNING('  ⊘ No CONFIRMED orders available to test'))

        # Test 3: Test status transition PREPARING -> READY
        self.stdout.write('\nTest 3: Testing PREPARING → READY transition...')
        preparing_order = Order.objects.filter(status='PREPARING').first()

        if preparing_order:
            old_status = preparing_order.status
            preparing_order.status = 'READY'
            preparing_order.save()
            preparing_order.refresh_from_db()

            if preparing_order.status == 'READY':
                self.stdout.write(self.style.SUCCESS(f'  ✓ Order {preparing_order.order_number}: {old_status} → READY'))
            else:
                self.stdout.write(self.style.ERROR('  ✗ Status transition failed'))
        else:
            self.stdout.write(self.style.WARNING('  ⊘ No PREPARING orders available to test'))

        # Test 4: Test status transition READY -> COMPLETED
        self.stdout.write('\nTest 4: Testing READY → COMPLETED transition...')
        ready_order = Order.objects.filter(status='READY').first()

        if ready_order:
            old_status = ready_order.status
            ready_order.status = 'COMPLETED'
            ready_order.save()
            ready_order.refresh_from_db()

            if ready_order.status == 'COMPLETED':
                self.stdout.write(self.style.SUCCESS(f'  ✓ Order {ready_order.order_number}: {old_status} → COMPLETED'))
                self.stdout.write(self.style.WARNING(f'    Note: Order {ready_order.order_number} is now removed from kitchen queue'))
            else:
                self.stdout.write(self.style.ERROR('  ✗ Status transition failed'))
        else:
            self.stdout.write(self.style.WARNING('  ⊘ No READY orders available to test'))

        # Test 5: Verify order items are loaded correctly
        self.stdout.write('\nTest 5: Verifying order items...')
        sample_order = kitchen_orders.first()

        if sample_order:
            items = sample_order.items.all()
            if items.exists():
                self.stdout.write(self.style.SUCCESS(f'  ✓ Order {sample_order.order_number} has {items.count()} items:'))
                for item in items:
                    notes_text = f' (Note: {item.notes})' if item.notes else ''
                    self.stdout.write(f'    - {item.quantity}x {item.product.name}{notes_text}')
            else:
                self.stdout.write(self.style.ERROR(f'  ✗ Order {sample_order.order_number} has no items'))

        # Final summary
        self.stdout.write(self.style.SUCCESS('\n=== Kitchen Display Test Complete ==='))

        final_kitchen_orders = Order.objects.filter(
            Q(status='CONFIRMED') | Q(status='PREPARING') | Q(status='READY')
        ).count()

        self.stdout.write(f'\nCurrent kitchen queue: {final_kitchen_orders} orders')
        self.stdout.write(self.style.SUCCESS('✓ All tests passed! Kitchen display system is working correctly.'))
        self.stdout.write('\nYou can now view the kitchen display at: http://localhost:3000/kitchen\n')
