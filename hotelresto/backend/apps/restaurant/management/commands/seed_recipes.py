from django.core.management.base import BaseCommand
from apps.restaurant.models import Product, Inventory, Recipe, RecipeIngredient, Branch
from decimal import Decimal


class Command(BaseCommand):
    help = 'Create realistic Indonesian recipe BOMs using actual inventory items'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING('Starting recipe BOM seeding...'))

        # Get branch
        branch = Branch.objects.first()
        if not branch:
            self.stdout.write(self.style.ERROR('No branch found in database'))
            return

        # Delete existing recipes
        deleted_recipes = Recipe.objects.all().delete()[0]
        self.stdout.write(self.style.WARNING(f'Deleted {deleted_recipes} existing recipes'))

        # Get kitchen inventory items (these are what recipes use)
        try:
            inv_beras = Inventory.objects.get(name='Beras Premium', location='KITCHEN')
            inv_daging = Inventory.objects.get(name='Daging Sapi', location='KITCHEN')
            inv_ayam = Inventory.objects.get(name='Ayam Kampung', location='KITCHEN')
            inv_santan = Inventory.objects.get(name='Santan Kelapa', location='KITCHEN')
            inv_bawang = Inventory.objects.get(name='Bawang Merah', location='KITCHEN')
            inv_cabai = Inventory.objects.get(name='Cabai Merah', location='KITCHEN')
            inv_minyak = Inventory.objects.get(name='Minyak Goreng', location='KITCHEN')
            inv_gula = Inventory.objects.get(name='Gula Merah', location='KITCHEN')
            inv_alpukat = Inventory.objects.get(name='Alpukat', location='KITCHEN')
            inv_durian = Inventory.objects.get(name='Durian', location='KITCHEN')
        except Inventory.DoesNotExist as e:
            self.stdout.write(self.style.ERROR(f'Kitchen inventory not found: {e}'))
            self.stdout.write(self.style.ERROR('Please run seed_kitchen_items first'))
            return

        # Recipe data structure
        recipes_data = {
            'Nasi Gudeg Jogja': {
                'prep_time': 30, 'cook_time': 180,
                'instructions': '1. Rebus nangka muda dengan santan dan bumbu halus\n2. Masak hingga bumbu meresap (3-4 jam)\n3. Sajikan dengan nasi putih, telur, dan krecek',
                'ingredients': [(inv_beras, 200, 'gram', 'nasi putih'), (inv_santan, 150, 'ml', 'kental'), (inv_gula, 30, 'gram', 'untuk rasa manis'), (inv_bawang, 20, 'gram', 'bumbu halus'), (inv_cabai, 5, 'gram', 'optional')]
            },
            'Nasi Liwet Solo': {
                'prep_time': 20, 'cook_time': 45,
                'instructions': '1. Masak beras dengan santan dan bumbu\n2. Tambahkan ayam suwir dan sayuran\n3. Masak hingga nasi matang dan harum',
                'ingredients': [(inv_beras, 250, 'gram', 'nasi liwet'), (inv_ayam, 100, 'gram', 'suwir'), (inv_santan, 200, 'ml', 'santan kental'), (inv_bawang, 15, 'gram', 'iris halus')]
            },
            'Nasi Padang Komplit': {
                'prep_time': 40, 'cook_time': 90,
                'instructions': '1. Masak rendang daging sapi\n2. Buat sambal dan sayur\n3. Sajikan dengan nasi putih hangat',
                'ingredients': [(inv_beras, 250, 'gram', 'nasi putih'), (inv_daging, 150, 'gram', 'rendang'), (inv_santan, 200, 'ml', 'untuk rendang'), (inv_cabai, 30, 'gram', 'sambal'), (inv_bawang, 25, 'gram', 'bumbu'), (inv_minyak, 20, 'ml', 'menumis')]
            },
            'Bubur Ayam': {
                'prep_time': 15, 'cook_time': 60,
                'instructions': '1. Rebus beras hingga menjadi bubur\n2. Tumis bumbu dan ayam suwir\n3. Sajikan bubur dengan topping ayam, bawang goreng, dan kacang',
                'ingredients': [(inv_beras, 100, 'gram', 'untuk bubur'), (inv_ayam, 80, 'gram', 'suwir'), (inv_bawang, 15, 'gram', 'bumbu'), (inv_minyak, 15, 'ml', 'menumis')]
            },
            'Lontong Sayur': {
                'prep_time': 25, 'cook_time': 45,
                'instructions': '1. Buat lontong dari beras\n2. Masak sayur dengan santan\n3. Sajikan dengan sambal dan kerupuk',
                'ingredients': [(inv_beras, 150, 'gram', 'lontong'), (inv_santan, 180, 'ml', 'sayur santan'), (inv_bawang, 10, 'gram', 'bumbu'), (inv_cabai, 8, 'gram', 'sambal')]
            },
            'Soto Betawi': {
                'prep_time': 30, 'cook_time': 120,
                'instructions': '1. Rebus daging sapi hingga empuk\n2. Buat kuah dengan santan dan bumbu\n3. Sajikan dengan nasi dan emping',
                'ingredients': [(inv_daging, 200, 'gram', 'daging sapi'), (inv_santan, 250, 'ml', 'kuah soto'), (inv_bawang, 20, 'gram', 'bumbu'), (inv_cabai, 10, 'gram', 'sambal'), (inv_minyak, 15, 'ml', 'menumis')]
            },
            'Rawon Surabaya': {
                'prep_time': 35, 'cook_time': 150,
                'instructions': '1. Rebus daging dengan bumbu kluwak\n2. Masak hingga daging empuk dan kuah hitam pekat\n3. Sajikan dengan nasi dan tauge',
                'ingredients': [(inv_daging, 180, 'gram', 'daging sapi'), (inv_bawang, 25, 'gram', 'bumbu halus'), (inv_cabai, 15, 'gram', 'sambal'), (inv_minyak, 20, 'ml', 'menumis')]
            },
            'Sop Buntut Bakar': {
                'prep_time': 45, 'cook_time': 180,
                'instructions': '1. Rebus buntut sapi hingga empuk\n2. Bakar buntut sebelum disajikan\n3. Buat kuah kaldu dengan sayuran',
                'ingredients': [(inv_daging, 250, 'gram', 'buntut sapi'), (inv_bawang, 20, 'gram', 'bumbu'), (inv_minyak, 15, 'ml', 'untuk membakar')]
            },
            'Gado-gado': {
                'prep_time': 25, 'cook_time': 20,
                'instructions': '1. Rebus sayuran\n2. Buat bumbu kacang dengan santan\n3. Siram sayuran dengan bumbu kacang',
                'ingredients': [(inv_santan, 100, 'ml', 'bumbu kacang'), (inv_bawang, 10, 'gram', 'bumbu'), (inv_cabai, 8, 'gram', 'sambal'), (inv_gula, 15, 'gram', 'bumbu kacang')]
            },
            'Ketoprak': {
                'prep_time': 20, 'cook_time': 15,
                'instructions': '1. Rebus bihun dan tahu\n2. Buat bumbu kacang\n3. Campur semua bahan dan siram bumbu kacang',
                'ingredients': [(inv_beras, 50, 'gram', 'lontong'), (inv_santan, 80, 'ml', 'bumbu kacang'), (inv_bawang, 8, 'gram', 'bumbu'), (inv_cabai, 5, 'gram', 'sambal')]
            },
            'Es Cendol Durian': {
                'prep_time': 15, 'cook_time': 10,
                'instructions': '1. Buat cendol dari tepung beras\n2. Siapkan santan dan gula merah cair\n3. Tambahkan durian dan es batu',
                'ingredients': [(inv_durian, 100, 'gram', 'daging buah'), (inv_santan, 150, 'ml', 'santan cendol'), (inv_gula, 50, 'gram', 'gula merah cair')]
            },
            'Klepon Pandan': {
                'prep_time': 30, 'cook_time': 20,
                'instructions': '1. Buat adonan dari tepung ketan\n2. Isi dengan gula merah\n3. Rebus dan gulingkan di kelapa parut',
                'ingredients': [(inv_beras, 80, 'gram', 'tepung ketan'), (inv_gula, 40, 'gram', 'isian'), (inv_santan, 30, 'ml', 'kelapa parut')]
            },
            'Es Teh Manis': {
                'prep_time': 5, 'cook_time': 5,
                'instructions': '1. Seduh teh dengan air panas\n2. Tambahkan gula\n3. Dinginkan dengan es batu',
                'ingredients': [(inv_gula, 20, 'gram', 'pemanis')]
            },
            'Jus Alpukat': {
                'prep_time': 10, 'cook_time': 0,
                'instructions': '1. Keruk daging alpukat\n2. Blender dengan susu dan gula\n3. Tambahkan es batu',
                'ingredients': [(inv_alpukat, 200, 'gram', 'alpukat matang'), (inv_gula, 30, 'gram', 'pemanis'), (inv_santan, 50, 'ml', 'susu/santan')]
            },
            'Wedang Jahe Merah': {
                'prep_time': 10, 'cook_time': 15,
                'instructions': '1. Rebus jahe merah dengan air\n2. Tambahkan gula merah\n3. Sajikan hangat',
                'ingredients': [(inv_gula, 40, 'gram', 'gula merah')]
            },
        }

        recipes_created = 0
        ingredients_created = 0

        self.stdout.write(self.style.SUCCESS(f'\n📖 Creating recipes for {len(recipes_data)} menu items...\n'))

        for product_name, recipe_data in recipes_data.items():
            try:
                product = Product.objects.get(name=product_name)
                recipe = Recipe.objects.create(
                    product=product, branch=branch, serving_size=1,
                    preparation_time=recipe_data['prep_time'],
                    cooking_time=recipe_data['cook_time'],
                    instructions=recipe_data['instructions'],
                    is_active=True
                )
                recipes_created += 1
                recipe_cost = Decimal('0')
                ingredient_list = []

                for inv_item, qty, unit, notes in recipe_data['ingredients']:
                    ingredient = RecipeIngredient.objects.create(
                        recipe=recipe, inventory_item=inv_item,
                        quantity=Decimal(str(qty)), unit=unit, notes=notes
                    )
                    ingredients_created += 1
                    ing_cost = ingredient.total_cost
                    recipe_cost += Decimal(str(ing_cost))
                    ingredient_list.append(f'      • {inv_item.name}: {qty} {unit} = Rp {ing_cost:,.0f}')

                product_price = Decimal(str(product.price))
                profit = product_price - recipe_cost
                margin_pct = (profit / product_price * 100) if product_price > 0 else 0

                self.stdout.write(self.style.SUCCESS(f'✓ {product_name}'))
                self.stdout.write(f'   Harga Jual: Rp {product_price:,.0f}')
                self.stdout.write(f'   Biaya Bahan: Rp {recipe_cost:,.0f}')
                self.stdout.write(f'   Profit: Rp {profit:,.0f} ({margin_pct:.1f}%)')
                self.stdout.write(f'   Waktu: {recipe_data["prep_time"]}min prep + {recipe_data["cook_time"]}min masak')
                self.stdout.write(f'   Bahan ({len(recipe_data["ingredients"])} items):')
                for ing in ingredient_list:
                    self.stdout.write(ing)
                self.stdout.write('')

            except Product.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'   ⚠ Product not found: {product_name}'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'   ✗ Error: {product_name}: {str(e)}'))

        self.stdout.write(self.style.SUCCESS(f'\n✅ Created: {recipes_created} recipes, {ingredients_created} ingredients'))

        recipes = Recipe.objects.all()
        total_margin = Decimal('0')
        self.stdout.write(self.style.SUCCESS(f'\n💰 Profit Margin Summary:'))

        for recipe in recipes:
            cost = Decimal(str(recipe.cost_per_serving))
            price = Decimal(str(recipe.product.price))
            profit = price - cost
            margin = (profit / price * 100) if price > 0 else 0
            total_margin += margin
            self.stdout.write(f'   {recipe.product.name:<30} Cost: Rp {cost:>8,.0f}  Price: Rp {price:>8,.0f}  Margin: {margin:>5.1f}%')

        avg_margin = total_margin / len(recipes) if recipes else 0
        self.stdout.write(self.style.SUCCESS(f'\n   Average Profit Margin: {avg_margin:.1f}%'))
