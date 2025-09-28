from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from datetime import date, timedelta
import random
from apps.reservations.models import Reservation, ReservationRoom
from apps.guests.models import Guest
from apps.rooms.models import Room, RoomType


class Command(BaseCommand):
    help = 'Create seed data for reservations app with Indonesian hotel context'

    def handle(self, *args, **options):
        self.stdout.write('Creating seed data for reservations...')
        
        with transaction.atomic():
            # Get existing guests and rooms
            guests = list(Guest.objects.all())
            rooms = list(Room.objects.filter(status='AVAILABLE'))
            
            if not guests:
                self.stdout.write(self.style.WARNING('No guests found. Please run seed_guests first.'))
                return
            
            if not rooms:
                self.stdout.write(self.style.WARNING('No available rooms found. Please run seed_rooms first.'))
                return

            # Create reservations with Indonesian booking patterns
            today = date.today()
            
            reservations_data = [
                # Past reservations (completed)
                {
                    'guest': guests[0],  # Sari Dewi (VIP)
                    'check_in_date': today - timedelta(days=30),
                    'check_out_date': today - timedelta(days=27),
                    'adults': 2,
                    'children': 0,
                    'status': 'CHECKED_OUT',
                    'booking_source': 'DIRECT',
                    'special_requests': 'Kamar dengan pemandangan kota, late check-out jika memungkinkan',
                    'notes': 'Tamu VIP, berikan welcome fruit basket'
                },
                {
                    'guest': guests[1],  # Budi Santoso
                    'check_in_date': today - timedelta(days=20),
                    'check_out_date': today - timedelta(days=18),
                    'adults': 1,
                    'children': 0,
                    'status': 'CHECKED_OUT',
                    'booking_source': 'ONLINE',
                    'special_requests': 'Koran Kompas setiap pagi',
                    'notes': 'Tamu bisnis, butuh WiFi kencang'
                },
                {
                    'guest': guests[8],  # John Smith (International)
                    'check_in_date': today - timedelta(days=15),
                    'check_out_date': today - timedelta(days=12),
                    'adults': 2,
                    'children': 1,
                    'status': 'CHECKED_OUT',
                    'booking_source': 'OTA',
                    'special_requests': 'English newspaper, American breakfast',
                    'notes': 'Keluarga dari Amerika, anak berusia 8 tahun'
                },
                # Current reservations (checked in)
                {
                    'guest': guests[2],  # Andi Wijaya
                    'check_in_date': today - timedelta(days=2),
                    'check_out_date': today + timedelta(days=1),
                    'adults': 1,
                    'children': 0,
                    'status': 'CHECKED_IN',
                    'booking_source': 'PHONE',
                    'special_requests': 'WiFi high speed untuk video conference',
                    'notes': 'Sedang check-in, extend jika diperlukan'
                },
                {
                    'guest': guests[3],  # Maya Sari (VIP)
                    'check_in_date': today - timedelta(days=1),
                    'check_out_date': today + timedelta(days=2),
                    'adults': 2,
                    'children': 0,
                    'status': 'CHECKED_IN',
                    'booking_source': 'DIRECT',
                    'special_requests': 'Akses spa dan gym, late checkout sampai jam 15:00',
                    'notes': 'Tamu VIP, anniversary couple - siapkan surprise'
                },
                # Future reservations (confirmed)
                {
                    'guest': guests[4],  # Rudi Hartono (Business VIP)
                    'check_in_date': today + timedelta(days=3),
                    'check_out_date': today + timedelta(days=6),
                    'adults': 1,
                    'children': 0,
                    'status': 'CONFIRMED',
                    'booking_source': 'DIRECT',
                    'special_requests': 'Akses business center, meeting room standby',
                    'notes': 'Tamu VIP bisnis, mungkin ada tamu klien'
                },
                {
                    'guest': guests[9],  # Akiko Tanaka (International)
                    'check_in_date': today + timedelta(days=5),
                    'check_out_date': today + timedelta(days=8),
                    'adults': 1,
                    'children': 0,
                    'status': 'CONFIRMED',
                    'booking_source': 'OTA',
                    'special_requests': 'Kamar tenang, Japanese breakfast jika ada',
                    'notes': 'Tamu dari Jepang, pertama kali ke Jakarta'
                },
                {
                    'guest': guests[5],  # Lina Permata
                    'check_in_date': today + timedelta(days=7),
                    'check_out_date': today + timedelta(days=9),
                    'adults': 2,
                    'children': 1,
                    'status': 'CONFIRMED',
                    'booking_source': 'ONLINE',
                    'special_requests': 'Kamar non-smoking, tenang untuk anak',
                    'notes': 'Liburan keluarga dengan anak 5 tahun'
                },
                {
                    'guest': guests[6],  # Agus Setiawan
                    'check_in_date': today + timedelta(days=10),
                    'check_out_date': today + timedelta(days=13),
                    'adults': 2,
                    'children': 0,
                    'status': 'CONFIRMED',
                    'booking_source': 'DIRECT',
                    'special_requests': 'Kamar dengan pemandangan kolam renang dan balkon',
                    'notes': 'Honeymoon couple'
                },
                # Pending reservations
                {
                    'guest': guests[7],  # Indira Sartika
                    'check_in_date': today + timedelta(days=14),
                    'check_out_date': today + timedelta(days=16),
                    'adults': 1,
                    'children': 0,
                    'status': 'PENDING',
                    'booking_source': 'ONLINE',
                    'special_requests': 'Mini bar tersedia, room service 24 jam',
                    'notes': 'Menunggu konfirmasi pembayaran'
                },
                {
                    'guest': guests[10],  # Ahmad Rahman (Malaysia)
                    'check_in_date': today + timedelta(days=20),
                    'check_out_date': today + timedelta(days=23),
                    'adults': 3,
                    'children': 2,
                    'status': 'PENDING',
                    'booking_source': 'OTA',
                    'special_requests': 'Makanan halal, petunjuk arah kiblat di kamar',
                    'notes': 'Keluarga dari Malaysia, butuh 2 kamar'
                },
                # Cancelled reservation
                {
                    'guest': guests[11],  # Maria Santos
                    'check_in_date': today + timedelta(days=25),
                    'check_out_date': today + timedelta(days=27),
                    'adults': 2,
                    'children': 0,
                    'status': 'CANCELLED',
                    'booking_source': 'ONLINE',
                    'special_requests': 'Spa access, late checkout',
                    'notes': 'Dibatalkan karena perubahan jadwal kerja'
                }
            ]

            # Create reservations and assign rooms
            created_reservations = []
            available_rooms = list(rooms)
            
            for reservation_data in reservations_data:
                # Calculate deposit (30% of estimated cost)
                nights = (reservation_data['check_out_date'] - reservation_data['check_in_date']).days
                estimated_cost = Decimal('500000.00') * nights  # Average room rate
                deposit = estimated_cost * Decimal('0.3')  # 30% deposit
                
                reservation_data['deposit_amount'] = deposit
                
                reservation, created = Reservation.objects.get_or_create(
                    guest=reservation_data['guest'],
                    check_in_date=reservation_data['check_in_date'],
                    check_out_date=reservation_data['check_out_date'],
                    defaults=reservation_data
                )
                
                if created:
                    created_reservations.append(reservation)
                    self.stdout.write(f'Created reservation: {reservation.reservation_number} for {reservation.guest.full_name}')

            # Assign rooms to reservations
            room_assignments = [
                # Assign specific room types based on guest preferences
                {'reservation_idx': 0, 'room_type': 'Deluxe Room'},      # Sari Dewi (VIP)
                {'reservation_idx': 1, 'room_type': 'Superior Room'},    # Budi Santoso
                {'reservation_idx': 2, 'room_type': 'Family Room'},      # John Smith with child
                {'reservation_idx': 3, 'room_type': 'Superior Room'},    # Andi Wijaya
                {'reservation_idx': 4, 'room_type': 'Junior Suite'},     # Maya Sari (VIP anniversary)
                {'reservation_idx': 5, 'room_type': 'Junior Suite'},     # Rudi Hartono (Business VIP)
                {'reservation_idx': 6, 'room_type': 'Deluxe Room'},      # Akiko Tanaka
                {'reservation_idx': 7, 'room_type': 'Family Room'},      # Lina Permata with child
                {'reservation_idx': 8, 'room_type': 'Superior Room'},    # Agus Setiawan (honeymoon)
                {'reservation_idx': 9, 'room_type': 'Standard Room'},    # Indira Sartika
                {'reservation_idx': 10, 'room_type': 'Family Room'},     # Ahmad Rahman family (2 rooms)
                {'reservation_idx': 11, 'room_type': 'Superior Room'},   # Maria Santos (cancelled)
            ]

            for assignment in room_assignments:
                if assignment['reservation_idx'] < len(created_reservations):
                    reservation = created_reservations[assignment['reservation_idx']]
                    
                    # Find available room of the desired type
                    desired_rooms = [r for r in available_rooms 
                                   if r.room_type.name == assignment['room_type']]
                    
                    if desired_rooms:
                        room = desired_rooms[0]
                        available_rooms.remove(room)
                        
                        # Create ReservationRoom
                        room_rate = room.room_type.base_price
                        
                        # Apply discounts for VIP guests
                        if reservation.guest.is_vip:
                            discount = room_rate * Decimal('0.1')  # 10% VIP discount
                        else:
                            discount = Decimal('0.00')
                        
                        reservation_room = ReservationRoom.objects.create(
                            reservation=reservation,
                            room=room,
                            rate=room_rate,
                            discount_amount=discount,
                            extra_charges=Decimal('0.00'),
                            notes=f'Rate untuk {room.room_type.name}'
                        )
                        
                        self.stdout.write(f'Assigned room {room.number} to {reservation.guest.full_name}')
                        
                        # For Ahmad Rahman family (2 rooms needed)
                        if assignment['reservation_idx'] == 10:
                            # Add second room
                            if len(desired_rooms) > 1:
                                second_room = desired_rooms[1]
                                available_rooms.remove(second_room)
                                
                                ReservationRoom.objects.create(
                                    reservation=reservation,
                                    room=second_room,
                                    rate=room_rate,
                                    discount_amount=Decimal('0.00'),
                                    extra_charges=Decimal('0.00'),
                                    notes=f'Kamar kedua untuk keluarga'
                                )
                                self.stdout.write(f'Assigned second room {second_room.number} to {reservation.guest.full_name}')

                        # Update reservation total
                        reservation.update_total_amount()

            total_reservations = Reservation.objects.count()
            total_room_reservations = ReservationRoom.objects.count()
            pending_reservations = Reservation.objects.filter(status='PENDING').count()
            confirmed_reservations = Reservation.objects.filter(status='CONFIRMED').count()
            checked_in_reservations = Reservation.objects.filter(status='CHECKED_IN').count()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created {total_reservations} reservations with {total_room_reservations} room assignments\n'
                    f'Status breakdown: {pending_reservations} pending, {confirmed_reservations} confirmed, {checked_in_reservations} checked in'
                )
            )