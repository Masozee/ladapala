#!/usr/bin/env python3
"""
Restore stock data from dbbak.sqlite3 via purchase orders
This ensures proper audit trail through purchase orders
"""

import sqlite3
import sys
from pathlib import Path
from datetime import datetime

# Database paths
BACKUP_DB = Path(__file__).parent / "dbbak.sqlite3"
CURRENT_DB = Path(__file__).parent / "db.sqlite3"

def restore_stock_data():
    """Restore inventory and purchase order data from backup"""

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

    print("🔄 Starting stock data restore from purchase orders...\n")

    try:
        # 1. Restore Inventory Items (master data)
        print("📦 Restoring inventory items...")
        backup_cur.execute("SELECT * FROM restaurant_inventory ORDER BY id")
        inventory_items = backup_cur.fetchall()

        for item in inventory_items:
            current_cur.execute("SELECT id FROM restaurant_inventory WHERE id = ?", (item['id'],))
            if not current_cur.fetchone():
                current_cur.execute("""
                    INSERT INTO restaurant_inventory
                    (id, name, description, unit, quantity, min_quantity, created_at, updated_at,
                     branch_id, location, cost_per_unit, earliest_expiry_date, has_expiring_items)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (item['id'], item['name'], item['description'], item['unit'], item['quantity'],
                      item['min_quantity'], item['created_at'], item['updated_at'], item['branch_id'],
                      item['location'], item['cost_per_unit'], item['earliest_expiry_date'],
                      item['has_expiring_items']))
                print(f"   ✓ Added: {item['name']} ({item['quantity']} {item['unit']})")

        current_conn.commit()
        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_inventory")
        print(f"   Total inventory items: {current_cur.fetchone()['count']}\n")

        # 2. Restore Purchase Orders
        print("📋 Restoring purchase orders...")
        backup_cur.execute("""
            SELECT * FROM restaurant_purchaseorder
            WHERE status IN ('RECEIVED', 'COMPLETED')
            ORDER BY id
        """)
        purchase_orders = backup_cur.fetchall()

        po_added = 0
        for po in purchase_orders:
            current_cur.execute("SELECT id FROM restaurant_purchaseorder WHERE id = ? OR po_number = ?",
                              (po['id'], po['po_number']))
            if not current_cur.fetchone():
                current_cur.execute("""
                    INSERT INTO restaurant_purchaseorder
                    (id, po_number, supplier_name, supplier_contact, supplier_email, supplier_phone,
                     status, order_date, expected_delivery_date, actual_delivery_date, notes,
                     terms_and_conditions, created_at, updated_at, approved_by_id, branch_id,
                     created_by_id, received_by_id, payment_terms_days, supplier_address, tax_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (po['id'], po['po_number'], po['supplier_name'], po['supplier_contact'],
                      po['supplier_email'], po['supplier_phone'], po['status'], po['order_date'],
                      po['expected_delivery_date'], po['actual_delivery_date'], po['notes'],
                      po['terms_and_conditions'], po['created_at'], po['updated_at'], po['approved_by_id'],
                      po['branch_id'], po['created_by_id'], po['received_by_id'], po['payment_terms_days'],
                      po['supplier_address'], po['tax_id']))
                po_added += 1
                print(f"   ✓ Added PO: {po['po_number']} - {po['supplier_name']} ({po['status']})")

        current_conn.commit()
        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_purchaseorder")
        print(f"   Total purchase orders: {current_cur.fetchone()['count']}\n")

        # 3. Restore Purchase Order Items
        print("📝 Restoring purchase order items...")
        backup_cur.execute("""
            SELECT poi.*
            FROM restaurant_purchaseorderitem poi
            JOIN restaurant_purchaseorder po ON poi.purchase_order_id = po.id
            WHERE po.status IN ('RECEIVED', 'COMPLETED')
            ORDER BY poi.id
        """)
        po_items = backup_cur.fetchall()

        poi_added = 0
        for poi in po_items:
            # Check if PO exists in current DB
            current_cur.execute("SELECT id FROM restaurant_purchaseorder WHERE id = ?",
                              (poi['purchase_order_id'],))
            if current_cur.fetchone():
                # Check if inventory item exists
                current_cur.execute("SELECT id, name FROM restaurant_inventory WHERE id = ?",
                                  (poi['inventory_item_id'],))
                inventory = current_cur.fetchone()

                if inventory:
                    # Check if item already exists
                    current_cur.execute("""
                        SELECT id FROM restaurant_purchaseorderitem
                        WHERE id = ?
                    """, (poi['id'],))

                    if not current_cur.fetchone():
                        current_cur.execute("""
                            INSERT INTO restaurant_purchaseorderitem
                            (id, quantity, unit_price, notes, created_at, updated_at,
                             inventory_item_id, purchase_order_id)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                        """, (poi['id'], poi['quantity'], poi['unit_price'], poi['notes'],
                              poi['created_at'], poi['updated_at'], poi['inventory_item_id'],
                              poi['purchase_order_id']))
                        poi_added += 1
                        total = float(poi['quantity']) * float(poi['unit_price'])
                        print(f"   ✓ Added item: {inventory['name']} x{poi['quantity']} @ Rp {poi['unit_price']:,} = Rp {total:,.0f}")

        current_conn.commit()
        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_purchaseorderitem")
        print(f"   Total PO items: {current_cur.fetchone()['count']}\n")

        # 4. Restore Inventory Batches (if any)
        print("🏷️  Restoring inventory batches...")
        backup_cur.execute("SELECT * FROM restaurant_inventorybatch ORDER BY id")
        batches = backup_cur.fetchall()

        batch_added = 0
        for batch in batches:
            # Check if inventory item exists
            current_cur.execute("SELECT id FROM restaurant_inventory WHERE id = ?",
                              (batch['inventory_item_id'],))
            if current_cur.fetchone():
                current_cur.execute("SELECT id FROM restaurant_inventorybatch WHERE id = ?",
                                  (batch['id'],))
                if not current_cur.fetchone():
                    # Get all columns from batch
                    columns = [desc[0] for desc in backup_cur.description]
                    values = [batch[col] for col in columns]
                    placeholders = ', '.join(['?'] * len(columns))
                    column_names = ', '.join(columns)

                    current_cur.execute(f"""
                        INSERT INTO restaurant_inventorybatch
                        ({column_names})
                        VALUES ({placeholders})
                    """, values)
                    batch_added += 1
                    print(f"   ✓ Added batch for inventory ID {batch['inventory_item_id']}")

        current_conn.commit()
        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_inventorybatch")
        batch_count = current_cur.fetchone()['count']
        print(f"   Total inventory batches: {batch_count}\n")

        # 5. Summary with financial breakdown
        print("✅ Stock data restore completed!\n")
        print("📊 Summary:")

        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_inventory")
        inv_count = current_cur.fetchone()['count']
        print(f"   Inventory Items: {inv_count}")

        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_purchaseorder")
        po_count = current_cur.fetchone()['count']
        print(f"   Purchase Orders: {po_count}")

        current_cur.execute("SELECT COUNT(*) as count FROM restaurant_purchaseorderitem")
        poi_count = current_cur.fetchone()['count']
        print(f"   PO Line Items: {poi_count}")

        print(f"   Inventory Batches: {batch_count}")

        # Calculate total stock value
        current_cur.execute("""
            SELECT
                SUM(quantity * cost_per_unit) as total_value,
                SUM(CASE WHEN quantity < min_quantity THEN 1 ELSE 0 END) as low_stock_items
            FROM restaurant_inventory
        """)
        stock_summary = current_cur.fetchone()

        if stock_summary['total_value']:
            print(f"\n💰 Stock Value: Rp {stock_summary['total_value']:,.0f}")
            print(f"⚠️  Low Stock Items: {stock_summary['low_stock_items']}")

        # Show top 5 items by value
        print("\n📈 Top 5 Items by Value:")
        current_cur.execute("""
            SELECT name, quantity, unit, cost_per_unit,
                   (quantity * cost_per_unit) as total_value
            FROM restaurant_inventory
            WHERE quantity > 0
            ORDER BY total_value DESC
            LIMIT 5
        """)
        for idx, item in enumerate(current_cur.fetchall(), 1):
            print(f"   {idx}. {item['name']}: {item['quantity']} {item['unit']} "
                  f"(Rp {item['total_value']:,.0f})")

    except Exception as e:
        print(f"\n❌ Error during restore: {e}")
        import traceback
        traceback.print_exc()
        current_conn.rollback()
        raise
    finally:
        backup_conn.close()
        current_conn.close()

if __name__ == "__main__":
    restore_stock_data()
