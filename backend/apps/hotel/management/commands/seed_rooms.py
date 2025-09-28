from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from apps.rooms.models import RoomType, Room


class Command(BaseCommand):
    help = 'Create seed data for rooms app with Indonesian hotel context'

    def handle(self, *args, **options):
        self.stdout.write('Creating seed data for rooms...')
        
        with transaction.atomic():
            # Create Room Types with Indonesian hotel standards
            room_types_data = [
                {
                    'name': 'Standard Room',
                    'description': 'Kamar standar dengan fasilitas dasar, AC, TV LED, WiFi gratis, dan kamar mandi pribadi',
                    'base_price': Decimal('350000.00'),  # 350k IDR per night
                    'max_occupancy': 2,
                    'size_sqm': 20.0,
                    'amenities': 'AC, TV LED 32", WiFi gratis, kamar mandi pribadi, meja kerja, lemari pakaian'
                },
                {
                    'name': 'Superior Room',
                    'description': 'Kamar superior dengan fasilitas lengkap dan pemandangan kota',
                    'base_price': Decimal('500000.00'),  # 500k IDR per night
                    'max_occupancy': 2,
                    'size_sqm': 25.0,
                    'amenities': 'AC, TV LED 42", WiFi gratis, mini bar, kamar mandi dengan bathtub, balkon, meja kerja'
                },
                {
                    'name': 'Deluxe Room',
                    'description': 'Kamar deluxe dengan fasilitas mewah dan pemandangan taman',
                    'base_price': Decimal('750000.00'),  # 750k IDR per night
                    'max_occupancy': 3,
                    'size_sqm': 30.0,
                    'amenities': 'AC, TV LED 50", WiFi gratis, mini bar, kamar mandi mewah dengan bathtub, sofa, balkon pribadi'
                },
                {
                    'name': 'Family Room',
                    'description': 'Kamar keluarga dengan tempat tidur ganda untuk 4 orang',
                    'base_price': Decimal('950000.00'),  # 950k IDR per night
                    'max_occupancy': 4,
                    'size_sqm': 40.0,
                    'amenities': '2 tempat tidur queen, AC, TV LED 50", WiFi gratis, mini bar, area duduk, 2 kamar mandi'
                },
                {
                    'name': 'Junior Suite',
                    'description': 'Suite junior dengan ruang tamu terpisah dan fasilitas VIP',
                    'base_price': Decimal('1200000.00'),  # 1.2M IDR per night
                    'max_occupancy': 3,
                    'size_sqm': 45.0,
                    'amenities': 'Ruang tamu terpisah, AC, TV LED 55", WiFi gratis, mini bar premium, jacuzzi, balkon luas'
                },
                {
                    'name': 'Presidential Suite',
                    'description': 'Suite presidential dengan fasilitas terlengkap dan layanan butler',
                    'base_price': Decimal('2500000.00'),  # 2.5M IDR per night
                    'max_occupancy': 4,
                    'size_sqm': 80.0,
                    'amenities': '2 kamar tidur, ruang tamu, ruang makan, dapur mini, jacuzzi, balkon panorama, layanan butler 24 jam'
                }
            ]

            for room_type_data in room_types_data:
                room_type, created = RoomType.objects.get_or_create(
                    name=room_type_data['name'],
                    defaults=room_type_data
                )
                if created:
                    self.stdout.write(f'Created room type: {room_type.name}')

            # Create Rooms with Indonesian naming convention
            rooms_data = []
            floor_prefixes = ['1', '2', '3', '4', '5']  # 5 floors
            
            # Standard Rooms - Floor 1 & 2
            for floor in ['1', '2']:
                for room_num in range(1, 21):  # 20 rooms per floor
                    room_number = f'{floor}{room_num:02d}'  # Format: 101, 102, etc.
                    rooms_data.append({
                        'number': room_number,
                        'room_type': RoomType.objects.get(name='Standard Room'),
                        'floor': int(floor),
                        'status': 'AVAILABLE',
                        'notes': f'Kamar standar lantai {floor} dengan pemandangan kota'
                    })

            # Superior Rooms - Floor 3
            for room_num in range(1, 16):  # 15 superior rooms
                room_number = f'3{room_num:02d}'
                rooms_data.append({
                    'number': room_number,
                    'room_type': RoomType.objects.get(name='Superior Room'),
                    'floor': 3,
                    'status': 'AVAILABLE',
                    'notes': f'Kamar superior lantai 3 dengan pemandangan kota dan taman'
                })

            # Deluxe Rooms - Floor 3 (remaining) & Floor 4
            for room_num in range(16, 21):  # 5 deluxe rooms floor 3
                room_number = f'3{room_num:02d}'
                rooms_data.append({
                    'number': room_number,
                    'room_type': RoomType.objects.get(name='Deluxe Room'),
                    'floor': 3,
                    'status': 'AVAILABLE',
                    'notes': f'Kamar deluxe lantai 3 dengan pemandangan taman'
                })
            
            for room_num in range(1, 11):  # 10 deluxe rooms floor 4
                room_number = f'4{room_num:02d}'
                rooms_data.append({
                    'number': room_number,
                    'room_type': RoomType.objects.get(name='Deluxe Room'),
                    'floor': 4,
                    'status': 'AVAILABLE',
                    'notes': f'Kamar deluxe lantai 4 dengan pemandangan panorama kota'
                })

            # Family Rooms - Floor 4
            for room_num in range(11, 16):  # 5 family rooms
                room_number = f'4{room_num:02d}'
                rooms_data.append({
                    'number': room_number,
                    'room_type': RoomType.objects.get(name='Family Room'),
                    'floor': 4,
                    'status': 'AVAILABLE',
                    'notes': f'Kamar keluarga lantai 4 untuk maksimal 4 tamu'
                })

            # Junior Suites - Floor 4 & 5
            for room_num in range(16, 21):  # 5 junior suites floor 4
                room_number = f'4{room_num:02d}'
                rooms_data.append({
                    'number': room_number,
                    'room_type': RoomType.objects.get(name='Junior Suite'),
                    'floor': 4,
                    'status': 'AVAILABLE',
                    'notes': f'Junior suite lantai 4 dengan ruang tamu terpisah'
                })
            
            for room_num in range(1, 6):  # 5 junior suites floor 5
                room_number = f'5{room_num:02d}'
                rooms_data.append({
                    'number': room_number,
                    'room_type': RoomType.objects.get(name='Junior Suite'),
                    'floor': 5,
                    'status': 'AVAILABLE',
                    'notes': f'Junior suite lantai 5 dengan pemandangan panorama'
                })

            # Presidential Suites - Floor 5
            for room_num in range(6, 9):  # 3 presidential suites
                room_number = f'5{room_num:02d}'
                rooms_data.append({
                    'number': room_number,
                    'room_type': RoomType.objects.get(name='Presidential Suite'),
                    'floor': 5,
                    'status': 'AVAILABLE',
                    'notes': f'Presidential suite lantai 5 dengan fasilitas mewah dan layanan butler'
                })

            # Add some rooms with different statuses
            maintenance_rooms = ['102', '205', '301']
            occupied_rooms = ['101', '201', '301', '401', '501']
            
            for room_data in rooms_data:
                if room_data['number'] in maintenance_rooms:
                    room_data['status'] = 'MAINTENANCE'
                elif room_data['number'] in occupied_rooms:
                    room_data['status'] = 'OCCUPIED'

                room, created = Room.objects.get_or_create(
                    number=room_data['number'],
                    defaults=room_data
                )
                if created:
                    self.stdout.write(f'Created room: {room.number} ({room.room_type.name})')

            total_rooms = Room.objects.count()
            total_room_types = RoomType.objects.count()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created {total_room_types} room types and {total_rooms} rooms'
                )
            )