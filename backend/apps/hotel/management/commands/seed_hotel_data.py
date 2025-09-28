from django.core.management.base import BaseCommand
from django.utils import timezone
from django.conf import settings
from datetime import date, timedelta
from decimal import Decimal
import random

from apps.hotel.models import (
    RoomType, Room, Guest, Reservation, Payment, Complaint, 
    CheckIn, Holiday, CalendarEvent, InventoryItem
)


class Command(BaseCommand):
    help = 'Seed hotel database with Indonesian-style sample data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.clear_data()
        
        self.stdout.write('Creating Indonesian hotel seed data...')
        
        # Create sample data
        self.create_room_types()
        self.create_rooms()
        self.create_guests()
        self.create_reservations()
        self.create_payments()
        self.create_complaints()
        self.create_checkins()
        self.create_holidays()
        self.create_calendar_events()
        self.create_inventory()
        
        self.stdout.write(
            self.style.SUCCESS('Successfully seeded Indonesian hotel data!')
        )

    def clear_data(self):
        """Clear existing hotel data"""
        self.stdout.write('Clearing existing hotel data...')
        
        CalendarEvent.objects.all().delete()
        InventoryItem.objects.all().delete()
        Holiday.objects.all().delete()
        CheckIn.objects.all().delete()
        Complaint.objects.all().delete()
        Payment.objects.all().delete()
        Reservation.objects.all().delete()
        Guest.objects.all().delete()
        Room.objects.all().delete()
        RoomType.objects.all().delete()
        
        self.stdout.write('Data cleared.')

    def create_room_types(self):
        """Create Indonesian-style room types"""
        room_types_data = [
            {
                'name': 'Kamar Standard',
                'description': 'Kamar nyaman dengan fasilitas dasar, cocok untuk wisatawan budget',
                'base_price': Decimal('350000'),  # 350k IDR
                'max_occupancy': 2,
                'size_sqm': 20.0,
                'amenities': 'AC, TV, Wi-Fi gratis, kamar mandi dalam, air mineral'
            },
            {
                'name': 'Kamar Superior',
                'description': 'Kamar yang lebih luas dengan pemandangan taman',
                'base_price': Decimal('500000'),  # 500k IDR
                'max_occupancy': 2,
                'size_sqm': 25.0,
                'amenities': 'AC, TV LED 32", Wi-Fi premium, balkon pribadi, mini bar'
            },
            {
                'name': 'Kamar Deluxe',
                'description': 'Kamar mewah dengan pemandangan kolam renang',
                'base_price': Decimal('750000'),  # 750k IDR
                'max_occupancy': 3,
                'size_sqm': 35.0,
                'amenities': 'AC dual, TV LED 43", Wi-Fi premium, balkon luas, mini bar, sofa'
            },
            {
                'name': 'Suite Keluarga',
                'description': 'Suite spacious untuk keluarga dengan ruang tamu terpisah',
                'base_price': Decimal('1200000'),  # 1.2M IDR
                'max_occupancy': 4,
                'size_sqm': 50.0,
                'amenities': 'AC central, TV LED 55", ruang tamu, kitchenette, balkon besar'
            },
            {
                'name': 'Suite Presidential',
                'description': 'Suite mewah dengan fasilitas VIP dan butler service',
                'base_price': Decimal('2500000'),  # 2.5M IDR
                'max_occupancy': 6,
                'size_sqm': 80.0,
                'amenities': 'AC central, home theater, jacuzzi, butler service, airport transfer'
            }
        ]
        
        for data in room_types_data:
            room_type, created = RoomType.objects.get_or_create(
                name=data['name'],
                defaults=data
            )
            if created:
                self.stdout.write(f'Created room type: {room_type.name}')

    def create_rooms(self):
        """Create rooms with Indonesian numbering conventions"""
        room_types = list(RoomType.objects.all())
        if not room_types:
            return
        
        floors = [1, 2, 3, 4, 5]  # 5-story hotel
        rooms_per_floor = 20
        
        for floor in floors:
            for room_num in range(1, rooms_per_floor + 1):
                # Indonesian hotel room numbering: floor + room number
                room_number = f"{floor}{room_num:02d}"
                
                # Distribute room types across floors
                if floor == 5:  # Top floor for suites
                    room_type = random.choice([rt for rt in room_types if 'Suite' in rt.name])
                elif floor >= 3:  # Higher floors for deluxe
                    room_type = random.choice([rt for rt in room_types if rt.name in ['Kamar Deluxe', 'Kamar Superior']])
                else:  # Lower floors for standard/superior
                    room_type = random.choice([rt for rt in room_types if rt.name in ['Kamar Standard', 'Kamar Superior']])
                
                # Random room status
                status_choices = ['AVAILABLE', 'AVAILABLE', 'AVAILABLE', 'OCCUPIED', 'MAINTENANCE']
                status = random.choice(status_choices)
                
                room, created = Room.objects.get_or_create(
                    number=room_number,
                    defaults={
                        'room_type': room_type,
                        'floor': floor,
                        'status': status,
                        'notes': f'Kamar di lantai {floor} dengan pemandangan {"city" if floor >= 3 else "garden"}'
                    }
                )
                
                if created:
                    self.stdout.write(f'Created room: {room.number}')

    def create_guests(self):
        """Create Indonesian and international guests for realistic hotel data"""
        # Expanded Indonesian names for more variety
        indonesian_first_names = [
            'Andi', 'Budi', 'Sari', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi',
            'Indira', 'Joko', 'Kartika', 'Lina', 'Maya', 'Nanda', 'Oki', 'Putri',
            'Rahma', 'Sinta', 'Tari', 'Usman', 'Vina', 'Wati', 'Yani', 'Zaki',
            'Agus', 'Bayu', 'Citra', 'Dian', 'Erlangga', 'Fajar', 'Galuh', 'Hasna',
            'Irfan', 'Jasmine', 'Karina', 'Lukman', 'Mega', 'Nisa', 'Oscar', 'Priska',
            'Ahmad', 'Bunga', 'Candra', 'Dini', 'Erni', 'Faisal', 'Gina', 'Hendra',
            'Ika', 'Jihan', 'Kevin', 'Laras', 'Mira', 'Naufal', 'Olga', 'Pandu'
        ]
        
        indonesian_last_names = [
            'Sutanto', 'Wijaya', 'Kusuma', 'Pratama', 'Sari', 'Nugroho', 'Santoso',
            'Permana', 'Utama', 'Maharani', 'Prabowo', 'Handayani', 'Kurniawan',
            'Lestari', 'Setiawan', 'Rahayu', 'Hidayat', 'Susanti', 'Gunawan',
            'Anggraini', 'Firmansyah', 'Safitri', 'Budiman', 'Cahyani', 'Darmawan',
            'Fitriani', 'Hakim', 'Indrawati', 'Julianto', 'Kencana', 'Rahman',
            'Saputra', 'Andriani', 'Wibowo', 'Kartini', 'Mahendra', 'Salsabila'
        ]
        
        # International guests from common tourist countries to Indonesia
        international_guests_data = [
            {'first_names': ['John', 'David', 'Michael', 'James', 'Robert'], 'last_names': ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson'], 'nationality': 'Australia'},
            {'first_names': ['Sakura', 'Yuki', 'Hiroshi', 'Kenji', 'Miki'], 'last_names': ['Tanaka', 'Suzuki', 'Watanabe', 'Sato', 'Yamada'], 'nationality': 'Japan'},
            {'first_names': ['Min-jun', 'Seo-jun', 'Ji-hoon', 'Hye-jin', 'So-young'], 'last_names': ['Kim', 'Lee', 'Park', 'Choi', 'Jung'], 'nationality': 'South Korea'},
            {'first_names': ['Wei', 'Li', 'Ming', 'Xing', 'Mei'], 'last_names': ['Wang', 'Li', 'Zhang', 'Liu', 'Chen'], 'nationality': 'China'},
            {'first_names': ['Kumar', 'Raj', 'Priya', 'Anil', 'Deepa'], 'last_names': ['Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta'], 'nationality': 'India'},
            {'first_names': ['Anna', 'Erik', 'Lars', 'Ingrid', 'Olaf'], 'last_names': ['Andersson', 'Johansson', 'Karlsson', 'Nilsson', 'Eriksson'], 'nationality': 'Sweden'},
            {'first_names': ['Maria', 'Carlos', 'Ana', 'Luis', 'Carmen'], 'last_names': ['Rodriguez', 'Garcia', 'Martinez', 'Lopez', 'Gonzalez'], 'nationality': 'Spain'},
            {'first_names': ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava'], 'last_names': ['Johnson', 'Williams', 'Brown', 'Jones', 'Miller'], 'nationality': 'United States'},
        ]
        
        # Create 150 guests total (100 Indonesian, 50 international)
        created_count = 0
        
        # Create Indonesian guests
        for i in range(100):
            first_name = random.choice(indonesian_first_names)
            last_name = random.choice(indonesian_last_names)
            email = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@email.com"
            phone = f"+62{random.randint(800000000, 899999999)}"
            
            guest, created = Guest.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': phone,
                    'nationality': 'Indonesia',
                    'gender': random.choice(['M', 'F']),
                    'is_vip': random.random() < 0.05,  # 5% VIP guests
                    'loyalty_points': random.randint(0, 2000),
                    'id_type': random.choice(['national_id', 'passport', 'driving_license']),
                    'id_number': f"NIK{random.randint(1000000000000000, 9999999999999999)}",
                    'date_of_birth': date.today() - timedelta(days=random.randint(18*365, 70*365)),
                    'address': f"Jl. {random.choice(['Sudirman', 'Thamrin', 'Gatot Subroto', 'Kuningan', 'Senayan'])} No. {random.randint(1, 999)}, Jakarta"
                }
            )
            
            if created:
                created_count += 1
        
        # Create international guests
        for i in range(50):
            country_data = random.choice(international_guests_data)
            first_name = random.choice(country_data['first_names'])
            last_name = random.choice(country_data['last_names'])
            email = f"{first_name.lower()}.{last_name.lower()}{random.randint(1, 999)}@email.com"
            
            # Country-specific phone patterns
            phone_patterns = {
                'Australia': f"+61{random.randint(400000000, 499999999)}",
                'Japan': f"+81{random.randint(80000000, 89999999)}",
                'South Korea': f"+82{random.randint(10000000, 19999999)}",
                'China': f"+86{random.randint(130000000, 139999999)}",
                'India': f"+91{random.randint(900000000, 999999999)}",
                'Sweden': f"+46{random.randint(70000000, 79999999)}",
                'Spain': f"+34{random.randint(600000000, 699999999)}",
                'United States': f"+1{random.randint(2000000000, 9999999999)}"
            }
            
            guest, created = Guest.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name,
                    'phone': phone_patterns.get(country_data['nationality'], f"+1{random.randint(1000000000, 9999999999)}"),
                    'nationality': country_data['nationality'],
                    'gender': random.choice(['M', 'F']),
                    'is_vip': random.random() < 0.08,  # 8% VIP for international guests
                    'loyalty_points': random.randint(0, 1500),
                    'id_type': 'passport',
                    'id_number': f"P{random.randint(100000000, 999999999)}",
                    'date_of_birth': date.today() - timedelta(days=random.randint(18*365, 65*365))
                }
            )
            
            if created:
                created_count += 1
        
        self.stdout.write(f'Created {created_count} guests (Indonesian and International)')

    def create_reservations(self):
        """Create comprehensive reservations with 100+ days of historical data"""
        guests = list(Guest.objects.all())
        rooms = list(Room.objects.all())
        
        if not guests or not rooms:
            return
        
        # Get or create admin user for created_by field
        from apps.user.models import User
        admin_user, _ = User.objects.get_or_create(
            email='reservations@hotel.com',
            defaults={
                'first_name': 'Reservation',
                'last_name': 'Manager',
                'is_staff': True,
                'is_active': True
            }
        )
        
        today = date.today()
        
        # Generate reservations for 120 days (90 days past + 30 days future)
        start_date = today - timedelta(days=90)
        end_date = today + timedelta(days=30)
        
        booking_sources = ['DIRECT', 'ONLINE', 'PHONE', 'WALK_IN', 'TRAVEL_AGENT', 'EMAIL']
        special_requests_list = [
            'Lantai tinggi dengan pemandangan',
            'Kamar non-smoking',
            'Extra bed untuk anak',
            'Late check-out',
            'Early check-in',
            'Makanan halal',
            'Vegetarian meal',
            'Kamar yang tenang',
            'Dekat dengan lift',
            'Pemandangan kolam renang',
            'Kamar connecting untuk keluarga',
            'Ranjang king size',
            'Baby cot tersedia',
            'Check-in cepat',
            'Airport pickup service'
        ]
        
        created_count = 0
        
        # Track room bookings to prevent overlaps
        # Format: {room_id: [(check_in_date, check_out_date), ...]}
        room_bookings = {room.id: [] for room in rooms}
        
        # Function to check if dates overlap with existing bookings
        def has_overlap(room_id, new_check_in, new_check_out):
            for existing_check_in, existing_check_out in room_bookings[room_id]:
                # Check if dates overlap (new check-in before existing check-out AND new check-out after existing check-in)
                if new_check_in < existing_check_out and new_check_out > existing_check_in:
                    return True
            return False
        
        # Create all reservations first, tracking potential dates
        potential_reservations = []
        
        # Create reservations with realistic patterns
        for single_date in [start_date + timedelta(days=x) for x in range(120)]:
            # Determine occupancy rate based on day of week and seasonal factors
            weekday = single_date.weekday()
            
            # Weekend boost (Friday-Sunday)
            weekend_factor = 1.4 if weekday >= 4 else 1.0
            
            # Holiday season boost (December, January, June-August)
            month = single_date.month
            seasonal_factor = 1.3 if month in [12, 1, 6, 7, 8] else 1.0
            
            # Base occupancy rate
            base_occupancy = 0.65  # 65% base occupancy
            daily_occupancy = min(0.95, base_occupancy * weekend_factor * seasonal_factor)
            
            # Calculate how many rooms should be booked for this date
            target_rooms = int(len(rooms) * daily_occupancy)
            
            # Create potential reservations for this date
            available_rooms = rooms.copy()
            random.shuffle(available_rooms)
            
            for room in available_rooms[:target_rooms]:
                guest = random.choice(guests)
                
                # Stay duration patterns
                if guest.nationality == 'Indonesia':
                    # Indonesian guests typically stay 1-4 nights
                    nights = random.choices([1, 2, 3, 4, 5], weights=[35, 30, 20, 10, 5])[0]
                else:
                    # International guests typically stay longer
                    nights = random.choices([2, 3, 4, 5, 7, 10, 14], weights=[15, 25, 25, 15, 10, 7, 3])[0]
                
                check_in_date = single_date
                check_out_date = check_in_date + timedelta(days=nights)
                
                # Check if this booking overlaps with existing ones for this room
                if not has_overlap(room.id, check_in_date, check_out_date):
                    # No overlap, safe to book
                    room_bookings[room.id].append((check_in_date, check_out_date))
                    
                    # Determine status based on dates
                    if check_out_date < today:
                        # Past reservations
                        status = random.choices(
                            ['CHECKED_OUT', 'CANCELLED', 'NO_SHOW'],
                            weights=[85, 10, 5]
                        )[0]
                    elif check_in_date <= today <= check_out_date:
                        # Current stays
                        status = 'CHECKED_IN'
                    elif check_in_date > today:
                        # Future reservations
                        status = random.choices(
                            ['CONFIRMED', 'PENDING'],
                            weights=[80, 20]
                        )[0]
                    else:
                        status = 'CONFIRMED'
                    
                    # Adults and children based on room capacity
                    max_guests = room.room_type.max_occupancy
                    adults = random.randint(1, min(max_guests, 4))
                    children = random.randint(0, max(0, min(2, max_guests - adults)))
                    
                    # Booking source patterns
                    if guest.nationality == 'Indonesia':
                        booking_source = random.choices(
                            booking_sources,
                            weights=[25, 35, 20, 15, 3, 2]  # Online is popular for Indonesian guests
                        )[0]
                    else:
                        booking_source = random.choices(
                            booking_sources,
                            weights=[15, 50, 10, 5, 15, 5]  # International guests prefer online/travel agents
                        )[0]
                    
                    # Calculate total amount
                    total_amount = room.room_type.base_price * nights
                    
                    # VIP discount
                    if guest.is_vip:
                        total_amount = total_amount * Decimal('0.9')  # 10% VIP discount
                    
                    # Special requests (40% of reservations have special requests)
                    special_requests = random.choice(special_requests_list) if random.random() < 0.4 else ''
                    
                    potential_reservations.append({
                        'guest': guest,
                        'room': room,
                        'check_in_date': check_in_date,
                        'check_out_date': check_out_date,
                        'nights': nights,
                        'status': status,
                        'adults': adults,
                        'children': children,
                        'booking_source': booking_source,
                        'total_amount': total_amount,
                        'special_requests': special_requests
                    })
        
        # Now create the actual reservations
        for reservation_data in potential_reservations:
            # Generate unique reservation number manually
            timestamp = reservation_data['check_in_date'].strftime('%Y%m%d')
            random_num = random.randint(1000, 9999)
            reservation_number = f'RES{timestamp}{random_num}'
            
            # Ensure uniqueness
            while Reservation.objects.filter(reservation_number=reservation_number).exists():
                random_num = random.randint(1000, 9999)
                reservation_number = f'RES{timestamp}{random_num}'
            
            reservation, created = Reservation.objects.get_or_create(
                guest=reservation_data['guest'],
                room=reservation_data['room'],
                check_in_date=reservation_data['check_in_date'],
                check_out_date=reservation_data['check_out_date'],
                defaults={
                    'reservation_number': reservation_number,
                    'adults': reservation_data['adults'],
                    'children': reservation_data['children'],
                    'status': reservation_data['status'],
                    'booking_source': reservation_data['booking_source'],
                    'total_amount': reservation_data['total_amount'],
                    'special_requests': reservation_data['special_requests'],
                    'notes': f'{"VIP Guest - " if reservation_data["guest"].is_vip else ""}Booking for {reservation_data["nights"]} nights',
                    'created_by': admin_user
                }
            )
            
            if created:
                created_count += 1
                
                # Limit to prevent overwhelming output
                if created_count % 50 == 0:
                    self.stdout.write(f'Created {created_count} reservations...')
        
        self.stdout.write(f'Created {created_count} total reservations spanning 120 days (no overlapping bookings)')

    def create_payments(self):
        """Create payments with Indonesian payment methods"""
        reservations = list(Reservation.objects.all())
        
        # Indonesian popular payment methods
        payment_methods = ['CASH', 'DEBIT_CARD', 'CREDIT_CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET']
        payment_statuses = ['COMPLETED', 'COMPLETED', 'PENDING', 'FAILED']
        
        for reservation in reservations:
            # Create 1-2 payments per reservation
            num_payments = random.randint(1, 2)
            total_paid = Decimal('0')
            
            for i in range(num_payments):
                if i == 0:  # First payment (deposit or full payment)
                    amount = reservation.total_amount if num_payments == 1 else reservation.total_amount * Decimal('0.5')
                else:  # Second payment (remaining balance)
                    amount = reservation.total_amount - total_paid
                
                total_paid += amount
                
                payment, created = Payment.objects.get_or_create(
                    reservation=reservation,
                    amount=amount,
                    defaults={
                        'payment_method': random.choice(payment_methods),
                        'status': random.choice(payment_statuses),
                        'transaction_id': f'TXN{random.randint(100000000, 999999999)}',
                        'notes': 'Pembayaran DP' if i == 0 and num_payments > 1 else 'Pelunasan'
                    }
                )
                
                if created:
                    self.stdout.write(f'Created payment: {payment.id} for {reservation.reservation_number}')

    def create_complaints(self):
        """Create typical hotel complaints in Indonesian context"""
        reservations = list(Reservation.objects.filter(status__in=['CHECKED_IN', 'CHECKED_OUT']))
        
        indonesian_complaints = [
            {
                'title': 'AC Tidak Dingin',
                'description': 'AC di kamar tidak berfungsi dengan baik, suhu ruangan masih panas',
                'category': 'ROOM'
            },
            {
                'title': 'Wi-Fi Lambat',
                'description': 'Koneksi internet sangat lambat, tidak bisa untuk video call',
                'category': 'FACILITY'
            },
            {
                'title': 'Kamar Mandi Kotor',
                'description': 'Kamar mandi tidak dibersihkan dengan baik, masih ada kotoran',
                'category': 'CLEANLINESS'
            },
            {
                'title': 'Suara Bising dari Kamar Sebelah',
                'description': 'Tamu di kamar sebelah sangat berisik sampai malam, mengganggu istirahat',
                'category': 'NOISE'
            },
            {
                'title': 'Tagihan Tidak Sesuai',
                'description': 'Ada biaya tambahan yang tidak dijelaskan saat check-in',
                'category': 'BILLING'
            },
            {
                'title': 'Pelayanan Restaurant Lambat',
                'description': 'Menunggu makanan di restaurant lebih dari 1 jam',
                'category': 'FOOD'
            },
            {
                'title': 'Staff Tidak Ramah',
                'description': 'Staff front office kurang ramah dan tidak helpful',
                'category': 'SERVICE'
            }
        ]
        
        priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
        statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
        
        for i, complaint_data in enumerate(indonesian_complaints[:5]):  # Create 5 complaints
            if not reservations:
                break
                
            reservation = random.choice(reservations)
            
            complaint, created = Complaint.objects.get_or_create(
                title=complaint_data['title'],
                defaults={
                    'guest': reservation.guest,
                    'room': reservation.room,
                    'category': complaint_data['category'],
                    'priority': random.choice(priorities),
                    'status': random.choice(statuses),
                    'description': complaint_data['description'],
                    'incident_date': timezone.now() - timedelta(days=random.randint(1, 7))
                }
            )
            
            if created:
                self.stdout.write(f'Created complaint: {complaint.complaint_number}')

    def create_checkins(self):
        """Create check-in records for all checked-in and checked-out reservations"""
        # Get reservations that should have check-in records
        reservations = list(Reservation.objects.filter(
            status__in=['CHECKED_IN', 'CHECKED_OUT']
        ))
        
        created_count = 0
        
        for reservation in reservations:
            # Calculate realistic check-in time
            check_in_date = reservation.check_in_date
            
            # Most check-ins happen between 14:00-22:00
            check_in_hour = random.choices(
                range(10, 23),  # 10 AM to 10 PM
                weights=[5, 10, 15, 20, 25, 30, 25, 20, 15, 10, 8, 5, 2]  # Peak at 3-6 PM
            )[0]
            check_in_minute = random.randint(0, 59)
            
            actual_check_in_time = timezone.make_aware(
                timezone.datetime.combine(
                    check_in_date,
                    timezone.datetime.min.time().replace(
                        hour=check_in_hour,
                        minute=check_in_minute
                    )
                )
            )
            
            # Determine early/late check-in
            standard_checkin_time = 15  # 3 PM
            early_check_in = check_in_hour < standard_checkin_time
            late_check_in = check_in_hour > 20  # After 8 PM
            
            # Deposit patterns
            if reservation.guest.nationality == 'Indonesia':
                # Indonesian guests often pay smaller deposits
                deposit_rate = random.choice([0.1, 0.15, 0.2])  # 10-20% of room rate
            else:
                # International guests typically pay higher deposits
                deposit_rate = random.choice([0.2, 0.25, 0.3])  # 20-30% of room rate
            
            deposit_collected = reservation.room.room_type.base_price * Decimal(str(deposit_rate))
            
            # Additional guests (sometimes people arrive with extra guests)
            additional_guests = 0
            if random.random() < 0.15:  # 15% chance of additional guests
                max_additional = max(0, reservation.room.room_type.max_occupancy - reservation.adults - reservation.children)
                additional_guests = random.randint(1, min(2, max_additional)) if max_additional > 0 else 0
            
            # Check-in status
            if reservation.status == 'CHECKED_IN':
                checkin_status = 'CHECKED_IN'
            else:  # CHECKED_OUT
                checkin_status = 'CHECKED_IN'  # They were checked in, now checked out
            
            # Indonesian check-in notes
            notes_options = [
                'Check-in lancar, tamu puas dengan kamar',
                'Tamu VIP, pelayanan istimewa diberikan',
                'Check-in cepat, tamu terburu-buru',
                'Permintaan khusus dipenuhi dengan baik',
                'Tamu pertama kali menginap di hotel',
                'Keluarga dengan anak kecil, extra towel disediakan',
                'Tamu bisnis, membutuhkan akses internet cepat',
                'Honeymoon couple, dekorasi kamar sudah disiapkan',
                'Group booking, koordinasi dengan leader group',
                'Late arrival karena penerbangan delay'
            ]
            
            # Special requests fulfillment
            special_requests_fulfilled = reservation.special_requests
            if not special_requests_fulfilled and random.random() < 0.3:
                special_requests_fulfilled = random.choice([
                    'Upgrade ke kamar dengan view yang lebih baik',
                    'Welcome fruit basket diberikan',
                    'Late check-out gratis sampai 2 PM',
                    'Extra pillow dan blanket disediakan',
                    'Room service menu dijelaskan detail'
                ])
            
            checkin, created = CheckIn.objects.get_or_create(
                reservation=reservation,
                defaults={
                    'actual_check_in_time': actual_check_in_time,
                    'early_check_in': early_check_in,
                    'late_check_in': late_check_in,
                    'additional_guests': additional_guests,
                    'special_requests_fulfilled': special_requests_fulfilled,
                    'room_key_issued': True,
                    'deposit_collected': deposit_collected,
                    'status': checkin_status,
                    'notes': random.choice(notes_options)
                }
            )
            
            if created:
                created_count += 1
                
                # Limit output to prevent spam
                if created_count % 50 == 0:
                    self.stdout.write(f'Created {created_count} check-ins...')
        
        self.stdout.write(f'Created {created_count} total check-in records')

    def create_holidays(self):
        """Create Indonesian holidays"""
        current_year = timezone.now().year
        
        indonesian_holidays = [
            {'name': 'New Year\'s Day', 'name_id': 'Tahun Baru Masehi', 'date': f'{current_year}-01-01', 'type': 'NATIONAL'},
            {'name': 'Chinese New Year', 'name_id': 'Tahun Baru Imlek', 'date': f'{current_year}-02-10', 'type': 'NATIONAL'},
            {'name': 'Day of Silence', 'name_id': 'Hari Raya Nyepi', 'date': f'{current_year}-03-11', 'type': 'RELIGIOUS'},
            {'name': 'Good Friday', 'name_id': 'Wafat Isa Al Masih', 'date': f'{current_year}-03-29', 'type': 'RELIGIOUS'},
            {'name': 'Labor Day', 'name_id': 'Hari Buruh', 'date': f'{current_year}-05-01', 'type': 'NATIONAL'},
            {'name': 'Buddha\'s Birthday', 'name_id': 'Hari Raya Waisak', 'date': f'{current_year}-05-15', 'type': 'RELIGIOUS'},
            {'name': 'Ascension of Jesus Christ', 'name_id': 'Kenaikan Isa Al Masih', 'date': f'{current_year}-05-09', 'type': 'RELIGIOUS'},
            {'name': 'Pancasila Day', 'name_id': 'Hari Lahir Pancasila', 'date': f'{current_year}-06-01', 'type': 'NATIONAL'},
            {'name': 'Eid al-Fitr', 'name_id': 'Hari Raya Idul Fitri', 'date': f'{current_year}-04-10', 'type': 'RELIGIOUS'},
            {'name': 'Eid al-Fitr Holiday', 'name_id': 'Cuti Bersama Idul Fitri', 'date': f'{current_year}-04-11', 'type': 'RELIGIOUS'},
            {'name': 'Independence Day', 'name_id': 'Hari Kemerdekaan RI', 'date': f'{current_year}-08-17', 'type': 'NATIONAL'},
            {'name': 'Eid al-Adha', 'name_id': 'Hari Raya Idul Adha', 'date': f'{current_year}-06-17', 'type': 'RELIGIOUS'},
            {'name': 'Islamic New Year', 'name_id': 'Tahun Baru Islam', 'date': f'{current_year}-07-07', 'type': 'RELIGIOUS'},
            {'name': 'Prophet Muhammad\'s Birthday', 'name_id': 'Maulid Nabi Muhammad', 'date': f'{current_year}-09-16', 'type': 'RELIGIOUS'},
            {'name': 'Christmas Day', 'name_id': 'Hari Raya Natal', 'date': f'{current_year}-12-25', 'type': 'RELIGIOUS'},
        ]
        
        for holiday_data in indonesian_holidays:
            holiday, created = Holiday.objects.get_or_create(
                name=holiday_data['name'],
                date=holiday_data['date'],
                defaults={
                    'name_id': holiday_data['name_id'],
                    'holiday_type': holiday_data['type'],
                    'description': f'Hari libur nasional Indonesia: {holiday_data["name_id"]}',
                    'is_work_day': False
                }
            )
            
            if created:
                self.stdout.write(f'Created holiday: {holiday.name}')

    def create_calendar_events(self):
        """Create calendar events for hotel operations"""
        from apps.user.models import User
        
        # Get or create admin user for created_by field
        admin_user, created = User.objects.get_or_create(
            email='admin@hotel.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'Hotel',
                'is_staff': True,
                'is_active': True
            }
        )
        
        rooms = list(Room.objects.all()[:10])  # Use first 10 rooms
        guests = list(Guest.objects.all()[:5])  # Use first 5 guests
        
        # Indonesian hotel event scenarios
        event_scenarios = [
            ('MAINTENANCE', 'Perawatan AC Rutin', 'Jadwal perawatan AC bulanan untuk semua kamar'),
            ('CLEANING', 'Deep Cleaning Kamar', 'Pembersihan menyeluruh dan sanitasi kamar'),
            ('EVENT', 'Acara Pernikahan', 'Acara pernikahan tradisional Indonesia di ballroom'),
            ('MEETING', 'Rapat Koordinasi Staf', 'Rapat bulanan koordinasi seluruh staf hotel'),
            ('ACTIVITY', 'Senam Pagi Tamu', 'Aktivitas senam pagi gratis untuk tamu hotel'),
            ('MAINTENANCE', 'Perbaikan Lift', 'Perawatan rutin dan perbaikan sistem lift'),
            ('EVENT', 'Seminar Bisnis UMKM', 'Seminar pemberdayaan usaha mikro kecil menengah'),
            ('CLEANING', 'Pembersihan Kolam Renang', 'Perawatan air dan pembersihan area kolam renang'),
            ('ACTIVITY', 'Kelas Memasak Nusantara', 'Workshop memasak makanan tradisional Indonesia'),
            ('MEETING', 'Pelatihan Customer Service', 'Training pelayanan prima untuk staf front office'),
            ('MAINTENANCE', 'Pemeriksaan Fire Safety', 'Inspeksi rutin sistem keamanan kebakaran'),
            ('EVENT', 'Gathering Keluarga Besar', 'Acara family gathering perusahaan lokal'),
            ('ACTIVITY', 'Live Music Lounge', 'Pertunjukan musik akustik di lobby lounge'),
            ('CLEANING', 'Fumigasi Pest Control', 'Penyemprotan anti hama seluruh area hotel'),
            ('MEETING', 'Workshop Housekeeping', 'Pelatihan standar kebersihan internasional')
        ]
        
        # Create events for next 60 days
        today = date.today()
        
        for i in range(30):  # Create 30 calendar events
            event_type, title, description = random.choice(event_scenarios)
            
            # Random date within next 60 days
            event_date = today + timedelta(days=random.randint(1, 60))
            
            # Event time based on type
            if event_type == 'MAINTENANCE':
                start_hour = random.randint(6, 10)  # Early morning
                duration = random.randint(2, 6)
            elif event_type == 'CLEANING':
                start_hour = random.randint(7, 11)  # Morning
                duration = random.randint(1, 4)
            elif event_type == 'EVENT':
                start_hour = random.randint(16, 19)  # Evening
                duration = random.randint(3, 8)
            elif event_type == 'MEETING':
                start_hour = random.randint(9, 15)  # Work hours
                duration = random.randint(1, 3)
            else:  # ACTIVITY
                start_hour = random.randint(7, 17)  # Day time
                duration = random.randint(1, 2)
            
            start_datetime = timezone.make_aware(
                timezone.datetime.combine(event_date, timezone.datetime.min.time().replace(hour=start_hour))
            )
            end_datetime = start_datetime + timedelta(hours=duration)
            
            # Status based on date
            if event_date < today:
                status = random.choice(['COMPLETED', 'CANCELLED'])
            elif event_date == today:
                status = random.choice(['IN_PROGRESS', 'SCHEDULED'])
            else:
                status = 'SCHEDULED'
            
            # Location based on event type
            locations = {
                'MAINTENANCE': f'Kamar {random.choice(rooms).number}' if rooms else 'Area Teknis',
                'CLEANING': f'Lantai {random.randint(1, 5)}',
                'EVENT': 'Ballroom Nusantara',
                'MEETING': 'Ruang Rapat Majapahit',
                'ACTIVITY': 'Lobby Lounge'
            }
            
            event, created = CalendarEvent.objects.get_or_create(
                title=title,
                start_datetime=start_datetime,
                end_datetime=end_datetime,
                defaults={
                    'description': description,
                    'event_type': event_type,
                    'all_day': random.random() < 0.1,  # 10% all-day events
                    'status': status,
                    'location': locations.get(event_type, 'Hotel Area'),
                    'room': random.choice(rooms) if event_type in ['MAINTENANCE', 'CLEANING'] and rooms else None,
                    'guest': random.choice(guests) if event_type == 'ACTIVITY' and random.random() < 0.3 and guests else None,
                    'created_by': admin_user,
                    'notes': f'Event {event_type.lower()} - {title}'
                }
            )
            
            if created:
                self.stdout.write(f'Created calendar event: {event.title}')

    def create_inventory(self):
        """Create hotel inventory items typical for Indonesian hotels"""
        inventory_items = [
            # Room Supplies
            {'name': 'Handuk Mandi', 'category': 'ROOM_SUPPLIES', 'stock': 200, 'min': 50, 'price': '25000'},
            {'name': 'Seprai Katun', 'category': 'ROOM_SUPPLIES', 'stock': 150, 'min': 30, 'price': '75000'},
            {'name': 'Sarung Bantal', 'category': 'ROOM_SUPPLIES', 'stock': 300, 'min': 60, 'price': '15000'},
            {'name': 'Selimut', 'category': 'ROOM_SUPPLIES', 'stock': 100, 'min': 20, 'price': '120000'},
            
            # Cleaning Supplies
            {'name': 'Sabun Mandi Cair', 'category': 'CLEANING', 'stock': 50, 'min': 10, 'price': '35000'},
            {'name': 'Shampoo', 'category': 'CLEANING', 'stock': 45, 'min': 10, 'price': '45000'},
            {'name': 'Tissue Toilet', 'category': 'CLEANING', 'stock': 500, 'min': 100, 'price': '8000'},
            {'name': 'Pembersih Lantai', 'category': 'CLEANING', 'stock': 30, 'min': 5, 'price': '25000'},
            
            # Guest Amenities
            {'name': 'Sikat Gigi', 'category': 'AMENITIES', 'stock': 1000, 'min': 200, 'price': '2000'},
            {'name': 'Pasta Gigi Mini', 'category': 'AMENITIES', 'stock': 800, 'min': 150, 'price': '3000'},
            {'name': 'Sisir Plastik', 'category': 'AMENITIES', 'stock': 500, 'min': 100, 'price': '1500'},
            {'name': 'Sandal Hotel', 'category': 'AMENITIES', 'stock': 200, 'min': 40, 'price': '15000'},
            
            # Food & Beverage
            {'name': 'Air Mineral 600ml', 'category': 'FOOD', 'stock': 1000, 'min': 200, 'price': '3000'},
            {'name': 'Kopi Sachet', 'category': 'FOOD', 'stock': 500, 'min': 100, 'price': '2500'},
            {'name': 'Teh Celup', 'category': 'FOOD', 'stock': 400, 'min': 80, 'price': '1500'},
            {'name': 'Gula Sachet', 'category': 'FOOD', 'stock': 600, 'min': 120, 'price': '500'},
            
            # Office Supplies
            {'name': 'Kertas A4', 'category': 'OFFICE', 'stock': 50, 'min': 10, 'price': '55000'},
            {'name': 'Pulpen', 'category': 'OFFICE', 'stock': 100, 'min': 20, 'price': '3000'},
            {'name': 'Form Registration', 'category': 'OFFICE', 'stock': 1000, 'min': 200, 'price': '500'},
            
            # Maintenance
            {'name': 'Lampu LED 12W', 'category': 'MAINTENANCE', 'stock': 50, 'min': 10, 'price': '35000'},
            {'name': 'Stop Kontak', 'category': 'MAINTENANCE', 'stock': 20, 'min': 5, 'price': '15000'},
            {'name': 'Kunci Kamar Cadangan', 'category': 'MAINTENANCE', 'stock': 30, 'min': 5, 'price': '25000'},
        ]
        
        for item_data in inventory_items:
            item, created = InventoryItem.objects.get_or_create(
                name=item_data['name'],
                defaults={
                    'category': item_data['category'],
                    'current_stock': item_data['stock'],
                    'minimum_stock': item_data['min'],
                    'maximum_stock': item_data['stock'] * 2,
                    'unit_price': Decimal(item_data['price']),
                    'unit_of_measurement': 'pcs',
                    'supplier': 'PT Sumber Rejeki' if 'FOOD' in item_data['category'] else 'CV Maju Jaya',
                    'description': f'Inventory item untuk hotel: {item_data["name"]}'
                }
            )
            
            if created:
                self.stdout.write(f'Created inventory item: {item.name}')