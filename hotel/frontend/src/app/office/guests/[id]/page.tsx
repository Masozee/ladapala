'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl } from '@/lib/config';
import {
  Search02Icon,
  UserMultipleIcon,
  Call02Icon,
  Mail01Icon,
  Location01Icon,
  Calendar01Icon,
  SparklesIcon,
  CreditCardIcon,
  UserIcon,
  PencilEdit02Icon,
  CancelCircleIcon,
  ArrowUp01Icon,
  PackageIcon,
  Clock01Icon,
  UserCheckIcon,
  Cancel01Icon,
  ChevronLeftIcon,
  Add01Icon,
  AlertCircleIcon,
  Shield01Icon,
  File01Icon,
  Settings02Icon,
  MoreHorizontalIcon,
  Alert01Icon
} from '@/lib/icons';

interface GuestRewards {
  program_name: string;
  member_number: string;
  tier_level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  points_balance: number;
  points_lifetime: number;
  tier_benefits: string[];
  next_tier_required: number;
  points_expiring: number;
  expiry_date: string;
  join_date: string;
}

interface GuestStay {
  id: number;
  reservation_number: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  room_type: string;
  room_number: string;
  total_amount: number;
  points_earned: number;
  rating?: number;
  review?: string;
  status: 'completed' | 'cancelled' | 'no_show' | 'current' | 'upcoming';
}

interface Guest {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  address: string;
  date_of_birth: string;
  gender: string;
  id_number: string;
  id_type: string;
  vip_status: boolean;
  preferences: string[];
  allergies: string[];
  emergency_contact_name: string;
  emergency_contact_phone: string;
  created_at: string;
  last_stay: string;
  total_stays: number;
  total_nights: number;
  total_spent: number;
  avg_rating: number;
  rewards?: GuestRewards;
  recent_stays: GuestStay[];
  notes: string;
  blacklisted: boolean;
  favorite_room_type?: string;
  preferred_floor?: number;
  marketing_consent: boolean;
}

// Mock guest data - in real app this would come from API
const MOCK_GUEST: Guest = {
  id: 1,
  full_name: 'John Smith',
  email: 'john.smith@email.com',
  phone: '+1-555-0123',
  nationality: 'United States',
  address: '123 Main Street, New York, NY 10001',
  date_of_birth: '1985-06-15',
  gender: 'Male',
  id_number: 'P123456789',
  id_type: 'Passport',
  vip_status: false,
  preferences: ['Non-smoking', 'High floor', 'City view', 'King bed', 'Late checkout', 'Welcome drink'],
  allergies: ['Nuts', 'Shellfish'],
  emergency_contact_name: 'Robert Smith',
  emergency_contact_phone: '+1-555-0199',
  created_at: '2023-01-15T10:30:00Z',
  last_stay: '2024-08-28T11:00:00Z',
  total_stays: 8,
  total_nights: 24,
  total_spent: 18500000,
  avg_rating: 4.8,
  rewards: {
    program_name: 'Kapulaga Rewards',
    member_number: 'KR123456789',
    tier_level: 'Gold',
    points_balance: 12450,
    points_lifetime: 28750,
    tier_benefits: ['Free WiFi', 'Late Checkout', 'Room Upgrade', 'Welcome Drink', 'Priority Booking'],
    next_tier_required: 6550,
    points_expiring: 2500,
    expiry_date: '2024-12-31',
    join_date: '2023-01-15'
  },
  recent_stays: [
    {
      id: 1,
      reservation_number: 'RSV123456',
      check_in_date: '2024-08-25',
      check_out_date: '2024-08-28',
      nights: 3,
      room_type: 'Deluxe King Suite',
      room_number: '1205',
      total_amount: 10125000,
      points_earned: 585,
      rating: 5,
      review: 'Excellent service, beautiful room with great city views.',
      status: 'completed'
    },
    {
      id: 2,
      reservation_number: 'RSV098765',
      check_in_date: '2024-06-12',
      check_out_date: '2024-06-15',
      nights: 3,
      room_type: 'Standard King',
      room_number: '803',
      total_amount: 6750000,
      points_earned: 390,
      rating: 4,
      status: 'completed'
    },
    {
      id: 3,
      reservation_number: 'RSV567890',
      check_in_date: '2024-12-15',
      check_out_date: '2024-12-18',
      nights: 3,
      room_type: 'Presidential Suite',
      room_number: '2001',
      total_amount: 20250000,
      points_earned: 1170,
      status: 'upcoming'
    }
  ],
  notes: 'Prefers rooms with city view. Allergic to nuts and shellfish - inform restaurant staff. Very polite and considerate guest.',
  blacklisted: false,
  favorite_room_type: 'Deluxe King Suite',
  preferred_floor: 12,
  marketing_consent: true
};

const GuestDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [guest, setGuest] = useState<Guest | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [showRewardsDetail, setShowRewardsDetail] = useState(false);

  useEffect(() => {
    const fetchGuest = async () => {
      try {
        const response = await fetch(buildApiUrl(`guests/${params.id}/`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Map Django API response to frontend format
        const mappedGuest: Guest = {
          id: data.id,
          full_name: data.full_name,
          email: data.email,
          phone: data.phone || 'No phone',
          nationality: data.nationality || 'Not specified',
          address: data.address || 'Not specified',
          date_of_birth: data.date_of_birth || '1990-01-01',
          gender: data.gender_display || 'Not specified',
          id_number: data.id_number || 'Not available',
          id_type: data.id_type || 'Not available',
          vip_status: data.vip_status || false,
          preferences: data.preferences_array || [],
          allergies: data.allergies || [],
          emergency_contact_name: data.emergency_contact_name || 'Not specified',
          emergency_contact_phone: data.emergency_contact_phone || 'Not specified',
          created_at: data.created_at,
          last_stay: data.last_stay || new Date().toISOString(),
          total_stays: data.total_stays || 0,
          total_nights: data.total_nights || 0,
          total_spent: data.total_spent || 0,
          avg_rating: data.avg_rating || 4.5,
          rewards: data.rewards ? {
            program_name: data.rewards.program_name,
            member_number: data.rewards.member_number,
            tier_level: data.rewards.tier_level as 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond',
            points_balance: data.rewards.points_balance,
            points_lifetime: data.rewards.points_lifetime,
            tier_benefits: data.rewards.tier_benefits,
            next_tier_required: data.rewards.next_tier_required,
            points_expiring: data.rewards.points_expiring,
            expiry_date: data.rewards.expiry_date,
            join_date: data.rewards.join_date
          } : undefined,
          recent_stays: data.recent_stays || [],
          notes: data.notes || '',
          blacklisted: data.blacklisted || false,
          favorite_room_type: data.favorite_room_type,
          preferred_floor: data.preferred_floor,
          marketing_consent: data.marketing_consent || true
        };
        
        setGuest(mappedGuest);
        setEditedNotes(mappedGuest.notes);
      } catch (error) {
        console.error('Failed to fetch guest:', error);
        // Fallback to mock data if API fails
        setGuest(MOCK_GUEST);
        setEditedNotes(MOCK_GUEST.notes);
      }
    };

    fetchGuest();
  }, [params.id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Bronze': return 'bg-orange-100 text-orange-800';
      case 'Silver': return 'bg-gray-100 text-gray-800';
      case 'Gold': return 'bg-yellow-100 text-yellow-800';
      case 'Platinum': return 'bg-purple-100 text-purple-800';
      case 'Diamond': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Bronze': return <SparklesIcon className="h-4 w-4" />;
      case 'Silver': return <SparklesIcon className="h-4 w-4" />;
      case 'Gold': return <SparklesIcon className="h-4 w-4" />;
      case 'Platinum': return <SparklesIcon className="h-4 w-4" />;
      case 'Diamond': return <SparklesIcon className="h-4 w-4" />;
      default: return <SparklesIcon className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'current': return 'bg-blue-100 text-blue-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveNotes = () => {
    if (guest) {
      setGuest({...guest, notes: editedNotes});
      setIsEditing(false);
      // In real app, save to API
    }
  };

  if (!guest) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading guest profile...</h3>
          </div>
        </div>
      </OfficeLayout>
    );
  }

  const breadcrumb = [
    { label: 'Home', href: '/' },
    { label: 'Guests', href: '/guests' },
    { label: guest?.full_name || `Guest #${params.id}` }
  ];

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header with Navigation */}
        <div className="space-y-4">
          {/* Back Navigation */}
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Back to Guests</span>
            </button>
          </div>
          
          {/* Page Title */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{guest.full_name}</h1>
            <p className="text-gray-600 mt-1">Guest Profile & Management</p>
          </div>
        </div>

        {/* Guest Profile Header */}
        <div className="bg-white border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  <UserIcon className="h-10 w-10 text-gray-600" />
                </div>
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">{guest.full_name}</h2>
                    {guest.vip_status && (
                      <span className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 text-sm font-medium rounded">
                        <SparklesIcon className="h-4 w-4 fill-current" />
                        <span>VIP Guest</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Mail01Icon className="h-4 w-4" />
                      <span>{guest.email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Call02Icon className="h-4 w-4" />
                      <span>{guest.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Location01Icon className="h-4 w-4" />
                      <span>{guest.nationality}</span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Guest ID: {guest.id} • Member since {formatDate(guest.created_at)}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                  <PencilEdit02Icon className="h-4 w-4" />
                  <span>Edit Profile</span>
                </button>
                <button className="flex items-center space-x-2 px-4 py-2 bg-[#4E61D3] text-white hover:bg-[#3D4EA8] transition-colors">
                  <Add01Icon className="h-4 w-4" />
                  <span>New Reservation</span>
                </button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#4E61D3]">{guest.total_stays}</div>
                <div className="text-sm text-gray-600">Total Stays</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#4E61D3]">{guest.total_nights}</div>
                <div className="text-sm text-gray-600">Total Nights</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-[#4E61D3]">{formatCurrency(guest.total_spent)}</div>
                <div className="text-sm text-gray-600">Total Spent</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1">
                  <SparklesIcon className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="text-2xl font-bold text-gray-900">{guest.avg_rating}</span>
                </div>
                <div className="text-sm text-gray-600">Average Rating</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Personal Information */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#4E61D3]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Contact Information</h3>
                    <p className="text-sm text-gray-200 mt-1">Personal details and contact info</p>
                  </div>
                  <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                    <Call02Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">{guest.email}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Phone</label>
                      <p className="text-gray-900">{guest.phone}</p>
                    </div>
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">Address</label>
                    <p className="text-gray-900">{guest.address}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium text-gray-700">Date of Birth</label>
                      <p className="text-gray-900">{formatDate(guest.date_of_birth)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Gender</label>
                      <p className="text-gray-900">{guest.gender}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium text-gray-700">ID Type</label>
                      <p className="text-gray-900">{guest.id_type}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">ID Number</label>
                      <p className="text-gray-900">{guest.id_number}</p>
                    </div>
                  </div>
                  <div className="pt-4">
                    <label className="font-medium text-gray-700">Emergency Contact</label>
                    <p className="text-gray-900">{guest.emergency_contact_name}</p>
                    <p className="text-gray-600 text-xs">{guest.emergency_contact_phone}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Preferences & Allergies */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#4E61D3]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Preferences & Allergies</h3>
                    <p className="text-sm text-gray-200 mt-1">Guest preferences and dietary restrictions</p>
                  </div>
                  <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Room Preferences</h4>
                    <div className="flex flex-wrap gap-2">
                      {guest.preferences.map((pref, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 px-3 py-1 text-xs rounded-full">
                          {pref}
                        </span>
                      ))}
                    </div>
                  </div>
                  {guest.allergies.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Allergies & Dietary Restrictions</h4>
                      <div className="flex flex-wrap gap-2">
                        {guest.allergies.map((allergy, index) => (
                          <span key={index} className="inline-flex items-center space-x-1 bg-red-100 text-red-800 px-3 py-1 text-xs rounded-full">
                            <Alert01Icon className="h-3 w-3" />
                            <span>{allergy}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 text-sm">
                    <div>
                      <label className="font-medium text-gray-700">Favorite Room Type</label>
                      <p className="text-gray-900">{guest.favorite_room_type || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">Preferred Floor</label>
                      <p className="text-gray-900">{guest.preferred_floor ? `Floor ${guest.preferred_floor}` : 'No preference'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Loyalty & Notes */}
          <div className="space-y-6">
            {/* Rewards Program */}
            {guest.rewards && (
              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#4E61D3]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Loyalty Rewards</h3>
                      <p className="text-sm text-gray-200 mt-1">Membership tier and points balance</p>
                    </div>
                    <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                      {getTierIcon(guest.rewards.tier_level)}
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center space-x-2 px-4 py-2 text-sm font-bold rounded ${getTierColor(guest.rewards.tier_level)}`}>
                        {getTierIcon(guest.rewards.tier_level)}
                        <span>{guest.rewards.tier_level} Member</span>
                      </span>
                      <div className="text-sm">
                        <p className="font-medium">{guest.rewards.program_name}</p>
                        <p className="text-gray-600">#{guest.rewards.member_number}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center bg-white p-4 rounded">
                        <div className="text-2xl font-bold text-[#4E61D3]">{guest.rewards.points_balance.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Available Points</div>
                      </div>
                      <div className="text-center bg-white p-4 rounded">
                        <div className="text-2xl font-bold text-gray-600">{guest.rewards.points_lifetime.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Lifetime Points</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Next Tier Progress</span>
                        <span className="font-medium">{guest.rewards.next_tier_required.toLocaleString()} points needed</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-[#4E61D3] h-2 rounded-full"
                          style={{width: `${Math.min((guest.rewards.points_balance / (guest.rewards.points_balance + guest.rewards.next_tier_required)) * 100, 100)}%`}}
                        ></div>
                      </div>
                    </div>

                    {guest.rewards.points_expiring > 0 && (
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
                        <div className="flex items-start space-x-2">
                          <Clock01Icon className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-yellow-800">Points Expiring Soon</p>
                            <p className="text-yellow-700">{guest.rewards.points_expiring.toLocaleString()} points expire on {formatDate(guest.rewards.expiry_date)}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => setShowRewardsDetail(true)}
                      className="w-full text-sm bg-[#4E61D3] text-white px-4 py-2 hover:bg-[#3D4EA8] transition-colors"
                    >
                      View Full Rewards Details
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Guest Notes */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#4E61D3]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Staff Notes</h3>
                    <p className="text-sm text-gray-200 mt-1">Internal notes and observations</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded"
                      >
                        <PencilEdit02Icon className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleSaveNotes}
                          className="p-2 text-green-300 hover:bg-white/10 rounded"
                        >
                          <PackageIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditing(false);
                            setEditedNotes(guest.notes);
                          }}
                          className="p-2 text-white/70 hover:bg-white/10 rounded"
                        >
                          <Cancel01Icon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                      <File01Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                {isEditing ? (
                  <textarea
                    value={editedNotes}
                    onChange={(e) => setEditedNotes(e.target.value)}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3] text-sm resize-none"
                    placeholder="Add notes about this guest..."
                  />
                ) : (
                  <div className="text-sm text-gray-800 whitespace-pre-wrap bg-white p-4 border border-gray-200 rounded min-h-[120px]">
                    {guest.notes || 'No notes added yet.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stay History Section - Full Width Below */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#4E61D3]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Stay History</h3>
                <p className="text-sm text-gray-200 mt-1">Complete booking and stay records</p>
              </div>
              <div className="w-8 h-8 bg-white/20 flex items-center justify-center">
                <Calendar01Icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[#4E61D3]">
                <tr>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                    Reservation
                  </th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                    Dates
                  </th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                    Room
                  </th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                    Amount
                  </th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                    Points
                  </th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                    Rating
                  </th>
                  <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {guest.recent_stays.map((stay) => (
                  <tr key={stay.id} className="hover:bg-gray-50">
                    <td className="border border-gray-200 px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{stay.reservation_number}</div>
                        <div className="text-xs text-gray-500">{stay.nights} night{stay.nights > 1 ? 's' : ''}</div>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-6 py-4">
                      <div>
                        <div className="text-sm text-gray-900">{formatDate(stay.check_in_date)}</div>
                        <div className="text-xs text-gray-500">to {formatDate(stay.check_out_date)}</div>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{stay.room_type}</div>
                        <div className="text-xs text-gray-500">Room {stay.room_number}</div>
                      </div>
                    </td>
                    <td className="border border-gray-200 px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(stay.total_amount)}
                      </div>
                    </td>
                    <td className="border border-gray-200 px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {stay.points_earned.toLocaleString()} pts
                      </div>
                    </td>
                    <td className="border border-gray-200 px-6 py-4">
                      {stay.rating ? (
                        <div className="flex items-center space-x-1">
                          <SparklesIcon className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="text-sm text-gray-900">{stay.rating}/5</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No rating</span>
                      )}
                    </td>
                    <td className="border border-gray-200 px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(stay.status)}`}>
                        {stay.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-gray-50">
            <button className="text-sm text-[#4E61D3] hover:bg-[#4E61D3] hover:text-white px-4 py-2 border border-[#4E61D3] transition-colors">
              View Complete History ({guest.total_stays} total stays)
            </button>
          </div>
        </div>

        {/* Guest Reviews Section */}
        {guest.recent_stays.some(stay => stay.review) && (
          <div className="bg-white border border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Guest Reviews & Feedback</h3>
                  <p className="text-sm text-gray-600 mt-1">Reviews from recent stays</p>
                </div>
                <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                  <SparklesIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {guest.recent_stays
                  .filter(stay => stay.review)
                  .map((stay) => (
                    <div key={stay.id} className="bg-white p-4 border border-gray-200 rounded">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-gray-900">{stay.room_type}</h4>
                          <p className="text-xs text-gray-600">{stay.reservation_number} • {formatDate(stay.check_in_date)}</p>
                        </div>
                        {stay.rating && (
                          <div className="flex items-center space-x-1">
                            <SparklesIcon className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm font-bold text-gray-900">{stay.rating}/5</span>
                          </div>
                        )}
                      </div>
                      <blockquote className="text-sm text-gray-700 italic">
                        &ldquo;{stay.review}&rdquo;
                      </blockquote>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Rewards Detail Modal */}
        {showRewardsDetail && guest.rewards && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 bg-[#4E61D3] flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Loyalty Rewards Details</h2>
                  <p className="text-sm text-gray-200 mt-1">{guest.full_name}</p>
                </div>
                <button 
                  onClick={() => setShowRewardsDetail(false)}
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded"
                >
                  <Cancel01Icon className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-6">
                {/* Tier Status */}
                <div className="text-center mb-6">
                  <div className={`inline-flex items-center space-x-3 px-6 py-3 text-lg font-bold rounded-lg ${getTierColor(guest.rewards.tier_level)}`}>
                    <div className="w-8 h-8 flex items-center justify-center">
                      {getTierIcon(guest.rewards.tier_level)}
                    </div>
                    <span>{guest.rewards.tier_level} Member</span>
                  </div>
                  <p className="text-gray-600 mt-2">Member since {formatDate(guest.rewards.join_date)}</p>
                </div>

                {/* Points Overview */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold text-[#4E61D3]">{guest.rewards.points_balance.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Available Points</div>
                  </div>
                  <div className="text-center bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold text-gray-600">{guest.rewards.points_lifetime.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Lifetime Points</div>
                  </div>
                  <div className="text-center bg-gray-50 p-4 rounded">
                    <div className="text-2xl font-bold text-orange-600">{guest.rewards.next_tier_required.toLocaleString()}</div>
                    <div className="text-sm text-gray-600">Next Tier</div>
                  </div>
                </div>

                {/* Tier Benefits */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Tier Benefits</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {guest.rewards.tier_benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2 bg-green-50 p-3 rounded">
                        <UserCheckIcon className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-800">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button 
                    onClick={() => setShowRewardsDetail(false)}
                    className="px-6 py-3 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors"
                  >
                    Close
                  </button>
                  <button className="px-6 py-3 bg-[#4E61D3] text-white font-medium hover:bg-[#3D4EA8] transition-colors">
                    Redeem Points
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  );
};

export default GuestDetailPage;