"""
Script to add promo/seasonal products for testing
Run with: uv run python add_promo_products.py
"""
import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.restaurant.models import Product
from decimal import Decimal


def add_promo_products():
    """Add or update products with promo/seasonal flags"""

    # Get some existing products
    products = Product.objects.all()[:5]

    if not products:
        print("No products found. Please add products first.")
        return

    print(f"Setting up promos for {len(products)} products...")

    # Example 1: Seasonal item
    if len(products) > 0:
        product = products[0]
        product.is_seasonal = True
        product.save()
        print(f"✅ {product.name} → Marked as SEASONAL")

    # Example 2: Discount percentage promo
    if len(products) > 1:
        product = products[1]
        product.is_promo = True
        product.discount_percentage = Decimal('25.00')  # 25% OFF
        product.valid_from = date.today()
        product.valid_until = date.today() + timedelta(days=7)
        product.save()
        print(f"✅ {product.name} → 25% OFF until {product.valid_until}")
        print(f"   Original: Rp {product.price}, Promo: Rp {product.effective_price}")

    # Example 3: Fixed promo price
    if len(products) > 2:
        product = products[2]
        product.is_promo = True
        product.promo_price = product.price * Decimal('0.7')  # 30% off as fixed price
        product.promo_label = "SPECIAL PRICE"
        product.valid_from = date.today()
        product.valid_until = date.today() + timedelta(days=14)
        product.save()
        print(f"✅ {product.name} → SPECIAL PRICE until {product.valid_until}")
        print(f"   Original: Rp {product.price}, Promo: Rp {product.effective_price}")

    # Example 4: Custom promo label
    if len(products) > 3:
        product = products[3]
        product.is_promo = True
        product.discount_percentage = Decimal('50.00')  # 50% OFF
        product.promo_label = "BUY 1 GET 1"
        product.valid_from = date.today()
        product.valid_until = date.today() + timedelta(days=3)
        product.save()
        print(f"✅ {product.name} → BUY 1 GET 1 until {product.valid_until}")
        print(f"   Original: Rp {product.price}, Promo: Rp {product.effective_price}")

    # Example 5: Seasonal + Promo
    if len(products) > 4:
        product = products[4]
        product.is_seasonal = True
        product.is_promo = True
        product.discount_percentage = Decimal('15.00')  # 15% OFF
        product.promo_label = "LIMITED TIME"
        product.valid_from = date.today()
        product.valid_until = date.today() + timedelta(days=30)
        product.save()
        print(f"✅ {product.name} → SEASONAL + LIMITED TIME (15% OFF) until {product.valid_until}")
        print(f"   Original: Rp {product.price}, Promo: Rp {product.effective_price}")

    print(f"\n✨ Successfully set up promos!")

    # Show active promos
    active_promos = Product.objects.filter(is_promo=True)
    print(f"\n📊 Active promos: {active_promos.count()}")
    for p in active_promos:
        print(f"  - {p.name}: {p.promo_label or 'PROMO'} (Valid: {p.valid_from} to {p.valid_until})")


if __name__ == '__main__':
    add_promo_products()
