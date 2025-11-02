'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  ChevronLeftIcon,
  Calendar01Icon,
  Clock01Icon,
  UserIcon,
  Building03Icon,
  PackageIcon,
  CreditCardIcon,
  Add01Icon,
  Delete02Icon
} from '@/lib/icons';

interface Guest {
  id: number;
  full_name: string;
  email: string;
  phone: string;
}

interface Room {
  id: number;
  room_number: string;
  room_type?: {
    id: number;
    name: string;
    room_category: string;
  };
  room_type_name?: string;
}

interface EventPackage {
  id: number;
  name: string;
  package_type: string;
  base_price: string;
  max_hours: number;
  includes_venue: boolean;
  includes_sound_system: boolean;
  includes_projector: boolean;
  includes_decoration: boolean;
  includes_lighting: boolean;
  description: string;
}

interface FoodPackage {
  id: number;
  name: string;
  category: string;
  price_per_pax: string;
  minimum_pax: number;
  menu_items: string;
  description: string;
}

export default function NewEventBookingPage() {
  const router = useRouter();

  // Form data
  const [formData, setFormData] = useState({
    guest: '',
    venue: '',
    venue_package: '',
    food_package: '',
    event_type: 'WEDDING',
    event_name: '',
    event_date: '',
    event_start_time: '',
    event_end_time: '',
    expected_pax: '',
    setup_notes: '',
    special_requests: '',
    down_payment_percentage: '30',
  });

  // Lists from API
  const [guests, setGuests] = useState<Guest[]>([]);
  const [venues, setVenues] = useState<Room[]>([]);
  const [eventPackages, setEventPackages] = useState<EventPackage[]>([]);
  const [foodPackages, setFoodPackages] = useState<FoodPackage[]>([]);

  // Selected items for details
  const [selectedVenuePackage, setSelectedVenuePackage] = useState<EventPackage | null>(null);
  const [selectedFoodPackage, setSelectedFoodPackage] = useState<FoodPackage | null>(null);

  // Calculated prices
  const [venuePrice, setVenuePrice] = useState(0);
  const [foodPrice, setFoodPrice] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [downPayment, setDownPayment] = useState(0);
  const [remaining, setRemaining] = useState(0);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showNewGuestModal, setShowNewGuestModal] = useState(false);
  const [guestSearch, setGuestSearch] = useState('');
  const [newGuestData, setNewGuestData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    nationality: 'Indonesia',
    gender: 'MALE'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    calculatePrices();
  }, [formData, selectedVenuePackage, selectedFoodPackage]);

  // Debounce guest search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (guestSearch.trim().length >= 2) {
        searchGuests(guestSearch);
      } else if (guestSearch.trim().length === 0) {
        // Reset to initial guests when search is cleared
        fetchInitialGuests();
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [guestSearch]);

  const fetchInitialGuests = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/guests/?page_size=1000'), { credentials: 'include' });
      const data = await response.json();
      setGuests(data.results || data);
    } catch (error) {
      console.error('Error fetching initial guests:', error);
    }
  };

  const searchGuests = async (query: string) => {
    try {
      // Use Django REST framework search parameter - searches ALL guests in database
      const response = await fetch(
        buildApiUrl(`hotel/guests/?search=${encodeURIComponent(query)}&page_size=1000`),
        { credentials: 'include' }
      );
      const data = await response.json();
      setGuests(data.results || data);
    } catch (error) {
      console.error('Error searching guests:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [venuesRes, packagesRes, foodRes] = await Promise.all([
        fetch(buildApiUrl('hotel/rooms/?page_size=100'), { credentials: 'include' }),
        fetch(buildApiUrl('hotel/event-packages/?is_active=true'), { credentials: 'include' }),
        fetch(buildApiUrl('hotel/food-packages/?is_active=true'), { credentials: 'include' }),
      ]);

      const [venuesData, packagesData, foodData] = await Promise.all([
        venuesRes.json(),
        packagesRes.json(),
        foodRes.json(),
      ]);

      // Fetch initial guests separately
      await fetchInitialGuests();

      // Filter rooms with 'ballroom' or 'meeting' in room type name (case insensitive)
      const allRooms = venuesData.results || venuesData;

      // Debug: Log all rooms to see what we have
      console.log('All rooms:', allRooms);
      console.log('Room types:', allRooms.map((r: any) => ({
        room_number: r.room_number,
        type_name: r.room_type?.name || r.room_type_name,
        category: r.room_type?.room_category
      })));

      const ballroomRooms = allRooms.filter((room: any) => {
        const roomTypeName = room.room_type?.name || room.room_type_name || '';
        const lowerName = roomTypeName.toLowerCase();
        return lowerName.includes('ballroom') ||
               lowerName.includes('meeting');
      });

      console.log('Filtered ballroom/meeting rooms:', ballroomRooms);
      setVenues(ballroomRooms);
      setEventPackages(packagesData.results || packagesData);
      setFoodPackages(foodData.results || foodData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrices = () => {
    let vPrice = 0;
    let fPrice = 0;

    // Venue package price
    if (selectedVenuePackage) {
      vPrice = parseFloat(selectedVenuePackage.base_price);
    }

    // Food package price
    if (selectedFoodPackage && formData.expected_pax) {
      const pax = parseInt(formData.expected_pax);
      if (pax >= selectedFoodPackage.minimum_pax) {
        fPrice = parseFloat(selectedFoodPackage.price_per_pax) * pax;
      }
    }

    const sub = vPrice + fPrice;
    const tax = sub * 0.11; // 11% tax
    const total = sub + tax;
    const dpPercentage = parseInt(formData.down_payment_percentage) / 100;
    const dp = total * dpPercentage;
    const rem = total - dp;

    setVenuePrice(vPrice);
    setFoodPrice(fPrice);
    setSubtotal(sub);
    setTaxAmount(tax);
    setGrandTotal(total);
    setDownPayment(dp);
    setRemaining(rem);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Update selected packages when changed
    if (name === 'venue_package') {
      const pkg = eventPackages.find((p) => p.id === parseInt(value));
      setSelectedVenuePackage(pkg || null);
    }

    if (name === 'food_package') {
      const pkg = foodPackages.find((p) => p.id === parseInt(value));
      setSelectedFoodPackage(pkg || null);
    }
  };

  const handleCreateGuest = async () => {
    if (!newGuestData.first_name || !newGuestData.last_name || !newGuestData.email || !newGuestData.phone) {
      alert('Mohon isi semua field yang wajib');
      return;
    }

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl('hotel/guests/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(newGuestData),
      });

      if (response.ok) {
        const newGuest = await response.json();
        setGuests([...guests, newGuest]);
        setFormData({ ...formData, guest: newGuest.id.toString() });
        setShowNewGuestModal(false);
        setNewGuestData({
          first_name: '',
          last_name: '',
          email: '',
          phone: '',
          nationality: 'Indonesia',
          gender: 'MALE'
        });
        alert('Tamu baru berhasil ditambahkan!');
      } else {
        const error = await response.json();
        alert('Gagal menambahkan tamu: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error creating guest:', error);
      alert('Terjadi kesalahan saat menambahkan tamu');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        guest: parseInt(formData.guest),
        venue: parseInt(formData.venue),
        venue_package: formData.venue_package ? parseInt(formData.venue_package) : null,
        food_package: formData.food_package ? parseInt(formData.food_package) : null,
        event_type: formData.event_type,
        event_name: formData.event_name,
        event_date: formData.event_date,
        start_time: formData.event_start_time,
        end_time: formData.event_end_time,
        expected_pax: parseInt(formData.expected_pax),
        confirmed_pax: 0,
        venue_price: venuePrice,
        food_price: foodPrice,
        equipment_price: 0,
        other_charges: 0,
        subtotal: subtotal,
        tax_amount: taxAmount,
        grand_total: grandTotal,
        down_payment_amount: downPayment,
        remaining_amount: remaining,
        down_payment_paid: false,
        full_payment_paid: false,
        status: 'PENDING',
        setup_notes: formData.setup_notes,
        special_requests: formData.special_requests,
      };

      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl('hotel/event-bookings/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Event booking berhasil dibuat!');
        router.push(`/office/events/${data.id}`);
      } else {
        const error = await response.json();
        alert('Gagal membuat booking: ' + JSON.stringify(error));
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Terjadi kesalahan saat membuat booking');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/office/events')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Booking Event Baru</h1>
            <p className="text-gray-600 mt-2">
              Buat booking untuk event, wedding, atau meeting
            </p>
          </div>
        </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form Fields */}
        <div className="lg:col-span-2 space-y-6">
          {/* Guest Information */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" />
                <span>Informasi Tamu</span>
              </div>
              <button
                type="button"
                onClick={() => setShowNewGuestModal(true)}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-[#4E61D3] text-white rounded hover:bg-[#3D4EA8] transition space-x-1"
              >
                <Add01Icon className="h-4 w-4" />
                <span>Tamu Baru</span>
              </button>
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cari & Pilih Tamu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Cari nama atau telepon tamu..."
                  value={guestSearch}
                  onChange={(e) => setGuestSearch(e.target.value)}
                  className="w-full px-3 py-2 mb-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                />
                <select
                  name="guest"
                  value={formData.guest}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  size={5}
                >
                  <option value="">Pilih Tamu</option>
                  {guests.map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guest.full_name} - {guest.phone}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {guestSearch.trim().length >= 2
                    ? `Hasil pencarian: ${guests.length} tamu ditemukan`
                    : 'Ketik minimal 2 karakter untuk mencari, atau klik "Tamu Baru" untuk menambah'}
                </p>
              </div>
            </div>
          </div>

          {/* Event Details */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Calendar01Icon className="h-5 w-5" />
              <span>Detail Event</span>
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipe Event <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="event_type"
                    value={formData.event_type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  >
                    <option value="WEDDING">Wedding</option>
                    <option value="MEETING">Meeting</option>
                    <option value="CONFERENCE">Conference</option>
                    <option value="SEMINAR">Seminar</option>
                    <option value="BIRTHDAY">Birthday</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Event <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="event_name"
                    value={formData.event_name}
                    onChange={handleInputChange}
                    required
                    placeholder="Contoh: Pernikahan Budi & Ani"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tanggal Event <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="event_date"
                    value={formData.event_date}
                    onChange={handleInputChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waktu Mulai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="event_start_time"
                    value={formData.event_start_time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Waktu Selesai <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    name="event_end_time"
                    value={formData.event_end_time}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Tamu (PAX) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="expected_pax"
                  value={formData.expected_pax}
                  onChange={handleInputChange}
                  required
                  min="1"
                  placeholder="Contoh: 100"
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                />
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Venue <span className="text-red-500">*</span>
                </label>
                <select
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                >
                  <option value="">Pilih Venue</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id}>
                      {venue.room_number} - {venue.room_type?.name || venue.room_type_name || 'N/A'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paket Venue
                </label>
                <select
                  name="venue_package"
                  value={formData.venue_package}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                >
                  <option value="">Tanpa Paket</option>
                  {eventPackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {formatCurrency(parseFloat(pkg.base_price))}
                    </option>
                  ))}
                </select>
                {selectedVenuePackage && (
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                    <div className="font-medium text-gray-900 mb-1">Termasuk:</div>
                    <ul className="list-disc list-inside text-gray-600 space-y-1">
                      {selectedVenuePackage.includes_venue && <li>Venue ({selectedVenuePackage.max_hours} jam)</li>}
                      {selectedVenuePackage.includes_sound_system && <li>Sound System</li>}
                      {selectedVenuePackage.includes_projector && <li>Projector & Screen</li>}
                      {selectedVenuePackage.includes_decoration && <li>Dekorasi Dasar</li>}
                      {selectedVenuePackage.includes_lighting && <li>Lighting</li>}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paket Makanan
                </label>
                <select
                  name="food_package"
                  value={formData.food_package}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                >
                  <option value="">Tanpa Paket Makanan</option>
                  {foodPackages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.name} - {formatCurrency(parseFloat(pkg.price_per_pax))}/pax (min. {pkg.minimum_pax} pax)
                    </option>
                  ))}
                </select>
                {selectedFoodPackage && (
                  <div className="mt-2 p-3 bg-gray-50 rounded text-sm">
                    <div className="font-medium text-gray-900 mb-1">Menu:</div>
                    <div className="text-gray-600 whitespace-pre-line">{selectedFoodPackage.menu_items}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="bg-white border border-gray-200 rounded p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Catatan Tambahan</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Setup Notes
                </label>
                <textarea
                  name="setup_notes"
                  value={formData.setup_notes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Catatan setup venue, tata letak, dll..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Special Requests
                </label>
                <textarea
                  name="special_requests"
                  value={formData.special_requests}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Permintaan khusus dari tamu..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Price Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded p-6 sticky top-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <CreditCardIcon className="h-5 w-5" />
              <span>Ringkasan Biaya</span>
            </h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Paket Venue:</span>
                <span className="font-medium text-gray-900">{formatCurrency(venuePrice)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Paket Makanan:</span>
                <span className="font-medium text-gray-900">{formatCurrency(foodPrice)}</span>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(subtotal)}</span>
                </div>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-600">Pajak (11%):</span>
                <span className="font-medium text-gray-900">{formatCurrency(taxAmount)}</span>
              </div>

              <div className="border-t border-gray-200 pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-900">Grand Total:</span>
                  <span className="font-bold text-[#4E61D3] text-lg">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 space-y-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Persentase DP (%)
                  </label>
                  <select
                    name="down_payment_percentage"
                    value={formData.down_payment_percentage}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  >
                    <option value="30">30%</option>
                    <option value="40">40%</option>
                    <option value="50">50%</option>
                  </select>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Down Payment:</span>
                  <span className="font-medium text-yellow-600">{formatCurrency(downPayment)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Sisa Pelunasan:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(remaining)}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-3 bg-[#4E61D3] text-white rounded hover:bg-[#3D4EA8] transition disabled:opacity-50 font-medium"
              >
                {submitting ? 'Menyimpan...' : 'Buat Booking'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/office/events')}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition font-medium"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </form>
      </div>

      {/* New Guest Modal */}
      {showNewGuestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Tambah Tamu Baru</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Depan <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newGuestData.first_name}
                  onChange={(e) => setNewGuestData({ ...newGuestData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Belakang <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newGuestData.last_name}
                  onChange={(e) => setNewGuestData({ ...newGuestData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={newGuestData.email}
                  onChange={(e) => setNewGuestData({ ...newGuestData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telepon <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={newGuestData.phone}
                  onChange={(e) => setNewGuestData({ ...newGuestData, phone: e.target.value })}
                  placeholder="+62..."
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis Kelamin
                </label>
                <select
                  value={newGuestData.gender}
                  onChange={(e) => setNewGuestData({ ...newGuestData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                >
                  <option value="MALE">Laki-laki</option>
                  <option value="FEMALE">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kewarganegaraan
                </label>
                <input
                  type="text"
                  value={newGuestData.nationality}
                  onChange={(e) => setNewGuestData({ ...newGuestData, nationality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateGuest}
                className="flex-1 px-4 py-2 bg-[#4E61D3] text-white rounded hover:bg-[#3D4EA8] transition font-medium"
              >
                Simpan
              </button>
              <button
                onClick={() => setShowNewGuestModal(false)}
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
