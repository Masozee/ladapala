"""
Convert kitchen inventory to smaller units (kg → gram, liter → ml)
Warehouse keeps larger units for bulk storage
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from apps.restaurant.models import Inventory
from decimal import Decimal

class Command(BaseCommand):
    help = 'Convert kitchen inventory to smaller units (kg→gram, liter→ml)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('🔄 Converting kitchen inventory to smaller units...'))

        with transaction.atomic():
            # Get kitchen items with large units
            kg_items = Inventory.objects.filter(location='KITCHEN', unit='kg')
            liter_items = Inventory.objects.filter(location='KITCHEN', unit='liter')
            ekor_items = Inventory.objects.filter(location='KITCHEN', unit='ekor')

            total_converted = 0

            # Convert kg to gram
            self.stdout.write(f'\n📏 Converting kg → gram ({kg_items.count()} items)')
            for item in kg_items:
                old_qty = item.quantity
                old_min = item.min_quantity
                old_cost = item.cost_per_unit

                # Convert quantities (1 kg = 1000 gram)
                item.quantity = old_qty * Decimal('1000')
                item.min_quantity = old_min * Decimal('1000')
                # Cost per unit becomes cost per gram (divide by 1000)
                item.cost_per_unit = old_cost / Decimal('1000')
                item.unit = 'gram'
                item.save()

                self.stdout.write(
                    f'   ✓ {item.name}: {old_qty} kg → {item.quantity} gram '
                    f'(min: {old_min} kg → {item.min_quantity} gram)'
                )
                total_converted += 1

            # Convert liter to ml
            self.stdout.write(f'\n💧 Converting liter → ml ({liter_items.count()} items)')
            for item in liter_items:
                old_qty = item.quantity
                old_min = item.min_quantity
                old_cost = item.cost_per_unit

                # Convert quantities (1 liter = 1000 ml)
                item.quantity = old_qty * Decimal('1000')
                item.min_quantity = old_min * Decimal('1000')
                # Cost per unit becomes cost per ml (divide by 1000)
                item.cost_per_unit = old_cost / Decimal('1000')
                item.unit = 'ml'
                item.save()

                self.stdout.write(
                    f'   ✓ {item.name}: {old_qty} liter → {item.quantity} ml '
                    f'(min: {old_min} liter → {item.min_quantity} ml)'
                )
                total_converted += 1

            # Convert ekor to pcs (piece) for consistency
            self.stdout.write(f'\n🐓 Converting ekor → pcs ({ekor_items.count()} items)')
            for item in ekor_items:
                old_unit = item.unit
                item.unit = 'pcs'
                item.save()

                self.stdout.write(f'   ✓ {item.name}: {item.quantity} {old_unit} → {item.quantity} pcs')
                total_converted += 1

            # Convert pak and ikat to pcs for kitchen
            pak_items = Inventory.objects.filter(location='KITCHEN', unit='pak')
            ikat_items = Inventory.objects.filter(location='KITCHEN', unit='ikat')

            self.stdout.write(f'\n📦 Converting pak/ikat → pcs ({pak_items.count() + ikat_items.count()} items)')
            for item in list(pak_items) + list(ikat_items):
                old_unit = item.unit
                old_qty = item.quantity

                # Assume 1 pak/ikat = 10 pcs for kitchen use
                item.quantity = old_qty * Decimal('10')
                item.min_quantity = item.min_quantity * Decimal('10')
                # Cost per pcs (divide by 10)
                item.cost_per_unit = item.cost_per_unit / Decimal('10')
                item.unit = 'pcs'
                item.save()

                self.stdout.write(f'   ✓ {item.name}: {old_qty} {old_unit} → {item.quantity} pcs')
                total_converted += 1

            self.stdout.write(self.style.SUCCESS(f'\n✅ Conversion complete!'))
            self.stdout.write(f'   📊 Total items converted: {total_converted}')

            # Summary
            self.stdout.write(f'\n📋 Kitchen inventory units summary:')
            kitchen_units = Inventory.objects.filter(location='KITCHEN').values('unit').distinct()
            for unit_row in kitchen_units:
                unit = unit_row['unit']
                count = Inventory.objects.filter(location='KITCHEN', unit=unit).count()
                self.stdout.write(f'   • {unit}: {count} items')

            self.stdout.write(f'\n📦 Warehouse inventory units (unchanged):')
            warehouse_units = Inventory.objects.filter(location='WAREHOUSE').values('unit').distinct()
            for unit_row in warehouse_units:
                unit = unit_row['unit']
                count = Inventory.objects.filter(location='WAREHOUSE', unit=unit).count()
                self.stdout.write(f'   • {unit}: {count} items')
