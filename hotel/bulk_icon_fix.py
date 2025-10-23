#!/usr/bin/env python3
"""
Bulk icon replacement script for hotel project
Replaces all unmapped lucide-react icon patterns with hugeicons equivalents
"""

import os
import re
from pathlib import Path

# Comprehensive icon mapping from lucide-react to hugeicons
ICON_MAPPINGS = {
    # Arrow icons
    '<ArrowLeft ': '<ChevronLeftIcon ',
    '<ArrowRight ': '<ChevronRightIcon ',
    '<ArrowUp ': '<ChevronUpIcon ',
    '<ArrowDown ': '<ChevronDownIcon ',

    # Basic UI icons
    '<Plus ': '<Add01Icon ',
    '<Minus ': '<Cancel01Icon ',
    '<X ': '<Cancel01Icon ',
    '<Check ': '<UserCheckIcon ',
    '<Search ': '<Search02Icon ',
    '<Filter ': '<FilterIcon ',
    '<MoreHorizontal ': '<MoreHorizontalIcon ',
    '<MoreVertical ': '<MoreHorizontalIcon ',
    '<Menu ': '<Menu01Icon ',

    # User icons
    '<User ': '<UserIcon ',
    '<Users ': '<UserMultipleIcon ',

    # Communication
    '<Mail ': '<Mail01Icon ',
    '<Phone ': '<Call02Icon ',
    '<MessageSquare ': '<Mail01Icon ',
    '<Send ': '<ArrowRight01Icon ',
    '<Bell ': '<Notification02Icon ',
    '<BellOff ': '<Notification02Icon ',

    # Time & Calendar
    '<Clock ': '<Clock01Icon ',
    '<Calendar ': '<Calendar01Icon ',

    # Actions
    '<Edit ': '<PencilEdit02Icon ',
    '<Trash ': '<Cancel01Icon ',
    '<Eye ': '<EyeIcon ',
    '<EyeOff ': '<EyeIcon ',
    '<Settings ': '<Settings02Icon ',
    '<Download ': '<ArrowDown01Icon ',
    '<Upload ': '<ArrowUp01Icon ',
    '<RefreshCw ': '<Loading03Icon ',
    '<Loader ': '<Loading03Icon ',
    '<Share ': '<ArrowRight01Icon ',

    # Status & Alerts
    '<AlertTriangle ': '<Alert01Icon ',
    '<AlertCircle ': '<AlertCircleIcon ',
    '<Info ': '<QuestionIcon ',
    '<CheckCircle ': '<UserCheckIcon ',
    '<XCircle ': '<CancelCircleIcon ',

    # Navigation
    '<Home ': '<Home01Icon ',
    '<Building ': '<Building03Icon ',
    '<MapPin ': '<Location01Icon ',
    '<Navigation ': '<Location01Icon ',
    '<Globe ': '<Location01Icon ',

    # Files & Documents
    '<File ': '<File01Icon ',
    '<FileText ': '<File01Icon ',
    '<Folder ': '<File01Icon ',
    '<Image ': '<ViewIcon ',
    '<Video ': '<ViewIcon ',
    '<Music ': '<SparklesIcon ',

    # Security
    '<Wifi ': '<SparklesIcon ',
    '<Lock ': '<Shield01Icon ',
    '<Unlock ': '<Shield01Icon ',
    '<LogIn ': '<Logout01Icon ',
    '<LogOut ': '<Logout01Icon ',

    # Layout
    '<Grid ': '<ViewIcon ',
    '<Grid3X3 ': '<ViewIcon ',
    '<List ': '<ListViewIcon ',

    # Business & Hotel
    '<BarChart ': '<PieChartIcon ',
    '<TrendingUp ': '<ArrowUp01Icon ',
    '<DollarSign ': '<CreditCardIcon ',
    '<CreditCard ': '<CreditCardIcon ',
    '<ShoppingCart ': '<PackageIcon ',
    '<Package ': '<PackageIcon ',
    '<Truck ': '<PackageIcon ',
    '<Bed ': '<BedIcon ',
    '<Tv ': '<ViewIcon ',
    '<Coffee ': '<SparklesIcon ',
    '<Bath ': '<Shield01Icon ',

    # Misc
    '<Star ': '<SparklesIcon ',
    '<Heart ': '<SparklesIcon ',
    '<Zap ': '<SparklesIcon ',
}

def process_file(file_path):
    """Process a single TypeScript file and replace icon patterns"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        original_content = content
        replacements_made = []

        # Apply all icon mappings
        for old_pattern, new_pattern in ICON_MAPPINGS.items():
            if old_pattern in content:
                content = content.replace(old_pattern, new_pattern)
                replacements_made.append(f"{old_pattern} -> {new_pattern}")

        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return file_path, replacements_made

        return None, []

    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return None, []

def main():
    """Main function to process all .tsx files"""
    src_dir = Path('src')

    if not src_dir.exists():
        print("Error: src directory not found")
        return

    tsx_files = list(src_dir.rglob('*.tsx'))
    print(f"Found {len(tsx_files)} .tsx files to process\n")

    files_modified = []
    total_replacements = 0

    for file_path in tsx_files:
        modified_path, replacements = process_file(file_path)
        if modified_path:
            files_modified.append((modified_path, replacements))
            total_replacements += len(replacements)

    # Print summary
    print(f"\n{'='*60}")
    print(f"SUMMARY: Modified {len(files_modified)} files")
    print(f"Total replacements: {total_replacements}")
    print(f"{'='*60}\n")

    if files_modified:
        print("Files modified:")
        for file_path, replacements in files_modified:
            print(f"\n📝 {file_path}")
            for replacement in replacements:
                print(f"   ✓ {replacement}")

if __name__ == '__main__':
    main()
