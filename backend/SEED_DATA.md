# Seed Data Documentation

## Overview

The `seed_resto_data` management command populates the database with realistic Ladapala restaurant data that matches the frontend application exactly.

## Usage

```bash
cd backend
python manage.py seed_resto_data
```

This command will:
1. **Clear all existing data** (except superusers)
2. Populate the database with fresh seed data

## Generated Data

### Restaurant & Branch
- **Restaurant**: Ladapala
- **Branch**: Cabang Utama (Main Branch)
- **Operating Hours**: 06:00 - 23:00
- **Location**: Jl. Gatot Subroto No. 88, Jakarta Selatan

### Staff Members (9 total)

| Role | Name | Email | Phone |
|------|------|-------|-------|
| Admin | Budi Santoso | budi.admin@ladapala.co.id | 081234567890 |
| Manager | Siti Rahayu | siti.manager@ladapala.co.id | 081234567891 |
| Cashier | Sari Wulandari | sari.kasir@ladapala.co.id | 081234567892 |
| Cashier | Andi Prasetyo | andi.kasir@ladapala.co.id | 081234567893 |
| Cashier | Dewi Lestari | dewi.kasir@ladapala.co.id | 081234567894 |
| Cashier | Rini Susanti | rini.kasir@ladapala.co.id | 081234567895 |
| Kitchen | Agus Hidayat | agus.dapur@ladapala.co.id | 081234567896 |
| Kitchen | Rina Anggraini | rina.dapur@ladapala.co.id | 081234567897 |
| Warehouse | Joko Widodo | joko.gudang@ladapala.co.id | 081234567898 |

**Default Password**: `password123`

### Product Categories (6 total)

1. **Nasi & Makanan Utama** - Nasi dan hidangan utama
2. **Sarapan & Jajanan Pagi** - Menu sarapan pagi
3. **Sup & Berkuah** - Menu sup dan berkuah
4. **Pembuka & Camilan** - Hidangan pembuka dan camilan
5. **Pencuci Mulut** - Dessert dan hidangan manis
6. **Minuman** - Minuman dingin dan panas

### Menu Items (15 products)

#### Nasi & Makanan Utama
- Nasi Gudeg Jogja - Rp 35.000
- Nasi Padang Komplit - Rp 45.000
- Nasi Liwet Solo - Rp 32.000

#### Sarapan & Jajanan Pagi
- Bubur Ayam - Rp 18.000
- Lontong Sayur - Rp 15.000
- Soto Betawi - Rp 28.000

#### Sup & Berkuah
- Sop Buntut Bakar - Rp 55.000
- Rawon Surabaya - Rp 38.000

#### Pembuka & Camilan
- Gado-gado - Rp 22.000
- Ketoprak - Rp 18.000

#### Pencuci Mulut
- Es Cendol Durian - Rp 20.000
- Klepon Pandan - Rp 15.000

#### Minuman
- Es Teh Manis - Rp 8.000
- Jus Alpukat - Rp 18.000
- Wedang Jahe Merah - Rp 12.000

### Tables (15 total)

- Tables 1-10: Capacity 4 persons
- Tables 11-13: Capacity 6 persons
- Tables 14-15: Capacity 8 persons

**Occupied Tables**: 2, 3, 4, 5, 7, 8, 10, 12, 15 (with active unpaid orders)
**Available Tables**: 1, 6, 9, 11, 13, 14

### Orders (12 total)

#### Unpaid Table Orders (7 orders - dining in progress)
- Table 5: Nasi Gudeg Jogja (2), Es Teh Manis (3)
- Table 12: Soto Betawi (2), Es Cendol Durian (2)
- Table 3: Nasi Padang Komplit (2), Nasi Liwet Solo (2), Jus Alpukat (4)
- Table 8: Gado-gado (2), Lontong Sayur (1), Wedang Jahe Merah (2)
- Table 15: Bubur Ayam (1), Es Teh Manis (2)
- Table 7: Sop Buntut Bakar (1), Nasi Liwet Solo (3), Es Teh Manis (3)
- Table 10: Rawon Surabaya (2), Ketoprak (1), Es Teh Manis (3)

#### Recent Orders (5 orders - various statuses)
- Table 2: PREPARING - Nasi Gudeg Jogja (2), Es Teh Manis (2)
- Table 6: READY - Nasi Padang Komplit (2), Nasi Liwet Solo (1), Jus Alpukat (3)
- Take Away: COMPLETED - Bubur Ayam (2), Es Teh Manis (2)
- Table 4: PENDING - Soto Betawi (2), Es Cendol Durian (3)
- Table 9: PREPARING - Sop Buntut Bakar (1), Nasi Liwet Solo (3)

### Inventory Items (10 items)

- Beras Premium: 150 kg
- Daging Sapi: 50 kg
- Ayam Kampung: 40 ekor
- Minyak Goreng: 60 liter
- Cabai Merah: 25 kg
- Bawang Merah: 30 kg
- Santan Kelapa: 40 liter
- Gula Merah: 20 kg
- Durian: 15 kg
- Alpukat: 20 kg

### Promotions (1 active)

**Promo Spesial Ramadhan**
- Code: RAMADHAN2024
- Discount: 15% for orders ≥ Rp 50.000
- Valid: 30 days from seed date
- Usage Limit: 500 times

## Data Consistency

The seed data is designed to:
- Match the frontend menu items exactly
- Provide realistic order scenarios
- Include both completed and in-progress orders
- Set up occupied and available tables
- Create kitchen orders for preparing/ready status
- Include inventory with stock levels
- Provide active promotion for testing

## API Testing

With this seed data, you can test:

### Products API
```bash
GET /api/products/
GET /api/products/?category=1
GET /api/products/?search=gudeg
```

### Orders API
```bash
GET /api/orders/
GET /api/orders/?status=PREPARING
GET /api/orders/?table=5
POST /api/orders/
```

### Tables API
```bash
GET /api/tables/
GET /api/tables/?is_available=true
```

### Categories API
```bash
GET /api/categories/
```

## Notes

- All monetary values are in Indonesian Rupiah (IDR)
- Preparation times are set in minutes
- Staff roles follow: ADMIN, MANAGER, CASHIER, KITCHEN, WAREHOUSE
- Order statuses: PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED
- Kitchen orders are automatically created for PREPARING and READY orders

## Resetting Data

To reset and reseed the database:

```bash
python manage.py seed_resto_data
```

⚠️ **Warning**: This will delete all existing data (except superusers) and replace it with fresh seed data.
