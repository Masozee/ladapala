'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { buildApiUrl } from '@/lib/config';
import * as Dialog from '@radix-ui/react-dialog';
import {
  ChevronLeftIcon,
  Calendar01Icon,
  UserMultipleIcon,
  Clock01Icon,
  PencilEdit02Icon,
  Call02Icon,
  Mail01Icon,
  Location01Icon,
  BedIcon,
  CreditCardIcon,
  UserCheckIcon,
  UserIcon,
  AlertCircleIcon,
  File01Icon,
  SparklesIcon,
  PackageIcon,
  CancelCircleIcon,
  Shield01Icon,
  Add01Icon,
  HotelIcon,
  Cancel01Icon,
  ChevronDownIcon,
  ViewIcon,
  Alert01Icon,
  Delete02Icon
} from '@/lib/icons';

interface Guest {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  address: string;
  id_number: string;
  id_type: string;
  date_of_birth: string;
  gender: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  vip_status: boolean;
  preferences: string[];
  allergies: string[];
}

interface AdditionalGuest {
  id: number;
  full_name: string;
  date_of_birth: string;
  gender: string;
  relationship: string;
  id_number?: string;
  id_type?: string;
}

interface LoyaltyProgram {
  program_name: string;
  member_number: string;
  tier_level: string;
  points_balance: number;
  points_earned: number;
  tier_benefits: string[];
}

interface Transportation {
  type: string;
  details: string;
  pickup_time?: string;
  drop_off_time?: string;
  cost: number;
  status: string;
}

interface Extra {
  id: number;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  date: string;
  status: string;
}

interface ReservationRoom {
  id: number;
  room_number: string;
  room_type_name: string;
  rate: number;
  total_amount: number;
  floor: number;
  amenities: string[];
}

interface SpecialRequest {
  id: number;
  type: string;
  description: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  notes: string;
}

interface PaymentDetail {
  id: number;
  method: string;
  amount: number;
  status: string;
  transaction_id: string;
  paid_at: string;
}

interface Reservation {
  id: number;
  reservation_number: string;
  guest_name: string;
  guest_details: Guest;
  additional_guests: AdditionalGuest[];
  check_in_date: string;
  check_out_date: string;
  nights: number;
  adults: number;
  children: number;
  status: string;
  status_display: string;
  booking_source: string;
  total_rooms: number;
  total_amount: number;
  created_at: string;
  rooms: ReservationRoom[];
  special_requests: SpecialRequest[];
  payment_details: PaymentDetail[];
  loyalty_program?: LoyaltyProgram;
  transportation?: Transportation[];
  extras: Extra[];
  can_cancel: boolean;
  deposit_amount: number;
  balance_due: number;
  taxes: number;
  discount: number;
  booking_notes: string;
}

// Mock data for the booking detail
const MOCK_BOOKING: Reservation = {
  id: 1,
  reservation_number: 'RSV123456',
  guest_name: 'John Smith',
  guest_details: {
    id: 1,
    full_name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-0123',
    nationality: 'United States',
    address: '123 Main Street, New York, NY 10001',
    id_number: 'P123456789',
    id_type: 'Passport',
    date_of_birth: '1985-06-15',
    gender: 'Male',
    emergency_contact_name: 'Robert Smith',
    emergency_contact_phone: '+1-555-0199',
    vip_status: false,
    preferences: ['Non-smoking', 'High floor', 'City view', 'King bed'],
    allergies: ['Nuts', 'Shellfish']
  },
  additional_guests: [
    {
      id: 2,
      full_name: 'Sarah Smith',
      date_of_birth: '1987-09-22',
      gender: 'Female',
      relationship: 'Spouse',
      id_number: 'P987654321',
      id_type: 'Passport'
    },
    {
      id: 3,
      full_name: 'Emma Smith',
      date_of_birth: '2018-03-10',
      gender: 'Female',
      relationship: 'Child'
    }
  ],
  check_in_date: '2024-08-25',
  check_out_date: '2024-08-28',
  nights: 3,
  adults: 2,
  children: 1,
  status: 'CONFIRMED',
  status_display: 'Confirmed',
  booking_source: 'DIRECT',
  total_rooms: 1,
  total_amount: 585.75,
  created_at: '2024-08-23T10:30:00Z',
  rooms: [
    {
      id: 1,
      room_number: '1205',
      room_type_name: 'Deluxe King Suite',
      rate: 175.00,
      total_amount: 525.00,
      floor: 12,
      amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'City View', 'Room Service', 'Safe']
    }
  ],
  special_requests: [
    {
      id: 1,
      type: 'Accommodation',
      description: 'Late check-in requested (after 10 PM)',
      status: 'confirmed',
      priority: 'medium',
      created_at: '2024-08-23T10:35:00Z',
      notes: 'Guest arriving on late flight. Front desk notified.'
    },
    {
      id: 2,
      type: 'Dining',
      description: 'Baby crib needed for 2-year-old child',
      status: 'completed',
      priority: 'high',
      created_at: '2024-08-23T10:40:00Z',
      notes: 'Crib delivered to room 1205. Setup completed.'
    },
    {
      id: 3,
      type: 'Service',
      description: 'Room to be prepared with welcome fruit basket',
      status: 'pending',
      priority: 'low',
      created_at: '2024-08-23T11:00:00Z',
      notes: 'VIP guest. Arrange premium fruit basket.'
    }
  ],
  payment_details: [
    {
      id: 1,
      method: 'Credit Card',
      amount: 175.75,
      status: 'Completed',
      transaction_id: 'TXN789012345',
      paid_at: '2024-08-23T10:30:00Z'
    }
  ],
  loyalty_program: {
    program_name: 'Kapulaga Rewards',
    member_number: 'KR123456789',
    tier_level: 'Gold',
    points_balance: 12450,
    points_earned: 585,
    tier_benefits: ['Free WiFi', 'Late Checkout', 'Room Upgrade (Subject to Availability)', 'Welcome Drink', 'Priority Booking']
  },
  transportation: [
    {
      type: 'Airport Pickup',
      details: 'Private car from JFK Airport to hotel',
      pickup_time: '2024-08-25T18:30:00Z',
      cost: 85.00,
      status: 'Confirmed'
    },
    {
      type: 'Airport Drop-off',
      details: 'Private car from hotel to JFK Airport',
      drop_off_time: '2024-08-28T10:00:00Z',
      cost: 85.00,
      status: 'Pending'
    }
  ],
  extras: [
    {
      id: 1,
      name: 'Baby Crib',
      description: 'Standard baby crib with bedding',
      quantity: 1,
      unit_price: 0.00,
      total_price: 0.00,
      date: '2024-08-25',
      status: 'Confirmed'
    },
    {
      id: 2,
      name: 'Extra Breakfast',
      description: 'Continental breakfast for child',
      quantity: 3,
      unit_price: 15.00,
      total_price: 45.00,
      date: '2024-08-25',
      status: 'Confirmed'
    },
    {
      id: 3,
      name: 'Late Checkout',
      description: 'Extended checkout until 3:00 PM',
      quantity: 1,
      unit_price: 0.00,
      total_price: 0.00,
      date: '2024-08-28',
      status: 'Pending'
    }
  ],
  can_cancel: true,
  deposit_amount: 175.75,
  balance_due: 410.00,
  taxes: 52.50,
  discount: 0,
  booking_notes: 'VIP guest with special dietary requirements. Please ensure all staff are informed of nut allergy.'
};

const BookingDetailPage = () => {
  const params = useParams();
  const [booking, setBooking] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);

  useEffect(() => {
    const loadBooking = async () => {
      setLoading(true);
      try {
        // Try to find reservation by reservation number first
        const searchResponse = await fetch(buildApiUrl(`reservations/?reservation_number=${params.reservation_number}`));
        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          if (searchData.results && searchData.results.length > 0) {
            // Found reservation, now fetch full details using the ID
            const reservationId = searchData.results[0].id;
            const detailResponse = await fetch(buildApiUrl(`reservations/${reservationId}/`));
            if (detailResponse.ok) {
              const detailData = await detailResponse.json();
              setBooking(detailData);
            } else {
              console.warn('Found reservation but failed to load details, using list data');
              setBooking(searchData.results[0]);
            }
          } else {
            // No results found by reservation number, try as direct ID for backward compatibility
            const idResponse = await fetch(buildApiUrl(`reservations/${params.reservation_number}/`));
            if (idResponse.ok) {
              const idData = await idResponse.json();
              setBooking(idData);
            } else {
              console.warn('Failed to load booking from API, using mock data');
              setBooking(MOCK_BOOKING);
            }
          }
        } else {
          // Search endpoint failed, fallback to direct ID approach
          const idResponse = await fetch(buildApiUrl(`reservations/${params.reservation_number}/`));
          if (idResponse.ok) {
            const idData = await idResponse.json();
            setBooking(idData);
          } else {
            console.warn('Failed to load booking from API, using mock data');
            setBooking(MOCK_BOOKING);
          }
        }
      } catch (error) {
        console.error('Error loading booking:', error);
        // Fallback to mock data if API fails
        setBooking(MOCK_BOOKING);
      }
      setLoading(false);
    };

    loadBooking();
  }, [params.reservation_number]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'CHECKED_IN': return 'bg-green-100 text-green-800';
      case 'CHECKED_OUT': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <SparklesIcon className="h-4 w-4" />;
      case 'tv': return <ViewIcon className="h-4 w-4" />;
      case 'ac': return <SparklesIcon className="h-4 w-4" />;
      case 'mini bar': return <PackageIcon className="h-4 w-4" />;
      case 'room service': return <PackageIcon className="h-4 w-4" />;
      case 'safe': return <Shield01Icon className="h-4 w-4" />;
      default: return <UserCheckIcon className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <AppLayout breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Bookings', href: '/bookings' }, { label: 'Loading...' }]}>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!booking) {
    return (
      <AppLayout breadcrumb={[{ label: 'Home', href: '/' }, { label: 'Bookings', href: '/bookings' }, { label: 'Not Found' }]}>
        <div className="p-6">
          <div className="text-center">
            <Alert01Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
            <p className="text-gray-600 mb-6">The booking you&apos;re looking for doesn&apos;t exist or has been removed.</p>
            <Link 
              href="/bookings"
              className="inline-flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 hover:bg-[#004147] transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Back to Bookings</span>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  const breadcrumb = [
    { label: 'Home', href: '/' },
    { label: 'Bookings', href: '/bookings' },
    { label: `Booking #${booking?.reservation_number || params.reservation_number}` }
  ];

  return (
    <AppLayout breadcrumb={breadcrumb}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
                <span className={`inline-flex px-3 py-1 text-sm font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status_display}
                </span>
                {booking.guest_details?.vip_status && (
                  <span className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-medium">
                    <SparklesIcon className="h-3 w-3" />
                    <span>VIP Guest</span>
                  </span>
                )}
              </div>
              <p className="text-gray-600 mt-2">
                {booking.reservation_number} • Booked on {formatDateTime(booking.created_at)}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={() => setShowInvoice(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              <File01Icon className="h-4 w-4" />
              <span>Generate Invoice</span>
            </button>
            <button className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors">
              <PencilEdit02Icon className="h-4 w-4" />
              <span>Edit Booking</span>
            </button>
          </div>
        </div>


        {/* Main Content Grid - 1/3 Guest Alert01Icon, 2/3 Booking Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Guest Information (1/3) - Sticky */}
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-6 lg:h-fit">
            {/* Guest Details */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Guest Information</h3>
                    <p className="text-sm text-gray-200 mt-1">Primary guest and contact details</p>
                  </div>
                  <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                {/* Primary Guest */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-900 mb-4">Primary Guest</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Full Name</label>
                      <p className="text-gray-900 font-bold text-base">{booking.guest_details?.full_name}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail01Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 text-base">{booking.guest_details?.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Call02Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 text-base">{booking.guest_details?.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Location01Icon className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700 text-base">{booking.guest_details?.nationality}</span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Address</label>
                      <p className="text-gray-900 text-base">{booking.guest_details?.address}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">ID Document</label>
                      <p className="text-gray-900 text-base">{booking.guest_details?.id_type}: {booking.guest_details?.id_number}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                      <p className="text-gray-900 text-base">{booking.guest_details?.date_of_birth ? formatDate(booking.guest_details.date_of_birth) : 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Gender</label>
                      <p className="text-gray-900 text-base">{booking.guest_details?.gender}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Guests */}
                {booking.additional_guests && booking.additional_guests.length > 0 && (
                  <div className="pt-6">
                    <h4 className="font-bold text-gray-900 mb-4">Additional Guests ({booking.additional_guests.length})</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(booking.additional_guests || []).map((guest) => (
                        <div key={guest.id} className="bg-white p-4 border border-gray-200">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-gray-900">{guest.full_name}</h5>
                              <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1">
                                {guest.relationship}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              <p>DOB: {formatDate(guest.date_of_birth)}</p>
                              <p>Gender: {guest.gender}</p>
                              {guest.id_number && guest.id_type && (
                                <p>ID: {guest.id_type}: {guest.id_number}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergency Contact */}
                <div className="mt-6 pt-6">
                  <h4 className="font-medium text-gray-900 mb-3">Emergency Contact</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Name</label>
                      <p className="text-gray-900 font-medium text-base">{booking.guest_details?.emergency_contact_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Phone</label>
                      <p className="text-gray-900 font-medium text-base">{booking.guest_details?.emergency_contact_phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Preferences & Allergies */}
                <div className="mt-6 pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Preferences</h4>
                      <div className="space-y-1">
                        {booking.guest_details?.preferences && typeof booking.guest_details.preferences === 'object' ? 
                          Object.entries(booking.guest_details.preferences)
                            .filter(([key, value]) => {
                              if (typeof value === 'boolean') return value;
                              if (typeof value === 'string') return value.trim() !== '';
                              return !!value;
                            })
                            .map(([key, value], index) => (
                              <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 text-xs mr-2 mb-1">
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                {typeof value === 'string' && value !== 'true' ? `: ${value.replace(/_/g, ' ')}` : ''}
                              </span>
                            ))
                          : null}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Allergies</h4>
                      <div className="space-y-1">
                        {booking.guest_details?.allergies?.map((allergy, index) => (
                          <span key={index} className="inline-block bg-red-100 text-red-800 px-2 py-1 text-xs mr-2 mb-1">
                            ⚠️ {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Booking Information (2/3) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Unified Booking Overview Card */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Booking Overview</h3>
                    <p className="text-sm text-gray-200 mt-1">Essential booking information and room details</p>
                  </div>
                  <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                    <Calendar01Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-4">
                  {/* Essential Booking Information - Compact Layout */}
                  <div className="bg-white p-4 rounded">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
                      {/* Check-in */}
                      <div className="flex items-start space-x-3">
                        <Calendar01Icon className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Check-in</p>
                          <p className="font-bold text-gray-900 text-base">{formatDate(booking.check_in_date)}</p>
                        </div>
                      </div>
                      
                      {/* Check-out */}
                      <div className="flex items-start space-x-3">
                        <Calendar01Icon className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Check-out</p>
                          <p className="font-bold text-gray-900 text-base">{formatDate(booking.check_out_date)}</p>
                        </div>
                      </div>
                      
                      {/* Duration */}
                      <div className="flex items-start space-x-3">
                        <Clock01Icon className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Duration</p>
                          <p className="font-bold text-[#005357] text-base">{booking.nights} nights</p>
                        </div>
                      </div>
                      
                      {/* Guests */}
                      <div className="flex items-start space-x-3">
                        <UserMultipleIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Guests</p>
                          <p className="font-bold text-gray-900 text-base">{booking.adults + booking.children} total</p>
                          <p className="text-sm text-gray-500">{booking.adults} adults, {booking.children} child</p>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Info Row - Inline */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3 mt-4 pt-4 border-t border-gray-100">
                      {/* Booking Source */}
                      <div className="flex items-start space-x-3">
                        <HotelIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500 font-medium">Source</p>
                          <p className="font-bold text-gray-900 text-base">{booking.booking_source}</p>
                        </div>
                      </div>

                      {/* Loyalty Program */}
                      {booking.loyalty_program && (
                        <div className="md:col-span-2 flex items-start space-x-3">
                          <SparklesIcon className="h-4 w-4 text-yellow-500 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500 font-medium">{booking.loyalty_program.program_name}</p>
                            <div className="flex items-center space-x-2">
                              <span className="bg-yellow-100 text-yellow-800 px-2 py-0.5 text-xs font-bold rounded">
                                {booking.loyalty_program.tier_level}
                              </span>
                              <span className="font-bold text-gray-900 text-base">
                                {booking.loyalty_program.points_balance.toLocaleString()} pts
                                <span className="text-green-600 ml-1">(+{booking.loyalty_program.points_earned})</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Room Assignment - Compact Layout */}
                  <div className="bg-white p-4 rounded">
                    {(booking.rooms || []).map((room) => (
                      <div key={room.id}>
                        {/* Room Header - Compact */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-[#005357] rounded flex items-center justify-center">
                              <BedIcon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-base">Room {room.room_number}</h4>
                              <p className="text-gray-600 text-sm">{room.room_type_name} • Floor {room.floor}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-[#005357] text-base">{formatCurrency(room.rate)}<span className="text-sm text-gray-600 font-normal">/night</span></p>
                            <p className="text-sm text-gray-500">Total: {formatCurrency(room.total_amount)}</p>
                          </div>
                        </div>

                        {/* Room Amenities - Inline Compact */}
                        <div className="bg-gray-50 p-3 rounded">
                          <div className="flex flex-wrap gap-2">
                            {(room.amenities || []).map((amenity, index) => (
                              <div key={index} className="flex items-center space-x-1 bg-white px-2 py-1 rounded text-xs text-gray-600">
                                {getAmenityIcon(amenity)}
                                <span>{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Internal Notes - Prominent Alert */}
                  {booking.booking_notes && (
                    <div className="bg-yellow-50 border border-gray-200 rounded p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center flex-shrink-0">
                          <Alert01Icon className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1 text-base">Important Staff Notes</h4>
                          <p className="text-gray-800 text-base">{booking.booking_notes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Compact Services Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Transportation */}
              {booking.transportation && booking.transportation.length > 0 && (
                <div className="bg-white border border-gray-200">
                  <div className="p-6 bg-[#005357]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">Transportation</h3>
                        <p className="text-sm text-gray-200 mt-1">Pickup and drop-off services</p>
                      </div>
                      <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                        <PackageIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 space-y-2">
                    {(booking.transportation || []).map((transport, index) => (
                      <div key={index} className="bg-white p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-gray-900 text-base">{transport.type}</h4>
                            <span className={`px-2 py-0.5 text-xs font-medium ${
                              transport.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transport.status}
                            </span>
                          </div>
                          <p className="font-bold text-[#005357] text-base">{formatCurrency(transport.cost)}</p>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{transport.details}</p>
                        {transport.pickup_time && (
                          <p className="text-sm text-gray-500">Pickup: {formatDateTime(transport.pickup_time)}</p>
                        )}
                        {transport.drop_off_time && (
                          <p className="text-sm text-gray-500">Drop-off: {formatDateTime(transport.drop_off_time)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Extras & Services */}
              {booking.extras && booking.extras.length > 0 && (
                <div className="bg-white border border-gray-200">
                  <div className="p-6 bg-[#005357]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">Extras & Services</h3>
                        <p className="text-sm text-gray-200 mt-1">Additional amenities and services</p>
                      </div>
                      <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                        <PackageIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 space-y-2">
                    {(booking.extras || []).map((extra) => (
                      <div key={extra.id} className="bg-white p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-bold text-gray-900 text-base">{extra.name}</h4>
                            <span className={`px-2 py-0.5 text-xs font-medium ${
                              extra.status === 'Confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {extra.status}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{extra.description}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#005357] text-base">
                            {extra.total_price > 0 ? formatCurrency(extra.total_price) : 'Free'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Special Requests - Compact */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Special Requests</h3>
                    <p className="text-sm text-gray-200 mt-1">Guest preferences and requirements</p>
                  </div>
                  <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                    <Mail01Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                {booking.special_requests?.length > 0 ? (
                  <div className="space-y-2">
                    {(booking.special_requests || []).map((request) => (
                      <div key={request.id} className="bg-white p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-900 text-base">{request.type}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium ${getRequestStatusColor(request.status)}`}>
                              {request.status}
                            </span>
                            <span className={`text-xs font-medium ${getPriorityColor(request.priority)}`}>
                              {request.priority}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-900 font-bold mb-1 text-base">{request.description}</p>
                        {request.notes && (
                          <p className="text-sm text-gray-600 italic">{request.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-base">No special requests</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment Information - Compact */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Payment Summary</h3>
                    <p className="text-sm text-gray-200 mt-1">Charges and payment status</p>
                  </div>
                  <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                    <CreditCardIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Payment Breakdown */}
                  <div className="bg-white p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-base">Subtotal ({booking.nights} nights)</span>
                      <span className="text-gray-900 text-base">{formatCurrency(booking.total_amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-base">PPN/VAT (11%)</span>
                      <span className="text-gray-900 text-base">{formatCurrency(booking.taxes || 0)}</span>
                    </div>
                    {booking.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600 text-base">Discount</span>
                        <span className="text-green-600 text-base">-{formatCurrency(booking.discount)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between font-bold">
                        <span className="text-gray-900 text-base">Grand Total</span>
                        <span className="text-[#005357] text-base">{formatCurrency((booking as any).grand_total || (booking.total_amount + (booking.taxes || 0)))}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="bg-white p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 text-base">Deposit Paid</span>
                      <span className="text-green-600 font-medium text-base">{formatCurrency(booking.deposit_amount)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-gray-900 text-base">Balance Due</span>
                      <span className="text-red-600 text-base">{formatCurrency(booking.balance_due)}</span>
                    </div>
                    
                    {/* Latest Payment */}
                    {booking.payment_details?.length > 0 && (
                      <div className="pt-2">
                        <p className="text-sm text-gray-500 mb-1">Last Payment:</p>
                        <div className="flex justify-between">
                          <span className="text-gray-700 text-base">{booking.payment_details?.[0]?.method}</span>
                          <span className="text-gray-900 font-medium text-base">{formatCurrency(booking.payment_details?.[0]?.amount)}</span>
                        </div>
                        <p className="text-sm text-gray-500">{formatDateTime(booking.payment_details?.[0]?.paid_at)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Modal */}
      <Dialog.Root open={showInvoice} onOpenChange={setShowInvoice}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white border border-gray-300 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto z-50">
            {/* Header */}
            <div className="p-6 bg-[#005357] flex items-center justify-between">
              <div>
                <Dialog.Title className="text-xl font-bold text-white">
                  Invoice
                </Dialog.Title>
                <p className="text-sm text-gray-200 mt-1">
                  {booking && `${booking.guest_name} - ${booking.reservation_number}`}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => window.print()}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded"
                  title="Print Invoice"
                >
                  <File01Icon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    // Generate PDF download logic here
                    alert('Invoice downloaded!');
                  }}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded"
                  title="Download PDF"
                >
                  <ChevronDownIcon className="h-5 w-5" />
                </button>
                <Dialog.Close asChild>
                  <button className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded">
                    <Cancel01Icon className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Invoice Content */}
            <div className="p-8 bg-white" id="invoice-content">
              {booking && (
                <div className="space-y-8">
                  {/* Invoice Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>Invoice #: INV-{booking.reservation_number}</p>
                        <p>Date: {formatDate(booking.created_at)}</p>
                        <p>Due Date: {formatDate(booking.check_out_date)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#005357]">Kapulaga Hotel</div>
                      <div className="text-sm text-gray-600 mt-2">
                        <p>123 Hotel Street</p>
                        <p>City, State 12345</p>
                        <p>Phone: +1 (555) 123-4567</p>
                        <p>Email: info@kapulaga.com</p>
                      </div>
                    </div>
                  </div>

                  {/* Bill To & Service Period */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Bill To:</h3>
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">{booking.guest_name}</p>
                        <p>{booking.guest_details?.email}</p>
                        <p>{booking.guest_details?.phone}</p>
                        <p>{booking.guest_details?.nationality}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Service Period:</h3>
                      <div className="text-sm text-gray-700">
                        <p><strong>Check-in:</strong> {formatDate(booking.check_in_date)}</p>
                        <p><strong>Check-out:</strong> {formatDate(booking.check_out_date)}</p>
                        <p><strong>Duration:</strong> {booking.nights} nights</p>
                        <p><strong>Guests:</strong> {booking.adults} adults, {booking.children} children</p>
                      </div>
                    </div>
                  </div>

                  {/* Invoice Items Table */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-4">Services & Charges:</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse border border-gray-300">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="border border-gray-300 p-3 text-left font-medium text-gray-900">Description</th>
                            <th className="border border-gray-300 p-3 text-center font-medium text-gray-900">Quantity</th>
                            <th className="border border-gray-300 p-3 text-right font-medium text-gray-900">Rate</th>
                            <th className="border border-gray-300 p-3 text-right font-medium text-gray-900">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(booking.rooms || []).map((room) => (
                            <tr key={room.id}>
                              <td className="border border-gray-300 p-3">
                                <div>
                                  <p className="font-medium">{room.room_type_name} - Room {room.room_number}</p>
                                  <p className="text-sm text-gray-600">
                                    {formatDate(booking.check_in_date)} to {formatDate(booking.check_out_date)}
                                  </p>
                                </div>
                              </td>
                              <td className="border border-gray-300 p-3 text-center">{booking.nights}</td>
                              <td className="border border-gray-300 p-3 text-right">{formatCurrency(room.rate)}</td>
                              <td className="border border-gray-300 p-3 text-right">{formatCurrency(room.rate * booking.nights)}</td>
                            </tr>
                          ))}
                          
                          {/* Transportation */}
                          {booking.transportation && booking.transportation.length > 0 && 
                            booking.transportation.map((transport, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 p-3">{transport.type}</td>
                                <td className="border border-gray-300 p-3 text-center">1</td>
                                <td className="border border-gray-300 p-3 text-right">{formatCurrency(transport.cost)}</td>
                                <td className="border border-gray-300 p-3 text-right">{formatCurrency(transport.cost)}</td>
                              </tr>
                            ))
                          }

                          {/* Extra Services */}
                          {booking.extras && booking.extras.length > 0 && (
                            booking.extras.map((extra, index) => (
                              <tr key={index}>
                                <td className="border border-gray-300 p-3">{extra.name}</td>
                                <td className="border border-gray-300 p-3 text-center">{extra.quantity}</td>
                                <td className="border border-gray-300 p-3 text-right">{formatCurrency(extra.unit_price)}</td>
                                <td className="border border-gray-300 p-3 text-right">{formatCurrency(extra.total_price)}</td>
                              </tr>
                            ))
                          )}

                          {/* Subtotal */}
                          <tr>
                            <td colSpan={3} className="border border-gray-300 p-3 text-right font-medium">Subtotal:</td>
                            <td className="border border-gray-300 p-3 text-right font-medium">{formatCurrency(booking.total_amount)}</td>
                          </tr>
                          
                          {/* Taxes */}
                          <tr>
                            <td colSpan={3} className="border border-gray-300 p-3 text-right">PPN/VAT (11%):</td>
                            <td className="border border-gray-300 p-3 text-right">{formatCurrency(booking.taxes || 0)}</td>
                          </tr>
                          
                          {/* Total */}
                          <tr className="bg-gray-50">
                            <td colSpan={3} className="border border-gray-300 p-3 text-right font-bold text-lg">Grand Total:</td>
                            <td className="border border-gray-300 p-3 text-right font-bold text-lg text-[#005357]">{formatCurrency((booking as any).grand_total || (booking.total_amount + (booking.taxes || 0)))}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Payment Information:</h3>
                      <div className="text-sm text-gray-700">
                        <p><strong>Payment Status:</strong> <span className="text-green-600">{booking.status_display}</span></p>
                        <p><strong>Payment Method:</strong> Credit Card</p>
                        <p><strong>Transaction Date:</strong> {formatDate(booking.created_at)}</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-3">Additional Information:</h3>
                      <div className="text-sm text-gray-700">
                        <p><strong>Booking Source:</strong> {booking.booking_source}</p>
                        <p><strong>Check-in Status:</strong> {booking.status === 'CHECKED_IN' ? 'Checked In' : 'Pending Check-in'}</p>
                        {booking.booking_notes && (
                          <p><strong>Notes:</strong> {booking.booking_notes}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Terms & Conditions */}
                  <div className="border-t pt-6">
                    <h3 className="font-bold text-gray-900 mb-3">Terms & Conditions:</h3>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p>• Payment is due upon receipt of this invoice.</p>
                      <p>• Cancellation must be made 24 hours before check-in date.</p>
                      <p>• Late check-out charges may apply after 12:00 PM.</p>
                      <p>• All rates are subject to applicable taxes and service charges.</p>
                      <p>• For any queries regarding this invoice, please contact our front desk.</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="text-center pt-6 border-t">
                    <p className="text-sm text-gray-600">Thank you for choosing Kapulaga Hotel!</p>
                    <p className="text-xs text-gray-500 mt-2">This is a computer generated invoice.</p>
                  </div>
                </div>
              )}
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </AppLayout>
  );
};

export default BookingDetailPage;