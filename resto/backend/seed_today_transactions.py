"""
Seed script to create today's test transactions for testing:
- Split Bill feature
- Merge Tables feature
- Kitchen and Bar separation
- General table management

Run with: python manage.py shell < seed_today_transactions.py
Or: uv run python manage.py shell < seed_today_transactions.py
"""

import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.utils import timezone
from decimal import Decimal
from apps.restaurant.models import (
    Branch, Staff, Category, Product, Table, Order, OrderItem,
    KitchenOrder, KitchenOrderItem, BarOrder, BarOrderItem
)
from django.contrib.auth import get_user_model

User = get_user_model()

print("🌱 Starting seed script for today's transactions...")

# Get or create branch
branch = Branch.objects.first()
if not branch:
    print("❌ No branch found. Please create a branch first.")
    exit()

print(f"✅ Using branch: {branch.name}")

# Get or create staff
cashier = Staff.objects.filter(role='CASHIER').first()
if not cashier:
    user = User.objects.create_user(
        email='cashier@test.com',
        password='test123',
        first_name='Test',
        last_name='Cashier'
    )
    cashier = Staff.objects.create(
        user=user,
        branch=branch,
        role='CASHIER',
        phone='08123456789'
    )
    print(f"✅ Created cashier: {cashier.user.get_full_name()}")
else:
    print(f"✅ Using cashier: {cashier.user.get_full_name()}")

# Get or create categories
food_category, _ = Category.objects.get_or_create(
    restaurant=branch.restaurant,
    name='Makanan Utama',
    defaults={'description': 'Main dishes'}
)

drink_category, _ = Category.objects.get_or_create(
    restaurant=branch.restaurant,
    name='Minuman',
    defaults={'description': 'Beverages'}
)

print(f"✅ Categories: {food_category.name}, {drink_category.name}")

# Create food products
food_products = [
    {'name': 'Nasi Goreng Special', 'price': '35000'},
    {'name': 'Mie Goreng', 'price': '30000'},
    {'name': 'Ayam Bakar', 'price': '45000'},
    {'name': 'Ikan Bakar', 'price': '50000'},
    {'name': 'Sate Ayam', 'price': '40000'},
    {'name': 'Gado-Gado', 'price': '25000'},
    {'name': 'Cap Cay', 'price': '35000'},
    {'name': 'Nasi Putih', 'price': '8000'},
]

# Create drink products
drink_products = [
    {'name': 'Es Teh Manis', 'price': '8000'},
    {'name': 'Es Jeruk', 'price': '10000'},
    {'name': 'Jus Alpukat', 'price': '15000'},
    {'name': 'Kopi Hitam', 'price': '10000'},
    {'name': 'Cappuccino', 'price': '18000'},
    {'name': 'Air Mineral', 'price': '5000'},
    {'name': 'Teh Panas', 'price': '5000'},
]

# Create or get products
foods = []
for fp in food_products:
    product, created = Product.objects.get_or_create(
        restaurant=branch.restaurant,
        name=fp['name'],
        defaults={
            'category': food_category,
            'price': Decimal(fp['price']),
            'is_available': True
        }
    )
    foods.append(product)
    if created:
        print(f"  ✅ Created food: {product.name}")

drinks = []
for dp in drink_products:
    product, created = Product.objects.get_or_create(
        restaurant=branch.restaurant,
        name=dp['name'],
        defaults={
            'category': drink_category,
            'price': Decimal(dp['price']),
            'is_available': True
        }
    )
    drinks.append(product)
    if created:
        print(f"  ✅ Created drink: {product.name}")

print(f"✅ Products ready: {len(foods)} foods, {len(drinks)} drinks")

# Create or get tables
tables = []
for i in range(1, 11):
    table, created = Table.objects.get_or_create(
        branch=branch,
        number=str(i),
        defaults={'capacity': 4, 'is_available': True}
    )
    tables.append(table)
    if created:
        print(f"  ✅ Created table: {table.number}")

print(f"✅ Tables ready: {len(tables)} tables")

# Clear today's orders first
today = timezone.now().date()
Order.objects.filter(created_at__date=today).delete()
print("🗑️  Cleared today's existing orders")

print("\n📝 Creating test scenarios...")

# SCENARIO 1: Table 1 - Ready for Split Bill (3 people, mixed items)
print("\n1️⃣  Table 1 - Ready for Split Bill Test")
table1 = tables[0]
order1 = Order.objects.create(
    branch=branch,
    table=table1,
    order_type='DINE_IN',
    status='READY',
    customer_name='Group of 3',
    created_by=cashier
)

# Person 1 items
OrderItem.objects.create(order=order1, product=foods[0], quantity=1, unit_price=foods[0].price)  # Nasi Goreng
OrderItem.objects.create(order=order1, product=drinks[0], quantity=1, unit_price=drinks[0].price)  # Es Teh

# Person 2 items
OrderItem.objects.create(order=order1, product=foods[1], quantity=1, unit_price=foods[1].price)  # Mie Goreng
OrderItem.objects.create(order=order1, product=drinks[2], quantity=1, unit_price=drinks[2].price)  # Jus Alpukat

# Person 3 items
OrderItem.objects.create(order=order1, product=foods[2], quantity=1, unit_price=foods[2].price)  # Ayam Bakar
OrderItem.objects.create(order=order1, product=drinks[1], quantity=1, unit_price=drinks[1].price)  # Es Jeruk

# Create kitchen and bar orders
kitchen_order1 = KitchenOrder.objects.create(order=order1, status='READY')
for item in order1.items.filter(product__category=food_category):
    KitchenOrderItem.objects.create(
        kitchen_order=kitchen_order1,
        product=item.product,
        quantity=item.quantity,
        status='READY'
    )

bar_order1 = BarOrder.objects.create(order=order1, status='READY')
for item in order1.items.filter(product__category=drink_category):
    BarOrderItem.objects.create(
        bar_order=bar_order1,
        product=item.product,
        quantity=item.quantity,
        status='READY'
    )

print(f"   ✅ Table {table1.number}: Rp {order1.total_amount} - Ready for split bill")

# SCENARIO 2: Tables 2, 3, 4 - Ready for Merge Tables
print("\n2️⃣  Tables 2, 3, 4 - Ready for Merge Test")

# Table 2
table2 = tables[1]
order2 = Order.objects.create(
    branch=branch,
    table=table2,
    order_type='DINE_IN',
    status='READY',
    customer_name='Person A',
    created_by=cashier
)
OrderItem.objects.create(order=order2, product=foods[3], quantity=1, unit_price=foods[3].price)  # Ikan Bakar
OrderItem.objects.create(order=order2, product=drinks[3], quantity=1, unit_price=drinks[3].price)  # Kopi

kitchen_order2 = KitchenOrder.objects.create(order=order2, status='READY')
KitchenOrderItem.objects.create(
    kitchen_order=kitchen_order2,
    product=foods[3],
    quantity=1,
    status='READY'
)

bar_order2 = BarOrder.objects.create(order=order2, status='READY')
BarOrderItem.objects.create(
    bar_order=bar_order2,
    product=drinks[3],
    quantity=1,
    status='READY'
)

print(f"   ✅ Table {table2.number}: Rp {order2.total_amount}")

# Table 3
table3 = tables[2]
order3 = Order.objects.create(
    branch=branch,
    table=table3,
    order_type='DINE_IN',
    status='READY',
    customer_name='Person B',
    created_by=cashier
)
OrderItem.objects.create(order=order3, product=foods[4], quantity=2, unit_price=foods[4].price)  # Sate Ayam x2
OrderItem.objects.create(order=order3, product=drinks[0], quantity=2, unit_price=drinks[0].price)  # Es Teh x2

kitchen_order3 = KitchenOrder.objects.create(order=order3, status='READY')
KitchenOrderItem.objects.create(
    kitchen_order=kitchen_order3,
    product=foods[4],
    quantity=2,
    status='READY'
)

bar_order3 = BarOrder.objects.create(order=order3, status='READY')
BarOrderItem.objects.create(
    bar_order=bar_order3,
    product=drinks[0],
    quantity=2,
    status='READY'
)

print(f"   ✅ Table {table3.number}: Rp {order3.total_amount}")

# Table 4
table4 = tables[3]
order4 = Order.objects.create(
    branch=branch,
    table=table4,
    order_type='DINE_IN',
    status='READY',
    customer_name='Person C',
    created_by=cashier
)
OrderItem.objects.create(order=order4, product=foods[5], quantity=1, unit_price=foods[5].price)  # Gado-Gado
OrderItem.objects.create(order=order4, product=drinks[2], quantity=1, unit_price=drinks[2].price)  # Jus Alpukat

kitchen_order4 = KitchenOrder.objects.create(order=order4, status='READY')
KitchenOrderItem.objects.create(
    kitchen_order=kitchen_order4,
    product=foods[5],
    quantity=1,
    status='READY'
)

bar_order4 = BarOrder.objects.create(order=order4, status='READY')
BarOrderItem.objects.create(
    bar_order=bar_order4,
    product=drinks[2],
    quantity=1,
    status='READY'
)

print(f"   ✅ Table {table4.number}: Rp {order4.total_amount}")

# SCENARIO 3: Table 5 - Kitchen and Bar Separation Test (Food still preparing, drinks ready)
print("\n3️⃣  Table 5 - Kitchen/Bar Separation Test")
table5 = tables[4]
order5 = Order.objects.create(
    branch=branch,
    table=table5,
    order_type='DINE_IN',
    status='PREPARING',
    customer_name='Kitchen/Bar Test',
    created_by=cashier
)
OrderItem.objects.create(order=order5, product=foods[0], quantity=1, unit_price=foods[0].price)
OrderItem.objects.create(order=order5, product=foods[1], quantity=1, unit_price=foods[1].price)
OrderItem.objects.create(order=order5, product=drinks[0], quantity=2, unit_price=drinks[0].price)
OrderItem.objects.create(order=order5, product=drinks[1], quantity=1, unit_price=drinks[1].price)

# Kitchen still preparing
kitchen_order5 = KitchenOrder.objects.create(order=order5, status='PREPARING')
KitchenOrderItem.objects.create(kitchen_order=kitchen_order5, product=foods[0], quantity=1, status='PREPARING')
KitchenOrderItem.objects.create(kitchen_order=kitchen_order5, product=foods[1], quantity=1, status='PREPARING')

# Bar already ready!
bar_order5 = BarOrder.objects.create(order=order5, status='READY')
BarOrderItem.objects.create(bar_order=bar_order5, product=drinks[0], quantity=2, status='READY')
BarOrderItem.objects.create(bar_order=bar_order5, product=drinks[1], quantity=1, status='READY')

print(f"   ✅ Table {table5.number}: Kitchen PREPARING, Bar READY")

# SCENARIO 4: Table 6 - New orders pending in kitchen
print("\n4️⃣  Table 6 - Pending Kitchen Orders")
table6 = tables[5]
order6 = Order.objects.create(
    branch=branch,
    table=table6,
    order_type='DINE_IN',
    status='CONFIRMED',
    customer_name='New Order',
    created_by=cashier
)
OrderItem.objects.create(order=order6, product=foods[2], quantity=1, unit_price=foods[2].price)
OrderItem.objects.create(order=order6, product=foods[7], quantity=2, unit_price=foods[7].price)
OrderItem.objects.create(order=order6, product=drinks[4], quantity=1, unit_price=drinks[4].price)

kitchen_order6 = KitchenOrder.objects.create(order=order6, status='PENDING')
KitchenOrderItem.objects.create(kitchen_order=kitchen_order6, product=foods[2], quantity=1, status='PENDING')
KitchenOrderItem.objects.create(kitchen_order=kitchen_order6, product=foods[7], quantity=2, status='PENDING')

bar_order6 = BarOrder.objects.create(order=order6, status='PENDING')
BarOrderItem.objects.create(bar_order=bar_order6, product=drinks[4], quantity=1, status='PENDING')

print(f"   ✅ Table {table6.number}: New order, pending kitchen/bar")

# SCENARIO 5: Table 7 - Large order ready for payment
print("\n5️⃣  Table 7 - Large Order")
table7 = tables[6]
order7 = Order.objects.create(
    branch=branch,
    table=table7,
    order_type='DINE_IN',
    status='READY',
    customer_name='Large Family',
    created_by=cashier
)
OrderItem.objects.create(order=order7, product=foods[0], quantity=3, unit_price=foods[0].price)
OrderItem.objects.create(order=order7, product=foods[1], quantity=2, unit_price=foods[1].price)
OrderItem.objects.create(order=order7, product=foods[2], quantity=2, unit_price=foods[2].price)
OrderItem.objects.create(order=order7, product=drinks[0], quantity=5, unit_price=drinks[0].price)
OrderItem.objects.create(order=order7, product=drinks[2], quantity=2, unit_price=drinks[2].price)

kitchen_order7 = KitchenOrder.objects.create(order=order7, status='READY')
for item in order7.items.filter(product__category=food_category):
    KitchenOrderItem.objects.create(
        kitchen_order=kitchen_order7,
        product=item.product,
        quantity=item.quantity,
        status='READY'
    )

bar_order7 = BarOrder.objects.create(order=order7, status='READY')
for item in order7.items.filter(product__category=drink_category):
    BarOrderItem.objects.create(
        bar_order=bar_order7,
        product=item.product,
        quantity=item.quantity,
        status='READY'
    )

print(f"   ✅ Table {table7.number}: Rp {order7.total_amount} - Large order")

# SCENARIO 6: Table 8 - Drinks only (bar test)
print("\n6️⃣  Table 8 - Drinks Only")
table8 = tables[7]
order8 = Order.objects.create(
    branch=branch,
    table=table8,
    order_type='DINE_IN',
    status='READY',
    customer_name='Coffee Break',
    created_by=cashier
)
OrderItem.objects.create(order=order8, product=drinks[4], quantity=2, unit_price=drinks[4].price)  # Cappuccino x2
OrderItem.objects.create(order=order8, product=drinks[3], quantity=1, unit_price=drinks[3].price)  # Kopi

bar_order8 = BarOrder.objects.create(order=order8, status='READY')
for item in order8.items.all():
    BarOrderItem.objects.create(
        bar_order=bar_order8,
        product=item.product,
        quantity=item.quantity,
        status='READY'
    )

print(f"   ✅ Table {table8.number}: Drinks only - Bar test")

# SCENARIO 7: Table 9 - Food only (kitchen test)
print("\n7️⃣  Table 9 - Food Only")
table9 = tables[8]
order9 = Order.objects.create(
    branch=branch,
    table=table9,
    order_type='DINE_IN',
    status='PREPARING',
    customer_name='Hungry Solo',
    created_by=cashier
)
OrderItem.objects.create(order=order9, product=foods[6], quantity=1, unit_price=foods[6].price)  # Cap Cay
OrderItem.objects.create(order=order9, product=foods[7], quantity=1, unit_price=foods[7].price)  # Nasi Putih

kitchen_order9 = KitchenOrder.objects.create(order=order9, status='PREPARING')
for item in order9.items.all():
    KitchenOrderItem.objects.create(
        kitchen_order=kitchen_order9,
        product=item.product,
        quantity=item.quantity,
        status='PREPARING'
    )

print(f"   ✅ Table {table9.number}: Food only - Kitchen test")

# Update table availability
for table in [table1, table2, table3, table4, table5, table6, table7, table8, table9]:
    table.is_available = False
    table.save()

print("\n" + "="*60)
print("✅ Seed data created successfully!")
print("="*60)
print("\n📊 Summary:")
print(f"   • Tables occupied: 9")
print(f"   • Total orders: {Order.objects.filter(created_at__date=today).count()}")
print(f"   • Kitchen orders: {KitchenOrder.objects.filter(created_at__date=today).count()}")
print(f"   • Bar orders: {BarOrder.objects.filter(created_at__date=today).count()}")
print("\n🧪 Test Scenarios:")
print("   1. Table 1: Ready for SPLIT BILL test (3 people)")
print("   2. Tables 2-4: Ready for MERGE TABLES test")
print("   3. Table 5: Kitchen/Bar separation (bar ready, kitchen preparing)")
print("   4. Table 6: New pending orders")
print("   5. Table 7: Large family order")
print("   6. Table 8: Drinks only (bar)")
print("   7. Table 9: Food only (kitchen)")
print("\n🌐 Access:")
print("   • Table Management: http://localhost:3000/table")
print("   • Kitchen Display: http://localhost:3000/kitchen")
print("   • Bar Display: http://localhost:3000/bar")
print("\n" + "="*60)
