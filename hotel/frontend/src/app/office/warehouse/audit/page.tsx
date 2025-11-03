'use client';

import { useState, useEffect } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  Search02Icon,
  FilterIcon,
  Calendar01Icon,
  UserIcon,
  FileTextIcon,
} from '@/lib/icons';

interface AuditLog {
  id: number;
  action_type: string;
  action_type_display: string;
  model_name: string;
  object_id: number;
  object_repr: string;
  changes: Record<string, { old: any; new: any }> | null;
  changes_display: string;
  user_name: string;
  timestamp: string;
  notes: string;
}

export default function WarehouseAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('ALL');
  const [modelFilter, setModelFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [actionTypeFilter, modelFilter, dateFrom, dateTo]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = buildApiUrl('hotel/warehouse-audit/');
      const params = new URLSearchParams();

      if (actionTypeFilter !== 'ALL') {
        params.append('action_type', actionTypeFilter);
      }
      if (modelFilter !== 'ALL') {
        params.append('model_name', modelFilter);
      }
      if (dateFrom) {
        params.append('date_from', new Date(dateFrom).toISOString());
      }
      if (dateTo) {
        params.append('date_to', new Date(dateTo).toISOString());
      }
      if (searchQuery) {
        params.append('search', searchQuery);
      }

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      alert('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'APPROVE':
      case 'COMPLETE':
        return 'bg-purple-100 text-purple-800';
      case 'CANCEL':
        return 'bg-orange-100 text-orange-800';
      case 'ADJUST':
      case 'COUNT':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const uniqueModels = Array.from(new Set(logs.map(log => log.model_name)));

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warehouse Audit Trail</h1>
          <p className="text-gray-600 mt-1">Riwayat semua aktivitas warehouse</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{logs.length}</div>
                <div className="text-sm text-gray-600">Total Aktivitas</div>
              </div>
              <div className="p-3 bg-blue-100 rounded">
                <FileTextIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {logs.filter(l => l.action_type === 'CREATE').length}
                </div>
                <div className="text-sm text-gray-600">Dibuat</div>
              </div>
              <div className="p-3 bg-green-100 rounded">
                <Calendar01Icon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {logs.filter(l => l.action_type === 'UPDATE').length}
                </div>
                <div className="text-sm text-gray-600">Diubah</div>
              </div>
              <div className="p-3 bg-blue-100 rounded">
                <UserIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {Array.from(new Set(logs.map(l => l.user_name))).length}
                </div>
                <div className="text-sm text-gray-600">Pengguna</div>
              </div>
              <div className="p-3 bg-purple-100 rounded">
                <UserIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari deskripsi atau catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
                className="pl-10 pr-4 py-2 w-full text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3]"
              />
            </div>

            {/* Action Type Filter */}
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3]"
            >
              <option value="ALL">Semua Aksi</option>
              <option value="CREATE">Dibuat</option>
              <option value="UPDATE">Diubah</option>
              <option value="DELETE">Dihapus</option>
              <option value="ADJUST">Penyesuaian</option>
              <option value="COUNT">Perhitungan</option>
              <option value="COMPLETE">Diselesaikan</option>
              <option value="CANCEL">Dibatalkan</option>
            </select>

            {/* Model Filter */}
            <select
              value={modelFilter}
              onChange={(e) => setModelFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3]"
            >
              <option value="ALL">Semua Model</option>
              {uniqueModels.map((model) => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>

            {/* Date Range */}
            <div className="flex space-x-2">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                placeholder="Dari"
                className="px-3 py-2 w-full text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3]"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                placeholder="Sampai"
                className="px-3 py-2 w-full text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3]"
              />
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white border border-gray-200 rounded">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Memuat data...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FileTextIcon className="h-12 w-12 text-gray-400 mb-4" />
              <div className="text-gray-500">Tidak ada log audit</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#4E61D3] text-white">
                    <th className="border px-4 py-3 text-left text-sm font-medium">Waktu</th>
                    <th className="border px-4 py-3 text-left text-sm font-medium">Pengguna</th>
                    <th className="border px-4 py-3 text-left text-sm font-medium">Aksi</th>
                    <th className="border px-4 py-3 text-left text-sm font-medium">Model</th>
                    <th className="border px-4 py-3 text-left text-sm font-medium">Deskripsi</th>
                    <th className="border px-4 py-3 text-left text-sm font-medium">Perubahan</th>
                    <th className="border px-4 py-3 text-left text-sm font-medium">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="border px-4 py-3 text-sm whitespace-nowrap">
                        {formatDateTime(log.timestamp)}
                      </td>
                      <td className="border px-4 py-3 text-sm">
                        <div className="flex items-center space-x-2">
                          <UserIcon className="h-4 w-4 text-gray-400" />
                          <span>{log.user_name || 'System'}</span>
                        </div>
                      </td>
                      <td className="border px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getActionColor(log.action_type)}`}>
                          {log.action_type_display}
                        </span>
                      </td>
                      <td className="border px-4 py-3 text-sm">
                        {log.model_name}
                      </td>
                      <td className="border px-4 py-3 text-sm">
                        {log.object_repr}
                        <div className="text-xs text-gray-500">ID: {log.object_id}</div>
                      </td>
                      <td className="border px-4 py-3 text-sm">
                        {log.changes ? (
                          <div className="space-y-1">
                            {Object.entries(log.changes).map(([field, change]) => (
                              <div key={field} className="text-xs">
                                <span className="font-medium">{field}:</span>{' '}
                                <span className="text-red-600">{String(change.old)}</span> →{' '}
                                <span className="text-green-600">{String(change.new)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="border px-4 py-3 text-sm text-gray-600">
                        {log.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </OfficeLayout>
  );
}
