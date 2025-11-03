'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  ChevronLeftIcon,
  PlayIcon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  Search02Icon,
  AlertCircleIcon,
} from '@/lib/icons';

interface StockOpnameItem {
  id: number;
  inventory_item: number;
  inventory_item_name: string;
  inventory_item_category: string;
  unit_of_measurement: string;
  unit_price: string;
  system_stock: number;
  counted_stock: number | null;
  difference: number;
  reason: string;
  has_discrepancy: boolean;
  discrepancy_value: string;
  discrepancy_percentage: number;
}

interface StockOpname {
  id: number;
  opname_number: string;
  opname_date: string;
  status: string;
  status_display: string;
  location: string;
  notes: string;
  total_items_counted: number;
  total_discrepancies: number;
  total_discrepancy_value: number;
  created_by_name: string;
  completed_by_name: string | null;
  items: StockOpnameItem[];
}

export default function StockOpnameDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [opname, setOpname] = useState<StockOpname | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDiscrepancy, setFilterDiscrepancy] = useState('ALL');
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editValues, setEditValues] = useState<{ counted_stock: string; reason: string }>({
    counted_stock: '',
    reason: '',
  });

  useEffect(() => {
    if (id) {
      fetchOpname();
    }
  }, [id]);

  const fetchOpname = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`hotel/stock-opnames/${id}/`), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setOpname(data);
      } else {
        alert('Gagal memuat data opname');
        router.push('/office/warehouse/stock-opname');
      }
    } catch (error) {
      console.error('Error fetching opname:', error);
      alert('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleStartCounting = async () => {
    if (!opname || !confirm('Mulai perhitungan stock opname?')) return;

    try {
      const response = await fetch(buildApiUrl(`hotel/stock-opnames/${opname.id}/start/`), {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrfToken() || '',
        },
        credentials: 'include',
      });

      if (response.ok) {
        alert('Perhitungan dimulai!');
        fetchOpname();
      } else {
        const error = await response.json();
        alert('Gagal memulai: ' + (error.error || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Error starting opname:', error);
      alert('Terjadi kesalahan');
    }
  };

  const handleCompleteOpname = async () => {
    if (!opname) return;

    const uncounted = opname.items.filter(item => item.counted_stock === null).length;
    if (uncounted > 0) {
      if (!confirm(`Masih ada ${uncounted} item yang belum dihitung. Lanjutkan menyelesaikan opname?`)) {
        return;
      }
    }

    if (!confirm('Selesaikan stock opname dan terapkan penyesuaian stok?')) return;

    try {
      const response = await fetch(buildApiUrl(`hotel/stock-opnames/${opname.id}/complete/`), {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrfToken() || '',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Stock opname selesai! ${data.adjustments_made?.length || 0} penyesuaian diterapkan.`);
        fetchOpname();
      } else {
        const error = await response.json();
        alert('Gagal menyelesaikan: ' + (error.error || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Error completing opname:', error);
      alert('Terjadi kesalahan');
    }
  };

  const handleCancelOpname = async () => {
    if (!opname || !confirm('Batalkan stock opname ini?')) return;

    try {
      const response = await fetch(buildApiUrl(`hotel/stock-opnames/${opname.id}/cancel/`), {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrfToken() || '',
        },
        credentials: 'include',
      });

      if (response.ok) {
        alert('Stock opname dibatalkan');
        fetchOpname();
      } else {
        const error = await response.json();
        alert('Gagal membatalkan: ' + (error.error || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Error cancelling opname:', error);
      alert('Terjadi kesalahan');
    }
  };

  const handleEditItem = (item: StockOpnameItem) => {
    setEditingItemId(item.id);
    setEditValues({
      counted_stock: item.counted_stock?.toString() || '',
      reason: item.reason || '',
    });
  };

  const handleSaveCount = async (itemId: number) => {
    try {
      const response = await fetch(buildApiUrl(`hotel/stock-opname-items/${itemId}/`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          counted_stock: editValues.counted_stock ? parseInt(editValues.counted_stock) : null,
          reason: editValues.reason,
        }),
      });

      if (response.ok) {
        setEditingItemId(null);
        fetchOpname();
      } else {
        const error = await response.json();
        alert('Gagal menyimpan: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error saving count:', error);
      alert('Terjadi kesalahan saat menyimpan');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading || !opname) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat data...</div>
        </div>
      </OfficeLayout>
    );
  }

  const filteredItems = opname.items.filter(item => {
    const matchesSearch = item.inventory_item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.inventory_item_category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterDiscrepancy === 'ALL' ||
                         (filterDiscrepancy === 'DISCREPANCY' && item.has_discrepancy) ||
                         (filterDiscrepancy === 'NO_DISCREPANCY' && !item.has_discrepancy) ||
                         (filterDiscrepancy === 'UNCOUNTED' && item.counted_stock === null);
    return matchesSearch && matchesFilter;
  });

  const uncountedCount = opname.items.filter(item => item.counted_stock === null).length;
  const discrepancyCount = opname.items.filter(item => item.has_discrepancy).length;

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/office/warehouse/stock-opname')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{opname.opname_number}</h1>
              <p className="text-gray-600 mt-1">{opname.location} - {formatDate(opname.opname_date)}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded ${getStatusColor(opname.status)}`}>
              {opname.status_display}
            </span>

            {opname.status === 'DRAFT' && (
              <button
                onClick={handleStartCounting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition space-x-2"
              >
                <PlayIcon className="h-5 w-5" />
                <span>Mulai Perhitungan</span>
              </button>
            )}

            {(opname.status === 'DRAFT' || opname.status === 'IN_PROGRESS') && (
              <>
                <button
                  onClick={handleCompleteOpname}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition space-x-2"
                >
                  <CheckmarkCircle02Icon className="h-5 w-5" />
                  <span>Selesaikan</span>
                </button>
                <button
                  onClick={handleCancelOpname}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition space-x-2"
                >
                  <Cancel01Icon className="h-5 w-5" />
                  <span>Batalkan</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="text-2xl font-bold text-gray-900">{opname.items.length}</div>
            <div className="text-sm text-gray-600">Total Item</div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="text-2xl font-bold text-blue-600">{opname.total_items_counted}</div>
            <div className="text-sm text-gray-600">Sudah Dihitung</div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="text-2xl font-bold text-yellow-600">{uncountedCount}</div>
            <div className="text-sm text-gray-600">Belum Dihitung</div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <div className={`text-2xl font-bold ${discrepancyCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {discrepancyCount}
            </div>
            <div className="text-sm text-gray-600">Selisih</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative w-full md:w-80">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3]"
              />
            </div>

            <select
              value={filterDiscrepancy}
              onChange={(e) => setFilterDiscrepancy(e.target.value)}
              className="px-3 py-2 w-full md:w-64 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3]"
            >
              <option value="ALL">Semua ({opname.items.length})</option>
              <option value="UNCOUNTED">Belum Dihitung ({uncountedCount})</option>
              <option value="DISCREPANCY">Ada Selisih ({discrepancyCount})</option>
              <option value="NO_DISCREPANCY">Tidak Ada Selisih ({opname.items.length - discrepancyCount})</option>
            </select>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white border border-gray-200 rounded overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#4E61D3] text-white">
                <th className="border px-4 py-3 text-left text-sm font-medium">Item</th>
                <th className="border px-4 py-3 text-center text-sm font-medium">Stok Sistem</th>
                <th className="border px-4 py-3 text-center text-sm font-medium">Stok Fisik</th>
                <th className="border px-4 py-3 text-center text-sm font-medium">Selisih</th>
                <th className="border px-4 py-3 text-right text-sm font-medium">Nilai Selisih</th>
                <th className="border px-4 py-3 text-left text-sm font-medium">Alasan</th>
                <th className="border px-4 py-3 text-center text-sm font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.has_discrepancy ? 'bg-red-50' : ''}`}>
                  <td className="border px-4 py-3">
                    <div className="font-medium">{item.inventory_item_name}</div>
                    <div className="text-xs text-gray-500">{item.inventory_item_category}</div>
                  </td>
                  <td className="border px-4 py-3 text-center">
                    {item.system_stock} {item.unit_of_measurement}
                  </td>
                  <td className="border px-4 py-3 text-center">
                    {editingItemId === item.id ? (
                      <input
                        type="number"
                        value={editValues.counted_stock}
                        onChange={(e) => setEditValues({ ...editValues, counted_stock: e.target.value })}
                        className="w-24 px-2 py-1 text-center border rounded"
                        autoFocus
                      />
                    ) : (
                      <span className={item.counted_stock === null ? 'text-gray-400' : ''}>
                        {item.counted_stock !== null ? `${item.counted_stock} ${item.unit_of_measurement}` : '-'}
                      </span>
                    )}
                  </td>
                  <td className="border px-4 py-3 text-center">
                    {item.counted_stock !== null ? (
                      <span className={`font-medium ${item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {item.difference > 0 ? '+' : ''}{item.difference}
                      </span>
                    ) : '-'}
                  </td>
                  <td className="border px-4 py-3 text-right">
                    {item.has_discrepancy ? (
                      <span className="text-red-600 font-medium">{formatCurrency(item.discrepancy_value)}</span>
                    ) : '-'}
                  </td>
                  <td className="border px-4 py-3">
                    {editingItemId === item.id ? (
                      <input
                        type="text"
                        value={editValues.reason}
                        onChange={(e) => setEditValues({ ...editValues, reason: e.target.value })}
                        placeholder="Alasan selisih..."
                        className="w-full px-2 py-1 text-sm border rounded"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">{item.reason || '-'}</span>
                    )}
                  </td>
                  <td className="border px-4 py-3 text-center">
                    {opname.status !== 'COMPLETED' && opname.status !== 'CANCELLED' && (
                      <>
                        {editingItemId === item.id ? (
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleSaveCount(item.id)}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                            >
                              Simpan
                            </button>
                            <button
                              onClick={() => setEditingItemId(null)}
                              className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditItem(item)}
                            className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                          >
                            {item.counted_stock === null ? 'Hitung' : 'Edit'}
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Warning for Uncounted Items */}
        {uncountedCount > 0 && opname.status !== 'COMPLETED' && opname.status !== 'CANCELLED' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded p-4 flex items-start space-x-3">
            <AlertCircleIcon className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <div className="font-medium text-yellow-900">
                Masih ada {uncountedCount} item yang belum dihitung
              </div>
              <div className="text-sm text-yellow-700 mt-1">
                Pastikan semua item sudah dihitung sebelum menyelesaikan stock opname
              </div>
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  );
}
