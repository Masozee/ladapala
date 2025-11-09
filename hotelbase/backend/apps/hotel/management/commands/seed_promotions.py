"""
Management command to seed promotion data (vouchers, discounts, loyalty program)
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta, date
from decimal import Decimal

from apps.hotel.models import (
    Voucher, Discount, LoyaltyProgram, GuestLoyaltyPoints,
    LoyaltyTransaction, Guest, RoomType
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed promotion data (vouchers, discounts, loyalty program)'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding promotion data...')

        # Get or create admin user
        admin_user, _ = User.objects.get_or_create(
            email='admin@kapulaga.net',
            defaults={
                'first_name': 'Admin',
                'last_name': 'Hotel',
                'is_staff': True,
                'is_superuser': True,
            }
        )

        # Get room types for restrictions
        room_types = list(RoomType.objects.all()[:5])
        deluxe_rooms = RoomType.objects.filter(name__icontains='deluxe').first()

        self.stdout.write('Creating vouchers...')
        self.create_vouchers(admin_user, room_types, deluxe_rooms)

        self.stdout.write('Creating discounts...')
        self.create_discounts(room_types)

        self.stdout.write('Creating loyalty program...')
        self.create_loyalty_program()

        self.stdout.write('Creating guest loyalty accounts...')
        self.create_guest_loyalty_accounts()

        self.stdout.write(self.style.SUCCESS('✓ Promotion data seeded successfully!'))

    def create_vouchers(self, admin_user, room_types, deluxe_rooms):
        """Create sample vouchers"""

        today = timezone.now()

        vouchers_data = [
            {
                'code': 'WELCOME2025',
                'name': 'Welcome Voucher 2025',
                'description': 'Welcome discount for new guests',
                'voucher_type': 'PERCENTAGE',
                'discount_percentage': Decimal('15.00'),
                'max_discount_amount': Decimal('500000'),
                'usage_limit': 100,
                'usage_per_guest': 1,
                'valid_from': today,
                'valid_until': today + timedelta(days=90),
                'min_booking_amount': Decimal('1000000'),
                'min_nights': 2,
                'status': 'ACTIVE',
                'is_public': True,
                'terms_and_conditions': 'Valid for first-time guests only. Cannot be combined with other promotions.',
            },
            {
                'code': 'STAYCATION50',
                'name': 'Staycation Special',
                'description': 'Rp 500,000 off for weekend stays',
                'voucher_type': 'FIXED_AMOUNT',
                'discount_amount': Decimal('500000'),
                'usage_limit': 50,
                'usage_per_guest': 2,
                'valid_from': today,
                'valid_until': today + timedelta(days=60),
                'min_booking_amount': Decimal('1500000'),
                'min_nights': 2,
                'status': 'ACTIVE',
                'is_public': True,
                'terms_and_conditions': 'Valid for weekend bookings only (Friday-Sunday).',
            },
            {
                'code': 'LONGSTAY30',
                'name': 'Long Stay Discount',
                'description': '30% off for extended stays',
                'voucher_type': 'PERCENTAGE',
                'discount_percentage': Decimal('30.00'),
                'max_discount_amount': Decimal('2000000'),
                'usage_limit': 20,
                'usage_per_guest': 1,
                'valid_from': today,
                'valid_until': today + timedelta(days=120),
                'min_booking_amount': Decimal('3000000'),
                'min_nights': 5,
                'status': 'ACTIVE',
                'is_public': True,
                'terms_and_conditions': 'Minimum 5 nights stay required. Valid for all room types.',
            },
            {
                'code': 'VIPUPGRADE',
                'name': 'VIP Room Upgrade',
                'description': 'Free upgrade to Deluxe room',
                'voucher_type': 'UPGRADE',
                'usage_limit': 10,
                'usage_per_guest': 1,
                'valid_from': today - timedelta(days=10),
                'valid_until': today + timedelta(days=30),
                'min_booking_amount': Decimal('800000'),
                'min_nights': 1,
                'status': 'ACTIVE',
                'is_public': False,
                'terms_and_conditions': 'Subject to availability. Upgrade to next room category.',
            },
            {
                'code': 'FREENIGHT',
                'name': 'Free Night Stay',
                'description': 'Book 3 nights, get 1 free',
                'voucher_type': 'FREE_NIGHT',
                'usage_limit': 30,
                'usage_per_guest': 1,
                'valid_from': today,
                'valid_until': today + timedelta(days=45),
                'min_booking_amount': Decimal('2000000'),
                'min_nights': 3,
                'status': 'ACTIVE',
                'is_public': True,
                'terms_and_conditions': 'Free night of equal or lesser value. Booking must be 3+ nights.',
            },
            {
                'code': 'EARLY2025',
                'name': 'Early Bird 2025',
                'description': '20% off for advance bookings',
                'voucher_type': 'PERCENTAGE',
                'discount_percentage': Decimal('20.00'),
                'max_discount_amount': Decimal('1000000'),
                'usage_limit': 200,
                'usage_per_guest': 3,
                'valid_from': today,
                'valid_until': today + timedelta(days=180),
                'min_booking_amount': Decimal('1200000'),
                'min_nights': 2,
                'status': 'ACTIVE',
                'is_public': True,
                'terms_and_conditions': 'Book 30 days in advance to qualify.',
            },
            {
                'code': 'EXPIRED2024',
                'name': 'New Year 2024 Promo',
                'description': 'Expired promotion from last year',
                'voucher_type': 'PERCENTAGE',
                'discount_percentage': Decimal('25.00'),
                'usage_limit': 100,
                'usage_count': 87,
                'usage_per_guest': 1,
                'valid_from': today - timedelta(days=120),
                'valid_until': today - timedelta(days=30),
                'min_booking_amount': Decimal('1000000'),
                'min_nights': 1,
                'status': 'EXPIRED',
                'is_public': True,
                'terms_and_conditions': 'This voucher has expired.',
            },
            {
                'code': 'SOLD0UT',
                'name': 'Flash Sale - Used Up',
                'description': 'Popular flash sale (all codes used)',
                'voucher_type': 'FIXED_AMOUNT',
                'discount_amount': Decimal('300000'),
                'usage_limit': 50,
                'usage_count': 50,
                'usage_per_guest': 1,
                'valid_from': today - timedelta(days=15),
                'valid_until': today + timedelta(days=15),
                'min_booking_amount': Decimal('1000000'),
                'min_nights': 1,
                'status': 'USED_UP',
                'is_public': True,
                'terms_and_conditions': 'All voucher codes have been redeemed.',
            },
            {
                'code': 'INACTIVE2025',
                'name': 'Inactive Promo',
                'description': 'Currently inactive voucher',
                'voucher_type': 'PERCENTAGE',
                'discount_percentage': Decimal('10.00'),
                'usage_limit': 100,
                'usage_per_guest': 1,
                'valid_from': today,
                'valid_until': today + timedelta(days=60),
                'min_booking_amount': Decimal('500000'),
                'min_nights': 1,
                'status': 'INACTIVE',
                'is_public': False,
                'terms_and_conditions': 'Voucher is currently disabled.',
            },
        ]

        for voucher_data in vouchers_data:
            voucher, created = Voucher.objects.get_or_create(
                code=voucher_data['code'],
                defaults={**voucher_data, 'created_by': admin_user}
            )

            # Add room type restrictions for some vouchers
            if created and deluxe_rooms and voucher.code in ['VIPUPGRADE', 'LONGSTAY30']:
                voucher.applicable_room_types.add(deluxe_rooms)

            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'  - Voucher {voucher.code}: {status}')

    def create_discounts(self, room_types):
        """Create automatic discounts"""

        today = date.today()

        discounts_data = [
            {
                'name': 'Early Bird - Book 30 Days Ahead',
                'description': 'Save 15% when you book 30 days in advance',
                'discount_type': 'EARLY_BIRD',
                'discount_percentage': Decimal('15.00'),
                'min_nights': 2,
                'min_advance_days': 30,
                'valid_from': today,
                'valid_until': today.replace(year=today.year + 1),
                'is_active': True,
                'priority': 10,
            },
            {
                'name': 'Super Early Bird - Book 60 Days Ahead',
                'description': 'Save 25% when you book 60+ days in advance',
                'discount_type': 'EARLY_BIRD',
                'discount_percentage': Decimal('25.00'),
                'min_nights': 3,
                'min_advance_days': 60,
                'valid_from': today,
                'valid_until': today.replace(year=today.year + 1),
                'is_active': True,
                'priority': 20,
            },
            {
                'name': 'Last Minute Deal',
                'description': 'Save 20% on bookings made within 3 days',
                'discount_type': 'LAST_MINUTE',
                'discount_percentage': Decimal('20.00'),
                'min_nights': 1,
                'min_advance_days': 0,
                'max_advance_days': 3,
                'valid_from': today,
                'valid_until': today.replace(year=today.year + 1),
                'is_active': True,
                'priority': 15,
            },
            {
                'name': 'Extended Stay - 7+ Nights',
                'description': 'Save 20% on stays of 7 nights or more',
                'discount_type': 'LONG_STAY',
                'discount_percentage': Decimal('20.00'),
                'min_nights': 7,
                'min_advance_days': 0,
                'valid_from': today,
                'valid_until': today.replace(year=today.year + 1),
                'is_active': True,
                'priority': 12,
            },
            {
                'name': 'Monthly Stay Discount',
                'description': 'Save 30% on stays of 30 nights or more',
                'discount_type': 'LONG_STAY',
                'discount_percentage': Decimal('30.00'),
                'min_nights': 30,
                'min_advance_days': 0,
                'valid_from': today,
                'valid_until': today.replace(year=today.year + 1),
                'is_active': True,
                'priority': 25,
            },
            {
                'name': 'Holiday Season Special',
                'description': 'Special discount for December bookings',
                'discount_type': 'SEASONAL',
                'discount_percentage': Decimal('10.00'),
                'min_nights': 2,
                'min_advance_days': 14,
                'valid_from': today,
                'valid_until': date(today.year, 12, 31) if today.month < 12 else date(today.year + 1, 12, 31),
                'applicable_from': date(today.year, 12, 1) if today.month < 12 else date(today.year + 1, 12, 1),
                'applicable_until': date(today.year, 12, 31) if today.month < 12 else date(today.year + 1, 12, 31),
                'is_active': True,
                'priority': 8,
            },
            {
                'name': 'Weekend Getaway',
                'description': 'Special rates for weekend stays',
                'discount_type': 'PACKAGE',
                'discount_percentage': Decimal('12.00'),
                'min_nights': 2,
                'min_advance_days': 7,
                'valid_from': today,
                'valid_until': today + timedelta(days=90),
                'is_active': True,
                'priority': 5,
            },
            {
                'name': 'Membership Gold',
                'description': 'Exclusive discount for Gold members',
                'discount_type': 'MEMBERSHIP',
                'discount_percentage': Decimal('15.00'),
                'min_nights': 1,
                'min_advance_days': 0,
                'valid_from': today,
                'valid_until': today.replace(year=today.year + 1),
                'is_active': True,
                'priority': 30,
            },
            {
                'name': 'Inactive Summer Promo',
                'description': 'Summer promotion (currently inactive)',
                'discount_type': 'SEASONAL',
                'discount_percentage': Decimal('18.00'),
                'min_nights': 3,
                'min_advance_days': 7,
                'valid_from': today - timedelta(days=60),
                'valid_until': today + timedelta(days=60),
                'is_active': False,
                'priority': 5,
            },
        ]

        for discount_data in discounts_data:
            discount, created = Discount.objects.get_or_create(
                name=discount_data['name'],
                defaults=discount_data
            )

            status = 'Created' if created else 'Already exists'
            self.stdout.write(f'  - Discount "{discount.name}": {status}')

    def create_loyalty_program(self):
        """Create loyalty program configuration"""

        program, created = LoyaltyProgram.objects.get_or_create(
            name='Hotel Kapulaga Rewards',
            defaults={
                'description': 'Earn points on every stay and redeem for discounts',
                'points_per_rupiah': Decimal('1.00'),  # 1 point per Rp 1
                'rupiah_per_point': Decimal('100.00'),  # 1 point = Rp 100
                'min_points_to_redeem': 100,
                'points_expiry_months': 12,
                'is_active': True,
            }
        )

        status = 'Created' if created else 'Already exists'
        self.stdout.write(f'  - Loyalty Program "{program.name}": {status}')

    def create_guest_loyalty_accounts(self):
        """Create loyalty accounts for existing guests with sample data"""

        guests = Guest.objects.all()[:20]  # Get first 20 guests

        for guest in guests:
            loyalty_account, created = GuestLoyaltyPoints.objects.get_or_create(
                guest=guest,
                defaults={
                    'total_points': 0,
                    'lifetime_points': 0,
                }
            )

            if created:
                # Add some sample transactions
                import random

                # Random earned points (from past bookings)
                earned_points = random.randint(500, 5000)
                loyalty_account.add_points(
                    points=earned_points,
                    description=f'Points earned from past bookings',
                    reference_type='BOOKING'
                )

                # Some guests have redeemed points
                if random.random() > 0.6:  # 40% have redeemed
                    redeemed = random.randint(100, min(500, loyalty_account.total_points))
                    loyalty_account.redeem_points(
                        points=redeemed,
                        description=f'Points redeemed for discount',
                        reference_type='PAYMENT'
                    )

                self.stdout.write(f'  - Created loyalty account for {f"{guest.first_name} {guest.last_name}"}: {loyalty_account.total_points} points')
            else:
                self.stdout.write(f'  - Loyalty account already exists for {f"{guest.first_name} {guest.last_name}"}')
