"""
Management command to seed realistic sales transaction data for the past month
Uses real menu items from the database and creates Orders with OrderItems
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta, datetime, time
from decimal import Decimal
import random

from apps.restaurant.models import (
    Order, OrderItem, Product, Table, Branch,
    CashierSession, Payment, Staff
)


class Command(BaseCommand):
    help = 'Seed sales transaction data for the past month using real menu items'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days to generate data for (default: 30)'
        )
        parser.add_argument(
            '--branch',
            type=int,
            default=4,
            help='Branch ID to generate data for (default: 4)'
        )

    def handle(self, *args, **options):
        days = options['days']
        branch_id = options['branch']

        try:
            branch = Branch.objects.get(id=branch_id)
        except Branch.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Branch with ID {branch_id} does not exist'))
            return

        # Get all available products
        products = list(Product.objects.filter(is_available=True))
        if not products:
            self.stdout.write(self.style.ERROR('No available products found. Run seed_resto_data first.'))
            return

        # Get all tables
        tables = list(Table.objects.filter(branch=branch))
        if not tables:
            self.stdout.write(self.style.WARNING('No tables found. Creating sample tables...'))
            for i in range(1, 11):
                Table.objects.create(
                    branch=branch,
                    number=str(i),
                    capacity=random.choice([2, 4, 6, 8]),
                    is_available=True
                )
            tables = list(Table.objects.filter(branch=branch))

        # Get cashiers for sessions
        cashiers = list(Staff.objects.filter(role='CASHIER', is_active=True))
        if not cashiers:
            self.stdout.write(self.style.WARNING('No cashiers found. Orders will be created without cashier sessions.'))

        self.stdout.write(self.style.SUCCESS(f'Starting to generate {days} days of sales data...'))
        self.stdout.write(f'Branch: {branch.name}')
        self.stdout.write(f'Products available: {len(products)}')
        self.stdout.write(f'Tables: {len(tables)}')

        total_orders = 0
        total_revenue = Decimal('0')

        # Generate data for each day
        end_date = timezone.now().date()
        start_date = end_date - timedelta(days=days)

        for day_offset in range(days):
            current_date = start_date + timedelta(days=day_offset)

            # Determine day type (weekend has more orders)
            is_weekend = current_date.weekday() >= 5  # Saturday or Sunday

            # Number of orders per day
            if is_weekend:
                num_orders = random.randint(40, 60)
            else:
                num_orders = random.randint(25, 45)

            # Create cashier session for the day if cashiers exist
            cashier_session = None
            if cashiers:
                cashier = random.choice(cashiers)
                session_start = timezone.make_aware(
                    datetime.combine(current_date, time(8, 0, 0))
                )
                session_end = timezone.make_aware(
                    datetime.combine(current_date, time(22, 0, 0))
                )

                cashier_session = CashierSession.objects.create(
                    cashier=cashier,
                    branch=branch,
                    shift_type='MORNING',
                    opened_at=session_start,
                    closed_at=session_end,
                    status='CLOSED',
                    opening_cash=Decimal('1000000'),
                    actual_cash=Decimal('1000000')
                )

            # Generate orders throughout the day
            for order_num in range(num_orders):
                # Random time during business hours (8 AM - 10 PM)
                # Peak hours: 12-2 PM (lunch) and 6-8 PM (dinner)
                hour = random.choices(
                    range(8, 22),
                    weights=[5, 5, 8, 15, 20, 15, 5, 5, 8, 12, 18, 15, 10, 5],
                    k=1
                )[0]
                minute = random.randint(0, 59)

                order_time = timezone.make_aware(
                    datetime.combine(current_date, time(hour, minute, 0))
                )

                # Order type distribution
                order_type = random.choices(
                    ['DINE_IN', 'TAKEAWAY', 'DELIVERY'],
                    weights=[70, 20, 10],
                    k=1
                )[0]

                # Customer info
                customer_names = [
                    'Budi Santoso', 'Siti Rahayu', 'Ahmad Wijaya', 'Dewi Lestari',
                    'Andi Pratama', 'Rina Susanti', 'Hendra Gunawan', 'Fitri Handayani',
                    'Yudi Setiawan', 'Maya Sari', 'Agus Salim', 'Linda Permata'
                ]
                customer_name = random.choice(customer_names)
                customer_phone = f'08{random.randint(1000000000, 9999999999)}'

                # Create order
                order = Order.objects.create(
                    branch=branch,
                    table=random.choice(tables) if order_type == 'DINE_IN' else None,
                    order_type=order_type,
                    status='COMPLETED',
                    customer_name=customer_name,
                    customer_phone=customer_phone,
                    delivery_address=f'Jl. Example No. {random.randint(1, 100)}' if order_type == 'DELIVERY' else '',
                    notes=''
                )

                # Update timestamps to historical values (bypasses auto_now_add)
                Order.objects.filter(pk=order.pk).update(
                    created_at=order_time,
                    updated_at=order_time + timedelta(minutes=random.randint(20, 60))
                )

                # Add 1-5 items per order
                num_items = random.choices([1, 2, 3, 4, 5], weights=[15, 35, 30, 15, 5], k=1)[0]
                selected_products = random.sample(products, min(num_items, len(products)))

                order_total = Decimal('0')
                for product in selected_products:
                    quantity = random.randint(1, 3)
                    unit_price = Decimal(product.price)

                    # Random discount (10% chance of discount)
                    discount = Decimal('0')
                    if random.random() < 0.1:
                        discount = unit_price * Decimal('0.1')  # 10% discount

                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=quantity,
                        unit_price=unit_price,
                        discount_amount=discount,
                        notes=''
                    )

                    order_total += (unit_price * quantity) - discount

                # Create payment
                payment_method = random.choices(
                    ['CASH', 'CARD', 'MOBILE'],
                    weights=[60, 25, 15],
                    k=1
                )[0]

                # Refresh order to get updated timestamps
                order.refresh_from_db()
                payment_time = order.updated_at

                payment = Payment.objects.create(
                    order=order,
                    amount=order_total,
                    payment_method=payment_method,
                    status='COMPLETED',
                    cashier_session=cashier_session
                )

                # Update payment timestamp to historical value
                Payment.objects.filter(pk=payment.pk).update(
                    created_at=payment_time
                )

                total_orders += 1
                total_revenue += order_total

            # Update cashier session settlement data
            if cashier_session:
                day_orders = Order.objects.filter(
                    created_at__date=current_date,
                    branch=branch,
                    status='COMPLETED'
                )

                cash_payments = Payment.objects.filter(
                    cashier_session=cashier_session,
                    payment_method='CASH',
                    status='COMPLETED'
                ).count()

                card_payments = Payment.objects.filter(
                    cashier_session=cashier_session,
                    payment_method='CARD',
                    status='COMPLETED'
                ).count()

                mobile_payments = Payment.objects.filter(
                    cashier_session=cashier_session,
                    payment_method='MOBILE',
                    status='COMPLETED'
                ).count()

                day_revenue = sum(
                    payment.amount for payment in Payment.objects.filter(
                        cashier_session=cashier_session,
                        status='COMPLETED'
                    )
                )

                cashier_session.settlement_data = {
                    'total_transactions': day_orders.count(),
                    'completed_transactions': day_orders.count(),
                    'cancelled_transactions': 0,
                    'cash_payments': {'total': float(day_revenue * Decimal('0.6')), 'count': cash_payments},
                    'card_payments': {'total': float(day_revenue * Decimal('0.25')), 'count': card_payments},
                    'mobile_payments': {'total': float(day_revenue * Decimal('0.15')), 'count': mobile_payments},
                    'total_revenue': float(day_revenue)
                }
                cashier_session.actual_cash = cashier_session.opening_cash + (day_revenue * Decimal('0.6'))
                cashier_session.expected_cash = cashier_session.opening_cash + (day_revenue * Decimal('0.6'))
                cashier_session.cash_difference = Decimal('0')
                cashier_session.save()

            self.stdout.write(
                f'Day {day_offset + 1}/{days} ({current_date}): {num_orders} orders created'
            )

        self.stdout.write(self.style.SUCCESS('\n=== Seeding Complete ==='))
        self.stdout.write(f'Total orders created: {total_orders}')
        self.stdout.write(f'Total revenue: Rp {total_revenue:,.0f}')
        self.stdout.write(f'Average revenue per day: Rp {total_revenue / days:,.0f}')
        self.stdout.write(f'Average order value: Rp {total_revenue / total_orders:,.0f}')
