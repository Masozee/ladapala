"""
Management command to seed Warehouse Audit Trail data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.hotel.models import (
    WarehouseAuditLog,
    InventoryItem,
    PurchaseOrder,
    StockOpname,
    StockMovement,
    Supplier
)
from datetime import timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed Warehouse Audit Trail with realistic activity logs'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n=== Starting Warehouse Audit Trail Seeding ===\n'))

        # Get or create warehouse users
        warehouse_user, _ = User.objects.get_or_create(
            email='warehouse@kapulaga.net',
            defaults={
                'first_name': 'Warehouse',
                'last_name': 'Admin',
                'is_staff': True,
                'role': 'STAFF',
            }
        )

        manager_user, _ = User.objects.get_or_create(
            email='manager.warehouse@kapulaga.net',
            defaults={
                'first_name': 'Budi',
                'last_name': 'Santoso',
                'is_staff': True,
                'role': 'MANAGER',
            }
        )

        staff_user, _ = User.objects.get_or_create(
            email='staff.warehouse@kapulaga.net',
            defaults={
                'first_name': 'Siti',
                'last_name': 'Rahayu',
                'is_staff': True,
                'role': 'STAFF',
            }
        )

        users = [warehouse_user, manager_user, staff_user]

        # Get existing data
        inventory_items = list(InventoryItem.objects.all()[:20])
        purchase_orders = list(PurchaseOrder.objects.all()[:10])
        stock_opnames = list(StockOpname.objects.all()[:5])
        suppliers = list(Supplier.objects.all()[:5])

        if not inventory_items:
            self.stdout.write(self.style.ERROR('No inventory items found. Please run seed_warehouse_data first.'))
            return

        created_count = 0
        base_time = timezone.now() - timedelta(days=60)

        # 1. CREATE actions for inventory items (60 days ago)
        for i, item in enumerate(inventory_items[:10]):
            timestamp = base_time + timedelta(hours=i)
            WarehouseAuditLog.objects.create(
                action_type='CREATE',
                model_name='InventoryItem',
                object_id=item.id,
                object_repr=str(item),
                user=random.choice(users),
                changes={
                    'name': {'old': None, 'new': item.name},
                    'unit_price': {'old': None, 'new': str(item.unit_price)},
                    'current_stock': {'old': None, 'new': item.current_stock},
                },
                notes='Item baru ditambahkan ke inventory',
                timestamp=timestamp,
                ip_address='192.168.1.100'
            )
            created_count += 1

        # 2. UPDATE actions for inventory items (various times)
        for i, item in enumerate(inventory_items[:8]):
            days_ago = random.randint(30, 55)
            timestamp = timezone.now() - timedelta(days=days_ago, hours=random.randint(1, 23))

            old_price = float(item.unit_price) * 0.9
            old_stock = item.current_stock - random.randint(5, 20)

            WarehouseAuditLog.objects.create(
                action_type='UPDATE',
                model_name='InventoryItem',
                object_id=item.id,
                object_repr=str(item),
                user=random.choice(users),
                changes={
                    'unit_price': {'old': f'{old_price:.2f}', 'new': str(item.unit_price)},
                    'current_stock': {'old': old_stock, 'new': item.current_stock},
                },
                notes='Update harga dan stok',
                timestamp=timestamp,
                ip_address='192.168.1.101'
            )
            created_count += 1

        # 3. Purchase Order actions
        po_actions = [
            ('CREATE', 'Purchase order baru dibuat'),
            ('APPROVE', 'Purchase order disetujui oleh manager'),
            ('RECEIVE', 'Barang diterima dari supplier'),
            ('COMPLETE', 'Purchase order selesai diproses'),
        ]

        for po in purchase_orders[:5]:
            base_po_time = timezone.now() - timedelta(days=random.randint(15, 45))

            for idx, (action, note) in enumerate(po_actions):
                timestamp = base_po_time + timedelta(hours=idx * 2)

                changes = None
                if action == 'APPROVE':
                    changes = {'status': {'old': 'DRAFT', 'new': 'SUBMITTED'}}
                elif action == 'RECEIVE':
                    changes = {'status': {'old': 'SUBMITTED', 'new': 'RECEIVED'}}
                elif action == 'COMPLETE':
                    changes = {'status': {'old': 'RECEIVED', 'new': 'COMPLETED'}}

                WarehouseAuditLog.objects.create(
                    action_type=action,
                    model_name='PurchaseOrder',
                    object_id=po.id,
                    object_repr=po.po_number,
                    user=manager_user if action == 'APPROVE' else random.choice(users),
                    changes=changes,
                    notes=note,
                    timestamp=timestamp,
                    ip_address='192.168.1.102'
                )
                created_count += 1

        # 4. Stock Opname actions
        for opname in stock_opnames[:3]:
            base_opname_time = timezone.now() - timedelta(days=random.randint(5, 40))

            # Create opname
            WarehouseAuditLog.objects.create(
                action_type='CREATE',
                model_name='StockOpname',
                object_id=opname.id,
                object_repr=opname.opname_number,
                user=warehouse_user,
                notes=f'Stock opname baru dibuat untuk lokasi {opname.location}',
                timestamp=base_opname_time,
                ip_address='192.168.1.103'
            )
            created_count += 1

            # Count actions
            if opname.status in ['IN_PROGRESS', 'COMPLETED']:
                count_time = base_opname_time + timedelta(hours=2)
                WarehouseAuditLog.objects.create(
                    action_type='COUNT',
                    model_name='StockOpname',
                    object_id=opname.id,
                    object_repr=opname.opname_number,
                    user=staff_user,
                    changes={'status': {'old': 'DRAFT', 'new': 'IN_PROGRESS'}},
                    notes=f'Perhitungan fisik stok dimulai - {opname.total_items_counted} item dihitung',
                    timestamp=count_time,
                    ip_address='192.168.1.104'
                )
                created_count += 1

            # Complete actions
            if opname.status == 'COMPLETED':
                complete_time = base_opname_time + timedelta(hours=6)
                WarehouseAuditLog.objects.create(
                    action_type='COMPLETE',
                    model_name='StockOpname',
                    object_id=opname.id,
                    object_repr=opname.opname_number,
                    user=manager_user,
                    changes={'status': {'old': 'IN_PROGRESS', 'new': 'COMPLETED'}},
                    notes=f'Stock opname diselesaikan - {opname.total_discrepancies} selisih ditemukan',
                    timestamp=complete_time,
                    ip_address='192.168.1.105'
                )
                created_count += 1

        # 5. Stock Adjustment actions
        for i, item in enumerate(inventory_items[:6]):
            days_ago = random.randint(10, 30)
            timestamp = timezone.now() - timedelta(days=days_ago, hours=random.randint(1, 23))

            old_stock = item.current_stock + random.randint(-10, 10)
            adjustment = item.current_stock - old_stock
            reason = 'Penyesuaian stok berdasarkan stock opname' if adjustment < 0 else 'Penambahan stok dari retur'

            WarehouseAuditLog.objects.create(
                action_type='ADJUST',
                model_name='InventoryItem',
                object_id=item.id,
                object_repr=str(item),
                user=warehouse_user,
                changes={
                    'current_stock': {'old': old_stock, 'new': item.current_stock},
                    'adjustment': {'old': 0, 'new': adjustment}
                },
                notes=f'{reason}. Selisih: {adjustment:+d} unit',
                timestamp=timestamp,
                ip_address='192.168.1.106'
            )
            created_count += 1

        # 6. Supplier actions
        for supplier in suppliers:
            days_ago = random.randint(40, 55)
            timestamp = timezone.now() - timedelta(days=days_ago)

            WarehouseAuditLog.objects.create(
                action_type='CREATE',
                model_name='Supplier',
                object_id=supplier.id,
                object_repr=supplier.name,
                user=manager_user,
                changes={
                    'name': {'old': None, 'new': supplier.name},
                    'status': {'old': None, 'new': supplier.status},
                },
                notes=f'Supplier baru ditambahkan: {supplier.name}',
                timestamp=timestamp,
                ip_address='192.168.1.107'
            )
            created_count += 1

        # 7. Cancel/Delete actions (occasional)
        for i in range(3):
            item = random.choice(inventory_items)
            days_ago = random.randint(20, 45)
            timestamp = timezone.now() - timedelta(days=days_ago, hours=random.randint(1, 23))

            WarehouseAuditLog.objects.create(
                action_type='CANCEL',
                model_name='PurchaseOrder',
                object_id=9999 + i,  # Fictional PO
                object_repr=f'PO-2025-{9999+i:04d}',
                user=manager_user,
                changes={'status': {'old': 'DRAFT', 'new': 'CANCELLED'}},
                notes='Purchase order dibatalkan karena perubahan kebutuhan',
                timestamp=timestamp,
                ip_address='192.168.1.108'
            )
            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(f'\n=== Successfully created {created_count} audit log entries ===\n')
        )
        self.stdout.write(self.style.SUCCESS(f'Date range: {base_time.date()} to {timezone.now().date()}'))
