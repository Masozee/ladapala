from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from datetime import timedelta, time
from decimal import Decimal
from apps.hotel.models import (
    EventBooking, EventPackage, FoodPackage, EventPayment,
    Guest, Room
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample event bookings with various statuses'

    def handle(self, *args, **kwargs):
        self.stdout.write('Creating sample event bookings...')

        # Get or create a user for created_by
        user, _ = User.objects.get_or_create(
            email='admin@kapulaga.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'System',
                'is_staff': True,
                'is_superuser': True
            }
        )

        # Get packages
        try:
            platinum_package = EventPackage.objects.get(name='Paket Platinum')
            gold_package = EventPackage.objects.get(name='Paket Emas')
            silver_package = EventPackage.objects.get(name='Paket Perak')
            bronze_package = EventPackage.objects.get(name='Paket Perunggu')
        except EventPackage.DoesNotExist:
            self.stdout.write(self.style.ERROR('Event packages not found. Run seed_event_data first.'))
            return

        # Get food packages
        try:
            prasmanan = FoodPackage.objects.get(name='Paket Prasmanan Nusantara Premium')
            nasi_box = FoodPackage.objects.get(name='Paket Nasi Box Ekonomis')
            coffee_break = FoodPackage.objects.get(name='Paket Coffee Break Pagi')
            tumpeng = FoodPackage.objects.get(name='Paket Tumpeng Syukuran')
        except FoodPackage.DoesNotExist:
            self.stdout.write(self.style.ERROR('Food packages not found. Run seed_event_data first.'))
            return

        # Get or create sample guests
        guests_data = [
            {
                'first_name': 'Budi',
                'last_name': 'Santoso',
                'email': 'budi.santoso@email.com',
                'phone': '+6281234567890',
                'nationality': 'Indonesia',
                'gender': 'MALE'
            },
            {
                'first_name': 'Siti',
                'last_name': 'Rahayu',
                'email': 'siti.rahayu@email.com',
                'phone': '+6281234567891',
                'nationality': 'Indonesia',
                'gender': 'FEMALE'
            },
            {
                'first_name': 'Ahmad',
                'last_name': 'Wijaya',
                'email': 'ahmad.wijaya@email.com',
                'phone': '+6281234567892',
                'nationality': 'Indonesia',
                'gender': 'MALE'
            },
            {
                'first_name': 'Dewi',
                'last_name': 'Lestari',
                'email': 'dewi.lestari@email.com',
                'phone': '+6281234567893',
                'nationality': 'Indonesia',
                'gender': 'FEMALE'
            },
            {
                'first_name': 'Rina',
                'last_name': 'Permata',
                'email': 'rina.permata@email.com',
                'phone': '+6281234567894',
                'nationality': 'Indonesia',
                'gender': 'FEMALE'
            }
        ]

        guests = []
        for guest_data in guests_data:
            guest, created = Guest.objects.get_or_create(
                email=guest_data['email'],
                defaults=guest_data
            )
            guests.append(guest)
            if created:
                self.stdout.write(f'  Created guest: {guest.full_name}')

        # Get venue (ballrooms or any available room type for events)
        # First try to find a ballroom room type
        from apps.hotel.models import RoomType
        ballroom_type = RoomType.objects.filter(name__icontains='ballroom').first()

        if ballroom_type:
            venues = Room.objects.filter(room_type=ballroom_type, is_active=True)
        else:
            # If no ballroom, use any active room
            venues = Room.objects.filter(is_active=True)

        if not venues.exists():
            self.stdout.write(self.style.ERROR('No venues found. Please create rooms first.'))
            return

        venue = venues.first()

        # Create sample bookings
        today = timezone.now().date()
        bookings_data = [
            # 1. Upcoming Wedding - Awaiting Down Payment
            {
                'guest': guests[0],
                'venue': venue,
                'venue_package': platinum_package,
                'food_package': prasmanan,
                'event_type': 'WEDDING',
                'event_name': 'Pernikahan Budi & Ani',
                'event_date': today + timedelta(days=30),
                'start_time': time(18, 0),
                'end_time': time(22, 0),
                'expected_pax': 250,
                'confirmed_pax': 250,
                'status': 'PENDING',
                
                'down_payment_paid': False,
                'full_payment_paid': False,
                'notes': 'Dekorasi tema burgundy dan gold. Panggung untuk akad nikah.',
                'special_requests': 'Mohon sediakan tempat parkir VIP untuk keluarga pengantin.'
            },
            # 2. Corporate Meeting - Down Payment Paid
            {
                'guest': guests[1],
                'venue': venue,
                'venue_package': gold_package,
                'food_package': coffee_break,
                'event_type': 'MEETING',
                'event_name': 'Annual General Meeting PT Maju Jaya',
                'event_date': today + timedelta(days=15),
                'start_time': time(9, 0),
                'end_time': time(16, 0),
                'expected_pax': 100,
                'confirmed_pax': 95,
                'status': 'CONFIRMED',
                
                'down_payment_paid': True,
                'full_payment_paid': False,
                'notes': 'Setup theater style. Proyektor dan screen harus siap jam 8:00.',
                'special_requests': 'Coffee break 2x (pagi dan siang).'
            },
            # 3. Birthday Party - Fully Paid
            {
                'guest': guests[2],
                'venue': venue,
                'venue_package': silver_package,
                'food_package': nasi_box,
                'event_type': 'BIRTHDAY',
                'event_name': 'Ulang Tahun ke-50 Pak Ahmad',
                'event_date': today + timedelta(days=7),
                'start_time': time(17, 0),
                'end_time': time(21, 0),
                'expected_pax': 80,
                'confirmed_pax': 80,
                'status': 'CONFIRMED',
                
                'down_payment_paid': True,
                'full_payment_paid': True,
                'notes': 'Dekorasi tema elegant klasik.',
                'special_requests': 'Boleh bawa kue tart sendiri.'
            },
            # 4. Seminar - Next Week
            {
                'guest': guests[3],
                'venue': venue,
                'venue_package': gold_package,
                'food_package': coffee_break,
                'event_type': 'SEMINAR',
                'event_name': 'Workshop Digital Marketing 2025',
                'event_date': today + timedelta(days=10),
                'start_time': time(8, 0),
                'end_time': time(17, 0),
                'expected_pax': 120,
                'confirmed_pax': 115,
                'status': 'CONFIRMED',
                
                'down_payment_paid': True,
                'full_payment_paid': False,
                'notes': 'Setup classroom style dengan meja. AC full blast.',
                'special_requests': 'Perlu wifi stabil untuk semua peserta.'
            },
            # 5. Wedding Reception - Next Month (Large)
            {
                'guest': guests[4],
                'venue': venue,
                'venue_package': platinum_package,
                'food_package': prasmanan,
                'event_type': 'WEDDING',
                'event_name': 'Resepsi Pernikahan Rina & Dimas',
                'event_date': today + timedelta(days=45),
                'start_time': time(18, 30),
                'end_time': time(23, 0),
                'expected_pax': 300,
                'confirmed_pax': 0,  # Not confirmed yet
                'status': 'CONFIRMED',
                
                'down_payment_paid': True,
                'full_payment_paid': False,
                'notes': 'Dekorasi tema garden romantic dengan banyak bunga.',
                'special_requests': 'Perlu photo booth area dan live music setup.'
            },
            # 6. Conference - Yesterday (Completed)
            {
                'guest': guests[1],
                'venue': venue,
                'venue_package': bronze_package,
                'food_package': coffee_break,
                'event_type': 'CONFERENCE',
                'event_name': 'Tech Conference 2024',
                'event_date': today - timedelta(days=1),
                'start_time': time(9, 0),
                'end_time': time(17, 0),
                'expected_pax': 60,
                'confirmed_pax': 58,
                'status': 'COMPLETED',
                
                'down_payment_paid': True,
                'full_payment_paid': True,
                'notes': 'Setup auditorium style.',
                'special_requests': 'Recording session diperlukan.'
            },
            # 7. Cancelled Wedding
            {
                'guest': guests[0],
                'venue': venue,
                'venue_package': gold_package,
                'food_package': prasmanan,
                'event_type': 'WEDDING',
                'event_name': 'Pernikahan Ahmad & Sari (CANCELLED)',
                'event_date': today + timedelta(days=20),
                'start_time': time(19, 0),
                'end_time': time(23, 0),
                'expected_pax': 200,
                'confirmed_pax': 0,
                'status': 'CANCELLED',
                
                'down_payment_paid': False,
                'full_payment_paid': False,
                'notes': 'Event dibatalkan oleh customer.',
                'special_requests': 'N/A'
            }
        ]

        created_bookings = []
        for booking_data in bookings_data:
            # Calculate prices
            venue_price = Decimal(booking_data['venue_package'].base_price)

            pax = booking_data['expected_pax']
            food_price = Decimal(booking_data['food_package'].price_per_pax) * pax

            subtotal = venue_price + food_price
            tax_amount = subtotal * Decimal('0.11')  # 11% tax
            grand_total = subtotal + tax_amount

            # Down payment 30%
            down_payment_amount = grand_total * Decimal('0.30')
            remaining_amount = grand_total - down_payment_amount

            # Create booking
            booking = EventBooking.objects.create(
                guest=booking_data['guest'],
                venue=booking_data['venue'],
                venue_package=booking_data['venue_package'],
                food_package=booking_data['food_package'],
                event_type=booking_data['event_type'],
                event_name=booking_data['event_name'],
                event_date=booking_data['event_date'],
                start_time=booking_data['start_time'],
                end_time=booking_data['end_time'],
                expected_pax=booking_data['expected_pax'],
                confirmed_pax=booking_data['confirmed_pax'],
                venue_price=venue_price,
                food_price=food_price,
                equipment_price=Decimal('0'),
                other_charges=Decimal('0'),
                subtotal=subtotal,
                tax_amount=tax_amount,
                grand_total=grand_total,
                down_payment_amount=down_payment_amount,
                remaining_amount=remaining_amount,
                down_payment_paid=booking_data['down_payment_paid'],
                full_payment_paid=booking_data['full_payment_paid'],
                status=booking_data['status'],
                notes=booking_data['notes'],
                special_requests=booking_data['special_requests'],
                created_by=user
            )
            created_bookings.append(booking)

            self.stdout.write(f'  ✓ Created booking: {booking.booking_number} - {booking.event_name}')

            # Create payment records for bookings with payments
            if booking_data['down_payment_paid']:
                down_payment = EventPayment.objects.create(
                    event_booking=booking,
                    payment_type='DOWN_PAYMENT',
                    payment_method='TRANSFER',
                    amount=down_payment_amount,
                    status='COMPLETED',
                    payment_date=timezone.now() - timedelta(days=7),
                    notes='Down payment via transfer bank'
                )
                self.stdout.write(f'    → Down payment recorded: {down_payment.payment_number}')

            if booking_data['full_payment_paid']:
                full_payment = EventPayment.objects.create(
                    event_booking=booking,
                    payment_type='FULL_PAYMENT',
                    payment_method='TRANSFER',
                    amount=remaining_amount,
                    status='COMPLETED',
                    payment_date=timezone.now() - timedelta(days=2),
                    notes='Pelunasan via transfer bank'
                )
                self.stdout.write(f'    → Full payment recorded: {full_payment.payment_number}')

        self.stdout.write(self.style.SUCCESS(f'\n✓ Successfully created {len(created_bookings)} event bookings!'))

        # Summary
        self.stdout.write('\nSummary by Status:')
        self.stdout.write(f'  Pending: {EventBooking.objects.filter(status="PENDING").count()}')
        self.stdout.write(f'  Confirmed: {EventBooking.objects.filter(status="CONFIRMED").count()}')
        self.stdout.write(f'  Completed: {EventBooking.objects.filter(status="COMPLETED").count()}')
        self.stdout.write(f'  Cancelled: {EventBooking.objects.filter(status="CANCELLED").count()}')

        self.stdout.write('\nSummary by Payment Status:')
        self.stdout.write(f'  Unpaid (no payments): {EventBooking.objects.filter(down_payment_paid=False, full_payment_paid=False).count()}')
        self.stdout.write(f'  Partially Paid (DP only): {EventBooking.objects.filter(down_payment_paid=True, full_payment_paid=False).count()}')
        self.stdout.write(f'  Fully Paid: {EventBooking.objects.filter(full_payment_paid=True).count()}')
