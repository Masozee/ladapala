#!/usr/bin/env python3
"""
Clean up icon imports - remove references to non-existent icons
"""

import os
import re
from pathlib import Path

# List of valid icons that exist in icons.tsx
VALID_ICONS = [
    'Add01Icon', 'Alert01Icon', 'AlertCircleIcon', 'ArrowRight01Icon', 'ArrowUp01Icon',
    'BedIcon', 'Building03Icon', 'Calendar01Icon', 'Call02Icon', 'Cancel01Icon',
    'CancelCircleIcon', 'CancelSquareIcon', 'ChevronDownIcon', 'ChevronLeftIcon',
    'ChevronRightIcon', 'ChevronUpIcon', 'Clock01Icon', 'CreditCardIcon', 'Door01Icon',
    'EyeIcon', 'File01Icon', 'FilterIcon', 'HeadphonesIcon', 'Home01Icon', 'HotelIcon',
    'ListViewIcon', 'Loading03Icon', 'Location01Icon', 'Logout01Icon', 'Mail01Icon',
    'Menu01Icon', 'Moon02Icon', 'MoreHorizontalIcon', 'News01Icon', 'Notification02Icon',
    'PackageIcon', 'PencilEdit02Icon', 'PieChartIcon', 'QuestionIcon', 'Search02Icon',
    'Settings02Icon', 'Shield01Icon', 'SparklesIcon', 'Sun03Icon', 'Time01Icon',
    'UserCheckIcon', 'UserIcon', 'UserMultiple02Icon', 'UserMultipleIcon',
    'UserSettings01Icon', 'ViewIcon', 'Wrench01Icon'
]

def clean_imports(file_path):
    """Remove invalid icon imports from a file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content

        # Find import statements from @/lib/icons
        import_pattern = r"import\s*\{([^}]+)\}\s*from\s*['\"]@/lib/icons['\"]"
        matches = re.finditer(import_pattern, content)

        for match in matches:
            original_import = match.group(0)
            imports_str = match.group(1)

            # Split imports and clean them
            imports = [i.strip() for i in imports_str.split(',') if i.strip()]

            # Filter to only valid icons
            valid_imports = []
            removed_imports = []

            for imp in imports:
                icon_name = imp.strip()
                if icon_name in VALID_ICONS:
                    valid_imports.append(icon_name)
                else:
                    removed_imports.append(icon_name)

            if removed_imports and valid_imports:
                # Rebuild import statement with only valid icons
                new_imports = ',\n  '.join(valid_imports)
                new_import = f"import {{\n  {new_imports}\n}} from '@/lib/icons'"
                content = content.replace(original_import, new_import)

                return file_path, removed_imports, valid_imports
            elif removed_imports and not valid_imports:
                # Remove entire import if no valid icons
                content = content.replace(original_import + '\n', '')
                return file_path, removed_imports, []

        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)

        return None, [], []

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None, [], []

def main():
    """Main function"""
    src_dir = Path('src')

    if not src_dir.exists():
        print("Error: src directory not found")
        return

    tsx_files = list(src_dir.rglob('*.tsx'))
    print(f"Checking {len(tsx_files)} files for invalid icon imports\n")

    files_cleaned = []

    for file_path in tsx_files:
        cleaned_path, removed, kept = clean_imports(file_path)
        if cleaned_path:
            files_cleaned.append((cleaned_path, removed, kept))

    print(f"\n{'='*60}")
    print(f"SUMMARY: Cleaned {len(files_cleaned)} files")
    print(f"{'='*60}\n")

    if files_cleaned:
        print("Files cleaned:")
        for file_path, removed, kept in files_cleaned:
            print(f"\n📝 {file_path}")
            print(f"   ✗ Removed: {', '.join(removed)}")
            print(f"   ✓ Kept: {len(kept)} valid icons")

if __name__ == '__main__':
    main()
