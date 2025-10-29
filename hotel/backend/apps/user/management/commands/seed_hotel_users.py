from django.core.management.base import BaseCommand
from apps.user.models import User, Department, Employee
from datetime import date


class Command(BaseCommand):
    help = 'Create test users for hotel system'

    def handle(self, *args, **options):
        self.stdout.write('Creating test users for hotel system...')

        # Create departments first
        departments_data = [
            {'name': 'Front Office', 'description': 'Guest services and reception'},
            {'name': 'Housekeeping', 'description': 'Room cleaning and maintenance'},
            {'name': 'Food & Beverage', 'description': 'Restaurant and bar services'},
            {'name': 'Maintenance', 'description': 'Technical and facility maintenance'},
            {'name': 'Management', 'description': 'Hotel management and administration'},
        ]

        departments = {}
        for dept_data in departments_data:
            dept, created = Department.objects.get_or_create(
                name=dept_data['name'],
                defaults={'description': dept_data['description']}
            )
            departments[dept.name] = dept
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created department: {dept.name}'))

        # Create admin user
        admin_user, admin_created = User.objects.get_or_create(
            email='admin@hotel.ladapala.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'Hotel',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()
        # Create employee record for admin
        admin_employee, _ = Employee.objects.get_or_create(
            user=admin_user,
            defaults={
                'department': departments['Management'],
                'position': 'System Administrator',
                'hire_date': date(2024, 1, 1),
                'phone': '081234567890',
                'is_active': True,
            }
        )

        if admin_created:
            self.stdout.write(self.style.SUCCESS(f'Created admin user: {admin_user.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin user already exists: {admin_user.email}'))

        # Create manager user
        manager_user, manager_created = User.objects.get_or_create(
            email='manager@hotel.ladapala.com',
            defaults={
                'first_name': 'Maria',
                'last_name': 'Manager',
                'is_staff': True,
                'is_superuser': False,
                'is_active': True,
            }
        )
        manager_user.set_password('manager123')
        manager_user.save()
        # Create employee record for manager
        manager_employee, _ = Employee.objects.get_or_create(
            user=manager_user,
            defaults={
                'department': departments['Management'],
                'position': 'Hotel Manager',
                'hire_date': date(2024, 1, 1),
                'phone': '081234567891',
                'is_active': True,
            }
        )

        if manager_created:
            self.stdout.write(self.style.SUCCESS(f'Created manager user: {manager_user.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Manager user already exists: {manager_user.email}'))

        # Create receptionist user
        receptionist_user, receptionist_created = User.objects.get_or_create(
            email='receptionist@hotel.ladapala.com',
            defaults={
                'first_name': 'Rina',
                'last_name': 'Receptionist',
                'is_staff': False,
                'is_superuser': False,
                'is_active': True,
            }
        )
        receptionist_user.set_password('reception123')
        receptionist_user.save()
        # Create employee record for receptionist
        receptionist_employee, _ = Employee.objects.get_or_create(
            user=receptionist_user,
            defaults={
                'department': departments['Front Office'],
                'position': 'Receptionist',
                'hire_date': date(2024, 2, 1),
                'phone': '081234567892',
                'is_active': True,
            }
        )

        if receptionist_created:
            self.stdout.write(self.style.SUCCESS(f'Created receptionist user: {receptionist_user.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'Receptionist user already exists: {receptionist_user.email}'))

        self.stdout.write(self.style.SUCCESS('\nHotel system users setup complete!'))
        self.stdout.write('\nTest credentials:')
        self.stdout.write('  Admin:        admin@hotel.ladapala.com        / admin123')
        self.stdout.write('  Manager:      manager@hotel.ladapala.com      / manager123')
        self.stdout.write('  Receptionist: receptionist@hotel.ladapala.com / reception123')
