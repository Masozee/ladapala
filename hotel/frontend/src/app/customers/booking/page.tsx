'use client';

import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  Calendar01Icon,
  UserMultipleIcon,
  BedIcon,
  Mail01Icon,
  Call02Icon,
  UserIcon,
  SparklesIcon,
  ChevronRightIcon,
  CheckmarkCircle02Icon,
} from '@/lib/icons';

interface RoomType {
  id: number;
  name: string;
  description: string;
  base_price: number;
  max_occupancy: number;
  size_sqm: number;
  bed_configuration: string;
  room_category: string;
  available_rooms_count: number;
  images: Array<{
    id: number;
    image: string;
    is_primary: boolean;
  }>;
}

export default function CustomerBookingPage() {
  const [step, setStep] = useState(1);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(false);

  // Step 1: Search criteria
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);

  // Step 2: Room selection
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);

  // Step 3: Guest information
  const [guestInfo, setGuestInfo] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    nationality: 'Indonesia',
    special_requests: '',
  });

  // Step 4: Confirmation
  const [reservationNumber, setReservationNumber] = useState('');

  useEffect(() => {
    // Set default dates (today + 1 for check-in, today + 2 for check-out)
    const tomorrow = addDays(new Date(), 1);
    const dayAfter = addDays(new Date(), 2);
    setCheckInDate(format(tomorrow, 'yyyy-MM-dd'));
    setCheckOutDate(format(dayAfter, 'yyyy-MM-dd'));
  }, []);

  const calculateNights = () => {
    if (!checkInDate || !checkOutDate) return 0;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    return Math.max(0, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  };

  const calculateTotal = () => {
    if (!selectedRoomType) return 0;
    const nights = calculateNights();
    const subtotal = selectedRoomType.base_price * nights;
    const tax = subtotal * 0.11;
    return subtotal + tax;
  };

  const handleSearchRooms = async () => {
    if (!checkInDate || !checkOutDate) {
      alert('Please select check-in and check-out dates');
      return;
    }

    if (new Date(checkInDate) >= new Date(checkOutDate)) {
      alert('Check-out date must be after check-in date');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        buildApiUrl(`hotel/room-types/?check_in=${checkInDate}&check_out=${checkOutDate}`),
        {
          credentials: 'include',
        }
      );

      if (!response.ok) throw new Error('Failed to fetch rooms');

      const data = await response.json();
      const available = (data.results || data).filter(
        (rt: RoomType) =>
          rt.available_rooms_count > 0 &&
          rt.max_occupancy >= adults + children &&
          rt.room_category === 'GUEST_ROOM' // Exclude event spaces (ballrooms)
      );

      setRoomTypes(available);
      setStep(2);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to search rooms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (roomType: RoomType) => {
    setSelectedRoomType(roomType);
    setStep(3);
  };

  const handleSubmitBooking = async () => {
    if (!guestInfo.first_name || !guestInfo.last_name || !guestInfo.email || !guestInfo.phone) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const csrfToken = getCsrfToken();

      // Create guest
      const guestResponse = await fetch(buildApiUrl('hotel/guests/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          first_name: guestInfo.first_name,
          last_name: guestInfo.last_name,
          email: guestInfo.email,
          phone: guestInfo.phone,
          nationality: guestInfo.nationality,
        }),
      });

      let guest;
      if (guestResponse.ok) {
        guest = await guestResponse.json();
      } else {
        // Try to find existing guest
        const existingResponse = await fetch(
          buildApiUrl(`hotel/guests/?email=${guestInfo.email}`),
          { credentials: 'include' }
        );
        if (existingResponse.ok) {
          const data = await existingResponse.json();
          guest = data.results?.[0] || data[0];
        }
        if (!guest) throw new Error('Failed to create guest');
      }

      // Create reservation
      const reservationResponse = await fetch(buildApiUrl('hotel/reservations/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify({
          guest: guest.id,
          room_type: selectedRoomType!.id,
          check_in_date: checkInDate,
          check_out_date: checkOutDate,
          adults,
          children,
          booking_source: 'ONLINE',
          special_requests: guestInfo.special_requests,
          status: 'CONFIRMED',
        }),
      });

      if (!reservationResponse.ok) throw new Error('Failed to create reservation');

      const reservation = await reservationResponse.json();
      setReservationNumber(reservation.reservation_number);
      setStep(4);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getPrimaryImage = (roomType: RoomType) => {
    const primary = roomType.images?.find((img) => img.is_primary);
    return primary?.image || roomType.images?.[0]?.image || '/placeholder-room.jpg';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#005357] text-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2">Book Your Stay</h1>
          <p className="text-white/80">Find and reserve your perfect room</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Search' },
              { num: 2, label: 'Select Room' },
              { num: 3, label: 'Guest Info' },
              { num: 4, label: 'Confirmation' },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div className="flex items-center">
                  <div
                    className={`w-10 h-10 flex items-center justify-center font-semibold ${
                      step >= s.num
                        ? 'bg-[#005357] text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step > s.num ? <CheckmarkCircle02Icon className="h-5 w-5" /> : s.num}
                  </div>
                  <span
                    className={`ml-3 font-medium ${
                      step >= s.num ? 'text-[#005357]' : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    className={`flex-1 h-1 mx-4 ${
                      step > s.num ? 'bg-[#005357]' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Step 1: Search */}
        {step === 1 && (
          <div className="bg-white border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              When would you like to stay?
            </h2>
            <p className="text-gray-600 mb-6">Select your check-in and check-out dates to see available rooms</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date
                </label>
                <div className="relative">
                  <Calendar01Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Earliest available: tomorrow</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date
                </label>
                <div className="relative">
                  <Calendar01Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    min={checkInDate || format(new Date(), 'yyyy-MM-dd')}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Must be after check-in date</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adults
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={adults}
                    onChange={(e) => setAdults(parseInt(e.target.value) || 1)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Age 18 and above</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Children
                </label>
                <div className="relative">
                  <UserMultipleIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={children}
                    onChange={(e) => setChildren(parseInt(e.target.value) || 0)}
                    className="w-full pl-11 pr-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Age 0-17</p>
              </div>
            </div>

            {checkInDate && checkOutDate && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>{calculateNights()} night(s)</strong> - {format(new Date(checkInDate), 'dd MMM yyyy')} to {format(new Date(checkOutDate), 'dd MMM yyyy')}
                </p>
              </div>
            )}

            <button
              onClick={handleSearchRooms}
              disabled={loading}
              className="w-full bg-[#005357] text-white py-4 font-semibold hover:bg-[#004347] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching...' : 'Search Available Rooms'}
            </button>
          </div>
        )}

        {/* Step 2: Select Room */}
        {step === 2 && (
          <div>
            <button
              onClick={() => setStep(1)}
              className="mb-4 text-[#005357] hover:underline flex items-center"
            >
              ← Back to search
            </button>

            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Available Rooms ({roomTypes.length})
            </h2>

            {roomTypes.length === 0 ? (
              <div className="bg-white border border-gray-200 p-12 text-center">
                <BedIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No rooms available for your dates</p>
                <p className="text-sm text-gray-500">Please try different dates or reduce the number of guests</p>
                <button
                  onClick={() => setStep(1)}
                  className="mt-4 text-[#005357] hover:underline font-medium"
                >
                  ← Try different dates
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {roomTypes.map((roomType) => (
                  <div
                    key={roomType.id}
                    className="bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-48">
                      <img
                        src={getPrimaryImage(roomType)}
                        alt={roomType.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="p-5">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {roomType.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {roomType.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <BedIcon className="h-4 w-4 mr-2" />
                          {roomType.bed_configuration}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <UserMultipleIcon className="h-4 w-4 mr-2" />
                          Max {roomType.max_occupancy} guests
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <SparklesIcon className="h-4 w-4 mr-2" />
                          {roomType.size_sqm} m²
                        </div>
                      </div>

                      <div className="border-t border-gray-200 pt-4 mb-4">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-2xl font-bold text-[#005357]">
                            Rp {roomType.base_price.toLocaleString('id-ID')}
                          </span>
                          <span className="text-sm text-gray-500">per night</span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {roomType.available_rooms_count} rooms available
                        </p>
                      </div>

                      <button
                        onClick={() => handleSelectRoom(roomType)}
                        className="w-full bg-[#005357] text-white py-3 font-medium hover:bg-[#004347] transition-colors flex items-center justify-center"
                      >
                        Select Room
                        <ChevronRightIcon className="h-4 w-4 ml-2" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Guest Information */}
        {step === 3 && selectedRoomType && (
          <div>
            <button
              onClick={() => setStep(2)}
              className="mb-4 text-[#005357] hover:underline flex items-center"
            >
              ← Back to room selection
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="bg-white border border-gray-200 p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Guest Information
                  </h2>
                  <p className="text-gray-600 mb-6">Please provide your contact details for the reservation</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={guestInfo.first_name}
                        onChange={(e) =>
                          setGuestInfo({ ...guestInfo, first_name: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">As shown on ID</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        value={guestInfo.last_name}
                        onChange={(e) =>
                          setGuestInfo({ ...guestInfo, last_name: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">As shown on ID</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <div className="relative">
                        <Mail01Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={guestInfo.email}
                          onChange={(e) =>
                            setGuestInfo({ ...guestInfo, email: e.target.value })
                          }
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Confirmation will be sent here</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <div className="relative">
                        <Call02Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={guestInfo.phone}
                          onChange={(e) =>
                            setGuestInfo({ ...guestInfo, phone: e.target.value })
                          }
                          className="w-full pl-11 pr-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                          required
                          placeholder="+62 xxx-xxxx-xxxx"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">For booking confirmation</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={guestInfo.nationality}
                        onChange={(e) =>
                          setGuestInfo({ ...guestInfo, nationality: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">Required for hotel registration</p>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Special Requests (Optional)
                      </label>
                      <textarea
                        value={guestInfo.special_requests}
                        onChange={(e) =>
                          setGuestInfo({ ...guestInfo, special_requests: e.target.value })
                        }
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-[#005357] focus:border-transparent"
                        placeholder="E.g., high floor, quiet room, etc."
                      />
                      <p className="text-xs text-gray-500 mt-1">We'll do our best to accommodate your preferences</p>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Specific room number will be assigned at check-in based on availability
                    </p>
                  </div>

                  <button
                    onClick={handleSubmitBooking}
                    disabled={loading}
                    className="w-full mt-6 bg-[#005357] text-white py-4 font-semibold hover:bg-[#004347] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Creating Reservation...' : 'Confirm Booking'}
                  </button>
                </div>
              </div>

              {/* Booking Summary */}
              <div className="lg:col-span-1">
                <div className="bg-white border border-gray-200 p-6 sticky top-4">
                  <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>

                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600">Room Type</p>
                      <p className="font-medium text-gray-900">{selectedRoomType.name}</p>
                    </div>

                    <div>
                      <p className="text-gray-600">Check-in</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(checkInDate), 'dd MMM yyyy')}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">Check-out</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(checkOutDate), 'dd MMM yyyy')}
                      </p>
                    </div>

                    <div>
                      <p className="text-gray-600">Guests</p>
                      <p className="font-medium text-gray-900">
                        {adults} adult(s)
                        {children > 0 && `, ${children} child(ren)`}
                      </p>
                    </div>

                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">
                          Rp {selectedRoomType.base_price.toLocaleString('id-ID')} x{' '}
                          {calculateNights()} night(s)
                        </span>
                        <span className="font-medium">
                          Rp{' '}
                          {(selectedRoomType.base_price * calculateNights()).toLocaleString(
                            'id-ID'
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Tax (11%)</span>
                        <span className="font-medium">
                          Rp{' '}
                          {(
                            selectedRoomType.base_price *
                            calculateNights() *
                            0.11
                          ).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">Total</span>
                        <span className="font-bold text-[#005357] text-lg">
                          Rp {calculateTotal().toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 4 && (
          <div className="bg-white border border-gray-200 p-12 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckmarkCircle02Icon className="h-12 w-12 text-green-600" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Booking Confirmed!
            </h2>

            <p className="text-gray-600 mb-8">
              Your reservation has been successfully created.
            </p>

            <div className="bg-gray-50 border border-gray-200 p-6 mb-6">
              <p className="text-sm text-gray-600 mb-2">Reservation Number</p>
              <p className="text-2xl font-bold text-[#005357]">{reservationNumber}</p>
            </div>

            <div className="text-sm text-gray-600 mb-8 space-y-2">
              <p>
                ✓ Confirmation email sent to <strong>{guestInfo.email}</strong>
              </p>
              <p>
                ✓ Please check your email for booking details
              </p>
              <p className="mt-4 p-3 bg-blue-50 border border-blue-200">
                <strong>Important:</strong> Your room number will be assigned at check-in by our front desk staff
              </p>
            </div>

            <button
              onClick={() => {
                setStep(1);
                setSelectedRoomType(null);
                setGuestInfo({
                  first_name: '',
                  last_name: '',
                  email: '',
                  phone: '',
                  nationality: 'Indonesia',
                  special_requests: '',
                });
                setReservationNumber('');
              }}
              className="bg-[#005357] text-white px-8 py-3 font-medium hover:bg-[#004347] transition-colors"
            >
              Make Another Booking
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
