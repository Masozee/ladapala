# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Django 5.0 backend application for the Ladapala project. The project uses Django's default project structure with a `core` settings module and an `apps` directory for Django applications.

## Package Management

### Installing Dependencies
```bash
# Install packages using uv
uv add <package_name>

# Install Django packages
uv add djangorestframework
uv add django-cors-headers
uv add django-filter

# Install development dependencies
uv add --dev <package_name>
```

## Development Commands

### Running the Development Server
```bash
python manage.py runserver
```

### Database Migrations
```bash
# Create new migrations after model changes
python manage.py makemigrations

# Apply migrations to database
python manage.py migrate
```

### Django Admin
```bash
# Create superuser for admin access
python manage.py createsuperuser
```

### Testing
```bash
# Run all tests
python manage.py test

# Run tests for a specific app
python manage.py test apps.<app_name>

# Run tests with verbose output
python manage.py test --verbosity=2
```

### Django Shell
```bash
# Interactive shell with Django context
python manage.py shell
```

### Kitchen Printer Service
```bash
# Test kitchen printer with sample ticket
python manage.py kitchen_printer --branch 1 --mode test

# Run live kitchen printer (polls for new orders)
python manage.py kitchen_printer --branch 1 --mode live --interval 10

# Show current kitchen order queue
python manage.py kitchen_printer --branch 1 --mode queue

# Auto-print mode (no confirmation needed)
python manage.py kitchen_printer --branch 1 --mode live --auto-print
```

## Architecture

### Core Structure
- **core/**: Django project configuration
  - `settings.py`: Main settings file (currently using SQLite, DEBUG=True)
  - `urls.py`: Root URL configuration
  - `wsgi.py` and `asgi.py`: Entry points for WSGI/ASGI servers
  
- **apps/**: Directory for Django applications (currently empty)
  - New Django apps should be created here using: `python manage.py startapp <app_name> apps/<app_name>`

### Key Configuration
- Database: SQLite (default Django setup)
- Static files: Configured at `/static/` URL
- Admin interface: Available at `/admin/`
- Settings module: `core.settings`

### Current Applications
- **apps/restaurant/**: Restaurant POS system with full API support
  - Models: Restaurant, Branch, Staff, Product, Order, Payment, Inventory, etc.
  - API endpoints available at `/api/`
  - Role-based permissions (Admin, Manager, Cashier, Kitchen, Warehouse)
  - Test-driven development with comprehensive test coverage
  - **Kitchen Printer Service**: Automatic order printing with priority queuing
    - Print formatted tickets for kitchen staff
    - Priority-based order serving (RUSH > HIGH > NORMAL > STANDARD)
    - Order queue management with dynamic priority calculation
    - Management command for live printing or testing

### Development Notes
- Using Django REST Framework for API
- CORS enabled for frontend integration
- Django Filter backend for advanced filtering
- Role-based authentication and permissions implemented
- SECURITY WARNING: Current `SECRET_KEY` in settings.py is insecure and should be replaced for production