'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';

// Dynamically import PDF button (client-side only)
const InvoiceDownloadButton = dynamic(() => import('@/components/InvoiceDownloadButton'), {
  ssr: false,
  loading: () => (
    <button className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded space-x-2">
      <span>Memuat...</span>
    </button>
  )
});
import {
  ChevronLeftIcon,
  Calendar01Icon,
  Clock01Icon,
  UserIcon,
  Building03Icon,
  PackageIcon,
  CreditCardIcon,
  PrinterIcon,
  PencilEdit02Icon,
  UserCheckIcon,
  Cancel01Icon,
  SparklesIcon,
  UserMultipleIcon,
  Mail01Icon,
  Call02Icon
} from '@/lib/icons';

interface EventBooking {
  id: number;
  booking_number: string;
  event_name: string;
  event_type: string;
  guest_name: string;
  guest_email: string;
  guest_phone: string;
  venue_name: string;
  venue_type: string;
  package_name: string;
  food_package_name: string;
  event_date: string;
  event_start_time: string;
  event_end_time: string;
  expected_pax: number;
  confirmed_pax: number;
  venue_price: string;
  food_price: string;
  equipment_price: string;
  other_charges: string;
  subtotal: string;
  tax_amount: string;
  grand_total: string;
  down_payment_amount: string;
  remaining_amount: string;
  down_payment_paid: boolean;
  full_payment_paid: boolean;
  booking_status: string;
  payment_status: string;
  booking_status_display: string;
  payment_status_display: string;
  notes: string;
  special_requests: string;
  created_at: string;
  payments: Payment[];
}

interface Payment {
  id: number;
  payment_number: string;
  payment_type: string;
  payment_method: string;
  amount: string;
  payment_date: string;
  status: string;
  notes: string;
}

export default function EventBookingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [booking, setBooking] = useState<EventBooking | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentType, setPaymentType] = useState<'DOWN_PAYMENT' | 'FULL_PAYMENT'>('DOWN_PAYMENT');
  const [paymentMethod, setPaymentMethod] = useState('TRANSFER');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const fetchBooking = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`hotel/event-bookings/${id}/`), {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setBooking(data);
      } else {
        alert('Gagal memuat data booking');
        router.push('/office/events');
      }
    } catch (error) {
      console.error('Error fetching booking:', error);
      alert('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async () => {
    if (!booking || !paymentAmount) {
      alert('Mohon isi jumlah pembayaran');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(buildApiUrl(`hotel/event-bookings/${booking.id}/record_payment/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || '',
        },
        credentials: 'include',
        body: JSON.stringify({
          payment_type: paymentType,
          payment_method: paymentMethod,
          amount: parseFloat(paymentAmount),
          notes: paymentNotes,
        }),
      });

      if (response.ok) {
        alert('Pembayaran berhasil dicatat!');
        setShowPaymentModal(false);
        fetchBooking(); // Refresh data
      } else {
        const error = await response.json();
        alert('Gagal mencatat pembayaran: ' + (error.error || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Terjadi kesalahan saat mencatat pembayaran');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirm = async () => {
    if (!booking || !confirm('Konfirmasi booking ini?')) return;

    try {
      const response = await fetch(buildApiUrl(`hotel/event-bookings/${booking.id}/confirm/`), {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrfToken() || '',
        },
        credentials: 'include',
      });

      if (response.ok) {
        alert('Booking berhasil dikonfirmasi!');
        fetchBooking();
      } else {
        const error = await response.json();
        alert('Gagal konfirmasi: ' + (error.error || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Error confirming booking:', error);
      alert('Terjadi kesalahan');
    }
  };

  const handleCancel = async () => {
    if (!booking || !confirm('Batalkan booking ini?')) return;

    try {
      const response = await fetch(buildApiUrl(`hotel/event-bookings/${booking.id}/cancel/`), {
        method: 'POST',
        headers: {
          'X-CSRFToken': getCsrfToken() || '',
        },
        credentials: 'include',
      });

      if (response.ok) {
        alert('Booking berhasil dibatalkan!');
        fetchBooking();
      } else {
        const error = await response.json();
        alert('Gagal membatalkan: ' + (error.error || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert('Terjadi kesalahan');
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
    return timeString.substring(0, 5);
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

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat data...</div>
        </div>
      </OfficeLayout>
    );
  }

  if (!booking) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Booking tidak ditemukan</div>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/office/events')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{booking.event_name}</h1>
              <p className="text-gray-600 mt-1">Booking #{booking.booking_number}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {booking.booking_status === 'PENDING' && (
              <button
                onClick={handleConfirm}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition space-x-2"
              >
                <UserCheckIcon className="h-5 w-5" />
                <span>Konfirmasi</span>
              </button>
            )}

            {booking.booking_status !== 'CANCELLED' && booking.booking_status !== 'COMPLETED' && (
              <button
                onClick={handleCancel}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition space-x-2"
              >
                <Cancel01Icon className="h-5 w-5" />
                <span>Batalkan</span>
              </button>
            )}

            {booking && <InvoiceDownloadButton booking={booking} />}
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex items-center space-x-4">
          <span
            className={`inline-flex px-3 py-1 text-sm font-medium rounded ${getStatusColor(
              booking.booking_status
            )}`}
          >
            {booking.booking_status_display}
          </span>
          <span
            className={`inline-flex px-3 py-1 text-sm font-medium rounded ${getPaymentStatusColor(
              booking.payment_status
            )}`}
          >
            {booking.payment_status_display}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <div className="bg-white border border-gray-200 rounded p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Calendar01Icon className="h-5 w-5" />
                <span>Detail Event</span>
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Tipe Event</div>
                  <div className="font-medium text-gray-900">{booking.event_type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Tanggal Event</div>
                  <div className="font-medium text-gray-900">{formatDate(booking.event_date)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Waktu Mulai</div>
                  <div className="font-medium text-gray-900">{formatTime(booking.event_start_time)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Waktu Selesai</div>
                  <div className="font-medium text-gray-900">{formatTime(booking.event_end_time)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Estimasi Tamu</div>
                  <div className="font-medium text-gray-900">{booking.expected_pax} orang</div>
                </div>
                {booking.confirmed_pax > 0 && (
                  <div>
                    <div className="text-sm text-gray-600">Tamu Terkonfirmasi</div>
                    <div className="font-medium text-gray-900">{booking.confirmed_pax} orang</div>
                  </div>
                )}
              </div>
            </div>

            {/* Guest Information */}
            <div className="bg-white border border-gray-200 rounded p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Informasi Tamu</span>
              </h2>

              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <UserMultipleIcon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Nama</div>
                    <div className="font-medium text-gray-900">{booking.guest_name}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail01Icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Email</div>
                    <div className="font-medium text-gray-900">{booking.guest_email}</div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Call02Icon className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm text-gray-600">Telepon</div>
                    <div className="font-medium text-gray-900">{booking.guest_phone}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Venue & Package */}
            <div className="bg-white border border-gray-200 rounded p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Building03Icon className="h-5 w-5" />
                <span>Venue & Paket</span>
              </h2>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Venue</div>
                  <div className="font-medium text-gray-900">{booking.venue_name} - {booking.venue_type}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Paket Venue</div>
                  <div className="font-medium text-gray-900">{booking.package_name}</div>
                </div>
                {booking.food_package_name && (
                  <div>
                    <div className="text-sm text-gray-600">Paket Makanan</div>
                    <div className="font-medium text-gray-900">{booking.food_package_name}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {(booking.notes || booking.special_requests) && (
              <div className="bg-white border border-gray-200 rounded p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Catatan</h2>

                {booking.notes && (
                  <div className="mb-3">
                    <div className="text-sm text-gray-600">Setup Notes</div>
                    <div className="text-gray-900 whitespace-pre-line">{booking.notes}</div>
                  </div>
                )}

                {booking.special_requests && (
                  <div>
                    <div className="text-sm text-gray-600">Special Requests</div>
                    <div className="text-gray-900 whitespace-pre-line">{booking.special_requests}</div>
                  </div>
                )}
              </div>
            )}

            {/* Payment History */}
            {booking.payments && booking.payments.length > 0 && (
              <div className="bg-white border border-gray-200 rounded p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <CreditCardIcon className="h-5 w-5" />
                  <span>Riwayat Pembayaran</span>
                </h2>

                <div className="space-y-3">
                  {booking.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between border-b border-gray-200 pb-3">
                      <div>
                        <div className="font-medium text-gray-900">{payment.payment_number}</div>
                        <div className="text-sm text-gray-600">
                          {payment.payment_type === 'DOWN_PAYMENT' ? 'Down Payment' : 'Pelunasan'} - {payment.payment_method}
                        </div>
                        <div className="text-xs text-gray-500">{formatDateTime(payment.payment_date)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">{formatCurrency(payment.amount)}</div>
                        <div className="text-xs text-gray-500">{payment.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Pricing & Payment */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded p-6 sticky top-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <CreditCardIcon className="h-5 w-5" />
                <span>Ringkasan Biaya</span>
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Paket Venue:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(booking.venue_price)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Paket Makanan:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(booking.food_price)}</span>
                </div>

                {parseFloat(booking.equipment_price) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Peralatan:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(booking.equipment_price)}</span>
                  </div>
                )}

                {parseFloat(booking.other_charges) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Biaya Lain:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(booking.other_charges)}</span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">{formatCurrency(booking.subtotal)}</span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Pajak (11%):</span>
                  <span className="font-medium text-gray-900">{formatCurrency(booking.tax_amount)}</span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Grand Total:</span>
                    <span className="font-bold text-[#4E61D3] text-lg">{formatCurrency(booking.grand_total)}</span>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Down Payment:</span>
                    <span className={`font-medium ${booking.down_payment_paid ? 'text-green-600' : 'text-yellow-600'}`}>
                      {formatCurrency(booking.down_payment_amount)}
                      {booking.down_payment_paid && ' ✓'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">Sisa Pelunasan:</span>
                    <span className={`font-medium ${booking.full_payment_paid ? 'text-green-600' : 'text-gray-900'}`}>
                      {formatCurrency(booking.remaining_amount)}
                      {booking.full_payment_paid && ' ✓'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Actions */}
              {!booking.full_payment_paid && booking.booking_status !== 'CANCELLED' && (
                <div className="mt-6 space-y-3">
                  {!booking.down_payment_paid && (
                    <button
                      onClick={() => {
                        setPaymentType('DOWN_PAYMENT');
                        setPaymentAmount(booking.down_payment_amount);
                        setShowPaymentModal(true);
                      }}
                      className="w-full px-4 py-3 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition font-medium"
                    >
                      Catat Down Payment
                    </button>
                  )}

                  {booking.down_payment_paid && !booking.full_payment_paid && (
                    <button
                      onClick={() => {
                        setPaymentType('FULL_PAYMENT');
                        setPaymentAmount(booking.remaining_amount);
                        setShowPaymentModal(true);
                      }}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded hover:bg-green-700 transition font-medium"
                    >
                      Catat Pelunasan
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Catat {paymentType === 'DOWN_PAYMENT' ? 'Down Payment' : 'Pelunasan'}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Metode Pembayaran
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                >
                  <option value="CASH">Cash</option>
                  <option value="TRANSFER">Bank Transfer</option>
                  <option value="CARD">Credit/Debit Card</option>
                  <option value="EDC">EDC</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan (Opsional)
                </label>
                <textarea
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  placeholder="Contoh: Transfer via BCA, ref: 1234567890"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleRecordPayment}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-[#4E61D3] text-white rounded hover:bg-[#3D4EA8] transition disabled:opacity-50 font-medium"
              >
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </OfficeLayout>
  );
}
