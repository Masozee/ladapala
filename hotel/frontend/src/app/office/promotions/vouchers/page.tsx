'use client';

import { useState, useEffect } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import Link from 'next/link';
import { buildApiUrl } from '@/lib/config';
import {
  SparklesIcon,
  Add01Icon,
  Search02Icon,
  EyeIcon,
  PencilEdit02Icon,
  FilterIcon,
} from '@/lib/icons';

interface Voucher {
  id: number;
  code: string;
  name: string;
  voucher_type: string;
  discount_display: string;
  usage_count: number;
  usage_limit: number | null;
  usage_remaining: number | string;
  valid_from: string;
  valid_until: string;
  status: string;
  is_public: boolean;
}

interface Statistics {
  total_vouchers: number;
  active_vouchers: number;
  expired_vouchers: number;
  used_up_vouchers: number;
  total_usage: number;
}

export default function VouchersPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/vouchers/'), {
        credentials: 'include',
      });
      const data = await response.json();
      setVouchers(data.results || []);
      setStatistics(data.statistics || null);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'USED_UP': return 'bg-gray-100 text-gray-800';
      case 'INACTIVE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Aktif';
      case 'EXPIRED': return 'Kadaluarsa';
      case 'USED_UP': return 'Habis';
      case 'INACTIVE': return 'Tidak Aktif';
      default: return status;
    }
  };

  const filteredVouchers = vouchers.filter((voucher) => {
    const matchesSearch =
      voucher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voucher.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || voucher.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vouchers</h1>
            <p className="text-gray-600 mt-2">Kelola kode voucher dan promosi</p>
          </div>
          <Link
            href="/office/promotions/vouchers/new"
            className="flex items-center space-x-2 px-4 py-2 bg-[#4E61D3] text-white hover:bg-[#3D4EA8] transition-colors"
          >
            <Add01Icon className="h-4 w-4" />
            <span>Buat Voucher</span>
          </Link>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
            <div className="bg-white border border-gray-200 p-6">
              <div className="text-sm text-gray-600">Total Voucher</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">{statistics.total_vouchers}</div>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <div className="text-sm text-gray-600">Aktif</div>
              <div className="text-3xl font-bold text-green-600 mt-1">{statistics.active_vouchers}</div>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <div className="text-sm text-gray-600">Kadaluarsa</div>
              <div className="text-3xl font-bold text-red-600 mt-1">{statistics.expired_vouchers}</div>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <div className="text-sm text-gray-600">Habis Dipakai</div>
              <div className="text-3xl font-bold text-gray-600 mt-1">{statistics.used_up_vouchers}</div>
            </div>
            <div className="bg-white border border-gray-200 p-6">
              <div className="text-sm text-gray-600">Total Penggunaan</div>
              <div className="text-3xl font-bold text-blue-600 mt-1">{statistics.total_usage}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
              >
                <option value="all">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="INACTIVE">Tidak Aktif</option>
                <option value="EXPIRED">Kadaluarsa</option>
                <option value="USED_UP">Habis</option>
              </select>
            </div>
            <div className="relative w-80">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari kode atau nama voucher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="text-sm text-gray-600 mb-3">
          Menampilkan {filteredVouchers.length} dari {vouchers.length} voucher
        </div>

        {/* Vouchers Table */}
        <div className="bg-white border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#4E61D3] to-[#3D4EA8] text-white">
                <th className="px-6 py-4 text-left text-sm font-medium">Kode</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Nama</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Tipe</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Diskon</th>
                <th className="px-6 py-4 text-center text-sm font-medium">Penggunaan</th>
                <th className="px-6 py-4 text-center text-sm font-medium">Sisa</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Berlaku</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.map((voucher, index) => (
                <tr
                  key={voucher.id}
                  className={`border-b border-gray-200 hover:bg-gray-50 ${
                    index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{voucher.code}</div>
                    {!voucher.is_public && (
                      <span className="text-xs text-gray-500">Private</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{voucher.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600">
                      {voucher.voucher_type === 'PERCENTAGE' && 'Persentase'}
                      {voucher.voucher_type === 'FIXED_AMOUNT' && 'Fixed Amount'}
                      {voucher.voucher_type === 'FREE_NIGHT' && 'Free Night'}
                      {voucher.voucher_type === 'UPGRADE' && 'Upgrade'}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{voucher.discount_display}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm text-gray-900">
                      {voucher.usage_count} / {voucher.usage_limit || '∞'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {voucher.usage_remaining}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600">
                      {new Date(voucher.valid_from).toLocaleDateString('id-ID')} -<br />
                      {new Date(voucher.valid_until).toLocaleDateString('id-ID')}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(voucher.status)}`}>
                      {getStatusLabel(voucher.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/office/promotions/vouchers/${voucher.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/office/promotions/vouchers/${voucher.id}/edit`}
                        className="p-2 text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        <PencilEdit02Icon className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVouchers.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              Tidak ada voucher yang ditemukan
            </div>
          )}
        </div>
      </div>
    </OfficeLayout>
  );
}
