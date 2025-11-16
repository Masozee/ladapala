from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import datetime, timedelta, time
from decimal import Decimal
import random
from apps.restaurant.models import (
    Restaurant, Branch, Staff, StaffRole, Category, Product,
    Inventory, Table, Order, OrderItem, Payment, 
    KitchenOrder, Promotion, Schedule
)


class Command(BaseCommand):
    help = 'Seed database with Indonesian restaurant data'

    def handle(self, *args, **options):
        self.stdout.write('Starting to seed Indonesian restaurant data...')
        
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
        
        # Create restaurants
        restaurants_data = [
            {
                'name': 'Warung Padang Sederhana',
                'address': 'Jl. Sudirman No. 123, Jakarta Pusat',
                'phone': '021-5551234',
                'email': 'info@padangsederhana.co.id',
            },
            {
                'name': 'Rumah Makan Sunda Asli',
                'address': 'Jl. Asia Afrika No. 45, Bandung',
                'phone': '022-5556789',
                'email': 'contact@sundaasli.co.id',
            }
        ]
        
        restaurants = []
        for data in restaurants_data:
            restaurant = Restaurant.objects.create(**data)
            restaurants.append(restaurant)
            self.stdout.write(f'Created restaurant: {restaurant.name}')
        
        # Create branches
        branches_data = [
            # Warung Padang Sederhana branches
            {
                'restaurant': restaurants[0],
                'name': 'Cabang Senayan',
                'address': 'Jl. Senayan No. 10, Jakarta Selatan',
                'phone': '021-5552345',
                'email': 'senayan@padangsederhana.co.id',
                'opening_time': time(8, 0),
                'closing_time': time(22, 0),
            },
            {
                'restaurant': restaurants[0],
                'name': 'Cabang Kelapa Gading',
                'address': 'Jl. Boulevard Raya No. 20, Jakarta Utara',
                'phone': '021-5553456',
                'email': 'kelapagading@padangsederhana.co.id',
                'opening_time': time(9, 0),
                'closing_time': time(21, 30),
            },
            # Rumah Makan Sunda Asli branches
            {
                'restaurant': restaurants[1],
                'name': 'Cabang Dago',
                'address': 'Jl. Ir. H. Juanda No. 100, Bandung',
                'phone': '022-5557890',
                'email': 'dago@sundaasli.co.id',
                'opening_time': time(7, 0),
                'closing_time': time(22, 0),
            },
            {
                'restaurant': restaurants[1],
                'name': 'Cabang Cihampelas',
                'address': 'Jl. Cihampelas No. 50, Bandung',
                'phone': '022-5558901',
                'email': 'cihampelas@sundaasli.co.id',
                'opening_time': time(10, 0),
                'closing_time': time(23, 0),
            }
        ]
        
        branches = []
        for data in branches_data:
            branch = Branch.objects.create(**data)
            branches.append(branch)
            self.stdout.write(f'Created branch: {branch.name}')
        
        # Create users and staff
        staff_data = [
            # Branch 1 staff
            {'username': 'budi_admin', 'first_name': 'Budi', 'last_name': 'Santoso', 'branch': branches[0], 'role': StaffRole.ADMIN, 'phone': '081234567890'},
            {'username': 'siti_manager', 'first_name': 'Siti', 'last_name': 'Rahayu', 'branch': branches[0], 'role': StaffRole.MANAGER, 'phone': '081234567891'},
            {'username': 'ahmad_kasir', 'first_name': 'Ahmad', 'last_name': 'Hidayat', 'branch': branches[0], 'role': StaffRole.CASHIER, 'phone': '081234567892'},
            {'username': 'dewi_kasir', 'first_name': 'Dewi', 'last_name': 'Lestari', 'branch': branches[0], 'role': StaffRole.CASHIER, 'phone': '081234567893'},
            {'username': 'agus_dapur', 'first_name': 'Agus', 'last_name': 'Prasetyo', 'branch': branches[0], 'role': StaffRole.KITCHEN, 'phone': '081234567894'},
            {'username': 'rina_dapur', 'first_name': 'Rina', 'last_name': 'Wulandari', 'branch': branches[0], 'role': StaffRole.KITCHEN, 'phone': '081234567895'},
            {'username': 'joko_gudang', 'first_name': 'Joko', 'last_name': 'Widodo', 'branch': branches[0], 'role': StaffRole.WAREHOUSE, 'phone': '081234567896'},
            
            # Branch 2 staff
            {'username': 'hasan_manager', 'first_name': 'Hasan', 'last_name': 'Abdullah', 'branch': branches[1], 'role': StaffRole.MANAGER, 'phone': '081234567897'},
            {'username': 'fatimah_kasir', 'first_name': 'Fatimah', 'last_name': 'Zahra', 'branch': branches[1], 'role': StaffRole.CASHIER, 'phone': '081234567898'},
            {'username': 'umar_dapur', 'first_name': 'Umar', 'last_name': 'Bakri', 'branch': branches[1], 'role': StaffRole.KITCHEN, 'phone': '081234567899'},
            
            # Branch 3 staff
            {'username': 'asep_manager', 'first_name': 'Asep', 'last_name': 'Sunandar', 'branch': branches[2], 'role': StaffRole.MANAGER, 'phone': '081234567900'},
            {'username': 'neng_kasir', 'first_name': 'Neng', 'last_name': 'Geulis', 'branch': branches[2], 'role': StaffRole.CASHIER, 'phone': '081234567901'},
            {'username': 'ujang_dapur', 'first_name': 'Ujang', 'last_name': 'Suryana', 'branch': branches[2], 'role': StaffRole.KITCHEN, 'phone': '081234567902'},
            
            # Branch 4 staff
            {'username': 'dedi_manager', 'first_name': 'Dedi', 'last_name': 'Kurniawan', 'branch': branches[3], 'role': StaffRole.MANAGER, 'phone': '081234567903'},
            {'username': 'maya_kasir', 'first_name': 'Maya', 'last_name': 'Anggraini', 'branch': branches[3], 'role': StaffRole.CASHIER, 'phone': '081234567904'},
            {'username': 'cecep_dapur', 'first_name': 'Cecep', 'last_name': 'Hermawan', 'branch': branches[3], 'role': StaffRole.KITCHEN, 'phone': '081234567905'},
        ]
        
        staff_members = []
        for data in staff_data:
            user = User.objects.create_user(
                username=data['username'],
                password='password123',
                first_name=data['first_name'],
                last_name=data['last_name'],
                email=f"{data['username']}@ladapala.co.id"
            )
            staff = Staff.objects.create(
                user=user,
                branch=data['branch'],
                role=data['role'],
                phone=data['phone']
            )
            staff_members.append(staff)
            self.stdout.write(f'Created staff: {user.get_full_name()} - {staff.role}')
        
        # Create categories for Warung Padang
        padang_categories = [
            {'name': 'Nasi', 'description': 'Aneka nasi dan nasi campur', 'display_order': 1},
            {'name': 'Lauk Daging', 'description': 'Lauk pauk berbahan daging', 'display_order': 2},
            {'name': 'Lauk Ayam', 'description': 'Lauk pauk berbahan ayam', 'display_order': 3},
            {'name': 'Lauk Ikan', 'description': 'Lauk pauk berbahan ikan dan seafood', 'display_order': 4},
            {'name': 'Sayuran', 'description': 'Aneka sayur dan tumisan', 'display_order': 5},
            {'name': 'Minuman', 'description': 'Minuman dingin dan panas', 'display_order': 6},
            {'name': 'Makanan Ringan', 'description': 'Gorengan dan camilan', 'display_order': 7},
        ]
        
        categories_padang = []
        for data in padang_categories:
            category = Category.objects.create(restaurant=restaurants[0], **data)
            categories_padang.append(category)
            self.stdout.write(f'Created category: {category.name}')
        
        # Create categories for Rumah Makan Sunda
        sunda_categories = [
            {'name': 'Nasi', 'description': 'Aneka nasi dan nasi liwet', 'display_order': 1},
            {'name': 'Lauk Pauk', 'description': 'Lauk pauk khas Sunda', 'display_order': 2},
            {'name': 'Ikan Bakar', 'description': 'Aneka ikan bakar dan goreng', 'display_order': 3},
            {'name': 'Sayur Asem', 'description': 'Sayur asem dan lalap', 'display_order': 4},
            {'name': 'Sambal', 'description': 'Aneka sambal khas', 'display_order': 5},
            {'name': 'Minuman', 'description': 'Minuman tradisional', 'display_order': 6},
            {'name': 'Kue Tradisional', 'description': 'Kue dan jajanan Sunda', 'display_order': 7},
        ]
        
        categories_sunda = []
        for data in sunda_categories:
            category = Category.objects.create(restaurant=restaurants[1], **data)
            categories_sunda.append(category)
            self.stdout.write(f'Created category: {category.name}')
        
        # Create products for Warung Padang
        padang_products = [
            # Nasi
            {'category': categories_padang[0], 'name': 'Nasi Putih', 'description': 'Nasi putih hangat', 'price': 8000, 'cost': 3000, 'preparation_time': 2},
            {'category': categories_padang[0], 'name': 'Nasi Uduk', 'description': 'Nasi uduk dengan santan', 'price': 10000, 'cost': 4000, 'preparation_time': 3},
            {'category': categories_padang[0], 'name': 'Nasi Kuning', 'description': 'Nasi kuning kunyit', 'price': 10000, 'cost': 4000, 'preparation_time': 3},
            
            # Lauk Daging
            {'category': categories_padang[1], 'name': 'Rendang Daging', 'description': 'Rendang daging sapi khas Padang', 'price': 35000, 'cost': 20000, 'preparation_time': 5},
            {'category': categories_padang[1], 'name': 'Dendeng Balado', 'description': 'Dendeng sapi dengan balado', 'price': 30000, 'cost': 18000, 'preparation_time': 10},
            {'category': categories_padang[1], 'name': 'Gulai Kambing', 'description': 'Gulai kambing dengan rempah', 'price': 40000, 'cost': 25000, 'preparation_time': 15},
            {'category': categories_padang[1], 'name': 'Sate Padang', 'description': 'Sate daging dengan kuah khas Padang', 'price': 25000, 'cost': 15000, 'preparation_time': 10},
            
            # Lauk Ayam
            {'category': categories_padang[2], 'name': 'Ayam Pop', 'description': 'Ayam pop khas Padang', 'price': 25000, 'cost': 15000, 'preparation_time': 15},
            {'category': categories_padang[2], 'name': 'Ayam Gulai', 'description': 'Ayam gulai santan', 'price': 23000, 'cost': 13000, 'preparation_time': 10},
            {'category': categories_padang[2], 'name': 'Ayam Balado', 'description': 'Ayam goreng balado', 'price': 25000, 'cost': 14000, 'preparation_time': 12},
            {'category': categories_padang[2], 'name': 'Ayam Bakar', 'description': 'Ayam bakar bumbu Padang', 'price': 27000, 'cost': 16000, 'preparation_time': 20},
            
            # Lauk Ikan
            {'category': categories_padang[3], 'name': 'Ikan Mas Gulai', 'description': 'Ikan mas gulai kuning', 'price': 30000, 'cost': 18000, 'preparation_time': 15},
            {'category': categories_padang[3], 'name': 'Ikan Kembung Balado', 'description': 'Ikan kembung goreng balado', 'price': 20000, 'cost': 12000, 'preparation_time': 10},
            {'category': categories_padang[3], 'name': 'Udang Balado', 'description': 'Udang goreng dengan sambal balado', 'price': 35000, 'cost': 22000, 'preparation_time': 12},
            {'category': categories_padang[3], 'name': 'Cumi Hitam', 'description': 'Cumi masak hitam khas Padang', 'price': 32000, 'cost': 20000, 'preparation_time': 15},
            
            # Sayuran
            {'category': categories_padang[4], 'name': 'Sayur Nangka', 'description': 'Gulai nangka muda', 'price': 12000, 'cost': 5000, 'preparation_time': 10},
            {'category': categories_padang[4], 'name': 'Daun Singkong', 'description': 'Daun singkong santan', 'price': 10000, 'cost': 4000, 'preparation_time': 8},
            {'category': categories_padang[4], 'name': 'Tumis Kangkung', 'description': 'Kangkung tumis belacan', 'price': 12000, 'cost': 5000, 'preparation_time': 5},
            {'category': categories_padang[4], 'name': 'Terong Balado', 'description': 'Terong goreng balado', 'price': 10000, 'cost': 4000, 'preparation_time': 8},
            
            # Minuman
            {'category': categories_padang[5], 'name': 'Teh Talua', 'description': 'Teh telur khas Padang', 'price': 15000, 'cost': 7000, 'preparation_time': 5},
            {'category': categories_padang[5], 'name': 'Es Tebak', 'description': 'Minuman segar dengan santan', 'price': 12000, 'cost': 5000, 'preparation_time': 3},
            {'category': categories_padang[5], 'name': 'Jus Alpukat', 'description': 'Jus alpukat segar', 'price': 18000, 'cost': 10000, 'preparation_time': 5},
            {'category': categories_padang[5], 'name': 'Es Cincau', 'description': 'Es cincau hijau', 'price': 10000, 'cost': 4000, 'preparation_time': 2},
            
            # Makanan Ringan
            {'category': categories_padang[6], 'name': 'Perkedel', 'description': 'Perkedel kentang', 'price': 5000, 'cost': 2000, 'preparation_time': 10},
            {'category': categories_padang[6], 'name': 'Kerupuk Jangek', 'description': 'Kerupuk kulit khas Padang', 'price': 8000, 'cost': 3000, 'preparation_time': 1},
            {'category': categories_padang[6], 'name': 'Risoles', 'description': 'Risoles sayur', 'price': 7000, 'cost': 3000, 'preparation_time': 5},
        ]
        
        for data in padang_products:
            product = Product.objects.create(restaurant=restaurants[0], **data)
            self.stdout.write(f'Created product: {product.name}')
        
        # Create products for Rumah Makan Sunda
        sunda_products = [
            # Nasi
            {'category': categories_sunda[0], 'name': 'Nasi Putih', 'description': 'Nasi putih pulen', 'price': 7000, 'cost': 3000, 'preparation_time': 2},
            {'category': categories_sunda[0], 'name': 'Nasi Liwet', 'description': 'Nasi liwet dengan teri dan pete', 'price': 15000, 'cost': 7000, 'preparation_time': 15},
            {'category': categories_sunda[0], 'name': 'Nasi Tutug Oncom', 'description': 'Nasi campur oncom bakar', 'price': 12000, 'cost': 5000, 'preparation_time': 10},
            
            # Lauk Pauk
            {'category': categories_sunda[1], 'name': 'Ayam Goreng Kampung', 'description': 'Ayam kampung goreng lengkuas', 'price': 28000, 'cost': 18000, 'preparation_time': 15},
            {'category': categories_sunda[1], 'name': 'Empal Gepuk', 'description': 'Daging sapi gepuk manis', 'price': 35000, 'cost': 22000, 'preparation_time': 20},
            {'category': categories_sunda[1], 'name': 'Pepes Tahu', 'description': 'Tahu kukus daun pisang', 'price': 8000, 'cost': 3000, 'preparation_time': 10},
            {'category': categories_sunda[1], 'name': 'Tempe Goreng', 'description': 'Tempe goreng tepung', 'price': 6000, 'cost': 2500, 'preparation_time': 5},
            {'category': categories_sunda[1], 'name': 'Tahu Sumedang', 'description': 'Tahu goreng khas Sumedang', 'price': 10000, 'cost': 4000, 'preparation_time': 5},
            
            # Ikan Bakar
            {'category': categories_sunda[2], 'name': 'Gurame Bakar', 'description': 'Ikan gurame bakar kecap', 'price': 45000, 'cost': 30000, 'preparation_time': 25},
            {'category': categories_sunda[2], 'name': 'Ikan Mas Goreng', 'description': 'Ikan mas goreng garing', 'price': 35000, 'cost': 22000, 'preparation_time': 20},
            {'category': categories_sunda[2], 'name': 'Ikan Nila Bakar', 'description': 'Nila bakar sambal kecap', 'price': 30000, 'cost': 18000, 'preparation_time': 20},
            {'category': categories_sunda[2], 'name': 'Pepes Ikan Mas', 'description': 'Ikan mas pepes daun pisang', 'price': 32000, 'cost': 20000, 'preparation_time': 25},
            
            # Sayur Asem
            {'category': categories_sunda[3], 'name': 'Sayur Asem', 'description': 'Sayur asem dengan jagung dan kacang panjang', 'price': 10000, 'cost': 4000, 'preparation_time': 10},
            {'category': categories_sunda[3], 'name': 'Lalap Mentah', 'description': 'Lalapan segar dengan sambal', 'price': 8000, 'cost': 3000, 'preparation_time': 2},
            {'category': categories_sunda[3], 'name': 'Tumis Kangkung', 'description': 'Kangkung tumis terasi', 'price': 12000, 'cost': 5000, 'preparation_time': 5},
            {'category': categories_sunda[3], 'name': 'Karedok', 'description': 'Sayur mentah dengan bumbu kacang', 'price': 15000, 'cost': 7000, 'preparation_time': 10},
            
            # Sambal
            {'category': categories_sunda[4], 'name': 'Sambal Terasi', 'description': 'Sambal terasi pedas', 'price': 5000, 'cost': 2000, 'preparation_time': 5},
            {'category': categories_sunda[4], 'name': 'Sambal Oncom', 'description': 'Sambal oncom mentah', 'price': 5000, 'cost': 2000, 'preparation_time': 5},
            {'category': categories_sunda[4], 'name': 'Sambal Hijau', 'description': 'Sambal cabai hijau', 'price': 5000, 'cost': 2000, 'preparation_time': 5},
            
            # Minuman
            {'category': categories_sunda[5], 'name': 'Es Cendol', 'description': 'Es cendol dengan santan dan gula merah', 'price': 12000, 'cost': 5000, 'preparation_time': 5},
            {'category': categories_sunda[5], 'name': 'Bajigur', 'description': 'Minuman hangat santan jahe', 'price': 10000, 'cost': 4000, 'preparation_time': 5},
            {'category': categories_sunda[5], 'name': 'Es Doger', 'description': 'Es serut dengan tape dan kelapa', 'price': 15000, 'cost': 7000, 'preparation_time': 5},
            {'category': categories_sunda[5], 'name': 'Bandrek', 'description': 'Minuman jahe hangat', 'price': 8000, 'cost': 3000, 'preparation_time': 5},
            
            # Kue Tradisional
            {'category': categories_sunda[6], 'name': 'Surabi', 'description': 'Surabi oncom atau keju', 'price': 10000, 'cost': 4000, 'preparation_time': 10},
            {'category': categories_sunda[6], 'name': 'Cireng', 'description': 'Aci goreng dengan bumbu rujak', 'price': 8000, 'cost': 3000, 'preparation_time': 10},
            {'category': categories_sunda[6], 'name': 'Combro', 'description': 'Singkong goreng isi oncom', 'price': 5000, 'cost': 2000, 'preparation_time': 10},
            {'category': categories_sunda[6], 'name': 'Misro', 'description': 'Singkong goreng isi gula merah', 'price': 5000, 'cost': 2000, 'preparation_time': 10},
        ]
        
        for data in sunda_products:
            product = Product.objects.create(restaurant=restaurants[1], **data)
            self.stdout.write(f'Created product: {product.name}')
        
        # Create inventory items for branches
        inventory_items = [
            # Branch 1 inventory
            {'branch': branches[0], 'name': 'Beras Premium', 'unit': 'kg', 'quantity': 100, 'min_quantity': 20, 'cost_per_unit': 12000, 'supplier': 'CV Beras Nusantara'},
            {'branch': branches[0], 'name': 'Daging Sapi', 'unit': 'kg', 'quantity': 50, 'min_quantity': 10, 'cost_per_unit': 120000, 'supplier': 'PT Meat Supplier'},
            {'branch': branches[0], 'name': 'Ayam Kampung', 'unit': 'ekor', 'quantity': 30, 'min_quantity': 10, 'cost_per_unit': 45000, 'supplier': 'Peternakan Jaya'},
            {'branch': branches[0], 'name': 'Minyak Goreng', 'unit': 'liter', 'quantity': 40, 'min_quantity': 10, 'cost_per_unit': 14000, 'supplier': 'PT Sinar Mas'},
            {'branch': branches[0], 'name': 'Cabai Merah', 'unit': 'kg', 'quantity': 20, 'min_quantity': 5, 'cost_per_unit': 40000, 'supplier': 'Pasar Induk'},
            {'branch': branches[0], 'name': 'Bawang Merah', 'unit': 'kg', 'quantity': 25, 'min_quantity': 5, 'cost_per_unit': 35000, 'supplier': 'Pasar Induk'},
            {'branch': branches[0], 'name': 'Bawang Putih', 'unit': 'kg', 'quantity': 20, 'min_quantity': 5, 'cost_per_unit': 30000, 'supplier': 'Pasar Induk'},
            {'branch': branches[0], 'name': 'Santan Kelapa', 'unit': 'liter', 'quantity': 30, 'min_quantity': 10, 'cost_per_unit': 8000, 'supplier': 'CV Kelapa Mas'},
            
            # Branch 2 inventory
            {'branch': branches[1], 'name': 'Beras', 'unit': 'kg', 'quantity': 80, 'min_quantity': 20, 'cost_per_unit': 11000, 'supplier': 'CV Beras Sejahtera'},
            {'branch': branches[1], 'name': 'Daging Kambing', 'unit': 'kg', 'quantity': 30, 'min_quantity': 10, 'cost_per_unit': 140000, 'supplier': 'PT Meat Supplier'},
            {'branch': branches[1], 'name': 'Ikan Mas', 'unit': 'kg', 'quantity': 25, 'min_quantity': 10, 'cost_per_unit': 35000, 'supplier': 'Tambak Ikan Segar'},
            {'branch': branches[1], 'name': 'Tempe', 'unit': 'papan', 'quantity': 50, 'min_quantity': 20, 'cost_per_unit': 5000, 'supplier': 'Koperasi Tempe'},
            
            # Branch 3 inventory
            {'branch': branches[2], 'name': 'Beras', 'unit': 'kg', 'quantity': 90, 'min_quantity': 20, 'cost_per_unit': 11000, 'supplier': 'CV Beras Makmur'},
            {'branch': branches[2], 'name': 'Ikan Gurame', 'unit': 'ekor', 'quantity': 20, 'min_quantity': 5, 'cost_per_unit': 60000, 'supplier': 'Tambak Ikan Segar'},
            {'branch': branches[2], 'name': 'Kangkung', 'unit': 'ikat', 'quantity': 40, 'min_quantity': 20, 'cost_per_unit': 3000, 'supplier': 'Pasar Induk'},
            {'branch': branches[2], 'name': 'Tahu Sumedang', 'unit': 'kotak', 'quantity': 30, 'min_quantity': 10, 'cost_per_unit': 15000, 'supplier': 'Pabrik Tahu Sumedang'},
            
            # Branch 4 inventory
            {'branch': branches[3], 'name': 'Beras', 'unit': 'kg', 'quantity': 70, 'min_quantity': 20, 'cost_per_unit': 11000, 'supplier': 'CV Beras Prima'},
            {'branch': branches[3], 'name': 'Oncom', 'unit': 'papan', 'quantity': 40, 'min_quantity': 15, 'cost_per_unit': 4000, 'supplier': 'Produsen Oncom Bandung'},
            {'branch': branches[3], 'name': 'Daun Pisang', 'unit': 'lembar', 'quantity': 100, 'min_quantity': 30, 'cost_per_unit': 1000, 'supplier': 'Kebun Pisang'},
            {'branch': branches[3], 'name': 'Gula Merah', 'unit': 'kg', 'quantity': 25, 'min_quantity': 10, 'cost_per_unit': 18000, 'supplier': 'CV Gula Aren'},
        ]
        
        for data in inventory_items:
            inventory = Inventory.objects.create(**data)
            self.stdout.write(f'Created inventory: {inventory.name} for {inventory.branch.name}')
        
        # Create tables for each branch
        for branch in branches:
            num_tables = 15 if branch == branches[0] else 12 if branch == branches[1] else 10
            for i in range(1, num_tables + 1):
                capacity = random.choice([2, 4, 4, 6, 6, 8]) if i <= 10 else 10
                table = Table.objects.create(
                    branch=branch,
                    number=str(i),
                    capacity=capacity
                )
            self.stdout.write(f'Created {num_tables} tables for {branch.name}')
        
        # Create sample orders with Indonesian customer names
        indonesian_names = [
            'Andi Wijaya', 'Siti Nurhaliza', 'Budi Santoso', 'Dewi Lestari',
            'Ahmad Fauzi', 'Rina Susanti', 'Joko Prasetyo', 'Maya Anggraini',
            'Hasan Abdullah', 'Fatimah Zahra', 'Umar Bakri', 'Neng Geulis',
            'Asep Sunandar', 'Ujang Suryana', 'Dedi Kurniawan', 'Cecep Hermawan',
            'Agus Hidayat', 'Sri Wahyuni', 'Bambang Pamungkas', 'Nur Aini'
        ]
        
        phone_prefixes = ['0812', '0813', '0815', '0816', '0817', '0818', '0819', '0821', '0822', '0823']
        
        # Create recent orders for branch 1
        branch = branches[0]
        tables = Table.objects.filter(branch=branch)
        products = Product.objects.filter(restaurant=branch.restaurant)
        
        for i in range(20):
            # Create order
            order_type = random.choice(['DINE_IN', 'TAKEAWAY', 'DELIVERY'])
            customer_name = random.choice(indonesian_names)
            
            order = Order.objects.create(
                branch=branch,
                table=random.choice(tables) if order_type == 'DINE_IN' else None,
                order_type=order_type,
                status=random.choice(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED']),
                customer_name=customer_name,
                customer_phone=f"{random.choice(phone_prefixes)}{random.randint(10000000, 99999999)}",
                delivery_address=f"Jl. {random.choice(['Sudirman', 'Thamrin', 'Gatot Subroto', 'Rasuna Said'])} No. {random.randint(1, 200)}, Jakarta" if order_type == 'DELIVERY' else '',
                notes='Tidak pedas' if random.random() < 0.3 else '',
                created_by=random.choice([s for s in staff_members if s.branch == branch and s.role == StaffRole.CASHIER]),
                created_at=timezone.now() - timedelta(days=random.randint(0, 30))
            )
            
            # Add order items
            num_items = random.randint(2, 6)
            selected_products = random.sample(list(products), min(num_items, len(products)))
            
            for product in selected_products:
                OrderItem.objects.create(
                    order=order,
                    product=product,
                    quantity=random.randint(1, 3),
                    unit_price=product.price,
                    discount_amount=Decimal('0'),
                    notes='Extra pedas' if random.random() < 0.2 else ''
                )
            
            # Create payment if order is completed
            if order.status == 'COMPLETED':
                Payment.objects.create(
                    order=order,
                    amount=order.total_amount,
                    payment_method=random.choice(['CASH', 'CARD', 'MOBILE']),
                    status='COMPLETED',
                    processed_by=random.choice([s for s in staff_members if s.branch == branch and s.role == StaffRole.CASHIER])
                )
            
            # Create kitchen order for confirmed/preparing orders
            if order.status in ['CONFIRMED', 'PREPARING', 'READY']:
                # Check if kitchen order already exists for this order
                if not hasattr(order, 'kitchen_order'):
                    kitchen_staff = [s for s in staff_members if s.branch == branch and s.role == StaffRole.KITCHEN]
                    KitchenOrder.objects.create(
                        order=order,
                        status=random.choice(['PENDING', 'PREPARING', 'READY']),
                        priority=random.randint(0, 2),
                        assigned_to=random.choice(kitchen_staff) if kitchen_staff else None
                    )
        
        self.stdout.write(f'Created 20 sample orders for {branch.name}')
        
        # Create promotions
        promotions_data = [
            {
                'restaurant': restaurants[0],
                'name': 'Promo Ramadan',
                'description': 'Diskon 20% untuk semua menu saat berbuka puasa',
                'promo_code': 'RAMADAN2024',
                'discount_type': 'PERCENTAGE',
                'discount_value': Decimal('20'),
                'min_order_amount': Decimal('50000'),
                'promo_type': 'ORDER',
                'start_date': timezone.now() - timedelta(days=10),
                'end_date': timezone.now() + timedelta(days=20),
                'usage_limit': 100
            },
            {
                'restaurant': restaurants[0],
                'name': 'Promo Hari Kemerdekaan',
                'description': 'Potongan Rp 17.000 untuk minimum pembelian Rp 100.000',
                'promo_code': 'MERDEKA78',
                'discount_type': 'FIXED',
                'discount_value': Decimal('17000'),
                'min_order_amount': Decimal('100000'),
                'promo_type': 'ORDER',
                'start_date': timezone.now() - timedelta(days=5),
                'end_date': timezone.now() + timedelta(days=10),
                'usage_limit': 50
            },
            {
                'restaurant': restaurants[1],
                'name': 'Promo Akhir Pekan',
                'description': 'Diskon 15% untuk kategori Ikan Bakar setiap Sabtu-Minggu',
                'promo_code': 'WEEKEND15',
                'discount_type': 'PERCENTAGE',
                'discount_value': Decimal('15'),
                'min_order_amount': Decimal('0'),
                'promo_type': 'CATEGORY',
                'start_date': timezone.now() - timedelta(days=2),
                'end_date': timezone.now() + timedelta(days=30),
                'usage_limit': 200
            }
        ]
        
        for data in promotions_data:
            promo = Promotion.objects.create(**data)
            if data['promo_type'] == 'CATEGORY' and data['restaurant'] == restaurants[1]:
                promo.categories.add(categories_sunda[2])  # Ikan Bakar category
            self.stdout.write(f'Created promotion: {promo.name}')
        
        # Create staff schedules
        today = timezone.now().date()
        shift_times = {
            'MORNING': (time(7, 0), time(15, 0)),
            'AFTERNOON': (time(11, 0), time(19, 0)),
            'EVENING': (time(15, 0), time(23, 0)),
        }
        
        for staff in staff_members[:10]:  # Create schedules for first 10 staff
            for day_offset in range(7):  # Next 7 days
                date = today + timedelta(days=day_offset)
                if random.random() < 0.8:  # 80% chance of having a shift
                    shift_type = random.choice(['MORNING', 'AFTERNOON', 'EVENING'])
                    start_time, end_time = shift_times[shift_type]
                    
                    Schedule.objects.create(
                        staff=staff,
                        date=date,
                        shift_type=shift_type,
                        start_time=start_time,
                        end_time=end_time,
                        is_confirmed=random.random() < 0.9,
                        notes='Shift leader' if random.random() < 0.2 else ''
                    )
        
        self.stdout.write('Created staff schedules')
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded Indonesian restaurant data!'))
        
        # Print summary
        self.stdout.write('\n=== Seed Data Summary ===')
        self.stdout.write(f'Restaurants: {Restaurant.objects.count()}')
        self.stdout.write(f'Branches: {Branch.objects.count()}')
        self.stdout.write(f'Staff: {Staff.objects.count()}')
        self.stdout.write(f'Categories: {Category.objects.count()}')
        self.stdout.write(f'Products: {Product.objects.count()}')
        self.stdout.write(f'Inventory Items: {Inventory.objects.count()}')
        self.stdout.write(f'Tables: {Table.objects.count()}')
        self.stdout.write(f'Orders: {Order.objects.count()}')
        self.stdout.write(f'Promotions: {Promotion.objects.count()}')
        self.stdout.write(f'Schedules: {Schedule.objects.count()}')