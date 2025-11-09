"""
Management command to reset reservation statuses for testing
Resets all reservations to PENDING and deletes auto-payments
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.hotel.models import Reservation


class Command(BaseCommand):
    help = 'Reset all reservations to PENDING and delete auto-payments'

    def handle(self, *args, **options):
        today = timezone.now().date()

        self.stdout.write(self.style.SUCCESS('\n=== Resetting All Reservations ===\n'))

        reservations = Reservation.objects.exclude(
            status__in=['CANCELLED', 'NO_SHOW']
        ).order_by('check_in_date')

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
                actions.append(f'{old_status} → {new_status}')
                reservation.status = new_status
                reservation.save()

            # Delete auto-generated payments
            auto_payments = reservation.payments.filter(
                transaction_id__startswith='AUTO-'
            )
            payment_count = auto_payments.count()

            if payment_count > 0:
                total_amount = sum(p.amount for p in auto_payments)
                actions.append(f'Deleted {payment_count} payment(s) (Rp {total_amount:,.0f})')
                auto_payments.delete()
                total_payments_deleted += payment_count

            # Update room status to available
            if reservation.room and old_status in ['CHECKED_IN', 'CHECKED_OUT']:
                actions.append(f'Room {reservation.room.number} → available')
                reservation.room.status = 'available'
                reservation.room.save()

            # Display actions
            if actions:
                self.stdout.write(
                    f'✓ {reservation.reservation_number} - Room {reservation.room.number if reservation.room else "N/A"}'
                )
                for action in actions:
                    self.stdout.write(f'  → {action}')
                total_reset += 1

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n=== Summary ==='))
        self.stdout.write(f'Reservations reset: {total_reset}')
        self.stdout.write(f'Payments deleted: {total_payments_deleted}')
        self.stdout.write(self.style.SUCCESS('\n✓ Done! Run process_past_reservations to re-process'))
