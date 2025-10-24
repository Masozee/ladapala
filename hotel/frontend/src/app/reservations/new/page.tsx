'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { buildApiUrl } from '@/lib/config';
import {
  Search02Icon,
  Add01Icon,
  UserIcon,
  Calendar01Icon,
  Location01Icon,
  Call02Icon,
  Mail01Icon,
  IdCard,
  ChevronLeftIcon,
  UserCheckIcon,
  Clock01Icon,
  BedIcon,
  UserMultipleIcon,
  CreditCardIcon,
  File01Icon,
  Cancel01Icon,
  SparklesIcon
} from '@/lib/icons';

interface Guest {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  id_type?: string;
  id_number?: string;
  address?: string;
  is_vip?: boolean;
  loyalty_points?: number;
  created_at: string;
}

interface Room {
  id: number;
  number: string;
  room_type_name: string;
  floor: number;
  status: string;
  current_price: number;
  base_price: number;
  max_occupancy: number;
  room_type?: {
    max_occupancy: number;
    base_price: number;
  };
  availability_7_days?: Array<{
    date: string;
    day_name: string;
    available: boolean;
    price: number;
  }>;
  pricing_info?: {
    currency: string;
    price_includes: string[];
    price_excludes: string[];
  };
}

export default function NewReservationPage() {
  const router = useRouter();
  
  // Customer search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Guest[]>([]);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomSearchLoading, setRoomSearchLoading] = useState(false);
  const [showSpecialRequests, setShowSpecialRequests] = useState(false);

  // Predefined special request options
  const specialRequestOptions = [
    'Early check-in (before 2 PM)',
    'Late check-out (after 12 PM)',
    'High floor room',
    'Ground floor room',
    'Room with city view',
    'Room with garden view',
    'Twin beds (2 single beds)',
    'King size bed',
    'Extra pillows',
    'Extra towels',
    'Baby crib',
    'Wheelchair accessible room',
    'Non-smoking room',
    'Quiet room (away from elevator)',
    'Room near elevator',
    'Extra blankets',
    'Mini fridge stocking',
    'Welcome fruit basket',
    'Birthday celebration setup',
    'Anniversary celebration setup',
    'Business meeting setup',
    'Airport transfer service'
  ];

  // Form data
  const [formData, setFormData] = useState({
    guest: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      nationality: '',
      date_of_birth: '',
      gender: '',
      id_type: 'passport',
      id_number: '',
      address: '',
      is_return_customer: false,
      previous_stay_date: '',
      loyalty_number: '',
      // Additional fields
      preferences: '',
      allergies: '',
      emergency_contact_name: '',
      emergency_contact_phone: '',
      emergency_contact_relation: ''
    },
    check_in_date: '',
    check_out_date: '',
    adults: 1,
    children: 0,
    special_requests: '',
    booking_source: 'DIRECT',
    notes: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Search customers
  const searchCustomers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`hotel/guests/?search=${encodeURIComponent(query)}`));
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || data);
      }
    } catch (error) {
      console.error('Error searching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create new guest
  const createNewGuest = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('hotel/guests/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData.guest),
      });

      if (response.ok) {
        const newGuest = await response.json();
        setSelectedGuest(newGuest);
        setShowNewGuestForm(false);
        // Reset search
        setSearchQuery('');
        setSearchResults([]);
      } else {
        alert('Failed to create customer. Please try again.');
      }
    } catch (error) {
      console.error('Error creating guest:', error);
      alert('Failed to create customer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Search available rooms
  const searchAvailableRooms = async () => {
    if (!formData.check_in_date || !formData.check_out_date) {
      alert('Please select check-in and check-out dates');
      return;
    }

    try {
      setRoomSearchLoading(true);
      setAvailableRooms([]);
      
      // Calculate number of nights
      const checkIn = new Date(formData.check_in_date);
      const checkOut = new Date(formData.check_out_date);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
      
      if (nights <= 0) {
        alert('Check-out date must be after check-in date');
        return;
      }

      // Fetch all rooms
      const response = await fetch(buildApiUrl('hotel/rooms/'));
      if (response.ok) {
        const data = await response.json();
        const rooms = data.results || data;
        
        // Filter eligible rooms first
        const eligibleRooms = rooms.filter((room: any) => {
          return room.is_active && 
                 room.status === 'AVAILABLE' && 
                 (formData.adults + formData.children) <= room.max_occupancy;
        });

        console.log(`Found ${eligibleRooms.length} eligible rooms`);
        
        // Add basic room info with calculated total cost
        const roomsWithPricing = eligibleRooms.slice(0, 20).map((room: any) => ({
          ...room,
          nights: nights,
          total_cost: room.base_price * nights,
          current_price: room.base_price
        }));

        setAvailableRooms(roomsWithPricing);
      }
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      alert('Failed to search available rooms. Please try again.');
    } finally {
      setRoomSearchLoading(false);
    }
  };

  // Create reservation
  const createReservation = async () => {
    if (!selectedGuest) {
      alert('Please select or create a customer');
      return;
    }
    
    if (!selectedRoom) {
      alert('Please select a room');
      return;
    }

    if (!formData.check_in_date || !formData.check_out_date) {
      alert('Please select check-in and check-out dates');
      return;
    }

    try {
      setLoading(true);

      const reservationPayload = {
        guest: selectedGuest.id,
        room: selectedRoom.id,
        check_in_date: formData.check_in_date,
        check_out_date: formData.check_out_date,
        adults: formData.adults,
        children: formData.children,
        special_requests: formData.special_requests,
        booking_source: formData.booking_source,
        notes: formData.notes
      };

      const response = await fetch(buildApiUrl('hotel/reservations/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationPayload),
      });

      if (response.ok) {
        const newReservation = await response.json();
        alert(`Reservation created successfully! Reservation number: ${newReservation.reservation_number}`);
        router.push(`/bookings/${newReservation.reservation_number}`);
      } else {
        const errorData = await response.json();
        alert(`Failed to create reservation: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchQuery) {
        searchCustomers(searchQuery);
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Auto-search rooms when dates change
  useEffect(() => {
    if (formData.check_in_date && formData.check_out_date) {
      searchAvailableRooms();
    }
  }, [formData.check_in_date, formData.check_out_date, formData.adults, formData.children]);

  const breadcrumb = [
    { label: 'Home', href: '/' },
    { label: 'Bookings', href: '/bookings' },
    { label: 'New Reservation' }
  ];

  return (
    <AppLayout breadcrumb={breadcrumb}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => router.push('/bookings')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Back to Bookings
          </button>
        </div>
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">New Reservation</h1>
          <p className="text-gray-600">Create a new booking for a guest</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Customer & Booking Details */}
          <div className="space-y-6">
            {/* Customer Selection */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Customer Selection</h3>
                    <p className="text-sm text-gray-200 mt-1">Search existing customer or create new</p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50">
                {selectedGuest ? (
                  <div className="bg-green-50 border border-green-200 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          selectedGuest.is_vip ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {selectedGuest.is_vip ? <SparklesIcon className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 flex items-center">
                            {selectedGuest.full_name}
                            {selectedGuest.is_vip && (
                              <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">VIP</span>
                            )}
                          </p>
                          <div className="text-sm text-gray-600">
                            <span>{selectedGuest.email}</span> • <span>{selectedGuest.phone}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedGuest(null);
                          setSearchQuery('');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Cancel01Icon className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Search */}
                    <div className="relative">
                      <Search02Icon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, email, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                      />
                    </div>

                    {/* Search Results */}
                    {loading && searchQuery && (
                      <div className="text-center py-4">
                        <Clock01Icon className="h-4 w-4 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Searching...</p>
                      </div>
                    )}

                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {searchResults.map((guest) => (
                          <div
                            key={guest.id}
                            onClick={() => setSelectedGuest(guest)}
                            className="flex items-center justify-between p-3 bg-white hover:bg-gray-100 cursor-pointer border"
                          >
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                guest.is_vip ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-200 text-gray-600'
                              }`}>
                                {guest.is_vip ? <SparklesIcon className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {guest.full_name}
                                  {guest.is_vip && <span className="ml-1 text-xs bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded">VIP</span>}
                                </p>
                                <p className="text-xs text-gray-500">{guest.email}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Create New Customer */}
                    <div className="border-t pt-4">
                      <button
                        onClick={() => setShowNewGuestForm(!showNewGuestForm)}
                        className="w-full flex items-center justify-center px-4 py-2 border border-[#005357] text-[#005357] hover:bg-[#005357] hover:text-white transition-colors"
                      >
                        <Add01Icon className="h-4 w-4 mr-2" />
                        Create New Customer
                      </button>
                    </div>

                    {/* New Customer Form */}
                    {showNewGuestForm && (
                      <div className="border border-gray-200 p-4 bg-white space-y-4">
                        <h4 className="font-medium text-gray-800">New Customer Information</h4>
                        
                        {/* Return Customer Check */}
                        <div className="flex items-center space-x-3 p-3 bg-blue-50">
                          <input
                            type="checkbox"
                            id="return_customer"
                            checked={formData.guest.is_return_customer}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              guest: { ...prev.guest, is_return_customer: e.target.checked }
                            }))}
                            className="w-4 h-4 text-[#005357] rounded"
                          />
                          <label htmlFor="return_customer" className="text-sm font-medium text-blue-800">
                            ✓ Return Customer
                          </label>
                        </div>

                        {formData.guest.is_return_customer && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Previous Stay</label>
                              <input
                                type="date"
                                value={formData.guest.previous_stay_date}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  guest: { ...prev.guest, previous_stay_date: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Loyalty Number</label>
                              <input
                                type="text"
                                value={formData.guest.loyalty_number}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  guest: { ...prev.guest, loyalty_number: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                                placeholder="KR123456"
                              />
                            </div>
                          </div>
                        )}

                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                            <input
                              type="text"
                              required
                              value={formData.guest.first_name}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, first_name: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                              placeholder="First name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                            <input
                              type="text"
                              required
                              value={formData.guest.last_name}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, last_name: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                              placeholder="Last name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                            <input
                              type="date"
                              required
                              value={formData.guest.date_of_birth}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, date_of_birth: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <select
                              value={formData.guest.gender}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, gender: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                            >
                              <option value="">Select gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input
                              type="email"
                              required
                              value={formData.guest.email}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, email: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                              placeholder="guest@email.com"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                            <input
                              type="tel"
                              required
                              value={formData.guest.phone}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, phone: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                              placeholder="+62-812-1111-0001"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                            <input
                              type="text"
                              value={formData.guest.nationality}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, nationality: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                              placeholder="Indonesian"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                            <select
                              required
                              value={formData.guest.id_type}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, id_type: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                            >
                              <option value="passport">Passport</option>
                              <option value="national_id">National ID</option>
                              <option value="ktp">KTP (Indonesian ID)</option>
                              <option value="kitas">KITAS</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Document Number *</label>
                            <input
                              type="text"
                              required
                              value={formData.guest.id_number}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, id_number: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                              placeholder="Document number"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <textarea
                            value={formData.guest.address}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              guest: { ...prev.guest, address: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                            placeholder="Full address"
                            rows={2}
                          />
                        </div>

                        {/* Preferences and Allergies */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preferences</label>
                            <textarea
                              value={formData.guest.preferences}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, preferences: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                              placeholder="Room preferences, bed type, floor preference, etc."
                              rows={2}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                            <textarea
                              value={formData.guest.allergies}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, allergies: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                              placeholder="Food allergies, medical conditions, etc."
                              rows={2}
                            />
                          </div>
                        </div>

                        {/* Emergency Contact Information */}
                        <div className="border-t pt-4 mt-4">
                          <h5 className="font-medium text-gray-800 mb-3">Emergency Contact</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                              <input
                                type="text"
                                value={formData.guest.emergency_contact_name}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  guest: { ...prev.guest, emergency_contact_name: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                                placeholder="Emergency contact full name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                              <input
                                type="tel"
                                value={formData.guest.emergency_contact_phone}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  guest: { ...prev.guest, emergency_contact_phone: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                                placeholder="+62-812-1111-0002"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                              <select
                                value={formData.guest.emergency_contact_relation}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  guest: { ...prev.guest, emergency_contact_relation: e.target.value }
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                              >
                                <option value="">Select relation</option>
                                <option value="spouse">Spouse</option>
                                <option value="parent">Parent</option>
                                <option value="child">Child</option>
                                <option value="sibling">Sibling</option>
                                <option value="friend">Friend</option>
                                <option value="colleague">Colleague</option>
                                <option value="other">Other</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-3 border-t">
                          <button
                            onClick={() => setShowNewGuestForm(false)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={createNewGuest}
                            disabled={loading || !formData.guest.first_name || !formData.guest.last_name || !formData.guest.email || !formData.guest.phone || !formData.guest.id_number}
                            className="px-4 py-2 bg-[#005357] text-white hover:bg-[#004147] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {loading ? 'Creating...' : 'Create Customer'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Booking Details</h3>
                    <p className="text-sm text-gray-200 mt-1">Stay dates and guest information</p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <Calendar01Icon className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.check_in_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_in_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date *</label>
                    <input
                      type="date"
                      required
                      value={formData.check_out_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, check_out_date: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adults *</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={formData.adults}
                      onChange={(e) => setFormData(prev => ({ ...prev, adults: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.children}
                      onChange={(e) => setFormData(prev => ({ ...prev, children: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                    <button
                      type="button"
                      onClick={() => setShowSpecialRequests(!showSpecialRequests)}
                      className="flex items-center text-sm text-[#005357] hover:text-[#004147] transition-colors"
                    >
                      <Mail01Icon className="h-4 w-4 mr-1" />
                      {showSpecialRequests ? 'Hide Options' : 'Quick Select'}
                    </button>
                  </div>
                  
                  {showSpecialRequests && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 space-y-2">
                      <p className="text-sm text-blue-800 font-medium">Common Requests (click to add):</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {specialRequestOptions.map((option, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              const currentRequests = formData.special_requests;
                              const newRequest = currentRequests 
                                ? (currentRequests.includes(option) ? currentRequests : `${currentRequests}\n• ${option}`)
                                : `• ${option}`;
                              setFormData(prev => ({ ...prev, special_requests: newRequest }));
                            }}
                            className="text-left text-xs p-2 bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-colors text-blue-700 hover:text-blue-800"
                          >
                            • {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <textarea
                    value={formData.special_requests}
                    onChange={(e) => setFormData(prev => ({ ...prev, special_requests: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                    placeholder="Type custom requests here or use Quick Select above...\n\nExamples:\n• Dietary restrictions\n• Accessibility needs\n• Special occasions\n• Room preferences"
                    rows={4}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Room Selection */}
          <div className="space-y-6">
            {/* Room Selection */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-[#005357]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Available Rooms</h3>
                    <p className="text-sm text-gray-200 mt-1">
                      {availableRooms.length > 0 ? `${availableRooms.length} rooms available` : 'Select dates to see available rooms'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <BedIcon className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50">
                {roomSearchLoading ? (
                  <div className="text-center py-8">
                    <Clock01Icon className="h-8 w-8 animate-spin mx-auto mb-2 text-[#005357]" />
                    <p className="text-gray-500">Searching available rooms...</p>
                  </div>
                ) : availableRooms.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <BedIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No available rooms</p>
                    <p className="text-sm">Select check-in and check-out dates to see availability</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {availableRooms.map((room) => (
                      <div
                        key={room.id}
                        onClick={() => setSelectedRoom(room)}
                        className={`p-4 border cursor-pointer transition-all ${
                          selectedRoom?.id === room.id
                            ? 'border-[#005357] bg-[#005357]/5 ring-2 ring-[#005357]/20'
                            : 'border-gray-200 hover:border-[#005357] hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="radio"
                              name="selectedRoom"
                              checked={selectedRoom?.id === room.id}
                              onChange={() => setSelectedRoom(room)}
                              className="w-4 h-4 text-[#005357]"
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">Room {room.number}</h4>
                              <p className="text-sm text-gray-500">{room.room_type_name}</p>
                              <p className="text-xs text-gray-400">
                                Floor {room.floor} • Max {room.max_occupancy} guests
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">
                              {formatCurrency(room.base_price)}
                            </p>
                            <p className="text-xs text-gray-500">per night</p>
                            <div className="mt-1 pt-1 border-t border-gray-200">
                              <p className="text-sm font-medium text-[#005357]">
                                {formatCurrency((room as any).total_cost || 0)}
                              </p>
                              <p className="text-xs text-gray-500">
                                total ({(room as any).nights || 0} nights)
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Booking Summary */}
            {selectedRoom && selectedGuest && (
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200 bg-[#005357]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Booking Summary</h3>
                      <p className="text-sm text-gray-200 mt-1">Review before creating reservation</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <File01Icon className="h-4 w-4 text-[#005357]" />
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 space-y-4">
                  {/* Customer Info */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Customer</h4>
                    <p className="text-sm text-gray-600">{selectedGuest.full_name}</p>
                    <p className="text-sm text-gray-600">{selectedGuest.email}</p>
                  </div>

                  {/* Stay Info */}
                  <div>
                    <h4 className="font-medium text-gray-800 mb-2">Stay Details</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Check-in:</strong> {formatDate(formData.check_in_date)}</p>
                      <p><strong>Check-out:</strong> {formatDate(formData.check_out_date)}</p>
                      <p><strong>Guests:</strong> {formData.adults} adults{formData.children > 0 ? `, ${formData.children} children` : ''}</p>
                      <p><strong>Room:</strong> {selectedRoom.number} - {selectedRoom.room_type_name}</p>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-gray-800 mb-2">Payment Summary</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency((selectedRoom as any).total_cost || 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>PPN/VAT (11%):</span>
                        <span>{formatCurrency(((selectedRoom as any).total_cost || 0) * 0.11)}</span>
                      </div>
                      <div className="flex justify-between font-semibold text-base border-t pt-2">
                        <span>Grand Total:</span>
                        <span>{formatCurrency(((selectedRoom as any).total_cost || 0) * 1.11)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Create Reservation Button */}
                  <div className="pt-3 border-t">
                    <button
                      onClick={createReservation}
                      disabled={loading}
                      className="w-full px-4 py-3 bg-[#005357] text-white hover:bg-[#004147] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <Clock01Icon className="h-4 w-4 animate-spin mr-2" />
                          Creating Reservation...
                        </div>
                      ) : (
                        'Create Reservation'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}