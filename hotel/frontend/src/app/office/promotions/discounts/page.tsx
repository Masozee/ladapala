'use client';

import { useState, useEffect } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import Link from 'next/link';
import { buildApiUrl } from '@/lib/config';
import {
  Add01Icon,
  Search02Icon,
  FilterIcon,
  PencilEdit02Icon,
  EyeIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Alert01Icon,
} from '@/lib/icons';

interface Discount {
  id: number;
  name: string;
  discount_type: string;
  discount_percentage: string | null;
  discount_amount: string | null;
  min_booking_amount: string;
  min_nights: number;
  booking_window_days: number | null;
  priority: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  created_at: string;
}

export default function DiscountsPage() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/discounts/'), {
        credentials: 'include',
      });
      const data = await response.json();
      setDiscounts(data.results || data);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDiscounts = discounts.filter(discount => {
    const matchesSearch =
      discount.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discount.discount_type.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Active' && discount.is_active) ||
      (statusFilter === 'Inactive' && !discount.is_active);

    return matchesSearch && matchesStatus;
  });

  const totalDiscounts = discounts.length;
  const activeDiscounts = discounts.filter(d => d.is_active).length;
  const inactiveDiscounts = discounts.filter(d => !d.is_active).length;

  const getDiscountTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'EARLY_BIRD': 'Early Bird',
      'LAST_MINUTE': 'Last Minute',
      'LONG_STAY': 'Long Stay',
      'SEASONAL': 'Seasonal',
      'MEMBERSHIP': 'Membership',
      'PACKAGE': 'Package Deal',
    };
    return typeMap[type] || type;
  };

  const getDiscountDisplay = (discount: Discount): string => {
    if (discount.discount_percentage) {
      return `${discount.discount_percentage}%`;
    }
    if (discount.discount_amount) {
      return formatCurrency(discount.discount_amount);
    }
    return '-';
  };

  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return 'Rp0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat data...</div>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Automatic Discounts</h1>
            <p className="text-gray-600 mt-1">Kelola diskon otomatis berdasarkan kondisi booking</p>
          </div>
          <Link
            href="/office/promotions/discounts/new"
            className="flex items-center space-x-2 px-4 py-2 bg-[#4E61D3] text-white hover:bg-[#3D4EA8] transition-colors"
          >
            <Add01Icon className="h-4 w-4" />
            <span>Tambah Diskon</span>
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Discounts</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">{totalDiscounts}</div>
              </div>
              <div className="p-3 bg-blue-100">
                <Alert01Icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Active Discounts</div>
                <div className="text-3xl font-bold text-green-600 mt-1">{activeDiscounts}</div>
              </div>
              <div className="p-3 bg-green-100">
                <ArrowUp01Icon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Inactive Discounts</div>
                <div className="text-3xl font-bold text-gray-600 mt-1">{inactiveDiscounts}</div>
              </div>
              <div className="p-3 bg-gray-100">
                <ArrowDown01Icon className="h-6 w-6 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama atau tipe diskon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
            >
              <option value="All">Semua Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Discounts Table */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#4E61D3] to-[#3D4EA8] text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium">Nama</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Tipe</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Diskon</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Min. Booking</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Min. Malam</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Periode</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDiscounts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                      Tidak ada diskon ditemukan
                    </td>
                  </tr>
                ) : (
                  filteredDiscounts.map((discount) => (
                    <tr key={discount.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{discount.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800">
                          {getDiscountTypeLabel(discount.discount_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-lg font-bold text-green-600">
                          {getDiscountDisplay(discount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatCurrency(discount.min_booking_amount)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {discount.min_nights} malam
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div>{formatDate(discount.start_date)}</div>
                        <div className="text-gray-500">s/d {formatDate(discount.end_date)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                          {discount.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium ${
                          discount.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {discount.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <Link
                            href={`/office/promotions/discounts/${discount.id}`}
                            className="p-1 hover:bg-gray-200 transition-colors"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4 text-gray-600" />
                          </Link>
                          <Link
                            href={`/office/promotions/discounts/${discount.id}/edit`}
                            className="p-1 hover:bg-gray-200 transition-colors"
                            title="Edit"
                          >
                            <PencilEdit02Icon className="h-4 w-4 text-gray-600" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary */}
        {filteredDiscounts.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            Menampilkan {filteredDiscounts.length} dari {totalDiscounts} diskon
          </div>
        )}
      </div>
    </OfficeLayout>
  );
}
