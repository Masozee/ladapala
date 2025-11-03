'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  Add01Icon,
  Search02Icon,
  FilterIcon,
  Calendar01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Loading03Icon,
  EyeIcon,
} from '@/lib/icons';

interface StockOpname {
  id: number;
  opname_number: string;
  opname_date: string;
  status: string;
  status_display: string;
  location: string;
  total_items_counted: number;
  total_discrepancies: number;
  total_discrepancy_value: number;
  created_by_name: string;
  completed_by_name: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function StockOpnamePage() {
  const router = useRouter();
  const [opnames, setOpnames] = useState<StockOpname[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchOpnames();
  }, [statusFilter, dateFrom, dateTo]);

  const fetchOpnames = async () => {
    setLoading(true);
    try {
      let url = buildApiUrl('hotel/stock-opnames/');
      const params = new URLSearchParams();

      if (statusFilter !== 'ALL') {
        params.append('status', statusFilter);
      }
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOpnames(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching opnames:', error);
      alert('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const filteredOpnames = opnames.filter(opname => {
    const matchesSearch = opname.opname_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         opname.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const statuses = [
    { value: 'ALL', label: 'Semua Status', count: opnames.length },
    { value: 'DRAFT', label: 'Draft', count: opnames.filter(o => o.status === 'DRAFT').length },
    { value: 'IN_PROGRESS', label: 'Berlangsung', count: opnames.filter(o => o.status === 'IN_PROGRESS').length },
    { value: 'COMPLETED', label: 'Selesai', count: opnames.filter(o => o.status === 'COMPLETED').length },
    { value: 'CANCELLED', label: 'Dibatalkan', count: opnames.filter(o => o.status === 'CANCELLED').length },
  ];

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock Opname</h1>
            <p className="text-gray-600 mt-1">Perhitungan Fisik Persediaan Barang</p>
          </div>
          <button
            onClick={() => router.push('/office/warehouse/stock-opname/create')}
            className="inline-flex items-center px-4 py-2 bg-[#4E61D3] text-white rounded hover:bg-[#3D4EA8] transition space-x-2"
          >
            <Add01Icon className="h-5 w-5" />
            <span>Buat Stock Opname Baru</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{opnames.length}</div>
                <div className="text-sm text-gray-600">Total Opname</div>
              </div>
              <div className="p-3 bg-blue-100 rounded">
                <Calendar01Icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {opnames.filter(o => o.status === 'IN_PROGRESS').length}
                </div>
                <div className="text-sm text-gray-600">Sedang Berlangsung</div>
              </div>
              <div className="p-3 bg-yellow-100 rounded">
                <Loading03Icon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {opnames.filter(o => o.status === 'COMPLETED').length}
                </div>
                <div className="text-sm text-gray-600">Selesai</div>
              </div>
              <div className="p-3 bg-green-100 rounded">
                <CheckmarkCircle02Icon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {opnames.reduce((sum, o) => sum + o.total_discrepancies, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Selisih</div>
              </div>
              <div className="p-3 bg-red-100 rounded">
                <Cancel01Icon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nomor opname atau lokasi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
              />
            </div>

            {/* Date From */}
            <div className="w-full md:w-48">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-3 py-2 w-full text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
              />
            </div>

            {/* Date To */}
            <div className="w-full md:w-48">
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-3 py-2 w-full text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="mt-4 flex flex-wrap gap-2">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`px-4 py-2 rounded text-sm font-medium transition ${
                  statusFilter === status.value
                    ? 'bg-[#4E61D3] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.label} ({status.count})
              </button>
            ))}
          </div>
        </div>

        {/* Opname List Table */}
        <div className="bg-white border border-gray-200 rounded">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Memuat data...</div>
            </div>
          ) : filteredOpnames.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Calendar01Icon className="h-12 w-12 text-gray-400 mb-4" />
              <div className="text-gray-500">Belum ada stock opname</div>
              <button
                onClick={() => router.push('/office/warehouse/stock-opname/create')}
                className="mt-4 text-[#4E61D3] hover:underline"
              >
                Buat stock opname pertama
              </button>
            </div>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#4E61D3] text-white">
                  <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">
                    No. Opname
                  </th>
                  <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">
                    Tanggal
                  </th>
                  <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">
                    Lokasi
                  </th>
                  <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">
                    Status
                  </th>
                  <th className="border border-gray-200 px-6 py-4 text-center text-sm font-medium">
                    Item Dihitung
                  </th>
                  <th className="border border-gray-200 px-6 py-4 text-center text-sm font-medium">
                    Selisih
                  </th>
                  <th className="border border-gray-200 px-6 py-4 text-right text-sm font-medium">
                    Nilai Selisih
                  </th>
                  <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">
                    Dibuat Oleh
                  </th>
                  <th className="border border-gray-200 px-6 py-4 text-center text-sm font-medium">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOpnames.map((opname) => (
                  <tr key={opname.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-6 py-4">
                      <div className="font-medium text-gray-900">{opname.opname_number}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(opname.created_at)}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-6 py-4">
                      {formatDate(opname.opname_date)}
                    </td>
                    <td className="border border-gray-200 px-6 py-4">
                      {opname.location}
                    </td>
                    <td className="border border-gray-200 px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(opname.status)}`}>
                        {opname.status_display}
                      </span>
                    </td>
                    <td className="border border-gray-200 px-6 py-4 text-center">
                      {opname.total_items_counted}
                    </td>
                    <td className="border border-gray-200 px-6 py-4 text-center">
                      {opname.total_discrepancies > 0 ? (
                        <span className="text-red-600 font-medium">{opname.total_discrepancies}</span>
                      ) : (
                        <span className="text-green-600">0</span>
                      )}
                    </td>
                    <td className="border border-gray-200 px-6 py-4 text-right">
                      {opname.total_discrepancy_value > 0 ? (
                        <span className="text-red-600 font-medium">
                          {formatCurrency(opname.total_discrepancy_value)}
                        </span>
                      ) : (
                        <span className="text-green-600">Rp 0</span>
                      )}
                    </td>
                    <td className="border border-gray-200 px-6 py-4">
                      <div className="text-sm">{opname.created_by_name}</div>
                      {opname.completed_by_name && (
                        <div className="text-xs text-gray-500">
                          Selesai: {opname.completed_by_name}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-200 px-6 py-4 text-center">
                      <button
                        onClick={() => router.push(`/office/warehouse/stock-opname/${opname.id}`)}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition space-x-1"
                      >
                        <EyeIcon className="h-4 w-4" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </OfficeLayout>
  );
}
