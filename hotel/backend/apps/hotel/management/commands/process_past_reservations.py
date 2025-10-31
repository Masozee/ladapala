"""
Management command to process past reservations and payments
This simulates real-world operations for development:
- Ensures all past reservations are paid
- Checks in reservations that should be checked in
- Checks out reservations that should be checked out
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.hotel.models import Reservation, Payment, Room
from decimal import Decimal


class Command(BaseCommand):
    help = 'Process past reservations: mark as paid, check in/out based on dates'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=1,
            help='Number of days in the past to process (default: 1 for yesterday)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        days_back = options['days']
        dry_run = options['dry_run']
        today = timezone.now().date()

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))

        self.stdout.write(self.style.SUCCESS(f'\n=== Processing reservations up to {days_back} day(s) ago ===\n'))

        # Get all reservations that need processing
        cutoff_date = today - timedelta(days=days_back)

        # Find reservations to process
        reservations_to_process = Reservation.objects.filter(
            check_in_date__lte=today
        ).exclude(
            status__in=['CANCELLED', 'NO_SHOW']
        )

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

                    if not dry_run:
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
                            notes=f'Auto-generated payment for past reservation (process_past_reservations command)',
                            transaction_id=f'AUTO-{reservation.reservation_number}'
                        )

                    total_paid += 1
                    processed = True

            # 2. Check in if check-in date is today or past and status is PENDING/CONFIRMED
            if reservation.check_in_date <= today and reservation.status in ['PENDING', 'CONFIRMED']:
                actions.append(f'Checking in (check-in date: {reservation.check_in_date})')

                if not dry_run:
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

                if not dry_run:
                    reservation.status = 'CHECKED_OUT'

                    # Update room status to cleaning
                    if reservation.room:
                        reservation.room.status = 'cleaning'
                        reservation.room.save()

                total_checked_out += 1
                processed = True

            # Save reservation if changes were made
            if processed and not dry_run:
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
        self.stdout.write(f'Total reservations processed: {total_processed}')
        self.stdout.write(f'Payments created: {total_paid}')
        self.stdout.write(f'Checked in: {total_checked_in}')
        self.stdout.write(f'Checked out: {total_checked_out}')

        if dry_run:
            self.stdout.write(self.style.WARNING('\nDRY RUN - Run without --dry-run to apply changes'))
        else:
            self.stdout.write(self.style.SUCCESS('\n✓ All changes applied successfully!'))
