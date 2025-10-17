from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta, time
from apps.restaurant.models import Staff, Schedule
import random


class Command(BaseCommand):
    help = 'Seed schedule data for one month'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting schedule seeding...'))

        # Get all staff members
        staff_members = Staff.objects.filter(branch_id=4, is_active=True)

        if not staff_members.exists():
            self.stdout.write(self.style.ERROR('No active staff found. Run seed_auth_users first.'))
            return

        # Delete existing schedules to avoid conflicts
        deleted_count = Schedule.objects.all().delete()[0]
        self.stdout.write(self.style.WARNING(f'Deleted {deleted_count} existing schedules'))

        # Define shift patterns
        shift_patterns = {
            'MORNING': {
                'start': time(6, 0),
                'end': time(14, 0),
                'description': 'Morning Shift'
            },
            'AFTERNOON': {
                'start': time(14, 0),
                'end': time(22, 0),
                'description': 'Afternoon Shift'
            },
            'EVENING': {
                'start': time(10, 0),
                'end': time(18, 0),
                'description': 'Evening Shift'
            },
            'NIGHT': {
                'start': time(18, 0),
                'end': time(2, 0),
                'description': 'Night Shift'
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

        # Generate schedules for 30 days
        for day_offset in range(30):
            current_date = start_date + timedelta(days=day_offset)
            day_of_week = current_date.weekday()  # 0=Monday, 6=Sunday

            # MORNING SHIFT (6 AM - 2 PM)
            # Need: 1-2 cashiers, 1 kitchen staff
            if cashiers:
                morning_cashiers = random.sample(cashiers, min(2, len(cashiers)))
                for cashier in morning_cashiers:
                    # 5 days a week (skip random days for variety)
                    if day_of_week < 5 or random.random() > 0.3:
                        schedules_created += self.create_schedule(
                            cashier, current_date, 'MORNING',
                            shift_patterns['MORNING']['start'],
                            shift_patterns['MORNING']['end']
                        )

            if kitchen_staff:
                morning_kitchen = random.choice(kitchen_staff)
                if day_of_week < 6:  # 6 days a week
                    schedules_created += self.create_schedule(
                        morning_kitchen, current_date, 'MORNING',
                        shift_patterns['MORNING']['start'],
                        shift_patterns['MORNING']['end']
                    )

            # AFTERNOON SHIFT (2 PM - 10 PM)
            # Need: 2-3 cashiers, 1-2 kitchen staff, manager sometimes
            if cashiers:
                afternoon_cashiers = random.sample(cashiers, min(3, len(cashiers)))
                for cashier in afternoon_cashiers:
                    if day_of_week < 6 or random.random() > 0.4:
                        schedules_created += self.create_schedule(
                            cashier, current_date, 'AFTERNOON',
                            shift_patterns['AFTERNOON']['start'],
                            shift_patterns['AFTERNOON']['end']
                        )

            if kitchen_staff:
                afternoon_kitchen = random.sample(kitchen_staff, min(2, len(kitchen_staff)))
                for kitchen in afternoon_kitchen:
                    if day_of_week < 6:
                        schedules_created += self.create_schedule(
                            kitchen, current_date, 'AFTERNOON',
                            shift_patterns['AFTERNOON']['start'],
                            shift_patterns['AFTERNOON']['end']
                        )

            # Manager works afternoon shift most days
            if managers and day_of_week < 5:
                manager = random.choice(managers)
                schedules_created += self.create_schedule(
                    manager, current_date, 'AFTERNOON',
                    shift_patterns['AFTERNOON']['start'],
                    shift_patterns['AFTERNOON']['end']
                )

            # EVENING SHIFT (10 AM - 6 PM) - Alternative schedule
            # Some staff prefer this schedule
            if len(cashiers) > 2:
                evening_cashier = random.choice(cashiers)
                if day_of_week in [1, 3, 5]:  # Tue, Thu, Sat
                    schedules_created += self.create_schedule(
                        evening_cashier, current_date, 'EVENING',
                        shift_patterns['EVENING']['start'],
                        shift_patterns['EVENING']['end']
                    )

            # NIGHT SHIFT (6 PM - 2 AM) - For late night operations
            # Only on busy days (Fri, Sat)
            if day_of_week in [4, 5]:  # Friday, Saturday
                if cashiers:
                    night_cashier = random.choice(cashiers)
                    schedules_created += self.create_schedule(
                        night_cashier, current_date, 'NIGHT',
                        shift_patterns['NIGHT']['start'],
                        shift_patterns['NIGHT']['end']
                    )

            # Warehouse staff - weekdays only, morning shift
            if warehouse_staff and day_of_week < 5:
                warehouse = random.choice(warehouse_staff)
                schedules_created += self.create_schedule(
                    warehouse, current_date, 'MORNING',
                    time(8, 0),
                    time(16, 0)
                )

            # Admin staff - regular office hours
            if admins and day_of_week < 5:
                admin = random.choice(admins)
                schedules_created += self.create_schedule(
                    admin, current_date, 'MORNING',
                    time(9, 0),
                    time(17, 0)
                )

        self.stdout.write(self.style.SUCCESS(f'✅ Successfully created {schedules_created} schedules for 30 days'))
        self.stdout.write(self.style.SUCCESS(f'   Date range: {start_date} to {start_date + timedelta(days=29)}'))

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

            # Randomly confirm some schedules (80% confirmed)
            is_confirmed = random.random() > 0.2

            Schedule.objects.create(
                staff=staff,
                date=date,
                shift_type=shift_type,
                start_time=start_time,
                end_time=end_time,
                is_confirmed=is_confirmed,
                notes=f'Auto-generated schedule for {shift_type.lower()} shift'
            )
            return 1
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'   Skipped schedule for {staff.user.get_full_name()} on {date}: {str(e)}'))
            return 0
