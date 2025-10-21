"""
Add more diverse inventory items with purchase orders
SAFE: Only adds new data, never deletes or modifies existing data
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.restaurant.models import (
    Branch, Inventory, PurchaseOrder, PurchaseOrderItem,
    Vendor, Staff
)
from decimal import Decimal
from datetime import date, timedelta
import random

class Command(BaseCommand):
    help = 'Add more inventory items through purchase orders (SAFE - only adds new data)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('🔄 Adding additional stock data...'))
        self.stdout.write(self.style.WARNING('⚠️  SAFE MODE: Only adding new items, existing data preserved'))

        with transaction.atomic():
            # Get branch (try ID 4 first, fallback to first available)
            branch = Branch.objects.filter(id=4).first() or Branch.objects.first()
            if not branch:
                self.stdout.write(self.style.ERROR('❌ No branch found'))
                return

            self.stdout.write(f'   📍 Using branch: {branch.name} (ID: {branch.id})')

            # Get or create vendors
            vendors_data = [
                {
                    'name': 'PT Sayur Mayur Segar',
                    'contact_person': 'Pak Bambang',
                    'phone': '081234567801',
                    'email': 'bambang@sayurmayur.co.id',
                    'address': 'Jl. Pasar Induk No. 15, Jakarta',
                    'payment_terms_days': 14,
                    'tax_id': '01.234.567.8-901.000',
                },
                {
                    'name': 'CV Bumbu Rempah Nusantara',
                    'contact_person': 'Ibu Siti',
                    'phone': '081234567802',
                    'email': 'siti@bumbunusantara.com',
                    'address': 'Jl. Rempah No. 88, Surabaya',
                    'payment_terms_days': 30,
                    'tax_id': '02.345.678.9-012.000',
                },
                {
                    'name': 'UD Seafood Fresh',
                    'contact_person': 'Pak Hendra',
                    'phone': '081234567803',
                    'email': 'hendra@seafoodfresh.id',
                    'address': 'Jl. Muara Baru No. 45, Jakarta Utara',
                    'payment_terms_days': 7,
                    'tax_id': '03.456.789.0-123.000',
                },
            ]

            vendors = []
            for v_data in vendors_data:
                vendor, created = Vendor.objects.get_or_create(
                    name=v_data['name'],
                    branch=branch,
                    defaults={
                        'contact_person': v_data['contact_person'],
                        'phone': v_data['phone'],
                        'email': v_data['email'],
                        'address': v_data['address'],
                        'payment_terms_days': v_data['payment_terms_days'],
                        'tax_id': v_data['tax_id'],
                        'is_active': True,
                        'notes': 'Supplier terpercaya'
                    }
                )
                vendors.append(vendor)
                if created:
                    self.stdout.write(f'   ✓ Vendor: {vendor.name}')

            # Additional inventory items with realistic Indonesian restaurant ingredients
            additional_items = [
                # Vegetables & Fresh Produce
                {'name': 'Tomat Segar', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 10, 'cost': 12000},
                {'name': 'Kentang', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 15, 'cost': 15000},
                {'name': 'Wortel', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 8, 'cost': 10000},
                {'name': 'Buncis', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 5, 'cost': 18000},
                {'name': 'Kol/Kubis', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 10, 'cost': 8000},
                {'name': 'Terong Ungu', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 5, 'cost': 14000},
                {'name': 'Kangkung', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 8, 'cost': 6000},

                # Spices & Seasonings
                {'name': 'Bawang Putih', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 5, 'cost': 45000},
                {'name': 'Jahe Merah', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 3, 'cost': 28000},
                {'name': 'Kunyit Segar', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 2, 'cost': 22000},
                {'name': 'Lengkuas', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 2, 'cost': 18000},
                {'name': 'Serai', 'unit': 'ikat', 'location': 'WAREHOUSE', 'min_qty': 10, 'cost': 5000},
                {'name': 'Daun Salam', 'unit': 'pak', 'location': 'WAREHOUSE', 'min_qty': 5, 'cost': 8000},
                {'name': 'Daun Jeruk', 'unit': 'pak', 'location': 'WAREHOUSE', 'min_qty': 5, 'cost': 10000},

                # Proteins
                {'name': 'Ikan Bandeng', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 5, 'cost': 45000},
                {'name': 'Udang Segar', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 3, 'cost': 95000},
                {'name': 'Cumi-Cumi', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 3, 'cost': 75000},
                {'name': 'Telur Ayam', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 20, 'cost': 28000},
                {'name': 'Tahu Putih', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 10, 'cost': 8000},
                {'name': 'Tempe', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 10, 'cost': 10000},

                # Dry Goods & Pantry
                {'name': 'Kecap Manis', 'unit': 'liter', 'location': 'WAREHOUSE', 'min_qty': 5, 'cost': 35000},
                {'name': 'Kecap Asin', 'unit': 'liter', 'location': 'WAREHOUSE', 'min_qty': 3, 'cost': 32000},
                {'name': 'Garam', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 10, 'cost': 5000},
                {'name': 'Gula Pasir', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 20, 'cost': 14000},
                {'name': 'Tepung Terigu', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 15, 'cost': 12000},
                {'name': 'Tepung Beras', 'unit': 'kg', 'location': 'WAREHOUSE', 'min_qty': 5, 'cost': 15000},
                {'name': 'Agar-Agar', 'unit': 'pak', 'location': 'WAREHOUSE', 'min_qty': 10, 'cost': 8000},

                # Kitchen Ready Items (processed/prepped)
                {'name': 'Bawang Merah Goreng', 'unit': 'kg', 'location': 'KITCHEN', 'min_qty': 2, 'cost': 85000},
                {'name': 'Bumbu Rendang Siap Pakai', 'unit': 'kg', 'location': 'KITCHEN', 'min_qty': 3, 'cost': 55000},
                {'name': 'Sambal Terasi', 'unit': 'kg', 'location': 'KITCHEN', 'min_qty': 5, 'cost': 45000},
                {'name': 'Kerupuk Udang', 'unit': 'kg', 'location': 'KITCHEN', 'min_qty': 5, 'cost': 65000},
                {'name': 'Emping Melinjo', 'unit': 'kg', 'location': 'KITCHEN', 'min_qty': 3, 'cost': 75000},
            ]

            # Get admin staff for PO creation
            admin_staff = Staff.objects.filter(branch=branch, role='ADMIN').first()

            # Create purchase orders with items
            po_count = 0
            item_count = 0

            for i, item_data in enumerate(additional_items):
                # Check if item already exists
                existing = Inventory.objects.filter(
                    name=item_data['name'],
                    branch=branch
                ).first()

                if existing:
                    self.stdout.write(f'   ⏭️  Skipped: {item_data["name"]} (already exists)')
                    continue

                # Create inventory item
                qty = random.uniform(20, 100)  # Random initial quantity
                inventory = Inventory.objects.create(
                    name=item_data['name'],
                    description=f'Bahan baku {item_data["name"]}',
                    unit=item_data['unit'],
                    quantity=Decimal(str(round(qty, 2))),
                    min_quantity=Decimal(str(item_data['min_qty'])),
                    cost_per_unit=Decimal(str(item_data['cost'])),
                    location=item_data['location'],
                    branch=branch,
                    has_expiring_items=False
                )
                item_count += 1

                # Create PO every 3 items
                if i % 3 == 0:
                    vendor = random.choice(vendors)
                    po_date = date.today() - timedelta(days=random.randint(1, 30))

                    po = PurchaseOrder.objects.create(
                        po_number=f'PO-{date.today().strftime("%Y%m%d")}-{str(PurchaseOrder.objects.count() + 1).zfill(4)}',
                        supplier_name=vendor.name,
                        supplier_contact=vendor.contact_person,
                        supplier_email=vendor.email,
                        supplier_phone=vendor.phone,
                        supplier_address=vendor.address,
                        status='RECEIVED',
                        order_date=po_date,
                        expected_delivery_date=po_date + timedelta(days=3),
                        actual_delivery_date=po_date + timedelta(days=2),
                        payment_terms_days=vendor.payment_terms_days,
                        tax_id=vendor.tax_id,
                        notes='Pengadaan rutin bahan baku',
                        terms_and_conditions='Standar vendor',
                        branch=branch,
                        created_by=admin_staff,
                        approved_by=admin_staff,
                        received_by=admin_staff
                    )
                    po_count += 1

                # Create PO item
                current_po = PurchaseOrder.objects.filter(
                    status='RECEIVED',
                    branch=branch
                ).order_by('-id').first()

                if current_po:
                    PurchaseOrderItem.objects.create(
                        purchase_order=current_po,
                        inventory_item=inventory,
                        quantity=Decimal(str(round(qty, 2))),
                        unit_price=Decimal(str(item_data['cost'])),
                        notes=f'Pembelian {item_data["name"]}'
                    )

                self.stdout.write(f'   ✓ Added: {inventory.name} - {qty:.2f} {inventory.unit} @ Rp {item_data["cost"]:,}')

            self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully added:'))
            self.stdout.write(f'   📦 {item_count} new inventory items')
            self.stdout.write(f'   📋 {po_count} new purchase orders')

            # Summary
            total_warehouse = Inventory.objects.filter(branch=branch, location='WAREHOUSE').count()
            total_kitchen = Inventory.objects.filter(branch=branch, location='KITCHEN').count()

            self.stdout.write(self.style.SUCCESS(f'\n📊 Current totals:'))
            self.stdout.write(f'   Warehouse: {total_warehouse} items')
            self.stdout.write(f'   Kitchen: {total_kitchen} items')
            self.stdout.write(f'   Total: {total_warehouse + total_kitchen} items')
