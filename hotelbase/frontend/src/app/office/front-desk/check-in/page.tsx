'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Calendar01Icon,
  UserIcon,
  BedIcon,
  Search02Icon,
  UserCheckIcon,
  Door01Icon,
  Cancel01Icon,
  ChevronRightIcon,
  Clock01Icon,
  Mail01Icon,
  Call02Icon,
  Location01Icon,
  AlertCircleIcon,
} from '@/lib/icons';

interface Guest {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
}

interface RoomType {
  id: number;
  name: string;
  base_price: number;
}

interface Room {
  id: number;
  number: string;
  room_type_name: string;
  floor: number;
  status: string;
  current_price: number;
}

interface Reservation {
  id: number;
  reservation_number: string;
  guest_details: Guest;
  room_type: number;
  room_type_name: string;
  room_type_details: RoomType;
  room: number | null;
  room_number: string | null;
  check_in_date: string;
  check_out_date: string;
  adults: number;
  children: number;
  status: string;
  status_display: string;
  nights: number;
  special_requests: string;
  subtotal: number;
  taxes: number;
  grand_total: number;
}

export default function CheckInPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('CONFIRMED');

  // Check-in dialog
  const [showCheckInDialog, setShowCheckInDialog] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [selectedRoom, setSelectedRoom] = useState('');

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const today = format(new Date(), 'yyyy-MM-dd');
      let url = buildApiUrl(`hotel/reservations/?check_in_date=${today}`);

      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url, {
        credentials: 'include',
      });
      const data = await response.json();
      setReservations(data.results || data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableRooms = async (roomTypeId: number, checkIn: string, checkOut: string) => {
    try {
      const response = await fetch(
        buildApiUrl(`hotel/rooms/?room_type=${roomTypeId}&status=AVAILABLE`),
        {
          credentials: 'include',
        }
      );
      const data = await response.json();
      setAvailableRooms(data.results || data);
    } catch (error) {
      console.error('Error fetching available rooms:', error);
    }
  };

  const handleCheckIn = async (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setSelectedRoom('');
    await fetchAvailableRooms(
      reservation.room_type,
      reservation.check_in_date,
      reservation.check_out_date
    );
    setShowCheckInDialog(true);
  };

  const handleConfirmCheckIn = async () => {
    if (!selectedRoom || !selectedReservation) {
      alert('Please select a room');
      return;
    }

    try {
      const csrfToken = getCsrfToken();

      // Update reservation with room assignment
      const response = await fetch(
        buildApiUrl(`hotel/reservations/${selectedReservation.id}/`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken && { 'X-CSRFToken': csrfToken }),
          },
          credentials: 'include',
          body: JSON.stringify({
            room: parseInt(selectedRoom),
            status: 'CHECKED_IN',
          }),
        }
      );

      if (response.ok) {
        alert('Check-in successful!');
        setShowCheckInDialog(false);
        fetchReservations();
      } else {
        const error = await response.json();
        alert(`Error: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error during check-in:', error);
      alert('Failed to check-in');
    }
  };

  const filteredReservations = reservations.filter((res) => {
    const matchesSearch =
      res.guest_details.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.reservation_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.room_type_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-blue-100 text-blue-800',
      CHECKED_IN: 'bg-green-100 text-green-800',
      CHECKED_OUT: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Check-In Tamu</h1>
        <p className="text-gray-600">
          Kelola check-in tamu dan assign nomor kamar
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total Hari Ini</p>
              <p className="text-3xl font-bold text-gray-900">{reservations.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar01Icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Menunggu Check-In</p>
              <p className="text-3xl font-bold text-blue-600">
                {reservations.filter((r) => r.status === 'CONFIRMED').length}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock01Icon className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Sudah Check-In</p>
              <p className="text-3xl font-bold text-green-600">
                {reservations.filter((r) => r.status === 'CHECKED_IN').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <UserCheckIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">No Show</p>
              <p className="text-3xl font-bold text-red-600">
                {reservations.filter((r) => r.status === 'NO_SHOW').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertCircleIcon className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cari Reservasi
            </label>
            <div className="relative">
              <Search02Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Nama tamu, nomor reservasi, atau tipe kamar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F87B1B] focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F87B1B] focus:border-transparent"
            >
              <option value="CONFIRMED">Confirmed ({reservations.filter(r => r.status === 'CONFIRMED').length})</option>
              <option value="CHECKED_IN">Checked In ({reservations.filter(r => r.status === 'CHECKED_IN').length})</option>
              <option value="NO_SHOW">No Show ({reservations.filter(r => r.status === 'NO_SHOW').length})</option>
              <option value="ALL">Semua ({reservations.length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reservations Table */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Memuat data...</p>
        </div>
      ) : filteredReservations.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <Calendar01Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Tidak ada reservasi untuk hari ini</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-[#F87B1B] text-white">
                <th className="px-6 py-4 text-left text-sm font-medium">No. Reservasi</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Tamu</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Tipe Kamar</th>
                <th className="px-6 py-4 text-left text-sm font-medium">No. Kamar</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Tanggal</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Tamu</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredReservations.map((reservation) => (
                <tr key={reservation.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {reservation.reservation_number}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-gray-100 rounded">
                        <UserIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {reservation.guest_details.full_name}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Mail01Icon className="h-3 w-3 mr-1" />
                          {reservation.guest_details.email}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Call02Icon className="h-3 w-3 mr-1" />
                          {reservation.guest_details.phone}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <BedIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">
                        {reservation.room_type_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {reservation.room_number ? (
                      <div className="flex items-center">
                        <Door01Icon className="h-4 w-4 text-green-600 mr-2" />
                        <span className="font-semibold text-green-600">
                          {reservation.room_number}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 italic">
                        Belum ditentukan
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900">
                        {format(new Date(reservation.check_in_date), 'dd MMM yyyy')}
                      </div>
                      <div className="text-gray-500">
                        {reservation.nights} malam
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {reservation.adults} dewasa
                      {reservation.children > 0 && `, ${reservation.children} anak`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                        reservation.status
                      )}`}
                    >
                      {reservation.status_display}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {reservation.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCheckIn(reservation)}
                        className="inline-flex items-center px-4 py-2 bg-[#F87B1B] text-white text-sm font-medium rounded-lg hover:bg-[#E06A0A] transition-colors"
                      >
                        <UserCheckIcon className="h-4 w-4 mr-2" />
                        Check-In
                      </button>
                    )}
                    {reservation.status === 'CHECKED_IN' && (
                      <span className="text-sm text-green-600 font-medium">
                        Sudah Check-In
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Check-In Dialog */}
      <Dialog.Root open={showCheckInDialog} onOpenChange={setShowCheckInDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto z-50">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-2xl font-bold text-gray-900">
                Check-In Tamu
              </Dialog.Title>
              <button
                onClick={() => setShowCheckInDialog(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <Cancel01Icon className="h-6 w-6" />
              </button>
            </div>

            {selectedReservation && (
              <div className="space-y-6">
                {/* Guest Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Informasi Tamu</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Nama</p>
                      <p className="font-medium text-gray-900">
                        {selectedReservation.guest_details.full_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">
                        {selectedReservation.guest_details.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Telepon</p>
                      <p className="font-medium text-gray-900">
                        {selectedReservation.guest_details.phone}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Kebangsaan</p>
                      <p className="font-medium text-gray-900">
                        {selectedReservation.guest_details.nationality}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Reservation Info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Detail Reservasi</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">No. Reservasi</p>
                      <p className="font-medium text-gray-900">
                        {selectedReservation.reservation_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Tipe Kamar</p>
                      <p className="font-medium text-gray-900">
                        {selectedReservation.room_type_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Check-In</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(selectedReservation.check_in_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Check-Out</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(selectedReservation.check_out_date), 'dd MMM yyyy')}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Jumlah Tamu</p>
                      <p className="font-medium text-gray-900">
                        {selectedReservation.adults} dewasa
                        {selectedReservation.children > 0 && `, ${selectedReservation.children} anak`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Durasi</p>
                      <p className="font-medium text-gray-900">
                        {selectedReservation.nights} malam
                      </p>
                    </div>
                  </div>

                  {selectedReservation.special_requests && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-gray-600 text-sm mb-1">Permintaan Khusus</p>
                      <p className="text-gray-900 text-sm">
                        {selectedReservation.special_requests}
                      </p>
                    </div>
                  )}
                </div>

                {/* Room Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Pilih Kamar yang Tersedia
                  </label>
                  {availableRooms.length === 0 ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-800">
                        Tidak ada kamar tersedia untuk tipe ini. Silakan pilih tipe kamar lain atau hubungi manager.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {availableRooms.map((room) => (
                        <button
                          key={room.id}
                          onClick={() => setSelectedRoom(room.id.toString())}
                          className={`p-4 border-2 rounded-lg text-center transition-all ${
                            selectedRoom === room.id.toString()
                              ? 'border-[#F87B1B] bg-orange-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Door01Icon
                            className={`h-6 w-6 mx-auto mb-2 ${
                              selectedRoom === room.id.toString()
                                ? 'text-[#F87B1B]'
                                : 'text-gray-400'
                            }`}
                          />
                          <div className="font-semibold text-gray-900">
                            {room.number}
                          </div>
                          <div className="text-xs text-gray-500">
                            Lantai {room.floor}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Ringkasan Pembayaran</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">
                        Rp {selectedReservation.subtotal?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pajak (11%)</span>
                      <span className="font-medium">
                        Rp {selectedReservation.taxes?.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between text-lg">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-[#F87B1B]">
                          Rp {selectedReservation.grand_total?.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowCheckInDialog(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleConfirmCheckIn}
                    disabled={!selectedRoom || availableRooms.length === 0}
                    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
                      !selectedRoom || availableRooms.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#F87B1B] text-white hover:bg-[#E06A0A]'
                    }`}
                  >
                    Konfirmasi Check-In
                  </button>
                </div>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
