from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.restaurant.models import Order, OrderItem, Product, Branch, Staff, Restaurant
from decimal import Decimal
import random


class Command(BaseCommand):
    help = 'Create test orders for kitchen display testing'

    def handle(self, *args, **options):
        # Get the branch
        branch = Branch.objects.first()
        if not branch:
            self.stdout.write(self.style.ERROR('No branch found. Please create a branch first.'))
            return

        # Get restaurant from branch
        restaurant = branch.restaurant

        # Get some products
        products = list(Product.objects.filter(restaurant=restaurant, is_available=True)[:10])
        if not products:
            self.stdout.write(self.style.ERROR('No products found. Please create products first.'))
            return

        # Get a staff member for created_by
        staff = Staff.objects.filter(branch=branch).first()

        # Create test orders with different statuses
        order_configs = [
            {'status': 'CONFIRMED', 'count': 3, 'description': 'New orders waiting to be cooked'},
            {'status': 'PREPARING', 'count': 2, 'description': 'Orders currently being prepared'},
            {'status': 'READY', 'count': 2, 'description': 'Orders ready to be served'},
        ]

        total_created = 0

        for config in order_configs:
            self.stdout.write(f"\nCreating {config['count']} orders with status {config['status']}...")

            for i in range(config['count']):
                # Create order
                order = Order.objects.create(
                    branch=branch,
                    order_type=random.choice(['DINE_IN', 'TAKEAWAY']),
                    status=config['status'],
                    customer_name=f"Test Customer {random.randint(1, 100)}",
                    customer_phone=f"08{random.randint(10000000, 99999999)}",
                    notes=f"Test order - {config['description']}" if i == 0 else '',
                    created_by=staff
                )

                # Add 2-4 random items to each order
                num_items = random.randint(2, 4)
                selected_products = random.sample(products, min(num_items, len(products)))

                for product in selected_products:
                    quantity = random.randint(1, 3)
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        unit_price=product.price,
                        discount_amount=Decimal('0.00'),
                        notes='Extra pedas' if random.random() > 0.7 else ''
                    )

                total_created += 1
                self.stdout.write(
                    self.style.SUCCESS(f"  ✓ Created order {order.order_number} with {num_items} items")
                )

        self.stdout.write(
            self.style.SUCCESS(f"\n✓ Successfully created {total_created} test orders for kitchen display")
        )
        self.stdout.write(
            self.style.WARNING("\nNote: These are test orders. You can delete them later if needed.")
        )
        self.stdout.write(
            self.style.SUCCESS("\nYou can now view these orders at: http://localhost:3000/kitchen")
        )
