from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta, date
from decimal import Decimal
import random
from apps.restaurant.models import (
    Branch, Staff, StaffRole,
    Inventory, PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with Purchase Order sample data based on existing inventory'

    def handle(self, *args, **options):
        self.stdout.write('Starting to seed Purchase Order data...')

        # Get branch and staff
        try:
            branch = Branch.objects.get(id=4)  # Hardcoded branch ID as per CLAUDE.md
        except Branch.DoesNotExist:
            self.stdout.write(self.style.ERROR('Branch ID 4 not found. Run seed_resto_data first.'))
            return

        # Get warehouse staff and manager
        warehouse_staff = Staff.objects.filter(role=StaffRole.WAREHOUSE).first()
        manager_staff = Staff.objects.filter(role=StaffRole.MANAGER).first()

        if not warehouse_staff or not manager_staff:
            self.stdout.write(self.style.ERROR('Warehouse or Manager staff not found. Run seed_resto_data first.'))
            return

        # Get warehouse inventory items
        warehouse_items = list(Inventory.objects.filter(branch=branch, location='WAREHOUSE'))

        if not warehouse_items:
            self.stdout.write(self.style.ERROR('No warehouse inventory items found. Run seed_resto_data first.'))
            return

        # Clear existing purchase orders
        self.stdout.write('Clearing existing purchase orders...')
        PurchaseOrderItem.objects.all().delete()
        PurchaseOrder.objects.all().delete()

        # Indonesian supplier names
        suppliers = [
            {
                'name': 'PT Sumber Pangan Nusantara',
                'contact': 'Bapak Hendra Wijaya',
                'email': 'hendra@sumberpangan.co.id',
                'phone': '+6221-5551234'
            },
            {
                'name': 'CV Mitra Boga Jaya',
                'contact': 'Ibu Ratna Sari',
                'email': 'ratna@mitraboga.co.id',
                'phone': '+6221-5555678'
            },
            {
                'name': 'UD Berkah Tani',
                'contact': 'Bapak Ahmad Yani',
                'email': 'ahmad@berkahtani.co.id',
                'phone': '+6221-5559876'
            },
            {
                'name': 'PT Indo Fresh Food',
                'contact': 'Bapak Santoso',
                'email': 'santoso@indofresh.co.id',
                'phone': '+6221-5553456'
            },
            {
                'name': 'CV Tani Makmur',
                'contact': 'Ibu Siti Aminah',
                'email': 'siti@tanimakmur.co.id',
                'phone': '+6221-5557890'
            },
        ]

        # Reference prices for common items (in IDR)
        price_ranges = {
            'kg': (15000, 150000),      # Rice, meat, vegetables
            'liter': (20000, 80000),    # Cooking oil, milk
            'gram': (100, 500),         # Spices
            'pcs': (500, 15000),        # Individual items
            'pack': (5000, 50000),      # Packaged items
        }

        po_count = 0

        # Create 10 Purchase Orders with different statuses
        statuses_to_create = [
            ('DRAFT', 3),
            ('SUBMITTED', 2),
            ('APPROVED', 2),
            ('RECEIVED', 2),
            ('CANCELLED', 1),
        ]

        for status, count in statuses_to_create:
            for i in range(count):
                # Select random supplier
                supplier = random.choice(suppliers)

                # Create date ranges
                days_ago = random.randint(1, 30)
                order_date = date.today() - timedelta(days=days_ago)
                expected_delivery = order_date + timedelta(days=random.randint(3, 14))

                # Create purchase order
                po = PurchaseOrder.objects.create(
                    branch=branch,
                    supplier_name=supplier['name'],
                    supplier_contact=supplier['contact'],
                    supplier_email=supplier['email'],
                    supplier_phone=supplier['phone'],
                    status=status,
                    order_date=order_date,
                    expected_delivery_date=expected_delivery,
                    created_by=warehouse_staff,
                    notes=f'Order {status.lower()} - {supplier["name"]}',
                    terms_and_conditions='Pembayaran: Net 30 hari. Retur: 7 hari setelah penerimaan. Pengiriman gratis untuk pembelian di atas Rp 5.000.000.'
                )

                # Set approved_by for approved/received orders
                if status in ['APPROVED', 'RECEIVED']:
                    po.approved_by = manager_staff
                    po.save()

                # Set received_by and actual_delivery_date for received orders
                if status == 'RECEIVED':
                    po.received_by = warehouse_staff
                    po.actual_delivery_date = expected_delivery + timedelta(days=random.randint(-2, 2))
                    po.save()

                # Add 3-8 random items to each PO
                num_items = random.randint(3, 8)
                selected_items = random.sample(warehouse_items, min(num_items, len(warehouse_items)))

                for inv_item in selected_items:
                    # Determine quantity based on unit
                    if inv_item.unit == 'kg':
                        quantity = Decimal(random.randint(10, 100))
                    elif inv_item.unit == 'liter':
                        quantity = Decimal(random.randint(10, 50))
                    elif inv_item.unit == 'gram':
                        quantity = Decimal(random.randint(500, 5000))
                    elif inv_item.unit == 'pcs':
                        quantity = Decimal(random.randint(20, 200))
                    else:  # pack or other
                        quantity = Decimal(random.randint(10, 100))

                    # Get price range for unit
                    price_min, price_max = price_ranges.get(inv_item.unit, (1000, 50000))
                    unit_price = Decimal(random.randint(price_min, price_max))

                    # Create PO item
                    PurchaseOrderItem.objects.create(
                        purchase_order=po,
                        inventory_item=inv_item,
                        quantity=quantity,
                        unit_price=unit_price,
                        notes=f'Quality: Premium' if random.random() > 0.7 else ''
                    )

                po_count += 1
                total_amount = po.total_amount
                self.stdout.write(
                    f'Created PO: {po.po_number} - {status} - '
                    f'{po.total_items} items - Rp {total_amount:,.0f} - {supplier["name"]}'
                )

        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created {po_count} purchase orders!'))

        # Print summary
        self.stdout.write('\n=== Purchase Order Summary ===')
        for status in ['DRAFT', 'SUBMITTED', 'APPROVED', 'RECEIVED', 'CANCELLED']:
            count = PurchaseOrder.objects.filter(status=status).count()
            total = sum(po.total_amount for po in PurchaseOrder.objects.filter(status=status))
            self.stdout.write(f'{status}: {count} POs - Total: Rp {total:,.0f}')

        total_pos = PurchaseOrder.objects.count()
        grand_total = sum(po.total_amount for po in PurchaseOrder.objects.all())
        self.stdout.write(self.style.SUCCESS(f'\nGrand Total: {total_pos} POs - Rp {grand_total:,.0f}'))
