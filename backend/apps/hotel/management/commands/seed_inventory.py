from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal
from datetime import date, timedelta
import random
from apps.inventory.models import InventoryCategory, Supplier, InventoryItem, StockMovement


class Command(BaseCommand):
    help = 'Create seed data for inventory app with Indonesian hotel supplies'

    def handle(self, *args, **options):
        self.stdout.write('Creating seed data for inventory...')
        
        with transaction.atomic():
            # Create inventory categories
            categories_data = [
                {'name': 'Amenities Kamar', 'description': 'Perlengkapan dan amenities untuk kamar tamu'},
                {'name': 'Linen & Towels', 'description': 'Seprai, handuk, dan tekstil kamar'},
                {'name': 'Cleaning Supplies', 'description': 'Peralatan dan bahan pembersih'},
                {'name': 'Food & Beverage', 'description': 'Makanan dan minuman untuk restoran'},
                {'name': 'Office Supplies', 'description': 'Perlengkapan kantor dan administrasi'},
                {'name': 'Maintenance', 'description': 'Peralatan maintenance dan perbaikan'},
                {'name': 'Kitchen Equipment', 'description': 'Peralatan dapur dan restoran'}
            ]

            for cat_data in categories_data:
                category, created = InventoryCategory.objects.get_or_create(
                    name=cat_data['name'],
                    defaults=cat_data
                )
                if created:
                    self.stdout.write(f'Created category: {category.name}')

            # Create suppliers
            suppliers_data = [
                {
                    'name': 'PT Amenities Indonesia',
                    'contact_person': 'Ibu Sari Wijaya',
                    'phone': '+62-21-5550123',
                    'email': 'sales@amenities.co.id',
                    'address': 'Jl. Industri Raya No. 45, Cakung, Jakarta Timur',
                    'city': 'Jakarta',
                    'country': 'Indonesia',
                    'payment_terms': 'Net 30'
                },
                {
                    'name': 'CV Linen Berkah',
                    'contact_person': 'Bapak Rudi Santoso',
                    'phone': '+62-21-4445678',
                    'email': 'order@linenberkah.com',
                    'address': 'Jl. Tekstil No. 78, Tanah Abang, Jakarta Pusat',
                    'city': 'Jakarta',
                    'country': 'Indonesia',
                    'payment_terms': 'Net 30'
                },
                {
                    'name': 'PT Cleaning Solution',
                    'contact_person': 'Ibu Maya Lestari',
                    'phone': '+62-21-3334567',
                    'email': 'info@cleaningsol.co.id',
                    'address': 'Jl. Kimia No. 123, Kebayoran Lama',
                    'city': 'Jakarta',
                    'country': 'Indonesia',
                    'payment_terms': 'Net 30'
                },
                {
                    'name': 'Supplier Makanan Segar',
                    'contact_person': 'Bapak Anton Kurniawan',
                    'phone': '+62-21-2223456',
                    'email': 'fresh@foodsupply.co.id',
                    'address': 'Pasar Induk Kramat Jati, Jakarta Timur',
                    'city': 'Jakarta',
                    'country': 'Indonesia',
                    'payment_terms': 'Net 30'
                },
                {
                    'name': 'Toko Perlengkapan Hotel',
                    'contact_person': 'Ibu Linda Permata',
                    'phone': '+62-21-1112345',
                    'email': 'sales@hotelsupply.com',
                    'address': 'Jl. Mangga Dua No. 56, Jakarta Utara',
                    'city': 'Jakarta',
                    'country': 'Indonesia',
                    'payment_terms': 'Net 30'
                }
            ]

            for supplier_data in suppliers_data:
                supplier, created = Supplier.objects.get_or_create(
                    name=supplier_data['name'],
                    defaults=supplier_data
                )
                if created:
                    self.stdout.write(f'Created supplier: {supplier.name}')

            # Create inventory items
            items_data = [
                # Amenities Kamar
                {'name': 'Shampoo 30ml', 'category': 'Amenities Kamar', 'supplier': 'PT Amenities Indonesia', 
                 'unit_cost': Decimal('8500.00'), 'current_stock': 500, 'minimum_stock': 100, 'unit': 'botol'},
                {'name': 'Sabun Batang', 'category': 'Amenities Kamar', 'supplier': 'PT Amenities Indonesia',
                 'unit_cost': Decimal('5000.00'), 'current_stock': 300, 'minimum_stock': 50, 'unit': 'pcs'},
                {'name': 'Pasta Gigi 20ml', 'category': 'Amenities Kamar', 'supplier': 'PT Amenities Indonesia',
                 'unit_cost': Decimal('3500.00'), 'current_stock': 400, 'minimum_stock': 80, 'unit': 'tube'},
                {'name': 'Sikat Gigi', 'category': 'Amenities Kamar', 'supplier': 'PT Amenities Indonesia',
                 'unit_cost': Decimal('2500.00'), 'current_stock': 400, 'minimum_stock': 80, 'unit': 'pcs'},
                
                # Linen & Towels
                {'name': 'Seprai King Size', 'category': 'Linen & Towels', 'supplier': 'CV Linen Berkah',
                 'unit_cost': Decimal('125000.00'), 'current_stock': 100, 'minimum_stock': 20, 'unit': 'set'},
                {'name': 'Seprai Queen Size', 'category': 'Linen & Towels', 'supplier': 'CV Linen Berkah',
                 'unit_cost': Decimal('95000.00'), 'current_stock': 150, 'minimum_stock': 30, 'unit': 'set'},
                {'name': 'Handuk Mandi Besar', 'category': 'Linen & Towels', 'supplier': 'CV Linen Berkah',
                 'unit_cost': Decimal('45000.00'), 'current_stock': 200, 'minimum_stock': 40, 'unit': 'pcs'},
                {'name': 'Handuk Kecil', 'category': 'Linen & Towels', 'supplier': 'CV Linen Berkah',
                 'unit_cost': Decimal('25000.00'), 'current_stock': 250, 'minimum_stock': 50, 'unit': 'pcs'},
                
                # Cleaning Supplies
                {'name': 'Pembersih Lantai', 'category': 'Cleaning Supplies', 'supplier': 'PT Cleaning Solution',
                 'unit_cost': Decimal('35000.00'), 'current_stock': 50, 'minimum_stock': 10, 'unit': 'botol'},
                {'name': 'Pembersih Kaca', 'category': 'Cleaning Supplies', 'supplier': 'PT Cleaning Solution',
                 'unit_cost': Decimal('25000.00'), 'current_stock': 30, 'minimum_stock': 8, 'unit': 'botol'},
                {'name': 'Tissue Roll', 'category': 'Cleaning Supplies', 'supplier': 'PT Cleaning Solution',
                 'unit_cost': Decimal('12000.00'), 'current_stock': 100, 'minimum_stock': 20, 'unit': 'roll'},
                
                # Food & Beverage
                {'name': 'Kopi Arabica 1kg', 'category': 'Food & Beverage', 'supplier': 'Supplier Makanan Segar',
                 'unit_cost': Decimal('85000.00'), 'current_stock': 25, 'minimum_stock': 5, 'unit': 'kg'},
                {'name': 'Teh Celup Premium', 'category': 'Food & Beverage', 'supplier': 'Supplier Makanan Segar',
                 'unit_cost': Decimal('45000.00'), 'current_stock': 40, 'minimum_stock': 8, 'unit': 'box'},
                {'name': 'Air Mineral 600ml', 'category': 'Food & Beverage', 'supplier': 'Supplier Makanan Segar',
                 'unit_cost': Decimal('3500.00'), 'current_stock': 500, 'minimum_stock': 100, 'unit': 'botol'},
                
                # Office Supplies
                {'name': 'Kertas A4', 'category': 'Office Supplies', 'supplier': 'Toko Perlengkapan Hotel',
                 'unit_cost': Decimal('55000.00'), 'current_stock': 30, 'minimum_stock': 5, 'unit': 'rim'},
                {'name': 'Pulpen', 'category': 'Office Supplies', 'supplier': 'Toko Perlengkapan Hotel',
                 'unit_cost': Decimal('3000.00'), 'current_stock': 100, 'minimum_stock': 20, 'unit': 'pcs'},
                
                # Kitchen Equipment
                {'name': 'Piring Dinner Set', 'category': 'Kitchen Equipment', 'supplier': 'Toko Perlengkapan Hotel',
                 'unit_cost': Decimal('35000.00'), 'current_stock': 80, 'minimum_stock': 20, 'unit': 'set'},
                {'name': 'Gelas Kaca', 'category': 'Kitchen Equipment', 'supplier': 'Toko Perlengkapan Hotel',
                 'unit_cost': Decimal('15000.00'), 'current_stock': 120, 'minimum_stock': 30, 'unit': 'pcs'}
            ]

            created_items = []
            for item_data in items_data:
                category = InventoryCategory.objects.get(name=item_data['category'])
                supplier = Supplier.objects.get(name=item_data['supplier'])
                
                item_data['category'] = category
                item_data['supplier'] = supplier
                
                item, created = InventoryItem.objects.get_or_create(
                    name=item_data['name'],
                    category=category,
                    defaults=item_data
                )
                if created:
                    created_items.append(item)
                    self.stdout.write(f'Created item: {item.name}')

            # Create stock movements for the past month
            today = date.today()
            movement_types = ['IN', 'OUT', 'ADJUSTMENT']
            reasons = {
                'IN': ['Pembelian stock baru', 'Restocking bulanan', 'Pengadaan darurat'],
                'OUT': ['Pemakaian operasional', 'Room service', 'Housekeeping'],
                'ADJUSTMENT': ['Stock opname', 'Penyesuaian stock', 'Koreksi inventory']
            }

            for item in created_items:
                # Create 3-5 movements per item in the past month
                num_movements = random.randint(3, 5)
                
                for _ in range(num_movements):
                    movement_date = today - timedelta(days=random.randint(1, 30))
                    movement_type = random.choice(movement_types)
                    
                    if movement_type == 'IN':
                        quantity = random.randint(10, 50)
                    elif movement_type == 'OUT':
                        quantity = random.randint(5, 25)
                    else:  # ADJUSTMENT
                        quantity = random.randint(1, 10)
                    
                    reason = random.choice(reasons[movement_type])
                    
                    StockMovement.objects.create(
                        item=item,
                        movement_type=movement_type,
                        quantity=quantity,
                        reason=reason,
                        reference_number=f'MOV-{random.randint(1000, 9999)}',
                        notes=f'{reason} - {item.name}'
                    )

            total_categories = InventoryCategory.objects.count()
            total_suppliers = Supplier.objects.count()
            total_items = InventoryItem.objects.count()
            total_movements = StockMovement.objects.count()
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Successfully created:\n'
                    f'- {total_categories} inventory categories\n'
                    f'- {total_suppliers} suppliers\n'
                    f'- {total_items} inventory items\n'
                    f'- {total_movements} stock movements'
                )
            )