"""
Management command to reset reservation statuses for testing
This helps simulate real-world scenarios by resetting processed reservations
back to their initial states.
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.hotel.models import Reservation, Payment
from decimal import Decimal


class Command(BaseCommand):
    help = 'Reset reservation statuses for testing purposes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Reset reservations from the last N days (default: 7)',
        )
        parser.add_argument(
            '--delete-payments',
            action='store_true',
            help='Delete auto-generated payments as well',
        )
        parser.add_argument(
            '--status',
            type=str,
            choices=['PENDING', 'CONFIRMED', 'CHECKED_IN', 'CHECKED_OUT', 'ALL'],
            default='ALL',
            help='Only reset reservations with this status (default: ALL)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        days_back = options['days']
        delete_payments = options['delete_payments']
        target_status = options['status']
        dry_run = options['dry_run']

        today = timezone.now().date()
        cutoff_date = today - timedelta(days=days_back)

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))

        self.stdout.write(self.style.SUCCESS(f'\n=== Resetting reservations from the last {days_back} days ===\n'))

        # Build query
        query = Reservation.objects.filter(
            check_in_date__gte=cutoff_date
        ).exclude(
            status__in=['CANCELLED', 'NO_SHOW']
        )

        # Filter by status if specified
        if target_status != 'ALL':
            query = query.filter(status=target_status)

        reservations = query.order_by('check_in_date')

        total_reset = 0
        total_payments_deleted = 0

        for reservation in reservations:
            actions = []
            old_status = reservation.status

            # Determine new status based on check-in date
            if reservation.check_in_date > today:
                new_status = 'CONFIRMED'
            else:
                new_status = 'PENDING'

            if old_status != new_status:
                actions.append(f'Status: {old_status} → {new_status}')
                if not dry_run:
                    reservation.status = new_status
                    reservation.save()

            # Delete auto-generated payments if requested
            if delete_payments:
                auto_payments = reservation.payments.filter(
                    transaction_id__startswith='AUTO-',
                    status='COMPLETED'
                )
                payment_count = auto_payments.count()

                if payment_count > 0:
                    total_amount = sum(p.amount for p in auto_payments)
                    actions.append(f'Deleting {payment_count} auto-payment(s) (Rp {total_amount:,.2f})')

                    if not dry_run:
                        auto_payments.delete()

                    total_payments_deleted += payment_count

            # Update room status to available if needed
            if reservation.room and old_status in ['CHECKED_IN', 'CHECKED_OUT']:
                actions.append(f'Room {reservation.room.number}: {reservation.room.status} → available')
                if not dry_run:
                    reservation.room.status = 'available'
                    reservation.room.save()

            # Display actions
            if actions:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ {reservation.reservation_number} ({reservation.guest.full_name}) - '
                        f'Room {reservation.room.number if reservation.room else "N/A"} - '
                        f'{reservation.check_in_date}'
                    )
                )
                for action in actions:
                    self.stdout.write(f'  → {action}')
                total_reset += 1

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n=== Summary ==='))
        self.stdout.write(f'Total reservations reset: {total_reset}')
        if delete_payments:
            self.stdout.write(f'Total payments deleted: {total_payments_deleted}')

        if dry_run:
            self.stdout.write(self.style.WARNING('\nDRY RUN - Run without --dry-run to apply changes'))
        else:
            self.stdout.write(self.style.SUCCESS('\n✓ All changes applied successfully!'))
            self.stdout.write(self.style.WARNING('\nYou can now run process_past_reservations to re-process these reservations'))
