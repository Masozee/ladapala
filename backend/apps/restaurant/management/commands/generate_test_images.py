import os
from PIL import Image, ImageDraw, ImageFont
from django.core.management.base import BaseCommand
from django.core.files.base import ContentFile
from django.conf import settings
from apps.restaurant.models import Product
import io


class Command(BaseCommand):
    help = 'Generate test placeholder images for products'

    def add_arguments(self, parser):
        parser.add_argument(
            '--restaurant-id',
            type=int,
            help='Only update products for specific restaurant ID',
        )
        parser.add_argument(
            '--size',
            type=str,
            default='400x300',
            help='Image size (default: 400x300)',
        )

    def handle(self, *args, **options):
        restaurant_id = options.get('restaurant_id')
        size_str = options['size']
        
        # Parse size
        width, height = map(int, size_str.split('x'))
        
        # Indonesian food colors palette
        food_colors = {
            'nasi': (255, 248, 220),  # Beige for rice dishes
            'ayam': (255, 140, 0),    # Orange for chicken
            'ikan': (70, 130, 180),   # Steel blue for fish
            'sate': (210, 105, 30),   # Chocolate for satay
            'soto': (255, 215, 0),    # Gold for soup
            'bakso': (192, 192, 192), # Silver for meatballs
            'mie': (255, 218, 185),   # Peach for noodles
            'rendang': (139, 69, 19), # Saddle brown for rendang
            'gado': (144, 238, 144),  # Light green for salad
            'es': (173, 216, 230),    # Light blue for ice drinks
            'jus': (50, 205, 50),     # Lime green for juice
            'sambal': (220, 20, 60),  # Crimson for sambal
            'pecel': (255, 165, 0),   # Orange
            'gudeg': (160, 82, 45),   # Sienna
            'rawon': (47, 79, 79),    # Dark slate gray
            'default': (105, 105, 105) # Dim gray
        }
        
        # Build queryset
        queryset = Product.objects.all()
        if restaurant_id:
            queryset = queryset.filter(restaurant_id=restaurant_id)
        
        total_count = queryset.count()
        updated_count = 0
        
        self.stdout.write(f"Generating test images for {total_count} products...")
        
        for product in queryset:
            try:
                # Determine color based on product name
                color = food_colors['default']
                product_lower = product.name.lower()
                
                for keyword, keyword_color in food_colors.items():
                    if keyword in product_lower:
                        color = keyword_color
                        break
                
                # Create image
                image = self.create_placeholder_image(
                    product.name,
                    width,
                    height,
                    color
                )
                
                # Save to product
                filename = f"{product.sku or product.id}_test.png"
                image_io = io.BytesIO()
                image.save(image_io, format='PNG')
                image_io.seek(0)
                
                content = ContentFile(image_io.read())
                product.image.save(filename, content, save=True)
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Generated image for '{product.name}'"
                    )
                )
                updated_count += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(
                        f"Failed to generate image for '{product.name}': {str(e)}"
                    )
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully generated {updated_count} out of {total_count} images"
            )
        )

    def create_placeholder_image(self, text, width, height, bg_color):
        """Create a placeholder image with text"""
        # Create image with background color
        image = Image.new('RGB', (width, height), bg_color)
        draw = ImageDraw.Draw(image)
        
        # Calculate text color (contrast with background)
        text_color = (255, 255, 255) if sum(bg_color) < 400 else (0, 0, 0)
        
        # Try to use a font, fall back to default if not available
        font_size = min(width, height) // 10
        try:
            # Try to use a system font
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            # Fall back to default font
            font = ImageFont.load_default()
        
        # Add product name
        text_lines = self.wrap_text(text, width - 40, draw, font)
        
        # Calculate total text height
        line_height = font_size + 10
        total_height = len(text_lines) * line_height
        
        # Starting Y position to center text vertically
        y = (height - total_height) // 2
        
        # Draw each line
        for line in text_lines:
            # Get text bbox for centering
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            
            # Center text horizontally
            x = (width - text_width) // 2
            
            # Draw text with shadow for better visibility
            shadow_offset = 2
            draw.text((x + shadow_offset, y + shadow_offset), line, 
                     fill=(0, 0, 0, 128), font=font)
            draw.text((x, y), line, fill=text_color, font=font)
            
            y += line_height
        
        # Add border
        border_color = tuple(int(c * 0.8) for c in bg_color)
        draw.rectangle([(0, 0), (width-1, height-1)], outline=border_color, width=3)
        
        # Add "TEST IMAGE" watermark
        watermark = "TEST IMAGE"
        try:
            watermark_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 14)
        except:
            watermark_font = ImageFont.load_default()
        
        bbox = draw.textbbox((0, 0), watermark, font=watermark_font)
        wm_width = bbox[2] - bbox[0]
        draw.text((width - wm_width - 10, height - 25), watermark, 
                 fill=(128, 128, 128, 128), font=watermark_font)
        
        return image

    def wrap_text(self, text, max_width, draw, font):
        """Wrap text to fit within max_width"""
        words = text.split()
        lines = []
        current_line = []
        
        for word in words:
            test_line = ' '.join(current_line + [word])
            bbox = draw.textbbox((0, 0), test_line, font=font)
            text_width = bbox[2] - bbox[0]
            
            if text_width <= max_width:
                current_line.append(word)
            else:
                if current_line:
                    lines.append(' '.join(current_line))
                    current_line = [word]
                else:
                    lines.append(word)
        
        if current_line:
            lines.append(' '.join(current_line))
        
        return lines if lines else [text]