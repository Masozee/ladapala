"""
Management command to seed housekeeping staff with schedules
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.user.models import User, Employee, Department, Shift, Attendance
from datetime import time


class Command(BaseCommand):
    help = 'Seed housekeeping staff with work schedules'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting to seed housekeeping staff...'))

        # Get or create housekeeping department
        housekeeping_dept, created = Department.objects.get_or_create(
            name='Housekeeping',
            defaults={
                'description': 'Responsible for cleaning and maintaining guest rooms',
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('✓ Created Housekeeping department'))

        # Housekeeping staff data
        staff_data = [
            {
                'email': 'maria.santos@hotel.com',
                'password': 'password123',
                'first_name': 'Maria',
                'last_name': 'Santos',
                'position': 'Head Housekeeper',
                'shift_type': 'MORNING',
                'start_time': time(7, 0),
                'end_time': time(15, 0),
                'floor_area': [1, 2]  # Covers floors 1-2
            },
            {
                'email': 'rosa.garcia@hotel.com',
                'password': 'password123',
                'first_name': 'Rosa',
                'last_name': 'Garcia',
                'position': 'Room Attendant',
                'shift_type': 'MORNING',
                'start_time': time(7, 0),
                'end_time': time(15, 0),
                'floor_area': [3, 4]  # Covers floors 3-4
            },
            {
                'email': 'ana.lopez@hotel.com',
                'password': 'password123',
                'first_name': 'Ana',
                'last_name': 'Lopez',
                'position': 'Room Attendant',
                'shift_type': 'AFTERNOON',
                'start_time': time(15, 0),
                'end_time': time(23, 0),
                'floor_area': [1, 2, 3]  # Covers floors 1-3
            },
            {
                'email': 'carmen.rodriguez@hotel.com',
                'password': 'password123',
                'first_name': 'Carmen',
                'last_name': 'Rodriguez',
                'position': 'Room Attendant',
                'shift_type': 'MORNING',
                'start_time': time(8, 0),
                'end_time': time(16, 0),
                'floor_area': [2, 3]  # Covers floors 2-3
            },
            {
                'email': 'lucia.martinez@hotel.com',
                'password': 'password123',
                'first_name': 'Lucia',
                'last_name': 'Martinez',
                'position': 'Room Attendant',
                'shift_type': 'AFTERNOON',
                'start_time': time(14, 0),
                'end_time': time(22, 0),
                'floor_area': [4, 5]  # Covers floors 4-5
            },
        ]

        today = timezone.now().date()

        for staff_info in staff_data:
            # Create or get user
            user, user_created = User.objects.get_or_create(
                email=staff_info['email'],
                defaults={
                    'first_name': staff_info['first_name'],
                    'last_name': staff_info['last_name'],
                    'is_active': True,
                    'is_staff': False
                }
            )

            if user_created:
                user.set_password(staff_info['password'])
                user.save()
                self.stdout.write(self.style.SUCCESS(f'✓ Created user: {user.email}'))

            # Set HOUSEKEEPING role (role is now directly on User model)
            if user.role != 'HOUSEKEEPING':
                user.role = 'HOUSEKEEPING'
                user.phone = f'+62812{user.id:07d}'
                user.save()
                self.stdout.write(self.style.SUCCESS(f'✓ Set {user.full_name} as HOUSEKEEPING'))

            # Create or get employee
            employee, emp_created = Employee.objects.get_or_create(
                user=user,
                defaults={
                    'department': housekeeping_dept,
                    'position': staff_info['position'],
                    'employment_status': 'ACTIVE',
                    'is_active': True,
                    'hire_date': today
                }
            )

            if emp_created:
                self.stdout.write(self.style.SUCCESS(f'✓ Created employee: {employee.employee_id}'))

            # Create shift for today
            shift, shift_created = Shift.objects.get_or_create(
                employee=employee,
                shift_date=today,
                start_time=staff_info['start_time'],
                defaults={
                    'end_time': staff_info['end_time'],
                    'shift_type': staff_info['shift_type'],
                    'break_duration': 60
                }
            )

            if shift_created:
                self.stdout.write(self.style.SUCCESS(
                    f'✓ Created shift for {employee.full_name}: '
                    f'{staff_info["start_time"]} - {staff_info["end_time"]}'
                ))

                # Auto clock-in for morning shift staff
                if staff_info['shift_type'] == 'MORNING':
                    # Create timezone-aware datetime for clock_in
                    clock_in_time = timezone.make_aware(
                        timezone.datetime.combine(
                            today,
                            staff_info['start_time']
                        )
                    )

                    attendance, att_created = Attendance.objects.get_or_create(
                        shift=shift,
                        defaults={
                            'clock_in': clock_in_time,
                            'status': 'PRESENT'
                        }
                    )
                    if att_created:
                        self.stdout.write(self.style.SUCCESS(
                            f'  ↳ Clocked in at {attendance.clock_in.strftime("%H:%M")}'
                        ))

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('Successfully seeded housekeeping staff!'))
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('Test Login Credentials:'))
        for staff_info in staff_data:
            self.stdout.write(f'  • {staff_info["email"]} / {staff_info["password"]}')
        self.stdout.write('')
