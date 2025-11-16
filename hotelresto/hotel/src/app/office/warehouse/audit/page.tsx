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
  ChevronLeftIcon,
  ChevronRightIcon,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const itemsPerPage = 20;

  useEffect(() => {
    fetchLogs();
  }, [actionTypeFilter, modelFilter, dateFrom, dateTo, currentPage]);

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

      // Add pagination
      params.append('page', currentPage.toString());
      params.append('page_size', itemsPerPage.toString());

      if (params.toString()) {
        url += '?' + params.toString();
      }

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.results || data);
        setTotalCount(data.count || 0);
        setTotalPages(Math.ceil((data.count || 0) / itemsPerPage));
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Left: Filters */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Action Type Filter */}
              <select
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
                className="px-3 py-2 w-full md:w-48 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3]"
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
                className="px-3 py-2 w-full md:w-48 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3]"
              >
                <option value="ALL">Semua Model</option>
                {uniqueModels.map((model) => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>

              {/* Date Range */}
              <div className="flex gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-3 py-2 w-full md:w-36 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3]"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-3 py-2 w-full md:w-36 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3]"
                />
              </div>
            </div>

            {/* Right: Search */}
            <div className="relative w-full md:w-80">
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
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white border border-gray-200 rounded overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-pulse text-gray-500">Memuat data...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <FileTextIcon className="h-16 w-16 text-gray-300 mb-4" />
              <div className="text-gray-500 font-medium">Tidak ada log audit</div>
              <div className="text-gray-400 text-sm mt-1">Coba ubah filter pencarian</div>
            </div>
          ) : (
            <>
              <div className="overflow-visible">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gradient-to-r from-[#4E61D3] to-[#3D4EA8] text-white">
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Waktu
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Pengguna
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Aksi
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Model
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Deskripsi
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Perubahan
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
                        Catatan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {logs.map((log, index) => (
                      <tr
                        key={log.id}
                        className={`transition-colors ${
                          index % 2 === 0 ? 'bg-white hover:bg-blue-50' : 'bg-gray-50 hover:bg-blue-50'
                        }`}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {new Date(log.timestamp).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(log.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {log.user_name || 'System'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action_type)}`}>
                            {log.action_type_display}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{log.model_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{log.object_repr}</div>
                          <div className="text-xs text-gray-500 mt-1">ID: {log.object_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          {log.changes ? (
                            <div className="space-y-2">
                              {Object.entries(log.changes).map(([field, change]) => (
                                <div key={field} className="text-xs">
                                  <div className="font-semibold text-gray-700 mb-1">{field}</div>
                                  <div className="flex items-center space-x-2">
                                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded border border-red-200">
                                      {String(change.old) || 'null'}
                                    </span>
                                    <span className="text-gray-400">→</span>
                                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded border border-green-200">
                                      {String(change.new) || 'null'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm italic">Tidak ada perubahan</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs">
                            {log.notes || <span className="text-gray-400 italic">-</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Menampilkan <span className="font-medium">{((currentPage - 1) * itemsPerPage) + 1}</span> - <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCount)}</span> dari <span className="font-medium">{totalCount}</span> hasil
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 rounded border ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const page = index + 1;
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 rounded text-sm font-medium ${
                                currentPage === page
                                  ? 'bg-[#4E61D3] text-white'
                                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return <span key={page} className="px-2 text-gray-400">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 rounded border ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </OfficeLayout>
  );
}
