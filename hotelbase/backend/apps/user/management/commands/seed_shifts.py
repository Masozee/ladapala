from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import datetime, timedelta
from apps.user.models import Employee, Shift
import random


class Command(BaseCommand):
    help = 'Seed shift schedule data for employees'

    def handle(self, *args, **options):
        self.stdout.write('Seeding shift data...')

        # Get all active employees
        employees = Employee.objects.filter(is_active=True)

        if not employees.exists():
            self.stdout.write(self.style.ERROR('No active employees found. Please seed employees first.'))
            return

        # Delete existing shifts
        Shift.objects.all().delete()
        self.stdout.write('Cleared existing shifts')

        # Define shift times
        shift_times = {
            'MORNING': ('07:00', '15:00'),
            'AFTERNOON': ('15:00', '23:00'),
            'EVENING': ('14:00', '22:00'),
            'NIGHT': ('23:00', '07:00'),
        }

        # Generate shifts for the past 2 weeks and next 4 weeks
        start_date = timezone.now().date() - timedelta(days=14)
        end_date = timezone.now().date() + timedelta(days=28)

        shifts_created = 0
        current_date = start_date

        while current_date <= end_date:
            # For each day, assign shifts to employees
            for employee in employees:
                # Skip some days randomly (days off)
                if random.random() < 0.15:  # 15% chance of day off
                    continue

                # Randomly select shift type
                shift_type = random.choice(['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT'])
                start_time, end_time = shift_times[shift_type]

                # Occasionally add overtime
                if random.random() < 0.1:  # 10% chance of overtime
                    Shift.objects.create(
                        employee=employee,
                        shift_date=current_date,
                        start_time=end_time,
                        end_time='20:00' if shift_type == 'MORNING' else '02:00',
                        shift_type='OVERTIME',
                        notes='Overtime shift'
                    )
                    shifts_created += 1

                # Create main shift
                Shift.objects.create(
                    employee=employee,
                    shift_date=current_date,
                    start_time=start_time,
                    end_time=end_time,
                    shift_type=shift_type,
                    notes=random.choice(['', '', '', 'Training session', 'Team meeting', '']) if random.random() < 0.2 else ''
                )
                shifts_created += 1

            current_date += timedelta(days=1)

        self.stdout.write(self.style.SUCCESS(f'Successfully created {shifts_created} shifts for {employees.count()} employees'))
