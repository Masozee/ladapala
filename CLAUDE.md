# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ladapala is a comprehensive management system with two main applications organized by business domain:

### 1. **Restaurant POS** (`resto/`)
Point of Sale system for Indonesian restaurants with session-based authentication, cashier shift management, and real-time order tracking.

```
resto/
├── backend/       # Django REST API (Port 8000)
└── frontend/      # Next.js App (Port 3000)
```

### 2. **Hotel Management** (`hotel/`)
Hotel property management system with booking management, room tracking, guest services, and staff coordination.

```
hotel/
├── backend/       # Django REST API (Port 8001)
└── frontend/      # Next.js App (Port 3000)
```

**Technology Stack:**
- **Backend**: Django REST Framework, SQLite
- **Frontend**: Next.js 16 (Turbopack), TypeScript, Tailwind CSS
- **Icons**: @hugeicons/react (hotel), lucide-react (resto)

**IMPORTANT: Domain Separation**
- **Restaurant**: All resto code in `resto/` folder (backend + frontend)
- **Hotel**: All hotel code in `hotel/` folder (backend + frontend)
- Each domain has its own database, user system, and models
- Do NOT mix hotel and restaurant code between domains

## Development Commands

### Quick Start - Running Servers

**Restaurant System:**
```bash
# Terminal 1 - Backend (Port 8000)
cd resto/backend
uv run python manage.py runserver 8000

# Terminal 2 - Frontend (Port 3000)
cd resto/frontend
npm run dev
```

**Hotel System:**
```bash
# Terminal 1 - Backend (Port 8001)
cd hotel/backend
uv run python manage.py runserver 8001

# Terminal 2 - Frontend (Port 3000)
cd hotel/frontend
npm run dev
```

**Important Notes:**
- Each system has its own backend (resto: 8000, hotel: 8001)
- Only run ONE frontend at a time (resto OR hotel) as they both use port 3000
- First time setup requires `npm install` in frontend directories
- Each backend has separate database migrations

### Additional Commands (When Needed)

**Database Management (Restaurant):**
```bash
cd resto/backend
uv run python manage.py makemigrations  # Create new migrations
uv run python manage.py migrate         # Apply migrations
uv run python manage.py seed_auth_users # Create test users
uv run python manage.py seed_resto_data # Seed restaurant data
```

**Database Management (Hotel):**
```bash
cd hotel/backend
uv run python manage.py makemigrations  # Create new migrations
uv run python manage.py migrate         # Apply migrations
uv run python manage.py seed_hotel_users # Create test users
uv run python manage.py seed_hotel_data  # Seed hotel data
```

**Frontend Build:**
```bash
cd resto/frontend  # or cd hotel/frontend
npm run build      # Production build
npm start          # Production server
```

**Testing:**
```bash
cd resto/backend   # or cd hotel/backend
uv run python manage.py test  # Run all tests
```

**Clear Cache (When facing Next.js issues):**
```bash
cd resto/frontend  # or cd hotel/frontend
rm -rf .next
npm run dev
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

**Backend (`resto/backend/apps/user/views.py`):**
- `POST /api/user/login/` - Creates Django session
- `GET /api/user/check-session/` - Validates session
- `POST /api/user/logout/` - Destroys session
- `GET /api/user/profile/` - Returns user + employee + profile + staff info

**Frontend (`resto/frontend/middleware.ts`):**
- Middleware protects all routes except `/login`
- Validates session cookie with backend on every request
- Redirects to `/login` if session invalid
- Session cookie must be sent with `credentials: 'include'`

**Auth Context (`resto/frontend/src/contexts/auth-context.tsx`):**
- Centralized auth state management
- Provides: `user`, `employee`, `profile`, `staff`, `isAuthenticated`
- Auto-refreshes session on mount
- Used by all dashboard layouts and protected components

**Test Users:**
- Admin: `budi.admin@ladapala.co.id` / `password123`
- Manager: `siti.manager@ladapala.co.id` / `password123`
- Cashier: `sari.kasir@ladapala.co.id` / `password123`

### Cashier Shift & Session System

**CashierSession Model (`resto/backend/apps/restaurant/models.py:439-548`):**

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

**Table Page (`resto/frontend/src/app/(dashboard)/table/page.tsx`):**
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

**API Client (`resto/frontend/src/lib/api.ts`):**
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
- SQLite database in development (separate for resto and hotel)
- Restaurant Branch ID is hardcoded as 4 in seed data
- Media files stored in `resto/backend/media/` and `hotel/backend/media/`
- 15 seeded products with images (restaurant)

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

### Restaurant Backend
- `resto/backend/core/settings.py` - Main Django settings
  - CORS enabled with credentials
  - Session cookies: `SESSION_COOKIE_SAMESITE = 'Lax'`
  - CSRF trusted origins includes localhost:3000
- `resto/backend/apps/restaurant/` - Main POS app with all models/viewsets
- `resto/backend/apps/user/` - User management and authentication

### Restaurant Frontend
- `resto/frontend/.env.local` - Environment variables (not in git)
  - `NEXT_PUBLIC_API_URL=http://localhost:8000/api`
  - `NEXT_PUBLIC_API_BRANCH_ID=4`
- `resto/frontend/next.config.ts` - Next.js configuration
- `resto/frontend/middleware.ts` - Route protection middleware
- `resto/frontend/tsconfig.json` - TypeScript with strict mode, path mapping

### Hotel Backend
- `hotel/backend/core/settings.py` - Main Django settings
  - CORS enabled with credentials
  - Session cookies configured
  - CSRF trusted origins includes localhost:3000
- `hotel/backend/apps/hotel/` - Hotel management app with all models/viewsets
- `hotel/backend/apps/user/` - User management and authentication

### Hotel Frontend
- `hotel/frontend/.env.local` - Environment variables (not in git)
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:8001/api`
  - `NEXT_PUBLIC_HOTEL_API_URL=http://localhost:8001/api/hotel`
- `hotel/frontend/next.config.ts` - Next.js configuration
- `hotel/frontend/middleware.ts` - Route protection middleware
- `hotel/frontend/tsconfig.json` - TypeScript with strict mode, path mapping

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

### Icon Management (Hotel Project)

**CRITICAL**: The hotel project uses **@hugeicons/react** (NOT lucide-react). All icons must be imported from the central icon wrapper file.

**Icon System Architecture:**

1. **Central Icon File**: `hotel/frontend/src/lib/icons.tsx`
   - Wraps all Hugeicons with consistent styling (stroke width: 2)
   - All imports must use this file: `import { IconName } from '@/lib/icons'`
   - NEVER import directly from `@hugeicons/react` or `@hugeicons/core-free-icons`

2. **Available Icons**: Check `hotel/frontend/src/lib/icons.tsx` for the complete list of available icons

3. **Adding New Icons**:
   ```typescript
   // Step 1: Import from @hugeicons/core-free-icons in icons.tsx
   import { NewIcon as HugeNewIcon } from '@hugeicons/core-free-icons';

   // Step 2: Create wrapper component
   export const NewIcon = createIconComponent(HugeNewIcon);

   // Step 3: Add display name
   NewIcon.displayName = 'NewIcon';

   // Step 4: Use in your component
   import { NewIcon } from '@/lib/icons';
   <NewIcon className="h-4 w-4" />
   ```

4. **Common Icon Mappings** (from lucide-react to hugeicons):
   ```typescript
   // Navigation & Actions
   ChevronRight → ChevronRightIcon
   ChevronLeft → ChevronLeftIcon
   ChevronUp → ChevronUpIcon
   ChevronDown → ChevronDownIcon
   ArrowLeft → ChevronLeftIcon
   X → Cancel01Icon
   Plus → Add01Icon
   Search → Search02Icon
   Filter → FilterIcon
   RefreshCw → Loading03Icon

   // User & People
   User → UserIcon
   Users → UserMultipleIcon
   UserCheck → UserCheckIcon
   UserCog → UserSettings01Icon

   // UI Elements
   Calendar → Calendar01Icon
   Clock → Clock01Icon
   Bell → Notification02Icon
   Mail → Mail01Icon
   Phone → Call02Icon
   Eye → EyeIcon
   Edit → PencilEdit02Icon
   Settings → Settings02Icon

   // Status & Alerts
   AlertTriangle → AlertCircleIcon
   AlertCircle → AlertCircleIcon
   CheckCircle → UserCheckIcon

   // Business
   Hotel → HotelIcon
   Building → Building03Icon
   Building2 → Building03Icon
   Package → PackageIcon
   CreditCard → CreditCardIcon
   DollarSign → CreditCardIcon

   // Content
   FileText → File01Icon
   Newspaper → News01Icon
   Star → SparklesIcon

   // Navigation
   Home → Home01Icon
   MapPin → Location01Icon
   Door → Door01Icon
   Bed → BedIcon

   // Charts
   PieChart → PieChartIcon
   TrendingUp → ArrowUp01Icon
   TrendingDown → ArrowDown01Icon
   BarChart3 → PieChartIcon

   // UI Controls
   MoreHorizontal → MoreHorizontalIcon
   List → ListViewIcon
   Shield → Shield01Icon
   Lock → Shield01Icon
   ```

5. **Icon Migration Checklist**:
   - [ ] Check if icon exists in `hotel/frontend/src/lib/icons.tsx`
   - [ ] If not available, check @hugeicons free version for alternative
   - [ ] Add icon wrapper to icons.tsx if needed
   - [ ] Update import statement: `from '@/lib/icons'`
   - [ ] Replace icon name in import list with correct Icon suffix
   - [ ] Replace JSX usage: `<OldIcon />` → `<NewIcon />`
   - [ ] Clear Next.js cache: `cd hotel/frontend && rm -rf .next`
   - [ ] Test in development mode
   - [ ] Verify production build: `npm run build`

6. **Common Mistakes to Avoid**:
   - ❌ `import { Calendar } from 'lucide-react'`
   - ✅ `import { Calendar01Icon } from '@/lib/icons'`

   - ❌ `<Calendar className="h-4 w-4" />`
   - ✅ `<Calendar01Icon className="h-4 w-4" />`

   - ❌ Importing non-existent icons without adding them first
   - ✅ Always verify icon exists in icons.tsx before using

7. **Filter Variables Naming Convention**:
   - State variables for filters should NOT have "Icon" suffix
   - ✅ `const [statusFilter, setStatusFilter] = useState('')`
   - ❌ `const [statusFilterIcon, setStatusFilter] = useState('')`
   - Icon component names MUST have "Icon" suffix
   - ✅ `<Calendar01Icon />`
   - ❌ `<Calendar01 />`

8. **Troubleshooting**:
   - **Error: "Export [IconName] doesn't exist"**: Icon not added to icons.tsx
   - **Error: "[iconName] is not defined"**: Variable name mismatch (check for accidental "Icon" suffix)
   - **Icons not updating**: Clear cache with `rm -rf .next` and restart dev server
   - **Build fails but dev works**: Check all pages, not just the one you're testing

## Important Notes

- **Language**: All UI text must be in Indonesian
- **Icons**: Use @hugeicons/react, not lucide-react
- **Branch ID**: Currently hardcoded as 4 throughout
- **Payment Flow**: Only process COMPLETED orders
- **Privacy**: Never show prices on public-facing table displays
- **Sessions**: All payments should link to active cashier session
- **Audit**: Always log significant events to SessionAuditLog
