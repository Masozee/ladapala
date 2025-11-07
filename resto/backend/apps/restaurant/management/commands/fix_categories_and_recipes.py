from django.core.management.base import BaseCommand
from apps.restaurant.models import Product, Category, Recipe, RecipeIngredient, Inventory, Branch
from decimal import Decimal


class Command(BaseCommand):
    help = 'Fix product categories and create recipes'

    def handle(self, *args, **options):
        self.stdout.write('Fixing product categories and creating recipes...\n')

        # Get branch
        branch = Branch.objects.first()
        if not branch:
            self.stdout.write(self.style.ERROR('No branch found!'))
            return

        # Get categories
        categories = {
            'Nasi & Makanan Utama': Category.objects.filter(name='Nasi & Makanan Utama').first(),
            'Sarapan & Jajanan Pagi': Category.objects.filter(name='Sarapan & Jajanan Pagi').first(),
            'Sup & Berkuah': Category.objects.filter(name='Sup & Berkuah').first(),
            'Pembuka & Camilan': Category.objects.filter(name='Pembuka & Camilan').first(),
            'Pencuci Mulut': Category.objects.filter(name='Pencuci Mulut').first(),
            'Minuman': Category.objects.filter(name='Minuman').first(),
        }

        # Product to category mapping
        product_categories = {
            'Gado-gado': 'Pembuka & Camilan',
            'Ketoprak': 'Pembuka & Camilan',
            'Es Cendol Durian': 'Pencuci Mulut',
            'Es Teh Manis': 'Minuman',
            'Jus Alpukat': 'Minuman',
        }

        # Fix categories for products without category
        products_without_category = Product.objects.filter(category__isnull=True)
        self.stdout.write(f'Found {products_without_category.count()} products without category\n')

        for product in products_without_category:
            category_name = product_categories.get(product.name)
            if category_name and categories[category_name]:
                product.category = categories[category_name]
                product.save()
                self.stdout.write(f'  ✓ Set {product.name} to {category_name}')

        # Create recipes for products that don't have recipes
        products = Product.objects.filter(is_available=True)
        inventory_items = list(Inventory.objects.all()[:10])  # Get some inventory items

        recipes_created = 0
        for product in products:
            # Check if recipe already exists
            if Recipe.objects.filter(product=product).exists():
                continue

            # Create recipe
            recipe = Recipe.objects.create(
                product=product,
                branch=branch,
                instructions=f'Resep untuk membuat {product.name}. Ikuti langkah-langkah dengan hati-hati.',
                preparation_time=15,
                cooking_time=20,
                serving_size=1,
                notes='Resep standar'
            )

            # Add 2-4 random ingredients
            import random
            num_ingredients = random.randint(2, min(4, len(inventory_items)))
            selected_items = random.sample(inventory_items, num_ingredients)

            for item in selected_items:
                RecipeIngredient.objects.create(
                    recipe=recipe,
                    inventory_item=item,
                    quantity=Decimal(str(random.uniform(0.1, 0.5))),
                    unit=item.unit,
                    notes=f'Tambahkan {item.name}'
                )

            recipes_created += 1
            self.stdout.write(f'  ✓ Created recipe for {product.name} with {num_ingredients} ingredients')

        self.stdout.write(self.style.SUCCESS(f'\nDone! Created {recipes_created} recipes'))
