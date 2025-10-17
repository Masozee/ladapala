# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ladapala is a comprehensive Point of Sale (POS) system for Indonesian restaurants. It's a full-stack monorepo with a Next.js 15 frontend (`resto/`) and Django REST API backend (`backend/`), featuring session-based authentication, cashier shift management, and real-time order tracking.

## Development Commands

### Backend (Django API)
```bash
cd backend

# Run with uv (recommended)
uv run python manage.py runserver

# Database operations
python manage.py makemigrations
python manage.py migrate

# Create test users with staff relationships
python manage.py seed_auth_users

# Seed restaurant data (products, categories, tables)
python manage.py seed_resto_data

# Testing
python manage.py test
python manage.py test apps.restaurant
```

### Frontend (Next.js)
```bash
cd resto

# Install dependencies
npm install

# Development server (uses bun)
bun dev

# Build and production
npm run build
npm start
```

## Critical Architecture Concepts

### Restaurant Order Status Flow

Orders follow a specific lifecycle that reflects restaurant operations:

1. **CONFIRMED** - Order received and confirmed
2. **PREPARING** - Kitchen is cooking the food
3. **READY** - Food is ready, waiting to be served to customer
4. **COMPLETED** - Food delivered to customer table, waiting for payment
5. **CANCELLED** - Order was cancelled

**Important**:
- READY means food is ready in kitchen, NOT ready for payment
- COMPLETED means food is delivered to customer, NOW ready for payment
- Only COMPLETED orders can be processed for payment
- This flow is enforced in transaction page and throughout the system

### Authentication & Session Management

The system uses **session-based authentication** with Django sessions:

**Backend (`backend/apps/user/views.py`):**
- `POST /api/user/login/` - Creates Django session
- `GET /api/user/check-session/` - Validates session
- `POST /api/user/logout/` - Destroys session
- `GET /api/user/profile/` - Returns user + employee + profile + staff info

**Frontend (`resto/middleware.ts`):**
- Middleware protects all routes except `/login`
- Validates session cookie with backend on every request
- Redirects to `/login` if session invalid
- Session cookie must be sent with `credentials: 'include'`

**Auth Context (`resto/src/contexts/auth-context.tsx`):**
- Centralized auth state management
- Provides: `user`, `employee`, `profile`, `staff`, `isAuthenticated`
- Auto-refreshes session on mount
- Used by all dashboard layouts and protected components

**Test Users:**
- Admin: `budi.admin@ladapala.co.id` / `password123`
- Manager: `siti.manager@ladapala.co.id` / `password123`
- Cashier: `sari.kasir@ladapala.co.id` / `password123`

### Cashier Shift & Session System

**CashierSession Model (`backend/apps/restaurant/models.py:439-548`):**

Sessions track cashier shifts with cash reconciliation:
- Links to Staff (must have role='CASHIER')
- Contains opening_cash, expected_cash, actual_cash, cash_difference
- Shift types: MORNING, AFTERNOON, EVENING, NIGHT
- Payments auto-link to active cashier session

**SessionAuditLog Model:**
- Tracks all session events for audit trail
- Event types: SESSION_OPENED, SESSION_CLOSED, OVERRIDE_APPLIED, SCHEDULE_WARNING, CASH_DISCREPANCY
- Stores detailed event_data in JSON field
- Automatic logging of cash discrepancies > Rp 1,000

**Key Features:**
- Schedule validation when opening sessions
- Manager override capability for sessions without schedules
- Cash reconciliation on shift close
- Comprehensive audit trail
- Settlement validation (all orders must be settled before closing)

**API Endpoints:**
- `POST /api/cashier-sessions/` - Open new session
- `GET /api/cashier-sessions/active/` - Get active sessions
- `GET /api/cashier-sessions/check_schedule/` - Validate schedule before opening
- `POST /api/cashier-sessions/{id}/close/` - Close session with settlement
- `GET /api/cashier-sessions/{id}/report/` - Get detailed settlement report

### Staff Roles & Permissions

**StaffRole Enum:**
- ADMIN - Full system access
- MANAGER - Can override schedules, view all reports
- CASHIER - Process transactions, manage shifts
- KITCHEN - View kitchen orders
- WAREHOUSE - Manage inventory

**Important:**
- User model is separate from Staff model
- Staff links to User with OneToOneField
- Not all users have staff relationships
- Check `hasattr(user, 'staff')` before accessing staff info

### Table Management & Privacy

**Table Page (`resto/src/app/(dashboard)/table/page.tsx`):**
- Does NOT show financial information (revenue/prices) on table cards
- Shows: table status, order count, latest order status, occupied time
- Financial data only visible in detail popup (staff access)
- This prevents public/waiters from seeing sensitive financial data

**Table Status:**
- OCCUPIED - Has active orders
- AVAILABLE - Empty and ready
- RESERVED - Booked via localStorage
- Each occupied table shows latest order status badge

### Frontend Architecture

**Layout Structure:**
```
app/
├── (dashboard)/          # Protected routes with sidebar
│   ├── layout.tsx       # Wrapped with AuthProvider
│   ├── page.tsx         # Dashboard/homepage
│   ├── menu/            # Menu ordering
│   ├── table/           # Table management
│   ├── transaction/     # Payment processing
│   └── session/
│       └── open/        # Cashier session opening
├── office/              # Office layout (also protected)
│   └── layout.tsx       # Also wrapped with AuthProvider
└── login/               # Public login page
```

**Key Components:**
- `sidebar.tsx` - Main navigation with Indonesian labels
- `top-navbar.tsx` - Shows session status, user info, quick actions
- `receipt.tsx` - Printable receipt component with auto-print
- `auth-context.tsx` - Centralized authentication state
- `role-guard.tsx` - Reusable role-based access control

**UI Configuration:**
- shadcn/ui with "new-york" style
- Icons: @hugeicons/react (NOT lucide-react)
- Tailwind CSS v4
- Indonesian language throughout UI
- Path alias: `@/*` maps to `src/*`

### API Integration

**API Client (`resto/src/lib/api.ts`):**
- Base URL: `http://localhost:8000/api`
- All requests include `credentials: 'include'` for session cookies
- CSRF token automatically extracted from cookies
- TypeScript interfaces for all API responses

**Important Endpoints:**
- `/orders/unpaid/` - Returns READY status orders (not used for payment anymore)
- `/orders/processing/` - Returns PREPARING/CONFIRMED orders
- `/orders/` - Main order endpoint with status filtering
- `/cashier-sessions/` - Cashier shift management
- `/user/check-session/` - Session validation

### Database Schema Notes

**Key Relationships:**
- Order → Payment (one-to-many)
- Payment → CashierSession (many-to-one, nullable)
- Staff → User (one-to-one)
- Staff → Schedule (one-to-many)
- Order → Table (many-to-one, nullable)
- Order → OrderItem (one-to-many)

**Current Setup:**
- SQLite database in development
- Branch ID is hardcoded as 4 in seed data
- Media files stored in `backend/media/`
- 15 seeded products with images

## Development Guidelines

### When Working with Orders:
- Always use correct status flow: CONFIRMED → PREPARING → READY → COMPLETED
- COMPLETED is when order is delivered to customer
- Only COMPLETED orders should be processed for payment
- Update order status using `api.updateOrderStatus(orderId, newStatus)`

### When Working with Authentication:
- Always check `staff` exists before accessing role/branch
- Use `useAuth()` hook in client components
- Wrap new layouts with `<AuthProvider>` if they need auth
- Middleware automatically protects routes

### When Working with Cashier Sessions:
- Validate schedule before opening session
- Log all session events to SessionAuditLog
- Link payments to active cashier session
- Prevent closing session with unsettled orders

### When Adding New Pages:
- Indonesian labels throughout UI
- Use Hugeicons, not Lucide
- Include proper TypeScript types
- Add to sidebar navigation if needed
- Consider role-based access with RoleGuard

## Configuration Files

### Backend
- `backend/core/settings.py` - Main Django settings
  - CORS enabled with credentials
  - Session cookies: `SESSION_COOKIE_SAMESITE = 'Lax'`
  - CSRF trusted origins includes localhost:3000
- `backend/apps/restaurant/` - Main POS app with all models/viewsets
- `backend/apps/user/` - User management and authentication

### Frontend
- `resto/.env.local` - Environment variables (not in git)
  - `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
  - `NEXT_PUBLIC_API_BRANCH_ID=4`
- `resto/next.config.ts` - Next.js configuration
- `resto/middleware.ts` - Route protection middleware
- `resto/tsconfig.json` - TypeScript with strict mode, path mapping

## Common Patterns

### Creating Protected Pages:
```typescript
'use client'
import { RoleGuard } from '@/components/role-guard'
import { useAuth } from '@/contexts/auth-context'

export default function MyPage() {
  const { staff } = useAuth()

  return (
    <RoleGuard allowedRoles={['CASHIER', 'ADMIN']}>
      <div>Your protected content</div>
    </RoleGuard>
  )
}
```

### API Calls with Session:
```typescript
// Client-side (automatic session cookie handling)
const orders = await api.getOrders({ status: 'COMPLETED' })

// Always check response
if (response.ok) {
  // Success
} else {
  // Handle error - might be 401 if session expired
}
```

### Status Updates:
```typescript
// Update order status through the flow
await api.updateOrderStatus(orderId, 'PREPARING') // Start cooking
await api.updateOrderStatus(orderId, 'READY')     // Food ready
await api.updateOrderStatus(orderId, 'COMPLETED') // Delivered to table
// Now ready for payment
```

## Important Notes

- **Language**: All UI text must be in Indonesian
- **Icons**: Use @hugeicons/react, not lucide-react
- **Branch ID**: Currently hardcoded as 4 throughout
- **Payment Flow**: Only process COMPLETED orders
- **Privacy**: Never show prices on public-facing table displays
- **Sessions**: All payments should link to active cashier session
- **Audit**: Always log significant events to SessionAuditLog
