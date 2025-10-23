# Hotel Management System

Hotel property management system with booking management, room tracking, guest services, and staff coordination.

## Structure

```
hotel/
├── backend/      # Django REST API (Port 8001)
└── frontend/     # Next.js App (Port 3000)
```

## Quick Start

### Backend (Port 8001)
```bash
cd hotel/backend
uv sync
uv run python manage.py runserver 8001
```

### Frontend (Port 3000)
```bash
cd hotel/frontend
npm install
npm run dev
```

## Test Credentials

- **Admin:** admin@hotel.ladapala.com / admin123
- **Manager:** manager@hotel.ladapala.com / manager123
- **Receptionist:** receptionist@hotel.ladapala.com / reception123

## Seed Data

```bash
cd hotel/backend
uv run python manage.py seed_hotel_users    # Create users
uv run python manage.py seed_hotel_data     # Populate rooms, inventory, etc.
```

## Tech Stack

- **Backend:** Django 5.2, Django REST Framework, SQLite
- **Frontend:** Next.js 16, React, TypeScript, Tailwind CSS, @hugeicons/react
