"""
Script to add sample utility inventory items
Run with: uv run python add_utility_items.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.restaurant.models import (
    Branch, Inventory, InventoryItemType, InventoryCategory, InventoryLocation
)
from decimal import Decimal


def add_utility_items():
    """Add sample utility items to warehouse"""
    # Get the branch
    branch = Branch.objects.first()
    if not branch:
        print("No branch found. Please create a branch first.")
        return

    print(f"Adding utility items to branch: {branch.name}")

    utility_items = [
        # Serving Items (Durable)
        {
            'name': 'Piring Keramik 10"',
            'description': 'Piring keramik putih diameter 10 inch',
            'unit': 'pcs',
            'quantity': Decimal('150'),
            'min_quantity': Decimal('80'),
            'cost_per_unit': Decimal('25000.00'),
            'location': InventoryLocation.KITCHEN,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.SERVING,
            'is_durable': True,
            'par_stock_level': Decimal('120'),
            'lifespan_days': 730  # 2 years
        },
        {
            'name': 'Piring Keramik 8"',
            'description': 'Piring keramik putih diameter 8 inch',
            'unit': 'pcs',
            'quantity': Decimal('180'),
            'min_quantity': Decimal('100'),
            'cost_per_unit': Decimal('20000.00'),
            'location': InventoryLocation.KITCHEN,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.SERVING,
            'is_durable': True,
            'par_stock_level': Decimal('150'),
            'lifespan_days': 730
        },
        {
            'name': 'Mangkuk Bowl Keramik',
            'description': 'Mangkuk keramik putih',
            'unit': 'pcs',
            'quantity': Decimal('100'),
            'min_quantity': Decimal('60'),
            'cost_per_unit': Decimal('18000.00'),
            'location': InventoryLocation.KITCHEN,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.SERVING,
            'is_durable': True,
            'par_stock_level': Decimal('80'),
            'lifespan_days': 730
        },
        {
            'name': 'Gelas Kaca Tumbler',
            'description': 'Gelas kaca tumbler 250ml',
            'unit': 'pcs',
            'quantity': Decimal('200'),
            'min_quantity': Decimal('100'),
            'cost_per_unit': Decimal('12000.00'),
            'location': InventoryLocation.BAR,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.SERVING,
            'is_durable': True,
            'par_stock_level': Decimal('180'),
            'lifespan_days': 730,
            'breakage_count': 8  # Example breakage
        },
        {
            'name': 'Sendok Stainless',
            'description': 'Sendok makan stainless steel',
            'unit': 'pcs',
            'quantity': Decimal('150'),
            'min_quantity': Decimal('100'),
            'cost_per_unit': Decimal('8000.00'),
            'location': InventoryLocation.KITCHEN,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.SERVING,
            'is_durable': True,
            'par_stock_level': Decimal('120'),
            'lifespan_days': 1825  # 5 years
        },
        {
            'name': 'Garpu Stainless',
            'description': 'Garpu makan stainless steel',
            'unit': 'pcs',
            'quantity': Decimal('150'),
            'min_quantity': Decimal('100'),
            'cost_per_unit': Decimal('8000.00'),
            'location': InventoryLocation.KITCHEN,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.SERVING,
            'is_durable': True,
            'par_stock_level': Decimal('120'),
            'lifespan_days': 1825
        },
        {
            'name': 'Pisau Stainless',
            'description': 'Pisau makan stainless steel',
            'unit': 'pcs',
            'quantity': Decimal('100'),
            'min_quantity': Decimal('60'),
            'cost_per_unit': Decimal('10000.00'),
            'location': InventoryLocation.KITCHEN,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.SERVING,
            'is_durable': True,
            'par_stock_level': Decimal('80'),
            'lifespan_days': 1825
        },
        {
            'name': 'Sumpit Kayu',
            'description': 'Sumpit kayu sekali pakai',
            'unit': 'pasang',
            'quantity': Decimal('500'),
            'min_quantity': Decimal('200'),
            'cost_per_unit': Decimal('1500.00'),
            'location': InventoryLocation.WAREHOUSE,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.SERVING,
            'is_durable': False,
            'par_stock_level': Decimal('300')
        },

        # Packaging Items (Non-durable)
        {
            'name': 'Box Takeaway Large',
            'description': 'Box takeaway kertas ukuran besar',
            'unit': 'pcs',
            'quantity': Decimal('500'),
            'min_quantity': Decimal('200'),
            'cost_per_unit': Decimal('2500.00'),
            'location': InventoryLocation.WAREHOUSE,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.PACKAGING,
            'is_durable': False,
            'par_stock_level': Decimal('250')
        },
        {
            'name': 'Box Takeaway Medium',
            'description': 'Box takeaway kertas ukuran sedang',
            'unit': 'pcs',
            'quantity': Decimal('600'),
            'min_quantity': Decimal('250'),
            'cost_per_unit': Decimal('2000.00'),
            'location': InventoryLocation.WAREHOUSE,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.PACKAGING,
            'is_durable': False,
            'par_stock_level': Decimal('300')
        },
        {
            'name': 'Kantong Plastik Kecil',
            'description': 'Kantong plastik kecil untuk takeaway',
            'unit': 'pcs',
            'quantity': Decimal('1000'),
            'min_quantity': Decimal('400'),
            'cost_per_unit': Decimal('500.00'),
            'location': InventoryLocation.WAREHOUSE,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.PACKAGING,
            'is_durable': False,
            'par_stock_level': Decimal('500')
        },
        {
            'name': 'Kantong Plastik Besar',
            'description': 'Kantong plastik besar untuk takeaway',
            'unit': 'pcs',
            'quantity': Decimal('800'),
            'min_quantity': Decimal('300'),
            'cost_per_unit': Decimal('800.00'),
            'location': InventoryLocation.WAREHOUSE,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.PACKAGING,
            'is_durable': False,
            'par_stock_level': Decimal('400')
        },

        # Cleaning Supplies (Non-durable)
        {
            'name': 'Deterjen Cuci Piring 5L',
            'description': 'Cairan deterjen cuci piring 5 liter',
            'unit': 'botol',
            'quantity': Decimal('8'),
            'min_quantity': Decimal('3'),
            'cost_per_unit': Decimal('45000.00'),
            'location': InventoryLocation.KITCHEN,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.CLEANING,
            'is_durable': False,
            'par_stock_level': Decimal('5')
        },
        {
            'name': 'Spons Cuci Piring',
            'description': 'Spons cuci piring',
            'unit': 'pcs',
            'quantity': Decimal('20'),
            'min_quantity': Decimal('10'),
            'cost_per_unit': Decimal('3000.00'),
            'location': InventoryLocation.KITCHEN,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.CLEANING,
            'is_durable': False,
            'par_stock_level': Decimal('15')
        },
        {
            'name': 'Sabun Cuci Tangan 500ml',
            'description': 'Sabun cuci tangan cair',
            'unit': 'botol',
            'quantity': Decimal('12'),
            'min_quantity': Decimal('5'),
            'cost_per_unit': Decimal('15000.00'),
            'location': InventoryLocation.KITCHEN,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.CLEANING,
            'is_durable': False,
            'par_stock_level': Decimal('8')
        },
        {
            'name': 'Pel Lantai',
            'description': 'Pel lantai dengan gagang',
            'unit': 'pcs',
            'quantity': Decimal('5'),
            'min_quantity': Decimal('2'),
            'cost_per_unit': Decimal('35000.00'),
            'location': InventoryLocation.WAREHOUSE,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.CLEANING,
            'is_durable': True,
            'par_stock_level': Decimal('3'),
            'lifespan_days': 365
        },
        {
            'name': 'Sapu',
            'description': 'Sapu ijuk untuk lantai',
            'unit': 'pcs',
            'quantity': Decimal('6'),
            'min_quantity': Decimal('3'),
            'cost_per_unit': Decimal('25000.00'),
            'location': InventoryLocation.WAREHOUSE,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.CLEANING,
            'is_durable': True,
            'par_stock_level': Decimal('4'),
            'lifespan_days': 180
        },

        # Disposables
        {
            'name': 'Serbet Kertas',
            'description': 'Serbet kertas pack 100 lembar',
            'unit': 'pack',
            'quantity': Decimal('30'),
            'min_quantity': Decimal('15'),
            'cost_per_unit': Decimal('8000.00'),
            'location': InventoryLocation.WAREHOUSE,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.DISPOSABLES,
            'is_durable': False,
            'par_stock_level': Decimal('20')
        },
        {
            'name': 'Tissue Kotak',
            'description': 'Tissue kotak untuk meja',
            'unit': 'kotak',
            'quantity': Decimal('25'),
            'min_quantity': Decimal('12'),
            'cost_per_unit': Decimal('12000.00'),
            'location': InventoryLocation.WAREHOUSE,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.DISPOSABLES,
            'is_durable': False,
            'par_stock_level': Decimal('15')
        },

        # Kitchen Tools (Durable)
        {
            'name': 'Set Pisau Dapur',
            'description': 'Set pisau dapur chef profesional',
            'unit': 'set',
            'quantity': Decimal('3'),
            'min_quantity': Decimal('2'),
            'cost_per_unit': Decimal('250000.00'),
            'location': InventoryLocation.KITCHEN,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.KITCHEN_TOOLS,
            'is_durable': True,
            'par_stock_level': Decimal('3'),
            'lifespan_days': 1825  # 5 years
        },
        {
            'name': 'Talenan Plastik',
            'description': 'Talenan plastik food grade',
            'unit': 'pcs',
            'quantity': Decimal('10'),
            'min_quantity': Decimal('5'),
            'cost_per_unit': Decimal('45000.00'),
            'location': InventoryLocation.KITCHEN,
            'item_type': InventoryItemType.UTILITY,
            'category': InventoryCategory.KITCHEN_TOOLS,
            'is_durable': True,
            'par_stock_level': Decimal('8'),
            'lifespan_days': 365
        },
    ]

    created_count = 0
    for item_data in utility_items:
        item_data['branch'] = branch

        # Check if item already exists
        existing = Inventory.objects.filter(
            branch=branch,
            name=item_data['name']
        ).first()

        if existing:
            print(f"  ⏭️  Skipped: {item_data['name']} (already exists)")
            continue

        item = Inventory.objects.create(**item_data)
        created_count += 1
        print(f"  ✅ Created: {item.name} - {item.quantity} {item.unit} ({item.get_category_display()})")

    print(f"\n✨ Successfully created {created_count} utility items")

    # Show summary
    total_utilities = Inventory.objects.filter(
        branch=branch,
        item_type=InventoryItemType.UTILITY
    ).count()
    print(f"\n📊 Total utility items in warehouse: {total_utilities}")

    # Show items below par stock
    below_par = Inventory.objects.filter(
        branch=branch,
        item_type=InventoryItemType.UTILITY,
        par_stock_level__isnull=False,
        quantity__lt=models.F('par_stock_level')
    )
    if below_par.exists():
        print(f"\n⚠️  Items below par stock level:")
        for item in below_par:
            print(f"  - {item.name}: {item.quantity}/{item.par_stock_level} {item.unit}")


if __name__ == '__main__':
    from django.db import models
    add_utility_items()
