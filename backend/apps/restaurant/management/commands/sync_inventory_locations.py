from django.core.management.base import BaseCommand
from django.db import transaction
from apps.restaurant.models import Inventory


class Command(BaseCommand):
    help = 'Sync inventory items - ensure all items exist in both WAREHOUSE and KITCHEN'

    def handle(self, *args, **options):
        self.stdout.write('Starting inventory location sync...')

        with transaction.atomic():
            # Get all unique item names per branch
            warehouses = Inventory.objects.filter(location='WAREHOUSE').select_related('branch')
            kitchens = Inventory.objects.filter(location='KITCHEN').select_related('branch')

            created_count = 0

            # Ensure all warehouse items have kitchen counterparts
            for warehouse_item in warehouses:
                kitchen_exists = Inventory.objects.filter(
                    branch=warehouse_item.branch,
                    name=warehouse_item.name,
                    location='KITCHEN'
                ).exists()

                if not kitchen_exists:
                    Inventory.objects.create(
                        branch=warehouse_item.branch,
                        name=warehouse_item.name,
                        description=warehouse_item.description,
                        unit=warehouse_item.unit,
                        quantity=0,
                        min_quantity=0,
                        location='KITCHEN'
                    )
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created KITCHEN item for: {warehouse_item.name}'
                        )
                    )

            # Ensure all kitchen items have warehouse counterparts
            for kitchen_item in kitchens:
                warehouse_exists = Inventory.objects.filter(
                    branch=kitchen_item.branch,
                    name=kitchen_item.name,
                    location='WAREHOUSE'
                ).exists()

                if not warehouse_exists:
                    Inventory.objects.create(
                        branch=kitchen_item.branch,
                        name=kitchen_item.name,
                        description=kitchen_item.description,
                        unit=kitchen_item.unit,
                        quantity=0,
                        min_quantity=0,
                        location='WAREHOUSE'
                    )
                    created_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created WAREHOUSE item for: {kitchen_item.name}'
                        )
                    )

        self.stdout.write(
            self.style.SUCCESS(
                f'\nSync complete! Created {created_count} matching items.'
            )
        )
