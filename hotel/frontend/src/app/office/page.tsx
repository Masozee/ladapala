'use client';

import { useState, useEffect } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  UserMultipleIcon,
  CreditCardIcon,
  BedIcon,
  Clock01Icon,
  Calendar01Icon,
  AlertCircleIcon,
  SparklesIcon,
  TrendingUpIcon,
  ChevronRightIcon
} from '@/lib/icons';

interface AnalyticsData {
  today: {
    date: string;
    checkins: number;
    checkouts: number;
    revenue: number;
    occupancy_rate: number;
    occupied_rooms: number;
    available_rooms: number;
  };
  summary: {
    total_rooms: number;
    total_guests: number;
    vip_guests: number;
    new_guests_this_month: number;
    active_complaints: number;
    urgent_complaints: number;
    resolved_complaints_this_month: number;
  };
  revenue: {
    today: number;
    this_month: number;
    last_30_days: number;
    avg_daily: number;
  };
  averages: {
    stay_duration_nights: number;
    booking_value: number;
  };
  upcoming: {
    tomorrow_checkins: number;
    tomorrow_checkouts: number;
  };
  charts: {
    daily_revenue: Array<{ date: string; revenue: number; transactions: number }>;
    occupancy: Array<{ date: string; occupied: number; available: number; occupancy_rate: number }>;
    payment_methods: Array<{ method: string; method_display: string; total: number; count: number; percentage: number }>;
    booking_sources: Array<{ source: string; source_display: string; count: number; revenue: number }>;
    room_types: Array<{ room_type: string; bookings: number; revenue: number; avg_nights: number }>;
    nationalities: Array<{ nationality: string; count: number }>;
  };
}

export default function OfficePage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl('hotel/analytics/dashboard/'));
        if (response.ok) {
          const data = await response.json();
          setAnalytics(data);
        } else {
          setError('Failed to load analytics');
        }
      } catch (err) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
    // Refresh every 5 minutes
    const interval = setInterval(loadAnalytics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  };

  // Function to calculate nice scale maximum (round up to nearest nice number)
  const getNiceMax = (maxValue: number): number => {
    if (maxValue === 0) return 10;

    // Calculate order of magnitude
    const magnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));
    const normalized = maxValue / magnitude;

    // Round up to nice numbers: 1, 2, 5, 10
    let niceNormalized;
    if (normalized <= 1) niceNormalized = 1;
    else if (normalized <= 2) niceNormalized = 2;
    else if (normalized <= 5) niceNormalized = 5;
    else niceNormalized = 10;

    return niceNormalized * magnitude;
  };

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 border-2 border-[#005357] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-gray-600">Loading analytics...</span>
          </div>
        </div>
      </OfficeLayout>
    );
  }

  if (error || !analytics) {
    return (
      <OfficeLayout>
        <div className="bg-red-50 border border-red-200 p-4">
          <div className="flex items-center space-x-2">
            <AlertCircleIcon className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error || 'Failed to load analytics'}</span>
          </div>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Analytics</h1>
          <p className="text-gray-600 mt-2">Monitor hotel performance and key metrics</p>
          <p className="text-sm text-gray-500 mt-1">Last updated: {new Date().toLocaleTimeString('id-ID')}</p>
        </div>

        {/* Today's Overview */}
        <div className="bg-gradient-to-r from-[#005357] to-[#007a7f] border border-gray-200 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Today's Overview</h2>
              <p className="text-white/80 mt-1">{new Date(analytics.today.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <Calendar01Icon className="h-12 w-12 text-white/30" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/10 p-4 rounded">
              <div className="text-white/80 text-sm mb-1">Revenue</div>
              <div className="text-2xl font-bold">{formatCurrency(analytics.today.revenue)}</div>
            </div>
            <div className="bg-white/10 p-4 rounded">
              <div className="text-white/80 text-sm mb-1">Occupancy</div>
              <div className="text-2xl font-bold">{analytics.today.occupancy_rate.toFixed(1)}%</div>
              <div className="text-xs text-white/80 mt-1">{analytics.today.occupied_rooms}/{analytics.summary.total_rooms} rooms</div>
            </div>
            <div className="bg-white/10 p-4 rounded">
              <div className="text-white/80 text-sm mb-1">Check-ins</div>
              <div className="text-2xl font-bold">{analytics.today.checkins}</div>
            </div>
            <div className="bg-white/10 p-4 rounded">
              <div className="text-white/80 text-sm mb-1">Check-outs</div>
              <div className="text-2xl font-bold">{analytics.today.checkouts}</div>
            </div>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Monthly Revenue</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analytics.revenue.this_month)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 flex items-center justify-center rounded-lg">
                <CreditCardIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              Avg daily: {formatCurrency(analytics.revenue.avg_daily)}
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Total Guests</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.summary.total_guests}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 flex items-center justify-center rounded-lg">
                <UserMultipleIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <SparklesIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-600">{analytics.summary.vip_guests} VIP guests</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Available Rooms</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.today.available_rooms}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 flex items-center justify-center rounded-lg">
                <BedIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {analytics.today.occupied_rooms} occupied
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600">Active Complaints</h3>
                <p className="text-2xl font-bold text-gray-900 mt-1">{analytics.summary.active_complaints}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 flex items-center justify-center rounded-lg">
                <AlertCircleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-sm text-red-600">
              {analytics.summary.urgent_complaints} urgent
            </div>
          </div>
        </div>

        {/* Revenue Chart - Dual Bar */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Daily Revenue (Last 7 Days)</h3>
                <p className="text-sm text-gray-600 mt-1">Revenue and transaction trends</p>
              </div>
              <TrendingUpIcon className="h-6 w-6 text-[#005357]" />
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Transactions Chart */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Transactions Count</h4>
                {(() => {
                  const maxTransactions = Math.max(...analytics.charts.daily_revenue.map(d => d.transactions));
                  const scaleMax = getNiceMax(maxTransactions);
                  const step = scaleMax / 5;
                  const chartHeight = 400; // Fixed chart height in pixels

                  return (
                    <div className="flex" style={{ height: `${chartHeight}px` }}>
                      {/* Y-axis */}
                      <div className="flex flex-col justify-between mr-2 py-1">
                        {[5, 4, 3, 2, 1, 0].map((i) => (
                          <div key={i} className="text-xs text-gray-500 text-right w-10 leading-none">
                            {Math.round(step * i)}
                          </div>
                        ))}
                      </div>

                      {/* Chart area */}
                      <div className="flex-1 flex flex-col">
                        {/* Grid and bars area */}
                        <div className="flex-1 relative py-1">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="border-t border-gray-200"></div>
                            ))}
                          </div>

                          {/* Bars */}
                          <div className="absolute inset-0 flex items-end justify-around gap-2 px-2">
                            {analytics.charts.daily_revenue.map((day, index) => {
                              const barHeight = scaleMax > 0 ? (day.transactions / scaleMax) * (chartHeight - 10) : 0;

                              return (
                                <div key={index} className="flex-1 flex flex-col items-center justify-end group max-w-[60px]">
                                  {/* Tooltip */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-gray-900 text-white text-xs py-2 px-3 rounded shadow-lg absolute -translate-y-full whitespace-nowrap z-10">
                                    <div className="font-bold">{day.transactions} transactions</div>
                                  </div>

                                  {/* Bar */}
                                  <div
                                    className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t transition-all duration-500 hover:opacity-80"
                                    style={{ height: `${barHeight}px` }}
                                  ></div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* X-axis labels */}
                        <div className="flex justify-around gap-2 px-2 mt-2">
                          {analytics.charts.daily_revenue.map((day, index) => (
                            <div key={index} className="flex-1 max-w-[60px] text-center">
                              <div className="text-[10px] font-medium text-gray-700">{formatDate(day.date)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Revenue Chart */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Revenue Amount</h4>
                {(() => {
                  const maxRevenue = Math.max(...analytics.charts.daily_revenue.map(d => d.revenue));
                  const scaleMax = getNiceMax(maxRevenue);
                  const step = scaleMax / 5;
                  const chartHeight = 400; // Fixed chart height in pixels

                  return (
                    <div className="flex" style={{ height: `${chartHeight}px` }}>
                      {/* Y-axis */}
                      <div className="flex flex-col justify-between mr-2 py-1">
                        {[5, 4, 3, 2, 1, 0].map((i) => (
                          <div key={i} className="text-xs text-gray-500 text-right w-10 leading-none">
                            {(step * i / 1000000).toFixed(0)}M
                          </div>
                        ))}
                      </div>

                      {/* Chart area */}
                      <div className="flex-1 flex flex-col">
                        {/* Grid and bars area */}
                        <div className="flex-1 relative py-1">
                          {/* Grid lines */}
                          <div className="absolute inset-0 flex flex-col justify-between">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                              <div key={i} className="border-t border-gray-200"></div>
                            ))}
                          </div>

                          {/* Bars */}
                          <div className="absolute inset-0 flex items-end justify-around gap-2 px-2">
                            {analytics.charts.daily_revenue.map((day, index) => {
                              const barHeight = scaleMax > 0 ? (day.revenue / scaleMax) * (chartHeight - 10) : 0;

                              return (
                                <div key={index} className="flex-1 flex flex-col items-center justify-end group max-w-[60px]">
                                  {/* Tooltip */}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-gray-900 text-white text-xs py-2 px-3 rounded shadow-lg absolute -translate-y-full whitespace-nowrap z-10">
                                    <div className="font-bold">{formatCurrency(day.revenue)}</div>
                                  </div>

                                  {/* Bar */}
                                  <div
                                    className="w-full bg-gradient-to-t from-[#005357] to-[#007a7f] rounded-t transition-all duration-500 hover:opacity-80"
                                    style={{ height: `${barHeight}px` }}
                                  ></div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* X-axis labels */}
                        <div className="flex justify-around gap-2 px-2 mt-2">
                          {analytics.charts.daily_revenue.map((day, index) => (
                            <div key={index} className="flex-1 max-w-[60px] text-center">
                              <div className="text-[10px] font-medium text-gray-700">{formatDate(day.date)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Occupancy, Payment Methods & Booking Sources - 3 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Occupancy Chart */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Occupancy Rate</h3>
                  <p className="text-xs text-gray-600 mt-1">Last 7 Days</p>
                </div>
                <BedIcon className="h-5 w-5 text-[#005357]" />
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const chartHeight = 400;
                const scaleMax = 100; // Occupancy is always 0-100%
                const step = 20; // 0, 20, 40, 60, 80, 100

                return (
                  <div className="flex" style={{ height: `${chartHeight}px` }}>
                    {/* Y-axis */}
                    <div className="flex flex-col justify-between mr-2 py-1">
                      {[5, 4, 3, 2, 1, 0].map((i) => (
                        <div key={i} className="text-xs text-gray-500 text-right w-10 leading-none">
                          {step * i}%
                        </div>
                      ))}
                    </div>

                    {/* Chart area */}
                    <div className="flex-1 flex flex-col">
                      {/* Grid and bars area */}
                      <div className="flex-1 relative py-1">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="border-t border-gray-200"></div>
                          ))}
                        </div>

                        {/* Bars */}
                        <div className="absolute inset-0 flex items-end justify-around gap-2 px-2">
                          {analytics.charts.occupancy.map((day, index) => {
                            const barHeight = (day.occupancy_rate / scaleMax) * (chartHeight - 10);

                            return (
                              <div key={index} className="flex-1 flex flex-col items-center justify-end group max-w-[60px]">
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-gray-900 text-white text-xs py-2 px-3 rounded shadow-lg absolute -translate-y-full whitespace-nowrap z-10">
                                  <div className="font-bold">{day.occupancy_rate.toFixed(1)}%</div>
                                  <div>{day.occupied}/{analytics.summary.total_rooms} rooms</div>
                                </div>

                                {/* Bar */}
                                <div
                                  className="w-full bg-gradient-to-t from-blue-500 to-blue-600 rounded-t transition-all duration-500 hover:opacity-80"
                                  style={{ height: `${barHeight}px` }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* X-axis labels */}
                      <div className="flex justify-around gap-2 px-2 mt-2">
                        {analytics.charts.occupancy.map((day, index) => (
                          <div key={index} className="flex-1 max-w-[60px] text-center">
                            <div className="text-[10px] font-medium text-gray-700">{formatDate(day.date)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Payment Methods</h3>
                <p className="text-xs text-gray-600 mt-1">Last 30 Days</p>
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const chartHeight = 400;
                const scaleMax = 100; // Percentage is always 0-100%
                const step = 20; // 0, 20, 40, 60, 80, 100

                return (
                  <div className="flex" style={{ height: `${chartHeight}px` }}>
                    {/* Y-axis */}
                    <div className="flex flex-col justify-between mr-2 py-1">
                      {[5, 4, 3, 2, 1, 0].map((i) => (
                        <div key={i} className="text-xs text-gray-500 text-right w-10 leading-none">
                          {step * i}%
                        </div>
                      ))}
                    </div>

                    {/* Chart area */}
                    <div className="flex-1 flex flex-col">
                      {/* Grid and bars area */}
                      <div className="flex-1 relative py-1">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="border-t border-gray-200"></div>
                          ))}
                        </div>

                        {/* Bars */}
                        <div className="absolute inset-0 flex items-end justify-around gap-2 px-2">
                          {analytics.charts.payment_methods.map((method, index) => {
                            const barHeight = (method.percentage / scaleMax) * (chartHeight - 10);

                            return (
                              <div key={index} className="flex-1 flex flex-col items-center justify-end group max-w-[60px]">
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-gray-900 text-white text-xs py-2 px-3 rounded shadow-lg absolute -translate-y-full whitespace-nowrap z-10">
                                  <div className="font-bold">{formatCurrency(method.total)}</div>
                                  <div>{method.percentage.toFixed(1)}%</div>
                                </div>

                                {/* Bar */}
                                <div
                                  className="w-full bg-[#005357] rounded-t transition-all duration-500 hover:opacity-80"
                                  style={{ height: `${barHeight}px` }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* X-axis labels */}
                      <div className="flex justify-around gap-2 px-2 mt-2">
                        {analytics.charts.payment_methods.map((method, index) => (
                          <div key={index} className="flex-1 max-w-[60px] text-center">
                            <div className="text-[10px] font-medium text-gray-700 leading-tight">{method.method_display}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Booking Sources */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Booking Sources</h3>
                <p className="text-xs text-gray-600 mt-1">Last 30 Days</p>
              </div>
            </div>
            <div className="p-6">
              {(() => {
                const maxCount = Math.max(...analytics.charts.booking_sources.map(s => s.count));
                const scaleMax = getNiceMax(maxCount);
                const step = scaleMax / 5;
                const chartHeight = 400;

                return (
                  <div className="flex" style={{ height: `${chartHeight}px` }}>
                    {/* Y-axis */}
                    <div className="flex flex-col justify-between mr-2 py-1">
                      {[5, 4, 3, 2, 1, 0].map((i) => (
                        <div key={i} className="text-xs text-gray-500 text-right w-10 leading-none">
                          {Math.round(step * i)}
                        </div>
                      ))}
                    </div>

                    {/* Chart area */}
                    <div className="flex-1 flex flex-col">
                      {/* Grid and bars area */}
                      <div className="flex-1 relative py-1">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                          {[0, 1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="border-t border-gray-200"></div>
                          ))}
                        </div>

                        {/* Bars */}
                        <div className="absolute inset-0 flex items-end justify-around gap-2 px-2">
                          {analytics.charts.booking_sources.map((source, index) => {
                            const barHeight = scaleMax > 0 ? (source.count / scaleMax) * (chartHeight - 10) : 0;

                            return (
                              <div key={index} className="flex-1 flex flex-col items-center justify-end group max-w-[60px]">
                                {/* Tooltip */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity mb-2 bg-gray-900 text-white text-xs py-2 px-3 rounded shadow-lg absolute -translate-y-full whitespace-nowrap z-10">
                                  <div className="font-bold">{source.count} bookings</div>
                                  <div>{formatCurrency(source.revenue)}</div>
                                </div>

                                {/* Bar */}
                                <div
                                  className="w-full bg-blue-500 rounded-t transition-all duration-500 hover:opacity-80"
                                  style={{ height: `${barHeight}px` }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* X-axis labels */}
                      <div className="flex justify-around gap-2 px-2 mt-2">
                        {analytics.charts.booking_sources.map((source, index) => (
                          <div key={index} className="flex-1 max-w-[60px] text-center">
                            <div className="text-[10px] font-medium text-gray-700 leading-tight">{source.source_display}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Room Type Performance */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">Room Type Performance (30 Days)</h3>
            <p className="text-sm text-gray-600 mt-1">Revenue and bookings by room type</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#005357]">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white border border-gray-300">Room Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white border border-gray-300">Bookings</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white border border-gray-300">Revenue</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white border border-gray-300">Avg Nights</th>
                </tr>
              </thead>
              <tbody>
                {analytics.charts.room_types.map((room, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 border border-gray-200">{room.room_type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 border border-gray-200">{room.bookings}</td>
                    <td className="px-6 py-4 text-sm font-bold text-[#005357] border border-gray-200">{formatCurrency(room.revenue)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 border border-gray-200">{room.avg_nights} nights</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Averages</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Stay Duration</span>
                <span className="text-lg font-bold text-gray-900">{analytics.averages.stay_duration_nights} nights</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Avg Booking Value</span>
                <span className="text-lg font-bold text-gray-900">{formatCurrency(analytics.averages.booking_value)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tomorrow</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expected Check-ins</span>
                <span className="text-lg font-bold text-green-600">{analytics.upcoming.tomorrow_checkins}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Expected Check-outs</span>
                <span className="text-lg font-bold text-blue-600">{analytics.upcoming.tomorrow_checkouts}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Top Nationalities</h3>
            <div className="space-y-2">
              {analytics.charts.nationalities.slice(0, 5).map((nat, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{nat.nationality}</span>
                  <span className="text-sm font-bold text-gray-900">{nat.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}
