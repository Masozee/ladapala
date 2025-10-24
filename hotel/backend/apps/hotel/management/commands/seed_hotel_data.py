from django.core.management.base import BaseCommand
from apps.hotel.models.rooms import RoomType, Room
from apps.hotel.models.inventory import InventoryItem
from apps.hotel.models.maintenance import MaintenanceTechnician
from apps.hotel.models.calendars import Holiday
from decimal import Decimal
from datetime import date


class Command(BaseCommand):
    help = 'Seed hotel data (rooms, room types, inventory, etc.) - preserves existing data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding hotel data...')

        # Create Room Types (Indonesian Hotel Style)
        room_types_data = [
            {
                'name': 'Kamar Standard',
                'description': 'Kamar nyaman dengan fasilitas dasar lengkap',
                'base_price': Decimal('350000.00'),
                'max_occupancy': 2,
                'size_sqm': 20.0,
                'amenities': 'AC, TV, WiFi, Shower Air Panas, Sajadah, Mushaf Al-Quran',
            },
            {
                'name': 'Kamar Superior',
                'description': 'Kamar superior dengan pemandangan kota',
                'base_price': Decimal('500000.00'),
                'max_occupancy': 2,
                'size_sqm': 28.0,
                'amenities': 'AC, Smart TV, WiFi Cepat, Bathtub, Minibar, Sajadah, Mushaf Al-Quran, Tea/Coffee Maker',
            },
            {
                'name': 'Kamar Deluxe',
                'description': 'Kamar deluxe dengan ruang lebih luas',
                'base_price': Decimal('750000.00'),
                'max_occupancy': 3,
                'size_sqm': 35.0,
                'amenities': 'AC, Smart TV, WiFi Cepat, Bathtub, Minibar Premium, Sajadah, Mushaf Al-Quran, Pantry Kecil, Sofa',
            },
            {
                'name': 'Kamar Keluarga',
                'description': 'Kamar keluarga cocok untuk liburan bersama',
                'base_price': Decimal('900000.00'),
                'max_occupancy': 5,
                'size_sqm': 42.0,
                'amenities': 'AC, 2 TV, WiFi, Shower Air Panas, Area Anak, 2 Sajadah, 2 Mushaf Al-Quran, Extra Bed',
            },
            {
                'name': 'Suite Junior',
                'description': 'Suite junior dengan ruang tamu terpisah',
                'base_price': Decimal('1200000.00'),
                'max_occupancy': 3,
                'size_sqm': 50.0,
                'amenities': 'AC, 2 Smart TV, WiFi Premium, Jacuzzi, Minibar Premium, Ruang Tamu, Sajadah Premium, Mushaf Al-Quran, Pantry',
            },
            {
                'name': 'Suite Executive',
                'description': 'Suite mewah untuk tamu VIP',
                'base_price': Decimal('2000000.00'),
                'max_occupancy': 4,
                'size_sqm': 75.0,
                'amenities': 'AC Central, 3 Smart TV, WiFi Ultra, Jacuzzi, Bathtub Terpisah, Minibar Premium, Ruang Tamu Luas, Ruang Makan, Sajadah Premium, Mushaf Al-Quran, Kitchen',
            },
        ]

        room_types = {}
        for rt_data in room_types_data:
            rt, created = RoomType.objects.get_or_create(
                name=rt_data['name'],
                defaults=rt_data
            )
            room_types[rt.name] = rt
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created room type: {rt.name}'))
            else:
                self.stdout.write(f'  Room type already exists: {rt.name}')

        # Create Rooms (Indonesian numbering style)
        rooms_data = [
            # Kamar Standard (Lantai 1)
            {'number': '101', 'type': 'Kamar Standard', 'floor': 1, 'status': 'AVAILABLE'},
            {'number': '102', 'type': 'Kamar Standard', 'floor': 1, 'status': 'AVAILABLE'},
            {'number': '103', 'type': 'Kamar Standard', 'floor': 1, 'status': 'AVAILABLE'},
            {'number': '104', 'type': 'Kamar Standard', 'floor': 1, 'status': 'AVAILABLE'},
            {'number': '105', 'type': 'Kamar Standard', 'floor': 1, 'status': 'AVAILABLE'},
            {'number': '106', 'type': 'Kamar Standard', 'floor': 1, 'status': 'AVAILABLE'},

            # Kamar Superior (Lantai 2)
            {'number': '201', 'type': 'Kamar Superior', 'floor': 2, 'status': 'AVAILABLE'},
            {'number': '202', 'type': 'Kamar Superior', 'floor': 2, 'status': 'AVAILABLE'},
            {'number': '203', 'type': 'Kamar Superior', 'floor': 2, 'status': 'AVAILABLE'},
            {'number': '204', 'type': 'Kamar Superior', 'floor': 2, 'status': 'AVAILABLE'},
            {'number': '205', 'type': 'Kamar Superior', 'floor': 2, 'status': 'AVAILABLE'},

            # Kamar Deluxe (Lantai 3)
            {'number': '301', 'type': 'Kamar Deluxe', 'floor': 3, 'status': 'AVAILABLE'},
            {'number': '302', 'type': 'Kamar Deluxe', 'floor': 3, 'status': 'AVAILABLE'},
            {'number': '303', 'type': 'Kamar Deluxe', 'floor': 3, 'status': 'AVAILABLE'},
            {'number': '304', 'type': 'Kamar Deluxe', 'floor': 3, 'status': 'AVAILABLE'},

            # Kamar Keluarga (Lantai 3)
            {'number': '305', 'type': 'Kamar Keluarga', 'floor': 3, 'status': 'AVAILABLE'},
            {'number': '306', 'type': 'Kamar Keluarga', 'floor': 3, 'status': 'AVAILABLE'},
            {'number': '307', 'type': 'Kamar Keluarga', 'floor': 3, 'status': 'AVAILABLE'},

            # Suite Junior (Lantai 4)
            {'number': '401', 'type': 'Suite Junior', 'floor': 4, 'status': 'AVAILABLE'},
            {'number': '402', 'type': 'Suite Junior', 'floor': 4, 'status': 'AVAILABLE'},

            # Suite Executive (Lantai 5)
            {'number': '501', 'type': 'Suite Executive', 'floor': 5, 'status': 'AVAILABLE'},
            {'number': '502', 'type': 'Suite Executive', 'floor': 5, 'status': 'AVAILABLE'},
        ]

        for room_data in rooms_data:
            room_type = room_types[room_data.pop('type')]
            room, created = Room.objects.get_or_create(
                number=room_data['number'],
                defaults={**room_data, 'room_type': room_type}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created room: {room.number}'))
            else:
                self.stdout.write(f'  Room already exists: {room.number}')

        # Create Inventory Items (Indonesian hotel amenities)
        inventory_data = [
            # Linen & Textiles
            {'name': 'Sprei Putih (King)', 'category': 'AMENITIES', 'unit_price': Decimal('75000'), 'current_stock': 120, 'minimum_stock': 40, 'unit_of_measurement': 'set'},
            {'name': 'Sprei Putih (Queen)', 'category': 'AMENITIES', 'unit_price': Decimal('60000'), 'current_stock': 150, 'minimum_stock': 50, 'unit_of_measurement': 'set'},
            {'name': 'Sarung Bantal', 'category': 'AMENITIES', 'unit_price': Decimal('15000'), 'current_stock': 200, 'minimum_stock': 60, 'unit_of_measurement': 'pcs'},
            {'name': 'Selimut', 'category': 'AMENITIES', 'unit_price': Decimal('85000'), 'current_stock': 100, 'minimum_stock': 30, 'unit_of_measurement': 'pcs'},
            {'name': 'Handuk Mandi Besar', 'category': 'AMENITIES', 'unit_price': Decimal('45000'), 'current_stock': 150, 'minimum_stock': 50, 'unit_of_measurement': 'pcs'},
            {'name': 'Handuk Tangan', 'category': 'AMENITIES', 'unit_price': Decimal('20000'), 'current_stock': 180, 'minimum_stock': 60, 'unit_of_measurement': 'pcs'},
            {'name': 'Handuk Kaki', 'category': 'AMENITIES', 'unit_price': Decimal('25000'), 'current_stock': 120, 'minimum_stock': 40, 'unit_of_measurement': 'pcs'},

            # Toiletries
            {'name': 'Shampoo Sachet 10ml', 'category': 'AMENITIES', 'unit_price': Decimal('3000'), 'current_stock': 300, 'minimum_stock': 100, 'unit_of_measurement': 'pcs'},
            {'name': 'Sabun Batangan 50gr', 'category': 'AMENITIES', 'unit_price': Decimal('2500'), 'current_stock': 350, 'minimum_stock': 120, 'unit_of_measurement': 'pcs'},
            {'name': 'Pasta Gigi Mini', 'category': 'AMENITIES', 'unit_price': Decimal('4000'), 'current_stock': 200, 'minimum_stock': 70, 'unit_of_measurement': 'pcs'},
            {'name': 'Sikat Gigi', 'category': 'AMENITIES', 'unit_price': Decimal('2000'), 'current_stock': 200, 'minimum_stock': 70, 'unit_of_measurement': 'pcs'},
            {'name': 'Sisir', 'category': 'AMENITIES', 'unit_price': Decimal('1500'), 'current_stock': 250, 'minimum_stock': 80, 'unit_of_measurement': 'pcs'},
            {'name': 'Shower Cap', 'category': 'AMENITIES', 'unit_price': Decimal('1000'), 'current_stock': 300, 'minimum_stock': 100, 'unit_of_measurement': 'pcs'},

            # Prayer Items (Important for Indonesian hotels)
            {'name': 'Sajadah', 'category': 'AMENITIES', 'unit_price': Decimal('35000'), 'current_stock': 80, 'minimum_stock': 30, 'unit_of_measurement': 'pcs'},
            {'name': 'Mushaf Al-Quran', 'category': 'AMENITIES', 'unit_price': Decimal('50000'), 'current_stock': 60, 'minimum_stock': 25, 'unit_of_measurement': 'pcs'},
            {'name': 'Mukena', 'category': 'AMENITIES', 'unit_price': Decimal('45000'), 'current_stock': 50, 'minimum_stock': 20, 'unit_of_measurement': 'set'},
            {'name': 'Kompas Kiblat', 'category': 'AMENITIES', 'unit_price': Decimal('25000'), 'current_stock': 40, 'minimum_stock': 15, 'unit_of_measurement': 'pcs'},

            # Food & Beverages
            {'name': 'Kopi Kapal Api Sachet', 'category': 'FOOD', 'unit_price': Decimal('2500'), 'current_stock': 200, 'minimum_stock': 70, 'unit_of_measurement': 'pcs'},
            {'name': 'Teh Celup Sariwangi', 'category': 'FOOD', 'unit_price': Decimal('1500'), 'current_stock': 250, 'minimum_stock': 90, 'unit_of_measurement': 'pcs'},
            {'name': 'Gula Pasir Sachet', 'category': 'FOOD', 'unit_price': Decimal('500'), 'current_stock': 300, 'minimum_stock': 100, 'unit_of_measurement': 'pcs'},
            {'name': 'Krimer Kental Manis', 'category': 'FOOD', 'unit_price': Decimal('1000'), 'current_stock': 200, 'minimum_stock': 70, 'unit_of_measurement': 'pcs'},
            {'name': 'Air Mineral Aqua 600ml', 'category': 'FOOD', 'unit_price': Decimal('4000'), 'current_stock': 250, 'minimum_stock': 100, 'unit_of_measurement': 'botol'},
            {'name': 'Air Mineral Aqua 1500ml', 'category': 'FOOD', 'unit_price': Decimal('8000'), 'current_stock': 150, 'minimum_stock': 60, 'unit_of_measurement': 'botol'},

            # Cleaning Supplies
            {'name': 'Tissue Toilet Roll', 'category': 'CLEANING', 'unit_price': Decimal('12000'), 'current_stock': 150, 'minimum_stock': 50, 'unit_of_measurement': 'roll'},
            {'name': 'Tissue Kotak', 'category': 'CLEANING', 'unit_price': Decimal('8000'), 'current_stock': 100, 'minimum_stock': 35, 'unit_of_measurement': 'box'},
            {'name': 'Sabun Cuci Piring Sunlight', 'category': 'CLEANING', 'unit_price': Decimal('15000'), 'current_stock': 30, 'minimum_stock': 10, 'unit_of_measurement': 'botol'},
            {'name': 'Deterjen Rinso', 'category': 'CLEANING', 'unit_price': Decimal('25000'), 'current_stock': 40, 'minimum_stock': 15, 'unit_of_measurement': 'pack'},
            {'name': 'Pembersih Lantai Wipol', 'category': 'CLEANING', 'unit_price': Decimal('18000'), 'current_stock': 35, 'minimum_stock': 12, 'unit_of_measurement': 'botol'},
            {'name': 'Pewangi Ruangan', 'category': 'CLEANING', 'unit_price': Decimal('22000'), 'current_stock': 45, 'minimum_stock': 15, 'unit_of_measurement': 'botol'},
            {'name': 'Kamper Kamar Mandi', 'category': 'CLEANING', 'unit_price': Decimal('5000'), 'current_stock': 80, 'minimum_stock': 30, 'unit_of_measurement': 'pcs'},
        ]

        for item_data in inventory_data:
            item, created = InventoryItem.objects.get_or_create(
                name=item_data['name'],
                defaults=item_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created inventory: {item.name}'))
            else:
                self.stdout.write(f'  Inventory already exists: {item.name}')

        # Create Maintenance Technicians (Indonesian names)
        technicians_data = [
            {'name': 'Pak Budi Santoso', 'contact_number': '081234567801', 'specializations': ['AC', 'Listrik', 'Elektronik'], 'email': 'budi.teknisi@kapulagahotel.com', 'is_active': True},
            {'name': 'Pak Ahmad Hidayat', 'contact_number': '081234567802', 'specializations': ['Pipa', 'Kran Air', 'Shower'], 'email': 'ahmad.teknisi@kapulagahotel.com', 'is_active': True},
            {'name': 'Pak Dwi Prasetyo', 'contact_number': '081234567803', 'specializations': ['Umum', 'Keamanan', 'Pintu', 'Jendela'], 'email': 'dwi.teknisi@kapulagahotel.com', 'is_active': True},
            {'name': 'Pak Eko Wijaya', 'contact_number': '081234567804', 'specializations': ['Furniture', 'Kayu', 'Cat'], 'email': 'eko.teknisi@kapulagahotel.com', 'is_active': True},
            {'name': 'Pak Hendra Gunawan', 'contact_number': '081234567805', 'specializations': ['Lift', 'Generator', 'Pompa Air'], 'email': 'hendra.teknisi@kapulagahotel.com', 'is_active': True},
        ]

        for tech_data in technicians_data:
            tech, created = MaintenanceTechnician.objects.get_or_create(
                contact_number=tech_data['contact_number'],
                defaults=tech_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created technician: {tech.name}'))
            else:
                self.stdout.write(f'  Technician already exists: {tech.name}')

        # Create Holidays (Indonesian public holidays 2025)
        current_year = date.today().year
        holidays_data = [
            {'name': 'New Year', 'name_id': 'Tahun Baru Masehi', 'date': date(current_year, 1, 1), 'holiday_type': 'NATIONAL'},
            {'name': 'Chinese New Year', 'name_id': 'Tahun Baru Imlek', 'date': date(current_year, 1, 29), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Isra Miraj', 'name_id': 'Isra Miraj Nabi Muhammad SAW', 'date': date(current_year, 2, 8), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Nyepi', 'name_id': 'Hari Raya Nyepi (Tahun Baru Saka)', 'date': date(current_year, 3, 22), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Good Friday', 'name_id': 'Wafat Isa Al-Masih', 'date': date(current_year, 4, 18), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Eid al-Fitr', 'name_id': 'Hari Raya Idul Fitri', 'date': date(current_year, 3, 31), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Eid al-Fitr 2', 'name_id': 'Hari Raya Idul Fitri Hari Kedua', 'date': date(current_year, 4, 1), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Labor Day', 'name_id': 'Hari Buruh Internasional', 'date': date(current_year, 5, 1), 'holiday_type': 'NATIONAL'},
            {'name': 'Ascension Day', 'name_id': 'Kenaikan Isa Al-Masih', 'date': date(current_year, 5, 29), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Vesak Day', 'name_id': 'Hari Raya Waisak', 'date': date(current_year, 5, 12), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Pancasila Day', 'name_id': 'Hari Lahir Pancasila', 'date': date(current_year, 6, 1), 'holiday_type': 'NATIONAL'},
            {'name': 'Eid al-Adha', 'name_id': 'Hari Raya Idul Adha', 'date': date(current_year, 6, 7), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Islamic New Year', 'name_id': 'Tahun Baru Islam 1 Muharram', 'date': date(current_year, 6, 27), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Independence Day', 'name_id': 'Hari Kemerdekaan RI', 'date': date(current_year, 8, 17), 'holiday_type': 'NATIONAL'},
            {'name': 'Maulid Nabi', 'name_id': 'Maulid Nabi Muhammad SAW', 'date': date(current_year, 9, 5), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Christmas', 'name_id': 'Hari Raya Natal', 'date': date(current_year, 12, 25), 'holiday_type': 'RELIGIOUS'},
        ]

        for holiday_data in holidays_data:
            holiday, created = Holiday.objects.get_or_create(
                date=holiday_data['date'],
                name=holiday_data['name'],
                defaults=holiday_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created holiday: {holiday.name}'))
            else:
                self.stdout.write(f'  Holiday already exists: {holiday.name}')

        self.stdout.write(self.style.SUCCESS('\nHotel data seeding complete!'))
        self.stdout.write(f'\nSummary:')
        self.stdout.write(f'  Room Types: {RoomType.objects.count()}')
        self.stdout.write(f'  Rooms: {Room.objects.count()}')
        self.stdout.write(f'  Inventory Items: {InventoryItem.objects.count()}')
        self.stdout.write(f'  Maintenance Technicians: {MaintenanceTechnician.objects.count()}')
        self.stdout.write(f'  Holidays: {Holiday.objects.count()}')
