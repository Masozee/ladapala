from django.core.management.base import BaseCommand
from apps.restaurant.models import Inventory, Branch
from decimal import Decimal


class Command(BaseCommand):
    help = 'Create kitchen inventory items with unit conversions from warehouse items'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Starting kitchen items conversion seeding...'))

        # Get branch
        branch = Branch.objects.first()
        if not branch:
            self.stdout.write(self.style.ERROR('No branch found in database'))
            return

        # Delete existing kitchen items to avoid duplicates
        deleted_count = Inventory.objects.filter(location='KITCHEN').delete()[0]
        self.stdout.write(self.style.WARNING(f'Deleted {deleted_count} existing kitchen items'))

        # Get all warehouse items
        warehouse_items = Inventory.objects.filter(location='WAREHOUSE')

        if not warehouse_items.exists():
            self.stdout.write(self.style.ERROR('No warehouse items found. Please run seed_resto_data first.'))
            return

        # Define conversion rules: warehouse_unit -> kitchen_unit with conversion factor
        # If warehouse has kg, kitchen will have gram (1 kg = 1000 gram)
        # If warehouse has liter, kitchen will have ml (1 liter = 1000 ml)
        # If warehouse has ekor (chicken), kitchen will have ekor (same unit, no conversion)
        conversion_rules = {
            'kg': {'kitchen_unit': 'gram', 'factor': 1000},
            'liter': {'kitchen_unit': 'ml', 'factor': 1000},
            'ekor': {'kitchen_unit': 'ekor', 'factor': 1},  # No conversion for chickens
            'buah': {'kitchen_unit': 'buah', 'factor': 1},  # No conversion for pieces
            'pcs': {'kitchen_unit': 'pcs', 'factor': 1},    # No conversion for pieces
        }

        kitchen_items_created = 0
        self.stdout.write(self.style.SUCCESS(f'\n📦 Converting {warehouse_items.count()} warehouse items to kitchen items...'))

        for warehouse_item in warehouse_items:
            warehouse_unit = warehouse_item.unit.lower()

            # Check if we have a conversion rule for this unit
            if warehouse_unit not in conversion_rules:
                self.stdout.write(self.style.WARNING(f'   ⚠ No conversion rule for unit "{warehouse_item.unit}" ({warehouse_item.name}), skipping...'))
                continue

            conversion = conversion_rules[warehouse_unit]
            kitchen_unit = conversion['kitchen_unit']
            conversion_factor = Decimal(str(conversion['factor']))

            # Kitchen items start with ZERO quantity
            # They will be filled via stock transfers from warehouse
            # Quantity will auto-deduct when menu items are sold based on BOM (Recipe)
            kitchen_quantity = Decimal('0')

            # Cost per unit is converted for proper recipe cost calculations
            # E.g., if warehouse is Rp 12,500/kg, kitchen will be Rp 12.50/gram
            kitchen_cost_per_unit = warehouse_item.cost_per_unit / conversion_factor if warehouse_item.cost_per_unit > 0 else Decimal('0')

            # Min quantity for kitchen is typically smaller (about 1/6 of warehouse min converted)
            # E.g., if warehouse min is 30 kg (30,000 gram), kitchen min might be 5,000 gram
            kitchen_min_quantity = (warehouse_item.min_quantity * conversion_factor) / Decimal('6')

            try:
                # Create kitchen item
                kitchen_item = Inventory.objects.create(
                    branch=branch,
                    name=warehouse_item.name,  # Same name as warehouse item
                    unit=kitchen_unit,
                    quantity=kitchen_quantity,
                    min_quantity=kitchen_min_quantity,
                    cost_per_unit=kitchen_cost_per_unit,
                    location='KITCHEN'
                )

                kitchen_items_created += 1

                # Show conversion details
                if conversion_factor == 1:
                    self.stdout.write(f'   ✓ {warehouse_item.name}: {warehouse_item.unit} → {kitchen_unit} (no conversion, starts at 0)')
                else:
                    self.stdout.write(f'   ✓ {warehouse_item.name}: {warehouse_item.unit} → {kitchen_unit} (×{conversion_factor}, starts at 0)')

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'   ✗ Error creating kitchen item for {warehouse_item.name}: {str(e)}'))

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully created {kitchen_items_created} kitchen items'))

        # Show detailed comparison
        self.stdout.write(self.style.SUCCESS('\n📊 Warehouse vs Kitchen Comparison:'))
        self.stdout.write(self.style.SUCCESS(f'{"Item Name":<20} {"Warehouse":<25} {"Kitchen (Empty)":<35} {"Estimated Value"}'))
        self.stdout.write(self.style.SUCCESS('=' * 110))

        for warehouse_item in warehouse_items:
            try:
                kitchen_item = Inventory.objects.get(
                    branch=branch,
                    name=warehouse_item.name,
                    location='KITCHEN'
                )

                warehouse_info = f'{warehouse_item.quantity} {warehouse_item.unit} @ Rp {warehouse_item.cost_per_unit:,.0f}/{warehouse_item.unit}'
                kitchen_info = f'{kitchen_item.quantity} {kitchen_item.unit} @ Rp {kitchen_item.cost_per_unit:,.2f}/{kitchen_item.unit}'

                # Show estimated value when kitchen is filled
                warehouse_value = warehouse_item.quantity * warehouse_item.cost_per_unit
                kitchen_info_with_note = f'{kitchen_item.quantity} {kitchen_item.unit} @ Rp {kitchen_item.cost_per_unit:,.2f}/{kitchen_item.unit} (empty)'

                # Calculate what kitchen value would be if warehouse qty was transferred
                potential_kitchen_qty = warehouse_item.quantity * conversion_factor
                estimated_value = potential_kitchen_qty * kitchen_item.cost_per_unit

                value_status = f'Est. Rp {estimated_value:,.0f} if transferred'

                self.stdout.write(f'{warehouse_item.name:<20} {warehouse_info:<25} {kitchen_info_with_note:<35} {value_status}')

            except Inventory.DoesNotExist:
                self.stdout.write(f'{warehouse_item.name:<20} {"Not converted":<25}')

        self.stdout.write(self.style.SUCCESS('\n💡 Important Notes:'))
        self.stdout.write(self.style.SUCCESS('   1. Kitchen items start with ZERO quantity'))
        self.stdout.write(self.style.SUCCESS('   2. Use Stock Transfer to move inventory from Warehouse → Kitchen'))
        self.stdout.write(self.style.SUCCESS('   3. When menu items are sold, kitchen stock auto-deducts based on BOM (Recipe)'))
        self.stdout.write(self.style.SUCCESS('   4. Kitchen tracks actual usable ingredients, Warehouse tracks raw materials'))
