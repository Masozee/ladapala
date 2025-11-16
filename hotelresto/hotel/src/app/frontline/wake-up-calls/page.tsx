'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { Clock01Icon, Add01Icon, CheckmarkCircle02Icon, Cancel01Icon, Alert01Icon, BedIcon, UserIcon } from '@/lib/icons';

interface WakeUpCall {
  id: number;
  room_number: string;
  guest_name: string;
  call_date: string;
  call_time: string;
  status: string;
  notes: string;
  requested_by_name: string;
  completed_by_name: string | null;
  completed_at: string | null;
  is_today: boolean;
  is_upcoming: boolean;
  is_overdue: boolean;
}

interface Room {
  id: number;
  number: string;
  room_type_name: string;
  current_guest?: {
    name: string;
    check_out_date: string;
  } | null;
}

interface Reservation {
  id: number;
  reservation_number: string;
  room: number;
  room_number: string;
  guest: number;
  guest_name: string;
  check_in_date: string;
  check_out_date: string;
}

export default function WakeUpCallsPage() {
  const [wakeUpCalls, setWakeUpCalls] = useState<WakeUpCall[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('PENDING');
  const [formData, setFormData] = useState({
    reservation: '',
    room: '',
    guest_name: '',
    call_date: '',
    call_time: '',
    notes: ''
  });

  const buildApiUrl = (endpoint: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    return `${baseUrl}/hotel/${endpoint}`;
  };

  useEffect(() => {
    fetchWakeUpCalls();
    fetchReservations();
  }, [filterStatus]);

  const fetchWakeUpCalls = async () => {
    setLoading(true);
    try {
      let endpoint = 'wake-up-calls/';
      if (filterStatus === 'TODAY') {
        endpoint = 'wake-up-calls/today/';
      } else if (filterStatus === 'PENDING') {
        endpoint = 'wake-up-calls/pending/';
      } else if (filterStatus) {
        endpoint = `wake-up-calls/?status=${filterStatus}`;
      }

      const response = await fetch(buildApiUrl(endpoint), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setWakeUpCalls(Array.isArray(data) ? data : data.results || []);
      }
    } catch (error) {
      console.error('Error fetching wake up calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      // Fetch current checked-in reservations
      const response = await fetch(buildApiUrl('reservations/?status=CHECKED_IN'), {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setReservations(data.results || data || []);
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const handleReservationChange = (reservationId: string) => {
    const reservation = reservations.find(r => r.id.toString() === reservationId);
    if (reservation) {
      setFormData({
        ...formData,
        reservation: reservationId,
        room: reservation.room.toString(),
        guest_name: reservation.guest_name,
        call_date: reservation.check_out_date, // Default to checkout date
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(buildApiUrl('wake-up-calls/'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        alert('Wake up call scheduled successfully!');
        setShowAddModal(false);
        setFormData({ reservation: '', room: '', guest_name: '', call_date: '', call_time: '', notes: '' });
        fetchWakeUpCalls();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to schedule wake up call');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to schedule wake up call');
    }
  };

  const markCompleted = async (id: number) => {
    try {
      const response = await fetch(buildApiUrl(`wake-up-calls/${id}/mark_completed/`), {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        fetchWakeUpCalls();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const markMissed = async (id: number) => {
    try {
      const response = await fetch(buildApiUrl(`wake-up-calls/${id}/mark_missed/`), {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        fetchWakeUpCalls();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'MISSED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Clock01Icon className="h-8 w-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Wake Up Calls</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#005357] text-white hover:bg-[#004147] transition-colors"
          >
            <Add01Icon className="h-4 w-4" />
            <span>Schedule Call</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <button
            onClick={() => setFilterStatus('TODAY')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === 'TODAY'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setFilterStatus('PENDING')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === 'PENDING'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('COMPLETED')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === 'COMPLETED'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilterStatus('')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              filterStatus === ''
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            All
          </button>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-300">
          <table className="w-full border-collapse">
            <thead className="bg-[#005357]">
              <tr>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">Room</th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">Guest</th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">Date</th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">Time</th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">Status</th>
                <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="border border-gray-300 px-6 py-12 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : wakeUpCalls.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-gray-300 px-6 py-12 text-center text-gray-500">
                    No wake up calls found
                  </td>
                </tr>
              ) : (
                wakeUpCalls.map((call) => (
                  <tr key={call.id} className={`hover:bg-gray-50 ${call.is_overdue ? 'bg-red-50' : ''}`}>
                    <td className="border border-gray-300 px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <BedIcon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{call.room_number}</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <UserIcon className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-900">{call.guest_name}</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                      {call.call_date}
                    </td>
                    <td className="border border-gray-300 px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Clock01Icon className="h-4 w-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{call.call_time}</span>
                      </div>
                    </td>
                    <td className="border border-gray-300 px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold ${getStatusColor(call.status)}`}>
                        {call.status}
                      </span>
                      {call.is_overdue && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold bg-red-100 text-red-800">
                          OVERDUE
                        </span>
                      )}
                    </td>
                    <td className="border border-gray-300 px-6 py-4">
                      {call.status === 'PENDING' && (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => markCompleted(call.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white text-sm hover:bg-green-700 transition"
                          >
                            <CheckmarkCircle02Icon className="h-4 w-4" />
                            <span>Done</span>
                          </button>
                          <button
                            onClick={() => markMissed(call.id)}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white text-sm hover:bg-red-700 transition"
                          >
                            <Cancel01Icon className="h-4 w-4" />
                            <span>Missed</span>
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

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white border border-gray-300 max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Schedule Wake Up Call</h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Guest (Checked-in)</label>
                <select
                  value={formData.reservation}
                  onChange={(e) => handleReservationChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a reservation...</option>
                  {reservations.map((res) => (
                    <option key={res.id} value={res.id}>
                      Room {res.room_number} - {res.guest_name} (Checkout: {res.check_out_date})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">Select a guest to auto-fill details</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Guest Name *</label>
                <input
                  type="text"
                  required
                  value={formData.guest_name}
                  onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Guest name"
                  readOnly={!!formData.reservation}
                />
              </div>

              <input type="hidden" value={formData.room} />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <input
                  type="date"
                  required
                  value={formData.call_date}
                  onChange={(e) => setFormData({ ...formData, call_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                <input
                  type="time"
                  required
                  value={formData.call_time}
                  onChange={(e) => setFormData({ ...formData, call_time: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Special instructions..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-[#005357] text-white hover:bg-[#004147] transition"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
