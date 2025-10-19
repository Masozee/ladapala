from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta, time
from decimal import Decimal
import random
from apps.restaurant.models import (
    Restaurant, Branch, Staff, StaffRole, Category, Product,
    Inventory, Table, Order, OrderItem, Payment,
    KitchenOrder, Promotion, Schedule
)

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed database with Ladapala restaurant data matching frontend menu'

    def handle(self, *args, **options):
        self.stdout.write('Starting to seed Ladapala restaurant data...')

        # Clear existing data
        self.stdout.write('Clearing existing data...')
        KitchenOrder.objects.all().delete()
        OrderItem.objects.all().delete()
        Payment.objects.all().delete()
        Order.objects.all().delete()
        Table.objects.all().delete()
        Schedule.objects.all().delete()
        Promotion.objects.all().delete()
        Inventory.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()
        Staff.objects.all().delete()
        Branch.objects.all().delete()
        Restaurant.objects.all().delete()
        User.objects.filter(is_superuser=False).delete()

        # Create Ladapala Restaurant
        restaurant = Restaurant.objects.create(
            name='Ladapala',
            address='Jl. Gatot Subroto No. 88, Jakarta Selatan',
            phone='021-5559999',
            email='info@ladapala.co.id',
            is_active=True
        )
        self.stdout.write(f'Created restaurant: {restaurant.name}')

        # Create main branch
        branch = Branch.objects.create(
            restaurant=restaurant,
            name='Cabang Utama',
            address='Jl. Gatot Subroto No. 88, Jakarta Selatan',
            phone='021-5559999',
            email='jakarta@ladapala.co.id',
            is_active=True,
            opening_time=time(6, 0),
            closing_time=time(23, 0),
        )
        self.stdout.write(f'Created branch: {branch.name}')

        # Create staff users
        staff_data = [
            {'email': 'budi.admin@ladapala.co.id', 'first_name': 'Budi', 'last_name': 'Santoso', 'role': StaffRole.ADMIN, 'phone': '081234567890'},
            {'email': 'siti.manager@ladapala.co.id', 'first_name': 'Siti', 'last_name': 'Rahayu', 'role': StaffRole.MANAGER, 'phone': '081234567891'},
            {'email': 'sari.kasir@ladapala.co.id', 'first_name': 'Sari', 'last_name': 'Wulandari', 'role': StaffRole.CASHIER, 'phone': '081234567892'},
            {'email': 'andi.kasir@ladapala.co.id', 'first_name': 'Andi', 'last_name': 'Prasetyo', 'role': StaffRole.CASHIER, 'phone': '081234567893'},
            {'email': 'dewi.kasir@ladapala.co.id', 'first_name': 'Dewi', 'last_name': 'Lestari', 'role': StaffRole.CASHIER, 'phone': '081234567894'},
            {'email': 'rini.kasir@ladapala.co.id', 'first_name': 'Rini', 'last_name': 'Susanti', 'role': StaffRole.CASHIER, 'phone': '081234567895'},
            {'email': 'agus.dapur@ladapala.co.id', 'first_name': 'Agus', 'last_name': 'Hidayat', 'role': StaffRole.KITCHEN, 'phone': '081234567896'},
            {'email': 'rina.dapur@ladapala.co.id', 'first_name': 'Rina', 'last_name': 'Anggraini', 'role': StaffRole.KITCHEN, 'phone': '081234567897'},
            {'email': 'joko.gudang@ladapala.co.id', 'first_name': 'Joko', 'last_name': 'Widodo', 'role': StaffRole.WAREHOUSE, 'phone': '081234567898'},
        ]

        staff_members = []
        for data in staff_data:
            user = User.objects.create_user(
                email=data['email'],
                password='password123',
                first_name=data['first_name'],
                last_name=data['last_name']
            )
            staff = Staff.objects.create(
                user=user,
                branch=branch,
                role=data['role'],
                phone=data['phone']
            )
            staff_members.append(staff)
            self.stdout.write(f'Created staff: {user.get_full_name()} - {staff.role}')

        # Create categories matching frontend filter categories
        categories_data = [
            {'name': 'Nasi & Makanan Utama', 'description': 'Nasi dan hidangan utama', 'display_order': 1},
            {'name': 'Sarapan & Jajanan Pagi', 'description': 'Menu sarapan pagi', 'display_order': 2},
            {'name': 'Sup & Berkuah', 'description': 'Menu sup dan berkuah', 'display_order': 3},
            {'name': 'Pembuka & Camilan', 'description': 'Hidangan pembuka dan camilan', 'display_order': 4},
            {'name': 'Pencuci Mulut', 'description': 'Dessert dan hidangan manis', 'display_order': 5},
            {'name': 'Minuman', 'description': 'Minuman dingin dan panas', 'display_order': 6},
        ]

        categories = {}
        for data in categories_data:
            category = Category.objects.create(restaurant=restaurant, **data)
            categories[data['name']] = category
            self.stdout.write(f'Created category: {category.name}')

        # Create products matching frontend menu exactly
        products_data = [
            # Nasi & Makanan Utama
            {
                'category': categories['Nasi & Makanan Utama'],
                'name': 'Nasi Gudeg Jogja',
                'description': 'Nasi dengan gudeg khas Jogja, ayam kampung, telur, dan sambal krecek',
                'price': Decimal('35000'),
                'cost': Decimal('20000'),
                'preparation_time': 15,
                'image': 'products/gudeg.jpg',
                'is_available': True
            },
            {
                'category': categories['Nasi & Makanan Utama'],
                'name': 'Nasi Padang Komplit',
                'description': 'Nasi dengan rendang daging, ayam pop, gulai tunjang, dan sambal hijau',
                'price': Decimal('45000'),
                'cost': Decimal('28000'),
                'preparation_time': 20,
                'image': 'products/naspad.jpeg',
                'is_available': True
            },
            {
                'category': categories['Nasi & Makanan Utama'],
                'name': 'Nasi Liwet Solo',
                'description': 'Nasi liwet dengan ayam kampung, telur puyuh, tahu, dan sambal krecek',
                'price': Decimal('32000'),
                'cost': Decimal('18000'),
                'preparation_time': 15,
                'image': 'products/liwet.jpeg',
                'is_available': True
            },

            # Sarapan & Jajanan Pagi
            {
                'category': categories['Sarapan & Jajanan Pagi'],
                'name': 'Bubur Ayam',
                'description': 'Bubur ayam dengan suwiran ayam, kerupuk, bawang goreng, dan sambal',
                'price': Decimal('18000'),
                'cost': Decimal('10000'),
                'preparation_time': 10,
                'image': 'products/bubur.jpg',
                'is_available': True
            },
            {
                'category': categories['Sarapan & Jajanan Pagi'],
                'name': 'Lontong Sayur',
                'description': 'Lontong dengan sayur labu siam, tahu goreng, tempe, dan bumbu kelapa',
                'price': Decimal('15000'),
                'cost': Decimal('8000'),
                'preparation_time': 10,
                'image': 'products/lonsay.jpeg',
                'is_available': True
            },
            {
                'category': categories['Sarapan & Jajanan Pagi'],
                'name': 'Soto Betawi',
                'description': 'Soto dengan daging sapi, jeroan, kentang, tomat dan santan',
                'price': Decimal('28000'),
                'cost': Decimal('16000'),
                'preparation_time': 15,
                'image': 'products/sotobetawi.jpg',
                'is_available': True
            },

            # Sup & Berkuah
            {
                'category': categories['Sup & Berkuah'],
                'name': 'Sop Buntut Bakar',
                'description': 'Sup buntut sapi dengan kentang, wortel, daun bawang, dan kerupuk',
                'price': Decimal('55000'),
                'cost': Decimal('35000'),
                'preparation_time': 25,
                'image': 'products/sopbuntut.jpg',
                'is_available': True
            },
            {
                'category': categories['Sup & Berkuah'],
                'name': 'Rawon Surabaya',
                'description': 'Rawon dengan daging sapi empuk, tauge, telur asin, dan kerupuk',
                'price': Decimal('38000'),
                'cost': Decimal('22000'),
                'preparation_time': 20,
                'image': 'products/Rawon.jpg',
                'is_available': True
            },

            # Pembuka & Camilan
            {
                'category': categories['Pembuka & Camilan'],
                'name': 'Gado-gado',
                'description': 'Sayuran segar dengan bumbu kacang, kerupuk, dan lontong',
                'price': Decimal('22000'),
                'cost': Decimal('12000'),
                'preparation_time': 10,
                'image': 'products/gadogado.jpeg',
                'is_available': True
            },
            {
                'category': categories['Pembuka & Camilan'],
                'name': 'Ketoprak',
                'description': 'Tahu, lontong, tauge dengan bumbu kacang dan kerupuk',
                'price': Decimal('18000'),
                'cost': Decimal('10000'),
                'preparation_time': 10,
                'image': 'products/ketoprak.jpeg',
                'is_available': True
            },

            # Pencuci Mulut
            {
                'category': categories['Pencuci Mulut'],
                'name': 'Es Cendol Durian',
                'description': 'Es cendol dengan santan, gula merah, dan durian segar',
                'price': Decimal('20000'),
                'cost': Decimal('12000'),
                'preparation_time': 5,
                'image': 'products/cendol.jpg',
                'is_available': True
            },
            {
                'category': categories['Pencuci Mulut'],
                'name': 'Klepon Pandan',
                'description': 'Klepon pandan isi gula merah dengan kelapa parut (5 pcs)',
                'price': Decimal('15000'),
                'cost': Decimal('8000'),
                'preparation_time': 5,
                'image': 'products/klepon.jpg',
                'is_available': True
            },

            # Minuman
            {
                'category': categories['Minuman'],
                'name': 'Es Teh Manis',
                'description': 'Teh manis dingin khas Jogja dengan gula batu',
                'price': Decimal('8000'),
                'cost': Decimal('3000'),
                'preparation_time': 2,
                'image': 'products/esteh.jpg',
                'is_available': True
            },
            {
                'category': categories['Minuman'],
                'name': 'Jus Alpukat',
                'description': 'Jus alpukat murni dengan susu kental manis',
                'price': Decimal('18000'),
                'cost': Decimal('10000'),
                'preparation_time': 5,
                'image': 'products/jusalpukat.jpg',
                'is_available': True
            },
            {
                'category': categories['Minuman'],
                'name': 'Wedang Jahe Merah',
                'description': 'Minuman hangat jahe merah dengan gula aren',
                'price': Decimal('12000'),
                'cost': Decimal('6000'),
                'preparation_time': 5,
                'image': 'products/wedang.jpg',
                'is_available': True
            },
        ]

        products = []
        for data in products_data:
            product = Product.objects.create(restaurant=restaurant, **data)
            products.append(product)
            self.stdout.write(f'Created product: {product.name} - Rp {product.price}')

        # Create tables matching frontend data (15 tables)
        for i in range(1, 16):
            capacity = 4 if i <= 10 else 6 if i <= 13 else 8
            Table.objects.create(
                branch=branch,
                number=str(i),
                capacity=capacity,
                is_available=i not in [2, 3, 4, 5, 7, 8, 10, 12, 15]  # Match unpaid tables
            )
        self.stdout.write(f'Created 15 tables for {branch.name}')

        # Create sample orders matching frontend dashboard data
        indonesian_names = [
            'Andi Wijaya', 'Siti Nurhaliza', 'Budi Santoso', 'Dewi Lestari',
            'Ahmad Fauzi', 'Rina Susanti', 'Joko Prasetyo', 'Maya Anggraini',
            'Hasan Abdullah', 'Fatimah Zahra', 'Bambang Pamungkas', 'Nur Aini'
        ]

        # Create unpaid table orders (dining in progress)
        unpaid_tables_data = [
            {'table_number': '5', 'items': [
                ('Nasi Gudeg Jogja', 2), ('Ayam Bakar', 1), ('Es Teh Manis', 3)
            ], 'customer': 'Andi Wijaya', 'time_ago': 45},
            {'table_number': '12', 'items': [
                ('Soto Betawi', 2), ('Es Cendol Durian', 2)
            ], 'customer': 'Siti Nurhaliza', 'time_ago': 32},
            {'table_number': '3', 'items': [
                ('Nasi Padang Komplit', 2), ('Nasi Liwet Solo', 2), ('Jus Alpukat', 4)
            ], 'customer': 'Budi Santoso', 'time_ago': 75},
            {'table_number': '8', 'items': [
                ('Gado-gado', 2), ('Lontong Sayur', 1), ('Wedang Jahe Merah', 2)
            ], 'customer': 'Dewi Lestari', 'time_ago': 28},
            {'table_number': '15', 'items': [
                ('Bubur Ayam', 1), ('Es Teh Manis', 2)
            ], 'customer': 'Ahmad Fauzi', 'time_ago': 18},
            {'table_number': '7', 'items': [
                ('Sop Buntut Bakar', 1), ('Nasi Liwet Solo', 3), ('Es Teh Manis', 3)
            ], 'customer': 'Rina Susanti', 'time_ago': 52},
            {'table_number': '10', 'items': [
                ('Rawon Surabaya', 2), ('Ketoprak', 1), ('Es Teh Manis', 3)
            ], 'customer': 'Joko Prasetyo', 'time_ago': 24},
        ]

        tables = {str(t.number): t for t in Table.objects.filter(branch=branch)}
        products_map = {p.name: p for p in products}
        cashier_staff = [s for s in staff_members if s.role == StaffRole.CASHIER]

        for unpaid_data in unpaid_tables_data:
            table = tables.get(unpaid_data['table_number'])
            if not table:
                continue

            order = Order.objects.create(
                branch=branch,
                table=table,
                order_type='DINE_IN',
                status='CONFIRMED',
                customer_name=unpaid_data['customer'],
                customer_phone=f"0812{random.randint(10000000, 99999999)}",
                created_by=random.choice(cashier_staff),
                created_at=timezone.now() - timedelta(minutes=unpaid_data['time_ago'])
            )

            for item_name, qty in unpaid_data['items']:
                product = products_map.get(item_name)
                if product:
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=qty,
                        unit_price=product.price,
                        discount_amount=Decimal('0')
                    )

            table.is_available = False
            table.save()

        self.stdout.write('Created unpaid table orders')

        # Create recent orders for dashboard
        recent_orders_data = [
            {'table': '2', 'status': 'PREPARING', 'items': [('Nasi Gudeg Jogja', 2), ('Es Teh Manis', 2)], 'waiter': 'Sari', 'time_ago': 25},
            {'table': '6', 'status': 'READY', 'items': [('Nasi Padang Komplit', 2), ('Nasi Liwet Solo', 1), ('Jus Alpukat', 3)], 'waiter': 'Budi', 'time_ago': 30},
            {'table': 'Take Away', 'status': 'COMPLETED', 'items': [('Bubur Ayam', 2), ('Es Teh Manis', 2)], 'waiter': 'Andi', 'time_ago': 35},
            {'table': '4', 'status': 'PENDING', 'items': [('Soto Betawi', 2), ('Es Cendol Durian', 3)], 'waiter': 'Dewi', 'time_ago': 40},
            {'table': '9', 'status': 'PREPARING', 'items': [('Sop Buntut Bakar', 1), ('Nasi Liwet Solo', 3)], 'waiter': 'Rini', 'time_ago': 45},
        ]

        for order_data in recent_orders_data:
            table = tables.get(order_data['table']) if order_data['table'] != 'Take Away' else None
            order_type = 'DINE_IN' if table else 'TAKEAWAY'

            order = Order.objects.create(
                branch=branch,
                table=table,
                order_type=order_type,
                status=order_data['status'],
                customer_name=random.choice(indonesian_names),
                customer_phone=f"0813{random.randint(10000000, 99999999)}",
                created_by=random.choice(cashier_staff),
                created_at=timezone.now() - timedelta(minutes=order_data['time_ago'])
            )

            for item_name, qty in order_data['items']:
                product = products_map.get(item_name)
                if product:
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=qty,
                        unit_price=product.price,
                        discount_amount=Decimal('0')
                    )

            # Create payment for completed orders
            if order.status == 'COMPLETED':
                Payment.objects.create(
                    order=order,
                    amount=order.total_amount,
                    payment_method='CASH',
                    status='COMPLETED',
                    processed_by=random.choice(cashier_staff)
                )

            # Create kitchen order for preparing/ready orders (check if doesn't exist)
            if order.status in ['PREPARING', 'READY']:
                if not hasattr(order, 'kitchen_order'):
                    kitchen_staff = [s for s in staff_members if s.role == StaffRole.KITCHEN]
                    KitchenOrder.objects.create(
                        order=order,
                        status='PREPARING' if order.status == 'PREPARING' else 'READY',
                        priority=1,
                        assigned_to=random.choice(kitchen_staff) if kitchen_staff else None
                    )

        self.stdout.write('Created recent orders')

        # Create inventory items (WAREHOUSE location for PO system)
        inventory_items = [
            {'name': 'Beras Premium', 'unit': 'kg', 'quantity': 0, 'min_quantity': 30, 'cost_per_unit': 0, 'location': 'WAREHOUSE'},
            {'name': 'Daging Sapi', 'unit': 'kg', 'quantity': 0, 'min_quantity': 10, 'cost_per_unit': 0, 'location': 'WAREHOUSE'},
            {'name': 'Ayam Kampung', 'unit': 'ekor', 'quantity': 0, 'min_quantity': 10, 'cost_per_unit': 0, 'location': 'WAREHOUSE'},
            {'name': 'Minyak Goreng', 'unit': 'liter', 'quantity': 0, 'min_quantity': 15, 'cost_per_unit': 0, 'location': 'WAREHOUSE'},
            {'name': 'Cabai Merah', 'unit': 'kg', 'quantity': 0, 'min_quantity': 5, 'cost_per_unit': 0, 'location': 'WAREHOUSE'},
            {'name': 'Bawang Merah', 'unit': 'kg', 'quantity': 0, 'min_quantity': 8, 'cost_per_unit': 0, 'location': 'WAREHOUSE'},
            {'name': 'Santan Kelapa', 'unit': 'liter', 'quantity': 0, 'min_quantity': 10, 'cost_per_unit': 0, 'location': 'WAREHOUSE'},
            {'name': 'Gula Merah', 'unit': 'kg', 'quantity': 0, 'min_quantity': 5, 'cost_per_unit': 0, 'location': 'WAREHOUSE'},
            {'name': 'Durian', 'unit': 'kg', 'quantity': 0, 'min_quantity': 5, 'cost_per_unit': 0, 'location': 'WAREHOUSE'},
            {'name': 'Alpukat', 'unit': 'kg', 'quantity': 0, 'min_quantity': 5, 'cost_per_unit': 0, 'location': 'WAREHOUSE'},
        ]

        for data in inventory_items:
            Inventory.objects.create(branch=branch, **data)
        self.stdout.write('Created inventory items (quantities and costs will be set by PO receipts)')

        # Create promotion
        Promotion.objects.create(
            restaurant=restaurant,
            name='Promo Spesial Ramadhan',
            description='Diskon 15% untuk semua menu selama bulan Ramadhan',
            promo_code='RAMADHAN2024',
            discount_type='PERCENTAGE',
            discount_value=Decimal('15'),
            min_order_amount=Decimal('50000'),
            promo_type='ORDER',
            start_date=timezone.now() - timedelta(days=5),
            end_date=timezone.now() + timedelta(days=25),
            usage_limit=500,
            is_active=True
        )
        self.stdout.write('Created promotion')

        self.stdout.write(self.style.SUCCESS('\n✓ Successfully seeded Ladapala restaurant data!'))

        # Print summary
        self.stdout.write('\n=== Seed Data Summary ===')
        self.stdout.write(f'Restaurant: {Restaurant.objects.count()}')
        self.stdout.write(f'Branch: {Branch.objects.count()}')
        self.stdout.write(f'Staff: {Staff.objects.count()}')
        self.stdout.write(f'Categories: {Category.objects.count()}')
        self.stdout.write(f'Products: {Product.objects.count()}')
        self.stdout.write(f'Tables: {Table.objects.count()}')
        self.stdout.write(f'Orders: {Order.objects.count()}')
        self.stdout.write(f'Order Items: {OrderItem.objects.count()}')
        self.stdout.write(f'Inventory Items: {Inventory.objects.count()}')
        self.stdout.write(f'Promotions: {Promotion.objects.count()}')
        self.stdout.write('\n=== Login Credentials ===')
        self.stdout.write('All staff accounts use password: password123')
        self.stdout.write('Admin: budi.admin@ladapala.co.id')
        self.stdout.write('Manager: siti.manager@ladapala.co.id')
        self.stdout.write('Cashiers: sari.kasir, andi.kasir, dewi.kasir, rini.kasir')
        self.stdout.write('Kitchen: agus.dapur, rina.dapur')
        self.stdout.write('Warehouse: joko.gudang')
