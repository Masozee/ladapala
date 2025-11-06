'use client';

import { useState, useEffect } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  Calendar01Icon,
  Building03Icon,
  PieChartIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  FilterIcon,
  UserMultipleIcon,
  BedIcon,
  Clock01Icon,
  Search02Icon,
} from '@/lib/icons';

interface TodaySnapshot {
  date: string;
  occupied_rooms: number;
  available_rooms: number;
  occupancy_rate: number;
  checkins_today: number;
  checkouts_today: number;
  checkins_tomorrow: number;
  checkouts_tomorrow: number;
}

interface Summary {
  total_rooms: number;
  average_occupancy: number;
  peak_occupancy: number;
  lowest_occupancy: number;
  peak_day: string | null;
  lowest_day: string | null;
  total_room_nights_sold: number;
  total_room_nights_available: number;
  total_days: number;
}

interface DailyData {
  date: string;
  day_name: string;
  occupied_rooms: number;
  available_rooms: number;
  total_rooms: number;
  occupancy_rate: number;
  checkins: number;
  checkouts: number;
  room_type_occupancy: {
    [key: string]: {
      occupied: number;
      total: number;
      rate: number;
    };
  };
}

interface MonthlyData {
  month: number;
  month_name: string;
  year: number;
  average_occupancy: number;
  total_room_nights: number;
  days_in_month: number;
}

interface RoomTypeSummary {
  room_type: string;
  total_rooms: number;
  average_occupancy: number;
  base_price: number;
}

interface OccupancyData {
  period: string;
  start_date: string;
  end_date: string;
  today_snapshot: TodaySnapshot;
  summary: Summary;
  daily_data: DailyData[];
  monthly_data: MonthlyData[];
  room_type_summary: RoomTypeSummary[];
}

export default function OccupancyPage() {
  const [data, setData] = useState<OccupancyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('thisMonth');
  const [viewMode, setViewMode] = useState<'daily' | 'monthly' | 'roomType'>('daily');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOccupancyData();
  }, [period]);

  const fetchOccupancyData = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`hotel/analytics/occupancy/?period=${period}`), {
        credentials: 'include',
      });
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching occupancy data:', error);
    } finally {
      setLoading(false);
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
      month: 'short',
      year: 'numeric',
    });
  };

  const getOccupancyColor = (rate: number) => {
    if (rate >= 90) return 'bg-red-100 text-red-800';
    if (rate >= 75) return 'bg-orange-100 text-orange-800';
    if (rate >= 50) return 'bg-yellow-100 text-yellow-800';
    if (rate >= 25) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getOccupancyLabel = (rate: number) => {
    if (rate >= 90) return 'Very High';
    if (rate >= 75) return 'High';
    if (rate >= 50) return 'Moderate';
    if (rate >= 25) return 'Low';
    return 'Very Low';
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

  if (!data) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Tidak ada data</div>
        </div>
      </OfficeLayout>
    );
  }

  const filteredDailyData = data.daily_data.filter((day) =>
    day.date.toLowerCase().includes(searchQuery.toLowerCase()) ||
    day.day_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Occupancy Management</h1>
            <p className="text-gray-600 mt-2">Monitor room occupancy, trends, and analytics</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
            >
              <option value="today">Hari Ini</option>
              <option value="yesterday">Kemarin</option>
              <option value="thisWeek">Minggu Ini</option>
              <option value="lastWeek">Minggu Lalu</option>
              <option value="thisMonth">Bulan Ini</option>
              <option value="lastMonth">Bulan Lalu</option>
              <option value="thisYear">Tahun Ini</option>
              <option value="lastYear">Tahun Lalu</option>
            </select>
          </div>
        </div>

        {/* Today's Snapshot */}
        <div className="bg-gradient-to-r from-[#4E61D3] to-[#3D4EA8] text-white  p-6">
          <h2 className="text-xl font-bold mb-4">Today's Snapshot</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-white/80 text-sm">Current Occupancy</div>
              <div className="text-3xl font-bold mt-1">{data.today_snapshot.occupancy_rate}%</div>
              <div className="text-white/60 text-sm mt-1">
                {data.today_snapshot.occupied_rooms} / {data.summary.total_rooms} rooms
              </div>
            </div>
            <div>
              <div className="text-white/80 text-sm">Available Rooms</div>
              <div className="text-3xl font-bold mt-1">{data.today_snapshot.available_rooms}</div>
              <div className="text-white/60 text-sm mt-1">Ready for booking</div>
            </div>
            <div>
              <div className="text-white/80 text-sm">Today's Activity</div>
              <div className="flex items-center space-x-4 mt-1">
                <div>
                  <div className="text-lg font-bold">{data.today_snapshot.checkins_today}</div>
                  <div className="text-white/60 text-xs">Check-ins</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{data.today_snapshot.checkouts_today}</div>
                  <div className="text-white/60 text-xs">Check-outs</div>
                </div>
              </div>
            </div>
            <div>
              <div className="text-white/80 text-sm">Tomorrow's Activity</div>
              <div className="flex items-center space-x-4 mt-1">
                <div>
                  <div className="text-lg font-bold">{data.today_snapshot.checkins_tomorrow}</div>
                  <div className="text-white/60 text-xs">Check-ins</div>
                </div>
                <div>
                  <div className="text-lg font-bold">{data.today_snapshot.checkouts_tomorrow}</div>
                  <div className="text-white/60 text-xs">Check-outs</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Average Occupancy</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {data.summary.average_occupancy}%
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {data.start_date === data.end_date
                    ? formatDate(data.start_date)
                    : `${formatDate(data.start_date)} - ${formatDate(data.end_date)}`}
                </div>
              </div>
              <div className="p-3 bg-blue-100" >
                <PieChartIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Peak Occupancy</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {data.summary.peak_occupancy}%
                </div>
                {data.summary.peak_day && (
                  <div className="text-xs text-gray-500 mt-1">{formatDate(data.summary.peak_day)}</div>
                )}
              </div>
              <div className="p-3 bg-red-100" >
                <ArrowUp01Icon className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Lowest Occupancy</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {data.summary.lowest_occupancy}%
                </div>
                {data.summary.lowest_day && (
                  <div className="text-xs text-gray-500 mt-1">{formatDate(data.summary.lowest_day)}</div>
                )}
              </div>
              <div className="p-3 bg-green-100" >
                <ArrowDown01Icon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Room Nights Sold</div>
                <div className="text-3xl font-bold text-gray-900 mt-1">
                  {data.summary.total_room_nights_sold}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  of {data.summary.total_room_nights_available} available
                </div>
              </div>
              <div className="p-3 bg-purple-100" >
                <BedIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="bg-white border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'daily'
                    ? 'bg-[#4E61D3] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Daily View
              </button>
              {data.monthly_data.length > 0 && (
                <button
                  onClick={() => setViewMode('monthly')}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'monthly'
                      ? 'bg-[#4E61D3] text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Monthly View
                </button>
              )}
              <button
                onClick={() => setViewMode('roomType')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'roomType'
                    ? 'bg-[#4E61D3] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                By Room Type
              </button>
            </div>
            {viewMode === 'daily' && (
              <div className="relative w-64">
                <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                />
              </div>
            )}
          </div>
        </div>

        {/* Daily View */}
        {viewMode === 'daily' && (
          <div className="bg-white border border-gray-200">
            <div className="overflow-visible">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#4E61D3] to-[#3D4EA8] text-white">
                    <th className="px-6 py-4 text-left text-sm font-medium">Date</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Day</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Occupied</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Available</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Occupancy Rate</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Check-ins</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Check-outs</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDailyData.map((day, index) => (
                    <tr
                      key={day.date}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{formatDate(day.date)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{day.day_name}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-medium text-gray-900">{day.occupied_rooms}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-medium text-gray-900">{day.available_rooms}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="text-lg font-bold text-gray-900">{day.occupancy_rate}%</div>
                        <div className="w-full bg-gray-200 h-2 mt-1">
                          <div
                            className="bg-[#4E61D3] h-2"
                            style={{ width: `${day.occupancy_rate}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium">
                            {day.checkins}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium">
                            {day.checkouts}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium ${getOccupancyColor(
                            day.occupancy_rate
                          )}`}
                        >
                          {getOccupancyLabel(day.occupancy_rate)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Monthly View */}
        {viewMode === 'monthly' && data.monthly_data.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.monthly_data.map((month) => (
              <div key={`${month.year}-${month.month}`} className="bg-white border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{month.month_name}</h3>
                  <span className="text-sm text-gray-600">{month.year}</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-gray-600">Average Occupancy</div>
                    <div className="text-3xl font-bold text-gray-900 mt-1">{month.average_occupancy}%</div>
                    <div className="w-full bg-gray-200 h-2 mt-2">
                      <div
                        className="bg-[#4E61D3] h-2"
                        style={{ width: `${month.average_occupancy}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                    <div>
                      <div className="text-xs text-gray-500">Room Nights</div>
                      <div className="text-xl font-bold text-gray-900 mt-1">{month.total_room_nights}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Days</div>
                      <div className="text-xl font-bold text-gray-900 mt-1">{month.days_in_month}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Room Type View */}
        {viewMode === 'roomType' && (
          <div className="bg-white border border-gray-200">
            <div className="overflow-visible">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-[#4E61D3] to-[#3D4EA8] text-white">
                    <th className="px-6 py-4 text-left text-sm font-medium">Room Type</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Total Rooms</th>
                    <th className="px-6 py-4 text-center text-sm font-medium">Average Occupancy</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Base Price</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Performance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.room_type_summary.map((roomType, index) => (
                    <tr
                      key={roomType.room_type}
                      className={`border-b border-gray-200 hover:bg-gray-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{roomType.room_type}</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-medium text-gray-900">{roomType.total_rooms}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <div className="text-xl font-bold text-gray-900 mb-1">
                            {roomType.average_occupancy}%
                          </div>
                          <div className="w-32 bg-gray-200 h-2">
                            <div
                              className="bg-[#4E61D3] h-2"
                              style={{ width: `${roomType.average_occupancy}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{formatCurrency(roomType.base_price)}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium ${getOccupancyColor(
                            roomType.average_occupancy
                          )}`}
                        >
                          {getOccupancyLabel(roomType.average_occupancy)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  );
}
