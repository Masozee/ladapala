# Product Images Management

This guide explains how to bulk update product images for testing and production use.

## Files Created

1. **`apps/restaurant/management/commands/update_product_images.py`** - Downloads images from URLs
2. **`apps/restaurant/management/commands/generate_test_images.py`** - Generates test placeholder images
3. **`product_images.json`** - Configuration file with placeholder URLs for testing
4. **`PRODUCT_IMAGES_USAGE.md`** - This documentation file

## Setup

1. **Edit `product_images.json`** with your legally sourced image URLs:
   ```json
   {
     "image_mapping": {
       "nasi liwet": "https://your-legal-image-source.com/nasi-liwet.jpg",
       "gado gado": "https://your-legal-image-source.com/gado-gado.jpg"
     }
   }
   ```

2. **Ensure you have proper licensing** for all images you use.

## Usage Commands

### Method 1: Generate Test Images Locally (Recommended for Testing)

Generate colored placeholder images with product names:
```bash
# Generate test images for all products
python manage.py generate_test_images

# Generate for specific restaurant
python manage.py generate_test_images --restaurant-id 1

# Custom image size
python manage.py generate_test_images --size 600x400
```

### Method 2: Download from URLs (For Production)

#### Test run first
```bash
python manage.py update_product_images --dry-run
```

#### Update all products
```bash
python manage.py update_product_images
```

#### Update specific restaurant
```bash
python manage.py update_product_images --restaurant-id 1
```

#### Use custom config file
```bash
python manage.py update_product_images --config-file my_images.json
```

## How It Works

### Test Image Generator (`generate_test_images`)
1. **Color Selection**: Automatically assigns colors based on food type (nasi=beige, ayam=orange, etc.)
2. **Image Creation**: Generates PNG images with product names as text
3. **Smart Layout**: Centers text, adds borders, and includes "TEST IMAGE" watermark
4. **Local Generation**: No internet required, instant image creation

### URL Image Downloader (`update_product_images`)
1. **Product Matching**: Normalizes product names and matches against JSON config keys
2. **Image Download**: Downloads images from URLs and saves to Django media directory
3. **File Naming**: Creates filenames using product SKU and normalized name
4. **Error Handling**: Provides detailed error messages for failed downloads

## Image Sources (Legal Options)

### Free Stock Photos
- **Unsplash** (https://unsplash.com) - Free for commercial use
- **Pexels** (https://pexels.com) - Free for commercial use
- **Pixabay** (https://pixabay.com) - Free for commercial use

### Paid Stock Photos
- Getty Images
- Shutterstock
- Adobe Stock

### Your Own Content
- Restaurant photography
- Staff-taken photos
- Commissioned photography

## Example JSON Configuration

```json
{
  "image_mapping": {
    "nasi liwet": "https://images.unsplash.com/photo-1596040033229-a40b5c5d2c8a?w=400",
    "gado gado": "https://images.unsplash.com/photo-1565299507177-b0ac66763828?w=400",
    "rendang": "https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=400"
  },
  "notes": {
    "legal_notice": "Ensure proper licensing for all images used"
  }
}
```

## Product Model Integration

The command updates the `image` field in the Product model:
```python
# apps/restaurant/models.py - line 103
image = models.ImageField(upload_to='products/', blank=True, null=True)
```

Images are saved to `media/products/` directory with filenames like:
- `PRD12345678_nasi_liwet.jpg`
- `PRD87654321_gado_gado.jpg`

## Error Handling

The command provides detailed feedback:
- **Success**: Shows updated products
- **Warnings**: Products without matching image URLs
- **Errors**: Download failures, save errors, invalid JSON

## Legal Compliance

⚠️ **Important**: Always ensure you have proper licensing for any images you use. The sample URLs provided are examples only and should be replaced with your legally sourced images.

## Dependencies

- `requests>=2.32.5` (automatically added to pyproject.toml)
- Django's ImageField and file handling
- Pillow for image processing