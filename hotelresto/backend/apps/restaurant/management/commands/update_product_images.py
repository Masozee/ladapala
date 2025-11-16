import os
import json
import requests
from django.core.management.base import BaseCommand, CommandError
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.conf import settings
from apps.restaurant.models import Product


class Command(BaseCommand):
    help = 'Update product images from URLs based on product names'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be updated without making changes',
        )
        parser.add_argument(
            '--restaurant-id',
            type=int,
            help='Only update products for specific restaurant ID',
        )
        parser.add_argument(
            '--config-file',
            type=str,
            default='product_images.json',
            help='JSON file containing image URL mappings (default: product_images.json)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        restaurant_id = options.get('restaurant_id')
        config_file = options['config_file']

        # Load image mapping from JSON file
        image_mapping = self.load_image_mapping(config_file)

        # Build queryset
        queryset = Product.objects.all()
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)

        updated_count = 0
        total_count = queryset.count()

        self.stdout.write(f"Processing {total_count} products...")

        for product in queryset:
            # Normalize product name for matching
            normalized_name = product.name.lower().strip()
            
            # Check if we have an image URL for this product
            image_url = None
            for key, url in image_mapping.items():
                if key in normalized_name:
                    image_url = url
                    break

            if image_url:
                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"[DRY RUN] Would update '{product.name}' with image: {image_url}"
                        )
                    )
                    updated_count += 1
                else:
                    try:
                        self.update_product_image(product, image_url)
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"Updated '{product.name}' with image: {image_url}"
                            )
                        )
                        updated_count += 1
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(
                                f"Failed to update '{product.name}': {str(e)}"
                            )
                        )
            else:
                self.stdout.write(
                    self.style.WARNING(
                        f"No image URL found for product: '{product.name}'"
                    )
                )

        if dry_run:
            self.stdout.write(
                self.style.SUCCESS(
                    f"[DRY RUN] Would update {updated_count} out of {total_count} products"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully updated {updated_count} out of {total_count} products"
                )
            )

    def update_product_image(self, product, image_url):
        """Download image from URL and save to product"""
        try:
            # Download the image
            response = requests.get(image_url, timeout=30)
            response.raise_for_status()

            # Create filename from product name
            filename = f"{product.sku or product.id}_{product.name.lower().replace(' ', '_')}.jpg"
            
            # Save the image to the product
            content = ContentFile(response.content)
            product.image.save(filename, content, save=True)
            
            self.stdout.write(f"  - Saved image as: {product.image.name}")
            
        except requests.RequestException as e:
            raise CommandError(f"Failed to download image from {image_url}: {str(e)}")
        except Exception as e:
            raise CommandError(f"Failed to save image for product {product.name}: {str(e)}")

    def load_image_mapping(self, config_file):
        """Load image URL mapping from JSON file"""
        try:
            # Try to find the file in the project root first
            config_path = os.path.join(settings.BASE_DIR, config_file)
            
            if not os.path.exists(config_path):
                # Fall back to current directory
                config_path = config_file
                
            if not os.path.exists(config_path):
                raise CommandError(f"Config file not found: {config_file}")
                
            with open(config_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            image_mapping = data.get('image_mapping', {})
            
            if not image_mapping:
                raise CommandError("No image_mapping found in config file")
                
            self.stdout.write(f"Loaded {len(image_mapping)} image mappings from {config_path}")
            return image_mapping
            
        except json.JSONDecodeError as e:
            raise CommandError(f"Invalid JSON in config file: {str(e)}")
        except Exception as e:
            raise CommandError(f"Failed to load config file: {str(e)}")