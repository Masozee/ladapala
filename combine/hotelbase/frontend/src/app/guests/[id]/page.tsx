'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { buildApiUrl } from '@/lib/config';
import {
  UserIcon,
  Mail01Icon,
  Call02Icon,
  Location01Icon,
  Calendar01Icon,
  SparklesIcon,
  CreditCardIcon,
  PackageIcon,
  ChevronLeftIcon,
  PencilEdit02Icon,
  Clock01Icon,
  HotelIcon,
  Cancel01Icon,
  UserCheckIcon
} from '@/lib/icons';

interface GuestDetail {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  date_of_birth: string | null;
  gender: string;
  gender_display: string;
  nationality: string | null;
  id_type: string;
  id_type_display: string;
  id_number: string | null;
  address: string | null;
  preferences: string | null;
  allergies: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  is_vip: boolean;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

interface Reservation {
  id: number;
  reservation_number: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  status_display: string;
  total_amount: string | null;
  grand_total: number;
  nights: number;
  room_number: string;
  room_type_name: string;
}

export default function GuestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const guestId = params?.id as string;

  const [guest, setGuest] = useState<GuestDetail | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guestId) return;

    const fetchGuestData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch guest details
        const guestResponse = await fetch(buildApiUrl(`hotel/guests/${guestId}/`), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!guestResponse.ok) {
          throw new Error(`Failed to fetch guest: ${guestResponse.status}`);
        }

        const guestData = await guestResponse.json();
        setGuest(guestData);

        // Fetch guest reservations
        const reservationsResponse = await fetch(
          buildApiUrl(`hotel/reservations/?guest=${guestId}`),
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
          }
        );

        if (reservationsResponse.ok) {
          const reservationsData = await reservationsResponse.json();
          setReservations(reservationsData.results || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guest data');
        console.error('Error fetching guest data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuestData();
  }, [guestId]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(numAmount);
  };

  const getLoyaltyLevel = (points: number) => {
    if (points >= 5000) return { level: 'Diamond', color: 'bg-blue-100 text-blue-800' };
    if (points >= 2500) return { level: 'Platinum', color: 'bg-purple-100 text-purple-800' };
    if (points >= 1000) return { level: 'Gold', color: 'bg-yellow-100 text-yellow-800' };
    if (points >= 500) return { level: 'Silver', color: 'bg-gray-100 text-gray-800' };
    return { level: 'Bronze', color: 'bg-orange-100 text-orange-800' };
  };

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'CONFIRMED':
        return 'bg-blue-100 text-blue-800';
      case 'CHECKED_IN':
        return 'bg-green-100 text-green-800';
      case 'CHECKED_OUT':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      case 'NO_SHOW':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4E61D3] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading guest details...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error || !guest) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-8">
          <div className="bg-red-50 border border-red-200 rounded p-6">
            <div className="flex items-center mb-4">
              <Cancel01Icon className="h-6 w-6 text-red-400 mr-3" />
              <h2 className="text-lg font-bold text-red-800">Error Loading Guest</h2>
            </div>
            <p className="text-red-700 mb-4">{error || 'Guest not found'}</p>
            <button
              onClick={() => router.push('/office/guests')}
              className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              Back to Guests
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const loyaltyInfo = getLoyaltyLevel(guest.loyalty_points);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/office/guests')}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{guest.full_name}</h1>
              <p className="text-gray-600 mt-1">Guest Profile & Stay History</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/office/guests/${guestId}/edit`)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#4E61D3] text-white hover:bg-[#3D4EA8] transition-colors"
          >
            <PencilEdit02Icon className="h-4 w-4" />
            <span>Edit Profile</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Guest Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                  <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                    <p className="text-base text-gray-900">{guest.full_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <div className="flex items-center space-x-2">
                      <Mail01Icon className="h-4 w-4 text-gray-400" />
                      <p className="text-base text-gray-900">{guest.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                    <div className="flex items-center space-x-2">
                      <Call02Icon className="h-4 w-4 text-gray-400" />
                      <p className="text-base text-gray-900">{guest.phone}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Date of Birth</label>
                    <div className="flex items-center space-x-2">
                      <Calendar01Icon className="h-4 w-4 text-gray-400" />
                      <p className="text-base text-gray-900">{formatDate(guest.date_of_birth)}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Gender</label>
                    <p className="text-base text-gray-900">{guest.gender_display}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Nationality</label>
                    <div className="flex items-center space-x-2">
                      <Location01Icon className="h-4 w-4 text-gray-400" />
                      <p className="text-base text-gray-900">{guest.nationality || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">ID Type</label>
                    <p className="text-base text-gray-900">{guest.id_type_display}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">ID Number</label>
                    <p className="text-base text-gray-900">{guest.id_number || 'N/A'}</p>
                  </div>
                </div>

                {guest.address && (
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Address</label>
                    <p className="text-base text-gray-900">{guest.address}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Emergency Contact */}
            {(guest.emergency_contact_name || guest.emergency_contact_phone) && (
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Emergency Contact</h2>
                    <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                      <Call02Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {guest.emergency_contact_name && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Contact Name</label>
                        <p className="text-base text-gray-900">{guest.emergency_contact_name}</p>
                      </div>
                    )}
                    {guest.emergency_contact_phone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Contact Phone</label>
                        <p className="text-base text-gray-900">{guest.emergency_contact_phone}</p>
                      </div>
                    )}
                    {guest.emergency_contact_relation && (
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Relation</label>
                        <p className="text-base text-gray-900">{guest.emergency_contact_relation}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Preferences & Allergies */}
            {(guest.preferences || guest.allergies) && (
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Preferences & Special Requirements</h2>
                    <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                      <PackageIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  {guest.preferences && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Preferences</label>
                      <p className="text-base text-gray-900">{guest.preferences}</p>
                    </div>
                  )}
                  {guest.allergies && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Allergies</label>
                      <p className="text-base text-gray-900 text-red-600">{guest.allergies}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reservation History */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Reservation History</h2>
                  <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                    <HotelIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                {reservations.length === 0 ? (
                  <div className="text-center py-8">
                    <HotelIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600">No reservation history</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reservations.map((reservation) => (
                      <div
                        key={reservation.id}
                        className="border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-bold text-gray-900">
                                {reservation.reservation_number}
                              </h3>
                              <span
                                className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(
                                  reservation.status
                                )}`}
                              >
                                {reservation.status_display}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <span className="text-gray-500">Check-in:</span>
                                <span className="ml-2 text-gray-900">
                                  {formatDate(reservation.check_in_date)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Check-out:</span>
                                <span className="ml-2 text-gray-900">
                                  {formatDate(reservation.check_out_date)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Room:</span>
                                <span className="ml-2 text-gray-900">
                                  {reservation.room_number || 'N/A'} - {reservation.room_type_name || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Nights:</span>
                                <span className="ml-2 text-gray-900">{reservation.nights}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-[#4E61D3]">
                              {formatCurrency(reservation.grand_total || 0)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Summary Cards */}
          <div className="space-y-6">
            {/* VIP Status */}
            {guest.is_vip && (
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 p-6">
                <div className="flex items-center justify-center mb-4">
                  <SparklesIcon className="h-12 w-12 text-yellow-600 fill-current" />
                </div>
                <h3 className="text-center text-lg font-bold text-yellow-900 mb-2">VIP Guest</h3>
                <p className="text-center text-sm text-yellow-800">
                  This guest has VIP status and should receive premium service
                </p>
              </div>
            )}

            {/* Loyalty Rewards */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Loyalty Rewards</h3>
                  <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="text-center mb-6">
                  <div
                    className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded ${loyaltyInfo.color} mb-3`}
                  >
                    <SparklesIcon className="h-4 w-4" />
                    <span>{loyaltyInfo.level} Member</span>
                  </div>
                  <p className="text-3xl font-bold text-[#4E61D3]">{guest.loyalty_points.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Loyalty Points</p>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Number:</span>
                    <span className="font-medium text-gray-900">
                      KR{guest.id.toString().padStart(9, '0')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Member Since:</span>
                    <span className="font-medium text-gray-900">{formatDate(guest.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Quick Stats</h3>
                  <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                    <PackageIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-50">
                    <div className="text-2xl font-bold text-[#4E61D3]">{reservations.length}</div>
                    <div className="text-sm text-gray-600">Total Reservations</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50">
                    <div className="text-2xl font-bold text-[#4E61D3]">
                      {reservations.reduce((sum, r) => sum + (r.nights || 0), 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Nights</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50">
                    <div className="text-2xl font-bold text-[#4E61D3]">
                      {formatCurrency(
                        reservations.reduce((sum, r) => sum + (r.grand_total || 0), 0)
                      )}
                    </div>
                    <div className="text-sm text-gray-600">Total Spent</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">Account Info</h3>
                  <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                    <Clock01Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600 block mb-1">Created At</span>
                    <span className="font-medium text-gray-900">{formatDate(guest.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-1">Last Updated</span>
                    <span className="font-medium text-gray-900">{formatDate(guest.updated_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
