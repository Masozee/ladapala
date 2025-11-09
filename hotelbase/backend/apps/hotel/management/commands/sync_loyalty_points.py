"""
Management command to sync loyalty points from payments to Guest model
"""
from django.core.management.base import BaseCommand
from django.db.models import Sum
from apps.hotel.models import Guest, Payment, GuestLoyaltyPoints


class Command(BaseCommand):
    help = 'Sync loyalty points from payments to Guest model and create GuestLoyaltyPoints accounts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No changes will be made'))

        guests_updated = 0
        accounts_created = 0

        # Get all guests with payments (reservation is related_name, not reservations)
        guests_with_payments = Guest.objects.filter(
            reservation__payments__status='COMPLETED'
        ).distinct()

        self.stdout.write(f'Found {guests_with_payments.count()} guests with completed payments\n')

        for guest in guests_with_payments:
            # Calculate total points from payments
            payments_data = Payment.objects.filter(
                reservation__guest=guest,
                status='COMPLETED'
            ).aggregate(
                total_earned=Sum('loyalty_points_earned'),
                total_redeemed=Sum('loyalty_points_redeemed')
            )

            total_earned = payments_data['total_earned'] or 0
            total_redeemed = payments_data['total_redeemed'] or 0
            net_points = total_earned - total_redeemed

            # Current points in Guest model
            current_points = guest.loyalty_points

            self.stdout.write(f'\nGuest: {guest.full_name}')
            self.stdout.write(f'  Current Guest.loyalty_points: {current_points}')
            self.stdout.write(f'  Points earned from payments: {total_earned}')
            self.stdout.write(f'  Points redeemed from payments: {total_redeemed}')
            self.stdout.write(f'  Net points (should be): {net_points}')

            # Update Guest model if different
            if current_points != net_points:
                if not dry_run:
                    guest.loyalty_points = net_points
                    guest.save(update_fields=['loyalty_points'])
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Updated Guest.loyalty_points to {net_points}'))
                else:
                    self.stdout.write(self.style.WARNING(f'  → Would update Guest.loyalty_points to {net_points}'))
                guests_updated += 1
            else:
                self.stdout.write('  ✓ Already synced')

            # Create or update GuestLoyaltyPoints account
            try:
                loyalty_account = GuestLoyaltyPoints.objects.get(guest=guest)
                self.stdout.write(f'  GuestLoyaltyPoints exists: {loyalty_account.total_points} pts')

                # Sync if different
                if loyalty_account.total_points != net_points:
                    if not dry_run:
                        loyalty_account.total_points = net_points
                        loyalty_account.lifetime_points = total_earned
                        loyalty_account.save()
                        self.stdout.write(self.style.SUCCESS(f'  ✓ Synced GuestLoyaltyPoints to {net_points}'))
                    else:
                        self.stdout.write(self.style.WARNING(f'  → Would sync GuestLoyaltyPoints to {net_points}'))
            except GuestLoyaltyPoints.DoesNotExist:
                if not dry_run:
                    GuestLoyaltyPoints.objects.create(
                        guest=guest,
                        total_points=net_points,
                        lifetime_points=total_earned
                    )
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Created GuestLoyaltyPoints with {net_points} pts'))
                else:
                    self.stdout.write(self.style.WARNING(f'  → Would create GuestLoyaltyPoints with {net_points} pts'))
                accounts_created += 1

        self.stdout.write('\n' + '=' * 50)
        if dry_run:
            self.stdout.write(self.style.WARNING(f'\nDRY RUN: Would update {guests_updated} guests and create {accounts_created} loyalty accounts'))
            self.stdout.write('Run without --dry-run to apply changes')
        else:
            self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully updated {guests_updated} guests'))
            self.stdout.write(self.style.SUCCESS(f'✓ Successfully created {accounts_created} loyalty accounts'))
