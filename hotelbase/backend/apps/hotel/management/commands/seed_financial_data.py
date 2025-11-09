from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import models
from apps.hotel.models import Payment, Reservation, FinancialTransaction
from decimal import Decimal
import random


class Command(BaseCommand):
    help = 'Seed financial transaction data from existing payments and reservations'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding financial transaction data...')

        # Clear existing financial transactions
        FinancialTransaction.objects.all().delete()
        self.stdout.write('Cleared existing financial transactions')

        # Create revenue transactions from payments
        payments = Payment.objects.select_related('reservation', 'reservation__guest').all()
        revenue_count = 0

        for payment in payments:
            if payment.amount and payment.amount > 0:
                # Determine category based on payment or reservation
                category = 'room_booking'  # Default category

                # Create financial transaction
                FinancialTransaction.objects.create(
                    transaction_type='revenue',
                    category=category,
                    description=f"Payment for reservation {payment.reservation.reservation_number if payment.reservation else 'N/A'}",
                    amount=payment.amount,
                    payment_method=payment.payment_method.lower() if payment.payment_method else 'cash',
                    status='completed' if payment.status == 'COMPLETED' else 'pending',
                    reference_number=payment.transaction_id or '',
                    reservation=payment.reservation,
                    guest=payment.reservation.guest if payment.reservation else None,
                    processed_by=None,
                    transaction_date=payment.payment_date if payment.payment_date else timezone.now().date(),
                    transaction_time=payment.created_at.time() if payment.created_at else timezone.now().time(),
                    notes=payment.notes or ''
                )
                revenue_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {revenue_count} revenue transactions from payments'))

        # Create sample expense data
        expense_categories = [
            ('staff_salary', 'Staff Salary'),
            ('utilities', 'Utilities'),
            ('maintenance', 'Maintenance'),
            ('supplies', 'Supplies'),
            ('marketing', 'Marketing'),
        ]

        # Create expenses for the last 3 months
        from datetime import datetime, timedelta
        import random

        today = timezone.now().date()
        start_date = today - timedelta(days=90)

        expense_count = 0
        for i in range(60):  # Create 60 expense transactions
            expense_date = start_date + timedelta(days=random.randint(0, 90))
            category_key, category_name = random.choice(expense_categories)

            # Different amount ranges for different categories
            if category_key == 'staff_salary':
                amount = Decimal(random.randint(50000000, 150000000))  # 50M - 150M
            elif category_key == 'utilities':
                amount = Decimal(random.randint(10000000, 30000000))   # 10M - 30M
            elif category_key == 'maintenance':
                amount = Decimal(random.randint(5000000, 25000000))    # 5M - 25M
            elif category_key == 'supplies':
                amount = Decimal(random.randint(3000000, 15000000))    # 3M - 15M
            else:  # marketing
                amount = Decimal(random.randint(2000000, 10000000))    # 2M - 10M

            FinancialTransaction.objects.create(
                transaction_type='expense',
                category=category_key,
                description=f"{category_name} - {expense_date.strftime('%B %Y')}",
                amount=amount,
                payment_method=random.choice(['bank_transfer', 'cash', 'credit_card']),
                status='completed',
                reference_number=f'EXP{expense_date.strftime("%Y%m%d")}{i:03d}',
                transaction_date=expense_date,
                transaction_time=timezone.now().time(),
            )
            expense_count += 1

        self.stdout.write(self.style.SUCCESS(f'Created {expense_count} sample expense transactions'))

        # Summary
        total_transactions = FinancialTransaction.objects.count()
        total_revenue = FinancialTransaction.objects.filter(
            transaction_type='revenue',
            status='completed'
        ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

        total_expenses = FinancialTransaction.objects.filter(
            transaction_type='expense',
            status='completed'
        ).aggregate(total=models.Sum('amount'))['total'] or Decimal('0.00')

        self.stdout.write(self.style.SUCCESS(f'\n=== Summary ==='))
        self.stdout.write(self.style.SUCCESS(f'Total transactions: {total_transactions}'))
        self.stdout.write(self.style.SUCCESS(f'Total revenue: Rp {total_revenue:,.2f}'))
        self.stdout.write(self.style.SUCCESS(f'Total expenses: Rp {total_expenses:,.2f}'))
        self.stdout.write(self.style.SUCCESS(f'Net profit: Rp {(total_revenue - total_expenses):,.2f}'))
