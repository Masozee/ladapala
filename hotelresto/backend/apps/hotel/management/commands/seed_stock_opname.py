"""
Management command to seed Stock Opname data based on real warehouse inventory
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.hotel.models import InventoryItem, StockOpname, StockOpnameItem
from decimal import Decimal
import random
from datetime import timedelta

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed Stock Opname data based on real warehouse inventory items'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== Starting Stock Opname Data Seeding ===\n'))

        # Get or create warehouse staff user
        warehouse_user, created = User.objects.get_or_create(
            email='warehouse@kapulaga.net',
            defaults={
                'first_name': 'Warehouse',
                'last_name': 'Admin',
                'is_staff': True,
                'role': 'STAFF',
            }
        )
        if created:
            warehouse_user.set_password('password123')
            warehouse_user.save()
            self.stdout.write(self.style.SUCCESS(f'Created warehouse user: {warehouse_user.email}'))

        # Get inventory items
        inventory_items = list(InventoryItem.objects.filter(is_active=True))
        if not inventory_items:
            self.stdout.write(self.style.ERROR('No inventory items found. Please run seed_warehouse_data first.'))
            return

        self.stdout.write(self.style.SUCCESS(f'Found {len(inventory_items)} inventory items'))

        # Create stock opname sessions
        stock_opnames_data = [
            {
                'date_offset': -60,  # 2 months ago
                'status': 'COMPLETED',
                'location': 'Main Warehouse',
                'notes': 'Monthly stock count - October 2025',
                'discrepancy_chance': 0.15,  # 15% chance of discrepancy
            },
            {
                'date_offset': -30,  # 1 month ago
                'status': 'COMPLETED',
                'location': 'Main Warehouse',
                'notes': 'Monthly stock count - November 2025',
                'discrepancy_chance': 0.10,  # 10% chance of discrepancy
            },
            {
                'date_offset': -7,  # 1 week ago
                'status': 'COMPLETED',
                'location': 'Kitchen Storage',
                'notes': 'Weekly food & beverage inventory check',
                'discrepancy_chance': 0.20,  # 20% chance (F&B more volatile)
            },
            {
                'date_offset': -3,  # 3 days ago
                'status': 'IN_PROGRESS',
                'location': 'Main Warehouse',
                'notes': 'Spot check on toiletries and amenities',
                'discrepancy_chance': 0.12,
            },
            {
                'date_offset': 0,  # Today
                'status': 'DRAFT',
                'location': 'Main Warehouse',
                'notes': 'Preparing for year-end inventory count',
                'discrepancy_chance': 0,  # Draft, no counts yet
            },
        ]

        created_count = 0
        for opname_data in stock_opnames_data:
            # Check if opname already exists for this date
            opname_date = timezone.now().date() + timedelta(days=opname_data['date_offset'])

            existing = StockOpname.objects.filter(
                opname_date=opname_date,
                location=opname_data['location']
            ).first()

            if existing:
                self.stdout.write(self.style.WARNING(f'Opname already exists: {existing.opname_number}'))
                continue

            # Create stock opname
            opname = StockOpname.objects.create(
                opname_date=opname_date,
                status=opname_data['status'],
                location=opname_data['location'],
                notes=opname_data['notes'],
                created_by=warehouse_user,
            )

            # Set timestamps based on status
            if opname_data['status'] in ['IN_PROGRESS', 'COMPLETED']:
                opname.started_at = timezone.now() - timedelta(days=opname_data['date_offset'], hours=8)

            if opname_data['status'] == 'COMPLETED':
                opname.completed_at = timezone.now() - timedelta(days=opname_data['date_offset'], hours=4)
                opname.completed_by = warehouse_user

            opname.save()

            # Filter items based on location
            if opname_data['location'] == 'Kitchen Storage':
                # Only food & beverage items (check category name)
                items_to_count = [
                    item for item in inventory_items
                    if item.category and (
                        'Food' in item.category.name or
                        'Beverage' in item.category.name or
                        'food' in item.category.name.lower()
                    )
                ]
            else:
                # All items
                items_to_count = inventory_items

            # Create stock opname items
            items_created = 0
            for item in items_to_count:
                system_stock = item.current_stock

                # Determine if there should be a discrepancy
                has_discrepancy = random.random() < opname_data['discrepancy_chance']

                # For DRAFT status, don't set counted_stock yet
                if opname_data['status'] == 'DRAFT':
                    counted_stock = None
                    reason = None
                    counted_by = None
                    counted_at = None
                else:
                    if has_discrepancy:
                        # Generate realistic discrepancy (-10 to +5 items)
                        discrepancy_amount = random.choice([-10, -8, -5, -3, -2, -1, 1, 2, 3, 5])
                        counted_stock = max(0, system_stock + discrepancy_amount)

                        # Generate realistic reasons
                        if discrepancy_amount < 0:
                            reasons = [
                                'Barang rusak/expired tidak tercatat',
                                'Kehilangan/penyusutan',
                                'Penggunaan tidak tercatat',
                                'Kerusakan saat penyimpanan',
                                'Selisih karena pengembalian barang rusak',
                            ]
                        else:
                            reasons = [
                                'Barang retur dari departemen',
                                'Selisih pencatatan penggunaan',
                                'Kesalahan input sistem',
                                'Barang found/ditemukan',
                            ]
                        reason = random.choice(reasons)
                    else:
                        # No discrepancy
                        counted_stock = system_stock
                        reason = None

                    counted_by = warehouse_user
                    counted_at = opname.started_at + timedelta(hours=random.randint(1, 4))

                StockOpnameItem.objects.create(
                    stock_opname=opname,
                    inventory_item=item,
                    system_stock=system_stock,
                    counted_stock=counted_stock,
                    reason=reason,
                    counted_by=counted_by,
                    counted_at=counted_at,
                )
                items_created += 1

            # Calculate summary
            opname.calculate_summary()

            created_count += 1
            self.stdout.write(
                self.style.SUCCESS(
                    f'Created: {opname.opname_number} ({opname.status}) - '
                    f'{items_created} items, {opname.total_discrepancies} discrepancies'
                )
            )

        self.stdout.write(
            self.style.SUCCESS(f'\n=== Successfully created {created_count} stock opname sessions ===\n')
        )
