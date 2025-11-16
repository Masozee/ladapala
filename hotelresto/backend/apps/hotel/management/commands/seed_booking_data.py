from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
import random
from apps.hotel.models import (
    Room, RoomType, Guest, Reservation, Payment, CheckIn
)


class Command(BaseCommand):
    help = 'Seed hotel booking data without deleting existing data - 3 months historical + 1 month future with 88% occupancy'

    def handle(self, *args, **kwargs):
        self.stdout.write('Starting to seed booking data...')

        # Get all active rooms and room types
        rooms = list(Room.objects.filter(is_active=True))
        room_types = list(RoomType.objects.filter(is_active=True))

        if not rooms:
            self.stdout.write(self.style.ERROR('No active rooms found. Please create rooms first.'))
            return

        # Name pools by nationality - REALISTIC NAMES
        name_pools = {
            'Indonesia': {
                'male_first': ['Budi', 'Ahmad', 'Agus', 'Dwi', 'Eko', 'Hendra', 'Joko', 'Rudi', 'Slamet', 'Yudi',
                              'Andri', 'Bambang', 'Dedi', 'Hendro', 'Irwan', 'Kurniawan', 'Lukman', 'Maman', 'Rian', 'Tono',
                              'Arief', 'Bayu', 'Doni', 'Fajar', 'Rizki', 'Wahyu', 'Yanto', 'Zainal'],
                'female_first': ['Siti', 'Dewi', 'Sri', 'Rina', 'Ani', 'Lina', 'Maya', 'Nur', 'Putri', 'Ratna',
                                'Ayu', 'Citra', 'Dian', 'Evi', 'Fitri', 'Indah', 'Kartika', 'Lilik', 'Mega', 'Yanti',
                                'Sari', 'Tuti', 'Umi', 'Wati', 'Yuni', 'Zulfa'],
                'last': ['Santoso', 'Wijaya', 'Kurniawan', 'Susanto', 'Prasetyo', 'Wibowo', 'Setiawan', 'Hartanto',
                        'Gunawan', 'Sutanto', 'Kusuma', 'Putra', 'Saputra', 'Hidayat', 'Rahman', 'Hartono',
                        'Permana', 'Nugroho', 'Hakim', 'Budiman', 'Sari', 'Utomo', 'Riyadi']
            },
            'Singapore': {
                'male_first': ['Wei', 'Jun', 'Xin', 'Ming', 'Hao', 'Kai', 'Liang', 'Chen', 'Kumar', 'Raj',
                              'Arjun', 'David', 'Marcus', 'Ryan', 'Brandon', 'Ethan', 'Isaac', 'Adrian'],
                'female_first': ['Li', 'Ying', 'Xin', 'Hui', 'Mei', 'Priya', 'Aisha', 'Sarah', 'Jasmine', 'Rachel',
                                'Emma', 'Sophie', 'Chloe', 'Isabella', 'Olivia', 'Maya', 'Zara'],
                'last': ['Tan', 'Lim', 'Lee', 'Ng', 'Ong', 'Wong', 'Goh', 'Chua', 'Chan', 'Koh',
                        'Kumar', 'Singh', 'Sharma', 'Chen', 'Wang', 'Teo', 'Ang', 'Yeo']
            },
            'Malaysia': {
                'male_first': ['Ahmad', 'Mohamed', 'Ali', 'Hassan', 'Ibrahim', 'Wei', 'Jun', 'Kumar', 'Raj', 'Murugan',
                              'David', 'Daniel', 'Adam', 'Azman', 'Faiz', 'Hafiz', 'Iqbal', 'Ridzuan'],
                'female_first': ['Siti', 'Nur', 'Fatimah', 'Aisha', 'Zainab', 'Li', 'Mei', 'Priya', 'Lakshmi', 'Devi',
                                'Sarah', 'Hannah', 'Emma', 'Amira', 'Sofia', 'Nadia', 'Alya'],
                'last': ['Abdullah', 'Rahman', 'Hassan', 'Ahmad', 'Ibrahim', 'Tan', 'Lee', 'Lim', 'Wong', 'Chen',
                        'Kumar', 'Singh', 'Raju', 'Muthu', 'Krishnan', 'Yusof', 'Ismail']
            },
            'Australia': {
                'male_first': ['James', 'Jack', 'Oliver', 'William', 'Thomas', 'Cooper', 'Liam', 'Noah', 'Ethan', 'Lucas',
                              'Mason', 'Harrison', 'Charlie', 'Henry', 'Alexander', 'Joshua', 'Max', 'Ben'],
                'female_first': ['Charlotte', 'Olivia', 'Amelia', 'Isla', 'Mia', 'Grace', 'Ava', 'Chloe', 'Emily', 'Sophie',
                                'Ella', 'Ruby', 'Lucy', 'Lily', 'Zoe', 'Harper', 'Ivy', 'Poppy'],
                'last': ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson',
                        'Thompson', 'Nguyen', 'Thomas', 'Walker', 'Harris', 'Davis', 'Miller']
            },
            'United States': {
                'male_first': ['John', 'Michael', 'David', 'James', 'Robert', 'William', 'Richard', 'Joseph', 'Thomas', 'Christopher',
                              'Daniel', 'Matthew', 'Anthony', 'Donald', 'Mark', 'Paul', 'Steven', 'Andrew'],
                'female_first': ['Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
                                'Nancy', 'Lisa', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily'],
                'last': ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
                        'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor']
            },
            'China': {
                'male_first': ['Wei', 'Jun', 'Ming', 'Hao', 'Feng', 'Lei', 'Jian', 'Gang', 'Qiang', 'Yong',
                              'Tao', 'Kai', 'Xin', 'Long', 'Peng', 'Bo', 'Chao', 'Han'],
                'female_first': ['Li', 'Ying', 'Xin', 'Jing', 'Na', 'Fang', 'Mei', 'Yan', 'Min', 'Xia',
                                'Hui', 'Juan', 'Qing', 'Rong', 'Wen', 'Yue', 'Lin', 'Xuan'],
                'last': ['Wang', 'Li', 'Zhang', 'Liu', 'Chen', 'Yang', 'Huang', 'Zhao', 'Wu', 'Zhou',
                        'Xu', 'Sun', 'Ma', 'Zhu', 'Hu', 'Guo', 'He', 'Gao']
            },
            'Japan': {
                'male_first': ['Hiroshi', 'Takeshi', 'Kenji', 'Yuki', 'Daisuke', 'Takashi', 'Kazuo', 'Akira', 'Masato', 'Ryo',
                              'Taro', 'Haruto', 'Sota', 'Yuta', 'Kaito', 'Kenta', 'Shota', 'Daiki'],
                'female_first': ['Yuki', 'Sakura', 'Hana', 'Aiko', 'Emi', 'Yui', 'Rin', 'Hina', 'Mei', 'Miyu',
                                'Ayaka', 'Kana', 'Mio', 'Nana', 'Riko', 'Yui', 'Akari', 'Momoka'],
                'last': ['Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Ito', 'Yamamoto', 'Nakamura', 'Kobayashi', 'Kato',
                        'Yoshida', 'Yamada', 'Sasaki', 'Yamaguchi', 'Matsumoto', 'Inoue', 'Kimura']
            },
            'South Korea': {
                'male_first': ['Min-jun', 'Seo-jun', 'Ji-ho', 'Jun-seo', 'Ye-jun', 'Do-yoon', 'Si-woo', 'Hyun-woo', 'Jin-woo', 'Woo-jin',
                              'Seung-hyun', 'Jae-hyun', 'Dong-hyun', 'Min-ho', 'Sung-min', 'Tae-yang', 'Joon-ho'],
                'female_first': ['Seo-yeon', 'Min-seo', 'Ji-woo', 'Seo-hyun', 'Ha-eun', 'Ye-jin', 'Soo-jin', 'Ji-hye', 'Eun-ji', 'Hye-jin',
                                'Min-ji', 'Yoon-seo', 'Ji-min', 'Ye-eun', 'Su-bin', 'Da-eun', 'So-yeon'],
                'last': ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim',
                        'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Song', 'Hong']
            },
            'United Kingdom': {
                'male_first': ['Oliver', 'George', 'Harry', 'Jack', 'Jacob', 'Noah', 'Charlie', 'Muhammad', 'Thomas', 'Oscar',
                              'James', 'William', 'Alfie', 'Henry', 'Joshua', 'Freddie', 'Ethan', 'Archie'],
                'female_first': ['Olivia', 'Amelia', 'Isla', 'Ava', 'Emily', 'Isabella', 'Mia', 'Poppy', 'Ella', 'Lily',
                                'Sophie', 'Grace', 'Sophia', 'Charlotte', 'Chloe', 'Freya', 'Evie', 'Florence'],
                'last': ['Smith', 'Jones', 'Taylor', 'Williams', 'Brown', 'Davies', 'Evans', 'Wilson', 'Thomas', 'Roberts',
                        'Johnson', 'Lewis', 'Walker', 'Robinson', 'Wood', 'Thompson', 'White']
            },
            'Germany': {
                'male_first': ['Lukas', 'Leon', 'Tim', 'Paul', 'Jonas', 'Finn', 'Max', 'Elias', 'Noah', 'Felix',
                              'Ben', 'Moritz', 'Jan', 'Alexander', 'Maximilian', 'David', 'Tom', 'Niklas'],
                'female_first': ['Emma', 'Mia', 'Hannah', 'Sophia', 'Anna', 'Lena', 'Lea', 'Marie', 'Laura', 'Lina',
                                'Emily', 'Johanna', 'Sophie', 'Charlotte', 'Amelie', 'Luisa', 'Clara', 'Lisa'],
                'last': ['Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
                        'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder']
            }
        }

        nationalities = [
            ('Indonesia', 0.45),  # 45% Indonesian
            ('Singapore', 0.15),  # 15% Singaporean
            ('Malaysia', 0.10),   # 10% Malaysian
            ('Australia', 0.08),  # 8% Australian
            ('United States', 0.07),  # 7% American
            ('China', 0.05),      # 5% Chinese
            ('Japan', 0.04),      # 4% Japanese
            ('South Korea', 0.03), # 3% South Korean
            ('United Kingdom', 0.02), # 2% British
            ('Germany', 0.01),    # 1% German
        ]

        payment_methods = [
            ('CASH', 0.25),
            ('CREDIT_CARD', 0.40),
            ('DEBIT_CARD', 0.20),
            ('BANK_TRANSFER', 0.10),
            ('DIGITAL_WALLET', 0.05),
        ]

        booking_sources = [
            ('DIRECT', 0.30),
            ('ONLINE', 0.40),
            ('PHONE', 0.15),
            ('WALK_IN', 0.10),
            ('TRAVEL_AGENT', 0.05),
        ]

        # Helper function to choose weighted random
        def weighted_choice(choices):
            total = sum(weight for _, weight in choices)
            r = random.uniform(0, total)
            upto = 0
            for choice, weight in choices:
                if upto + weight >= r:
                    return choice
                upto += weight
            return choices[0][0]

        # Helper function to generate guest with realistic names by nationality
        def create_guest(nationality):
            gender = random.choice(['M', 'F'])

            # Get name pool for this nationality
            pool = name_pools.get(nationality, name_pools['United States'])

            if gender == 'M':
                first_name = random.choice(pool['male_first'])
            else:
                first_name = random.choice(pool['female_first'])

            # Add middle initial or second name for variety (30% chance)
            if random.random() < 0.3:
                if nationality in ['Indonesia', 'Malaysia']:
                    # Indonesian/Malaysian: Add second name
                    second_name = random.choice(pool['male_first'] if gender == 'M' else pool['female_first'])
                    first_name = f"{first_name} {second_name}"
                elif nationality in ['China', 'Japan', 'South Korea', 'Singapore']:
                    # Asian: Keep as is (no middle names typically)
                    pass
                else:
                    # Western: Add middle initial
                    middle_initial = random.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
                    first_name = f"{first_name} {middle_initial}."

            last_name = random.choice(pool['last'])

            # Check if this name already exists - if so, make it unique
            full_name_check = f"{first_name} {last_name}"
            if Guest.objects.filter(first_name=first_name, last_name=last_name).exists():
                # Add a unique suffix to first name to avoid exact duplicates
                suffix_num = Guest.objects.filter(last_name=last_name, first_name__startswith=first_name).count() + 1
                first_name = f"{first_name}"  # Keep original, email will be unique anyway

            # Generate unique email
            email_base = f"{first_name.lower().replace('-', '').replace(' ', '')}.{last_name.lower().replace('ü', 'u').replace('ä', 'a').replace('ö', 'o')}"
            email_suffix = random.randint(1000, 9999)
            email = f"{email_base}{email_suffix}@example.com"

            # Check if email exists
            while Guest.objects.filter(email=email).exists():
                email_suffix = random.randint(1000, 9999)
                email = f"{email_base}{email_suffix}@example.com"

            # Phone prefix by nationality
            phone_prefixes = {
                'Indonesia': '+62',
                'Singapore': '+65',
                'Malaysia': '+60',
                'Australia': '+61',
                'United States': '+1',
                'China': '+86',
                'Japan': '+81',
                'South Korea': '+82',
                'United Kingdom': '+44',
                'Germany': '+49'
            }
            phone_prefix = phone_prefixes.get(nationality, '+1')
            phone = f"{phone_prefix}{random.randint(8000000000, 8999999999)}"

            # Date of birth (25-65 years old)
            age = random.randint(25, 65)
            dob = datetime.now().date() - timedelta(days=age*365 + random.randint(0, 365))

            id_type = 'national_id' if nationality in ['Indonesia', 'Singapore', 'Malaysia'] else random.choice(['passport', 'driving_license'])
            id_number = f"{random.randint(1000000000, 9999999999)}"

            is_vip = random.random() < 0.05  # 5% VIP
            loyalty_points = random.randint(100, 5000) if is_vip else random.randint(0, 500)

            guest = Guest.objects.create(
                first_name=first_name,
                last_name=last_name,
                email=email,
                phone=phone,
                date_of_birth=dob,
                gender=gender,
                nationality=nationality,
                id_type=id_type,
                id_number=id_number,
                is_vip=is_vip,
                loyalty_points=loyalty_points,
            )

            return guest

        # Helper function to check if room is available for date range
        def is_room_available(room, check_in_date, check_out_date):
            """Check if room is available for the given date range"""
            overlapping = Reservation.objects.filter(
                room=room,
                check_out_date__gt=check_in_date,
                check_in_date__lt=check_out_date
            ).exclude(status='CANCELLED')
            return not overlapping.exists()

        # Generate historical data (3 months back + current month)
        self.stdout.write('Generating historical booking data (3 months back + current month)...')
        today = datetime.now().date()
        historical_start = today - timedelta(days=90)  # 3 months back
        historical_end = today  # Include today (current month)

        historical_bookings = 0
        current_date = historical_start

        while current_date <= historical_end:
            # Weekend has higher occupancy (70-85%) vs weekday (50-70%)
            is_weekend = current_date.weekday() in [5, 6]  # Saturday, Sunday
            if is_weekend:
                target_occupancy = random.uniform(0.70, 0.85)
            else:
                target_occupancy = random.uniform(0.50, 0.70)

            # Shuffle rooms for random selection
            shuffled_rooms = list(rooms)
            random.shuffle(shuffled_rooms)

            bookings_today = 0
            target_bookings = int(len(rooms) * target_occupancy)

            for room in shuffled_rooms:
                if bookings_today >= target_bookings:
                    break

                # Random stay duration (1-7 nights, most common: 1-3)
                stay_duration_weights = [
                    (1, 0.35), (2, 0.30), (3, 0.20), (4, 0.08), (5, 0.04), (6, 0.02), (7, 0.01)
                ]
                stay_duration = weighted_choice(stay_duration_weights)

                check_in = current_date
                check_out = check_in + timedelta(days=stay_duration)

                # Skip if check_out is in the future, unless it's today (for realistic "today's transactions")
                if check_out > today and current_date < today:
                    continue

                # Check if room is available for this date range
                if not is_room_available(room, check_in, check_out):
                    continue

                # Create guest
                nationality = weighted_choice(nationalities)
                guest = create_guest(nationality)

                # Create reservation
                adults = random.randint(1, min(3, room.room_type.max_occupancy))
                children = random.randint(0, max(0, room.room_type.max_occupancy - adults))

                # Generate reservation number
                timestamp = timezone.now().strftime('%Y%m%d')
                random_num = random.randint(1000, 9999)
                reservation_number = f'RES{timestamp}{random_num}'

                # Ensure unique reservation number
                while Reservation.objects.filter(reservation_number=reservation_number).exists():
                    random_num = random.randint(1000, 9999)
                    reservation_number = f'RES{timestamp}{random_num}'

                booking_source = weighted_choice(booking_sources)

                # Calculate total amount
                room_price = room.get_current_price()
                subtotal = room_price * stay_duration
                tax = subtotal * Decimal('0.11')  # 11% tax
                total_amount = subtotal + tax

                # Historical reservations: CHECKED_OUT if in past, CHECKED_IN if today
                reservation_status = 'CHECKED_IN' if check_in == today else 'CHECKED_OUT'
                reservation = Reservation.objects.create(
                    reservation_number=reservation_number,
                    guest=guest,
                    room=room,
                    check_in_date=check_in,
                    check_out_date=check_out,
                    adults=adults,
                    children=children,
                    status=reservation_status,
                    booking_source=booking_source,
                    total_amount=total_amount,
                )

                # Create check-in record
                check_in_time = timezone.make_aware(
                    datetime.combine(check_in, datetime.min.time().replace(hour=14, minute=random.randint(0, 59)))
                )

                CheckIn.objects.create(
                    reservation=reservation,
                    actual_check_in_time=check_in_time,
                    early_check_in=random.random() < 0.1,  # 10% early check-in
                    late_check_in=random.random() < 0.05,  # 5% late check-in
                    room_key_issued=True,
                    deposit_collected=Decimal('500000') if random.random() < 0.7 else None,
                    status='CHECKED_IN',
                )

                # Create payment(s)
                # 80% pay in full, 20% split payments
                if random.random() < 0.8:
                    # Single payment on check-in day
                    payment_method = weighted_choice(payment_methods)
                    payment_datetime = datetime(
                        check_in.year, check_in.month, check_in.day,
                        15, random.randint(0, 59), 0
                    )
                    payment_date = timezone.make_aware(payment_datetime)

                    Payment.objects.create(
                        reservation=reservation,
                        amount=total_amount,
                        payment_method=payment_method,
                        status='COMPLETED',
                        payment_date=payment_date,
                        notes=f'Payment for {guest.full_name} - Room {room.number}',
                    )
                else:
                    # Split into 2 payments (deposit + balance)
                    deposit = total_amount * Decimal('0.5')
                    balance = total_amount - deposit

                    # First payment (deposit) - 1-14 days before check-in
                    deposit_date = check_in - timedelta(days=random.randint(1, 14))
                    payment_method_1 = weighted_choice(payment_methods)
                    payment_datetime_1 = datetime(
                        deposit_date.year, deposit_date.month, deposit_date.day,
                        random.randint(9, 17), random.randint(0, 59), 0
                    )
                    payment_date_1 = timezone.make_aware(payment_datetime_1)

                    Payment.objects.create(
                        reservation=reservation,
                        amount=deposit,
                        payment_method=payment_method_1,
                        status='COMPLETED',
                        payment_date=payment_date_1,
                        notes=f'Deposit payment for {guest.full_name} - Room {room.number}',
                    )

                    # Second payment (balance) - on check-out day
                    payment_method_2 = weighted_choice(payment_methods)
                    payment_datetime_2 = datetime(
                        check_out.year, check_out.month, check_out.day,
                        11, random.randint(0, 59), 0
                    )
                    payment_date_2 = timezone.make_aware(payment_datetime_2)

                    Payment.objects.create(
                        reservation=reservation,
                        amount=balance,
                        payment_method=payment_method_2,
                        status='COMPLETED',
                        payment_date=payment_date_2,
                        notes=f'Balance payment for {guest.full_name} - Room {room.number}',
                    )

                historical_bookings += 1
                bookings_today += 1

            current_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS(f'✓ Created {historical_bookings} historical/current bookings'))

        # Generate future bookings (1 month forward with 88% occupancy)
        self.stdout.write('Generating future booking data (1 month forward with 88% occupancy)...')

        next_month_start = today + timedelta(days=1)
        # Calculate end of next month properly
        import calendar
        next_month = today.month + 1 if today.month < 12 else 1
        next_year = today.year if today.month < 12 else today.year + 1
        last_day_next_month = calendar.monthrange(next_year, next_month)[1]
        next_month_end = datetime(next_year, next_month, last_day_next_month).date()

        future_bookings = 0
        current_date = next_month_start

        while current_date <= next_month_end:
            # Consistent 88% occupancy for future bookings
            target_occupancy = 0.88
            target_bookings = int(len(rooms) * target_occupancy)

            # Shuffle rooms for random selection
            shuffled_rooms = list(rooms)
            random.shuffle(shuffled_rooms)

            bookings_today = 0

            for room in shuffled_rooms:
                if bookings_today >= target_bookings:
                    break

                # Random stay duration (1-7 nights, most common: 2-4 for future bookings)
                stay_duration_weights = [
                    (1, 0.15), (2, 0.25), (3, 0.30), (4, 0.15), (5, 0.08), (6, 0.05), (7, 0.02)
                ]
                stay_duration = weighted_choice(stay_duration_weights)

                check_in = current_date
                check_out = check_in + timedelta(days=stay_duration)

                # Check if room is available for this date range
                if not is_room_available(room, check_in, check_out):
                    continue

                # Create guest
                nationality = weighted_choice(nationalities)
                guest = create_guest(nationality)

                # Create reservation
                adults = random.randint(1, min(3, room.room_type.max_occupancy))
                children = random.randint(0, max(0, room.room_type.max_occupancy - adults))

                # Generate reservation number
                timestamp = timezone.now().strftime('%Y%m%d')
                random_num = random.randint(1000, 9999)
                reservation_number = f'RES{timestamp}{random_num}'

                # Ensure unique reservation number
                while Reservation.objects.filter(reservation_number=reservation_number).exists():
                    random_num = random.randint(1000, 9999)
                    reservation_number = f'RES{timestamp}{random_num}'

                booking_source = weighted_choice(booking_sources)

                # Calculate total amount
                room_price = room.get_current_price()
                subtotal = room_price * stay_duration
                tax = subtotal * Decimal('0.11')  # 11% tax
                total_amount = subtotal + tax

                # Future reservations are CONFIRMED
                # Some have partial payments (30%), most are unpaid
                has_partial_payment = random.random() < 0.30

                reservation = Reservation.objects.create(
                    reservation_number=reservation_number,
                    guest=guest,
                    room=room,
                    check_in_date=check_in,
                    check_out_date=check_out,
                    adults=adults,
                    children=children,
                    status='CONFIRMED',
                    booking_source=booking_source,
                    total_amount=total_amount,
                    special_requests='Early check-in requested' if random.random() < 0.15 else None,
                )

                # Create partial payment if applicable
                if has_partial_payment:
                    deposit = total_amount * Decimal('0.3')  # 30% deposit
                    payment_method = weighted_choice(payment_methods)

                    # Payment made randomly in the past 7-21 days (spread across time)
                    days_ago = random.randint(7, 21)
                    payment_date_raw = today - timedelta(days=days_ago)
                    payment_date = timezone.make_aware(
                        datetime.combine(payment_date_raw,
                                       datetime.min.time().replace(hour=random.randint(9, 17), minute=random.randint(0, 59)))
                    )

                    Payment.objects.create(
                        reservation=reservation,
                        amount=deposit,
                        payment_method=payment_method,
                        status='COMPLETED',
                        payment_date=payment_date,
                        notes=f'Advance payment for {guest.full_name} - Room {room.number}',
                    )

                future_bookings += 1
                bookings_today += 1

            current_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS(f'✓ Created {future_bookings} future bookings'))

        # Summary
        total_guests = Guest.objects.count()
        total_reservations = Reservation.objects.count()
        total_payments = Payment.objects.count()
        total_checkins = CheckIn.objects.count()

        self.stdout.write('\n' + '='*50)
        self.stdout.write(self.style.SUCCESS('SEED DATA SUMMARY:'))
        self.stdout.write(f'Total Guests: {total_guests}')
        self.stdout.write(f'Total Reservations: {total_reservations}')
        self.stdout.write(f'Total Payments: {total_payments}')
        self.stdout.write(f'Total Check-ins: {total_checkins}')
        self.stdout.write(f'Historical/Current Bookings ({historical_start} to {today}): {historical_bookings}')
        self.stdout.write(f'Future Bookings ({next_month_start} to {next_month_end}): {future_bookings}')
        self.stdout.write(f'Date Range: {historical_start} to {next_month_end}')
        self.stdout.write('='*50)
        self.stdout.write(self.style.SUCCESS('✓ Seed data created successfully without deleting existing data!'))
