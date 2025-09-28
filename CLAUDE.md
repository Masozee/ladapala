# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ladapala is a Point of Sale (POS) system for Indonesian restaurants featuring a Next.js frontend and Django REST API backend. The project is structured as a monorepo with separate `resto/` (frontend) and `backend/` directories.

## Development Commands

### Frontend (Next.js App)
```bash
cd resto

# Install dependencies
npm install

# Development server (using bun)
bun dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Backend (Django API)
```bash
cd backend

# Install dependencies with uv
uv add <package_name>

# Run development server
python manage.py runserver

# Database operations
python manage.py makemigrations
python manage.py migrate

# Testing
python manage.py test
python manage.py test apps.<app_name>

# Kitchen printer service
python manage.py kitchen_printer --branch 1 --mode test
python manage.py kitchen_printer --branch 1 --mode live --interval 10
```

## Architecture

### Frontend Structure (`resto/`)
- **Framework**: Next.js 15.5.3 with App Router and React 19
- **Styling**: Tailwind CSS v4 with shadcn/ui components
- **Typography**: Geist font family (Sans & Mono)
- **UI Components**: shadcn/ui with Radix UI primitives
- **Icons**: Lucide React
- **Path Mapping**: `@/*` maps to `src/*`

### Key Frontend Components
- **Layout**: Dashboard layout with sidebar navigation and top navbar
- **Sidebar**: Icon-based navigation with tooltips (Indonesian labels)
  - Beranda (Dashboard), Menu, Meja (Tables), Transaksi (Transactions), Laporan (Reports)
  - Profile, Settings, and Logout actions
- **Routing**: Root redirects to `/dashboard`
- **UI Library**: shadcn/ui configured with "new-york" style and neutral base color

### Backend Structure (`backend/`)
- **Framework**: Django with Django REST Framework
- **Database**: SQLite (development)
- **CORS**: Enabled for frontend integration
- **Apps Structure**: Django apps in `apps/` directory
- **Main App**: `apps/restaurant/` - Full POS system with API endpoints

### Key Backend Features
- **Restaurant Management**: Multi-branch restaurant system
- **Role-based Permissions**: Admin, Manager, Cashier, Kitchen, Warehouse roles
- **Kitchen Printer Service**: Automated order printing with priority queuing
- **API Endpoints**: Available at `/api/` with filtering support

## Component Development

### Frontend Components
- Use TypeScript with strict configuration
- Follow shadcn/ui component patterns
- Implement responsive design with Tailwind CSS
- Use Lucide React for consistent iconography
- Apply Indonesian localization where appropriate

### Backend API Development
- Create new Django apps in `apps/` directory
- Use Django REST Framework serializers and viewsets
- Implement role-based permissions
- Include comprehensive test coverage
- Follow Django best practices for models and views

## Configuration Files

### Frontend Configuration
- **TypeScript**: Strict mode with path mapping to `@/*`
- **ESLint**: Next.js core-web-vitals and TypeScript rules
- **shadcn/ui**: Configured with Tailwind CSS variables and Lucide icons
- **Next.js**: Basic configuration with Turbopack support

### Backend Configuration
- **Django Settings**: Development mode with SQLite
- **Dependencies**: Django, DRF, CORS headers, Pillow, Django Filter
- **Python**: Requires Python 3.12+

## Development Notes

- The project uses Indonesian language for UI labels and business terminology
- Both frontend and backend have separate package management (npm vs uv)
- Kitchen printer functionality is a key feature for restaurant operations
- The backend already has a comprehensive CLAUDE.md with detailed Django guidance
- No existing Cursor rules or additional configuration files detected