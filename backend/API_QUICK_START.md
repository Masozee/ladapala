# Ladapala API Quick Start Guide

## Setup & Running

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Run Migrations
```bash
python manage.py migrate
```

### 3. Load Seed Data
```bash
python manage.py seed_resto_data
```

### 4. Start Development Server
```bash
python manage.py runserver
```

The API will be available at: `http://localhost:8000/api/`

---

## Quick Test

### Get All Products
```bash
curl http://localhost:8000/api/products/
```

### Get All Categories
```bash
curl http://localhost:8000/api/categories/
```

### Get All Tables
```bash
curl http://localhost:8000/api/tables/
```

### Get All Orders
```bash
curl http://localhost:8000/api/orders/
```

---

## Frontend Integration

### Fetching Products for Menu Page
```javascript
const response = await fetch('http://localhost:8000/api/products/');
const data = await response.json();
const products = data.results;
```

### Fetching Categories
```javascript
const response = await fetch('http://localhost:8000/api/categories/');
const data = await response.json();
const categories = data.results;
```

### Creating an Order
```javascript
const response = await fetch('http://localhost:8000/api/orders/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    branch: 1,
    table: 5,
    order_type: 'DINE_IN',
    customer_name: 'John Doe',
    customer_phone: '081234567890',
    items: [
      {
        product: 1,
        quantity: 2,
        unit_price: '35000.00'
      }
    ]
  })
});
const order = await response.json();
```

### Fetching Orders with Filters
```javascript
// Get only PREPARING orders
const response = await fetch('http://localhost:8000/api/orders/?status=PREPARING');
const data = await response.json();

// Get orders for specific table
const response = await fetch('http://localhost:8000/api/orders/?table=5');
const data = await response.json();

// Get today's orders
const response = await fetch('http://localhost:8000/api/orders/today/');
const data = await response.json();
```

---

## Available Endpoints

### Public Endpoints (No Auth Required)

**Read Operations:**
- `GET /api/categories/` - List all categories
- `GET /api/categories/{id}/` - Get category details
- `GET /api/products/` - List all products
- `GET /api/products/{id}/` - Get product details
- `GET /api/products/available/` - Get available products
- `GET /api/tables/` - List all tables
- `GET /api/tables/{id}/` - Get table details
- `GET /api/orders/` - List all orders
- `GET /api/orders/{id}/` - Get order details
- `GET /api/orders/today/` - Get today's orders

**Write Operations:**
- `POST /api/orders/` - Create new order

### Protected Endpoints (Auth Required)

All other operations require authentication, including:
- Creating/updating products, categories, tables
- Payment processing
- Kitchen order management
- Staff management
- Inventory management
- Report generation

---

## Authentication

For protected endpoints, include token in headers:

```javascript
const response = await fetch('http://localhost:8000/api/staff/', {
  headers: {
    'Authorization': 'Token your-token-here'
  }
});
```

### Login Credentials (Seed Data)

**Admin:**
- Email: `budi.admin@ladapala.co.id`
- Password: `password123`

**Manager:**
- Email: `siti.manager@ladapala.co.id`
- Password: `password123`

**Cashier:**
- Email: `sari.kasir@ladapala.co.id`
- Password: `password123`

---

## Common Query Parameters

### Filtering
```
/api/products/?category=1
/api/products/?is_available=true
/api/orders/?status=PREPARING
/api/tables/?is_available=false
```

### Search
```
/api/products/?search=nasi
/api/categories/?search=minuman
```

### Ordering
```
/api/products/?ordering=price
/api/products/?ordering=-created_at
```

### Pagination
```
/api/products/?page=2
/api/products/?page_size=20
```

---

## Response Format

All list endpoints return paginated data:

```json
{
  "count": 15,
  "next": "http://localhost:8000/api/products/?page=2",
  "previous": null,
  "results": [...]
}
```

---

## Error Handling

```javascript
try {
  const response = await fetch('http://localhost:8000/api/orders/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(orderData)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error);
    return;
  }

  const order = await response.json();
  console.log('Order created:', order);
} catch (error) {
  console.error('Network error:', error);
}
```

---

## Next Steps

1. Review full [API Documentation](./API_DOCUMENTATION.md)
2. Check [Seed Data Documentation](./SEED_DATA.md)
3. Test endpoints using the examples above
4. Integrate with your frontend application

---

## Need Help?

- Full API Docs: `backend/API_DOCUMENTATION.md`
- Seed Data Info: `backend/SEED_DATA.md`
- Backend Guide: `backend/CLAUDE.md`
