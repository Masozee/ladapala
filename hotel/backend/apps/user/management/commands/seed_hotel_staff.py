from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.user.models import Employee, Department
from datetime import date

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed hotel staff users with different roles and employee records'

    def handle(self, *args, **kwargs):
        # Ensure departments exist
        management_dept, _ = Department.objects.get_or_create(
            name='Management',
            defaults={'description': 'Hotel management and administration'}
        )
        frontoffice_dept, _ = Department.objects.get_or_create(
            name='Front Office',
            defaults={'description': 'Guest services and reception'}
        )
        housekeeping_dept, _ = Department.objects.get_or_create(
            name='Housekeeping',
            defaults={'description': 'Room cleaning and maintenance'}
        )

        users_data = [
            {
                'email': 'admin@kapulaga.hotel',
                'first_name': 'Admin',
                'last_name': 'Kapulaga',
                'password': 'password123',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
                'department': management_dept,
                'position': 'System Administrator',
            },
            {
                'email': 'manager@kapulaga.hotel',
                'first_name': 'Manager',
                'last_name': 'Hotel',
                'password': 'password123',
                'role': 'MANAGER',
                'is_staff': True,
                'is_superuser': False,
                'department': management_dept,
                'position': 'Hotel Manager',
            },
            {
                'email': 'frontdesk@kapulaga.hotel',
                'first_name': 'Front',
                'last_name': 'Desk',
                'password': 'password123',
                'role': 'RECEPTIONIST',
                'is_staff': False,
                'is_superuser': False,
                'department': frontoffice_dept,
                'position': 'Receptionist',
            },
            {
                'email': 'housekeeping@kapulaga.hotel',
                'first_name': 'Housekeeping',
                'last_name': 'Staff',
                'password': 'password123',
                'role': 'HOUSEKEEPING',
                'is_staff': False,
                'is_superuser': False,
                'department': housekeeping_dept,
                'position': 'Housekeeping Staff',
            },
        ]

        created_count = 0
        existing_count = 0

        for user_data in users_data:
            email = user_data.pop('email')
            password = user_data.pop('password')
            department = user_data.pop('department')
            position = user_data.pop('position')

            # Check if user already exists
            if User.objects.filter(email=email).exists():
                self.stdout.write(
                    self.style.WARNING(f'User {email} already exists - skipping')
                )
                existing_count += 1
                continue

            # Create user
            user = User.objects.create_user(
                email=email,
                password=password,
                **user_data
            )

            # Create employee record
            Employee.objects.create(
                user=user,
                department=department,
                position=position,
                hire_date=date(2024, 1, 1),
                is_active=True,
            )

            self.stdout.write(
                self.style.SUCCESS(f'Created user and employee: {email}')
            )
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary: {created_count} users created, {existing_count} already existed'
            )
        )
