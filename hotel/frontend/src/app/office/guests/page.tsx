'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  ViewIcon,
  ListViewIcon,
  FilterIcon,
  Add01Icon,
  Settings02Icon,
  MoreHorizontalIcon,
  EyeIcon,
  PencilEdit02Icon,
  CancelCircleIcon,
  ArrowUp01Icon,
  PackageIcon,
  Clock01Icon,
  UserCheckIcon,
  Cancel01Icon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@/lib/icons';

// Django API interfaces
interface DjangoGuest {
  id: number;
  full_name: string;
  email: string;
  phone: string | null;
  nationality: string | null;
  loyalty_points: number;
  is_vip: boolean;
  is_active: boolean;
  gender_display: string | null;
  loyalty_level: string;
}

interface DjangoGuestDetail {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  age: number;
  gender: string;
  gender_display: string | null;
  nationality: string | null;
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  loyalty_points: number;
  preferences: any;
  notes: string | null;
  is_vip: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  documents: any[];
  loyalty_level: {
    level: string;
    color: string;
  };
  total_stays: number;
  total_spent: number;
}

interface DjangoApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DjangoGuest[];
}

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
  status: 'completed' | 'cancelled' | 'no_show';
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

// Interfaces for Django reservations API
interface DjangoReservation {
  id: number;
  reservation_number: string;
  check_in_date: string;
  check_out_date: string;
  status: string;
  total_amount: string;
  room_assignments?: {
    room_number: string;
    room_type_name: string;
  }[];
  num_nights: number;
}

interface DjangoReservationResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: DjangoReservation[];
}

// Fetch guest reservations
const fetchGuestReservations = async (guestId: number): Promise<GuestStay[]> => {
  try {
    const response = await fetch(buildApiUrl(`hotel/reservations/?guest=${guestId}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`Could not fetch reservations for guest ${guestId}: ${response.status}`);
      return [];
    }
    
    const data: DjangoReservationResponse = await response.json();
    
    return data.results.map((reservation): GuestStay => ({
      id: reservation.id,
      reservation_number: reservation.reservation_number,
      check_in_date: reservation.check_in_date,
      check_out_date: reservation.check_out_date,
      nights: reservation.num_nights,
      room_type: reservation.room_assignments?.[0]?.room_type_name || 'Unknown',
      room_number: reservation.room_assignments?.[0]?.room_number || 'N/A',
      total_amount: Math.round(parseFloat(reservation.total_amount)),
      points_earned: Math.round(parseFloat(reservation.total_amount) * 0.01), // 1% points
      rating: Math.floor(Math.random() * 2) + 4, // Random rating 4-5
      status: mapReservationStatus(reservation.status)
    }));
  } catch (error) {
    console.warn(`Error fetching reservations for guest ${guestId}:`, error);
    return [];
  }
};

// Map Django reservation status to frontend format
const mapReservationStatus = (status: string): 'completed' | 'cancelled' | 'no_show' => {
  switch (status.toUpperCase()) {
    case 'CHECKED_OUT': return 'completed';
    case 'CANCELLED': return 'cancelled';
    case 'NO_SHOW': return 'no_show';
    default: return 'completed';
  }
};

// API fetch functions
const fetchGuests = async (page: number = 1, limit: number = 20): Promise<{ guests: Guest[], count: number }> => {
  try {
    const offset = (page - 1) * limit;
    const response = await fetch(buildApiUrl(`hotel/guests/?limit=${limit}&offset=${offset}`), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DjangoApiResponse = await response.json();
    
    // Fetch reservations for each guest and calculate statistics
    const guestsWithStats = await Promise.all(
      data.results.map(async (djangoGuest): Promise<Guest> => {
        const reservations = await fetchGuestReservations(djangoGuest.id);
        const completedReservations = reservations.filter(r => r.status === 'completed');
        
        const totalSpent = completedReservations.reduce((sum, r) => sum + r.total_amount, 0);
        const totalNights = completedReservations.reduce((sum, r) => sum + r.nights, 0);
        const lastStay = completedReservations.length > 0 
          ? completedReservations.sort((a, b) => new Date(b.check_out_date).getTime() - new Date(a.check_out_date).getTime())[0].check_out_date
          : new Date().toISOString();
        
        return {
          id: djangoGuest.id,
          full_name: djangoGuest.full_name,
          email: djangoGuest.email,
          phone: djangoGuest.phone || 'No phone',
          nationality: djangoGuest.nationality || 'Not specified',
          address: 'Not specified', // Not available in list API
          date_of_birth: '1990-01-01', // Default value, get from detail API if needed
          gender: djangoGuest.gender_display || 'Not specified',
          id_number: 'Not available', // Not available in list API
          id_type: 'Not available', // Not available in list API
          vip_status: djangoGuest.is_vip,
          preferences: [], // Could be populated from detail API
          allergies: [], // Not available in current API
          emergency_contact_name: 'Not specified', // Not available in current API
          emergency_contact_phone: 'Not specified', // Not available in current API
          created_at: new Date().toISOString(), // Default value
          last_stay: lastStay,
          total_stays: completedReservations.length,
          total_nights: totalNights,
          total_spent: totalSpent,
          avg_rating: completedReservations.length > 0 
            ? completedReservations.reduce((sum, r) => sum + (r.rating || 4.5), 0) / completedReservations.length 
            : 4.5,
          rewards: {
            program_name: 'Kapulaga Rewards',
            member_number: `KR${djangoGuest.id.toString().padStart(9, '0')}`,
            tier_level: mapLoyaltyLevel(djangoGuest.loyalty_level),
            points_balance: djangoGuest.loyalty_points,
            points_lifetime: djangoGuest.loyalty_points * 2, // Estimate
            tier_benefits: getTierBenefits(mapLoyaltyLevel(djangoGuest.loyalty_level)),
            next_tier_required: getNextTierRequired(mapLoyaltyLevel(djangoGuest.loyalty_level), djangoGuest.loyalty_points),
            points_expiring: 0, // Default
            expiry_date: '2025-12-31',
            join_date: '2024-01-01'
          },
          recent_stays: reservations.slice(0, 5), // Show last 5 stays
          notes: 'Fetched from API', // Default note
          blacklisted: !djangoGuest.is_active,
          favorite_room_type: completedReservations.length > 0 
            ? completedReservations[0].room_type 
            : 'Standard Room',
          preferred_floor: 1, // Default
          marketing_consent: true // Default
        };
      })
    );

    return {
      guests: guestsWithStats,
      count: data.count
    };
  } catch (error) {
    console.error('Failed to fetch guests:', error);
    // Re-throw error so it can be handled in the component
    throw error;
  }
};

// Helper functions for data mapping
const mapLoyaltyLevel = (level: string): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' => {
  if (!level) return 'Bronze';
  switch (level.toLowerCase()) {
    case 'bronze': return 'Bronze';
    case 'silver': return 'Silver';
    case 'gold': return 'Gold';
    case 'platinum': return 'Platinum';
    case 'diamond': return 'Diamond';
    default: return 'Bronze';
  }
};

const getTierBenefits = (tier: string): string[] => {
  switch (tier) {
    case 'Bronze': return ['Free WiFi'];
    case 'Silver': return ['Free WiFi', 'Late Checkout'];
    case 'Gold': return ['Free WiFi', 'Late Checkout', 'Room Upgrade', 'Welcome Drink'];
    case 'Platinum': return ['Free WiFi', 'Late Checkout', 'Room Upgrade', 'Welcome Drink', 'Priority Booking', 'Lounge Access'];
    case 'Diamond': return ['Free WiFi', 'Late Checkout', 'Room Upgrade', 'Welcome Drink', 'Priority Booking', 'Lounge Access', 'Butler Service'];
    default: return ['Free WiFi'];
  }
};

const getNextTierRequired = (tier: string, currentPoints: number): number => {
  switch (tier) {
    case 'Bronze': return Math.max(0, 500 - currentPoints);
    case 'Silver': return Math.max(0, 1000 - currentPoints);
    case 'Gold': return Math.max(0, 2500 - currentPoints);
    case 'Platinum': return Math.max(0, 5000 - currentPoints);
    case 'Diamond': return 0; // Max tier reached
    default: return 500;
  }
};

const MOCK_GUESTS: Guest[] = [
  {
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
    preferences: ['Non-smoking', 'High floor', 'City view', 'King bed'],
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
      }
    ],
    notes: 'Prefers rooms with city view. Allergic to nuts and shellfish - inform restaurant staff.',
    blacklisted: false,
    favorite_room_type: 'Deluxe King Suite',
    preferred_floor: 12,
    marketing_consent: true
  },
  {
    id: 2,
    full_name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1-555-0456',
    nationality: 'Canada',
    address: '456 Queen Street, Toronto, ON M5V 3A8',
    date_of_birth: '1990-03-22',
    gender: 'Female',
    id_number: 'C987654321',
    id_type: 'Passport',
    vip_status: true,
    preferences: ['Non-smoking', 'Quiet floor', 'Ocean view', 'Extra pillows'],
    allergies: [],
    emergency_contact_name: 'Michael Johnson',
    emergency_contact_phone: '+1-555-0789',
    created_at: '2022-08-20T14:15:00Z',
    last_stay: '2024-07-18T11:00:00Z',
    total_stays: 15,
    total_nights: 45,
    total_spent: 35250000,
    avg_rating: 4.9,
    rewards: {
      program_name: 'Kapulaga Rewards',
      member_number: 'KR987654321',
      tier_level: 'Platinum',
      points_balance: 28950,
      points_lifetime: 67800,
      tier_benefits: ['Free WiFi', 'Late Checkout', 'Room Upgrade', 'Welcome Drink', 'Priority Booking', 'Lounge Access', 'Free Breakfast'],
      next_tier_required: 2200,
      points_expiring: 1800,
      expiry_date: '2025-03-31',
      join_date: '2022-08-20'
    },
    recent_stays: [
      {
        id: 3,
        reservation_number: 'RSV567890',
        check_in_date: '2024-07-15',
        check_out_date: '2024-07-18',
        nights: 3,
        room_type: 'Presidential Suite',
        room_number: '2001',
        total_amount: 20250000,
        points_earned: 1170,
        rating: 5,
        review: 'Outstanding experience! The presidential suite was perfect.',
        status: 'completed'
      }
    ],
    notes: 'VIP guest. Prefers quiet floors and ocean views. Very loyal customer.',
    blacklisted: false,
    favorite_room_type: 'Presidential Suite',
    preferred_floor: 20,
    marketing_consent: true
  },
  {
    id: 3,
    full_name: 'Ahmad Rahman',
    email: 'ahmad.rahman@email.com',
    phone: '+62-812-3456-7890',
    nationality: 'Indonesia',
    address: 'Jl. Sudirman No. 123, Jakarta 10220',
    date_of_birth: '1978-11-10',
    gender: 'Male',
    id_number: '3171051011780001',
    id_type: 'KTP',
    vip_status: false,
    preferences: ['Non-smoking', 'Halal food', 'Prayer mat', 'Qibla direction'],
    allergies: ['Pork', 'Alcohol'],
    emergency_contact_name: 'Siti Rahman',
    emergency_contact_phone: '+62-812-9876-5432',
    created_at: '2023-05-10T09:00:00Z',
    last_stay: '2024-05-20T11:00:00Z',
    total_stays: 6,
    total_nights: 18,
    total_spent: 13500000,
    avg_rating: 4.5,
    rewards: {
      program_name: 'Kapulaga Rewards',
      member_number: 'KR456789123',
      tier_level: 'Silver',
      points_balance: 8750,
      points_lifetime: 15450,
      tier_benefits: ['Free WiFi', 'Late Checkout', 'Room Upgrade', 'Welcome Drink'],
      next_tier_required: 4550,
      points_expiring: 0,
      expiry_date: '2025-05-31',
      join_date: '2023-05-10'
    },
    recent_stays: [
      {
        id: 4,
        reservation_number: 'RSV234567',
        check_in_date: '2024-05-17',
        check_out_date: '2024-05-20',
        nights: 3,
        room_type: 'Executive Twin',
        room_number: '1012',
        total_amount: 7875000,
        points_earned: 455,
        rating: 4,
        status: 'completed'
      }
    ],
    notes: 'Muslim guest. Requires halal food options and prayer facilities. Very respectful guest.',
    blacklisted: false,
    favorite_room_type: 'Executive Twin',
    marketing_consent: true
  }
];

const GuestsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterVIP, setFilterVIP] = useState<boolean | null>(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20); // Show 20 guests per page
  const totalPages = Math.ceil(totalCount / pageSize);
  
  // New Guest Modal states
  const [showNewGuestModal, setShowNewGuestModal] = useState(false);
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // New Guest Form states
  const [newGuest, setNewGuest] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    nationality: '',
    address: '',
    postal_code: '',
    city: '',
    country: '',
    is_vip: false,
    preferences: {},
    notes: ''
  });
  
  // Advanced filter states
  const [filterCountry, setFilterCountry] = useState('');
  const [minSpent, setMinSpent] = useState('');
  const [maxSpent, setMaxSpent] = useState('');
  const [minStays, setMinStays] = useState('');
  const [lastStayFrom, setLastStayFrom] = useState('');
  const [lastStayTo, setLastStayTo] = useState('');
  const [hasAllergies, setHasAllergies] = useState<boolean | null>(null);

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
      case 'Bronze': return <SparklesIcon className="h-3 w-3" />;
      case 'Silver': return <SparklesIcon className="h-3 w-3" />;
      case 'Gold': return <SparklesIcon className="h-3 w-3" />;
      case 'Platinum': return <SparklesIcon className="h-3 w-3" />;
      case 'Diamond': return <SparklesIcon className="h-3 w-3" />;
      default: return <SparklesIcon className="h-3 w-3" />;
    }
  };

  // Enhanced filtering logic
  const resetFilters = () => {
    setFilterTier('all');
    setFilterVIP(null);
    setFilterCountry('');
    setMinSpent('');
    setMaxSpent('');
    setMinStays('');
    setLastStayFrom('');
    setLastStayTo('');
    setHasAllergies(null);
    setSearchTerm('');
  };

  // Create new guest
  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingGuest(true);
    setCreateError(null);

    try {
      const response = await fetch(buildApiUrl('hotel/guests/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGuest),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const createdGuest = await response.json();
      
      // Refresh guests list
      const updatedGuests = await fetchGuests();
      setGuests(updatedGuests.guests);
      
      // Reset form and close modal
      setNewGuest({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        gender: '',
        nationality: '',
        address: '',
        postal_code: '',
        city: '',
        country: '',
        is_vip: false,
        preferences: {},
        notes: ''
      });
      setShowNewGuestModal(false);
      
      // Show success message or redirect to new guest detail
      console.log('Guest created successfully:', createdGuest);
      
    } catch (error) {
      setCreateError(error instanceof Error ? error.message : 'Failed to create guest');
      console.error('Error creating guest:', error);
    } finally {
      setIsCreatingGuest(false);
    }
  };

  const handleFormChange = (field: string, value: any) => {
    setNewGuest(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const resetNewGuestForm = () => {
    setNewGuest({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: '',
      nationality: '',
      address: '',
      postal_code: '',
      city: '',
      country: '',
      is_vip: false,
      preferences: {},
      notes: ''
    });
    setCreateError(null);
  };

  // Fetch guests from API
  useEffect(() => {
    const loadGuests = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchGuests(currentPage, pageSize);
        setGuests(data.guests);
        setTotalCount(data.count);
      } catch (err) {
        setError('Failed to load guests. Using offline data.');
        console.error('Error loading guests:', err);
        // Fallback to mock data on error
        setGuests(MOCK_GUESTS);
        setTotalCount(MOCK_GUESTS.length);
      } finally {
        setLoading(false);
      }
    };

    loadGuests();
  }, [currentPage, pageSize]);

  const filteredGuests = guests.filter(guest => {
    if (searchTerm && !guest.full_name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !guest.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !guest.phone?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterTier !== 'all' && guest.rewards?.tier_level !== filterTier) {
      return false;
    }
    if (filterVIP !== null && guest.vip_status !== filterVIP) {
      return false;
    }
    if (filterCountry && !guest.nationality.toLowerCase().includes(filterCountry.toLowerCase())) {
      return false;
    }
    if (minSpent && guest.total_spent < parseInt(minSpent)) {
      return false;
    }
    if (maxSpent && guest.total_spent > parseInt(maxSpent)) {
      return false;
    }
    if (minStays && guest.total_stays < parseInt(minStays)) {
      return false;
    }
    if (lastStayFrom && new Date(guest.last_stay) < new Date(lastStayFrom)) {
      return false;
    }
    if (lastStayTo && new Date(guest.last_stay) > new Date(lastStayTo)) {
      return false;
    }
    if (hasAllergies !== null && (guest.allergies.length > 0) !== hasAllergies) {
      return false;
    }
    return true;
  });

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

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guest Database</h1>
          <p className="text-gray-600 mt-2">Manage guest profiles, loyalty rewards, and stay history</p>
        </div>

        {/* Filter Button & View Switcher */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowAdvancedFilter(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#005357] text-white text-sm font-medium hover:bg-[#004147] transition-colors"
            >
              <Settings02Icon className="h-4 w-4" />
              <span>Advanced Filter</span>
            </button>
            
            <button 
              onClick={() => {
                resetNewGuestForm();
                setShowNewGuestModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Add01Icon className="h-4 w-4" />
              <span>New Guest</span>
            </button>
          </div>
          
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
                    <p className="text-sm text-gray-600 mt-1">Find guests with specific criteria</p>
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
                  <div className="bg-white p-4 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Search */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Guests</label>
                        <div className="relative">
                          <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Name, email, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                        </div>
                      </div>

                      {/* Country Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Country/Nationality</label>
                        <input
                          type="text"
                          placeholder="Filter by country..."
                          value={filterCountry}
                          onChange={(e) => setFilterCountry(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                        />
                      </div>

                      {/* VIP Status */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">VIP Status</label>
                        <select
                          value={filterVIP === null ? 'all' : filterVIP.toString()}
                          onChange={(e) => setFilterVIP(e.target.value === 'all' ? null : e.target.value === 'true')}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm appearance-none"
                        >
                          <option value="all">All Guests</option>
                          <option value="true">VIP Only</option>
                          <option value="false">Regular Only</option>
                        </select>
                      </div>

                      {/* Tier Filter */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Loyalty Tier</label>
                        <select
                          value={filterTier}
                          onChange={(e) => setFilterTier(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm appearance-none"
                        >
                          <option value="all">All Tiers</option>
                          <option value="Bronze">Bronze</option>
                          <option value="Silver">Silver</option>
                          <option value="Gold">Gold</option>
                          <option value="Platinum">Platinum</option>
                          <option value="Diamond">Diamond</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  <div className="bg-white p-4 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Advanced Criteria</h3>
                    <div className="grid grid-cols-1 gap-4">
                      {/* Spending Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Total Spending Range (IDR)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="number"
                            placeholder="Min spending"
                            value={minSpent}
                            onChange={(e) => setMinSpent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                          <input
                            type="number"
                            placeholder="Max spending"
                            value={maxSpent}
                            onChange={(e) => setMaxSpent(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                        </div>
                      </div>

                      {/* Minimum Stays */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Number of Stays</label>
                        <input
                          type="number"
                          placeholder="Min stays"
                          value={minStays}
                          onChange={(e) => setMinStays(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                        />
                      </div>

                      {/* Last Stay Range */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Stay Date Range</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={lastStayFrom}
                            onChange={(e) => setLastStayFrom(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                          <input
                            type="date"
                            value={lastStayTo}
                            onChange={(e) => setLastStayTo(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                          />
                        </div>
                      </div>

                      {/* Has Allergies */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Allergy Information</label>
                        <select
                          value={hasAllergies === null ? 'all' : hasAllergies.toString()}
                          onChange={(e) => setHasAllergies(e.target.value === 'all' ? null : e.target.value === 'true')}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm appearance-none"
                        >
                          <option value="all">All Guests</option>
                          <option value="true">Has Allergies</option>
                          <option value="false">No Allergies</option>
                        </select>
                      </div>
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
                      Apply Filters ({filteredGuests.length} guests)
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
            <p className="text-gray-600">Loading guests...</p>
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

        {/* Guests Display */}
        {!loading && !error && viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGuests.map((guest) => (
              <div key={guest.id} className="bg-white border border-gray-200">
                {/* Guest Card Header */}
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <button 
                          onClick={() => router.push(`/guests/${guest.id}`)}
                          className="text-xl font-bold text-gray-900 hover:text-[#005357] transition-colors text-left"
                        >
                          {guest.full_name}
                        </button>
                        {guest.vip_status && (
                          <span className="inline-flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-2 py-1 text-xs font-medium rounded">
                            <SparklesIcon className="h-3 w-3 fill-current" />
                            <span>VIP</span>
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Mail01Icon className="h-3 w-3" />
                          <span className="truncate">{guest.email}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Call02Icon className="h-3 w-3" />
                          <span>{guest.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Location01Icon className="h-3 w-3" />
                          <span>{guest.nationality}</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gray-50">
                  {/* Rewards Info */}
                  {guest.rewards && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-bold rounded ${getTierColor(guest.rewards.tier_level)}`}>
                            {getTierIcon(guest.rewards.tier_level)}
                            <span>{guest.rewards.tier_level}</span>
                          </span>
                          <span className="text-xs text-gray-600">{guest.rewards.program_name}</span>
                        </div>
                        <button 
                          onClick={() => router.push(`/guests/${guest.id}`)}
                          className="text-xs bg-[#005357] text-white px-2 py-1 rounded hover:bg-[#004147]"
                        >
                          View Points
                        </button>
                      </div>
                      <div className="text-xs text-gray-600">
                        <p>{guest.rewards.points_balance.toLocaleString()} points available</p>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#005357]">{guest.total_stays || 0}</div>
                      <div className="text-xs text-gray-600">Stays</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-[#005357]">{guest.total_nights || 0}</div>
                      <div className="text-xs text-gray-600">Nights</div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Total Spent</span>
                      <span className="font-medium text-gray-900">{formatCurrency(guest.total_spent || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Last Stay</span>
                      <span className="font-medium text-gray-900">{formatDate(guest.last_stay)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600">Avg Rating</span>
                      <div className="flex items-center space-x-1">
                        <SparklesIcon className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="font-medium text-gray-900">{guest.avg_rating || 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => router.push(`/guests/${guest.id}`)}
                      className="text-xs bg-gray-100 text-gray-700 px-3 py-2 hover:bg-gray-200 transition-colors"
                    >
                      <EyeIcon className="h-3 w-3 inline mr-1" />
                      View Profile
                    </button>
                    <button className="text-xs bg-[#005357] text-white px-3 py-2 hover:bg-[#004147] transition-colors">
                      <PencilEdit02Icon className="h-3 w-3 inline mr-1" />
                      PencilEdit02Icon
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !loading && !error ? (
          /* Table View */
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Guest Database</h3>
                  <p className="text-sm text-gray-600 mt-1">Complete guest profiles and loyalty information</p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Search Form */}
                  <div className="relative">
                    <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search guests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64 pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    />
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <UserMultipleIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-[#005357]">
                  <tr>
                    <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                      Guest
                    </th>
                    <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                      Contact
                    </th>
                    <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                      Rewards
                    </th>
                    <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                      Stay Clock01Icon
                    </th>
                    <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                      Spending
                    </th>
                    <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                      Last Stay
                    </th>
                    <th className="border border-gray-300 px-6 py-4 text-left text-sm font-bold text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest) => (
                    <tr key={guest.id} className="hover:bg-gray-50">
                      {/* Guest Info */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                            <UserIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => router.push(`/guests/${guest.id}`)}
                                className="font-bold text-gray-900 hover:text-[#005357] transition-colors text-left"
                              >
                                {guest.full_name}
                              </button>
                              {guest.vip_status && (
                                <SparklesIcon className="h-3 w-3 text-yellow-400 fill-current" />
                              )}
                            </div>
                            <p className="text-xs text-gray-600">{guest.nationality}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="text-gray-900">{guest.email}</div>
                          <div className="text-gray-600 text-xs">{guest.phone}</div>
                        </div>
                      </td>

                      {/* Rewards */}
                      <td className="border border-gray-200 px-6 py-4">
                        {guest.rewards ? (
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-bold rounded ${getTierColor(guest.rewards.tier_level)}`}>
                                {getTierIcon(guest.rewards.tier_level)}
                                <span>{guest.rewards.tier_level}</span>
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">
                              {(guest.rewards.points_balance || 0).toLocaleString()} pts
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-500">No rewards</span>
                        )}
                      </td>

                      {/* Stay History */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="text-sm space-y-1">
                          <div className="flex items-center space-x-4">
                            <div className="text-center">
                              <div className="font-bold text-[#005357]">{guest.total_stays || 0}</div>
                              <div className="text-xs text-gray-600">stays</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-[#005357]">{guest.total_nights || 0}</div>
                              <div className="text-xs text-gray-600">nights</div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <SparklesIcon className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600">{guest.avg_rating || 0} avg rating</span>
                          </div>
                        </div>
                      </td>

                      {/* Spending */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="text-right">
                          <div className="text-sm font-bold text-[#005357]">
                            {formatCurrency(guest.total_spent || 0)}
                          </div>
                          <div className="text-xs text-gray-600">total spent</div>
                        </div>
                      </td>

                      {/* Last Stay */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDate(guest.last_stay)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="relative">
                          <button 
                            onClick={() => setActiveDropdown(activeDropdown === guest.id ? null : guest.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </button>
                          
                          {/* Dropdown Menu */}
                          {activeDropdown === guest.id && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 border border-gray-300 z-50">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    router.push(`/guests/${guest.id}`);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <EyeIcon className="h-4 w-4" />
                                  <span>View Profile</span>
                                </button>
                                <button
                                  onClick={() => setActiveDropdown(null)}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <PencilEdit02Icon className="h-4 w-4" />
                                  <span>Edit Guest</span>
                                </button>
                                <div className="border-t border-gray-100 my-1"></div>
                                <button
                                  onClick={() => {
                                    router.push(`/guests/${guest.id}`);
                                    setActiveDropdown(null);
                                  }}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <SparklesIcon className="h-4 w-4" />
                                  <span>View Rewards</span>
                                </button>
                                <button
                                  onClick={() => setActiveDropdown(null)}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <Calendar01Icon className="h-4 w-4" />
                                  <span>Booking History</span>
                                </button>
                                <button
                                  onClick={() => setActiveDropdown(null)}
                                  className="flex items-center space-x-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                >
                                  <Add01Icon className="h-4 w-4" />
                                  <span>New Reservation</span>
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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white border-t border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(currentPage * pageSize, totalCount)}</span> of{' '}
                    <span className="font-medium">{totalCount}</span> guests
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-2 border border-gray-300 text-sm font-medium ${
                        currentPage === 1
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 border text-sm font-medium ${
                              currentPage === pageNum
                                ? 'bg-[#005357] text-white border-[#005357]'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-2 border border-gray-300 text-sm font-medium ${
                        currentPage === totalPages
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* No Results */}
        {!loading && !error && filteredGuests.length === 0 && (
          <div className="text-center py-12">
            <UserMultipleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No guests found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}

        {/* New Guest Modal */}
        {showNewGuestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Add New Guest</h2>
                    <p className="text-sm text-gray-600 mt-1">Create a new guest profile</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <form onSubmit={handleCreateGuest} className="p-6 bg-gray-50">
                {/* Error Message */}
                {createError && (
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
                    <div className="flex items-center">
                      <Cancel01Icon className="h-5 w-5 text-red-400 mr-3" />
                      <p className="text-sm text-red-800">{createError}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                      <input
                        type="text"
                        required
                        value={newGuest.first_name}
                        onChange={(e) => handleFormChange('first_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm"
                        placeholder="Enter first name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={newGuest.last_name}
                        onChange={(e) => handleFormChange('last_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm"
                        placeholder="Enter last name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                      <input
                        type="email"
                        required
                        value={newGuest.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm"
                        placeholder="Enter email address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={newGuest.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm"
                        placeholder="+62-xxx-xxx-xxxx"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
                      <input
                        type="date"
                        value={newGuest.date_of_birth}
                        onChange={(e) => handleFormChange('date_of_birth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                      <select
                        value={newGuest.gender}
                        onChange={(e) => handleFormChange('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm"
                      >
                        <option value="">Select gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Nationality</label>
                      <input
                        type="text"
                        value={newGuest.nationality}
                        onChange={(e) => handleFormChange('nationality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm"
                        placeholder="e.g., Indonesia"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                      <textarea
                        value={newGuest.address}
                        onChange={(e) => handleFormChange('address', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm resize-none"
                        placeholder="Enter full address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Postal Code</label>
                        <input
                          type="text"
                          value={newGuest.postal_code}
                          onChange={(e) => handleFormChange('postal_code', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm"
                          placeholder="12345"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                        <input
                          type="text"
                          value={newGuest.city}
                          onChange={(e) => handleFormChange('city', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm"
                          placeholder="City name"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        value={newGuest.country}
                        onChange={(e) => handleFormChange('country', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm"
                        placeholder="Country name"
                      />
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newGuest.is_vip}
                          onChange={(e) => handleFormChange('is_vip', e.target.checked)}
                          className="w-4 h-4 text-[#005357] border-gray-300 rounded focus:ring-[#005357]"
                        />
                        <span className="text-sm font-medium text-gray-700">VIP Guest</span>
                        <SparklesIcon className="h-4 w-4 text-yellow-400" />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                  <textarea
                    value={newGuest.notes}
                    onChange={(e) => handleFormChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#005357] focus:border-[#005357] text-sm resize-none"
                    placeholder="Add any additional notes about the guest..."
                  />
                </div>

                {/* Form Actions */}
                <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">* Required fields</p>
                  <div className="flex space-x-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowNewGuestModal(false);
                        resetNewGuestForm();
                      }}
                      className="px-6 py-2 bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                      disabled={isCreatingGuest}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-6 py-2 bg-[#005357] text-white text-sm font-medium hover:bg-[#004147] transition-colors flex items-center space-x-2"
                      disabled={isCreatingGuest}
                    >
                      {isCreatingGuest ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Add01Icon className="h-4 w-4" />
                          <span>Create Guest</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  );
};

export default GuestsPage;