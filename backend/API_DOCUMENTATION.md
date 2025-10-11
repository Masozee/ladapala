# Ladapala Restaurant API Documentation

## Overview

The Ladapala Restaurant API provides comprehensive endpoints for managing restaurant operations including products, orders, tables, inventory, staff, and reporting.

**Base URL**: `http://localhost:8000/api/`

**Authentication**: Most read operations are public. Write operations require authentication.

## Table of Contents

- [Authentication](#authentication)
- [Restaurants](#restaurants)
- [Branches](#branches)
- [Staff](#staff)
- [Categories](#categories)
- [Products](#products)
- [Tables](#tables)
- [Orders](#orders)
- [Payments](#payments)
- [Kitchen Orders](#kitchen-orders)
- [Inventory](#inventory)
- [Promotions](#promotions)
- [Schedules](#schedules)
- [Reports](#reports)
- [Dashboard](#dashboard)

---

## Authentication

The API uses token-based authentication for protected endpoints.

### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "budi.admin@ladapala.co.id",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "email": "budi.admin@ladapala.co.id",
    "first_name": "Budi",
    "last_name": "Santoso",
    "full_name": "Budi Santoso"
  }
}
```

For protected endpoints, include the token in the Authorization header:
```http
Authorization: Token eyJ0eXAiOiJKV1QiLCJhbGc...
```

---

## Restaurants

### List Restaurants
```http
GET /api/restaurants/
```

**Query Parameters:**
- `is_active` (boolean): Filter by active status
- `search` (string): Search by name or address

**Response:**
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "name": "Ladapala",
      "address": "Jl. Gatot Subroto No. 88, Jakarta Selatan",
      "phone": "021-5559999",
      "email": "info@ladapala.co.id",
      "logo": null,
      "is_active": true,
      "created_at": "2025-10-11T16:13:49.123456Z",
      "updated_at": "2025-10-11T16:13:49.123456Z"
    }
  ]
}
```

### Get Restaurant Details
```http
GET /api/restaurants/{id}/
```

---

## Branches

### List Branches
```http
GET /api/branches/
```

**Query Parameters:**
- `restaurant` (integer): Filter by restaurant ID
- `is_active` (boolean): Filter by active status
- `search` (string): Search by name or address

**Response:**
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "restaurant_name": "Ladapala",
      "name": "Cabang Utama",
      "address": "Jl. Gatot Subroto No. 88, Jakarta Selatan",
      "phone": "021-5559999",
      "email": "jakarta@ladapala.co.id",
      "is_active": true,
      "opening_time": "06:00:00",
      "closing_time": "23:00:00",
      "created_at": "2025-10-11T16:13:49.123456Z",
      "updated_at": "2025-10-11T16:13:49.123456Z",
      "restaurant": 1
    }
  ]
}
```

---

## Staff

### List Staff
```http
GET /api/staff/
```

**Query Parameters:**
- `branch` (integer): Filter by branch ID
- `role` (string): Filter by role (ADMIN, MANAGER, CASHIER, KITCHEN, WAREHOUSE)
- `is_active` (boolean): Filter by active status
- `search` (string): Search by name or employee ID

**Response:**
```json
{
  "count": 9,
  "results": [
    {
      "id": 1,
      "user": {
        "id": 1,
        "email": "budi.admin@ladapala.co.id",
        "first_name": "Budi",
        "last_name": "Santoso",
        "full_name": "Budi Santoso",
        "is_active": true
      },
      "branch_name": "Cabang Utama",
      "role": "ADMIN",
      "phone": "081234567890",
      "employee_id": "EMPABCD1234",
      "is_active": true,
      "hire_date": "2025-10-11",
      "created_at": "2025-10-11T16:13:49.123456Z",
      "updated_at": "2025-10-11T16:13:49.123456Z",
      "branch": 1
    }
  ]
}
```

---

## Categories

### List Categories
```http
GET /api/categories/
```

**Public Endpoint** - No authentication required for read operations.

**Query Parameters:**
- `restaurant` (integer): Filter by restaurant ID
- `is_active` (boolean): Filter by active status
- `search` (string): Search by name
- `ordering` (string): Order by field (e.g., `display_order`, `-name`)

**Response:**
```json
{
  "count": 6,
  "results": [
    {
      "id": 1,
      "product_count": 3,
      "name": "Nasi & Makanan Utama",
      "description": "Nasi dan hidangan utama",
      "display_order": 1,
      "is_active": true,
      "created_at": "2025-10-11T16:13:49.123456Z",
      "updated_at": "2025-10-11T16:13:49.123456Z",
      "restaurant": 1
    }
  ]
}
```

---

## Products

### List Products
```http
GET /api/products/
```

**Public Endpoint** - No authentication required for read operations.

**Query Parameters:**
- `restaurant` (integer): Filter by restaurant ID
- `category` (integer): Filter by category ID
- `is_available` (boolean): Filter by availability
- `search` (string): Search by name, description, or SKU
- `ordering` (string): Order by field (e.g., `price`, `-created_at`)

**Response:**
```json
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "category_name": "Nasi & Makanan Utama",
      "profit_margin": "42.86",
      "name": "Nasi Gudeg Jogja",
      "description": "Nasi dengan gudeg khas Jogja, ayam kampung, telur, dan sambal krecek",
      "price": "35000.00",
      "cost": "20000.00",
      "image": null,
      "is_available": true,
      "preparation_time": 15,
      "sku": "PRD740CCEDA",
      "created_at": "2025-10-11T16:13:49.123456Z",
      "updated_at": "2025-10-11T16:13:49.123456Z",
      "restaurant": 1,
      "category": 1
    }
  ]
}
```

### Get Available Products
```http
GET /api/products/available/
```

Returns only products where `is_available=true`.

### Get Product Details
```http
GET /api/products/{id}/
```

---

## Tables

### List Tables
```http
GET /api/tables/
```

**Public Endpoint** - No authentication required for read operations.

**Query Parameters:**
- `branch` (integer): Filter by branch ID
- `is_available` (boolean): Filter by availability

**Response:**
```json
{
  "count": 15,
  "results": [
    {
      "id": 1,
      "branch_name": "Cabang Utama",
      "number": "1",
      "capacity": 4,
      "is_available": true,
      "created_at": "2025-10-11T16:13:49.123456Z",
      "updated_at": "2025-10-11T16:13:49.123456Z",
      "branch": 1
    }
  ]
}
```

### Set Table Available
```http
POST /api/tables/{id}/set_available/
```

**Authentication Required**

**Response:**
```json
{
  "status": "table set as available"
}
```

### Set Table Occupied
```http
POST /api/tables/{id}/set_occupied/
```

**Authentication Required**

---

## Orders

### List Orders
```http
GET /api/orders/
```

**Public Endpoint** - Can read without authentication, create without auth.

**Query Parameters:**
- `branch` (integer): Filter by branch ID
- `order_type` (string): Filter by type (DINE_IN, TAKEAWAY, DELIVERY)
- `status` (string): Filter by status (PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED)
- `table` (integer): Filter by table ID

**Response:**
```json
{
  "count": 12,
  "results": [
    {
      "id": 1,
      "items": [
        {
          "id": 1,
          "product_name": "Nasi Gudeg Jogja",
          "subtotal": "70000.00",
          "quantity": 2,
          "unit_price": "35000.00",
          "discount_amount": "0.00",
          "notes": "",
          "created_at": "2025-10-11T16:13:49.123456Z",
          "order": 1,
          "product": 1
        }
      ],
      "total_amount": "86000.00",
      "table_number": "2",
      "order_number": "ORD20251011ABCDEF",
      "order_type": "DINE_IN",
      "status": "PREPARING",
      "customer_name": "Andi Wijaya",
      "customer_phone": "081234567890",
      "delivery_address": "",
      "notes": "",
      "created_at": "2025-10-11T16:13:49.123456Z",
      "updated_at": "2025-10-11T16:13:49.123456Z",
      "branch": 1,
      "table": 2,
      "created_by": 1
    }
  ]
}
```

### Create Order
```http
POST /api/orders/
Content-Type: application/json

{
  "branch": 1,
  "table": 5,
  "order_type": "DINE_IN",
  "customer_name": "John Doe",
  "customer_phone": "081234567890",
  "notes": "No chili please",
  "items": [
    {
      "product": 1,
      "quantity": 2,
      "unit_price": "35000.00",
      "notes": "Extra spicy"
    },
    {
      "product": 3,
      "quantity": 1,
      "unit_price": "8000.00"
    }
  ]
}
```

### Get Today's Orders
```http
GET /api/orders/today/
```

Returns orders created today.

### Update Order Status
```http
POST /api/orders/{id}/update_status/
Content-Type: application/json

{
  "status": "READY"
}
```

**Valid statuses:** PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED

### Add Item to Order
```http
POST /api/orders/{id}/add_item/
Content-Type: application/json

{
  "product": 5,
  "quantity": 1,
  "unit_price": "18000.00",
  "notes": ""
}
```

---

## Payments

### List Payments
```http
GET /api/payments/
```

**Query Parameters:**
- `order` (integer): Filter by order ID
- `payment_method` (string): Filter by method (CASH, CARD, MOBILE, OTHER)
- `status` (string): Filter by status (PENDING, COMPLETED, FAILED, REFUNDED)

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "order_number": "ORD20251011ABCDEF",
      "amount": "86000.00",
      "payment_method": "CASH",
      "status": "COMPLETED",
      "transaction_id": "PAY123ABC456DEF",
      "created_at": "2025-10-11T16:13:49.123456Z",
      "order": 1,
      "processed_by": 1
    }
  ]
}
```

### Create Payment
```http
POST /api/payments/
Content-Type: application/json

{
  "order": 1,
  "amount": "86000.00",
  "payment_method": "CASH",
  "status": "COMPLETED"
}
```

**Note:** When payment status is COMPLETED, the associated order status is automatically set to COMPLETED.

---

## Kitchen Orders

### List Kitchen Orders
```http
GET /api/kitchen-orders/
```

**Query Parameters:**
- `status` (string): Filter by status (PENDING, PREPARING, READY, SERVED)
- `assigned_to` (integer): Filter by assigned staff ID

**Response:**
```json
{
  "count": 2,
  "results": [
    {
      "id": 1,
      "items": [],
      "order_number": "ORD20251011ABCDEF",
      "order_type": "DINE_IN",
      "table_number": "2",
      "status": "PREPARING",
      "priority": 1,
      "started_at": "2025-10-11T16:13:49.123456Z",
      "completed_at": null,
      "created_at": "2025-10-11T16:13:49.123456Z",
      "updated_at": "2025-10-11T16:13:49.123456Z",
      "order": 1,
      "assigned_to": 7
    }
  ]
}
```

### Assign Kitchen Order
```http
POST /api/kitchen-orders/{id}/assign/
Content-Type: application/json

{
  "staff_id": 7
}
```

**Authentication Required** - Kitchen staff role

### Start Preparation
```http
POST /api/kitchen-orders/{id}/start_preparation/
```

Sets kitchen order and main order status to PREPARING.

### Mark as Ready
```http
POST /api/kitchen-orders/{id}/mark_ready/
```

Sets kitchen order and main order status to READY.

### Print Kitchen Ticket
```http
GET /api/kitchen-orders/{id}/print_ticket/
```

Generates formatted kitchen ticket for printing.

### Get Queue Summary
```http
GET /api/kitchen-orders/queue_summary/?branch_id=1
```

Returns summary of all pending and preparing orders for a branch.

---

## Inventory

### List Inventory Items
```http
GET /api/inventory/
```

**Query Parameters:**
- `branch` (integer): Filter by branch ID
- `search` (string): Search by name or supplier
- `ordering` (string): Order by field

**Response:**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "needs_restock": false,
      "total_value": "1800000.00",
      "name": "Beras Premium",
      "description": "",
      "unit": "kg",
      "quantity": "150.00",
      "min_quantity": "30.00",
      "cost_per_unit": "12000.00",
      "supplier": "CV Beras Nusantara",
      "created_at": "2025-10-11T16:13:49.123456Z",
      "updated_at": "2025-10-11T16:13:49.123456Z",
      "branch": 1
    }
  ]
}
```

### Get Low Stock Items
```http
GET /api/inventory/low_stock/
```

Returns items where `quantity <= min_quantity`.

### Create Inventory Transaction
```http
POST /api/inventory-transactions/
Content-Type: application/json

{
  "inventory": 1,
  "transaction_type": "IN",
  "quantity": "50.00",
  "unit_cost": "12000.00",
  "reference_number": "PO-2025-001",
  "notes": "Restocking from supplier"
}
```

**Transaction Types:**
- `IN`: Stock In
- `OUT`: Stock Out
- `ADJUST`: Adjustment
- `WASTE`: Waste

**Note:** Inventory quantity is automatically updated based on transaction type.

---

## Promotions

### List Promotions
```http
GET /api/promotions/
```

**Query Parameters:**
- `restaurant` (integer): Filter by restaurant ID
- `discount_type` (string): Filter by type (PERCENTAGE, FIXED)
- `promo_type` (string): Filter by type (PRODUCT, CATEGORY, ORDER)
- `is_active` (boolean): Filter by active status
- `search` (string): Search by name, code, or description

**Response:**
```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "is_valid": true,
      "name": "Promo Spesial Ramadhan",
      "description": "Diskon 15% untuk semua menu selama bulan Ramadhan",
      "promo_code": "RAMADHAN2024",
      "discount_type": "PERCENTAGE",
      "discount_value": "15.00",
      "min_order_amount": "50000.00",
      "promo_type": "ORDER",
      "start_date": "2025-10-06T16:13:49.123456Z",
      "end_date": "2025-11-05T16:13:49.123456Z",
      "is_active": true,
      "usage_limit": 500,
      "used_count": 0,
      "created_at": "2025-10-11T16:13:49.123456Z",
      "updated_at": "2025-10-11T16:13:49.123456Z",
      "restaurant": 1
    }
  ]
}
```

### Get Active Promotions
```http
GET /api/promotions/active/
```

Returns promotions that are currently active (within date range, not expired).

### Validate Promo Code
```http
POST /api/promotions/validate_code/
Content-Type: application/json

{
  "promo_code": "RAMADHAN2024"
}
```

**Response (Valid):**
```json
{
  "id": 1,
  "is_valid": true,
  "name": "Promo Spesial Ramadhan",
  "discount_type": "PERCENTAGE",
  "discount_value": "15.00",
  ...
}
```

**Response (Invalid):**
```json
{
  "error": "Invalid promo code"
}
```

---

## Schedules

### List Schedules
```http
GET /api/schedules/
```

**Query Parameters:**
- `staff` (integer): Filter by staff ID
- `date` (date): Filter by specific date (YYYY-MM-DD)
- `shift_type` (string): Filter by shift (MORNING, AFTERNOON, EVENING, NIGHT)
- `is_confirmed` (boolean): Filter by confirmation status

**Response:**
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "staff_name": "Budi Santoso",
      "staff_role": "ADMIN",
      "date": "2025-10-11",
      "shift_type": "MORNING",
      "start_time": "07:00:00",
      "end_time": "15:00:00",
      "is_confirmed": true,
      "notes": "",
      "created_at": "2025-10-11T16:13:49.123456Z",
      "updated_at": "2025-10-11T16:13:49.123456Z",
      "staff": 1
    }
  ]
}
```

### Get Today's Schedules
```http
GET /api/schedules/today/
```

### Get This Week's Schedules
```http
GET /api/schedules/week/
```

### Confirm Schedule
```http
POST /api/schedules/{id}/confirm/
```

**Authentication Required** - Manager or Admin role

---

## Reports

### List Reports
```http
GET /api/reports/
```

**Query Parameters:**
- `branch` (integer): Filter by branch ID
- `report_type` (string): Filter by type (DAILY, WEEKLY, MONTHLY, INVENTORY, SALES)

**Response:**
```json
{
  "count": 5,
  "results": [
    {
      "id": 1,
      "branch_name": "Cabang Utama",
      "report_type": "DAILY",
      "start_date": "2025-10-11",
      "end_date": "2025-10-11",
      "data": {
        "total_orders": 12,
        "total_revenue": 1250000.00,
        "orders_by_type": [...],
        "orders_by_status": [...],
        "top_products": [...]
      },
      "created_at": "2025-10-11T16:13:49.123456Z",
      "branch": 1,
      "generated_by": 1
    }
  ]
}
```

### Generate Daily Report
```http
POST /api/reports/generate_daily/
Content-Type: application/json

{
  "branch_id": 1,
  "date": "2025-10-11"
}
```

**Authentication Required** - Manager or Admin role

**Response:** Returns generated report with aggregated data including:
- Total orders and revenue
- Orders breakdown by type and status
- Top 10 best-selling products

---

## Dashboard

### Get Dashboard Summary
```http
GET /api/dashboard/summary/?branch_id=1
```

**Authentication Required**

**Response:**
```json
{
  "total_orders_today": 12,
  "total_revenue_today": "1250000.00",
  "pending_orders": 3,
  "low_stock_items": 2,
  "active_tables": 7,
  "staff_on_duty": 6
}
```

Provides real-time dashboard metrics for a specific branch.

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid data",
  "details": {
    "field_name": ["Error message"]
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

---

## Pagination

All list endpoints support pagination with these parameters:

**Query Parameters:**
- `page` (integer): Page number (default: 1)
- `page_size` (integer): Items per page (default: varies by endpoint)

**Response Structure:**
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/products/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, implement rate limiting based on your requirements.

---

## Testing with cURL

### Example: Get all products
```bash
curl http://localhost:8000/api/products/
```

### Example: Create an order
```bash
curl -X POST http://localhost:8000/api/orders/ \
  -H "Content-Type: application/json" \
  -d '{
    "branch": 1,
    "table": 5,
    "order_type": "DINE_IN",
    "customer_name": "Test Customer",
    "items": [
      {
        "product": 1,
        "quantity": 2,
        "unit_price": "35000.00"
      }
    ]
  }'
```

### Example: Authenticated request
```bash
curl http://localhost:8000/api/staff/ \
  -H "Authorization: Token your-token-here"
```

---

## Support

For issues or questions:
- GitHub: https://github.com/Masozee/ladapala
- Email: info@ladapala.co.id

---

**Last Updated:** October 11, 2025
**API Version:** 1.0
