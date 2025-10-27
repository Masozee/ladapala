from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed hotel staff users with different roles'

    def handle(self, *args, **kwargs):
        users_data = [
            {
                'email': 'admin@kapulaga.hotel',
                'first_name': 'Admin',
                'last_name': 'Kapulaga',
                'password': 'password123',
                'is_staff': True,
                'is_superuser': True,
            },
            {
                'email': 'manager@kapulaga.hotel',
                'first_name': 'Manager',
                'last_name': 'Hotel',
                'password': 'password123',
                'is_staff': True,
                'is_superuser': False,
            },
            {
                'email': 'frontdesk@kapulaga.hotel',
                'first_name': 'Front',
                'last_name': 'Desk',
                'password': 'password123',
                'is_staff': False,
                'is_superuser': False,
            },
            {
                'email': 'housekeeping@kapulaga.hotel',
                'first_name': 'Housekeeping',
                'last_name': 'Staff',
                'password': 'password123',
                'is_staff': False,
                'is_superuser': False,
            },
        ]

        created_count = 0
        existing_count = 0

        for user_data in users_data:
            email = user_data.pop('email')
            password = user_data.pop('password')

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

            self.stdout.write(
                self.style.SUCCESS(f'Created user: {email}')
            )
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSummary: {created_count} users created, {existing_count} already existed'
            )
        )
