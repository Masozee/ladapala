const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const BRANCH_ID = process.env.NEXT_PUBLIC_API_BRANCH_ID || '1';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  cost: string;
  image: string | null;
  is_available: boolean;
  preparation_time: number;
  sku: string;
  category: number;
  category_name: string;
  profit_margin: string;
}

export interface ProductAvailability {
  id: number;
  name: string;
  price: number;
  category: string | null;
  image: string | null;
  can_be_made: boolean;
  insufficient_ingredients: Array<{
    name: string;
    needed: number;
    available: number;
    unit: string;
  }>;
}

export interface Category {
  id: number;
  name: string;
  description: string;
  display_order: number;
  is_active: boolean;
  product_count: number;
  restaurant: number;
}

export interface Table {
  id: number;
  number: string;
  capacity: number;
  is_available: boolean;
  branch: number;
  branch_name: string;
}

export interface OrderItem {
  id?: number;
  product: number;
  product_name?: string;
  quantity: number;
  unit_price: string;
  discount_amount?: string;
  notes?: string;
  subtotal?: string;
}

export interface Order {
  id?: number;
  order_number?: string;
  branch: number;
  table?: number | null;
  table_number?: string;
  order_type: 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY';
  status?: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';
  customer_name: string;
  customer_phone: string;
  delivery_address?: string;
  notes?: string;
  items: OrderItem[];
  total_amount?: string;
  created_at?: string;
  updated_at?: string;
}

export interface DashboardData {
  total_orders_today: number;
  total_revenue_today: string;
  pending_orders: number;
  low_stock_items: number;
  active_tables: number;
  staff_on_duty: number;
}

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface Employee {
  id: number;
  employee_id: string;
  full_name: string;
  position: string;
  department: {
    id: number;
    name: string;
  } | null;
}

export interface UserProfile {
  role: string;
  system_access: string;
  phone: string;
  bio?: string;
  address?: string;
  date_of_birth?: string | null;
}

export interface Staff {
  id: number;
  employee_id: string;
  role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'WAREHOUSE';
  branch: {
    id: number;
    name: string;
  };
  phone: string;
  is_active: boolean;
  user: {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
  };
}

export interface AuthResponse {
  message?: string;
  user: User;
  employee?: Employee | null;
  profile?: UserProfile | null;
  staff?: Staff | null;
}

export interface SessionCheckResponse {
  authenticated: boolean;
  user?: User;
  employee?: Employee | null;
  profile?: UserProfile | null;
  staff?: Staff | null;
}

export interface Payment {
  id: number;
  order: number;
  amount: string;
  payment_method: 'CASH' | 'CARD' | 'MOBILE' | 'OTHER';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  created_at: string;
  updated_at: string;
}

export interface UserProfileData {
  id?: number;
  role: string;
  system_access: string;
  phone: string;
  bio: string;
  address: string;
  date_of_birth: string | null;
  avatar: string | null;
}

export interface ProfileUpdateData {
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  address?: string;
  date_of_birth?: string | null;
  avatar?: File;
}

export interface Shift {
  id: number;
  employee: number;
  employee_name: string;
  employee_id_display: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  shift_type: string;
  shift_type_display: string;
  break_duration: number;
  hours_scheduled: number;
  has_attendance: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CashierSession {
  id: number;
  cashier: number;
  cashier_name: string;
  cashier_id: string;
  branch: number;
  branch_name: string;
  shift_type: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  opened_at: string;
  closed_at: string | null;
  status: 'OPEN' | 'CLOSED';
  opening_cash: string;
  expected_cash: string | null;
  actual_cash: string | null;
  cash_difference: string | null;
  settlement_data: {
    total_transactions: number;
    completed_transactions: number;
    cancelled_transactions: number;
    cash_payments: { total: number; count: number };
    card_payments: { total: number; count: number };
    mobile_payments: { total: number; count: number };
    total_revenue: number;
  } | null;
  closed_by: number | null;
  closed_by_name: string | null;
  duration_hours: number | null;
  notes: string;
}

export interface CashierSessionOpen {
  cashier: number;
  branch: number;
  shift_type: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';
  opening_cash: string;
  notes?: string;
  override_by?: number;
  override_reason?: string;
}

export interface ScheduleCheck {
  has_schedule: boolean;
  is_confirmed: boolean;
  schedule: {
    id: number;
    date: string;
    shift_type: string;
    start_time: string;
    end_time: string;
    is_confirmed: boolean;
    notes: string;
  } | null;
  message: string;
  warning?: string;
}

export interface Inventory {
  id: number;
  branch: number;
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_per_unit: string;
  location: 'WAREHOUSE' | 'KITCHEN';
  average_cost: string;
  total_value: string;
  needs_restock: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryCreate {
  branch: number;
  name: string;
  description?: string;
  unit: string;
  min_quantity: number;
  location: 'WAREHOUSE' | 'KITCHEN';
}

export interface InventoryUpdate {
  name?: string;
  description?: string;
  unit?: string;
  min_quantity?: number;
  location?: 'WAREHOUSE' | 'KITCHEN';
}

export interface InventoryTransaction {
  id: number;
  inventory: number;
  inventory_name: string;
  branch: number;
  branch_name: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUST' | 'WASTE';
  transaction_type_display: string;
  quantity: number;
  unit_cost: string;
  total_cost: string;
  reference_number: string;
  notes: string;
  performed_by: number;
  performed_by_name: string;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order?: number;
  inventory_item: number;
  inventory_item_name?: string;
  inventory_item_unit?: string;
  quantity: string;
  unit_price: string;
  total_price?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  branch: number;
  branch_name?: string;
  supplier_name: string;
  supplier_contact?: string;
  supplier_email?: string;
  supplier_phone?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'RECEIVED' | 'CANCELLED';
  order_date: string;
  expected_delivery_date?: string;
  actual_delivery_date?: string;
  created_by: number;
  created_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  received_by?: number;
  received_by_name?: string;
  notes?: string;
  terms_and_conditions?: string;
  items: PurchaseOrderItem[];
  total_amount: string;
  total_items: number;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderCreate {
  branch: number;
  supplier_name: string;
  supplier_contact?: string;
  supplier_email?: string;
  supplier_phone?: string;
  supplier_address?: string;
  payment_terms_days?: number;
  tax_id?: string;
  order_date?: string;
  expected_delivery_date?: string;
  created_by: number;
  notes?: string;
  terms_and_conditions?: string;
  items: {
    inventory_item: number;
    quantity: string;
    unit_price: string;
    notes?: string;
  }[];
}

export interface InventoryTransactionCreate {
  inventory: number;
  transaction_type: 'IN' | 'OUT' | 'ADJUST' | 'WASTE';
  quantity: number;
  unit_cost: string;
  reference_number?: string;
  notes?: string;
}

export interface StockTransfer {
  id: number;
  branch: number;
  item_name: string;
  quantity: string;
  unit: string;
  from_warehouse: number;
  from_warehouse_name: string;
  to_kitchen: number;
  to_kitchen_name: string;
  transferred_by: number;
  transferred_by_name: string;
  transfer_date: string;
  notes: string;
}

export interface StockTransferCreate {
  warehouse_item_id: number;
  kitchen_item_id: number;
  quantity: number;
  notes?: string;
}

export interface CashierSessionClose {
  actual_cash: string;
  notes?: string;
  closed_by?: number;
}

export interface SessionValidation {
  can_close: boolean;
  message: string;
  unsettled_orders?: Array<{
    id: number;
    order_number: string;
    status: string;
    table_number: string | null;
    total_amount: number;
  }>;
  count?: number;
}

export interface SessionReport {
  session: CashierSession;
  transactions: Array<{
    order_number: string;
    table_number: string | null;
    customer_name: string;
    total_amount: number;
    payment_method: string;
    status: string;
    created_at: string;
    items: Array<{
      product_name: string;
      quantity: number;
      unit_price: number;
      subtotal: number;
    }>;
  }>;
  summary: CashierSession['settlement_data'];
}

export interface Vendor {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  payment_terms_days: number;
  tax_id: string;
  total_purchase_orders: number;
  total_amount: string;
  last_order_date: string;
  branch_id: number;
}

export interface VendorDetail {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  payment_terms_days: number;
  tax_id: string;
  total_purchase_orders: number;
  total_amount: string;
  last_order_date: string;
  branch_id: number;
  purchase_orders: PurchaseOrder[];
}

export interface VendorCreate {
  name: string;
  contact_person: string;
  email: string;
  phone: string;
  address: string;
  payment_terms_days: number;
  tax_id: string;
  notes?: string;
  branch: number;
}

class ApiClient {
  private baseUrl: string;
  private branchId: string;
  private csrfToken: string | null = null;

  constructor() {
    this.baseUrl = API_URL;
    this.branchId = BRANCH_ID;
  }

  private getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;

    const name = 'csrftoken';
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        return decodeURIComponent(cookie.substring(name.length + 1));
      }
    }
    return null;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    // Get CSRF token from cookie
    const csrfToken = this.getCsrfToken();

    try {
      const response = await fetch(url, {
        ...options,
        credentials: 'include', // Important for session cookies
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
          ...options?.headers,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Fetch Error:', error);
      throw error;
    }
  }

  // Products
  async getProducts(params?: { category?: number; search?: string; is_available?: boolean; branch?: number }): Promise<{ count: number; results: Product[] }> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.is_available !== undefined) searchParams.set('is_available', params.is_available.toString());
    if (params?.branch) searchParams.set('branch', params.branch.toString());

    const query = searchParams.toString();
    return this.fetch(`/products/${query ? `?${query}` : ''}`);
  }

  async getProduct(id: number): Promise<Product> {
    return this.fetch(`/products/${id}/`);
  }

  async getAvailableProducts(): Promise<{ count: number; results: Product[] }> {
    return this.fetch('/products/available/');
  }

  async checkProductStockAvailability(): Promise<ProductAvailability[]> {
    return this.fetch('/products/check_stock_availability/');
  }

  // Categories
  async getCategories(): Promise<{ count: number; results: Category[] }> {
    return this.fetch(`/categories/`);
  }

  async getCategory(id: number): Promise<Category> {
    return this.fetch(`/categories/${id}/`);
  }

  // Tables
  async getTables(params?: { is_available?: boolean }): Promise<{ count: number; results: Table[] }> {
    const searchParams = new URLSearchParams();
    searchParams.set('branch', this.branchId);
    if (params?.is_available !== undefined) searchParams.set('is_available', params.is_available.toString());

    return this.fetch(`/tables/?${searchParams.toString()}`);
  }

  async getTable(id: number): Promise<Table> {
    return this.fetch(`/tables/${id}/`);
  }

  async setTableAvailable(id: number): Promise<{ status: string }> {
    return this.fetch(`/tables/${id}/set_available/`, {
      method: 'POST',
    });
  }

  async setTableOccupied(id: number): Promise<{ status: string }> {
    return this.fetch(`/tables/${id}/set_occupied/`, {
      method: 'POST',
    });
  }

  // Orders
  async getOrders(params?: { status?: string; table?: number; order_type?: string }): Promise<{ count: number; results: Order[] }> {
    const searchParams = new URLSearchParams();
    searchParams.set('branch', this.branchId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.table) searchParams.set('table', params.table.toString());
    if (params?.order_type) searchParams.set('order_type', params.order_type);

    return this.fetch(`/orders/?${searchParams.toString()}`);
  }

  async getOrder(id: number): Promise<Order> {
    return this.fetch(`/orders/${id}/`);
  }

  async getTodayOrders(): Promise<{ count: number; results: Order[] }> {
    return this.fetch('/orders/today/');
  }

  async getUnpaidOrders(): Promise<{ count: number; total_amount: number; results: Order[] }> {
    return this.fetch(`/orders/unpaid/?branch_id=${this.branchId}`);
  }

  async getProcessingOrders(): Promise<{ count: number; results: Order[] }> {
    return this.fetch(`/orders/processing/?branch_id=${this.branchId}`);
  }

  async createOrder(order: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'total_amount' | 'status'>): Promise<Order> {
    return this.fetch('/orders/', {
      method: 'POST',
      body: JSON.stringify({
        ...order,
        branch: parseInt(this.branchId),
      }),
    });
  }

  async updateOrderStatus(id: number, status: string): Promise<{ status: string }> {
    return this.fetch(`/orders/${id}/update_status/`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  }

  async addOrderItem(orderId: number, item: OrderItem): Promise<OrderItem> {
    return this.fetch(`/orders/${orderId}/add_item/`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  // Dashboard
  async getDashboardSummary(sessionId?: number): Promise<DashboardData> {
    const params = new URLSearchParams({ branch_id: this.branchId });
    if (sessionId) params.set('session_id', sessionId.toString());
    return this.fetch(`/dashboard/summary/?${params.toString()}`);
  }

  // Payments
  async createPayment(payment: {
    order: number;
    amount: string;
    payment_method: 'CASH' | 'CARD' | 'MOBILE' | 'OTHER';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  }): Promise<Payment> {
    return this.fetch('/payments/', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }

  // Authentication
  async getCsrfCookie(): Promise<void> {
    // Request CSRF cookie from backend
    await this.fetch('/user/login/', {
      method: 'GET',
    });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    // Ensure we have CSRF token
    await this.getCsrfCookie();

    return this.fetch('/user/login/', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout(): Promise<{ message: string }> {
    return this.fetch('/user/logout/', {
      method: 'POST',
    });
  }

  async checkSession(): Promise<SessionCheckResponse> {
    return this.fetch('/user/check-session/');
  }

  async getUserProfile(): Promise<AuthResponse> {
    return this.fetch('/user/profile/');
  }

  async updateUserProfile(data: ProfileUpdateData): Promise<{ message: string; user: AuthResponse }> {
    // If avatar is included, use FormData
    if (data.avatar) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value as string | Blob);
        }
      });

      const csrfToken = this.getCsrfToken();
      const response = await fetch(`${this.baseUrl}/user/profile/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      return await response.json();
    }

    // Otherwise use JSON
    return this.fetch('/user/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getUserShifts(params?: { from_date?: string; to_date?: string }): Promise<{ shifts: Shift[]; employee: Employee }> {
    const searchParams = new URLSearchParams();
    if (params?.from_date) searchParams.set('from_date', params.from_date);
    if (params?.to_date) searchParams.set('to_date', params.to_date);

    const query = searchParams.toString();
    return this.fetch(`/user/shifts/${query ? `?${query}` : ''}`);
  }

  // Cashier Sessions
  async getCashierSessions(params?: { cashier?: number; branch?: number; status?: string }): Promise<{ count: number; results: CashierSession[] }> {
    const searchParams = new URLSearchParams();
    if (params?.cashier) searchParams.set('cashier', params.cashier.toString());
    if (params?.branch) searchParams.set('branch', params.branch.toString());
    if (params?.status) searchParams.set('status', params.status);

    return this.fetch(`/cashier-sessions/?${searchParams.toString()}`);
  }

  async getCashierSession(id: number): Promise<CashierSession> {
    return this.fetch(`/cashier-sessions/${id}/`);
  }

  async getActiveCashierSession(cashierId?: number): Promise<CashierSession[]> {
    const searchParams = new URLSearchParams();
    if (cashierId) searchParams.set('cashier_id', cashierId.toString());
    searchParams.set('branch_id', this.branchId);

    return this.fetch(`/cashier-sessions/active/?${searchParams.toString()}`);
  }

  async openCashierSession(data: CashierSessionOpen): Promise<CashierSession> {
    return this.fetch('/cashier-sessions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async validateSessionSettlement(sessionId: number): Promise<SessionValidation> {
    return this.fetch(`/cashier-sessions/${sessionId}/validate_settlement/`);
  }

  async closeCashierSession(sessionId: number, data: CashierSessionClose): Promise<CashierSession> {
    return this.fetch(`/cashier-sessions/${sessionId}/close/`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getSessionReport(sessionId: number): Promise<SessionReport> {
    return this.fetch(`/cashier-sessions/${sessionId}/report/`);
  }

  async checkSchedule(cashierId: number, shiftType: 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'): Promise<ScheduleCheck> {
    return this.fetch(`/cashier-sessions/check_schedule/?cashier_id=${cashierId}&shift_type=${shiftType}`);
  }

  // Staff
  async getStaff(params?: { branch?: number; role?: string; is_active?: boolean }): Promise<{ count: number; results: Staff[] }> {
    const searchParams = new URLSearchParams();
    if (params?.branch) searchParams.set('branch', params.branch.toString());
    if (params?.role) searchParams.set('role', params.role);
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());

    const query = searchParams.toString();
    return this.fetch(`/staff/${query ? `?${query}` : ''}`);
  }

  async getStaffMember(id: number): Promise<Staff> {
    return this.fetch(`/staff/${id}/`);
  }

  // Schedules
  async getSchedules(params?: { staff?: number; date?: string; date_gte?: string; date_lte?: string; shift_type?: string }): Promise<{ count: number; results: Shift[] }> {
    const searchParams = new URLSearchParams();
    if (params?.staff) searchParams.set('staff', params.staff.toString());
    if (params?.date) searchParams.set('date', params.date);
    if (params?.date_gte) searchParams.set('date__gte', params.date_gte);
    if (params?.date_lte) searchParams.set('date__lte', params.date_lte);
    if (params?.shift_type) searchParams.set('shift_type', params.shift_type);

    const query = searchParams.toString();
    return this.fetch(`/schedules/${query ? `?${query}` : ''}`);
  }

  async getSchedule(id: number): Promise<Shift> {
    return this.fetch(`/schedules/${id}/`);
  }

  async createSchedule(data: { staff: number; date: string; start_time: string; end_time: string; shift_type: string; notes?: string; is_confirmed?: boolean }): Promise<Shift> {
    return this.fetch(`/schedules/`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Inventory
  async getInventory(params?: { branch?: number; search?: string; status?: string; location?: string; page_size?: number }): Promise<{ count: number; results: Inventory[] }> {
    const searchParams = new URLSearchParams();
    if (params?.branch) searchParams.set('branch', params.branch.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.location) searchParams.set('location', params.location);
    if (params?.page_size) searchParams.set('page_size', params.page_size.toString());
    if (params?.status) {
      // status filter: 'low' (needs restock), 'out' (quantity = 0), 'normal'
      if (params.status === 'low') {
        searchParams.set('needs_restock', 'true');
      } else if (params.status === 'out') {
        searchParams.set('quantity', '0');
      }
    }

    const query = searchParams.toString();
    return this.fetch(`/inventory/${query ? `?${query}` : ''}`);
  }

  async getAllInventory(params?: { branch?: number; search?: string; status?: string; location?: string }): Promise<Inventory[]> {
    let allResults: Inventory[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const searchParams = new URLSearchParams();
      if (params?.branch) searchParams.set('branch', params.branch.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.location) searchParams.set('location', params.location);
      if (params?.status) {
        if (params.status === 'low') {
          searchParams.set('needs_restock', 'true');
        } else if (params.status === 'out') {
          searchParams.set('quantity', '0');
        }
      }
      searchParams.set('page', page.toString());
      searchParams.set('page_size', '100');

      const query = searchParams.toString();
      const response: { count: number; results: Inventory[]; next: string | null } = await this.fetch(`/inventory/${query ? `?${query}` : ''}`);

      allResults = [...allResults, ...response.results];
      hasMore = !!response.next;
      page++;
    }

    return allResults;
  }

  async getInventoryItem(id: number): Promise<Inventory> {
    return this.fetch(`/inventory/${id}/`);
  }

  async getLowStockInventory(branch?: number): Promise<{ count: number; results: Inventory[] }> {
    const searchParams = new URLSearchParams();
    if (branch) searchParams.set('branch', branch.toString());

    const query = searchParams.toString();
    return this.fetch(`/inventory/low_stock/${query ? `?${query}` : ''}`);
  }

  async createInventory(data: InventoryCreate): Promise<Inventory> {
    return this.fetch('/inventory/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateInventory(id: number, data: InventoryUpdate): Promise<Inventory> {
    return this.fetch(`/inventory/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteInventory(id: number): Promise<void> {
    return this.fetch(`/inventory/${id}/`, {
      method: 'DELETE',
    });
  }

  // Inventory Transactions
  async getInventoryTransactions(params?: {
    branch?: number;
    inventory?: number;
    transaction_type?: string;
    start_date?: string;
    end_date?: string;
    performed_by?: number;
  }): Promise<{ count: number; results: InventoryTransaction[] }> {
    const searchParams = new URLSearchParams();
    if (params?.branch) searchParams.set('branch', params.branch.toString());
    if (params?.inventory) searchParams.set('inventory', params.inventory.toString());
    if (params?.transaction_type) searchParams.set('transaction_type', params.transaction_type);
    if (params?.start_date) searchParams.set('start_date', params.start_date);
    if (params?.end_date) searchParams.set('end_date', params.end_date);
    if (params?.performed_by) searchParams.set('performed_by', params.performed_by.toString());

    const query = searchParams.toString();
    return this.fetch(`/inventory-transactions/${query ? `?${query}` : ''}`);
  }

  async createInventoryTransaction(data: InventoryTransactionCreate): Promise<InventoryTransaction> {
    return this.fetch('/inventory-transactions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Purchase Orders
  async getPurchaseOrders(params?: {
    branch?: number;
    status?: string;
    created_by?: number;
    search?: string;
    ordering?: string;
  }): Promise<{ count: number; results: PurchaseOrder[] }> {
    const searchParams = new URLSearchParams();
    if (params?.branch) searchParams.set('branch', params.branch.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.created_by) searchParams.set('created_by', params.created_by.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.ordering) searchParams.set('ordering', params.ordering);

    const query = searchParams.toString();
    return this.fetch(`/purchase-orders/${query ? `?${query}` : ''}`);
  }

  async getPurchaseOrder(id: number): Promise<PurchaseOrder> {
    return this.fetch(`/purchase-orders/${id}/`);
  }

  async createPurchaseOrder(data: PurchaseOrderCreate): Promise<PurchaseOrder> {
    return this.fetch('/purchase-orders/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePurchaseOrder(id: number, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> {
    return this.fetch(`/purchase-orders/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deletePurchaseOrder(id: number): Promise<void> {
    return this.fetch(`/purchase-orders/${id}/`, {
      method: 'DELETE',
    });
  }

  async submitPurchaseOrder(id: number): Promise<PurchaseOrder> {
    return this.fetch(`/purchase-orders/${id}/submit/`, {
      method: 'POST',
    });
  }

  async approvePurchaseOrder(id: number): Promise<PurchaseOrder> {
    return this.fetch(`/purchase-orders/${id}/approve/`, {
      method: 'POST',
    });
  }

  async receivePurchaseOrder(id: number, data?: {
    actual_delivery_date?: string;
    received_items?: { item_id: number; quantity_received: number }[];
  }): Promise<PurchaseOrder> {
    return this.fetch(`/purchase-orders/${id}/receive/`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  }

  async cancelPurchaseOrder(id: number): Promise<PurchaseOrder> {
    return this.fetch(`/purchase-orders/${id}/cancel/`, {
      method: 'POST',
    });
  }

  // Recipes
  async getRecipes(params?: { branch?: number; product?: number; is_active?: boolean }): Promise<{ count: number; results: any[] }> {
    const searchParams = new URLSearchParams();
    if (params?.branch) searchParams.set('branch', params.branch.toString());
    if (params?.product) searchParams.set('product', params.product.toString());
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());

    const query = searchParams.toString();
    return this.fetch(`/recipes/${query ? `?${query}` : ''}`);
  }

  async getRecipe(id: number): Promise<any> {
    return this.fetch(`/recipes/${id}/`);
  }

  async createRecipe(data: any): Promise<any> {
    return this.fetch('/recipes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecipe(id: number, data: any): Promise<any> {
    return this.fetch(`/recipes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecipe(id: number): Promise<void> {
    return this.fetch(`/recipes/${id}/`, {
      method: 'DELETE',
    });
  }

  // Recipe Ingredients
  async getRecipeIngredients(params?: { recipe?: number }): Promise<{ count: number; results: any[] }> {
    const searchParams = new URLSearchParams();
    if (params?.recipe) searchParams.set('recipe', params.recipe.toString());

    const query = searchParams.toString();
    return this.fetch(`/recipe-ingredients/${query ? `?${query}` : ''}`);
  }

  async createRecipeIngredient(data: any): Promise<any> {
    return this.fetch('/recipe-ingredients/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecipeIngredient(id: number, data: any): Promise<any> {
    return this.fetch(`/recipe-ingredients/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRecipeIngredient(id: number): Promise<void> {
    return this.fetch(`/recipe-ingredients/${id}/`, {
      method: 'DELETE',
    });
  }

  // Stock Transfer endpoints
  async createStockTransfer(data: StockTransferCreate): Promise<StockTransfer> {
    return this.fetch('/stock-transfers/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getStockTransfers(params?: { branch?: number; from_warehouse?: number; to_kitchen?: number }): Promise<StockTransfer[]> {
    const query = params ? `?${new URLSearchParams(params as any).toString()}` : '';
    return this.fetch(`/stock-transfers/${query}`);
  }

  async getStockTransfer(id: number): Promise<StockTransfer> {
    return this.fetch(`/stock-transfers/${id}/`);
  }

  async getRecentStockTransfers(): Promise<StockTransfer[]> {
    return this.fetch('/stock-transfers/recent/');
  }

  async getStockTransfersByItem(itemName: string): Promise<StockTransfer[]> {
    return this.fetch(`/stock-transfers/by_item/?name=${encodeURIComponent(itemName)}`);
  }

  // Vendor APIs
  async getVendors(branch: number): Promise<Vendor[]> {
    return this.fetch(`/vendors/?branch=${branch}`);
  }

  async getVendorDetail(vendorId: string, branch: number): Promise<VendorDetail> {
    return this.fetch(`/vendors/${vendorId}/?branch=${branch}`);
  }

  async createVendor(data: VendorCreate): Promise<Vendor> {
    return this.fetch('/vendors/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

// Export singleton instance
export const api = new ApiClient();
