from django.core.management.base import BaseCommand
from django.db import transaction, models
from decimal import Decimal
from datetime import date, timedelta
import random
from apps.payments.models import PaymentMethod, Bill, Payment
from apps.reservations.models import Reservation


class Command(BaseCommand):
    help = 'Create seed data for payments app with Indonesian payment methods'

    def handle(self, *args, **options):
        self.stdout.write('Creating seed data for payments...')
        
        with transaction.atomic():
            # Create payment methods popular in Indonesia
            payment_methods_data = [
                {
                    'name': 'Tunai',
                    'code': 'CASH',
                    'description': 'Pembayaran dengan uang tunai',
                    'processing_fee_percentage': Decimal('0.00')
                },
                {
                    'name': 'Transfer Bank',
                    'code': 'BANK_TRANSFER',
                    'description': 'Transfer melalui bank lokal (BCA, Mandiri, BNI, BRI)',
                    'processing_fee_percentage': Decimal('0.50')
                },
                {
                    'name': 'Kartu Kredit',
                    'code': 'CREDIT_CARD',
                    'description': 'Pembayaran dengan kartu kredit Visa/Mastercard',
                    'processing_fee_percentage': Decimal('2.50')
                },
                {
                    'name': 'Kartu Debit',
                    'code': 'DEBIT_CARD',
                    'description': 'Pembayaran dengan kartu debit ATM',
                    'processing_fee_percentage': Decimal('1.00')
                },
                {
                    'name': 'GoPay',
                    'code': 'GOPAY',
                    'description': 'Pembayaran digital melalui GoPay',
                    'processing_fee_percentage': Decimal('0.70')
                },
                {
                    'name': 'OVO',
                    'code': 'OVO',
                    'description': 'Pembayaran digital melalui OVO',
                    'processing_fee_percentage': Decimal('0.70')
                },
                {
                    'name': 'DANA',
                    'code': 'DANA',
                    'description': 'Pembayaran digital melalui DANA',
                    'processing_fee_percentage': Decimal('0.70')
                },
                {
                    'name': 'QRIS',
                    'code': 'QRIS',
                    'description': 'Pembayaran dengan QR Code Indonesian Standard',
                    'processing_fee_percentage': Decimal('0.70')
                }
            ]

            for pm_data in payment_methods_data:
                payment_method, created = PaymentMethod.objects.get_or_create(
                    code=pm_data['code'],
                    defaults=pm_data
                )
                if created:
                    self.stdout.write(f'Created payment method: {payment_method.name}')

            # Get reservations to create bills and payments for
            reservations = list(Reservation.objects.exclude(status='CANCELLED'))
            
            if not reservations:
                self.stdout.write(self.style.WARNING('No reservations found. Please run seed_reservations first.'))
                return

            # Create bills and payments for reservations
            for reservation in reservations:
                # Calculate bill amounts
                room_total = Decimal('0.00')
                for room_reservation in reservation.rooms.all():
                    room_total += room_reservation.total_amount
                
                # Add extra charges (room service, laundry, etc.)
                extra_services = Decimal('0.00')
                if random.choice([True, False]):  # 50% chance of extra services
                    services = []
                    if random.choice([True, False]):  # Room service
                        room_service = Decimal(str(random.randint(50000, 200000)))
                        extra_services += room_service
                        services.append(f'Room Service: Rp {room_service:,.0f}')
                    
                    if random.choice([True, False]):  # Laundry
                        laundry = Decimal(str(random.randint(25000, 75000)))
                        extra_services += laundry
                        services.append(f'Laundry: Rp {laundry:,.0f}')
                    
                    if random.choice([True, False]):  # Mini bar
                        minibar = Decimal(str(random.randint(30000, 150000)))
                        extra_services += minibar
                        services.append(f'Mini Bar: Rp {minibar:,.0f}')

                # Calculate taxes (11% PPN)
                subtotal = room_total + extra_services
                tax_amount = subtotal * Decimal('0.11')  # 11% VAT
                service_charge = subtotal * Decimal('0.10')  # 10% service charge
                total_amount = subtotal + tax_amount + service_charge

                # Create bill
                bill = Bill.objects.create(
                    reservation=reservation,
                    subtotal=subtotal,
                    tax_amount=tax_amount,
                    service_charge=service_charge,
                    total_amount=total_amount,
                    status='PENDING' if reservation.status == 'PENDING' else 'PARTIAL',
                    notes=f'Tagihan untuk reservasi {reservation.reservation_number}'
                )
                
                self.stdout.write(f'Created bill: {bill.bill_number} for {reservation.guest.full_name}')

                # Create payments for confirmed/completed reservations
                if reservation.status in ['CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT']:
                    payment_methods = list(PaymentMethod.objects.all())
                    
                    # Most Indonesian guests prefer certain payment methods
                    if reservation.guest.nationality == 'Indonesia':
                        preferred_methods = ['CASH', 'BANK_TRANSFER', 'GOPAY', 'OVO', 'QRIS']
                    else:
                        preferred_methods = ['CREDIT_CARD', 'DEBIT_CARD', 'CASH']
                    
                    # Filter to preferred methods
                    available_methods = [pm for pm in payment_methods if pm.code in preferred_methods]
                    if not available_methods:
                        available_methods = payment_methods

                    chosen_method = random.choice(available_methods)
                    
                    # Determine payment amount
                    if reservation.status == 'CONFIRMED':
                        # Partial payment (deposit)
                        payment_amount = total_amount * Decimal('0.30')  # 30% deposit
                        payment_status = 'COMPLETED'
                        remaining_balance = total_amount - payment_amount
                    else:
                        # Full payment for checked-in/checked-out
                        payment_amount = total_amount
                        payment_status = 'COMPLETED'
                        remaining_balance = Decimal('0.00')

                    payment = Payment.objects.create(
                        bill=bill,
                        payment_method=chosen_method,
                        amount=payment_amount,
                        status=payment_status,
                        payment_date=date.today() - timedelta(days=random.randint(0, 5)),
                        reference_number=f'PAY-{random.randint(100000, 999999)}',
                        notes=f'Pembayaran via {chosen_method.name}'
                    )
                    
                    # Update bill status 
                    if remaining_balance == Decimal('0.00'):
                        bill.status = 'PAID'
                    else:
                        bill.status = 'PARTIAL'
                    bill.save()
                    
                    self.stdout.write(f'Created payment: {payment.reference_number} - Rp {payment_amount:,.0f}')

                    # For checked-out guests, create final payment if there's remaining balance
                    if reservation.status == 'CHECKED_OUT' and remaining_balance > 0:
                        final_payment = Payment.objects.create(
                            bill=bill,
                            payment_method=chosen_method,
                            amount=remaining_balance,
                            status='COMPLETED',
                            payment_date=date.today() - timedelta(days=random.randint(0, 3)),
                            reference_number=f'PAY-{random.randint(100000, 999999)}',
                            notes=f'Pelunasan pembayaran via {chosen_method.name}'
                        )
                        
                        bill.status = 'PAID'
                        bill.save()
                        
                        self.stdout.write(f'Created final payment: {final_payment.reference_number}')

            total_payment_methods = PaymentMethod.objects.count()
            total_bills = Bill.objects.count()
            total_payments = Payment.objects.count()
            total_revenue = Payment.objects.filter(status='COMPLETED').aggregate(
                total=models.Sum('amount')
            )['total'] or Decimal('0.00')
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created:\n'
                    f'- {total_payment_methods} payment methods\n'
                    f'- {total_bills} bills\n'
                    f'- {total_payments} payments\n'
                    f'- Total revenue: Rp {total_revenue:,.0f}'
                )
            )