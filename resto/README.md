# Restaurant POS System

Point of Sale system for Indonesian restaurants with session-based authentication, cashier shift management, and real-time order tracking.

## Structure

```
resto/
├── backend/      # Django REST API (Port 8000)
└── frontend/     # Next.js App (Port 3000)
```

## Quick Start

### Backend (Port 8000)
```bash
cd resto/backend
uv sync
uv run python manage.py runserver 8000
```

### Frontend (Port 3000)
```bash
cd resto/frontend
npm install
npm run dev
```

## Test Credentials

- **Admin:** admin@ladapala.com / admin123
- **Manager:** manager@ladapala.com / manager123
- **Cashier:** kasir@ladapala.com / kasir123

## Seed Data

```bash
cd resto/backend
uv run python manage.py seed_auth_users     # Create users
uv run python manage.py seed_resto_data     # Populate menu, products, etc.
```

## Tech Stack

- **Backend:** Django 5.0, Django REST Framework, SQLite
- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS, lucide-react
