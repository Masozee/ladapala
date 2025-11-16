from django.core.management.base import BaseCommand
from apps.hotel.models.guests import Guest
from apps.hotel.models.reservations import Reservation
from apps.hotel.models.checkins import CheckIn
from apps.hotel.models.rooms import Room
from decimal import Decimal
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = 'Seed hotel guests, reservations, and check-ins with Indonesian data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding hotel guests, reservations, and check-ins...')

        # Create Guests (Indonesian names and data)
        guests_data = [
            {
                'first_name': 'Budi',
                'last_name': 'Santoso',
                'email': 'budi.santoso@email.com',
                'phone': '081234567891',
                'id_type': 'national_id',
                'id_number': '3174051234567891',
                'address': 'Jl. Sudirman No. 123, Jakarta Pusat',
                'nationality': 'Indonesian',
                'date_of_birth': date(1985, 5, 15),
                'gender': 'M',
            },
            {
                'first_name': 'Siti',
                'last_name': 'Nurhaliza',
                'email': 'siti.nurhaliza@email.com',
                'phone': '081234567892',
                'id_type': 'national_id',
                'id_number': '3275042345678912',
                'address': 'Jl. Asia Afrika No. 45, Bandung',
                'nationality': 'Indonesian',
                'date_of_birth': date(1990, 8, 20),
                'gender': 'F',
            },
            {
                'first_name': 'Ahmad Dhani',
                'last_name': 'Prasetyo',
                'email': 'ahmad.dhani@email.com',
                'phone': '081234567893',
                'id_type': 'national_id',
                'id_number': '3578031234567893',
                'address': 'Jl. Tunjungan No. 78, Surabaya',
                'nationality': 'Indonesian',
                'date_of_birth': date(1988, 3, 10),
                'gender': 'M',
            },
            {
                'first_name': 'Dewi',
                'last_name': 'Lestari',
                'email': 'dewi.lestari@email.com',
                'phone': '081234567894',
                'id_type': 'national_id',
                'id_number': '3374011234567894',
                'address': 'Jl. Malioboro No. 56, Yogyakarta',
                'nationality': 'Indonesian',
                'date_of_birth': date(1992, 11, 25),
                'gender': 'F',
            },
            {
                'first_name': 'Rahmat',
                'last_name': 'Hidayat',
                'email': 'rahmat.hidayat@email.com',
                'phone': '081234567895',
                'id_type': 'national_id',
                'id_number': '3573021234567895',
                'address': 'Jl. Gajah Mada No. 234, Semarang',
                'nationality': 'Indonesian',
                'date_of_birth': date(1987, 7, 5),
                'gender': 'M',
            },
            {
                'first_name': 'Maya',
                'last_name': 'Angelina',
                'email': 'maya.angelina@email.com',
                'phone': '081234567896',
                'id_type': 'national_id',
                'id_number': '5171051234567896',
                'address': 'Jl. Gatot Subroto No. 89, Denpasar',
                'nationality': 'Indonesian',
                'date_of_birth': date(1995, 2, 14),
                'gender': 'F',
            },
            {
                'first_name': 'Andi',
                'last_name': 'Wijaya',
                'email': 'andi.wijaya@email.com',
                'phone': '081234567897',
                'id_type': 'national_id',
                'id_number': '7371031234567897',
                'address': 'Jl. Sam Ratulangi No. 12, Makassar',
                'nationality': 'Indonesian',
                'date_of_birth': date(1989, 9, 30),
                'gender': 'M',
            },
            {
                'first_name': 'Linda',
                'last_name': 'Kusuma',
                'email': 'linda.kusuma@email.com',
                'phone': '081234567898',
                'id_type': 'national_id',
                'id_number': '1471061234567898',
                'address': 'Jl. Ahmad Yani No. 67, Medan',
                'nationality': 'Indonesian',
                'date_of_birth': date(1993, 12, 8),
                'gender': 'F',
            },
            {
                'first_name': 'Rudi',
                'last_name': 'Hartono',
                'email': 'rudi.hartono@email.com',
                'phone': '081234567899',
                'id_type': 'national_id',
                'id_number': '6471021234567899',
                'address': 'Jl. Jendral Sudirman No. 45, Balikpapan',
                'nationality': 'Indonesian',
                'date_of_birth': date(1986, 4, 18),
                'gender': 'M',
            },
            {
                'first_name': 'Fitri',
                'last_name': 'Handayani',
                'email': 'fitri.handayani@email.com',
                'phone': '081234567800',
                'id_type': 'national_id',
                'id_number': '1301041234567800',
                'address': 'Jl. Imam Bonjol No. 23, Padang',
                'nationality': 'Indonesian',
                'date_of_birth': date(1991, 6, 22),
                'gender': 'F',
            },
            {
                'first_name': 'John',
                'last_name': 'Smith',
                'email': 'john.smith@email.com',
                'phone': '+6281234567801',
                'id_type': 'passport',
                'id_number': 'US123456789',
                'address': '123 Main Street, New York',
                'nationality': 'American',
                'date_of_birth': date(1980, 1, 15),
                'gender': 'M',
            },
            {
                'first_name': 'David',
                'last_name': 'Lee',
                'email': 'david.lee@email.com',
                'phone': '+6281234567802',
                'id_type': 'passport',
                'id_number': 'SG987654321',
                'address': '45 Orchard Road, Singapore',
                'nationality': 'Singaporean',
                'date_of_birth': date(1985, 7, 20),
                'gender': 'M',
            },
        ]

        guests = {}
        for guest_data in guests_data:
            guest, created = Guest.objects.get_or_create(
                email=guest_data['email'],
                defaults=guest_data
            )
            guests[guest.full_name] = guest
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created guest: {guest.full_name}'))
            else:
                self.stdout.write(f'  Guest already exists: {guest.full_name}')

        # Get available rooms
        available_rooms = list(Room.objects.all())
        if not available_rooms:
            self.stdout.write(self.style.WARNING('  No rooms available. Please run seed_hotel_data first.'))
            return

        # Create Reservations and Check-ins
        today = date.today()

        reservations_data = [
            # Past check-ins (already checked out)
            {
                'guest': 'Budi Santoso',
                'check_in_date': today - timedelta(days=10),
                'check_out_date': today - timedelta(days=7),
                'status': 'CHECKED_OUT',
                'room_type': 'Kamar Deluxe',
                'adults': 2,
                'children': 0,
                'special_requests': 'Kamar menghadap kota, lantai tinggi',
            },
            {
                'guest': 'Siti Nurhaliza',
                'check_in_date': today - timedelta(days=5),
                'check_out_date': today - timedelta(days=2),
                'status': 'CHECKED_OUT',
                'room_type': 'Kamar Superior',
                'adults': 1,
                'children': 0,
                'special_requests': 'Kamar non-smoking',
            },

            # Currently checked in
            {
                'guest': 'Ahmad Dhani Prasetyo',
                'check_in_date': today - timedelta(days=2),
                'check_out_date': today + timedelta(days=1),
                'status': 'CHECKED_IN',
                'room_type': 'Suite Junior',
                'adults': 2,
                'children': 1,
                'special_requests': 'Extra bed untuk anak, sajadah tambahan',
            },
            {
                'guest': 'Dewi Lestari',
                'check_in_date': today - timedelta(days=1),
                'check_out_date': today + timedelta(days=2),
                'status': 'CHECKED_IN',
                'room_type': 'Kamar Standard',
                'adults': 1,
                'children': 0,
                'special_requests': 'Late check-out jika memungkinkan',
            },
            {
                'guest': 'Maya Angelina',
                'check_in_date': today,
                'check_out_date': today + timedelta(days=3),
                'status': 'CHECKED_IN',
                'room_type': 'Kamar Deluxe',
                'adults': 2,
                'children': 0,
                'special_requests': 'Honeymoon package, dekorasi bunga',
            },

            # Upcoming reservations
            {
                'guest': 'Rahmat Hidayat',
                'check_in_date': today + timedelta(days=2),
                'check_out_date': today + timedelta(days=5),
                'status': 'CONFIRMED',
                'room_type': 'Kamar Keluarga',
                'adults': 2,
                'children': 2,
                'special_requests': 'Kamar connecting, extra bed anak',
            },
            {
                'guest': 'Andi Wijaya',
                'check_in_date': today + timedelta(days=3),
                'check_out_date': today + timedelta(days=6),
                'status': 'CONFIRMED',
                'room_type': 'Suite Executive',
                'adults': 2,
                'children': 0,
                'special_requests': 'Airport pickup, early check-in',
            },
            {
                'guest': 'Linda Kusuma',
                'check_in_date': today + timedelta(days=7),
                'check_out_date': today + timedelta(days=10),
                'status': 'CONFIRMED',
                'room_type': 'Kamar Superior',
                'adults': 1,
                'children': 0,
                'special_requests': 'Kamar lantai bawah, dekat lift',
            },
            {
                'guest': 'Rudi Hartono',
                'check_in_date': today + timedelta(days=10),
                'check_out_date': today + timedelta(days=12),
                'status': 'CONFIRMED',
                'room_type': 'Kamar Standard',
                'adults': 1,
                'children': 0,
                'special_requests': 'Business traveler, WiFi cepat',
            },
            {
                'guest': 'Fitri Handayani',
                'check_in_date': today + timedelta(days=14),
                'check_out_date': today + timedelta(days=17),
                'status': 'PENDING',
                'room_type': 'Kamar Keluarga',
                'adults': 2,
                'children': 1,
                'special_requests': 'Halal food only, mushola terdekat',
            },

            # International guests
            {
                'guest': 'John Smith',
                'check_in_date': today + timedelta(days=5),
                'check_out_date': today + timedelta(days=8),
                'status': 'CONFIRMED',
                'room_type': 'Suite Junior',
                'adults': 2,
                'children': 0,
                'special_requests': 'English speaking staff, city tour recommendation',
            },
            {
                'guest': 'David Lee',
                'check_in_date': today + timedelta(days=1),
                'check_out_date': today + timedelta(days=4),
                'status': 'CONFIRMED',
                'room_type': 'Kamar Superior',
                'adults': 1,
                'children': 0,
                'special_requests': 'Vegetarian breakfast option',
            },
        ]

        reservation_number = 10001
        for res_data in reservations_data:
            guest = guests.get(res_data['guest'])
            if not guest:
                self.stdout.write(self.style.WARNING(f'  Guest not found: {res_data["guest"]}'))
                continue

            # Find a room of the requested type
            room = Room.objects.filter(
                room_type__name=res_data['room_type']
            ).first()

            if not room:
                self.stdout.write(self.style.WARNING(f'  No room found for type: {res_data["room_type"]}'))
                continue

            # Calculate total amount
            nights = (res_data['check_out_date'] - res_data['check_in_date']).days
            total_amount = room.room_type.base_price * nights

            # Create reservation
            reservation, created = Reservation.objects.get_or_create(
                reservation_number=f'RES{reservation_number}',
                defaults={
                    'guest': guest,
                    'room': room,
                    'check_in_date': res_data['check_in_date'],
                    'check_out_date': res_data['check_out_date'],
                    'status': res_data['status'],
                    'adults': res_data['adults'],
                    'children': res_data['children'],
                    'total_amount': total_amount,
                    'special_requests': res_data['special_requests'],
                }
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created reservation: {reservation.reservation_number} for {guest.full_name}'))

                # Create check-in if status is CHECKED_IN or CHECKED_OUT
                if res_data['status'] in ['CHECKED_IN', 'CHECKED_OUT']:
                    from datetime import datetime
                    checkin, checkin_created = CheckIn.objects.get_or_create(
                        reservation=reservation,
                        defaults={
                            'actual_check_in_time': datetime.combine(res_data['check_in_date'], datetime.min.time()),
                            'status': 'CHECKED_IN',
                            'room_key_issued': True,
                        }
                    )
                    if checkin_created:
                        self.stdout.write(self.style.SUCCESS(f'    Created check-in for {guest.full_name}'))
            else:
                self.stdout.write(f'  Reservation already exists: {reservation.reservation_number}')

            reservation_number += 1

        self.stdout.write(self.style.SUCCESS('\nGuests, reservations, and check-ins seeding complete!'))
        self.stdout.write(f'\nSummary:')
        self.stdout.write(f'  Guests: {Guest.objects.count()}')
        self.stdout.write(f'  Reservations: {Reservation.objects.count()}')
        self.stdout.write(f'  Check-ins: {CheckIn.objects.count()}')
        self.stdout.write(f'    - Checked in status: {CheckIn.objects.filter(status="CHECKED_IN").count()}')
        self.stdout.write(f'    - Pending: {CheckIn.objects.filter(status="PENDING").count()}')
