from django.core.management.base import BaseCommand
from apps.restaurant.models import Inventory, PurchaseOrder, PurchaseOrderItem
from decimal import Decimal


class Command(BaseCommand):
    help = 'Backfill inventory costs from existing received Purchase Orders'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Starting inventory cost backfill...'))

        # Get all RECEIVED POs ordered by date (oldest first)
        received_pos = PurchaseOrder.objects.filter(
            status='RECEIVED'
        ).order_by('actual_delivery_date', 'created_at')

        self.stdout.write(f'Found {received_pos.count()} received POs')

        # Track which items we've processed
        processed_items = {}

        # Process each PO in chronological order
        for po in received_pos:
            self.stdout.write(f'\nProcessing PO: {po.po_number} ({po.order_date})')

            for po_item in po.items.all():
                inventory_item = po_item.inventory_item
                item_key = f"{inventory_item.id}"

                if item_key not in processed_items:
                    # First time seeing this item - set initial cost
                    old_cost = inventory_item.cost_per_unit
                    inventory_item.cost_per_unit = po_item.unit_price
                    inventory_item.save()

                    processed_items[item_key] = {
                        'qty': po_item.quantity,
                        'cost': po_item.unit_price
                    }

                    self.stdout.write(
                        f'  ✓ {inventory_item.name}: Initial cost set to Rp {po_item.unit_price:,.2f} '
                        f'(was Rp {old_cost:,.2f})'
                    )
                else:
                    # Item seen before - calculate moving average
                    old_qty = processed_items[item_key]['qty']
                    old_cost = processed_items[item_key]['cost']
                    new_qty = po_item.quantity
                    new_cost = po_item.unit_price

                    # Moving average formula
                    total_cost = (old_qty * old_cost) + (new_qty * new_cost)
                    total_qty = old_qty + new_qty
                    avg_cost = total_cost / total_qty if total_qty > 0 else new_cost

                    inventory_item.cost_per_unit = avg_cost
                    inventory_item.save()

                    processed_items[item_key]['qty'] = total_qty
                    processed_items[item_key]['cost'] = avg_cost

                    self.stdout.write(
                        f'  ✓ {inventory_item.name}: Updated to Rp {avg_cost:,.2f} '
                        f'(was Rp {old_cost:,.2f})'
                    )

        self.stdout.write(
            self.style.SUCCESS(f'\n✓ Backfill complete! Updated {len(processed_items)} items')
        )

        # Show summary
        self.stdout.write('\n=== SUMMARY ===')
        items_with_cost = Inventory.objects.filter(cost_per_unit__gt=0).count()
        items_without_cost = Inventory.objects.filter(cost_per_unit=0).count()
        self.stdout.write(f'Items with cost > 0: {items_with_cost}')
        self.stdout.write(f'Items with cost = 0: {items_without_cost}')
