"""
Seed recipes (Bill of Materials) for existing menu products
Creates kitchen inventory and links recipes to products
"""

from django.core.management.base import BaseCommand
from decimal import Decimal
from apps.restaurant.models import (
    Branch, Product, Inventory, Recipe, RecipeIngredient
)


class Command(BaseCommand):
    help = 'Seed recipes for existing menu products with kitchen inventory'

    def handle(self, *args, **kwargs):
        try:
            # Get the main branch
            branch = Branch.objects.get(id=4)
        except Branch.DoesNotExist:
            self.stdout.write(self.style.ERROR('Branch ID 4 not found. Please run seed_resto_data first.'))
            return

        self.stdout.write(self.style.WARNING('Creating kitchen inventory items...'))

        # Kitchen inventory with precise BOM units
        kitchen_inventory = [
            # Proteins
            {'name': 'Ayam Kampung', 'unit': 'gram', 'quantity': '20000.00', 'min_qty': '5000.00', 'cost': '37.50'},
            {'name': 'Daging Sapi', 'unit': 'gram', 'quantity': '15000.00', 'min_qty': '3000.00', 'cost': '120.00'},
            {'name': 'Telur Ayam', 'unit': 'pcs', 'quantity': '100.00', 'min_qty': '20.00', 'cost': '2500.00'},
            {'name': 'Tahu Putih', 'unit': 'pcs', 'quantity': '50.00', 'min_qty': '10.00', 'cost': '1500.00'},
            {'name': 'Tempe', 'unit': 'pcs', 'quantity': '50.00', 'min_qty': '10.00', 'cost': '1200.00'},

            # Carbs & Grains
            {'name': 'Beras Premium', 'unit': 'gram', 'quantity': '50000.00', 'min_qty': '10000.00', 'cost': '12.00'},
            {'name': 'Nasi Gurih', 'unit': 'gram', 'quantity': '30000.00', 'min_qty': '5000.00', 'cost': '15.00'},
            {'name': 'Lontong', 'unit': 'pcs', 'quantity': '100.00', 'min_qty': '20.00', 'cost': '2000.00'},
            {'name': 'Ketupat', 'unit': 'pcs', 'quantity': '50.00', 'min_qty': '10.00', 'cost': '2500.00'},

            # Vegetables
            {'name': 'Bawang Merah', 'unit': 'gram', 'quantity': '5000.00', 'min_qty': '1000.00', 'cost': '35.00'},
            {'name': 'Bawang Putih', 'unit': 'gram', 'quantity': '3000.00', 'min_qty': '500.00', 'cost': '40.00'},
            {'name': 'Cabai Merah', 'unit': 'gram', 'quantity': '2000.00', 'min_qty': '300.00', 'cost': '60.00'},
            {'name': 'Sayur Nangka Muda', 'unit': 'gram', 'quantity': '10000.00', 'min_qty': '2000.00', 'cost': '8.00'},
            {'name': 'Kol', 'unit': 'gram', 'quantity': '5000.00', 'min_qty': '1000.00', 'cost': '5.00'},
            {'name': 'Tauge', 'unit': 'gram', 'quantity': '3000.00', 'min_qty': '500.00', 'cost': '7.00'},
            {'name': 'Tomat', 'unit': 'gram', 'quantity': '3000.00', 'min_qty': '500.00', 'cost': '12.00'},

            # Coconut products
            {'name': 'Santan Kelapa', 'unit': 'ml', 'quantity': '10000.00', 'min_qty': '2000.00', 'cost': '18.00'},
            {'name': 'Kelapa Parut', 'unit': 'gram', 'quantity': '3000.00', 'min_qty': '500.00', 'cost': '25.00'},

            # Cooking essentials
            {'name': 'Minyak Goreng', 'unit': 'ml', 'quantity': '15000.00', 'min_qty': '3000.00', 'cost': '14.00'},
            {'name': 'Garam', 'unit': 'gram', 'quantity': '5000.00', 'min_qty': '1000.00', 'cost': '2.00'},
            {'name': 'Gula Pasir', 'unit': 'gram', 'quantity': '10000.00', 'min_qty': '2000.00', 'cost': '15.00'},
            {'name': 'Gula Merah', 'unit': 'gram', 'quantity': '5000.00', 'min_qty': '1000.00', 'cost': '20.00'},
            {'name': 'Kecap Manis', 'unit': 'ml', 'quantity': '5000.00', 'min_qty': '1000.00', 'cost': '12.00'},
            {'name': 'Kacang Tanah', 'unit': 'gram', 'quantity': '3000.00', 'min_qty': '500.00', 'cost': '30.00'},

            # Spices
            {'name': 'Kemiri', 'unit': 'gram', 'quantity': '1000.00', 'min_qty': '200.00', 'cost': '50.00'},
            {'name': 'Kunyit', 'unit': 'gram', 'quantity': '1000.00', 'min_qty': '200.00', 'cost': '45.00'},
            {'name': 'Lengkuas', 'unit': 'gram', 'quantity': '2000.00', 'min_qty': '300.00', 'cost': '20.00'},
            {'name': 'Serai', 'unit': 'batang', 'quantity': '50.00', 'min_qty': '10.00', 'cost': '500.00'},
            {'name': 'Daun Salam', 'unit': 'gram', 'quantity': '500.00', 'min_qty': '100.00', 'cost': '30.00'},
            {'name': 'Daun Jeruk', 'unit': 'gram', 'quantity': '300.00', 'min_qty': '50.00', 'cost': '40.00'},

            # Condiments & Extras
            {'name': 'Emping', 'unit': 'gram', 'quantity': '2000.00', 'min_qty': '300.00', 'cost': '35.00'},
            {'name': 'Krupuk', 'unit': 'pcs', 'quantity': '200.00', 'min_qty': '50.00', 'cost': '500.00'},
            {'name': 'Bawang Goreng', 'unit': 'gram', 'quantity': '1000.00', 'min_qty': '200.00', 'cost': '80.00'},

            # Dessert & Drinks
            {'name': 'Tepung Ketan', 'unit': 'gram', 'quantity': '5000.00', 'min_qty': '1000.00', 'cost': '18.00'},
            {'name': 'Durian', 'unit': 'gram', 'quantity': '3000.00', 'min_qty': '500.00', 'cost': '100.00'},
            {'name': 'Cendol', 'unit': 'gram', 'quantity': '2000.00', 'min_qty': '300.00', 'cost': '25.00'},
            {'name': 'Alpukat', 'unit': 'pcs', 'quantity': '20.00', 'min_qty': '5.00', 'cost': '15000.00'},
            {'name': 'Jahe Merah', 'unit': 'gram', 'quantity': '2000.00', 'min_qty': '300.00', 'cost': '35.00'},
            {'name': 'Jahe', 'unit': 'gram', 'quantity': '2000.00', 'min_qty': '300.00', 'cost': '30.00'},
            {'name': 'Teh Celup', 'unit': 'pcs', 'quantity': '200.00', 'min_qty': '50.00', 'cost': '500.00'},
            {'name': 'Es Batu', 'unit': 'gram', 'quantity': '20000.00', 'min_qty': '5000.00', 'cost': '1.00'},
        ]

        inventory_map = {}
        for item in kitchen_inventory:
            inv, created = Inventory.objects.get_or_create(
                branch=branch,
                name=item['name'],
                location='KITCHEN',
                defaults={
                    'unit': item['unit'],
                    'quantity': Decimal(item['quantity']),
                    'min_quantity': Decimal(item['min_qty']),
                    'cost_per_unit': Decimal(item['cost'])
                }
            )
            inventory_map[item['name']] = inv
            status = 'Created' if created else 'Exists'
            self.stdout.write(f"  {status}: {item['name']} - {item['quantity']} {item['unit']}")

        self.stdout.write(self.style.SUCCESS(f'\n✓ Kitchen inventory ready ({len(inventory_map)} items)'))

        # Define recipes for each product
        self.stdout.write(self.style.WARNING('\nCreating recipes for menu products...'))

        recipes_data = {
            'Nasi Gudeg Jogja': {
                'serving_size': 1,
                'prep_time': 30,
                'cook_time': 180,
                'instructions': 'Masak nangka muda dengan santan dan rempah khas Jogja hingga empuk',
                'ingredients': [
                    ('Nasi Gurih', 300, 'gram'),
                    ('Sayur Nangka Muda', 200, 'gram'),
                    ('Ayam Kampung', 150, 'gram'),
                    ('Telur Ayam', 1, 'pcs'),
                    ('Santan Kelapa', 200, 'ml'),
                    ('Gula Merah', 50, 'gram'),
                    ('Bawang Merah', 30, 'gram'),
                    ('Bawang Putih', 20, 'gram'),
                    ('Kemiri', 10, 'gram'),
                    ('Lengkuas', 15, 'gram'),
                    ('Daun Salam', 5, 'gram'),
                ]
            },
            'Nasi Liwet Solo': {
                'serving_size': 1,
                'prep_time': 20,
                'cook_time': 60,
                'instructions': 'Masak beras dengan santan dan rempah khas Solo',
                'ingredients': [
                    ('Beras Premium', 300, 'gram'),
                    ('Santan Kelapa', 300, 'ml'),
                    ('Ayam Kampung', 100, 'gram'),
                    ('Telur Ayam', 1, 'pcs'),
                    ('Bawang Merah', 25, 'gram'),
                    ('Bawang Putih', 15, 'gram'),
                    ('Serai', 1, 'batang'),
                    ('Daun Salam', 3, 'gram'),
                    ('Garam', 5, 'gram'),
                ]
            },
            'Nasi Padang Komplit': {
                'serving_size': 1,
                'prep_time': 40,
                'cook_time': 90,
                'instructions': 'Sajikan nasi putih dengan rendang, sambal, dan lauk khas Padang',
                'ingredients': [
                    ('Beras Premium', 350, 'gram'),
                    ('Daging Sapi', 200, 'gram'),
                    ('Santan Kelapa', 250, 'ml'),
                    ('Telur Ayam', 1, 'pcs'),
                    ('Bawang Merah', 40, 'gram'),
                    ('Bawang Putih', 30, 'gram'),
                    ('Cabai Merah', 30, 'gram'),
                    ('Kemiri', 15, 'gram'),
                    ('Kunyit', 10, 'gram'),
                    ('Lengkuas', 20, 'gram'),
                    ('Daun Jeruk', 5, 'gram'),
                    ('Gula Merah', 30, 'gram'),
                ]
            },
            'Bubur Ayam': {
                'serving_size': 1,
                'prep_time': 15,
                'cook_time': 45,
                'instructions': 'Masak beras hingga lembut, sajikan dengan topping ayam dan bumbu',
                'ingredients': [
                    ('Beras Premium', 150, 'gram'),
                    ('Ayam Kampung', 100, 'gram'),
                    ('Bawang Merah', 20, 'gram'),
                    ('Bawang Putih', 15, 'gram'),
                    ('Bawang Goreng', 10, 'gram'),
                    ('Kacang Tanah', 30, 'gram'),
                    ('Kecap Manis', 15, 'ml'),
                    ('Krupuk', 2, 'pcs'),
                    ('Garam', 5, 'gram'),
                ]
            },
            'Lontong Sayur': {
                'serving_size': 1,
                'prep_time': 20,
                'cook_time': 60,
                'instructions': 'Masak sayur dengan santan, sajikan dengan lontong',
                'ingredients': [
                    ('Lontong', 3, 'pcs'),
                    ('Santan Kelapa', 200, 'ml'),
                    ('Sayur Nangka Muda', 150, 'gram'),
                    ('Tahu Putih', 2, 'pcs'),
                    ('Tempe', 2, 'pcs'),
                    ('Bawang Merah', 25, 'gram'),
                    ('Bawang Putih', 20, 'gram'),
                    ('Lengkuas', 10, 'gram'),
                    ('Daun Salam', 3, 'gram'),
                    ('Garam', 5, 'gram'),
                ]
            },
            'Soto Betawi': {
                'serving_size': 1,
                'prep_time': 25,
                'cook_time': 120,
                'instructions': 'Rebus daging dengan santan dan rempah khas Betawi',
                'ingredients': [
                    ('Daging Sapi', 200, 'gram'),
                    ('Santan Kelapa', 300, 'ml'),
                    ('Tomat', 50, 'gram'),
                    ('Bawang Merah', 30, 'gram'),
                    ('Bawang Putih', 25, 'gram'),
                    ('Jahe', 15, 'gram'),
                    ('Serai', 1, 'batang'),
                    ('Daun Jeruk', 5, 'gram'),
                    ('Emping', 20, 'gram'),
                    ('Bawang Goreng', 15, 'gram'),
                ]
            },
            'Rawon Surabaya': {
                'serving_size': 1,
                'prep_time': 30,
                'cook_time': 150,
                'instructions': 'Masak daging dengan kluwek hingga kuah hitam pekat',
                'ingredients': [
                    ('Daging Sapi', 250, 'gram'),
                    ('Bawang Merah', 35, 'gram'),
                    ('Bawang Putih', 30, 'gram'),
                    ('Kemiri', 15, 'gram'),
                    ('Kunyit', 10, 'gram'),
                    ('Lengkuas', 20, 'gram'),
                    ('Serai', 2, 'batang'),
                    ('Daun Jeruk', 5, 'gram'),
                    ('Tauge', 50, 'gram'),
                    ('Bawang Goreng', 15, 'gram'),
                ]
            },
            'Sop Buntut Bakar': {
                'serving_size': 1,
                'prep_time': 35,
                'cook_time': 240,
                'instructions': 'Rebus buntut sapi hingga empuk, bakar sebelum disajikan',
                'ingredients': [
                    ('Daging Sapi', 400, 'gram'),
                    ('Bawang Merah', 40, 'gram'),
                    ('Bawang Putih', 35, 'gram'),
                    ('Bawang Goreng', 20, 'gram'),
                    ('Serai', 2, 'batang'),
                    ('Daun Salam', 5, 'gram'),
                    ('Garam', 8, 'gram'),
                    ('Minyak Goreng', 30, 'ml'),
                ]
            },
            'Gado-gado': {
                'serving_size': 1,
                'prep_time': 20,
                'cook_time': 30,
                'instructions': 'Rebus sayuran, siram dengan bumbu kacang',
                'ingredients': [
                    ('Kol', 100, 'gram'),
                    ('Tauge', 80, 'gram'),
                    ('Tahu Putih', 2, 'pcs'),
                    ('Tempe', 2, 'pcs'),
                    ('Telur Ayam', 1, 'pcs'),
                    ('Kacang Tanah', 80, 'gram'),
                    ('Gula Merah', 30, 'gram'),
                    ('Cabai Merah', 20, 'gram'),
                    ('Bawang Putih', 15, 'gram'),
                    ('Krupuk', 3, 'pcs'),
                ]
            },
            'Ketoprak': {
                'serving_size': 1,
                'prep_time': 15,
                'cook_time': 25,
                'instructions': 'Campur ketupat, tauge, tahu dengan bumbu kacang',
                'ingredients': [
                    ('Ketupat', 3, 'pcs'),
                    ('Tauge', 100, 'gram'),
                    ('Tahu Putih', 3, 'pcs'),
                    ('Kacang Tanah', 70, 'gram'),
                    ('Gula Merah', 25, 'gram'),
                    ('Kecap Manis', 20, 'ml'),
                    ('Bawang Putih', 15, 'gram'),
                    ('Cabai Merah', 15, 'gram'),
                    ('Krupuk', 2, 'pcs'),
                ]
            },
            'Es Cendol Durian': {
                'serving_size': 1,
                'prep_time': 15,
                'cook_time': 20,
                'instructions': 'Campur cendol, santan, gula merah dengan durian',
                'ingredients': [
                    ('Cendol', 100, 'gram'),
                    ('Santan Kelapa', 150, 'ml'),
                    ('Gula Merah', 80, 'gram'),
                    ('Durian', 100, 'gram'),
                    ('Es Batu', 200, 'gram'),
                ]
            },
            'Klepon Pandan': {
                'serving_size': 1,
                'prep_time': 20,
                'cook_time': 30,
                'instructions': 'Bentuk adonan tepung ketan, isi gula merah, rebus dan gulingkan di kelapa parut',
                'ingredients': [
                    ('Tepung Ketan', 100, 'gram'),
                    ('Gula Merah', 40, 'gram'),
                    ('Kelapa Parut', 80, 'gram'),
                    ('Garam', 2, 'gram'),
                ]
            },
            'Es Teh Manis': {
                'serving_size': 1,
                'prep_time': 5,
                'cook_time': 10,
                'instructions': 'Seduh teh, tambah gula, sajikan dengan es',
                'ingredients': [
                    ('Teh Celup', 2, 'pcs'),
                    ('Gula Pasir', 30, 'gram'),
                    ('Es Batu', 150, 'gram'),
                ]
            },
            'Jus Alpukat': {
                'serving_size': 1,
                'prep_time': 10,
                'cook_time': 0,
                'instructions': 'Blender alpukat dengan susu, gula, dan es',
                'ingredients': [
                    ('Alpukat', 1, 'pcs'),
                    ('Gula Pasir', 40, 'gram'),
                    ('Santan Kelapa', 100, 'ml'),
                    ('Es Batu', 150, 'gram'),
                ]
            },
            'Wedang Jahe Merah': {
                'serving_size': 1,
                'prep_time': 10,
                'cook_time': 20,
                'instructions': 'Rebus jahe merah dengan gula merah hingga harum',
                'ingredients': [
                    ('Jahe Merah', 50, 'gram'),
                    ('Gula Merah', 60, 'gram'),
                    ('Serai', 1, 'batang'),
                    ('Gula Pasir', 20, 'gram'),
                ]
            },
        }

        # Create recipes for products
        recipes_created = 0
        recipes_skipped = 0

        for product_name, recipe_data in recipes_data.items():
            try:
                product = Product.objects.get(name=product_name)

                # Check if recipe already exists
                if hasattr(product, 'recipe'):
                    self.stdout.write(f"  Skipped: {product_name} (recipe already exists)")
                    recipes_skipped += 1
                    continue

                # Create recipe
                recipe = Recipe.objects.create(
                    product=product,
                    branch=branch,
                    serving_size=Decimal(str(recipe_data['serving_size'])),
                    preparation_time=recipe_data['prep_time'],
                    cooking_time=recipe_data['cook_time'],
                    instructions=recipe_data['instructions'],
                    is_active=True
                )

                # Add ingredients
                for ingredient_name, quantity, unit in recipe_data['ingredients']:
                    if ingredient_name in inventory_map:
                        RecipeIngredient.objects.create(
                            recipe=recipe,
                            inventory_item=inventory_map[ingredient_name],
                            quantity=Decimal(str(quantity)),
                            unit=unit
                        )
                    else:
                        self.stdout.write(self.style.WARNING(f"    Missing inventory: {ingredient_name}"))

                # Calculate cost
                total_cost = recipe.total_cost
                cost_per_serving = recipe.cost_per_serving
                profit_margin = recipe.profit_margin

                self.stdout.write(
                    self.style.SUCCESS(
                        f"  ✓ {product_name}: {recipe.ingredients.count()} ingredients, "
                        f"Cost: Rp {cost_per_serving:,.0f}, "
                        f"Margin: {profit_margin:.1f}%"
                    )
                )
                recipes_created += 1

            except Product.DoesNotExist:
                self.stdout.write(self.style.ERROR(f"  Product not found: {product_name}"))

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✓ Recipe creation complete!\n'
                f'  Created: {recipes_created} recipes\n'
                f'  Skipped: {recipes_skipped} recipes\n'
                f'  Total products: {Product.objects.count()}\n'
                f'  Products with recipes: {Recipe.objects.count()}'
            )
        )
