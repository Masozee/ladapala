/**
 * Unified Warehouse API Service
 * Provides functions to interact with the warehouse API endpoints
 */

import { buildApiUrl } from './config';

// ============== Types ==============

export interface WarehouseCategory {
  id: number;
  name: string;
  description?: string;
  for_hotel: boolean;
  for_restaurant: boolean;
  parent_category: number | null;
  parent_name?: string;
  is_active: boolean;
  item_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_terms?: string;
  rating?: number;
  is_active: boolean;
  notes?: string;
  total_purchase_orders?: number;
  created_at: string;
  updated_at: string;
}

export interface WarehouseItem {
  id: number;
  code: string;
  name: string;
  description?: string;
  category: number;
  category_name?: string;
  item_type: string;
  unit: string;
  quantity: number;
  min_quantity: number;
  max_quantity: number | null;
  reorder_point: number;
  cost_per_unit: number;
  supplier: number | null;
  supplier_name?: string;
  storage_location?: string;
  expiry_date?: string;
  is_active: boolean;
  stock_status?: string;
  stock_value?: number;
  is_low_stock?: boolean;
  needs_reorder?: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentBuffer {
  id: number;
  item: number;
  item_code?: string;
  item_name?: string;
  unit?: string;
  department: string;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  location?: string;
  last_restocked?: string;
  notes?: string;
  buffer_status?: 'LOW' | 'NORMAL' | 'FULL';
  created_at: string;
  updated_at: string;
}

export interface StockTransfer {
  id: number;
  transfer_number: string;
  transfer_type: string;
  transfer_type_display?: string;
  from_warehouse: boolean;
  from_department?: string;
  from_department_display?: string;
  to_department: string;
  to_department_display?: string;
  warehouse_item: number;
  item_code?: string;
  item_name?: string;
  unit?: string;
  quantity: number;
  status: string;
  status_display?: string;
  requested_by?: number;
  requested_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  completed_by?: number;
  completed_by_name?: string;
  request_date: string;
  approved_date?: string;
  completed_date?: string;
  reason?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  warehouse_item: number;
  item_code?: string;
  item_name?: string;
  unit?: string;
  quantity: number;
  received_quantity: number;
  unit_price: number;
  total_price: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: number;
  supplier_name?: string;
  order_date: string;
  expected_delivery?: string;
  actual_delivery?: string;
  status: string;
  status_display?: string;
  payment_terms?: string;
  created_by?: number;
  created_by_name?: string;
  approved_by?: number;
  approved_by_name?: string;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  notes?: string;
  items?: PurchaseOrderItem[];
  created_at: string;
  updated_at: string;
}

export interface StockAdjustment {
  id: number;
  adjustment_number: string;
  warehouse_item: number;
  item_code?: string;
  item_name?: string;
  department_buffer?: number | null;
  adjustment_type: string;
  adjustment_type_display?: string;
  quantity: number;
  reason: string;
  adjusted_by?: number;
  adjusted_by_name?: string;
  adjustment_date: string;
  created_at: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface StockSummary {
  total_items: number;
  total_value: number;
  low_stock_count: number;
  reorder_count: number;
}

// ============== API Functions ==============

const getHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Get CSRF token from cookie
  if (typeof document !== 'undefined') {
    const csrfToken = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];

    if (csrfToken) {
      headers['X-CSRFToken'] = csrfToken;
    }
  }

  return headers;
};

// ========== Categories ==========

export const warehouseApi = {
  // Categories
  categories: {
    list: async (params?: Record<string, string>): Promise<WarehouseCategory[]> => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await fetch(buildApiUrl(`warehouse/categories/${query}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },

    get: async (id: number): Promise<WarehouseCategory> => {
      const response = await fetch(buildApiUrl(`warehouse/categories/${id}/`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch category');
      return response.json();
    },

    create: async (data: Partial<WarehouseCategory>): Promise<WarehouseCategory> => {
      const response = await fetch(buildApiUrl('warehouse/categories/'), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create category');
      return response.json();
    },

    update: async (id: number, data: Partial<WarehouseCategory>): Promise<WarehouseCategory> => {
      const response = await fetch(buildApiUrl(`warehouse/categories/${id}/`), {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update category');
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(buildApiUrl(`warehouse/categories/${id}/`), {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete category');
    },

    hotelCategories: async (): Promise<WarehouseCategory[]> => {
      const response = await fetch(buildApiUrl('warehouse/categories/hotel_categories/'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch hotel categories');
      return response.json();
    },

    restaurantCategories: async (): Promise<WarehouseCategory[]> => {
      const response = await fetch(buildApiUrl('warehouse/categories/restaurant_categories/'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch restaurant categories');
      return response.json();
    },
  },

  // Suppliers
  suppliers: {
    list: async (params?: Record<string, string>): Promise<Supplier[]> => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await fetch(buildApiUrl(`warehouse/suppliers/${query}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch suppliers');
      return response.json();
    },

    get: async (id: number): Promise<Supplier> => {
      const response = await fetch(buildApiUrl(`warehouse/suppliers/${id}/`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch supplier');
      return response.json();
    },

    create: async (data: Partial<Supplier>): Promise<Supplier> => {
      const response = await fetch(buildApiUrl('warehouse/suppliers/'), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create supplier');
      return response.json();
    },

    update: async (id: number, data: Partial<Supplier>): Promise<Supplier> => {
      const response = await fetch(buildApiUrl(`warehouse/suppliers/${id}/`), {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update supplier');
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(buildApiUrl(`warehouse/suppliers/${id}/`), {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete supplier');
    },

    active: async (): Promise<Supplier[]> => {
      const response = await fetch(buildApiUrl('warehouse/suppliers/active/'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch active suppliers');
      return response.json();
    },
  },

  // Warehouse Items
  items: {
    list: async (params?: Record<string, string>): Promise<PaginatedResponse<WarehouseItem>> => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await fetch(buildApiUrl(`warehouse/items/${query}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch items');
      return response.json();
    },

    get: async (id: number): Promise<WarehouseItem> => {
      const response = await fetch(buildApiUrl(`warehouse/items/${id}/`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch item');
      return response.json();
    },

    create: async (data: Partial<WarehouseItem>): Promise<WarehouseItem> => {
      const response = await fetch(buildApiUrl('warehouse/items/'), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create item');
      return response.json();
    },

    update: async (id: number, data: Partial<WarehouseItem>): Promise<WarehouseItem> => {
      const response = await fetch(buildApiUrl(`warehouse/items/${id}/`), {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update item');
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(buildApiUrl(`warehouse/items/${id}/`), {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete item');
    },

    lowStock: async (): Promise<WarehouseItem[]> => {
      const response = await fetch(buildApiUrl('warehouse/items/low_stock/'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch low stock items');
      const data = await response.json();
      return data.results || data;
    },

    needsReorder: async (): Promise<WarehouseItem[]> => {
      const response = await fetch(buildApiUrl('warehouse/items/needs_reorder/'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch items needing reorder');
      const data = await response.json();
      return data.results || data;
    },

    expiringSoon: async (): Promise<WarehouseItem[]> => {
      const response = await fetch(buildApiUrl('warehouse/items/expiring_soon/'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch expiring items');
      const data = await response.json();
      return data.results || data;
    },

    stockSummary: async (): Promise<StockSummary> => {
      const response = await fetch(buildApiUrl('warehouse/items/stock_summary/'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch stock summary');
      return response.json();
    },
  },

  // Department Buffers
  buffers: {
    list: async (params?: Record<string, string>): Promise<PaginatedResponse<DepartmentBuffer>> => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await fetch(buildApiUrl(`warehouse/buffers/${query}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch buffers');
      return response.json();
    },

    get: async (id: number): Promise<DepartmentBuffer> => {
      const response = await fetch(buildApiUrl(`warehouse/buffers/${id}/`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch buffer');
      return response.json();
    },

    create: async (data: Partial<DepartmentBuffer>): Promise<DepartmentBuffer> => {
      const response = await fetch(buildApiUrl('warehouse/buffers/'), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create buffer');
      return response.json();
    },

    update: async (id: number, data: Partial<DepartmentBuffer>): Promise<DepartmentBuffer> => {
      const response = await fetch(buildApiUrl(`warehouse/buffers/${id}/`), {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update buffer');
      return response.json();
    },

    delete: async (id: number): Promise<void> => {
      const response = await fetch(buildApiUrl(`warehouse/buffers/${id}/`), {
        method: 'DELETE',
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to delete buffer');
    },

    byDepartment: async (department: string): Promise<DepartmentBuffer[]> => {
      const response = await fetch(buildApiUrl(`warehouse/buffers/by_department/?dept=${department}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch department buffers');
      const data = await response.json();
      return data.results || data;
    },

    lowStock: async (): Promise<DepartmentBuffer[]> => {
      const response = await fetch(buildApiUrl('warehouse/buffers/low_stock_buffers/'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch low stock buffers');
      const data = await response.json();
      return data.results || data;
    },

    hotelBuffers: async (): Promise<DepartmentBuffer[]> => {
      const response = await fetch(buildApiUrl('warehouse/buffers/hotel_buffers/'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch hotel buffers');
      const data = await response.json();
      return data.results || data;
    },

    restaurantBuffers: async (): Promise<DepartmentBuffer[]> => {
      const response = await fetch(buildApiUrl('warehouse/buffers/restaurant_buffers/'), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch restaurant buffers');
      const data = await response.json();
      return data.results || data;
    },
  },

  // Stock Transfers
  transfers: {
    list: async (params?: Record<string, string>): Promise<PaginatedResponse<StockTransfer>> => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await fetch(buildApiUrl(`warehouse/transfers/${query}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch transfers');
      return response.json();
    },

    get: async (id: number): Promise<StockTransfer> => {
      const response = await fetch(buildApiUrl(`warehouse/transfers/${id}/`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch transfer');
      return response.json();
    },

    create: async (data: Partial<StockTransfer>): Promise<StockTransfer> => {
      const response = await fetch(buildApiUrl('warehouse/transfers/'), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create transfer');
      return response.json();
    },

    approve: async (id: number): Promise<StockTransfer> => {
      const response = await fetch(buildApiUrl(`warehouse/transfers/${id}/approve/`), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to approve transfer');
      return response.json();
    },

    complete: async (id: number): Promise<StockTransfer> => {
      const response = await fetch(buildApiUrl(`warehouse/transfers/${id}/complete/`), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to complete transfer');
      return response.json();
    },

    cancel: async (id: number): Promise<StockTransfer> => {
      const response = await fetch(buildApiUrl(`warehouse/transfers/${id}/cancel/`), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to cancel transfer');
      return response.json();
    },
  },

  // Purchase Orders
  purchaseOrders: {
    list: async (params?: Record<string, string>): Promise<PaginatedResponse<PurchaseOrder>> => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await fetch(buildApiUrl(`warehouse/purchase-orders/${query}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch purchase orders');
      return response.json();
    },

    get: async (id: number): Promise<PurchaseOrder> => {
      const response = await fetch(buildApiUrl(`warehouse/purchase-orders/${id}/`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch purchase order');
      return response.json();
    },

    create: async (data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
      const response = await fetch(buildApiUrl('warehouse/purchase-orders/'), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create purchase order');
      return response.json();
    },

    update: async (id: number, data: Partial<PurchaseOrder>): Promise<PurchaseOrder> => {
      const response = await fetch(buildApiUrl(`warehouse/purchase-orders/${id}/`), {
        method: 'PATCH',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update purchase order');
      return response.json();
    },

    submit: async (id: number): Promise<PurchaseOrder> => {
      const response = await fetch(buildApiUrl(`warehouse/purchase-orders/${id}/submit/`), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to submit purchase order');
      return response.json();
    },

    approve: async (id: number): Promise<PurchaseOrder> => {
      const response = await fetch(buildApiUrl(`warehouse/purchase-orders/${id}/approve/`), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to approve purchase order');
      return response.json();
    },

    order: async (id: number): Promise<PurchaseOrder> => {
      const response = await fetch(buildApiUrl(`warehouse/purchase-orders/${id}/order/`), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to mark purchase order as ordered');
      return response.json();
    },

    receive: async (id: number): Promise<PurchaseOrder> => {
      const response = await fetch(buildApiUrl(`warehouse/purchase-orders/${id}/receive/`), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to receive purchase order');
      return response.json();
    },
  },

  // Stock Adjustments
  adjustments: {
    list: async (params?: Record<string, string>): Promise<PaginatedResponse<StockAdjustment>> => {
      const query = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await fetch(buildApiUrl(`warehouse/adjustments/${query}`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch adjustments');
      return response.json();
    },

    get: async (id: number): Promise<StockAdjustment> => {
      const response = await fetch(buildApiUrl(`warehouse/adjustments/${id}/`), {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch adjustment');
      return response.json();
    },

    create: async (data: Partial<StockAdjustment>): Promise<StockAdjustment> => {
      const response = await fetch(buildApiUrl('warehouse/adjustments/'), {
        method: 'POST',
        headers: getHeaders(),
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create adjustment');
      return response.json();
    },
  },
};

export default warehouseApi;
