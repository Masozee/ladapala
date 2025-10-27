'use client';

import React, { useState, useEffect } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  PackageIcon,
  AlertCircleIcon,
  Search02Icon,
  Add01Icon,
  PencilEdit02Icon,
  EyeIcon,
  MoreHorizontalIcon,
  Alert01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  UserCheckIcon,
  FilterIcon,
  Cancel01Icon
} from '@/lib/icons';

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  maximum_stock: number | null;
  unit_of_measurement: string;
  last_restocked: string | null;
  is_low_stock: boolean;
  stock_status: string;
  unit_price: string;
  supplier: string | null;
}

type SortField = 'name' | 'current_stock' | 'status';
type SortDirection = 'asc' | 'desc';

export default function WarehousePage() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    fetchInventory();
  }, []);

  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(buildApiUrl('hotel/inventory/'), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }

      const data = await response.json();
      setItems(data.results || data);
    } catch (err) {
      console.error('Error fetching inventory:', err);
      setError('Gagal memuat data inventaris');
    } finally {
      setLoading(false);
    }
  };

  const getStockStatusColor = (item: InventoryItem) => {
    if (item.current_stock === 0) {
      return 'bg-red-100 text-red-800';
    } else if (item.is_low_stock) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (item.maximum_stock && item.current_stock >= item.maximum_stock) {
      return 'bg-blue-100 text-blue-800';
    }
    return 'bg-green-100 text-green-800';
  };

  const getStockStatusLabel = (item: InventoryItem) => {
    if (item.current_stock === 0) {
      return 'Habis';
    } else if (item.is_low_stock) {
      return 'Stok Rendah';
    } else if (item.maximum_stock && item.current_stock >= item.maximum_stock) {
      return 'Stok Penuh';
    }
    return 'Normal';
  };

  const getStockStatusIcon = (item: InventoryItem) => {
    if (item.current_stock === 0) {
      return AlertCircleIcon;
    } else if (item.is_low_stock) {
      return Alert01Icon;
    } else if (item.maximum_stock && item.current_stock >= item.maximum_stock) {
      return PackageIcon;
    }
    return UserCheckIcon;
  };

  const getStockPercentage = (item: InventoryItem): number => {
    if (!item.maximum_stock) return 100;
    return (item.current_stock / item.maximum_stock) * 100;
  };

  const getProgressBarColor = (percentage: number): string => {
    if (percentage <= 30) return 'bg-red-500';
    if (percentage <= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getRowHighlight = (item: InventoryItem): string => {
    if (item.current_stock === 0) return 'bg-red-50';
    if (item.is_low_stock) return 'bg-yellow-50';
    return '';
  };

  const formatCurrency = (value: string | number): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  const calculateStockValue = (item: InventoryItem): number => {
    const unitPrice = typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price;
    return item.current_stock * unitPrice;
  };

  const getStatusSeverity = (item: InventoryItem): number => {
    if (item.current_stock === 0) return 3;
    if (item.is_low_stock) return 2;
    if (item.maximum_stock && item.current_stock >= item.maximum_stock) return 1;
    return 0;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? ArrowUp01Icon : ArrowDown01Icon;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                 item.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

    let matchesStatus = true;
    if (statusFilter === 'Normal') {
      matchesStatus = !item.is_low_stock && item.current_stock > 0;
    } else if (statusFilter === 'Low Stock') {
      matchesStatus = item.is_low_stock && item.current_stock > 0;
    } else if (statusFilter === 'Out of Stock') {
      matchesStatus = item.current_stock === 0;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (!sortField) return 0;

    let comparison = 0;
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'current_stock') {
      comparison = a.current_stock - b.current_stock;
    } else if (sortField === 'status') {
      comparison = getStatusSeverity(b) - getStatusSeverity(a);
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const activeFilters = [];
  if (categoryFilter !== 'All') activeFilters.push({ type: 'category', value: categoryFilter });
  if (statusFilter !== 'All') activeFilters.push({ type: 'status', value: statusFilter });

  const removeFilter = (type: string) => {
    if (type === 'category') setCategoryFilter('All');
    if (type === 'status') setStatusFilter('All');
  };

  const lowStockCount = items.filter(item => item.is_low_stock && item.current_stock > 0).length;
  const criticalStockCount = items.filter(item => item.current_stock === 0).length;
  const normalStockCount = items.length - lowStockCount - criticalStockCount;

  return (
    <OfficeLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Warehouse Management</h1>
        <p className="text-gray-600 mt-2">Manajemen stok barang dan inventaris hotel</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-3xl font-bold text-[#4E61D3] mt-2">{items.length}</p>
              </div>
              <PackageIcon className="h-8 w-8 text-[#4E61D3]" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stok Normal</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {normalStockCount}
                </p>
              </div>
              <PackageIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Stok Rendah</p>
                <p className="text-3xl font-bold text-yellow-600 mt-2">{lowStockCount}</p>
              </div>
              <Alert01Icon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Kritis/Habis</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{criticalStockCount}</p>
              </div>
              <AlertCircleIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
      </div>

      {/* Search and Filters Row - Outside table */}
      <div className="mb-4 flex items-center justify-end gap-3">
        {/* Search */}
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search02Icon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari item..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-full"
          />
        </div>

        {/* Category Filter */}
        <div className="relative w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FilterIcon className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-full appearance-none bg-white"
          >
            <option value="All">Kategori</option>
            <option value="Guest Amenities">Guest Amenities</option>
            <option value="Food & Beverage">F&B</option>
            <option value="Cleaning Supplies">Cleaning</option>
            <option value="Room Supplies">Room</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Office Supplies">Office</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative w-40">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FilterIcon className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-full appearance-none bg-white"
          >
            <option value="All">Status</option>
            <option value="Normal">Normal</option>
            <option value="Low Stock">Rendah</option>
            <option value="Out of Stock">Habis</option>
          </select>
        </div>
      </div>

      {/* Active Filters Pills */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Filter Aktif:</span>
          {activeFilters.map((filter, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 bg-[#4E61D3] text-white px-3 py-1 text-sm rounded-full"
            >
              <span>{filter.value}</span>
              <button
                onClick={() => removeFilter(filter.type)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <Cancel01Icon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-gray-200 text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E61D3]"></div>
          <p className="text-gray-600 mt-4">Memuat data inventaris...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Inventory Table */}
      {!loading && !error && (
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#4E61D3] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Daftar Inventaris</h3>
                <p className="text-sm text-gray-100 mt-1">Manajemen stok barang hotel</p>
              </div>
              <button className="bg-white text-[#4E61D3] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                <Add01Icon className="h-4 w-4" />
                <span>Tambah Item</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-[#4E61D3]">
                <tr>
                  <th
                    onClick={() => handleSort('name')}
                    className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#006a6f] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span>Nama Item</span>
                      {sortField === 'name' && getSortIcon('name') && (
                        React.createElement(getSortIcon('name')!, { className: 'h-3 w-3' })
                      )}
                    </div>
                  </th>
                  <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    Kategori
                  </th>
                  <th
                    onClick={() => handleSort('current_stock')}
                    className="border border-gray-300 text-center py-3 px-4 text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#006a6f] transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Stok</span>
                      {sortField === 'current_stock' && getSortIcon('current_stock') && (
                        React.createElement(getSortIcon('current_stock')!, { className: 'h-3 w-3' })
                      )}
                    </div>
                  </th>
                  <th className="border border-gray-300 text-center py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    Min/Max
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="border border-gray-300 text-center py-3 px-4 text-xs font-bold text-white uppercase tracking-wider cursor-pointer hover:bg-[#006a6f] transition-colors"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span>Status</span>
                      {sortField === 'status' && getSortIcon('status') && (
                        React.createElement(getSortIcon('status')!, { className: 'h-3 w-3' })
                      )}
                    </div>
                  </th>
                  <th className="border border-gray-300 text-right py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    Harga
                  </th>
                  <th className="border border-gray-300 text-right py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    Nilai Stok
                  </th>
                  <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                    Terakhir Restock
                  </th>
                  <th className="border border-gray-300 text-center py-3 px-4 text-xs font-bold text-white uppercase tracking-wider w-[70px]">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {sortedItems.map((item) => {
                  const StatusIcon = getStockStatusIcon(item);
                  const stockPercentage = getStockPercentage(item);
                  const progressColor = getProgressBarColor(stockPercentage);
                  const rowHighlight = getRowHighlight(item);

                  return (
                    <tr key={item.id} className={`hover:bg-gray-100 transition-colors ${rowHighlight}`}>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="font-medium text-gray-900 text-sm">{item.name}</div>
                        {item.supplier && (
                          <div className="text-xs text-gray-500 mt-0.5">Supplier: {item.supplier}</div>
                        )}
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <span className="text-sm text-gray-600">{item.category}</span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="space-y-2">
                          <div className="font-semibold text-gray-900 text-sm text-center">
                            {item.current_stock} {item.unit_of_measurement}
                          </div>
                          {/* Progress Bar */}
                          {item.maximum_stock && (
                            <div className="w-full">
                              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full ${progressColor} transition-all duration-300`}
                                  style={{ width: `${Math.min(stockPercentage, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-gray-500 text-center mt-1">
                                {stockPercentage.toFixed(0)}%
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <div className="text-sm text-gray-600">
                          {item.minimum_stock} / {item.maximum_stock || '∞'}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded ${getStockStatusColor(item)}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {getStockStatusLabel(item)}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(item.unit_price)}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-[#4E61D3]">
                          {formatCurrency(calculateStockValue(item))}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <span className="text-sm text-gray-600">
                          {item.last_restocked
                            ? new Date(item.last_restocked).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })
                            : 'Belum pernah'}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="flex items-center justify-center relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === item.id ? null : item.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded border border-gray-300"
                          >
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </button>

                          {openMenuId === item.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 shadow-lg z-10 rounded">
                              <button
                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t last:rounded-b"
                              >
                                <EyeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                Lihat Detail
                              </button>
                              <button
                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <PencilEdit02Icon className="h-4 w-4 mr-2 text-gray-400" />
                                Update Stok
                              </button>
                              <button
                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors last:rounded-b"
                              >
                                <PencilEdit02Icon className="h-4 w-4 mr-2 text-gray-400" />
                                Edit Item
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              </table>
            </div>

          {/* No Results */}
          {sortedItems.length === 0 && (
            <div className="text-center py-12 bg-gray-50">
              <PackageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada item ditemukan</h3>
              <p className="text-gray-600">Coba ubah kata kunci pencarian atau filter Anda.</p>
            </div>
          )}
        </div>
      )}
    </OfficeLayout>
  );
}
