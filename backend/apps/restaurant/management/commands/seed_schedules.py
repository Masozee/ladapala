from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta, time
from apps.restaurant.models import Staff, Schedule
import random


class Command(BaseCommand):
    help = 'Seed schedule data for 3 months (90 days) with realistic shift patterns'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=90,
            help='Number of days to generate schedules for (default: 90)'
        )

    def handle(self, *args, **options):
        days = options['days']
        self.stdout.write(self.style.SUCCESS(f'Starting schedule seeding for {days} days...'))

        # Get all staff members
        staff_members = Staff.objects.filter(branch_id=4, is_active=True)

        if not staff_members.exists():
            self.stdout.write(self.style.ERROR('No active staff found. Run seed_auth_users first.'))
            return

        # Delete existing schedules to avoid conflicts
        deleted_count = Schedule.objects.all().delete()[0]
        self.stdout.write(self.style.WARNING(f'Deleted {deleted_count} existing schedules'))

        # Define shift patterns with realistic time ranges
        shift_patterns = {
            'MORNING': {
                'start': time(6, 0),
                'end': time(14, 0),
                'description': 'Morning Shift',
                'slots': 3  # Need 3 staff for morning
            },
            'AFTERNOON': {
                'start': time(14, 0),
                'end': time(22, 0),
                'description': 'Afternoon Shift',
                'slots': 4  # Need 4 staff for afternoon (busier)
            },
            'EVENING': {
                'start': time(10, 0),
                'end': time(18, 0),
                'description': 'Evening Shift',
                'slots': 2  # Alternative schedule
            },
            'NIGHT': {
                'start': time(18, 0),
                'end': time(2, 0),
                'description': 'Night Shift',
                'slots': 2  # Late night coverage
            }
        }

        # Organize staff by role
        cashiers = list(staff_members.filter(role='CASHIER'))
        managers = list(staff_members.filter(role='MANAGER'))
        kitchen_staff = list(staff_members.filter(role='KITCHEN'))
        warehouse_staff = list(staff_members.filter(role='WAREHOUSE'))
        admins = list(staff_members.filter(role='ADMIN'))

        # Start from today
        start_date = timezone.now().date()
        schedules_created = 0

        self.stdout.write(self.style.SUCCESS(f'\n📅 Generating schedules from {start_date} for {days} days...'))
        self.stdout.write(self.style.SUCCESS(f'👥 Staff: {len(cashiers)} cashiers, {len(kitchen_staff)} kitchen, {len(managers)} managers\n'))

        # Generate schedules for specified days
        for day_offset in range(days):
            current_date = start_date + timedelta(days=day_offset)
            day_of_week = current_date.weekday()  # 0=Monday, 6=Sunday
            is_weekend = day_of_week >= 5  # Saturday or Sunday

            # Track who's already scheduled today (prevent double-booking)
            scheduled_today = set()

            # === MORNING SHIFT (6 AM - 2 PM) ===
            # Always need cashiers and kitchen in the morning
            if cashiers:
                # Pick 2 cashiers for morning, avoid scheduling same people every day
                available_cashiers = [c for c in cashiers if c.id not in scheduled_today]
                if len(available_cashiers) >= 2:
                    morning_cashiers = random.sample(available_cashiers, 2)
                    for cashier in morning_cashiers:
                        # Most days except their day off
                        if random.random() > 0.15:  # 85% chance of being scheduled
                            schedules_created += self.create_schedule(
                                cashier, current_date, 'MORNING',
                                shift_patterns['MORNING']['start'],
                                shift_patterns['MORNING']['end']
                            )
                            scheduled_today.add(cashier.id)

            if kitchen_staff:
                available_kitchen = [k for k in kitchen_staff if k.id not in scheduled_today]
                if available_kitchen:
                    morning_kitchen = random.choice(available_kitchen)
                    # Kitchen works 6 days a week
                    if day_of_week < 6:
                        schedules_created += self.create_schedule(
                            morning_kitchen, current_date, 'MORNING',
                            shift_patterns['MORNING']['start'],
                            shift_patterns['MORNING']['end']
                        )
                        scheduled_today.add(morning_kitchen.id)

            # === AFTERNOON SHIFT (2 PM - 10 PM) ===
            # Busiest shift, need more staff
            if cashiers:
                available_cashiers = [c for c in cashiers if c.id not in scheduled_today]
                # Need 2-3 cashiers for afternoon
                num_afternoon = min(3, len(available_cashiers))
                if num_afternoon > 0:
                    afternoon_cashiers = random.sample(available_cashiers, num_afternoon)
                    for cashier in afternoon_cashiers:
                        if random.random() > 0.1:  # 90% chance
                            schedules_created += self.create_schedule(
                                cashier, current_date, 'AFTERNOON',
                                shift_patterns['AFTERNOON']['start'],
                                shift_patterns['AFTERNOON']['end']
                            )
                            scheduled_today.add(cashier.id)

            if kitchen_staff:
                available_kitchen = [k for k in kitchen_staff if k.id not in scheduled_today]
                # Need both kitchen staff in afternoon (busier)
                afternoon_kitchen = available_kitchen if len(available_kitchen) <= 2 else random.sample(available_kitchen, 2)
                for kitchen in afternoon_kitchen:
                    if day_of_week < 6 or is_weekend:  # Work weekends too
                        schedules_created += self.create_schedule(
                            kitchen, current_date, 'AFTERNOON',
                            shift_patterns['AFTERNOON']['start'],
                            shift_patterns['AFTERNOON']['end']
                        )
                        scheduled_today.add(kitchen.id)

            # Manager works afternoon shift on weekdays
            if managers and day_of_week < 5:
                manager = random.choice(managers)
                if manager.id not in scheduled_today:
                    schedules_created += self.create_schedule(
                        manager, current_date, 'AFTERNOON',
                        shift_patterns['AFTERNOON']['start'],
                        shift_patterns['AFTERNOON']['end']
                    )
                    scheduled_today.add(manager.id)

            # === EVENING SHIFT (10 AM - 6 PM) ===
            # Alternative mid-day shift for some staff
            if cashiers and day_of_week in [1, 3, 5]:  # Tue, Thu, Sat
                available_cashiers = [c for c in cashiers if c.id not in scheduled_today]
                if available_cashiers:
                    evening_cashier = random.choice(available_cashiers)
                    schedules_created += self.create_schedule(
                        evening_cashier, current_date, 'EVENING',
                        shift_patterns['EVENING']['start'],
                        shift_patterns['EVENING']['end']
                    )
                    scheduled_today.add(evening_cashier.id)

            # === NIGHT SHIFT (6 PM - 2 AM) ===
            # Only on busy days (Thu, Fri, Sat)
            if day_of_week in [3, 4, 5] and cashiers:  # Thu, Fri, Sat
                available_cashiers = [c for c in cashiers if c.id not in scheduled_today]
                if available_cashiers:
                    night_cashier = random.choice(available_cashiers)
                    schedules_created += self.create_schedule(
                        night_cashier, current_date, 'NIGHT',
                        shift_patterns['NIGHT']['start'],
                        shift_patterns['NIGHT']['end']
                    )
                    scheduled_today.add(night_cashier.id)

            # === WAREHOUSE STAFF ===
            # Weekdays only, morning shift
            if warehouse_staff and day_of_week < 5:
                warehouse = random.choice(warehouse_staff)
                if warehouse.id not in scheduled_today:
                    schedules_created += self.create_schedule(
                        warehouse, current_date, 'MORNING',
                        time(8, 0),
                        time(16, 0)
                    )
                    scheduled_today.add(warehouse.id)

            # === ADMIN STAFF ===
            # Regular office hours, weekdays only
            if admins and day_of_week < 5:
                admin = random.choice(admins)
                if admin.id not in scheduled_today:
                    schedules_created += self.create_schedule(
                        admin, current_date, 'MORNING',
                        time(9, 0),
                        time(17, 0)
                    )
                    scheduled_today.add(admin.id)

            # Progress indicator
            if (day_offset + 1) % 10 == 0:
                self.stdout.write(f'  ✓ Generated {day_offset + 1}/{days} days ({schedules_created} schedules so far)')

        self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully created {schedules_created} schedules for {days} days'))
        self.stdout.write(self.style.SUCCESS(f'   Date range: {start_date} to {start_date + timedelta(days=days-1)}'))
        self.stdout.write(self.style.SUCCESS(f'   Average: {schedules_created / days:.1f} schedules per day'))

    def create_schedule(self, staff, date, shift_type, start_time, end_time):
        """Helper method to create a schedule with error handling"""
        try:
            # Check if schedule already exists
            existing = Schedule.objects.filter(
                staff=staff,
                date=date,
                shift_type=shift_type
            ).first()

            if existing:
                return 0

            # Calculate hours
            start_datetime = datetime.combine(date, start_time)
            end_datetime = datetime.combine(date, end_time)
            if end_time < start_time:  # Overnight shift
                end_datetime += timedelta(days=1)
            hours_diff = (end_datetime - start_datetime).total_seconds() / 3600

            # Randomly confirm schedules (85% confirmed, 15% just scheduled)
            is_confirmed = random.random() > 0.15

            Schedule.objects.create(
                staff=staff,
                date=date,
                shift_type=shift_type,
                start_time=start_time,
                end_time=end_time,
                is_confirmed=is_confirmed,
                notes=f'Auto-generated {shift_type.lower()} shift'
            )
            return 1
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'   ⚠ Skipped {staff.user.get_full_name()} on {date}: {str(e)}'))
            return 0
