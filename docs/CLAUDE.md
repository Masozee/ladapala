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
├── backend/       # Django REST API (Port 8000) if resto not running
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

**CRITICAL: No Dummy/Mock Data Policy**
- **NEVER use dummy data, mock data, or sample data** in frontend components
- **ALL data MUST come from the backend API** via proper API calls
- No hardcoded arrays of fake data (e.g., `const mockReservations = [...]`)
- No placeholder data (e.g., `const sampleGuests = [...]`)
- Always use `useState` with empty initial values and populate via API fetch
- Use loading states while fetching real data from the backend
- If you need test data, create proper seed scripts in Django management commands

**CRITICAL: Backend Port Configuration**
- **DO NOT change backend API ports in the code** - servers are run manually by the user
- Both restaurant and hotel backends run on **port 8000** (user manages which one runs)
- The documentation shows separate ports (resto: 8000, hotel: 8001) for reference only
- All API calls should use `http://localhost:8000/api/` regardless of which backend is running
- If code works on port 8001, it will work on port 8000 - the port number doesn't matter
- Never modify existing port configurations unless explicitly requested by the user

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

## Proper Table/Page Structure (CRUD Pages)

### Two Correct Examples:

1. **UI/Table Design**: `/support/amenities` - Excellent table structure, filters, and responsive design
2. **API Integration**: `/office/warehouse/master-data` - Proper backend integration with real data

---

**CORRECT EXAMPLE for UI/Table Design**: `/support/amenities`

### ✅ What Makes the UI/Table Design Excellent:

1. **Clean Table Structure**
   ```typescript
   // ✅ Proper table with header styling
   <table className="w-full border-collapse bg-white border border-gray-200">
     <thead>
       <tr className="bg-[#F87B1B] text-white">
         <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">
           Guest
         </th>
       </tr>
     </thead>
     <tbody>
       {filteredRequests.map((request) => (
         <tr key={request.id} className="hover:bg-gray-50">
           <td className="border border-gray-200 px-6 py-4">{request.guestName}</td>
         </tr>
       ))}
     </tbody>
   </table>
   ```

2. **Search & Filter Bar**
   ```typescript
   // ✅ Search with icon
   <div className="relative w-80">
     <Search02Icon className="h-4 w-4 text-gray-400" />
     <input
       type="text"
       placeholder="Cari tamu, kamar, atau item..."
       value={searchQuery}
       onChange={(e) => setSearchQuery(e.target.value)}
       className="pl-10 pr-4 py-2 text-sm border focus:ring-2 focus:ring-[#F87B1B]"
     />
   </div>
   ```

3. **Status Badges with Color Coding**
   ```typescript
   const getStatusColor = (status: string) => {
     switch (status) {
       case 'completed': return 'bg-green-100 text-green-800';
       case 'in_progress': return 'bg-blue-100 text-blue-800';
       case 'pending': return 'bg-yellow-100 text-yellow-800';
       default: return 'bg-gray-100 text-gray-800';
     }
   };

   <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(status)}`}>
     {getStatusLabel(status)}
   </span>
   ```

4. **Stats Cards**
   ```typescript
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
     <div className="bg-white border p-6">
       <div className="p-3 bg-yellow-100 rounded">
         <Clock01Icon className="h-6 w-6 text-yellow-600" />
       </div>
       <div className="text-3xl font-bold">{pendingCount}</div>
       <div className="text-sm text-gray-600">Pending Requests</div>
     </div>
   </div>
   ```

5. **Dropdown Actions Menu**
   ```typescript
   <button onClick={() => setOpenMenuId(openMenuId === request.id ? null : request.id)}>
     <MoreHorizontalIcon className="h-4 w-4" />
   </button>
   {openMenuId === request.id && (
     <div className="absolute right-0 top-12 w-48 bg-white border shadow-lg rounded">
       <button className="w-full px-4 py-2 hover:bg-gray-50 flex items-center space-x-2">
         <EyeIcon className="h-4 w-4" />
         <span>View Details</span>
       </button>
     </div>
   )}
   ```

6. **Dynamic Tab Counts**
   ```typescript
   const pendingCount = requests.filter(r => r.status === 'pending').length;
   <option value="pending">Pending ({pendingCount})</option>
   ```

---

**CORRECT EXAMPLE for API Integration**: `/office/warehouse/master-data`

### ✅ What Makes API Integration Correct:

1. **Real API Data - No Mock Data**
   ```typescript
   // ✅ CORRECT: Fetch from backend API
   const [items, setItems] = useState<InventoryItem[]>([]);

   const fetchInventory = async () => {
     const response = await fetch(buildApiUrl('hotel/inventory/'));
     const data = await response.json();
     setItems(data.results || data);
   };

   // ❌ WRONG: Hardcoded mock data
   const items = [
     { id: 1, name: 'Item 1', ... },  // Never do this!
     { id: 2, name: 'Item 2', ... }
   ];
   ```

2. **TypeScript Interfaces Matching Backend**
   ```typescript
   // ✅ Interface matches Django model fields
   interface InventoryItem {
     id: number;
     name: string;
     category: string;
     current_stock: number;
     supplier: number | null;
     supplier_name?: string;  // From serializer read-only field
   }
   ```

3. **Category Mapping (Backend Value → Display Label)**
   ```typescript
   // ✅ Use backend enum values in dropdowns
   <option value="AMENITIES">Guest Amenities</option>
   <option value="FOOD">Food & Beverage</option>

   // ✅ Helper function for display
   const getCategoryLabel = (category: string): string => {
     const categoryMap: Record<string, string> = {
       'AMENITIES': 'Guest Amenities',
       'FOOD': 'Food & Beverage',
       // ...
     };
     return categoryMap[category] || category;
   };
   ```

4. **Proper CRUD Operations**
   ```typescript
   // ✅ CREATE: POST with proper type conversion
   const response = await fetch(buildApiUrl('hotel/inventory/'), {
     method: 'POST',
     headers: { 'X-CSRFToken': csrfToken },
     credentials: 'include',
     body: JSON.stringify({
       name: formData.name,
       category: formData.category,  // Backend enum value
       supplier: formData.supplier ? parseInt(formData.supplier) : null
     })
   });

   // ✅ UPDATE: PATCH/PUT with ID
   await fetch(buildApiUrl(`hotel/inventory/${id}/`), {
     method: 'PATCH',
     // ...
   });

   // ✅ DELETE: DELETE with ID
   await fetch(buildApiUrl(`hotel/inventory/${id}/`), {
     method: 'DELETE',
     // ...
   });
   ```

5. **Related Data (Foreign Keys)**
   ```typescript
   // ✅ Fetch related data (suppliers) separately
   const [suppliers, setSuppliers] = useState<Supplier[]>([]);

   const fetchSuppliers = async () => {
     const response = await fetch(buildApiUrl('hotel/suppliers/?status=ACTIVE'));
     const data = await response.json();
     setSuppliers(data.results || data);
   };

   // ✅ Dropdown with proper ID conversion
   <select value={formData.supplier} onChange={...}>
     <option value="">Pilih Supplier (Opsional)</option>
     {suppliers.map((supplier) => (
       <option key={supplier.id} value={supplier.id}>
         {supplier.name}
       </option>
     ))}
   </select>

   // ✅ On submit: convert to integer
   supplier: formData.supplier ? parseInt(formData.supplier) : null
   ```

6. **Filters & Search**
   ```typescript
   // ✅ Filter using backend values
   const filteredItems = items.filter(item => {
     const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;
     const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
     return matchesCategory && matchesSearch;
   });
   ```

### 🎯 Best Practice: Combine Both Examples

For the best CRUD pages, combine:
- **UI patterns** from `/support/amenities` (table design, filters, badges, stats cards)
- **API integration** from `/office/warehouse/master-data` (real backend data, proper CRUD operations)

**Note**: The amenities page currently uses sample data for demonstration purposes. When implementing production features, always replace sample data with real API calls following the warehouse/master-data pattern.

## Important Notes

- **Language**: All UI text must be in Indonesian
- **Icons**: Use @hugeicons/react, not lucide-react
- **Branch ID**: Currently hardcoded as 4 throughout
- **Payment Flow**: Only process COMPLETED orders
- **Privacy**: Never show prices on public-facing table displays
- **Sessions**: All payments should link to active cashier session
- **Audit**: Always log significant events to SessionAuditLog
