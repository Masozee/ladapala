'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  PackageIcon,
  Search02Icon,
  Add01Icon,
  EyeIcon,
  FilterIcon,
  Cancel01Icon,
  File01Icon,
  UserCheckIcon,
  AlertCircleIcon,
} from '@/lib/icons';

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: number;
  supplier_name: string;
  order_date: string;
  expected_delivery: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'CANCELLED';
  status_display: string;
  total_amount: string;
  items_count: number;
  created_by_name: string | null;
  received_by_name: string | null;
  received_date: string | null;
  created_at: string;
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('hotel/purchase-orders/'), {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch purchase orders');

      const data = await response.json();
      setPurchaseOrders(data.results || data);
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'RECEIVED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return File01Icon;
      case 'SUBMITTED':
        return PackageIcon;
      case 'RECEIVED':
        return UserCheckIcon;
      case 'CANCELLED':
        return AlertCircleIcon;
      default:
        return PackageIcon;
    }
  };

  const formatCurrency = (value: string) => {
    const numValue = parseFloat(value);
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const filteredOrders = purchaseOrders.filter((po) => {
    const matchesSearch =
      po.po_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      po.supplier_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || po.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    all: purchaseOrders.length,
    draft: purchaseOrders.filter((po) => po.status === 'DRAFT').length,
    submitted: purchaseOrders.filter((po) => po.status === 'SUBMITTED').length,
    received: purchaseOrders.filter((po) => po.status === 'RECEIVED').length,
    cancelled: purchaseOrders.filter((po) => po.status === 'CANCELLED').length,
  };

  return (
    <OfficeLayout>
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-gray-600">
        <a href="/office/warehouse" className="hover:text-[#4E61D3]">Warehouse</a>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Purchase Orders</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600 mt-2">Kelola pesanan pembelian barang</p>
          </div>
          <button
            onClick={() => router.push('/office/warehouse/purchase-orders/new')}
            className="bg-[#4E61D3] text-white px-6 py-3 font-medium hover:bg-[#3d4fa8] transition-colors flex items-center space-x-2"
          >
            <Add01Icon className="h-5 w-5" />
            <span>Buat PO Baru</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total PO</p>
          <p className="text-2xl font-bold text-[#4E61D3] mt-1">{statusCounts.all}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Draft</p>
          <p className="text-2xl font-bold text-gray-600 mt-1">{statusCounts.draft}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Submitted</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{statusCounts.submitted}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Received</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{statusCounts.received}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Cancelled</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{statusCounts.cancelled}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex items-center justify-end gap-3">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search02Icon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari PO atau supplier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] w-full"
          />
        </div>

        <div className="relative w-40">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FilterIcon className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] w-full appearance-none bg-white"
          >
            <option value="All">Semua Status</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="RECEIVED">Received</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Purchase Orders Table */}
      {loading ? (
        <div className="bg-white border border-gray-200 text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E61D3]"></div>
          <p className="text-gray-600 mt-4">Memuat purchase orders...</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200">
          <div className="p-4 bg-[#4E61D3] text-white">
            <h3 className="text-lg font-bold">Daftar Purchase Orders</h3>
          </div>

          <div className="overflow-visible">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    PO Number
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Supplier
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                    Tanggal Order
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                    Items
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                    Total
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                    Status
                  </th>
                  <th className="border border-gray-200 px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="border border-gray-200 px-4 py-12 text-center">
                      <PackageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Tidak ada purchase order ditemukan</p>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((po) => {
                    const StatusIcon = getStatusIcon(po.status);
                    return (
                      <tr key={po.id} className="hover:bg-gray-50">
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="font-medium text-gray-900">{po.po_number}</div>
                          <div className="text-xs text-gray-500">
                            Dibuat: {formatDate(po.created_at)}
                          </div>
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <div className="font-medium text-gray-900">{po.supplier_name}</div>
                          {po.created_by_name && (
                            <div className="text-xs text-gray-500">oleh {po.created_by_name}</div>
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-3">
                          <div>{formatDate(po.order_date)}</div>
                          {po.expected_delivery && (
                            <div className="text-xs text-gray-500">
                              Est: {formatDate(po.expected_delivery)}
                            </div>
                          )}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span className="font-semibold">{po.items_count}</span> item
                          {po.items_count !== 1 ? 's' : ''}
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-right">
                          <span className="font-semibold text-[#4E61D3]">
                            {formatCurrency(po.total_amount)}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded ${getStatusColor(
                              po.status
                            )}`}
                          >
                            <StatusIcon className="h-3.5 w-3.5" />
                            {po.status_display}
                          </span>
                        </td>
                        <td className="border border-gray-200 px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              router.push(`/office/warehouse/purchase-orders/${po.id}`)
                            }
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-[#4E61D3] text-white hover:bg-[#3d4fa8] transition-colors"
                          >
                            <EyeIcon className="h-4 w-4" />
                            Detail
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </OfficeLayout>
  );
}
