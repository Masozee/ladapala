from django.core.management.base import BaseCommand
from apps.hotel.models import CleaningTemplate, CleaningTemplateItem, InventoryItem


class Command(BaseCommand):
    help = 'Seed default cleaning templates for housekeeping tasks'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Seeding cleaning templates...'))

        # Get inventory items (you'll need to have these items in your inventory first)
        try:
            bed_sheet = InventoryItem.objects.filter(name__icontains='Bed Sheet').first() or \
                       InventoryItem.objects.filter(name__icontains='Sprei').first()
            bath_towel = InventoryItem.objects.filter(name__icontains='Bath Towel').first() or \
                        InventoryItem.objects.filter(name__icontains='Handuk Mandi').first()
            hand_towel = InventoryItem.objects.filter(name__icontains='Hand Towel').first() or \
                        InventoryItem.objects.filter(name__icontains='Handuk Tangan').first()
            shampoo = InventoryItem.objects.filter(name__icontains='Shampoo').first()
            soap = InventoryItem.objects.filter(name__icontains='Soap').first() or \
                  InventoryItem.objects.filter(name__icontains='Sabun').first()
            toothbrush = InventoryItem.objects.filter(name__icontains='Toothbrush').first() or \
                        InventoryItem.objects.filter(name__icontains='Sikat Gigi').first()
            tissue = InventoryItem.objects.filter(name__icontains='Tissue').first() or \
                    InventoryItem.objects.filter(name__icontains='Tisu').first()
            detergent = InventoryItem.objects.filter(name__icontains='Detergent').first() or \
                       InventoryItem.objects.filter(name__icontains='Deterjen').first()

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error fetching inventory items: {e}'))
            return

        # Create CHECKOUT_CLEANING template
        checkout_template, created = CleaningTemplate.objects.get_or_create(
            task_type='CHECKOUT_CLEANING',
            room_type=None,  # Generic for all room types
            defaults={
                'name': 'Standard Checkout Cleaning',
                'description': 'Default items for checkout cleaning (2 guests standard)',
                'is_active': True
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('✓ Created Checkout Cleaning template'))

            # Add items to template
            items_to_add = [
                (bed_sheet, 2, 10, False, 'Replace all bed linens'),
                (bath_towel, 2, 20, False, 'Replace bath towels'),
                (hand_towel, 2, 30, False, 'Replace hand towels'),
                (shampoo, 2, 40, False, 'Refill shampoo'),
                (soap, 4, 50, False, 'Refill soap'),
                (toothbrush, 2, 60, True, 'Optional amenity'),
                (tissue, 2, 70, False, 'Replace tissue'),
            ]

            for item, qty, sort, optional, notes in items_to_add:
                if item:
                    CleaningTemplateItem.objects.get_or_create(
                        template=checkout_template,
                        inventory_item=item,
                        defaults={
                            'quantity': qty,
                            'is_optional': optional,
                            'notes': notes,
                            'sort_order': sort
                        }
                    )
                    self.stdout.write(f'  + Added: {item.name} x{qty}')
        else:
            self.stdout.write(self.style.WARNING('- Checkout Cleaning template already exists'))

        # Create DEEP_CLEANING template
        deep_template, created = CleaningTemplate.objects.get_or_create(
            task_type='DEEP_CLEANING',
            room_type=None,
            defaults={
                'name': 'Standard Deep Cleaning',
                'description': 'Thorough cleaning with all items replaced',
                'is_active': True
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('✓ Created Deep Cleaning template'))

            items_to_add = [
                (bed_sheet, 2, 10, False, 'Replace all linens'),
                (bath_towel, 2, 20, False, 'Replace towels'),
                (hand_towel, 2, 30, False, 'Replace hand towels'),
                (detergent, 1, 40, False, 'For deep cleaning'),
            ]

            for item, qty, sort, optional, notes in items_to_add:
                if item:
                    CleaningTemplateItem.objects.get_or_create(
                        template=deep_template,
                        inventory_item=item,
                        defaults={
                            'quantity': qty,
                            'is_optional': optional,
                            'notes': notes,
                            'sort_order': sort
                        }
                    )
                    self.stdout.write(f'  + Added: {item.name} x{qty}')
        else:
            self.stdout.write(self.style.WARNING('- Deep Cleaning template already exists'))

        # Create TURNDOWN_SERVICE template
        turndown_template, created = CleaningTemplate.objects.get_or_create(
            task_type='TURNDOWN_SERVICE',
            room_type=None,
            defaults={
                'name': 'Standard Turndown Service',
                'description': 'Evening turndown service items',
                'is_active': True
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS('✓ Created Turndown Service template'))

            items_to_add = [
                (tissue, 1, 10, False, 'Replace tissue'),
            ]

            for item, qty, sort, optional, notes in items_to_add:
                if item:
                    CleaningTemplateItem.objects.get_or_create(
                        template=turndown_template,
                        inventory_item=item,
                        defaults={
                            'quantity': qty,
                            'is_optional': optional,
                            'notes': notes,
                            'sort_order': sort
                        }
                    )
                    self.stdout.write(f'  + Added: {item.name} x{qty}')
        else:
            self.stdout.write(self.style.WARNING('- Turndown Service template already exists'))

        self.stdout.write(self.style.SUCCESS('\n✅ Cleaning templates seeded successfully!'))
        self.stdout.write(self.style.SUCCESS('You can now manage templates via Django Admin or create custom ones.'))
