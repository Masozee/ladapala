"""
Restock inventory items with 0 or negative stock through purchase orders
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.restaurant.models import (
    Branch, Inventory, PurchaseOrder, PurchaseOrderItem, Vendor, Staff
)
from decimal import Decimal
from datetime import date, timedelta
import random

class Command(BaseCommand):
    help = 'Restock items with 0 or negative stock through purchase orders'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('🔄 Restocking zero-stock items...'))

        with transaction.atomic():
            # Get branch
            branch = Branch.objects.first()
            if not branch:
                self.stdout.write(self.style.ERROR('❌ No branch found'))
                return

            # Get items with 0 or negative stock
            zero_stock_items = Inventory.objects.filter(
                branch=branch
            ).filter(
                quantity__lte=0
            ).order_by('location', 'name')

            if not zero_stock_items.exists():
                self.stdout.write(self.style.SUCCESS('✅ All items have stock!'))
                return

            self.stdout.write(f'   📦 Found {zero_stock_items.count()} items with 0 or negative stock')

            # Get vendors
            vendors = list(Vendor.objects.filter(branch=branch, is_active=True))
            if not vendors:
                self.stdout.write(self.style.ERROR('❌ No active vendors found'))
                return

            # Get admin staff for PO creation
            admin_staff = Staff.objects.filter(branch=branch, role='ADMIN').first()

            # Create purchase order
            vendor = random.choice(vendors)
            po_date = date.today()

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
                actual_delivery_date=po_date,
                payment_terms_days=vendor.payment_terms_days,
                tax_id=vendor.tax_id,
                notes='Restock untuk item dengan stok 0/negatif',
                terms_and_conditions='Standar vendor',
                branch=branch,
                created_by=admin_staff,
                approved_by=admin_staff,
                received_by=admin_staff
            )

            self.stdout.write(f'   📋 Created PO: {po.po_number}')

            # Process each item
            total_value = Decimal('0')
            restocked_count = 0

            for item in zero_stock_items:
                # Determine restock quantity
                if item.min_quantity > 0:
                    # Stock to 3x minimum or at least 20
                    restock_qty = max(item.min_quantity * 3, Decimal('20'))
                else:
                    # If no min_quantity, use sensible defaults
                    if item.unit in ['kg', 'liter']:
                        restock_qty = Decimal('30')
                    elif item.unit in ['pak', 'ikat']:
                        restock_qty = Decimal('20')
                    elif item.unit == 'ekor':
                        restock_qty = Decimal('15')
                    else:
                        restock_qty = Decimal('25')

                # Adjust for negative stock (add extra to compensate)
                if item.quantity < 0:
                    restock_qty += abs(item.quantity)

                # Create PO item
                PurchaseOrderItem.objects.create(
                    purchase_order=po,
                    inventory_item=item,
                    quantity=restock_qty,
                    unit_price=item.cost_per_unit or Decimal('10000'),
                    notes=f'Restock dari {item.quantity} ke {restock_qty}'
                )

                # Update inventory quantity
                old_qty = item.quantity
                item.quantity = restock_qty
                item.save()

                item_value = restock_qty * (item.cost_per_unit or Decimal('10000'))
                total_value += item_value

                self.stdout.write(
                    f'   ✓ {item.name} ({item.location}): '
                    f'{old_qty} → {restock_qty} {item.unit} '
                    f'(Rp {item_value:,.0f})'
                )
                restocked_count += 1

            self.stdout.write(self.style.SUCCESS(f'\n✅ Restocking complete!'))
            self.stdout.write(f'   📦 Restocked: {restocked_count} items')
            self.stdout.write(f'   💰 Total value: Rp {total_value:,.0f}')
            self.stdout.write(f'   📋 Purchase order: {po.po_number}')

            # Summary by location
            warehouse_count = Inventory.objects.filter(
                branch=branch,
                location='WAREHOUSE',
                quantity__gt=0
            ).count()
            kitchen_count = Inventory.objects.filter(
                branch=branch,
                location='KITCHEN',
                quantity__gt=0
            ).count()

            self.stdout.write(f'\n📊 Items with stock:')
            self.stdout.write(f'   Warehouse: {warehouse_count}')
            self.stdout.write(f'   Kitchen: {kitchen_count}')
