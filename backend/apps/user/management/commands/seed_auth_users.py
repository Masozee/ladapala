from django.core.management.base import BaseCommand
from apps.user.models import User


class Command(BaseCommand):
    help = 'Create test users for authentication'

    def handle(self, *args, **options):
        self.stdout.write('Creating test users for authentication...')

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

        if manager_created:
            self.stdout.write(self.style.SUCCESS(f'✓ Created manager user: {manager_user.email}'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠ Manager user already exists: {manager_user.email}'))

        self.stdout.write(self.style.SUCCESS('\n✅ Authentication users setup complete!'))
        self.stdout.write('\nTest credentials:')
        self.stdout.write('  Admin:   admin@ladapala.com   / admin123')
        self.stdout.write('  Kasir:   kasir@ladapala.com   / kasir123')
        self.stdout.write('  Manager: manager@ladapala.com / manager123')
