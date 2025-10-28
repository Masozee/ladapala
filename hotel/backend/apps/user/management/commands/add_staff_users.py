from django.core.management.base import BaseCommand
from apps.user.models import User, UserProfile, Department, Employee
from datetime import date


class Command(BaseCommand):
    help = 'Add staff users for all roles (Housekeeping, Maintenance, Supervisor, etc.)'

    def handle(self, *args, **options):
        self.stdout.write('Adding staff users for all roles...')

        # Get or create departments
        departments = {}
        departments_data = [
            {'name': 'Front Office', 'description': 'Guest services and reception'},
            {'name': 'Housekeeping', 'description': 'Room cleaning and maintenance'},
            {'name': 'Food & Beverage', 'description': 'Restaurant and bar services'},
            {'name': 'Maintenance', 'description': 'Technical and facility maintenance'},
            {'name': 'Management', 'description': 'Hotel management and administration'},
        ]

        for dept_data in departments_data:
            dept, created = Department.objects.get_or_create(
                name=dept_data['name'],
                defaults={'description': dept_data['description']}
            )
            departments[dept.name] = dept
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created department: {dept.name}'))

        # Define users to create
        users_data = [
            # Supervisors
            {
                'email': 'supervisor.frontdesk@hotel.ladapala.com',
                'password': 'super123',
                'first_name': 'Budi',
                'last_name': 'Santoso',
                'role': 'SUPERVISOR',
                'department': 'Front Office',
                'position': 'Front Office Supervisor',
                'phone': '081234567820',
                'salary': 7000000,
                'is_staff': True,  # Can access admin panel
            },
            {
                'email': 'supervisor.housekeeping@hotel.ladapala.com',
                'password': 'super123',
                'first_name': 'Ani',
                'last_name': 'Wijaya',
                'role': 'SUPERVISOR',
                'department': 'Housekeeping',
                'position': 'Housekeeping Supervisor',
                'phone': '081234567821',
                'salary': 6500000,
                'is_staff': True,
            },

            # Housekeeping Staff
            {
                'email': 'housekeeper1@hotel.ladapala.com',
                'password': 'house123',
                'first_name': 'Siti',
                'last_name': 'Aminah',
                'role': 'HOUSEKEEPING',
                'department': 'Housekeeping',
                'position': 'Room Attendant',
                'phone': '081234567830',
                'salary': 4500000,
            },
            {
                'email': 'housekeeper2@hotel.ladapala.com',
                'password': 'house123',
                'first_name': 'Dewi',
                'last_name': 'Lestari',
                'role': 'HOUSEKEEPING',
                'department': 'Housekeeping',
                'position': 'Room Attendant',
                'phone': '081234567831',
                'salary': 4500000,
            },
            {
                'email': 'housekeeper3@hotel.ladapala.com',
                'password': 'house123',
                'first_name': 'Ratna',
                'last_name': 'Sari',
                'role': 'HOUSEKEEPING',
                'department': 'Housekeeping',
                'position': 'Room Attendant',
                'phone': '081234567832',
                'salary': 4500000,
            },

            # Maintenance Staff
            {
                'email': 'maintenance1@hotel.ladapala.com',
                'password': 'maint123',
                'first_name': 'Agus',
                'last_name': 'Pratama',
                'role': 'MAINTENANCE',
                'department': 'Maintenance',
                'position': 'Maintenance Technician',
                'phone': '081234567840',
                'salary': 5500000,
            },
            {
                'email': 'maintenance2@hotel.ladapala.com',
                'password': 'maint123',
                'first_name': 'Bambang',
                'last_name': 'Susilo',
                'role': 'MAINTENANCE',
                'department': 'Maintenance',
                'position': 'Electrician',
                'phone': '081234567841',
                'salary': 5800000,
            },
            {
                'email': 'maintenance3@hotel.ladapala.com',
                'password': 'maint123',
                'first_name': 'Hendra',
                'last_name': 'Gunawan',
                'role': 'MAINTENANCE',
                'department': 'Maintenance',
                'position': 'Plumber',
                'phone': '081234567842',
                'salary': 5800000,
            },

            # Additional Receptionists
            {
                'email': 'receptionist2@hotel.ladapala.com',
                'password': 'recept123',
                'first_name': 'Lina',
                'last_name': 'Marlina',
                'role': 'RECEPTIONIST',
                'department': 'Front Office',
                'position': 'Front Desk Agent',
                'phone': '081234567850',
                'salary': 5000000,
            },
            {
                'email': 'receptionist3@hotel.ladapala.com',
                'password': 'recept123',
                'first_name': 'Putri',
                'last_name': 'Ayu',
                'role': 'RECEPTIONIST',
                'department': 'Front Office',
                'position': 'Front Desk Agent',
                'phone': '081234567851',
                'salary': 5000000,
            },

            # Food & Beverage Staff
            {
                'email': 'chef@hotel.ladapala.com',
                'password': 'chef123',
                'first_name': 'Andi',
                'last_name': 'Kusuma',
                'role': 'STAFF',
                'department': 'Food & Beverage',
                'position': 'Head Chef',
                'phone': '081234567860',
                'salary': 8000000,
            },
            {
                'email': 'waiter1@hotel.ladapala.com',
                'password': 'wait123',
                'first_name': 'Doni',
                'last_name': 'Irawan',
                'role': 'STAFF',
                'department': 'Food & Beverage',
                'position': 'Waiter',
                'phone': '081234567861',
                'salary': 4000000,
            },
        ]

        created_count = 0
        existing_count = 0

        for user_data in users_data:
            # Check if user exists
            if User.objects.filter(email=user_data['email']).exists():
                self.stdout.write(self.style.WARNING(f'User already exists: {user_data["email"]}'))
                existing_count += 1
                continue

            try:
                # Create user
                user = User.objects.create_user(
                    email=user_data['email'],
                    password=user_data['password'],
                    first_name=user_data['first_name'],
                    last_name=user_data['last_name'],
                    is_active=True,
                )

                # Set staff status if specified
                if user_data.get('is_staff', False):
                    user.is_staff = True
                    user.save()

                # Create profile
                UserProfile.objects.create(
                    user=user,
                    role=user_data['role'],
                    phone=user_data['phone']
                )

                # Create employee record
                Employee.objects.create(
                    user=user,
                    department=departments[user_data['department']],
                    position=user_data['position'],
                    hire_date=date(2024, 3, 1),
                    phone=user_data['phone'],
                    salary=user_data.get('salary', 0),
                    is_active=True
                )

                self.stdout.write(self.style.SUCCESS(
                    f'✓ Created {user_data["role"]}: {user_data["email"]} - {user_data["first_name"]} {user_data["last_name"]}'
                ))
                created_count += 1

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error creating {user_data["email"]}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(f'\n=== Summary ==='))
        self.stdout.write(self.style.SUCCESS(f'Created: {created_count} users'))
        self.stdout.write(self.style.WARNING(f'Already existed: {existing_count} users'))

        self.stdout.write(self.style.SUCCESS('\n=== Test Credentials ==='))
        self.stdout.write('Role            | Email                                      | Password')
        self.stdout.write('----------------|--------------------------------------------|-----------')
        self.stdout.write('Supervisor      | supervisor.frontdesk@hotel.ladapala.com    | super123')
        self.stdout.write('Supervisor      | supervisor.housekeeping@hotel.ladapala.com | super123')
        self.stdout.write('Housekeeping    | housekeeper1@hotel.ladapala.com            | house123')
        self.stdout.write('Housekeeping    | housekeeper2@hotel.ladapala.com            | house123')
        self.stdout.write('Housekeeping    | housekeeper3@hotel.ladapala.com            | house123')
        self.stdout.write('Maintenance     | maintenance1@hotel.ladapala.com            | maint123')
        self.stdout.write('Maintenance     | maintenance2@hotel.ladapala.com            | maint123')
        self.stdout.write('Maintenance     | maintenance3@hotel.ladapala.com            | maint123')
        self.stdout.write('Receptionist    | receptionist2@hotel.ladapala.com           | recept123')
        self.stdout.write('Receptionist    | receptionist3@hotel.ladapala.com           | recept123')
        self.stdout.write('Chef            | chef@hotel.ladapala.com                    | chef123')
        self.stdout.write('Waiter          | waiter1@hotel.ladapala.com                 | wait123')
