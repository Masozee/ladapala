'use client';

import { useState, useEffect } from 'react';
import SupportLayout from '@/components/SupportLayout';
import { buildApiUrl } from '@/lib/config';
import {
  File01Icon,
  Wrench01Icon,
  CircleArrowReload01Icon,
  PackageIcon,
  Loading03Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  Clock01Icon,
  UserCheckIcon,
  Calendar01Icon,
  PieChartIcon,
  AlertCircleIcon
} from '@/lib/icons';

interface AnalyticsData {
  overview: {
    maintenance: {
      total: number;
      active: number;
      completed: number;
      cancelled: number;
      today: number;
      this_week: number;
      this_month: number;
      avg_resolution_hours: number;
    };
    housekeeping: {
      total: number;
      pending: number;
      completed: number;
      today: number;
      this_week: number;
      this_month: number;
    };
    amenity: {
      total: number;
      pending: number;
      completed: number;
      cancelled: number;
      today: number;
      this_week: number;
      this_month: number;
    };
  };
  maintenance: {
    by_priority: Array<{ priority: string; count: number }>;
    by_category: Array<{ category: string; count: number }>;
    trend_7days: Array<{ date: string; count: number }>;
  };
  housekeeping: {
    by_type: Array<{ task_type: string; count: number }>;
    by_priority: Array<{ priority: string; count: number }>;
    trend_7days: Array<{ date: string; count: number }>;
  };
  amenity: {
    by_category: Array<{ category__name: string; count: number }>;
    by_priority: Array<{ priority: string; count: number }>;
    trend_7days: Array<{ date: string; count: number }>;
  };
}

export default function SupportReportsPage() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('hotel/support/analytics/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const analyticsData = await response.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      'LOW': 'Rendah',
      'MEDIUM': 'Sedang',
      'HIGH': 'Tinggi',
      'URGENT': 'Mendesak'
    };
    return labels[priority] || priority;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      'LOW': 'bg-blue-100 text-blue-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getTaskTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'CHECKOUT_CLEANING': 'Checkout Cleaning',
      'DAILY_CLEANING': 'Daily Cleaning',
      'DEEP_CLEANING': 'Deep Cleaning',
      'TURNDOWN_SERVICE': 'Turndown Service',
      'MAINTENANCE': 'Maintenance',
      'INSPECTION': 'Inspection',
      'COMPLAINT': 'Complaint Response'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <SupportLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Loading03Icon className="h-12 w-12 text-[#F87B1B] mx-auto animate-spin mb-4" />
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </SupportLayout>
    );
  }

  if (!data) {
    return (
      <SupportLayout>
        <div className="text-center py-12">
          <AlertCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Failed to load analytics data</p>
        </div>
      </SupportLayout>
    );
  }

  return (
    <SupportLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laporan & Analitik Support</h1>
          <p className="text-gray-600 mt-2">Analisis performa layanan maintenance, housekeeping, dan amenities</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-50 border border-gray-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'bg-[#F87B1B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <PieChartIcon className="h-4 w-4" />
            <span>Overview</span>
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'maintenance'
                ? 'bg-[#F87B1B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Wrench01Icon className="h-4 w-4" />
            <span>Maintenance</span>
          </button>
          <button
            onClick={() => setActiveTab('housekeeping')}
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'housekeeping'
                ? 'bg-[#F87B1B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <CircleArrowReload01Icon className="h-4 w-4" />
            <span>Housekeeping</span>
          </button>
          <button
            onClick={() => setActiveTab('amenity')}
            className={`flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'amenity'
                ? 'bg-[#F87B1B] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <PackageIcon className="h-4 w-4" />
            <span>Amenities</span>
          </button>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Maintenance Overview */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <Wrench01Icon className="h-5 w-5 text-[#F87B1B]" />
                <span>Maintenance</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">Total Requests</div>
                  <div className="text-3xl font-bold text-gray-900">{data.overview.maintenance.total}</div>
                  <div className="text-xs text-gray-500 mt-2">All time</div>
                </div>
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">Active</div>
                  <div className="text-3xl font-bold text-orange-600">{data.overview.maintenance.active}</div>
                  <div className="text-xs text-gray-500 mt-2">Sedang dikerjakan</div>
                </div>
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">Completed</div>
                  <div className="text-3xl font-bold text-green-600">{data.overview.maintenance.completed}</div>
                  <div className="text-xs text-gray-500 mt-2">Selesai</div>
                </div>
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">Avg Resolution</div>
                  <div className="text-3xl font-bold text-blue-600">{data.overview.maintenance.avg_resolution_hours}h</div>
                  <div className="text-xs text-gray-500 mt-2">Average time</div>
                </div>
              </div>
            </div>

            {/* Housekeeping Overview */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <CircleArrowReload01Icon className="h-5 w-5 text-[#F87B1B]" />
                <span>Housekeeping</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
                  <div className="text-3xl font-bold text-gray-900">{data.overview.housekeeping.total}</div>
                  <div className="text-xs text-gray-500 mt-2">All time</div>
                </div>
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">Pending</div>
                  <div className="text-3xl font-bold text-yellow-600">{data.overview.housekeeping.pending}</div>
                  <div className="text-xs text-gray-500 mt-2">Menunggu</div>
                </div>
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">Completed</div>
                  <div className="text-3xl font-bold text-green-600">{data.overview.housekeeping.completed}</div>
                  <div className="text-xs text-gray-500 mt-2">Selesai</div>
                </div>
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">Today</div>
                  <div className="text-3xl font-bold text-blue-600">{data.overview.housekeeping.today}</div>
                  <div className="text-xs text-gray-500 mt-2">Hari ini</div>
                </div>
              </div>
            </div>

            {/* Amenity Overview */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center space-x-2">
                <PackageIcon className="h-5 w-5 text-[#F87B1B]" />
                <span>Amenity Requests</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">Total Requests</div>
                  <div className="text-3xl font-bold text-gray-900">{data.overview.amenity.total}</div>
                  <div className="text-xs text-gray-500 mt-2">All time</div>
                </div>
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">Pending</div>
                  <div className="text-3xl font-bold text-yellow-600">{data.overview.amenity.pending}</div>
                  <div className="text-xs text-gray-500 mt-2">Menunggu</div>
                </div>
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">Completed</div>
                  <div className="text-3xl font-bold text-green-600">{data.overview.amenity.completed}</div>
                  <div className="text-xs text-gray-500 mt-2">Selesai</div>
                </div>
                <div className="bg-white border border-gray-200 p-6">
                  <div className="text-sm text-gray-600 mb-1">This Week</div>
                  <div className="text-3xl font-bold text-blue-600">{data.overview.amenity.this_week}</div>
                  <div className="text-xs text-gray-500 mt-2">7 hari terakhir</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Priority */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Berdasarkan Prioritas</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {data.maintenance.by_priority.map((item) => (
                      <div key={item.priority} className="flex items-center justify-between">
                        <span className={`inline-flex px-3 py-1 text-sm font-medium ${getPriorityColor(item.priority)}`}>
                          {getPriorityLabel(item.priority)}
                        </span>
                        <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* By Category */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Top 5 Kategori</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {data.maintenance.by_category.map((item, index) => (
                      <div key={item.category} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#F87B1B] text-white flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-gray-900 font-medium">{item.category}</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 7 Day Trend */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Trend 7 Hari Terakhir</h3>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {data.maintenance.trend_7days.map((item) => (
                    <div key={item.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-600">{new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 h-2 rounded">
                          <div className="bg-[#F87B1B] h-2 rounded" style={{ width: `${Math.min(item.count * 10, 100)}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Housekeeping Tab */}
        {activeTab === 'housekeeping' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Type */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Berdasarkan Tipe</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {data.housekeeping.by_type.map((item) => (
                      <div key={item.task_type} className="flex items-center justify-between py-2">
                        <span className="text-gray-900 font-medium">{getTaskTypeLabel(item.task_type)}</span>
                        <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* By Priority */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Berdasarkan Prioritas</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {data.housekeeping.by_priority.map((item) => (
                      <div key={item.priority} className="flex items-center justify-between">
                        <span className={`inline-flex px-3 py-1 text-sm font-medium ${getPriorityColor(item.priority)}`}>
                          {getPriorityLabel(item.priority)}
                        </span>
                        <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 7 Day Trend */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Trend 7 Hari Terakhir</h3>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {data.housekeeping.trend_7days.map((item) => (
                    <div key={item.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-600">{new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 h-2 rounded">
                          <div className="bg-[#F87B1B] h-2 rounded" style={{ width: `${Math.min(item.count * 10, 100)}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Amenity Tab */}
        {activeTab === 'amenity' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* By Category */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Top 5 Kategori</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {data.amenity.by_category.map((item, index) => (
                      <div key={item.category__name} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-[#F87B1B] text-white flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <span className="text-gray-900 font-medium">{item.category__name || 'Lainnya'}</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* By Priority */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900">Berdasarkan Prioritas</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {data.amenity.by_priority.map((item) => (
                      <div key={item.priority} className="flex items-center justify-between">
                        <span className={`inline-flex px-3 py-1 text-sm font-medium ${getPriorityColor(item.priority)}`}>
                          {getPriorityLabel(item.priority)}
                        </span>
                        <span className="text-2xl font-bold text-gray-900">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 7 Day Trend */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-900">Trend 7 Hari Terakhir</h3>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {data.amenity.trend_7days.map((item) => (
                    <div key={item.date} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <span className="text-sm text-gray-600">{new Date(item.date).toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 h-2 rounded">
                          <div className="bg-[#F87B1B] h-2 rounded" style={{ width: `${Math.min(item.count * 10, 100)}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 w-8 text-right">{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SupportLayout>
  );
}
