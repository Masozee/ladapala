from django.core.management.base import BaseCommand
from apps.restaurant.models import (
    Vendor, PurchaseOrder, PurchaseOrderItem, Branch, Staff,
    Inventory, InventoryTransaction
)
from decimal import Decimal
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = 'Seed vendor data with complete POs, items, and inventory transactions'

    def handle(self, *args, **kwargs):
        # Get branch (get the first available branch)
        branch = Branch.objects.first()
        if not branch:
            self.stdout.write(self.style.ERROR('No branch found. Please run seed_resto_data first.'))
            return

        self.stdout.write(f'Using branch: {branch.name} (ID: {branch.id})')

        # Get admin staff for created_by
        admin_staff = Staff.objects.filter(role='ADMIN').first()
        if not admin_staff:
            self.stdout.write(self.style.ERROR('No admin staff found. Please create staff first.'))
            return

        # Get inventory items
        try:
            inv_beras = Inventory.objects.get(branch=branch, name='Beras Premium')
            inv_daging = Inventory.objects.get(branch=branch, name='Daging Sapi')
            inv_ayam = Inventory.objects.get(branch=branch, name='Ayam Kampung')
            inv_minyak = Inventory.objects.get(branch=branch, name='Minyak Goreng')
            inv_cabai = Inventory.objects.get(branch=branch, name='Cabai Merah')
            inv_bawang = Inventory.objects.get(branch=branch, name='Bawang Merah')
            inv_santan = Inventory.objects.get(branch=branch, name='Santan Kelapa')
            inv_gula = Inventory.objects.get(branch=branch, name='Gula Merah')
            inv_durian = Inventory.objects.get(branch=branch, name='Durian')
            inv_alpukat = Inventory.objects.get(branch=branch, name='Alpukat')
        except Inventory.DoesNotExist:
            self.stdout.write(self.style.ERROR('Inventory items not found. Please run seed_resto_data first.'))
            return

        # Clear existing vendor data
        self.stdout.write('Clearing existing vendor data...')
        InventoryTransaction.objects.filter(inventory__branch=branch, transaction_type='IN').delete()
        PurchaseOrderItem.objects.filter(purchase_order__branch=branch).delete()
        PurchaseOrder.objects.filter(branch=branch).delete()
        Vendor.objects.filter(branch=branch).delete()

        # Vendor data with item mappings
        vendors_data = [
            {
                'name': 'PT Sumber Rejeki Makmur',
                'contact': 'Budi Santoso',
                'email': 'budi@sumberrejeki.co.id',
                'phone': '021-5551234',
                'address': 'Jl. Raya Pasar Minggu No. 123, Jakarta Selatan 12510',
                'payment_terms_days': 30,
                'tax_id': '01.234.567.8-901.000',
                'items': [
                    (inv_daging, 'kg', [(20, 125000), (25, 122000), (30, 120000)]),
                    (inv_ayam, 'ekor', [(15, 47000), (20, 46000), (18, 45000)]),
                ]
            },
            {
                'name': 'CV Mitra Sayur Segar',
                'contact': 'Siti Rahayu',
                'email': 'siti@mitrasayur.co.id',
                'phone': '021-5555678',
                'address': 'Jl. Raya Bogor KM 45, Cibinong, Bogor 16916',
                'payment_terms_days': 14,
                'tax_id': '02.345.678.9-012.000',
                'items': [
                    (inv_cabai, 'kg', [(10, 42000), (12, 40000), (15, 39000)]),
                    (inv_bawang, 'kg', [(15, 36000), (18, 35000), (20, 34000)]),
                    (inv_durian, 'kg', [(8, 52000), (10, 50000)]),
                    (inv_alpukat, 'kg', [(12, 26000), (15, 25000)]),
                ]
            },
            {
                'name': 'UD Bumbu Nusantara',
                'contact': 'Ahmad Hidayat',
                'email': 'ahmad@bumbunusantara.co.id',
                'phone': '021-5559876',
                'address': 'Jl. Tanah Abang III No. 56, Jakarta Pusat 10160',
                'payment_terms_days': 21,
                'tax_id': '03.456.789.0-123.000',
                'items': [
                    (inv_santan, 'liter', [(20, 8500), (25, 8000), (30, 7800)]),
                    (inv_gula, 'kg', [(15, 19000), (18, 18000), (20, 17500)]),
                ]
            },
            {
                'name': 'Toko Sembako Berkah',
                'contact': 'Joko Widodo',
                'email': 'joko@sembakoberkah.com',
                'phone': '021-5557890',
                'address': 'Pasar Tanah Abang Blok C No. 12-14, Jakarta Pusat 10250',
                'payment_terms_days': 7,
                'tax_id': '05.678.901.2-345.000',
                'items': [
                    (inv_beras, 'kg', [(100, 12500), (120, 12000), (150, 11800)]),
                    (inv_minyak, 'liter', [(40, 14500), (50, 14000), (60, 13800)]),
                ]
            },
        ]

        vendor_count = 0
        po_count = 0
        transaction_count = 0

        for vendor_data in vendors_data:
            # Create Vendor model
            vendor = Vendor.objects.create(
                branch=branch,
                name=vendor_data['name'],
                contact_person=vendor_data['contact'],
                email=vendor_data['email'],
                phone=vendor_data['phone'],
                address=vendor_data['address'],
                payment_terms_days=vendor_data['payment_terms_days'],
                tax_id=vendor_data['tax_id'],
                is_active=True,
                notes=f'Vendor untuk {", ".join([item[0].name for item in vendor_data["items"]])}'
            )
            vendor_count += 1
            self.stdout.write(self.style.SUCCESS(f'✓ Created Vendor: {vendor.name}'))

            # Create POs for this vendor
            num_pos = random.randint(3, 6)

            for po_index in range(num_pos):
                # Random date in the last 90 days
                days_ago = random.randint(1, 90)
                order_date = date.today() - timedelta(days=days_ago)

                # Random expected delivery (3-7 days after order)
                delivery_days = random.randint(3, 7)
                expected_delivery = order_date + timedelta(days=delivery_days)

                # Determine status based on age
                if days_ago < 7:
                    status = random.choice(['DRAFT', 'PENDING', 'APPROVED'])
                    actual_delivery = None
                elif days_ago < 30:
                    status = random.choice(['APPROVED', 'RECEIVED'])
                    actual_delivery = expected_delivery if status == 'RECEIVED' else None
                else:
                    status = 'RECEIVED'
                    actual_delivery = expected_delivery

                # Create PO
                po = PurchaseOrder.objects.create(
                    branch=branch,
                    supplier_name=vendor_data['name'],
                    supplier_contact=vendor_data['contact'],
                    supplier_email=vendor_data['email'],
                    supplier_phone=vendor_data['phone'],
                    supplier_address=vendor_data['address'],
                    payment_terms_days=vendor_data['payment_terms_days'],
                    tax_id=vendor_data['tax_id'],
                    status=status,
                    order_date=order_date,
                    expected_delivery_date=expected_delivery,
                    actual_delivery_date=actual_delivery,
                    created_by=admin_staff,
                    approved_by=admin_staff if status in ['APPROVED', 'RECEIVED'] else None,
                    received_by=admin_staff if status == 'RECEIVED' else None,
                    notes=f'Purchase order #{po_index + 1} from {vendor_data["name"]}',
                    terms_and_conditions=f'Net {vendor_data["payment_terms_days"]} days payment terms',
                )
                po_count += 1

                # Add items to PO (randomly select 1-3 items for this PO)
                selected_items = random.sample(vendor_data['items'], min(len(vendor_data['items']), random.randint(1, 3)))

                for inv_item, unit, price_variations in selected_items:
                    # Get price for this PO (use index if available, else random)
                    if po_index < len(price_variations):
                        qty, price = price_variations[po_index]
                    else:
                        qty, price = random.choice(price_variations)

                    # Create PO Item
                    po_item = PurchaseOrderItem.objects.create(
                        purchase_order=po,
                        inventory_item=inv_item,
                        quantity=Decimal(str(qty)),
                        unit_price=Decimal(str(price)),
                        notes=f'{inv_item.name} - {unit}'
                    )

                # If PO is RECEIVED, create inventory transactions
                if status == 'RECEIVED':
                    for item in po.items.all():
                        # Create IN transaction
                        transaction = InventoryTransaction.objects.create(
                            inventory=item.inventory_item,
                            transaction_type='IN',
                            quantity=item.quantity,
                            unit_cost=item.unit_price,
                            reference_number=po.po_number,
                            notes=f'Received from {vendor.name} - PO {po.po_number}'
                        )
                        transaction_count += 1

                        # Update inventory quantity and moving average cost
                        # (Django signals will handle moving average calculation)
                        inv = item.inventory_item
                        inv.quantity += item.quantity

                        # Calculate moving average manually for verification
                        old_value = inv.cost_per_unit * (inv.quantity - item.quantity)
                        new_value = item.unit_price * item.quantity
                        total_qty = inv.quantity

                        if total_qty > 0:
                            inv.cost_per_unit = (old_value + new_value) / total_qty

                        inv.save()

                self.stdout.write(
                    f'  → PO {po.po_number} ({status}) - {order_date} - {len(po.items.all())} items'
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Successfully created:\n'
                f'   - {vendor_count} vendors\n'
                f'   - {po_count} purchase orders\n'
                f'   - {transaction_count} inventory transactions'
            )
        )

        # Show inventory summary
        self.stdout.write(self.style.SUCCESS('\n📦 Inventory Summary:'))
        for inv in Inventory.objects.filter(branch=branch, location='WAREHOUSE').order_by('name'):
            self.stdout.write(
                f'   {inv.name}: {inv.quantity} {inv.unit} @ Rp {inv.cost_per_unit:,.0f}/{inv.unit}'
            )
