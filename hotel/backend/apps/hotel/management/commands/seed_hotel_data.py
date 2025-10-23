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

        # Create Room Types
        room_types_data = [
            {
                'name': 'Standard Room',
                'description': 'Comfortable standard room with essential amenities',
                'base_price': Decimal('500000.00'),
                'max_occupancy': 2,
                'size_sqm': 25.0,
                'amenities': 'AC, TV, WiFi, Hot Shower',
            },
            {
                'name': 'Deluxe Room',
                'description': 'Spacious deluxe room with city view',
                'base_price': Decimal('750000.00'),
                'max_occupancy': 2,
                'size_sqm': 35.0,
                'amenities': 'AC, Smart TV, WiFi, Bathtub, Mini Bar',
            },
            {
                'name': 'Suite',
                'description': 'Luxury suite with separate living area',
                'base_price': Decimal('1500000.00'),
                'max_occupancy': 4,
                'size_sqm': 60.0,
                'amenities': 'AC, Smart TV, WiFi, Jacuzzi, Mini Bar, Living Room',
            },
            {
                'name': 'Family Room',
                'description': 'Perfect for families with children',
                'base_price': Decimal('1000000.00'),
                'max_occupancy': 5,
                'size_sqm': 45.0,
                'amenities': 'AC, TV, WiFi, Hot Shower, Kids Area',
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

        # Create Rooms
        rooms_data = [
            # Standard Rooms (Floor 1)
            {'number': '101', 'type': 'Standard Room', 'floor': 1, 'status': 'AVAILABLE'},
            {'number': '102', 'type': 'Standard Room', 'floor': 1, 'status': 'AVAILABLE'},
            {'number': '103', 'type': 'Standard Room', 'floor': 1, 'status': 'AVAILABLE'},
            {'number': '104', 'type': 'Standard Room', 'floor': 1, 'status': 'AVAILABLE'},
            
            # Deluxe Rooms (Floor 2)
            {'number': '201', 'type': 'Deluxe Room', 'floor': 2, 'status': 'AVAILABLE'},
            {'number': '202', 'type': 'Deluxe Room', 'floor': 2, 'status': 'AVAILABLE'},
            {'number': '203', 'type': 'Deluxe Room', 'floor': 2, 'status': 'AVAILABLE'},
            {'number': '204', 'type': 'Deluxe Room', 'floor': 2, 'status': 'AVAILABLE'},
            
            # Family Rooms (Floor 3)
            {'number': '301', 'type': 'Family Room', 'floor': 3, 'status': 'AVAILABLE'},
            {'number': '302', 'type': 'Family Room', 'floor': 3, 'status': 'AVAILABLE'},
            {'number': '303', 'type': 'Family Room', 'floor': 3, 'status': 'AVAILABLE'},
            
            # Suites (Floor 4)
            {'number': '401', 'type': 'Suite', 'floor': 4, 'status': 'AVAILABLE'},
            {'number': '402', 'type': 'Suite', 'floor': 4, 'status': 'AVAILABLE'},
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

        # Create Inventory Items
        inventory_data = [
            {'name': 'Bed Sheet (White)', 'category': 'AMENITIES', 'unit_price': Decimal('50000'), 'current_stock': 100, 'minimum_stock': 30, 'unit_of_measurement': 'pcs'},
            {'name': 'Pillow Case', 'category': 'AMENITIES', 'unit_price': Decimal('25000'), 'current_stock': 150, 'minimum_stock': 40, 'unit_of_measurement': 'pcs'},
            {'name': 'Bath Towel', 'category': 'AMENITIES', 'unit_price': Decimal('40000'), 'current_stock': 80, 'minimum_stock': 25, 'unit_of_measurement': 'pcs'},
            {'name': 'Hand Towel', 'category': 'AMENITIES', 'unit_price': Decimal('20000'), 'current_stock': 100, 'minimum_stock': 30, 'unit_of_measurement': 'pcs'},
            {'name': 'Shampoo Sachet', 'category': 'AMENITIES', 'unit_price': Decimal('5000'), 'current_stock': 200, 'minimum_stock': 50, 'unit_of_measurement': 'pcs'},
            {'name': 'Soap Bar', 'category': 'AMENITIES', 'unit_price': Decimal('3000'), 'current_stock': 180, 'minimum_stock': 50, 'unit_of_measurement': 'pcs'},
            {'name': 'Toothbrush Kit', 'category': 'AMENITIES', 'unit_price': Decimal('8000'), 'current_stock': 120, 'minimum_stock': 40, 'unit_of_measurement': 'pcs'},
            {'name': 'Coffee Sachet', 'category': 'FOOD', 'unit_price': Decimal('2000'), 'current_stock': 150, 'minimum_stock': 50, 'unit_of_measurement': 'pcs'},
            {'name': 'Tea Bags', 'category': 'FOOD', 'unit_price': Decimal('1500'), 'current_stock': 200, 'minimum_stock': 60, 'unit_of_measurement': 'pcs'},
            {'name': 'Drinking Water (600ml)', 'category': 'FOOD', 'unit_price': Decimal('3000'), 'current_stock': 100, 'minimum_stock': 40, 'unit_of_measurement': 'bottle'},
            {'name': 'Toilet Paper', 'category': 'CLEANING', 'unit_price': Decimal('15000'), 'current_stock': 80, 'minimum_stock': 30, 'unit_of_measurement': 'roll'},
            {'name': 'Detergent', 'category': 'CLEANING', 'unit_price': Decimal('35000'), 'current_stock': 20, 'minimum_stock': 5, 'unit_of_measurement': 'bottle'},
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

        # Create Maintenance Technicians
        technicians_data = [
            {'name': 'Budi Santoso', 'contact_number': '081234567801', 'specializations': ['HVAC', 'Electrical'], 'email': 'budi@hotel.local', 'is_active': True},
            {'name': 'Ahmad Hidayat', 'contact_number': '081234567802', 'specializations': ['Plumbing'], 'email': 'ahmad@hotel.local', 'is_active': True},
            {'name': 'Dwi Prasetyo', 'contact_number': '081234567803', 'specializations': ['General', 'Security'], 'email': 'dwi@hotel.local', 'is_active': True},
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

        # Create Holidays
        current_year = date.today().year
        holidays_data = [
            {'name': 'New Year', 'name_id': 'Tahun Baru', 'date': date(current_year, 1, 1), 'holiday_type': 'NATIONAL'},
            {'name': 'Idul Fitri', 'name_id': 'Idul Fitri', 'date': date(current_year, 4, 10), 'holiday_type': 'RELIGIOUS'},
            {'name': 'Independence Day', 'name_id': 'Hari Kemerdekaan', 'date': date(current_year, 8, 17), 'holiday_type': 'NATIONAL'},
            {'name': 'Christmas', 'name_id': 'Natal', 'date': date(current_year, 12, 25), 'holiday_type': 'RELIGIOUS'},
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
