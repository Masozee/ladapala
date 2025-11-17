const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const BRANCH_ID = process.env.NEXT_PUBLIC_API_BRANCH_ID || '1';

export interface Restaurant {
  id: number;
  name: string;
  address: string;
  phone: string;
  email: string;
  serial_number: string;
  logo: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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
  // Promo fields
  is_seasonal?: boolean;
  is_promo?: boolean;
  discount_percentage?: string;
  promo_price?: string;
  promo_label?: string;
  valid_from?: string;
  valid_until?: string;
  effective_price?: string;
  is_promo_active?: boolean;
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
  quantity_served?: number;
  quantity_remaining?: number;
  unit_price: string;
  discount_amount?: string;
  notes?: string;
  subtotal?: string;
  status?: 'PENDING' | 'PREPARING' | 'READY' | 'PARTIALLY_SERVED' | 'SERVED';
}

export interface ServeItemRequest {
  order_item_id: number;
  quantity: number;
}

export interface ServingHistoryEntry {
  id: number;
  order: number;
  order_number: string;
  order_item: number;
  product_name: string;
  quantity_served: number;
  served_by: number | null;
  served_by_name: string;
  served_at: string;
  notes: string;
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
  customer_info?: {
    id: number;
    name: string;
    phone_number: string;
    membership_tier: string;
    points_balance: number;
  };
  delivery_address?: string;
  notes?: string;
  items: OrderItem[];
  total_amount?: string;
  created_at?: string;
  updated_at?: string;
  payments?: Payment[];

  // Staff tracking
  order_taken_by?: number | null;
  order_taken_by_name?: string | null;
  prepared_by?: number | null;
  prepared_by_name?: string | null;
  served_by?: number | null;
  served_by_name?: string | null;
  waitress_session?: number | null;

  // Timestamps
  taken_at?: string | null;
  preparation_started_at?: string | null;
  preparation_completed_at?: string | null;
  served_at?: string | null;
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
  restaurant_id: number;
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

export type InventoryItemType = 'CONSUMABLE' | 'UTILITY' | 'EQUIPMENT';
export type InventoryCategory = 'FOOD' | 'BEVERAGE' | 'CLEANING' | 'SERVING' | 'PACKAGING' | 'KITCHEN_TOOLS' | 'DISPOSABLES' | 'MAINTENANCE' | 'OTHER';

export interface Inventory {
  id: number;
  branch: number;
  name: string;
  description?: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  cost_per_unit: string;
  location: 'WAREHOUSE' | 'KITCHEN' | 'BAR';
  average_cost: string;
  total_value: string;
  needs_restock: boolean;
  earliest_expiry_date?: string;
  has_expiring_items: boolean;
  created_at: string;
  updated_at: string;
  // Utility inventory fields
  item_type?: InventoryItemType;
  category?: InventoryCategory;
  is_durable?: boolean;
  par_stock_level?: number;
  lifespan_days?: number;
  breakage_count?: number;
  last_restock_date?: string;
  below_par_stock?: boolean;
  breakage_rate?: number;
}

export interface InventoryCreate {
  branch: number;
  name: string;
  description?: string;
  unit: string;
  min_quantity: number;
  location: 'WAREHOUSE' | 'KITCHEN' | 'BAR';
}

export interface InventoryUpdate {
  name?: string;
  description?: string;
  unit?: string;
  min_quantity?: number;
  location?: 'WAREHOUSE' | 'KITCHEN' | 'BAR';
}

export interface InventoryTransaction {
  id: number;
  inventory: number;
  inventory_name: string;
  branch: number;
  branch_name: string;
  transaction_type: 'IN' | 'OUT' | 'ADJUST' | 'WASTE' | 'TRANSFER' | 'BREAKAGE';
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

export interface InventoryBatch {
  id: number;
  inventory: number;
  inventory_name: string;
  inventory_unit: string;
  batch_number: string;
  quantity_remaining: string;
  original_quantity: string;
  expiry_date: string;
  manufacturing_date?: string;
  purchase_order?: number;
  po_number?: string;
  received_date: string;
  unit_cost: string;
  status: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'DISPOSED';
  disposed_at?: string;
  disposed_by?: number;
  disposed_by_name?: string;
  disposal_method?: string;
  disposal_notes?: string;
  days_until_expiry: number;
  is_expiring_soon: boolean;
  is_expired: boolean;
  is_active: boolean;
  usage_percentage: number;
  created_at: string;
  updated_at: string;
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

// ===========================
// Customer Relationship Management Interfaces
// ===========================

export interface Customer {
  id: number;
  phone_number: string;
  name: string;
  email?: string;
  date_of_birth?: string;
  gender?: 'M' | 'F' | 'OTHER';
  membership_tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  membership_number: string;
  join_date: string;
  points_balance: number;
  lifetime_points: number;
  total_visits: number;
  total_spent: string;
  last_visit?: string;
  favorite_products: number[];
  favorite_products_details?: Product[];
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface LoyaltyTransaction {
  id: number;
  customer: number;
  customer_name: string;
  customer_phone: string;
  transaction_type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';
  points: number;
  balance_after: number;
  order?: number;
  order_number?: string;
  reward?: number;
  reward_name?: string;
  description: string;
  expiry_date?: string;
  created_by?: number;
  created_by_name?: string;
  created_at: string;
}

export interface Reward {
  id: number;
  name: string;
  description: string;
  points_required: number;
  reward_type: 'DISCOUNT' | 'FREE_ITEM' | 'VOUCHER';
  discount_type?: 'PERCENTAGE' | 'FIXED';
  discount_value?: string;
  product?: number;
  product_name?: string;
  voucher_code?: string;
  voucher_value?: string;
  is_active: boolean;
  stock_quantity?: number;
  valid_from?: string;
  valid_until?: string;
  min_purchase?: string;
  max_redemptions_per_customer?: number;
  image?: string;
  sort_order: number;
  redemptions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface CustomerFeedback {
  id: number;
  customer?: number;
  customer_name?: string;
  customer_phone?: string;
  order?: number;
  order_number?: string;
  food_rating: number;
  service_rating: number;
  ambiance_rating: number;
  value_rating: number;
  overall_rating: number;
  comment?: string;
  liked?: string;
  disliked?: string;
  suggestions?: string;
  would_recommend?: boolean;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  staff_response?: string;
  responded_by?: number;
  responded_by_name?: string;
  responded_at?: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED';
  is_public: boolean;
  created_at: string;
}

export interface MembershipTierBenefit {
  id: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  min_total_spent: string;
  min_visits: number;
  points_multiplier: number;
  birthday_bonus_points: number;
  discount_percentage: string;
  priority_reservation: boolean;
  complimentary_items: number[];
  complimentary_items_details?: Product[];
  description: string;
  color_code: string;
  created_at: string;
  updated_at: string;
}

export interface RestaurantSettings {
  id: number;
  restaurant: number;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
  restaurant_email: string;
  restaurant_serial_number: string;
  // Restaurant Information
  tax_rate: string;
  currency: string;
  timezone: string;
  // Notification Settings
  low_stock_alerts: boolean;
  new_order_alerts: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  daily_reports: boolean;
  weekly_reports: boolean;
  // System Settings
  auto_backup: boolean;
  backup_frequency: string;
  data_retention_days: number;
  enable_audit_log: boolean;
  session_timeout_minutes: number;
  // Printer Settings
  kitchen_printer_ip: string;
  bar_printer_ip: string;
  receipt_printer_ip: string;
  enable_auto_print: boolean;
  print_receipts: boolean;
  print_kitchen_orders: boolean;
  // Security Settings
  min_password_length: number;
  password_expiry_days: number;
  require_special_chars: boolean;
  require_numbers: boolean;
  enable_two_factor: boolean;
  enable_ip_restriction: boolean;
  max_login_attempts: number;
  enable_data_encryption: boolean;
  anonymize_logs: boolean;
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface StaffSession {
  id: number;
  staff: number;
  staff_name: string;
  staff_role: string;
  staff_email: string;
  branch: number;
  branch_name: string;
  schedule: number | null;
  schedule_info: {
    id: number;
    date: string;
    shift_type: string;
    start_time: string;
    end_time: string;
  } | null;
  shift_type: 'MORNING' | 'EVENING';
  opened_at: string;
  closed_at: string | null;
  status: 'OPEN' | 'CLOSED';
  override_by: number | null;
  override_reason: string;
  orders_taken_count: number;
  orders_prepared_count: number;
  orders_served_count: number;
  items_prepared_count: number;
  notes: string;
  duration: number;
  average_prep_time: number;
  created_at: string;
  updated_at: string;
}

export interface ActiveStaff {
  id: number;
  staff_id: number;
  staff_name: string;
  staff_role: string;
  shift_type: string;
  orders_prepared_count: number;
  items_prepared_count: number;
  opened_at: string;
  duration: number;
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

        // Handle Django validation errors
        if (errorData.detail) {
          throw new Error(errorData.detail);
        }

        // Handle field-specific errors
        if (errorData.non_field_errors) {
          throw new Error(errorData.non_field_errors.join(', '));
        }

        // Handle multiple field errors
        const fieldErrors = Object.entries(errorData)
          .filter(([key]) => key !== 'error' && key !== 'message')
          .map(([field, errors]) => {
            if (Array.isArray(errors)) {
              return `${field}: ${errors.join(', ')}`;
            }
            return `${field}: ${errors}`;
          });

        if (fieldErrors.length > 0) {
          throw new Error(fieldErrors.join('; '));
        }

        throw new Error(errorData.error || errorData.message || `API Error: ${response.status} ${response.statusText}`);
      }

      // Handle empty responses (like DELETE requests)
      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType?.includes('application/json')) {
        return {} as T;
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

  async linkCustomerToOrder(orderId: number, customerId: number): Promise<Order> {
    return this.fetch(`/orders/${orderId}/`, {
      method: 'PATCH',
      body: JSON.stringify({ customer: customerId }),
    });
  }

  async addOrderItem(orderId: number, item: OrderItem): Promise<OrderItem> {
    return this.fetch(`/orders/${orderId}/add_item/`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  async serveOrderItems(
    orderId: number,
    items: ServeItemRequest[],
    notes?: string
  ): Promise<{
    message: string;
    order_status: string;
    served_items: Array<{
      order_item_id: number;
      product_name: string;
      quantity_served: number;
      total_served: number;
      total_quantity: number;
      status: string;
    }>;
    all_served: boolean;
  }> {
    return this.fetch(`/orders/${orderId}/serve_items/`, {
      method: 'POST',
      body: JSON.stringify({ items, notes }),
    });
  }

  async getServingHistory(orderId: number): Promise<ServingHistoryEntry[]> {
    return this.fetch(`/orders/${orderId}/serving_history/`);
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

  async voidPayment(paymentId: number, reason: string): Promise<{ message: string; payment_id: number; transaction_id: string; order_status: string }> {
    return this.fetch(`/payments/${paymentId}/void/`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
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

  async getAllInventory(params?: { branch?: number; search?: string; status?: string; location?: string; item_type?: string }): Promise<Inventory[]> {
    let allResults: Inventory[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const searchParams = new URLSearchParams();
      if (params?.branch) searchParams.set('branch', params.branch.toString());
      if (params?.search) searchParams.set('search', params.search);
      if (params?.location) searchParams.set('location', params.location);
      if (params?.item_type) searchParams.set('item_type', params.item_type);
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

  // Utility Inventory endpoints
  async getUtilityInventory(params?: { branch?: number; category?: string; is_durable?: boolean }): Promise<Inventory[]> {
    const searchParams = new URLSearchParams();
    if (params?.branch) searchParams.set('branch', params.branch.toString());
    if (params?.category) searchParams.set('category', params.category);
    if (params?.is_durable !== undefined) searchParams.set('is_durable', params.is_durable.toString());

    const query = searchParams.toString();
    return this.fetch(`/inventory/utilities/${query ? `?${query}` : ''}`);
  }

  async getConsumableInventory(params?: { branch?: number }): Promise<Inventory[]> {
    const searchParams = new URLSearchParams();
    if (params?.branch) searchParams.set('branch', params.branch.toString());

    const query = searchParams.toString();
    return this.fetch(`/inventory/consumables/${query ? `?${query}` : ''}`);
  }

  async getBelowParStock(params?: { branch?: number }): Promise<Inventory[]> {
    const searchParams = new URLSearchParams();
    if (params?.branch) searchParams.set('branch', params.branch.toString());

    const query = searchParams.toString();
    return this.fetch(`/inventory/below_par_stock/${query ? `?${query}` : ''}`);
  }

  async recordBreakage(id: number, data: { quantity: number; notes?: string }): Promise<Inventory> {
    return this.fetch(`/inventory/${id}/record_breakage/`, {
      method: 'POST',
      body: JSON.stringify(data),
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

  // Inventory Batches
  async getInventoryBatches(params?: {
    inventory?: number;
    status?: string;
    purchase_order?: number;
    ordering?: string;
  }): Promise<{ count: number; results: InventoryBatch[] }> {
    const searchParams = new URLSearchParams();
    if (params?.inventory) searchParams.set('inventory', params.inventory.toString());
    if (params?.status) searchParams.set('status', params.status);
    if (params?.purchase_order) searchParams.set('purchase_order', params.purchase_order.toString());
    if (params?.ordering) searchParams.set('ordering', params.ordering);

    const query = searchParams.toString();
    return this.fetch(`/inventory-batches/${query ? `?${query}` : ''}`);
  }

  async getExpiringBatches(): Promise<InventoryBatch[]> {
    return this.fetch('/inventory-batches/expiring/');
  }

  async getExpiredBatches(): Promise<InventoryBatch[]> {
    return this.fetch('/inventory-batches/expired/');
  }

  async disposeBatch(id: number, data: { disposal_method: string; disposal_notes?: string }): Promise<InventoryBatch> {
    return this.fetch(`/inventory-batches/${id}/dispose/`, {
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
  async getRecipes(params?: { branch?: number; product?: number; is_active?: boolean }): Promise<{ count: number; results: unknown[] }> {
    const searchParams = new URLSearchParams();
    if (params?.branch) searchParams.set('branch', params.branch.toString());
    if (params?.product) searchParams.set('product', params.product.toString());
    if (params?.is_active !== undefined) searchParams.set('is_active', params.is_active.toString());

    const query = searchParams.toString();
    return this.fetch(`/recipes/${query ? `?${query}` : ''}`);
  }

  async getRecipe(id: number): Promise<unknown> {
    return this.fetch(`/recipes/${id}/`);
  }

  async createRecipe(data: unknown): Promise<unknown> {
    return this.fetch('/recipes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecipe(id: number, data: unknown): Promise<unknown> {
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
  async getRecipeIngredients(params?: { recipe?: number }): Promise<{ count: number; results: unknown[] }> {
    const searchParams = new URLSearchParams();
    if (params?.recipe) searchParams.set('recipe', params.recipe.toString());

    const query = searchParams.toString();
    return this.fetch(`/recipe-ingredients/${query ? `?${query}` : ''}`);
  }

  async createRecipeIngredient(data: unknown): Promise<unknown> {
    return this.fetch('/recipe-ingredients/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRecipeIngredient(id: number, data: unknown): Promise<unknown> {
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
    const query = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : '';
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

  // Report APIs
  async getSalesReport(params: {
    period: 'today' | 'week' | 'month' | 'year' | 'custom'
    branch?: number
    start_date?: string
    end_date?: string
  }): Promise<unknown> {
    const searchParams = new URLSearchParams();
    searchParams.append('period', params.period);
    if (params.branch) searchParams.append('branch', params.branch.toString());
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);

    return this.fetch(`/reports/sales/?${searchParams.toString()}`);
  }

  async getExpensesReport(params: {
    period: 'today' | 'week' | 'month' | 'year' | 'custom'
    branch?: number
    start_date?: string
    end_date?: string
  }): Promise<unknown> {
    const searchParams = new URLSearchParams();
    searchParams.append('period', params.period);
    if (params.branch) searchParams.append('branch', params.branch.toString());
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);

    return this.fetch(`/reports/expenses/?${searchParams.toString()}`);
  }

  async getProductsReport(params: {
    period: 'today' | 'week' | 'month' | 'year' | 'custom'
    branch?: number
    start_date?: string
    end_date?: string
    limit?: number
  }): Promise<unknown> {
    const searchParams = new URLSearchParams();
    searchParams.append('period', params.period);
    if (params.branch) searchParams.append('branch', params.branch.toString());
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);
    if (params.limit) searchParams.append('limit', params.limit.toString());

    return this.fetch(`/reports/products/?${searchParams.toString()}`);
  }

  async getTrendsReport(params: {
    period: 'today' | 'week' | 'month' | 'year' | 'custom'
    branch?: number
    start_date?: string
    end_date?: string
  }): Promise<unknown> {
    const searchParams = new URLSearchParams();
    searchParams.append('period', params.period);
    if (params.branch) searchParams.append('branch', params.branch.toString());
    if (params.start_date) searchParams.append('start_date', params.start_date);
    if (params.end_date) searchParams.append('end_date', params.end_date);

    return this.fetch(`/reports/trends/?${searchParams.toString()}`);
  }

  // ===========================
  // Customer Relationship Management APIs
  // ===========================

  // Customer APIs
  async getCustomers(params?: { membership_tier?: string; is_active?: boolean; search?: string; page?: number; page_size?: number }): Promise<{ count: number; results: Customer[] }> {
    const searchParams = new URLSearchParams();
    if (params?.membership_tier) searchParams.append('membership_tier', params.membership_tier);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

    return this.fetch(`/customers/?${searchParams.toString()}`);
  }

  async getCustomer(id: number): Promise<Customer> {
    return this.fetch(`/customers/${id}/`);
  }

  async createCustomer(data: {
    phone_number: string;
    name: string;
    email?: string;
    date_of_birth?: string;
    gender?: string;
    notes?: string;
  }): Promise<Customer> {
    return this.fetch('/customers/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    return this.fetch(`/customers/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async lookupCustomer(phone: string): Promise<Customer> {
    return this.fetch(`/customers/lookup/?phone=${phone}`);
  }

  async quickRegisterCustomer(data: { phone_number: string; name: string; email?: string }): Promise<Customer> {
    return this.fetch('/customers/quick_register/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getCustomerStats(id: number): Promise<{
    customer: Customer;
    recent_loyalty_transactions: LoyaltyTransaction[];
    recent_feedbacks: CustomerFeedback[];
  }> {
    return this.fetch(`/customers/${id}/stats/`);
  }

  // Loyalty Transaction APIs
  async getLoyaltyTransactions(params?: { customer?: number; transaction_type?: string }): Promise<{ count: number; results: LoyaltyTransaction[] }> {
    const searchParams = new URLSearchParams();
    if (params?.customer) searchParams.append('customer', params.customer.toString());
    if (params?.transaction_type) searchParams.append('transaction_type', params.transaction_type);

    return this.fetch(`/loyalty-transactions/?${searchParams.toString()}`);
  }

  async createLoyaltyTransaction(data: {
    customer: number;
    transaction_type: string;
    points: number;
    description: string;
    order?: number;
    expiry_date?: string;
  }): Promise<LoyaltyTransaction> {
    return this.fetch('/loyalty-transactions/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async redeemReward(customer_id: number, reward_id: number): Promise<LoyaltyTransaction> {
    return this.fetch('/loyalty-transactions/redeem/', {
      method: 'POST',
      body: JSON.stringify({ customer_id, reward_id })
    });
  }

  // Reward APIs
  async getRewards(params?: { reward_type?: string; is_active?: boolean; page?: number; page_size?: number }): Promise<{ count: number; results: Reward[] }> {
    const searchParams = new URLSearchParams();
    if (params?.reward_type) searchParams.append('reward_type', params.reward_type);
    if (params?.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

    return this.fetch(`/rewards/?${searchParams.toString()}`);
  }

  async getReward(id: number): Promise<Reward> {
    return this.fetch(`/rewards/${id}/`);
  }

  async createReward(data: Partial<Reward>): Promise<Reward> {
    return this.fetch('/rewards/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateReward(id: number, data: Partial<Reward>): Promise<Reward> {
    return this.fetch(`/rewards/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async deleteReward(id: number): Promise<void> {
    return this.fetch(`/rewards/${id}/`, {
      method: 'DELETE'
    });
  }

  async getRewardsCatalog(): Promise<Reward[]> {
    return this.fetch('/rewards/catalog/');
  }

  // Feedback APIs
  async getFeedbacks(params?: { status?: string; customer?: number; page?: number; page_size?: number }): Promise<{ count: number; results: CustomerFeedback[] }> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append('status', params.status);
    if (params?.customer) searchParams.append('customer', params.customer.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.page_size) searchParams.append('page_size', params.page_size.toString());

    return this.fetch(`/feedback/?${searchParams.toString()}`);
  }

  async getFeedback(id: number): Promise<CustomerFeedback> {
    return this.fetch(`/feedback/${id}/`);
  }

  async createFeedback(data: {
    customer?: number;
    order?: number;
    food_rating: number;
    service_rating: number;
    ambiance_rating: number;
    value_rating: number;
    comment?: string;
    liked?: string;
    disliked?: string;
    suggestions?: string;
    would_recommend?: boolean;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
  }): Promise<CustomerFeedback> {
    return this.fetch('/feedback/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async respondToFeedback(id: number, response: string): Promise<CustomerFeedback> {
    return this.fetch(`/feedback/${id}/respond/`, {
      method: 'POST',
      body: JSON.stringify({ response })
    });
  }

  async updateFeedback(id: number, data: Partial<CustomerFeedback>): Promise<CustomerFeedback> {
    return this.fetch(`/feedback/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  async getFeedbackStats(): Promise<{
    total_count: number;
    average_ratings: {
      avg_overall: number;
      avg_food: number;
      avg_service: number;
      avg_ambiance: number;
      avg_value: number;
    };
    status_counts: Array<{ status: string; count: number }>;
    response_rate: number;
    rating_distribution: Array<{ overall_rating: number; count: number }>;
  }> {
    return this.fetch('/feedback/stats/');
  }

  // Tier Benefits APIs
  async getTierBenefits(): Promise<MembershipTierBenefit[]> {
    return this.fetch('/tier-benefits/');
  }

  async getTierBenefit(id: number): Promise<MembershipTierBenefit> {
    return this.fetch(`/tier-benefits/${id}/`);
  }

  async createTierBenefit(data: Partial<MembershipTierBenefit>): Promise<MembershipTierBenefit> {
    return this.fetch('/tier-benefits/', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTierBenefit(id: number, data: Partial<MembershipTierBenefit>): Promise<MembershipTierBenefit> {
    return this.fetch(`/tier-benefits/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Settings APIs
  async getCurrentSettings(): Promise<RestaurantSettings> {
    return this.fetch('/settings/current/');
  }

  async updateSettings(id: number, data: Partial<RestaurantSettings>): Promise<RestaurantSettings> {
    return this.fetch(`/settings/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // Restaurant APIs
  async getCurrentRestaurant(): Promise<Restaurant> {
    return this.fetch('/restaurants/current/');
  }

  async updateRestaurant(id: number, data: Partial<Restaurant>): Promise<Restaurant> {
    return this.fetch(`/restaurants/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  // ============================================================================
  // STAFF SESSION METHODS
  // ============================================================================

  async startStaffSession(data?: { shift_type?: string; override_by?: number; override_reason?: string }): Promise<StaffSession> {
    return this.fetch('/staff-sessions/start/', {
      method: 'POST',
      body: JSON.stringify(data || {})
    });
  }

  async endStaffSession(sessionId: number): Promise<StaffSession> {
    return this.fetch(`/staff-sessions/${sessionId}/end/`, {
      method: 'POST'
    });
  }

  async getActiveSession(): Promise<StaffSession> {
    return this.fetch('/staff-sessions/active/');
  }

  async getActiveStaff(role?: string): Promise<ActiveStaff[]> {
    const params = role ? `?role=${role}` : '';
    return this.fetch(`/staff-sessions/active_staff/${params}`);
  }

  async getStaffSessions(params?: { staff?: number; status?: string }): Promise<StaffSession[]> {
    const queryParams = new URLSearchParams();
    if (params?.staff) queryParams.append('staff', params.staff.toString());
    if (params?.status) queryParams.append('status', params.status);

    const queryString = queryParams.toString();
    return this.fetch(`/staff-sessions/${queryString ? `?${queryString}` : ''}`);
  }

  // ============================================================================
  // ORDER ASSIGNMENT METHODS
  // ============================================================================

  async claimOrder(orderId: number): Promise<Order> {
    return this.fetch(`/orders/${orderId}/claim/`, {
      method: 'POST'
    });
  }

  async assignOrder(orderId: number, staffId: number): Promise<Order> {
    return this.fetch(`/orders/${orderId}/assign/`, {
      method: 'POST',
      body: JSON.stringify({ staff_id: staffId })
    });
  }

  async getUnassignedOrders(): Promise<Order[]> {
    return this.fetch('/orders/unassigned/');
  }
}

// Export singleton instance
export const api = new ApiClient();
