'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout, { HeaderActions } from '@/components/AppLayout';
import { buildApiUrl } from '@/lib/config';
import {
  Search02Icon,
  Calendar01Icon,
  UserMultipleIcon,
  PackageIcon,
  Shield01Icon,
  Call02Icon,
  BedIcon,
  Location01Icon,
  SparklesIcon,
  UserCheckIcon,
  Cancel01Icon,
  EyeIcon,
  ViewIcon,
  ListViewIcon,
  MoreHorizontalIcon,
  FilterIcon,
  Settings02Icon
} from '@/lib/icons';

interface Room {
  id: number;
  room_number: string;
  room_type_name: string;
  room_type_id: number;
  floor: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning';
  rate_per_night: number;
  max_occupancy: number;
  bed_type: string;
  room_size: number;
  amenities: string[];
  images: string[];
  description: string;
  view_type: string;
  is_smoking: boolean;
  last_cleaned: string;
  next_checkout?: string;
  next_checkin?: string;
}

interface RoomType {
  id: number;
  name: string;
  description: string;
  base_rate: number;
  max_occupancy: number;
  room_size: number;
  bed_configuration: string;
  amenities: string[];
  images: string[];
  room_count: number;
  available_rooms: number;
}

interface DjangoRoomType {
  id: number;
  name: string;
  description: string | null;
  base_price: string;
  max_occupancy: number;
  size_sqm: number | null;
  amenities: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  occupancy_percentage: number;
  available_rooms_count: number;
}

interface DjangoApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DjangoRoomType[];
}

const fetchRoomTypes = async (): Promise<RoomType[]> => {
  try {
    const response = await fetch(buildApiUrl('room-types/'), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: DjangoApiResponse = await response.json();
    
    // Map Django response to frontend format
    return data.results.map((djangoRoom): RoomType => ({
      id: djangoRoom.id,
      name: djangoRoom.name,
      description: djangoRoom.description || 'No description available',
      base_rate: Math.round(parseFloat(djangoRoom.base_price)),
      max_occupancy: djangoRoom.max_occupancy,
      room_size: djangoRoom.size_sqm || 20,
      bed_configuration: getBedConfiguration(djangoRoom.name, djangoRoom.max_occupancy),
      amenities: parseAmenities(djangoRoom.amenities),
      images: ['/hotelroom.jpeg'], // Default image
      room_count: djangoRoom.occupancy_percentage > 0 
        ? Math.ceil(djangoRoom.available_rooms_count / (1 - djangoRoom.occupancy_percentage / 100)) 
        : djangoRoom.available_rooms_count + Math.floor(Math.random() * 10) + 5, // Estimate total rooms when occupancy is 0
      available_rooms: djangoRoom.available_rooms_count
    }));
  } catch (error) {
    console.error('Failed to fetch room types:', error);
    // Fallback to mock data if API fails
    return MOCK_ROOM_TYPES;
  }
};

const getBedConfiguration = (roomName: string, maxOccupancy: number): string => {
  const name = roomName.toLowerCase();
  if (name.includes('family')) return '1 King Bed + 2 Twin Beds';
  if (name.includes('suite') && maxOccupancy >= 3) return '1 King Bed + Sofa Bed';
  if (name.includes('twin') || maxOccupancy === 2) return '2 Twin Beds';
  if (maxOccupancy >= 3) return '1 King Bed + Sofa Bed';
  return '1 King Bed';
};

const parseAmenities = (amenitiesString: string | null): string[] => {
  if (!amenitiesString) return ['WiFi', 'TV', 'AC'];
  
  // Split by comma and clean up
  return amenitiesString
    .split(',')
    .map(amenity => amenity.trim())
    .filter(amenity => amenity.length > 0)
    .slice(0, 8); // Limit to 8 amenities for UI consistency
};

const MOCK_ROOM_TYPES: RoomType[] = [
  {
    id: 1,
    name: 'Standard King',
    description: 'Comfortable room with modern amenities and city views, perfect for business travelers or couples.',
    base_rate: 2250000,
    max_occupancy: 2,
    room_size: 35,
    bed_configuration: '1 King Bed',
    amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Safe', 'Phone', 'Desk'],
    images: [
      '/hotelroom.jpeg',
      '/hotelroom.jpeg',
      '/hotelroom.jpeg'
    ],
    room_count: 20,
    available_rooms: 12
  },
  {
    id: 2,
    name: 'Deluxe King Suite',
    description: 'Spacious suite with separate living area, premium amenities, and panoramic city views.',
    base_rate: 3375000,
    max_occupancy: 3,
    room_size: 55,
    bed_configuration: '1 King Bed + Sofa Bed',
    amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'City View', 'Room Service', 'Safe', 'Bathtub', 'Coffee Machine'],
    images: [
      '/hotelroom.jpeg',
      '/hotelroom.jpeg',
      '/hotelroom.jpeg',
      '/hotelroom.jpeg'
    ],
    room_count: 15,
    available_rooms: 8
  },
  {
    id: 3,
    name: 'Executive Twin',
    description: 'Perfect for business partners or friends, featuring two comfortable beds and a work area.',
    base_rate: 2625000,
    max_occupancy: 2,
    room_size: 40,
    bed_configuration: '2 Twin Beds',
    amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Safe', 'Desk', 'Work Chair', 'Phone'],
    images: [
      '/hotelroom.jpeg',
      '/hotelroom.jpeg'
    ],
    room_count: 10,
    available_rooms: 7
  },
  {
    id: 4,
    name: 'Family Suite',
    description: 'Spacious accommodation for families with connecting rooms and child-friendly amenities.',
    base_rate: 4125000,
    max_occupancy: 4,
    room_size: 65,
    bed_configuration: '1 King Bed + 2 Twin Beds',
    amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'City View', 'Room Service', 'Safe', 'Coffee Machine', 'Baby Crib Available'],
    images: [
      '/hotelroom.jpeg',
      '/hotelroom.jpeg',
      '/hotelroom.jpeg'
    ],
    room_count: 8,
    available_rooms: 3
  },
  {
    id: 5,
    name: 'Presidential Suite',
    description: 'Luxurious suite with premium furnishings, butler service, and exclusive amenities.',
    base_rate: 6750000,
    max_occupancy: 4,
    room_size: 95,
    bed_configuration: '1 King Bed + Living Room',
    amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'Panoramic View', 'Butler Service', 'Safe', 'Jacuzzi', 'Coffee Machine', 'Dining Table', 'Premium Toiletries'],
    images: [
      '/hotelroom.jpeg',
      '/hotelroom.jpeg',
      '/hotelroom.jpeg',
      '/hotelroom.jpeg',
      '/hotelroom.jpeg'
    ],
    room_count: 2,
    available_rooms: 1
  }
];

const MOCK_ROOMS: Room[] = [
  {
    id: 1,
    room_number: '1205',
    room_type_name: 'Deluxe King Suite',
    room_type_id: 2,
    floor: 12,
    status: 'occupied',
    rate_per_night: 3375000,
    max_occupancy: 3,
    bed_type: '1 King Bed + Sofa Bed',
    room_size: 55,
    amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Balcony', 'City View', 'Room Service', 'Safe'],
    images: ['/hotelroom.jpeg'],
    description: 'Spacious suite with city views',
    view_type: 'City View',
    is_smoking: false,
    last_cleaned: '2024-08-24T10:00:00Z',
    next_checkout: '2024-08-28T11:00:00Z'
  }
];

const RoomsPage = () => {
  const router = useRouter();
  const [selectedRoomType, setSelectedRoomType] = useState<RoomType | null>(null);
  const [checkInDate, setCheckInDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [checkOutDate, setCheckOutDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [guests, setGuests] = useState(2);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Advanced filter states
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRoomSize, setMinRoomSize] = useState('');
  const [maxRoomSize, setMaxRoomSize] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [bedType, setBedType] = useState('');
  const [floorPreference, setFloorPreference] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'cleaning': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <PackageIcon className="h-4 w-4" />;
      case 'tv': return <PackageIcon className="h-4 w-4" />;
      case 'ac': return <PackageIcon className="h-4 w-4" />;
      case 'mini bar': return <PackageIcon className="h-4 w-4" />;
      case 'room service': return <PackageIcon className="h-4 w-4" />;
      case 'safe': return <Shield01Icon className="h-4 w-4" />;
      case 'phone': return <Call02Icon className="h-4 w-4" />;
      case 'bathtub': return <PackageIcon className="h-4 w-4" />;
      case 'jacuzzi': return <PackageIcon className="h-4 w-4" />;
      case 'balcony': return <Location01Icon className="h-4 w-4" />;
      case 'city view': return <EyeIcon className="h-4 w-4" />;
      case 'panoramic view': return <EyeIcon className="h-4 w-4" />;
      default: return <UserCheckIcon className="h-4 w-4" />;
    }
  };

  // Available amenities for filter
  const availableAmenities = ['WiFi', 'TV', 'AC', 'Mini Bar', 'Room Service', 'Safe', 'Balcony', 'City View', 'Bathtub', 'Coffee Machine'];

  const handleAmenityToggle = (amenity: string) => {
    setSelectedAmenities(prev => 
      prev.includes(amenity) 
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    );
  };

  const resetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setMinRoomSize('');
    setMaxRoomSize('');
    setSelectedAmenities([]);
    setBedType('');
    setFloorPreference('');
    setSearchTerm('');
    setShowAvailableOnly(true);
  };

  const filteredRoomTypes = roomTypes.filter(roomType => {
    if (searchTerm && !roomType.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (showAvailableOnly && roomType.available_rooms === 0) {
      return false;
    }
    if (roomType.max_occupancy < guests) {
      return false;
    }
    if (minPrice && roomType.base_rate < parseInt(minPrice)) {
      return false;
    }
    if (maxPrice && roomType.base_rate > parseInt(maxPrice)) {
      return false;
    }
    if (minRoomSize && roomType.room_size < parseInt(minRoomSize)) {
      return false;
    }
    if (maxRoomSize && roomType.room_size > parseInt(maxRoomSize)) {
      return false;
    }
    if (selectedAmenities.length > 0 && !selectedAmenities.every(amenity => roomType.amenities.includes(amenity))) {
      return false;
    }
    if (bedType && !roomType.bed_configuration.toLowerCase().includes(bedType.toLowerCase())) {
      return false;
    }
    return true;
  });

  const calculateNights = () => {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();

  // Fetch room types from API
  useEffect(() => {
    const loadRoomTypes = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchRoomTypes();
        setRoomTypes(data);
      } catch (err) {
        setError('Failed to load room types. Please try again.');
        console.error('Error loading room types:', err);
      } finally {
        setLoading(false);
      }
    };

    loadRoomTypes();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown !== null) {
        setActiveDropdown(null);
      }
    };

    if (activeDropdown !== null) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeDropdown]);

  const breadcrumb = [
    { label: 'Home', href: '/' },
    { label: 'Rooms' }
  ];

  return (
    <AppLayout breadcrumb={breadcrumb}>
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Room Availability</h1>
            <p className="text-gray-600 mt-2">Browse available rooms, rates, and make reservations</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors">
              <Settings02Icon className="h-4 w-4" />
              <span>Room Settings</span>
            </button>
          </div>
        </div>

        {/* Filter Button & View Switcher */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAdvancedFilter(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-[#005357] text-white text-sm font-medium hover:bg-[#004147] transition-colors"
          >
            <Settings02Icon className="h-4 w-4" />
            <span>Advanced Filter</span>
          </button>
          
          {/* View Mode Switcher */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">View:</span>
            <div className="flex border border-gray-300 overflow-hidden">
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                  viewMode === 'card' 
                    ? 'bg-[#005357] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ViewIcon className="h-4 w-4" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center space-x-2 px-4 py-2 text-sm transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-[#005357] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <ListViewIcon className="h-4 w-4" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filter Modal */}
        {showAdvancedFilter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Advanced Filter</h2>
                    <p className="text-sm text-gray-600 mt-1">Find the perfect room for your stay</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <FilterIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 bg-gray-50">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Filters */}
                  <div className="bg-white p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Stay Details</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Check-in Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Check-in Date</label>
                        <div className="relative">
                          <Calendar01Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="date"
                            value={checkInDate}
                            onChange={(e) => setCheckInDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                        </div>
                      </div>

                      {/* Check-out Date */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Check-out Date</label>
                        <div className="relative">
                          <Calendar01Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="date"
                            value={checkOutDate}
                            onChange={(e) => setCheckOutDate(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                        </div>
                      </div>

                      {/* Guests */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Guests</label>
                        <div className="relative">
                          <UserMultipleIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <select
                            value={guests}
                            onChange={(e) => setGuests(parseInt(e.target.value))}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm appearance-none"
                          >
                            {[1,2,3,4,5,6].map(num => (
                              <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Room Type Search */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Type</label>
                        <div className="relative">
                          <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search room types..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                        </div>
                      </div>

                      {/* Available Only Toggle */}
                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={showAvailableOnly}
                            onChange={(e) => setShowAvailableOnly(e.target.checked)}
                            className="rounded border-gray-300 text-[#005357] focus:ring-[#005357]"
                          />
                          <span className="text-sm font-medium text-gray-700">Show available rooms only</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  <div className="bg-white p-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Advanced Options</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Price Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Price Range (IDR per night)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Min price"
                            value={minPrice}
                            onChange={(e) => setMinPrice(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Max price"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                        </div>
                      </div>

                      {/* Room Size */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Room Size (sqm)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Min size"
                            value={minRoomSize}
                            onChange={(e) => setMinRoomSize(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Max size"
                            value={maxRoomSize}
                            onChange={(e) => setMaxRoomSize(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                        </div>
                      </div>

                      {/* Bed Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Bed Type</label>
                        <select
                          value={bedType}
                          onChange={(e) => setBedType(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm appearance-none"
                        >
                          <option value="">Any bed type</option>
                          <option value="king">King Bed</option>
                          <option value="twin">Twin Beds</option>
                          <option value="sofa">Sofa Bed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Amenities Filter */}
                  <div className="bg-white p-4 md:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Required Amenities</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {availableAmenities.map((amenity) => (
                        <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedAmenities.includes(amenity)}
                            onChange={() => handleAmenityToggle(amenity)}
                            className="rounded border-gray-300 text-[#005357] focus:ring-[#005357]"
                          />
                          <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 text-gray-600">
                              {getAmenityIcon(amenity)}
                            </div>
                            <span className="text-sm text-gray-700">{amenity}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                  <button 
                    onClick={resetFilters}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Reset All Filters
                  </button>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => setShowAdvancedFilter(false)}
                      className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => setShowAdvancedFilter(false)}
                      className="px-6 py-2 bg-[#005357] text-white text-sm font-medium hover:bg-[#004147] transition-colors"
                    >
                      Apply Filters ({filteredRoomTypes.length} rooms)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005357] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading room types...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Cancel01Icon className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => {
                      setError(null);
                      window.location.reload();
                    }}
                    className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                  >
                    <span className="text-sm">Retry</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Room Types Display */}
        {!loading && !error && viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRoomTypes.map((roomType) => (
            <div key={roomType.id} className="bg-white shadow">
              {/* Room Type Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {[1,2,3,4,5].map(star => (
                      <SparklesIcon key={star} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <BedIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50">
                {/* Room Image */}
                <div className="relative aspect-video bg-gray-200 mb-4 overflow-hidden">
                  <img
                    src={roomType.images[0]}
                    alt={roomType.name}
                    className="w-full h-full object-cover"
                  />
                  {roomType.images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                      +{roomType.images.length - 1} more
                    </div>
                  )}
                </div>

                {/* Room Information */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{roomType.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{roomType.description}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>• {roomType.room_size} sqm</span>
                    <span>• Max {roomType.max_occupancy} guests</span>
                    <span>• {roomType.bed_configuration}</span>
                  </div>
                </div>

                {/* Amenities Grid */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {roomType.amenities.slice(0, 6).map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-2 text-xs text-gray-600">
                      <div className="w-5 h-5 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        {getAmenityIcon(amenity)}
                      </div>
                      <span className="truncate">{amenity}</span>
                    </div>
                  ))}
                </div>

                {/* Availability Status */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Available Rooms</span>
                    <span className={`text-sm font-bold ${roomType.available_rooms > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {roomType.available_rooms} / {roomType.room_count}
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${roomType.available_rooms > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{width: `${(roomType.available_rooms / roomType.room_count) * 100}%`}}
                    ></div>
                  </div>

                  {roomType.available_rooms <= 3 && roomType.available_rooms > 0 && (
                    <p className="text-xs text-orange-600 font-medium">Only {roomType.available_rooms} rooms left!</p>
                  )}
                </div>

                {/* Pricing */}
                <div className="bg-white p-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500 mb-1">Starting from</div>
                    <div className="text-2xl font-bold text-[#005357] mb-1">
                      {formatCurrency(roomType.base_rate)}
                    </div>
                    <div className="text-xs text-gray-500 mb-3">per night</div>
                    
                    <div className="border-t pt-3 mb-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{nights} nights</span>
                        <span className="text-gray-900">{formatCurrency(roomType.base_rate * nights)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Taxes & fees</span>
                        <span className="text-gray-900">{formatCurrency(roomType.base_rate * nights * 0.1)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-base pt-2 border-t">
                        <span>Total</span>
                        <span className="text-[#005357]">{formatCurrency(roomType.base_rate * nights * 1.1)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button 
                        onClick={() => router.push(`/rooms/${roomType.id}`)}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-2 hover:bg-gray-200 transition-colors"
                      >
                        View Details
                      </button>
                      <button 
                        className="text-xs bg-[#005357] text-white px-3 py-2 hover:bg-[#004147] transition-colors disabled:opacity-50"
                        disabled={roomType.available_rooms === 0}
                      >
                        {roomType.available_rooms === 0 ? 'Sold Out' : 'Book Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            ))}
          </div>
        ) : !loading && !error ? (
          /* Table View */
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Room Types Overview</h3>
                  <p className="text-sm text-gray-600 mt-1">Compare room types, rates and availability</p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Search Form */}
                  <div className="relative">
                    <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search rooms..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    />
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <ListViewIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#005357]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Room Type
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Specifications
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Amenities
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Availability
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Rate
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Total ({nights} nights)
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredRoomTypes.map((roomType) => (
                    <tr key={roomType.id} className="hover:bg-gray-50">
                      {/* Room Type Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-16 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                            <img
                              src={roomType.images[0]}
                              alt={roomType.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="font-bold text-gray-900">{roomType.name}</h4>
                              <div className="flex items-center space-x-1">
                                {[1,2,3,4,5].map(star => (
                                  <SparklesIcon key={star} className="h-3 w-3 text-yellow-400 fill-current" />
                                ))}
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 max-w-xs">{roomType.description}</p>
                          </div>
                        </div>
                      </td>

                      {/* Specifications */}
                      <td className="px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="text-gray-900 font-medium">{roomType.room_size} sqm</div>
                          <div className="text-gray-600 text-xs">Max {roomType.max_occupancy} guests</div>
                          <div className="text-gray-600 text-xs">{roomType.bed_configuration}</div>
                        </div>
                      </td>

                      {/* Amenities */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {roomType.amenities.slice(0, 4).map((amenity, index) => (
                            <div key={index} className="flex items-center space-x-1 bg-gray-100 px-2 py-1 rounded text-xs">
                              <div className="w-3 h-3 flex items-center justify-center">
                                {getAmenityIcon(amenity)}
                              </div>
                              <span className="text-gray-700">{amenity}</span>
                            </div>
                          ))}
                          {roomType.amenities.length > 4 && (
                            <button 
                              onClick={() => router.push(`/rooms/${roomType.id}`)}
                              className="flex items-center space-x-1 bg-gray-200 px-2 py-1 rounded text-xs text-gray-600 hover:bg-gray-300"
                            >
                              <MoreHorizontalIcon className="h-3 w-3" />
                              <span>+{roomType.amenities.length - 4}</span>
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Availability */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">
                              {roomType.available_rooms} / {roomType.room_count}
                            </span>
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              roomType.available_rooms > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {roomType.available_rooms > 0 ? 'Available' : 'Sold Out'}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div 
                              className={`h-1.5 rounded-full ${roomType.available_rooms > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                              style={{width: `${(roomType.available_rooms / roomType.room_count) * 100}%`}}
                            ></div>
                          </div>
                          {roomType.available_rooms <= 3 && roomType.available_rooms > 0 && (
                            <p className="text-xs text-orange-600 font-medium">Only {roomType.available_rooms} left!</p>
                          )}
                        </div>
                      </td>

                      {/* Rate */}
                      <td className="px-6 py-4">
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#005357]">
                            {formatCurrency(roomType.base_rate)}
                          </div>
                          <div className="text-xs text-gray-500">per night</div>
                        </div>
                      </td>

                      {/* Total */}
                      <td className="px-6 py-4">
                        <div className="text-right">
                          <div className="text-sm space-y-1">
                            <div className="text-gray-600">{formatCurrency(roomType.base_rate * nights)}</div>
                            <div className="text-gray-600 text-xs">+ {formatCurrency(roomType.base_rate * nights * 0.1)} tax</div>
                            <div className="font-bold text-[#005357] border-t pt-1">
                              {formatCurrency(roomType.base_rate * nights * 1.1)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="relative">
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === roomType.id ? null : roomType.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {activeDropdown === roomType.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white shadow-lg z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    router.push(`/rooms/${roomType.id}`);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => setActiveDropdown(null)}
                                  disabled={roomType.available_rooms === 0}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <BedIcon className="h-4 w-4" />
                                  <span>{roomType.available_rooms === 0 ? 'Sold Out' : 'Book Now'}</span>
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() => setActiveDropdown(null)}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <Settings02Icon className="h-4 w-4" />
                                  <span>Edit Room Type</span>
                                </button>
                                <button
                                  onClick={() => setActiveDropdown(null)}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <UserMultipleIcon className="h-4 w-4" />
                                  <span>Manage Availability</span>
                                </button>
                                <button
                                  onClick={() => setActiveDropdown(null)}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <Calendar01Icon className="h-4 w-4" />
                                  <span>View Calendar</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* Room Detail Modal */}
        {selectedRoomType && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRoomType.name}</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedRoomType.description}</p>
                </div>
                <button 
                  onClick={() => setSelectedRoomType(null)}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <Cancel01Icon className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Image Gallery */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {selectedRoomType.images.map((image, index) => (
                    <div key={index} className="aspect-video bg-gray-200 overflow-hidden">
                      <img
                        src={image}
                        alt={`${selectedRoomType.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>

                {/* Room Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {/* Room Specifications */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Room Specifications</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room Size</span>
                        <span className="font-medium">{selectedRoomType.room_size} sqm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Max Occupancy</span>
                        <span className="font-medium">{selectedRoomType.max_occupancy} guests</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bed Configuration</span>
                        <span className="font-medium">{selectedRoomType.bed_configuration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available Rooms</span>
                        <span className={`font-medium ${selectedRoomType.available_rooms > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedRoomType.available_rooms} / {selectedRoomType.room_count}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Pricing</h3>
                    <div className="bg-gray-50 p-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Rate (per night)</span>
                        <span className="font-medium">{formatCurrency(selectedRoomType.base_rate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{nights} nights</span>
                        <span className="font-medium">{formatCurrency(selectedRoomType.base_rate * nights)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Taxes & Fees</span>
                        <span className="font-medium">{formatCurrency(selectedRoomType.base_rate * nights * 0.1)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total</span>
                          <span className="text-[#005357]">{formatCurrency(selectedRoomType.base_rate * nights * 1.1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amenities */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Room Amenities</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {selectedRoomType.amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50">
                        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                          {getAmenityIcon(amenity)}
                        </div>
                        <span className="text-sm font-medium text-gray-700">{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <button 
                    onClick={() => setSelectedRoomType(null)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button 
                    className="px-6 py-3 bg-[#005357] text-white font-medium hover:bg-[#004147] transition-colors disabled:opacity-50"
                    disabled={selectedRoomType.available_rooms === 0}
                  >
                    {selectedRoomType.available_rooms === 0 ? 'Not Available' : 'Book This Room'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && filteredRoomTypes.length === 0 && (
          <div className="text-center py-12">
            <BedIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or dates.</p>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
};

export default RoomsPage;