# Hotel Backend

Separate Django REST API backend for Ladapala Hotel Management System.

## Tech Stack

- **Django 5.2.7** - Web framework
- **Django REST Framework** - API framework
- **SQLite** - Database (development)
- **uv** - Package manager

## Project Structure

```
hotel-backend/
├── apps/
│   ├── user/          # User authentication & management
│   └── hotel/         # Hotel-specific features (to be developed)
├── core/              # Django settings & configuration
├── media/             # User uploaded files
└── manage.py
```

## Quick Start

### Initial Setup

1. **Install dependencies:**
   ```bash
   cd hotel-backend
   uv sync
   ```

2. **Run migrations:**
   ```bash
   uv run python manage.py migrate
   ```

3. **Create test users:**
   ```bash
   uv run python manage.py seed_hotel_users
   ```

### Running the Server

```bash
uv run python manage.py runserver 8001
```

Server will run at `http://localhost:8001`

## Test Credentials

- **Admin:** admin@hotel.ladapala.com / admin123
- **Manager:** manager@hotel.ladapala.com / manager123
- **Receptionist:** receptionist@hotel.ladapala.com / reception123

## API Endpoints

### Authentication

- `POST /api/user/login/` - Login with email & password
- `POST /api/user/logout/` - Logout
- `GET /api/user/check-session/` - Check session validity
- `GET /api/user/profile/` - Get current user profile
- `PUT/PATCH /api/user/profile/` - Update user profile
- `GET /api/user/shifts/` - Get user's shift schedule

## Features

### User System

- **Custom User Model** - Email-based authentication
- **UserProfile** - Extended user information with roles
- **Employee Management** - Employee records with department tracking
- **Department Management** - Department organization
- **Shift & Attendance** - Employee scheduling and time tracking

### User Roles

- ADMIN - Full system access
- MANAGER - Management operations
- SUPERVISOR - Supervisory tasks
- RECEPTIONIST - Front desk operations
- HOUSEKEEPING - Room maintenance
- MAINTENANCE - Facility maintenance
- STAFF - General staff

## Configuration

### CORS Settings

Configured for local development on port 3000:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

### Session Configuration

- **Cookie Age:** 24 hours
- **Session Backend:** Database-backed sessions
- **CSRF Protection:** Enabled with trusted origins

## Development

### Create New App

```bash
mkdir -p apps/newapp
uv run python manage.py startapp newapp apps/newapp
```

Remember to:
1. Update `apps/newapp/apps.py` to use `name = 'apps.newapp'`
2. Add `'apps.newapp'` to `INSTALLED_APPS` in settings.py

### Create Migrations

```bash
uv run python manage.py makemigrations
uv run python manage.py migrate
```

### Create Superuser

```bash
uv run python manage.py createsuperuser
```

### Access Admin

Navigate to `http://localhost:8001/admin/`

## Notes

- Port 8001 used to avoid conflict with main backend (port 8000)
- Timezone set to Asia/Jakarta
- SQLite database for development (consider PostgreSQL for production)
- All user-facing text in English (UI language will be Indonesian in frontend)
