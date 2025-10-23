from django.core.management.base import BaseCommand
from apps.user.models import User
from apps.restaurant.models import Staff, Branch


class Command(BaseCommand):
    help = 'Create test users for authentication with staff relationships'

    def handle(self, *args, **options):
        self.stdout.write('Creating test users for authentication...')

        # Get or create default branch
        branch = Branch.objects.first()
        if not branch:
            self.stdout.write(self.style.ERROR('No branch found. Please run seed_resto_data first.'))
            return

        # Create admin user
        admin_user, admin_created = User.objects.get_or_create(
            email='admin@ladapala.com',
            defaults={
                'first_name': 'Admin',
                'last_name': 'Ladapala',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        # Create staff relationship for admin
        admin_staff, _ = Staff.objects.get_or_create(
            user=admin_user,
            defaults={
                'branch': branch,
                'role': 'ADMIN',
                'phone': '081234567890',
                'is_active': True,
            }
        )

        if admin_created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created admin user: {admin_user.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠ Admin user already exists: {admin_user.email}'))

        # Create cashier user
        kasir_user, kasir_created = User.objects.get_or_create(
            email='kasir@ladapala.com',
            defaults={
                'first_name': 'Kasir',
                'last_name': 'Satu',
                'is_staff': False,
                'is_superuser': False,
                'is_active': True,
            }
        )
        kasir_user.set_password('kasir123')
        kasir_user.save()

        # Create staff relationship for cashier
        kasir_staff, _ = Staff.objects.get_or_create(
            user=kasir_user,
            defaults={
                'branch': branch,
                'role': 'CASHIER',
                'phone': '081234567891',
                'is_active': True,
            }
        )

        if kasir_created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created cashier user: {kasir_user.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠ Cashier user already exists: {kasir_user.email}'))

        # Create manager user
        manager_user, manager_created = User.objects.get_or_create(
            email='manager@ladapala.com',
            defaults={
                'first_name': 'Manager',
                'last_name': 'Restoran',
                'is_staff': True,
                'is_superuser': False,
                'is_active': True,
            }
        )
        manager_user.set_password('manager123')
        manager_user.save()

        # Create staff relationship for manager
        manager_staff, _ = Staff.objects.get_or_create(
            user=manager_user,
            defaults={
                'branch': branch,
                'role': 'MANAGER',
                'phone': '081234567892',
                'is_active': True,
            }
        )

        if manager_created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created manager user: {manager_user.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠ Manager user already exists: {manager_user.email}'))

        self.stdout.write(self.style.SUCCESS('\n✅ Authentication users setup complete!'))
        self.stdout.write('\nTest credentials:')
        self.stdout.write('  Admin:   admin@ladapala.com   / admin123')
        self.stdout.write('  Kasir:   kasir@ladapala.com   / kasir123')
        self.stdout.write('  Manager: manager@ladapala.com / manager123')
