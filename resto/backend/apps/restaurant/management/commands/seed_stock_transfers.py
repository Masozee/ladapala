from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.restaurant.models import Inventory, Branch, StockTransfer, InventoryTransaction, Staff
from decimal import Decimal
import random

User = get_user_model()


class Command(BaseCommand):
    help = 'Create stock transfer records from warehouse to kitchen (20-40% of warehouse stock)'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Starting stock transfer seeding...'))

        # Get branch
        branch = Branch.objects.first()
        if not branch:
            self.stdout.write(self.style.ERROR('No branch found in database'))
            return

        # Get warehouse staff for transferred_by
        warehouse_staff = Staff.objects.filter(role='WAREHOUSE', is_active=True).first()
        if not warehouse_staff:
            self.stdout.write(self.style.ERROR('No warehouse staff found. Please run seed_auth_users first.'))
            return

        transferred_by_user = warehouse_staff.user

        # Delete existing stock transfers to start fresh
        deleted_count = StockTransfer.objects.all().delete()[0]
        self.stdout.write(self.style.WARNING(f'Deleted {deleted_count} existing stock transfers'))

        # Get all warehouse items with stock
        warehouse_items = Inventory.objects.filter(location='WAREHOUSE', quantity__gt=0)

        if not warehouse_items.exists():
            self.stdout.write(self.style.ERROR('No warehouse items with stock found.'))
            return

        # Define conversion rules for transfer quantities
        conversion_rules = {
            'kg': {'kitchen_unit': 'gram', 'factor': 1000},
            'liter': {'kitchen_unit': 'ml', 'factor': 1000},
            'ekor': {'kitchen_unit': 'ekor', 'factor': 1},
            'buah': {'kitchen_unit': 'buah', 'factor': 1},
            'pcs': {'kitchen_unit': 'pcs', 'factor': 1},
        }

        transfers_created = 0
        total_warehouse_value_before = Decimal('0')
        total_warehouse_value_after = Decimal('0')
        total_kitchen_value_after = Decimal('0')

        self.stdout.write(self.style.SUCCESS(f'\n📦 Transferring 20-40% of stock from {warehouse_items.count()} warehouse items to kitchen...'))
        self.stdout.write(self.style.SUCCESS(f'👤 Transferred by: {transferred_by_user.get_full_name()} (Warehouse Staff)\n'))

        for warehouse_item in warehouse_items:
            warehouse_unit = warehouse_item.unit.lower()

            # Skip if no conversion rule
            if warehouse_unit not in conversion_rules:
                continue

            conversion = conversion_rules[warehouse_unit]
            conversion_factor = Decimal(str(conversion['factor']))

            # Find matching kitchen item
            try:
                kitchen_item = Inventory.objects.get(
                    branch=branch,
                    name=warehouse_item.name,
                    location='KITCHEN'
                )
            except Inventory.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'   ⚠ No kitchen item found for {warehouse_item.name}, skipping...'))
                continue

            # Calculate warehouse value before transfer
            warehouse_value_before = warehouse_item.quantity * warehouse_item.cost_per_unit
            total_warehouse_value_before += warehouse_value_before

            # Calculate transfer quantity (20-40% of warehouse stock)
            transfer_percentage = Decimal(str(random.uniform(0.20, 0.40)))
            transfer_qty_warehouse = warehouse_item.quantity * transfer_percentage

            # Round to reasonable precision
            transfer_qty_warehouse = transfer_qty_warehouse.quantize(Decimal('0.01'))

            # Convert to kitchen units
            transfer_qty_kitchen = transfer_qty_warehouse * conversion_factor

            # Update warehouse stock (reduce)
            warehouse_item.quantity -= transfer_qty_warehouse
            warehouse_item.save()

            # Update kitchen stock (increase)
            kitchen_item.quantity += transfer_qty_kitchen
            kitchen_item.save()

            # Create stock transfer record
            transfer = StockTransfer.objects.create(
                branch=branch,
                item_name=warehouse_item.name,
                quantity=transfer_qty_warehouse,
                unit=warehouse_item.unit,
                from_warehouse=warehouse_item,
                to_kitchen=kitchen_item,
                transferred_by=transferred_by_user,
                notes=f'Initial stock transfer - {transfer_percentage*100:.0f}% of warehouse stock'
            )

            # Create inventory transaction for warehouse (OUT)
            InventoryTransaction.objects.create(
                inventory=warehouse_item,
                transaction_type='TRANSFER',
                quantity=transfer_qty_warehouse,
                unit_cost=warehouse_item.cost_per_unit,
                reference_number=f'TRANSFER-{transfer.id}',
                notes=f'Transferred to kitchen: {transfer_qty_warehouse} {warehouse_item.unit}'
            )

            # Create inventory transaction for kitchen (IN)
            InventoryTransaction.objects.create(
                inventory=kitchen_item,
                transaction_type='TRANSFER',
                quantity=transfer_qty_kitchen,
                unit_cost=kitchen_item.cost_per_unit,
                reference_number=f'TRANSFER-{transfer.id}',
                notes=f'Received from warehouse: {transfer_qty_kitchen} {kitchen_item.unit}'
            )

            transfers_created += 1

            # Calculate values after transfer
            warehouse_value_after = warehouse_item.quantity * warehouse_item.cost_per_unit
            kitchen_value_after = kitchen_item.quantity * kitchen_item.cost_per_unit

            total_warehouse_value_after += warehouse_value_after
            total_kitchen_value_after += kitchen_value_after

            # Display transfer details
            self.stdout.write(
                f'   ✓ {warehouse_item.name}: {transfer_qty_warehouse} {warehouse_item.unit} '
                f'({transfer_percentage*100:.0f}%) → {transfer_qty_kitchen} {kitchen_item.unit}'
            )
            self.stdout.write(
                f'      Warehouse: {warehouse_item.quantity + transfer_qty_warehouse} → {warehouse_item.quantity} {warehouse_item.unit} '
                f'(Rp {warehouse_value_before:,.0f} → Rp {warehouse_value_after:,.0f})'
            )
            self.stdout.write(
                f'      Kitchen:   0 → {kitchen_item.quantity} {kitchen_item.unit} '
                f'(Rp {kitchen_value_after:,.0f})'
            )

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n✅ Successfully created {transfers_created} stock transfers'))

        # Financial summary
        self.stdout.write(self.style.SUCCESS('\n💰 Financial Summary:'))
        self.stdout.write(f'   Warehouse value before: Rp {total_warehouse_value_before:,.0f}')
        self.stdout.write(f'   Warehouse value after:  Rp {total_warehouse_value_after:,.0f}')
        self.stdout.write(f'   Kitchen value after:    Rp {total_kitchen_value_after:,.0f}')
        self.stdout.write(f'   Total value (should match): Rp {total_warehouse_value_after + total_kitchen_value_after:,.0f}')

        value_difference = abs(total_warehouse_value_before - (total_warehouse_value_after + total_kitchen_value_after))
        if value_difference < 1000:  # Allow small rounding differences
            self.stdout.write(self.style.SUCCESS(f'   ✓ Value preserved (diff: Rp {value_difference:,.2f})'))
        else:
            self.stdout.write(self.style.WARNING(f'   ⚠ Value difference: Rp {value_difference:,.2f}'))

        # Show current inventory status
        self.stdout.write(self.style.SUCCESS('\n📊 Current Inventory Status:'))
        self.stdout.write(f'{"Item":<20} {"Warehouse":<30} {"Kitchen":<30}')
        self.stdout.write('=' * 80)

        for warehouse_item in warehouse_items:
            try:
                kitchen_item = Inventory.objects.get(
                    branch=branch,
                    name=warehouse_item.name,
                    location='KITCHEN'
                )

                warehouse_info = f'{warehouse_item.quantity} {warehouse_item.unit} (Rp {warehouse_item.quantity * warehouse_item.cost_per_unit:,.0f})'
                kitchen_info = f'{kitchen_item.quantity} {kitchen_item.unit} (Rp {kitchen_item.quantity * kitchen_item.cost_per_unit:,.0f})'

                self.stdout.write(f'{warehouse_item.name:<20} {warehouse_info:<30} {kitchen_info:<30}')

            except Inventory.DoesNotExist:
                pass

        self.stdout.write(self.style.SUCCESS('\n💡 Next Steps:'))
        self.stdout.write(self.style.SUCCESS('   1. Kitchen stock is now available for production'))
        self.stdout.write(self.style.SUCCESS('   2. Create BOM (recipes) to link menu items to kitchen ingredients'))
        self.stdout.write(self.style.SUCCESS('   3. When orders are sold, kitchen stock will auto-deduct based on recipes'))
