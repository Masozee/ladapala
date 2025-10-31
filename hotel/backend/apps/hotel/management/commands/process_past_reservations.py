"""
Management command to process past reservations and payments
Automatically:
- Pays all unpaid reservations
- Checks in guests based on check-in date
- Checks out guests based on check-out date
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.hotel.models import Reservation, Payment


class Command(BaseCommand):
    help = 'Process all reservations: auto-pay, check in/out based on schedule'

    def handle(self, *args, **options):
        today = timezone.now().date()

        self.stdout.write(self.style.SUCCESS(f'\n=== Processing All Reservations ===\n'))

        # Get all active reservations
        reservations_to_process = Reservation.objects.exclude(
            status__in=['CANCELLED', 'NO_SHOW']
        ).order_by('check_in_date')

        total_processed = 0
        total_paid = 0
        total_checked_in = 0
        total_checked_out = 0

        for reservation in reservations_to_process:
            processed = False
            actions = []

            # 1. Ensure reservation is paid
            if not reservation.is_fully_paid():
                grand_total = reservation.get_grand_total()
                total_paid_amount = reservation.get_total_paid()
                remaining = grand_total - total_paid_amount

                if remaining > 0:
                    actions.append(f'Creating payment of Rp {remaining:,.2f}')

                    # Create payment record
                    payment = Payment.objects.create(
                        reservation=reservation,
                        amount=remaining,
                        payment_method='CASH',
                        status='COMPLETED',
                        payment_date=timezone.make_aware(
                            timezone.datetime.combine(
                                reservation.check_in_date,
                                timezone.datetime.min.time()
                            )
                        ),
                        notes=f'Auto-generated payment',
                        transaction_id=f'AUTO-{reservation.reservation_number}'
                    )

                    total_paid += 1
                    processed = True

            # 2. Check in if check-in date is today or past and status is PENDING/CONFIRMED
            if reservation.check_in_date <= today and reservation.status in ['PENDING', 'CONFIRMED']:
                actions.append(f'Checking in (check-in date: {reservation.check_in_date})')

                reservation.status = 'CHECKED_IN'

                # Update room status to occupied
                if reservation.room:
                    reservation.room.status = 'occupied'
                    reservation.room.save()

                total_checked_in += 1
                processed = True

            # 3. Check out if check-out date is in the past and status is CHECKED_IN
            if reservation.check_out_date < today and reservation.status == 'CHECKED_IN':
                actions.append(f'Checking out (check-out date: {reservation.check_out_date})')

                reservation.status = 'CHECKED_OUT'

                # Update room status to cleaning
                if reservation.room:
                    reservation.room.status = 'cleaning'
                    reservation.room.save()

                total_checked_out += 1
                processed = True

            # Save reservation if changes were made
            if processed:
                reservation.save()

            # Display actions
            if actions:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ {reservation.reservation_number} ({reservation.guest.full_name}) - '
                        f'Room {reservation.room.number if reservation.room else "N/A"}'
                    )
                )
                for action in actions:
                    self.stdout.write(f'  → {action}')
                total_processed += 1

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n=== Summary ==='))
        self.stdout.write(f'Payments created: {total_paid}')
        self.stdout.write(f'Checked in: {total_checked_in}')
        self.stdout.write(f'Checked out: {total_checked_out}')
        self.stdout.write(self.style.SUCCESS('\n✓ Done!'))
