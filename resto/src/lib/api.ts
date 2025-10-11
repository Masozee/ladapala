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

class ApiClient {
  private baseUrl: string;
  private branchId: string;

  constructor() {
    this.baseUrl = API_URL;
    this.branchId = BRANCH_ID;
  }

  private async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API Fetch Error:', error);
      throw error;
    }
  }

  // Products
  async getProducts(params?: { category?: number; search?: string; is_available?: boolean }): Promise<{ count: number; results: Product[] }> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.is_available !== undefined) searchParams.set('is_available', params.is_available.toString());

    const query = searchParams.toString();
    return this.fetch(`/products/${query ? `?${query}` : ''}`);
  }

  async getProduct(id: number): Promise<Product> {
    return this.fetch(`/products/${id}/`);
  }

  async getAvailableProducts(): Promise<{ count: number; results: Product[] }> {
    return this.fetch('/products/available/');
  }

  // Categories
  async getCategories(): Promise<{ count: number; results: Category[] }> {
    return this.fetch(`/categories/?restaurant=${this.branchId}`);
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
  async getDashboardSummary(): Promise<DashboardData> {
    return this.fetch(`/dashboard/summary/?branch_id=${this.branchId}`);
  }

  // Payments
  async createPayment(payment: {
    order: number;
    amount: string;
    payment_method: 'CASH' | 'CARD' | 'MOBILE' | 'OTHER';
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  }): Promise<any> {
    return this.fetch('/payments/', {
      method: 'POST',
      body: JSON.stringify(payment),
    });
  }
}

// Export singleton instance
export const api = new ApiClient();
