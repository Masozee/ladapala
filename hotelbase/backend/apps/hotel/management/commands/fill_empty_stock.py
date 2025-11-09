from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.hotel.models.supplier import Supplier
from apps.hotel.models.inventory import InventoryItem, PurchaseOrder, PurchaseOrderItem, StockMovement
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from django.db import transaction

User = get_user_model()


class Command(BaseCommand):
    help = 'Create purchase orders to fill empty or low stock items and automatically receive them'

    def add_arguments(self, parser):
        parser.add_argument(
            '--auto-receive',
            action='store_true',
            help='Automatically receive the purchase orders after creation',
        )
        parser.add_argument(
            '--include-low-stock',
            action='store_true',
            help='Include low stock items (not just empty stock)',
        )

    def handle(self, *args, **options):
        auto_receive = options['auto_receive']
        include_low_stock = options['include_low_stock']

        self.stdout.write(self.style.SUCCESS('=== Fill Empty Stock Script ==='))

        # Get admin user
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user = User.objects.filter(is_staff=True).first()

        if not admin_user:
            self.stdout.write(self.style.ERROR('No admin/staff user found. Please create one first.'))
            return

        # Get all suppliers
        suppliers = list(Supplier.objects.filter(status='ACTIVE'))
        if not suppliers:
            self.stdout.write(self.style.ERROR('No active suppliers found. Run seed_warehouse_data first.'))
            return

        # Find items that need restocking
        if include_low_stock:
            items_to_restock = InventoryItem.objects.filter(
                is_active=True
            ).filter(
                current_stock__lte=models.F('minimum_stock')
            )
            self.stdout.write(f'Found {items_to_restock.count()} items with low or empty stock')
        else:
            items_to_restock = InventoryItem.objects.filter(
                is_active=True,
                current_stock=0
            )
            self.stdout.write(f'Found {items_to_restock.count()} items with empty stock')

        if not items_to_restock.exists():
            self.stdout.write(self.style.SUCCESS('✓ No items need restocking!'))
            return

        # Group items by supplier
        items_by_supplier = {}
        items_without_supplier = []

        for item in items_to_restock:
            if item.supplier:
                if item.supplier.id not in items_by_supplier:
                    items_by_supplier[item.supplier.id] = {
                        'supplier': item.supplier,
                        'items': []
                    }
                items_by_supplier[item.supplier.id]['items'].append(item)
            else:
                items_without_supplier.append(item)

        # Assign items without supplier to a default supplier
        if items_without_supplier:
            default_supplier = suppliers[0]
            self.stdout.write(f'Assigning {len(items_without_supplier)} items without supplier to {default_supplier.name}')
            if default_supplier.id not in items_by_supplier:
                items_by_supplier[default_supplier.id] = {
                    'supplier': default_supplier,
                    'items': []
                }
            items_by_supplier[default_supplier.id]['items'].extend(items_without_supplier)

        # Create purchase orders
        created_pos = []
        total_items_ordered = 0

        for supplier_id, data in items_by_supplier.items():
            supplier = data['supplier']
            items = data['items']

            try:
                with transaction.atomic():
                    # Create Purchase Order
                    po = PurchaseOrder.objects.create(
                        supplier=supplier,
                        order_date=date.today(),
                        expected_delivery=date.today() + timedelta(days=3),
                        status='SUBMITTED',
                        notes=f'Auto-generated PO to restock empty/low inventory items',
                        created_by=admin_user
                    )

                    # Add items to PO
                    for item in items:
                        # Calculate quantity to order
                        if item.maximum_stock:
                            # Order up to maximum stock
                            quantity_to_order = item.maximum_stock - item.current_stock
                        else:
                            # Order 3x minimum stock if no maximum is set
                            quantity_to_order = max(item.minimum_stock * 3, 50)

                        # Create PO Item
                        PurchaseOrderItem.objects.create(
                            purchase_order=po,
                            inventory_item=item,
                            quantity_ordered=quantity_to_order,
                            unit_price=item.unit_price,
                            quantity_received=0
                        )
                        total_items_ordered += 1

                    # Calculate total
                    po.calculate_total()

                    created_pos.append(po)
                    self.stdout.write(
                        f'✓ Created PO {po.po_number} for {supplier.name} '
                        f'({len(items)} items, Total: Rp {po.total_amount:,.0f})'
                    )

            except Exception as e:
                self.stdout.write(self.style.ERROR(f'✗ Failed to create PO for {supplier.name}: {str(e)}'))

        # Auto-receive if requested
        if auto_receive and created_pos:
            self.stdout.write(self.style.WARNING('\n=== Auto-receiving Purchase Orders ==='))

            for po in created_pos:
                try:
                    with transaction.atomic():
                        items_received = 0
                        total_qty_received = 0

                        for po_item in po.items.all():
                            # Receive full quantity
                            quantity_to_receive = po_item.quantity_ordered

                            # Update PO item
                            po_item.quantity_received = quantity_to_receive
                            po_item.save(update_fields=['quantity_received', 'updated_at'])

                            # Update inventory
                            inventory_item = po_item.inventory_item
                            old_stock = inventory_item.current_stock
                            inventory_item.current_stock += quantity_to_receive
                            inventory_item.last_restocked = timezone.now().date()
                            inventory_item.save(update_fields=['current_stock', 'last_restocked', 'updated_at'])

                            # Create stock movement
                            StockMovement.objects.create(
                                inventory_item=inventory_item,
                                movement_type='PURCHASE',
                                quantity=quantity_to_receive,
                                balance_after=inventory_item.current_stock,
                                reference=po.po_number,
                                notes=f'Auto-received from PO {po.po_number}',
                                movement_date=timezone.now(),
                                created_by=admin_user
                            )

                            items_received += 1
                            total_qty_received += quantity_to_receive

                            self.stdout.write(
                                f'  → {inventory_item.name}: {old_stock} → {inventory_item.current_stock} '
                                f'(+{quantity_to_receive} {inventory_item.unit_of_measurement})'
                            )

                        # Mark PO as received
                        po.status = 'RECEIVED'
                        po.received_by = admin_user
                        po.received_date = timezone.now()
                        po.save(update_fields=['status', 'received_by', 'received_date', 'updated_at'])

                        self.stdout.write(
                            self.style.SUCCESS(
                                f'✓ Received PO {po.po_number}: {items_received} items, '
                                f'{total_qty_received} total units'
                            )
                        )

                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'✗ Failed to receive PO {po.po_number}: {str(e)}'))

        # Summary
        self.stdout.write(self.style.SUCCESS(f'\n=== Summary ==='))
        self.stdout.write(f'Purchase Orders Created: {len(created_pos)}')
        self.stdout.write(f'Total Items Ordered: {total_items_ordered}')

        if auto_receive:
            # Count updated items
            if include_low_stock:
                remaining = InventoryItem.objects.filter(
                    is_active=True,
                    current_stock__lte=models.F('minimum_stock')
                ).count()
            else:
                remaining = InventoryItem.objects.filter(
                    is_active=True,
                    current_stock=0
                ).count()

            self.stdout.write(f'Items Restocked: {total_items_ordered}')
            self.stdout.write(f'Items Still Low/Empty: {remaining}')
        else:
            self.stdout.write(self.style.WARNING('\nPurchase orders created but NOT received.'))
            self.stdout.write(f'Run with --auto-receive to automatically receive them.')

        self.stdout.write(self.style.SUCCESS('\n✓ Done!'))


# Fix import for F expression
from django.db import models
