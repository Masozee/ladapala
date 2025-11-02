'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  Calendar01Icon,
  Add01Icon,
  Search02Icon,
  FilterIcon,
  UserCheckIcon,
  Clock01Icon,
  Cancel01Icon,
  UserIcon,
  CreditCardIcon,
  Building03Icon,
  MoreHorizontalIcon,
  EyeIcon,
  PencilEdit02Icon,
  PrinterIcon
} from '@/lib/icons';

interface EventBooking {
  id: number;
  booking_number: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  venue_name: string;
  venue_type: string;
  package_name: string;
  food_package_name: string;
  event_type: string;
  event_name: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  expected_pax: number;
  confirmed_pax: number;
  grand_total: string;
  down_payment_amount: string;
  remaining_amount: string;
  down_payment_paid: boolean;
  full_payment_paid: boolean;
  booking_status: string;
  payment_status: string;
  booking_status_display: string;
  payment_status_display: string;
  created_at: string;
}

interface Statistics {
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  awaiting_down_payment: number;
  awaiting_full_payment: number;
  fully_paid: number;
}

export default function EventBookingsPage() {
  const [bookings, setBookings] = useState<EventBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<EventBooking[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    total_bookings: 0,
    pending_bookings: 0,
    confirmed_bookings: 0,
    completed_bookings: 0,
    cancelled_bookings: 0,
    awaiting_down_payment: 0,
    awaiting_full_payment: 0,
    fully_paid: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [bookings, searchQuery, statusFilter, paymentFilter]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl('hotel/event-bookings/'), {
        credentials: 'include',
      });
      const data = await response.json();

      setBookings(data.results || data);

      if (data.statistics) {
        setStatistics(data.statistics);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...bookings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (booking) =>
          booking.booking_number.toLowerCase().includes(query) ||
          booking.guest_name.toLowerCase().includes(query) ||
          booking.event_name.toLowerCase().includes(query) ||
          booking.venue_name.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter((booking) => booking.booking_status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'All') {
      filtered = filtered.filter((booking) => booking.payment_status === paymentFilter);
    }

    setFilteredBookings(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'UNPAID':
        return 'bg-red-100 text-red-800';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-100 text-yellow-800';
      case 'FULLY_PAID':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5); // HH:MM
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Event Bookings</h1>
            <p className="text-gray-600 mt-2">Kelola booking event, wedding, dan meeting</p>
          </div>
          <Link
            href="/office/events/new"
            className="inline-flex items-center px-4 py-2 bg-[#4E61D3] text-white hover:bg-[#3D4EA8] transition space-x-2"
          >
            <Add01Icon className="h-5 w-5" />
            <span>Booking Baru</span>
          </Link>
        </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Total Bookings</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {statistics.total_bookings}
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded">
              <Calendar01Icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Menunggu DP</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {statistics.awaiting_down_payment}
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded">
              <Clock01Icon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Menunggu Pelunasan</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {statistics.awaiting_full_payment}
              </div>
            </div>
            <div className="p-3 bg-orange-100 rounded">
              <CreditCardIcon className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Lunas</div>
              <div className="text-3xl font-bold text-gray-900 mt-1">
                {statistics.fully_paid}
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded">
              <UserCheckIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border border-gray-200 rounded p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 md:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari booking number, tamu, atau event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="flex space-x-3">
            <div className="relative">
              <FilterIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent appearance-none bg-white"
              >
                <option value="All">Semua Status</option>
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="relative">
              <CreditCardIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="pl-10 pr-8 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent appearance-none bg-white"
              >
                <option value="All">Semua Pembayaran</option>
                <option value="UNPAID">Belum Bayar</option>
                <option value="PARTIALLY_PAID">Sudah DP</option>
                <option value="FULLY_PAID">Lunas</option>
              </select>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-600 mt-3">
          Menampilkan {filteredBookings.length} dari {bookings.length} booking
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#4E61D3] text-white">
                <th className="px-6 py-4 text-left text-sm font-medium">Booking #</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Event</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Tamu</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Venue</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Tanggal</th>
                <th className="px-6 py-4 text-left text-sm font-medium">PAX</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Total</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Pembayaran</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada booking ditemukan
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{booking.booking_number}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(booking.created_at).toLocaleDateString('id-ID')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{booking.event_name}</div>
                      <div className="text-xs text-gray-500">{booking.event_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{booking.guest_name}</div>
                      <div className="text-xs text-gray-500">{booking.guest_phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{booking.venue_name}</div>
                      <div className="text-xs text-gray-500">{booking.venue_type}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{formatDate(booking.event_date)}</div>
                      <div className="text-xs text-gray-500">
                        {formatTime(booking.event_start_time)} - {formatTime(booking.event_end_time)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-medium text-gray-900">{booking.confirmed_pax || booking.expected_pax}</div>
                      <div className="text-xs text-gray-500">orang</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{formatCurrency(booking.grand_total)}</div>
                      {!booking.full_payment_paid && (
                        <div className="text-xs text-gray-500">
                          Sisa: {formatCurrency(booking.remaining_amount)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                          booking.booking_status
                        )}`}
                      >
                        {booking.booking_status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPaymentStatusColor(
                          booking.payment_status
                        )}`}
                      >
                        {booking.payment_status_display}
                      </span>
                    </td>
                    <td className="px-6 py-4 relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === booking.id ? null : booking.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <MoreHorizontalIcon className="h-4 w-4 text-gray-600" />
                      </button>
                      {openMenuId === booking.id && (
                        <div className="absolute right-0 top-12 w-48 bg-white border border-gray-200 shadow-lg rounded z-10">
                          <Link
                            href={`/office/events/${booking.id}`}
                            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center space-x-2"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span>Lihat Detail</span>
                          </Link>
                          <button className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center space-x-2">
                            <PrinterIcon className="h-4 w-4" />
                            <span>Cetak Invoice</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </OfficeLayout>
  );
}
