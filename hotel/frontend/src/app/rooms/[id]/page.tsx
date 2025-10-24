'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { buildApiUrl } from '@/lib/config';
import {
  ChevronLeftIcon,
  Calendar01Icon,
  UserMultipleIcon,
  PackageIcon,
  Shield01Icon,
  Call02Icon,
  BedIcon,
  Location01Icon,
  SparklesIcon,
  UserCheckIcon,
  EyeIcon,
  Settings02Icon
} from '@/lib/icons';

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

const fetchRoomType = async (id: string): Promise<RoomType | null> => {
  try {
    const response = await fetch(buildApiUrl(`room-types/${id}/`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const djangoRoom: DjangoRoomType = await response.json();
    
    // Map Django response to frontend format
    return {
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
        : djangoRoom.available_rooms_count + Math.floor(Math.random() * 10) + 5,
      available_rooms: djangoRoom.available_rooms_count
    };
  } catch (error) {
    console.error('Failed to fetch room type:', error);
    return null;
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
  
  return amenitiesString
    .split(',')
    .map(amenity => amenity.trim())
    .filter(amenity => amenity.length > 0)
    .slice(0, 12);
};

const RoomDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case 'wifi': return <SparklesIcon className="h-5 w-5" />;
      case 'tv': return <ViewIcon className="h-5 w-5" />;
      case 'ac': return <AirVent className="h-5 w-5" />;
      case 'mini bar': return <SparklesIcon className="h-5 w-5" />;
      case 'room service': return <UtensilsCrossed className="h-5 w-5" />;
      case 'safe': return <Shield className="h-5 w-5" />;
      case 'phone': return <Call02Icon className="h-5 w-5" />;
      case 'bathtub': return <Shield01Icon className="h-5 w-5" />;
      case 'jacuzzi': return <Shield01Icon className="h-5 w-5" />;
      case 'balcony': return <Location01Icon className="h-5 w-5" />;
      case 'city view': return <EyeIcon className="h-5 w-5" />;
      case 'panoramic view': return <EyeIcon className="h-5 w-5" />;
      default: return <UserCheckIcon className="h-5 w-5" />;
    }
  };

  const calculateNights = () => {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const nights = calculateNights();

  useEffect(() => {
    const loadRoomType = async () => {
      if (params.id) {
        try {
          setLoading(true);
          setError(null);
          const data = await fetchRoomType(params.id as string);
          if (data) {
            setRoomType(data);
          } else {
            setError('Room type not found');
          }
        } catch (err) {
          setError('Failed to load room type. Please try again.');
          console.error('Error loading room type:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    loadRoomType();
  }, [params.id]);

  const breadcrumb = [
    { label: 'Home', href: '/' },
    { label: 'Rooms', href: '/rooms' },
    { label: roomType?.name || 'Room Detail' }
  ];

  if (loading) {
    return (
      <AppLayout breadcrumb={breadcrumb}>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005357] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading room details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error || !roomType) {
    return (
      <AppLayout breadcrumb={breadcrumb}>
        <div className="text-center py-12">
          <BedIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Room not found</h3>
          <p className="text-gray-600 mb-4">{error || 'This room type does not exist.'}</p>
          <button 
            onClick={() => router.push('/rooms')}
            className="bg-[#005357] text-white px-4 py-2 hover:bg-[#004147] transition-colors"
          >
            Back to Rooms
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumb={breadcrumb}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-[#005357] text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/rooms')}
                className="flex items-center space-x-2 text-white hover:text-gray-200 transition-colors"
              >
                <ChevronLeftIcon className="h-5 w-5" />
                <span>Back to Rooms</span>
              </button>
              <div className="border-l border-white/20 pl-4">
                <h1 className="text-2xl font-bold">{roomType.name}</h1>
                <p className="text-white/80 mt-1">Room Details & Booking</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 bg-white/10 text-white px-4 py-2 text-sm font-medium hover:bg-white/20 transition-colors">
                <Settings02Icon className="h-4 w-4" />
                <span>Manage Room</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Room Gallery</h3>
                    <p className="text-sm text-gray-600 mt-1">View room photos and amenities</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <EyeIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                {/* Main Image */}
                <div className="aspect-video bg-gray-200 mb-4 overflow-hidden">
                  <img
                    src={roomType.images[selectedImageIndex]}
                    alt={`${roomType.name} ${selectedImageIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Thumbnail Gallery */}
                {roomType.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {roomType.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-video overflow-hidden border-2 transition-colors ${
                          selectedImageIndex === index ? 'border-[#005357]' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`${roomType.name} thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Room Description */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Room Description</h3>
                    <p className="text-sm text-gray-600 mt-1">Detailed information about this room type</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <BedIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <p className="text-gray-700 mb-6">{roomType.description}</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#005357] text-white rounded-full flex items-center justify-center mx-auto mb-2">
                      <Location01Icon className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">{roomType.room_size} sqm</div>
                    <div className="text-xs text-gray-600">Room Size</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#005357] text-white rounded-full flex items-center justify-center mx-auto mb-2">
                      <UserMultipleIcon className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">{roomType.max_occupancy} guests</div>
                    <div className="text-xs text-gray-600">Max Occupancy</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#005357] text-white rounded-full flex items-center justify-center mx-auto mb-2">
                      <BedIcon className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">{roomType.bed_configuration}</div>
                    <div className="text-xs text-gray-600">Bed Type</div>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-[#005357] text-white rounded-full flex items-center justify-center mx-auto mb-2">
                      <UserCheckIcon className="h-6 w-6" />
                    </div>
                    <div className="text-sm font-medium text-gray-900">{roomType.available_rooms}/{roomType.room_count}</div>
                    <div className="text-xs text-gray-600">Available</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Room Amenities</h3>
                    <p className="text-sm text-gray-600 mt-1">All included facilities and services</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {roomType.amenities.map((amenity, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-white border">
                      <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                        {getAmenityIcon(amenity)}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 sticky top-6">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Book This Room</h3>
                    <p className="text-sm text-gray-600 mt-1">Select dates and guests</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <Calendar01Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50">
                <form className="space-y-4">
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
                        {Array.from({ length: roomType.max_occupancy }, (_, i) => i + 1).map(num => (
                          <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  <div className="bg-white p-4 space-y-3 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Rate (per night)</span>
                      <span className="font-medium">{formatCurrency(roomType.base_rate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{nights} night{nights > 1 ? 's' : ''}</span>
                      <span className="font-medium">{formatCurrency(roomType.base_rate * nights)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxes & Fees</span>
                      <span className="font-medium">{formatCurrency(roomType.base_rate * nights * 0.1)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span className="text-[#005357]">{formatCurrency(roomType.base_rate * nights * 1.1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Availability Status */}
                  <div className="bg-white p-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Available Rooms</span>
                      <span className={`text-sm font-bold ${roomType.available_rooms > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {roomType.available_rooms} / {roomType.room_count}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div 
                        className={`h-2 rounded-full ${roomType.available_rooms > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                        style={{width: `${(roomType.available_rooms / roomType.room_count) * 100}%`}}
                      ></div>
                    </div>

                    {roomType.available_rooms <= 3 && roomType.available_rooms > 0 && (
                      <p className="text-xs text-orange-600 font-medium mb-3">Only {roomType.available_rooms} rooms left!</p>
                    )}

                    <button 
                      type="button"
                      className="w-full bg-[#005357] text-white py-3 px-4 font-medium hover:bg-[#004147] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={roomType.available_rooms === 0}
                    >
                      {roomType.available_rooms === 0 ? 'Not Available' : 'Book Now'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RoomDetailPage;