from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.hotel.models.supplier import Supplier
from apps.hotel.models.inventory import InventoryItem, PurchaseOrder, PurchaseOrderItem, StockMovement
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed warehouse data (suppliers, purchase orders, stock movements) - preserves existing data'

    def handle(self, *args, **options):
        self.stdout.write('Seeding warehouse data...')

        # Get or create admin user for created_by fields
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            self.stdout.write(self.style.WARNING('No admin user found. Please create one first.'))
            return

        # Create Suppliers (Indonesian hotel suppliers)
        suppliers_data = [
            {
                'name': 'PT Linen Indonesia Jaya',
                'contact_person': 'Ibu Siti Nurhaliza',
                'email': 'sales@linenindo.co.id',
                'phone': '021-5551234',
                'address': 'Jl. Industri Raya No. 45, Kawasan Industri',
                'city': 'Jakarta Utara',
                'province': 'DKI Jakarta',
                'postal_code': '14350',
                'country': 'Indonesia',
                'tax_id': '01.234.567.8-901.000',
                'payment_terms': 'Net 30',
                'status': 'ACTIVE',
                'notes': 'Supplier utama untuk sprei, handuk, dan linen hotel'
            },
            {
                'name': 'CV Amenities Prima',
                'contact_person': 'Bapak Agus Setiawan',
                'email': 'info@amenitiesprima.com',
                'phone': '021-5552345',
                'address': 'Jl. Perdagangan No. 78',
                'city': 'Tangerang',
                'province': 'Banten',
                'postal_code': '15810',
                'country': 'Indonesia',
                'tax_id': '01.345.678.9-012.000',
                'payment_terms': 'Net 30',
                'status': 'ACTIVE',
                'notes': 'Supplier toiletries dan amenities kamar'
            },
            {
                'name': 'PT Minuman Berkah',
                'contact_person': 'Bapak Andi Wijaya',
                'email': 'order@minumanberkah.co.id',
                'phone': '021-5553456',
                'address': 'Jl. Distribusi No. 123',
                'city': 'Bekasi',
                'province': 'Jawa Barat',
                'postal_code': '17530',
                'country': 'Indonesia',
                'tax_id': '01.456.789.0-123.000',
                'payment_terms': 'Net 14',
                'status': 'ACTIVE',
                'notes': 'Supplier air mineral dan minuman kemasan'
            },
            {
                'name': 'Toko Religi Barokah',
                'contact_person': 'Bapak Usman Al-Hakim',
                'email': 'barokah@religihotel.com',
                'phone': '021-5554567',
                'address': 'Jl. Masjid Raya No. 56',
                'city': 'Jakarta Selatan',
                'province': 'DKI Jakarta',
                'postal_code': '12950',
                'country': 'Indonesia',
                'tax_id': '01.567.890.1-234.000',
                'payment_terms': 'Net 30',
                'status': 'ACTIVE',
                'notes': 'Supplier sajadah, mukena, Al-Quran, dan perlengkapan ibadah'
            },
            {
                'name': 'PT Kebersihan Sejahtera',
                'contact_person': 'Ibu Diana Kusuma',
                'email': 'sales@kebersihanhotel.co.id',
                'phone': '021-5555678',
                'address': 'Jl. Bersih No. 89',
                'city': 'Depok',
                'province': 'Jawa Barat',
                'postal_code': '16412',
                'country': 'Indonesia',
                'tax_id': '01.678.901.2-345.000',
                'payment_terms': 'Net 30',
                'status': 'ACTIVE',
                'notes': 'Supplier produk kebersihan dan sanitasi'
            },
            {
                'name': 'CV Kopi Nusantara',
                'contact_person': 'Bapak Hendra Gunawan',
                'email': 'distributor@kopinusantara.id',
                'phone': '021-5556789',
                'address': 'Jl. Perkebunan No. 234',
                'city': 'Bogor',
                'province': 'Jawa Barat',
                'postal_code': '16710',
                'country': 'Indonesia',
                'tax_id': '01.789.012.3-456.000',
                'payment_terms': 'Net 21',
                'status': 'ACTIVE',
                'notes': 'Supplier kopi, teh, gula, dan supplies F&B'
            },
        ]

        suppliers = {}
        for supp_data in suppliers_data:
            supplier, created = Supplier.objects.get_or_create(
                name=supp_data['name'],
                defaults={**supp_data, 'created_by': admin_user}
            )
            suppliers[supplier.name] = supplier
            if created:
                self.stdout.write(self.style.SUCCESS(f'  Created supplier: {supplier.name}'))
            else:
                self.stdout.write(f'  Supplier already exists: {supplier.name}')

        # Update existing inventory items with suppliers
        inventory_supplier_mapping = [
            # Linen & Textiles -> PT Linen Indonesia Jaya
            ('Sprei Putih (King)', 'PT Linen Indonesia Jaya'),
            ('Sprei Putih (Queen)', 'PT Linen Indonesia Jaya'),
            ('Sarung Bantal', 'PT Linen Indonesia Jaya'),
            ('Selimut', 'PT Linen Indonesia Jaya'),
            ('Handuk Mandi Besar', 'PT Linen Indonesia Jaya'),
            ('Handuk Tangan', 'PT Linen Indonesia Jaya'),
            ('Handuk Kaki', 'PT Linen Indonesia Jaya'),

            # Toiletries -> CV Amenities Prima
            ('Shampoo Sachet 10ml', 'CV Amenities Prima'),
            ('Sabun Batangan 50gr', 'CV Amenities Prima'),
            ('Pasta Gigi Mini', 'CV Amenities Prima'),
            ('Sikat Gigi', 'CV Amenities Prima'),
            ('Sisir', 'CV Amenities Prima'),
            ('Shower Cap', 'CV Amenities Prima'),

            # Prayer Items -> Toko Religi Barokah
            ('Sajadah', 'Toko Religi Barokah'),
            ('Mushaf Al-Quran', 'Toko Religi Barokah'),
            ('Mukena', 'Toko Religi Barokah'),
            ('Kompas Kiblat', 'Toko Religi Barokah'),

            # Food & Beverages -> CV Kopi Nusantara & PT Minuman Berkah
            ('Kopi Kapal Api Sachet', 'CV Kopi Nusantara'),
            ('Teh Celup Sariwangi', 'CV Kopi Nusantara'),
            ('Gula Pasir Sachet', 'CV Kopi Nusantara'),
            ('Krimer Kental Manis', 'CV Kopi Nusantara'),
            ('Air Mineral Aqua 600ml', 'PT Minuman Berkah'),
            ('Air Mineral Aqua 1500ml', 'PT Minuman Berkah'),

            # Cleaning Supplies -> PT Kebersihan Sejahtera
            ('Tissue Toilet Roll', 'PT Kebersihan Sejahtera'),
            ('Tissue Kotak', 'PT Kebersihan Sejahtera'),
            ('Sabun Cuci Piring Sunlight', 'PT Kebersihan Sejahtera'),
            ('Deterjen Rinso', 'PT Kebersihan Sejahtera'),
            ('Pembersih Lantai Wipol', 'PT Kebersihan Sejahtera'),
            ('Pewangi Ruangan', 'PT Kebersihan Sejahtera'),
            ('Kamper Kamar Mandi', 'PT Kebersihan Sejahtera'),
        ]

        for item_name, supplier_name in inventory_supplier_mapping:
            try:
                item = InventoryItem.objects.get(name=item_name)
                supplier = suppliers[supplier_name]
                if not item.supplier:
                    item.supplier = supplier
                    item.save()
                    self.stdout.write(f'  Updated supplier for: {item_name}')
            except InventoryItem.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Item not found: {item_name}'))

        # Create Purchase Orders (realistic historical data)
        today = timezone.now().date()

        purchase_orders_data = [
            # PO 1 - Linen restock (3 months ago, RECEIVED)
            {
                'supplier': suppliers['PT Linen Indonesia Jaya'],
                'order_date': today - timedelta(days=90),
                'expected_delivery': today - timedelta(days=85),
                'status': 'RECEIVED',
                'notes': 'Restok linen bulanan - rutin',
                'items': [
                    {'item_name': 'Sprei Putih (King)', 'quantity': 50, 'unit_price': Decimal('75000')},
                    {'item_name': 'Sprei Putih (Queen)', 'quantity': 60, 'unit_price': Decimal('60000')},
                    {'item_name': 'Handuk Mandi Besar', 'quantity': 80, 'unit_price': Decimal('45000')},
                    {'item_name': 'Handuk Tangan', 'quantity': 100, 'unit_price': Decimal('20000')},
                    {'item_name': 'Selimut', 'quantity': 40, 'unit_price': Decimal('85000')},
                ],
                'received_days_ago': 87
            },

            # PO 2 - Amenities restock (2 months ago, RECEIVED)
            {
                'supplier': suppliers['CV Amenities Prima'],
                'order_date': today - timedelta(days=60),
                'expected_delivery': today - timedelta(days=56),
                'status': 'RECEIVED',
                'notes': 'Restock amenities kamar mandi',
                'items': [
                    {'item_name': 'Shampoo Sachet 10ml', 'quantity': 200, 'unit_price': Decimal('3000')},
                    {'item_name': 'Sabun Batangan 50gr', 'quantity': 250, 'unit_price': Decimal('2500')},
                    {'item_name': 'Pasta Gigi Mini', 'quantity': 150, 'unit_price': Decimal('4000')},
                    {'item_name': 'Sikat Gigi', 'quantity': 150, 'unit_price': Decimal('2000')},
                    {'item_name': 'Sisir', 'quantity': 200, 'unit_price': Decimal('1500')},
                    {'item_name': 'Shower Cap', 'quantity': 250, 'unit_price': Decimal('1000')},
                ],
                'received_days_ago': 58
            },

            # PO 3 - Beverages (45 days ago, RECEIVED)
            {
                'supplier': suppliers['PT Minuman Berkah'],
                'order_date': today - timedelta(days=45),
                'expected_delivery': today - timedelta(days=43),
                'status': 'RECEIVED',
                'notes': 'Stock air mineral untuk bulan ini',
                'items': [
                    {'item_name': 'Air Mineral Aqua 600ml', 'quantity': 200, 'unit_price': Decimal('4000')},
                    {'item_name': 'Air Mineral Aqua 1500ml', 'quantity': 120, 'unit_price': Decimal('8000')},
                ],
                'received_days_ago': 43
            },

            # PO 4 - Prayer items (1 month ago, RECEIVED)
            {
                'supplier': suppliers['Toko Religi Barokah'],
                'order_date': today - timedelta(days=30),
                'expected_delivery': today - timedelta(days=27),
                'status': 'RECEIVED',
                'notes': 'Tambahan perlengkapan ibadah untuk bulan Ramadan',
                'items': [
                    {'item_name': 'Sajadah', 'quantity': 40, 'unit_price': Decimal('35000')},
                    {'item_name': 'Mushaf Al-Quran', 'quantity': 30, 'unit_price': Decimal('50000')},
                    {'item_name': 'Mukena', 'quantity': 25, 'unit_price': Decimal('45000')},
                ],
                'received_days_ago': 28
            },

            # PO 5 - Cleaning supplies (3 weeks ago, RECEIVED)
            {
                'supplier': suppliers['PT Kebersihan Sejahtera'],
                'order_date': today - timedelta(days=21),
                'expected_delivery': today - timedelta(days=18),
                'status': 'RECEIVED',
                'notes': 'Restock produk kebersihan',
                'items': [
                    {'item_name': 'Tissue Toilet Roll', 'quantity': 100, 'unit_price': Decimal('12000')},
                    {'item_name': 'Tissue Kotak', 'quantity': 80, 'unit_price': Decimal('8000')},
                    {'item_name': 'Sabun Cuci Piring Sunlight', 'quantity': 20, 'unit_price': Decimal('15000')},
                    {'item_name': 'Deterjen Rinso', 'quantity': 30, 'unit_price': Decimal('25000')},
                    {'item_name': 'Pembersih Lantai Wipol', 'quantity': 25, 'unit_price': Decimal('18000')},
                    {'item_name': 'Pewangi Ruangan', 'quantity': 30, 'unit_price': Decimal('22000')},
                ],
                'received_days_ago': 19
            },

            # PO 6 - F&B supplies (2 weeks ago, RECEIVED)
            {
                'supplier': suppliers['CV Kopi Nusantara'],
                'order_date': today - timedelta(days=14),
                'expected_delivery': today - timedelta(days=11),
                'status': 'RECEIVED',
                'notes': 'Stock kopi dan teh mingguan',
                'items': [
                    {'item_name': 'Kopi Kapal Api Sachet', 'quantity': 150, 'unit_price': Decimal('2500')},
                    {'item_name': 'Teh Celup Sariwangi', 'quantity': 200, 'unit_price': Decimal('1500')},
                    {'item_name': 'Gula Pasir Sachet', 'quantity': 250, 'unit_price': Decimal('500')},
                    {'item_name': 'Krimer Kental Manis', 'quantity': 150, 'unit_price': Decimal('1000')},
                ],
                'received_days_ago': 12
            },

            # PO 7 - Linen restock (1 week ago, RECEIVED)
            {
                'supplier': suppliers['PT Linen Indonesia Jaya'],
                'order_date': today - timedelta(days=7),
                'expected_delivery': today - timedelta(days=4),
                'status': 'RECEIVED',
                'notes': 'Tambahan handuk untuk high season',
                'items': [
                    {'item_name': 'Handuk Mandi Besar', 'quantity': 60, 'unit_price': Decimal('45000')},
                    {'item_name': 'Handuk Tangan', 'quantity': 80, 'unit_price': Decimal('20000')},
                    {'item_name': 'Handuk Kaki', 'quantity': 50, 'unit_price': Decimal('25000')},
                ],
                'received_days_ago': 5
            },

            # PO 8 - Current order (SUBMITTED, awaiting delivery)
            {
                'supplier': suppliers['CV Amenities Prima'],
                'order_date': today - timedelta(days=3),
                'expected_delivery': today + timedelta(days=2),
                'status': 'SUBMITTED',
                'notes': 'Order amenities bulanan',
                'items': [
                    {'item_name': 'Shampoo Sachet 10ml', 'quantity': 180, 'unit_price': Decimal('3000')},
                    {'item_name': 'Sabun Batangan 50gr', 'quantity': 200, 'unit_price': Decimal('2500')},
                    {'item_name': 'Sikat Gigi', 'quantity': 120, 'unit_price': Decimal('2000')},
                    {'item_name': 'Pasta Gigi Mini', 'quantity': 120, 'unit_price': Decimal('4000')},
                ],
                'received_days_ago': None
            },

            # PO 9 - Draft order (DRAFT)
            {
                'supplier': suppliers['PT Minuman Berkah'],
                'order_date': today,
                'expected_delivery': today + timedelta(days=4),
                'status': 'DRAFT',
                'notes': 'Draft untuk order minggu depan',
                'items': [
                    {'item_name': 'Air Mineral Aqua 600ml', 'quantity': 180, 'unit_price': Decimal('4000')},
                    {'item_name': 'Air Mineral Aqua 1500ml', 'quantity': 100, 'unit_price': Decimal('8000')},
                ],
                'received_days_ago': None
            },
        ]

        for po_data in purchase_orders_data:
            items_data = po_data.pop('items')
            received_days_ago = po_data.pop('received_days_ago', None)

            # Check if PO already exists
            existing_po = PurchaseOrder.objects.filter(
                supplier=po_data['supplier'],
                order_date=po_data['order_date']
            ).first()

            if existing_po:
                self.stdout.write(f'  PO already exists: {existing_po.po_number}')
                continue

            # Create PO
            po = PurchaseOrder.objects.create(
                **po_data,
                created_by=admin_user
            )

            # Add items
            for item_data in items_data:
                try:
                    inventory_item = InventoryItem.objects.get(name=item_data['item_name'])
                    PurchaseOrderItem.objects.create(
                        purchase_order=po,
                        inventory_item=inventory_item,
                        quantity_ordered=item_data['quantity'],
                        unit_price=item_data['unit_price'],
                        quantity_received=item_data['quantity'] if po.status == 'RECEIVED' else 0
                    )
                except InventoryItem.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f'  Item not found: {item_data["item_name"]}'))

            # Calculate total
            po.calculate_total()

            # Mark as received if status is RECEIVED
            if po.status == 'RECEIVED' and received_days_ago is not None:
                po.received_by = admin_user
                po.received_date = timezone.now() - timedelta(days=received_days_ago)
                po.save()

                # Create stock movements for received items
                for item in po.items.all():
                    # Get current stock before movement
                    current_stock = item.inventory_item.current_stock

                    # Update stock
                    item.inventory_item.current_stock += item.quantity_received
                    item.inventory_item.last_restocked = po.received_date
                    item.inventory_item.save()

                    # Create stock movement record
                    StockMovement.objects.create(
                        inventory_item=item.inventory_item,
                        movement_type='PURCHASE',
                        quantity=item.quantity_received,
                        balance_after=item.inventory_item.current_stock,
                        reference=f'PO-{po.po_number}',
                        notes=f'Penerimaan barang dari {po.supplier.name}',
                        movement_date=po.received_date.date(),
                        created_by=admin_user
                    )

            self.stdout.write(self.style.SUCCESS(f'  Created PO: {po.po_number} ({po.status})'))

        # Create some manual stock movements (usage/adjustments)
        manual_movements_data = [
            # Daily usage movements (last 7 days)
            {
                'item_name': 'Shampoo Sachet 10ml',
                'days_ago': 1,
                'movement_type': 'USAGE',
                'quantity': -15,
                'reference': 'USAGE-DAILY',
                'notes': 'Penggunaan harian untuk kamar tamu'
            },
            {
                'item_name': 'Sabun Batangan 50gr',
                'days_ago': 1,
                'movement_type': 'USAGE',
                'quantity': -18,
                'reference': 'USAGE-DAILY',
                'notes': 'Penggunaan harian untuk kamar tamu'
            },
            {
                'item_name': 'Handuk Mandi Besar',
                'days_ago': 2,
                'movement_type': 'USAGE',
                'quantity': -12,
                'reference': 'USAGE-DAILY',
                'notes': 'Distribusi handuk untuk kamar tamu'
            },
            {
                'item_name': 'Air Mineral Aqua 600ml',
                'days_ago': 1,
                'movement_type': 'USAGE',
                'quantity': -24,
                'reference': 'USAGE-DAILY',
                'notes': 'Pengisian minibar kamar'
            },
            {
                'item_name': 'Tissue Toilet Roll',
                'days_ago': 2,
                'movement_type': 'USAGE',
                'quantity': -20,
                'reference': 'USAGE-DAILY',
                'notes': 'Penggunaan untuk kamar mandi tamu'
            },
            {
                'item_name': 'Kopi Kapal Api Sachet',
                'days_ago': 1,
                'movement_type': 'USAGE',
                'quantity': -30,
                'reference': 'USAGE-DAILY',
                'notes': 'Pengisian supplies kopi di kamar'
            },
            # Stock adjustment
            {
                'item_name': 'Selimut',
                'days_ago': 5,
                'movement_type': 'ADJUSTMENT',
                'quantity': -3,
                'reference': 'ADJ-DAMAGED',
                'notes': 'Penyesuaian stock - selimut rusak/sobek'
            },
            {
                'item_name': 'Sajadah',
                'days_ago': 7,
                'movement_type': 'ADJUSTMENT',
                'quantity': -2,
                'reference': 'ADJ-LOST',
                'notes': 'Penyesuaian stock - sajadah hilang'
            },
        ]

        for movement_data in manual_movements_data:
            try:
                item = InventoryItem.objects.get(name=movement_data['item_name'])
                movement_date = timezone.now() - timedelta(days=movement_data['days_ago'])

                # Check if movement already exists
                existing_movement = StockMovement.objects.filter(
                    inventory_item=item,
                    movement_date=movement_date.date(),
                    reference=movement_data['reference']
                ).first()

                if existing_movement:
                    continue

                # Calculate new balance - quantity is already negative for USAGE
                item.current_stock += movement_data['quantity']
                if item.current_stock < 0:
                    item.current_stock = 0

                item.save()

                # Create movement - StockMovement.quantity stores the actual value (can be negative)
                StockMovement.objects.create(
                    inventory_item=item,
                    movement_type=movement_data['movement_type'],
                    quantity=movement_data['quantity'],
                    balance_after=item.current_stock,
                    reference=movement_data['reference'],
                    notes=movement_data['notes'],
                    movement_date=movement_date.date(),
                    created_by=admin_user
                )

                self.stdout.write(f'  Created stock movement: {movement_data["item_name"]} ({movement_data["movement_type"]})')

            except InventoryItem.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'  Item not found: {movement_data["item_name"]}'))

        self.stdout.write(self.style.SUCCESS('\nWarehouse data seeding complete!'))
        self.stdout.write(f'\nSummary:')
        self.stdout.write(f'  Suppliers: {Supplier.objects.count()}')
        self.stdout.write(f'  Purchase Orders: {PurchaseOrder.objects.count()}')
        self.stdout.write(f'  PO Items: {PurchaseOrderItem.objects.count()}')
        self.stdout.write(f'  Stock Movements: {StockMovement.objects.count()}')
        self.stdout.write(f'  Inventory Items with Suppliers: {InventoryItem.objects.filter(supplier__isnull=False).count()}')
