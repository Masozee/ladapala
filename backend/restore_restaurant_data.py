#!/usr/bin/env python3
"""
Restore restaurant data from dbbak.sqlite3 to db.sqlite3
Preserves existing data and adds missing records
"""

import sqlite3
import sys
from pathlib import Path

# Database paths
BACKUP_DB = Path(__file__).parent / "dbbak.sqlite3"
CURRENT_DB = Path(__file__).parent / "db.sqlite3"

def restore_data():
    """Restore restaurant data from backup"""

    if not BACKUP_DB.exists():
        print(f"❌ Backup database not found: {BACKUP_DB}")
        sys.exit(1)

    if not CURRENT_DB.exists():
        print(f"❌ Current database not found: {CURRENT_DB}")
        sys.exit(1)

    # Connect to both databases
    backup_conn = sqlite3.connect(BACKUP_DB)
    current_conn = sqlite3.connect(CURRENT_DB)

    backup_conn.row_factory = sqlite3.Row
    current_conn.row_factory = sqlite3.Row

    backup_cur = backup_conn.cursor()
    current_cur = current_conn.cursor()

    print("🔄 Starting restaurant data restore...\n")

    try:
        # 1. Restore Categories
        print("📁 Restoring categories...")
        backup_cur.execute("SELECT * FROM restaurant_category ORDER BY id")
        categories = backup_cur.fetchall()

        for cat in categories:
            current_cur.execute("SELECT id FROM restaurant_category WHERE id = ?", (cat['id'],))
            if not current_cur.fetchone():
                current_cur.execute("""
                    INSERT INTO restaurant_category
                    (id, name, description, display_order, is_active, created_at, updated_at, restaurant_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (cat['id'], cat['name'], cat['description'], cat['display_order'],
                      cat['is_active'], cat['created_at'], cat['updated_at'], cat['restaurant_id']))
                print(f"   ✓ Added: {cat['name']}")

        current_conn.commit()
        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_category")
        print(f"   Total categories: {current_cur.fetchone()['count']}\n")

        # 2. Restore Products
        print("🍽️  Restoring products...")
        backup_cur.execute("SELECT * FROM restaurant_product ORDER BY id")
        products = backup_cur.fetchall()

        for prod in products:
            current_cur.execute("SELECT id FROM restaurant_product WHERE id = ?", (prod['id'],))
            if not current_cur.fetchone():
                current_cur.execute("""
                    INSERT INTO restaurant_product
                    (id, name, description, price, cost, image, is_available, preparation_time, sku,
                     created_at, updated_at, category_id, restaurant_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (prod['id'], prod['name'], prod['description'], prod['price'], prod['cost'],
                      prod['image'], prod['is_available'], prod['preparation_time'], prod['sku'],
                      prod['created_at'], prod['updated_at'], prod['category_id'], prod['restaurant_id']))
                print(f"   ✓ Added: {prod['name']} - Rp {prod['price']:,}")

        current_conn.commit()
        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_product")
        print(f"   Total products: {current_cur.fetchone()['count']}\n")

        # 3. Restore Tables
        print("🪑 Restoring tables...")
        backup_cur.execute("SELECT * FROM restaurant_table ORDER BY id")
        tables = backup_cur.fetchall()

        for table in tables:
            current_cur.execute("SELECT id FROM restaurant_table WHERE id = ?", (table['id'],))
            if not current_cur.fetchone():
                current_cur.execute("""
                    INSERT INTO restaurant_table
                    (id, number, capacity, is_available, created_at, updated_at, branch_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (table['id'], table['number'], table['capacity'], table['is_available'],
                      table['created_at'], table['updated_at'], table['branch_id']))
                print(f"   ✓ Added: Table {table['number']} (capacity: {table['capacity']})")

        current_conn.commit()
        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_table")
        print(f"   Total tables: {current_cur.fetchone()['count']}\n")

        # 4. Restore Vendors
        print("🏢 Restoring vendors...")
        backup_cur.execute("SELECT * FROM restaurant_vendor ORDER BY id")
        vendors = backup_cur.fetchall()

        for vendor in vendors:
            current_cur.execute("SELECT id FROM restaurant_vendor WHERE id = ?", (vendor['id'],))
            if not current_cur.fetchone():
                current_cur.execute("""
                    INSERT INTO restaurant_vendor
                    (id, name, contact_person, phone, email, address, payment_terms_days, tax_id,
                     is_active, notes, created_at, updated_at, branch_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (vendor['id'], vendor['name'], vendor['contact_person'], vendor['phone'],
                      vendor['email'], vendor['address'], vendor['payment_terms_days'], vendor['tax_id'],
                      vendor['is_active'], vendor['notes'], vendor['created_at'], vendor['updated_at'], vendor['branch_id']))
                print(f"   ✓ Added: {vendor['name']}")

        current_conn.commit()
        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_vendor")
        print(f"   Total vendors: {current_cur.fetchone()['count']}\n")

        # 5. Restore Promotions
        print("🎉 Restoring promotions...")
        backup_cur.execute("SELECT * FROM restaurant_promotion ORDER BY id")
        promotions = backup_cur.fetchall()

        for promo in promotions:
            # Check if promotion already exists by ID or promo_code
            current_cur.execute("SELECT id FROM restaurant_promotion WHERE id = ? OR promo_code = ?",
                              (promo['id'], promo['promo_code']))
            if not current_cur.fetchone():
                current_cur.execute("""
                    INSERT INTO restaurant_promotion
                    (id, name, description, promo_code, discount_type, discount_value, min_order_amount,
                     promo_type, start_date, end_date, is_active, usage_limit, used_count,
                     created_at, updated_at, restaurant_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (promo['id'], promo['name'], promo['description'], promo['promo_code'],
                      promo['discount_type'], promo['discount_value'], promo['min_order_amount'],
                      promo['promo_type'], promo['start_date'], promo['end_date'], promo['is_active'],
                      promo['usage_limit'], promo['used_count'], promo['created_at'], promo['updated_at'],
                      promo['restaurant_id']))
                print(f"   ✓ Added: {promo['name']}")

                # Restore promotion relationships
                backup_cur.execute("SELECT * FROM restaurant_promotion_categories WHERE promotion_id = ?", (promo['id'],))
                for rel in backup_cur.fetchall():
                    current_cur.execute("""
                        INSERT OR IGNORE INTO restaurant_promotion_categories
                        (id, promotion_id, category_id) VALUES (?, ?, ?)
                    """, (rel['id'], rel['promotion_id'], rel['category_id']))

                backup_cur.execute("SELECT * FROM restaurant_promotion_products WHERE promotion_id = ?", (promo['id'],))
                for rel in backup_cur.fetchall():
                    current_cur.execute("""
                        INSERT OR IGNORE INTO restaurant_promotion_products
                        (id, promotion_id, product_id) VALUES (?, ?, ?)
                    """, (rel['id'], rel['promotion_id'], rel['product_id']))

        current_conn.commit()
        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_promotion")
        print(f"   Total promotions: {current_cur.fetchone()['count']}\n")

        # Summary
        print("✅ Restaurant data restore completed!\n")
        print("📊 Summary:")

        tables_to_check = [
            ('Categories', 'restaurant_category'),
            ('Products', 'restaurant_product'),
            ('Tables', 'restaurant_table'),
            ('Vendors', 'restaurant_vendor'),
            ('Promotions', 'restaurant_promotion'),
        ]

        for name, table in tables_to_check:
            current_cur.execute(f"SELECT COUNT(*) as count FROM {table}")
            count = current_cur.fetchone()['count']
            print(f"   {name}: {count}")

    except Exception as e:
        print(f"\n❌ Error during restore: {e}")
        current_conn.rollback()
        raise
    finally:
        backup_conn.close()
        current_conn.close()

if __name__ == "__main__":
    restore_data()
