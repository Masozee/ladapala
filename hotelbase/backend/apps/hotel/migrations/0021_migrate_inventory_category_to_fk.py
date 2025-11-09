# Generated migration to convert category from CharField to ForeignKey

from django.db import migrations, models
import django.db.models.deletion


def migrate_categories_forward(apps, schema_editor):
    """Map old category string values to AmenityCategory IDs"""
    InventoryItem = apps.get_model('hotel', 'InventoryItem')
    AmenityCategory = apps.get_model('hotel', 'AmenityCategory')

    # Mapping of old categories to new categories
    category_mapping = {
        'AMENITIES': 'TOILETRIES',  # Guest Amenities -> Toiletries & Bath
        'FOOD': 'FOOD_BEVERAGE',     # Food & Beverage
        'CLEANING': 'LAUNDRY',       # Cleaning Supplies -> Laundry & Cleaning
        'ROOM_SUPPLIES': 'LAUNDRY',  # Room Supplies -> Laundry & Cleaning
        'MAINTENANCE': 'OTHER',      # Maintenance -> Other
        'OFFICE': 'OTHER',           # Office Supplies -> Other
    }

    # Get or create the categories
    for old_cat, new_cat in category_mapping.items():
        try:
            new_category = AmenityCategory.objects.get(name=new_cat)
            # Update all items with old category to new category ID
            InventoryItem.objects.filter(category=old_cat).update(category_temp_id=new_category.id)
        except AmenityCategory.DoesNotExist:
            print(f"Warning: AmenityCategory '{new_cat}' not found")

    # Handle items that already have the new category names
    for category in AmenityCategory.objects.all():
        InventoryItem.objects.filter(category=category.name).update(category_temp_id=category.id)


def migrate_categories_backward(apps, schema_editor):
    """Reverse migration - convert ForeignKey back to CharField"""
    InventoryItem = apps.get_model('hotel', 'InventoryItem')
    AmenityCategory = apps.get_model('hotel', 'AmenityCategory')

    # Map back to old categories
    reverse_mapping = {
        'TOILETRIES': 'AMENITIES',
        'FOOD_BEVERAGE': 'FOOD',
        'LAUNDRY': 'CLEANING',
        'OTHER': 'OTHER',
    }

    for item in InventoryItem.objects.all():
        if item.category_temp_id:
            try:
                category = AmenityCategory.objects.get(id=item.category_temp_id)
                old_category = reverse_mapping.get(category.name, 'OTHER')
                item.category = old_category
                item.save(update_fields=['category'])
            except AmenityCategory.DoesNotExist:
                item.category = 'OTHER'
                item.save(update_fields=['category'])


class Migration(migrations.Migration):

    dependencies = [
        ('hotel', '0020_alter_room_status'),
    ]

    operations = [
        # Step 1: Add temporary integer field for the new FK
        migrations.AddField(
            model_name='inventoryitem',
            name='category_temp_id',
            field=models.IntegerField(null=True, blank=True),
        ),

        # Step 2: Migrate data from old category to temp field
        migrations.RunPython(migrate_categories_forward, migrate_categories_backward),

        # Step 3: Remove old category field
        migrations.RemoveField(
            model_name='inventoryitem',
            name='category',
        ),

        # Step 4: Add new category as ForeignKey
        migrations.AddField(
            model_name='inventoryitem',
            name='category',
            field=models.ForeignKey(
                help_text='Category from Amenity Categories',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='inventory_items',
                to='hotel.amenitycategory',
                null=True,
            ),
        ),

        # Step 5: Copy data from temp to new FK field
        migrations.RunSQL(
            "UPDATE hotel_inventoryitem SET category_id = category_temp_id",
            reverse_sql="UPDATE hotel_inventoryitem SET category_temp_id = category_id",
        ),

        # Step 6: Make category non-nullable
        migrations.AlterField(
            model_name='inventoryitem',
            name='category',
            field=models.ForeignKey(
                help_text='Category from Amenity Categories',
                on_delete=django.db.models.deletion.PROTECT,
                related_name='inventory_items',
                to='hotel.amenitycategory',
            ),
        ),

        # Step 7: Remove temporary field
        migrations.RemoveField(
            model_name='inventoryitem',
            name='category_temp_id',
        ),
    ]
