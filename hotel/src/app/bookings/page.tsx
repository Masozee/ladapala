'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { buildApiUrl } from '@/lib/config';
import * as Dialog from '@radix-ui/react-dialog';
import {
  Calendar01Icon,
  UserMultipleIcon,
  Clock01Icon,
  Search02Icon,
  FilterIcon,
  EyeIcon,
  PencilEdit02Icon,
  Cancel01Icon,
  Call02Icon,
  Mail01Icon,
  Location01Icon,
  BedIcon,
  CreditCardIcon,
  Add01Icon,
  UserCheckIcon,
  UserIcon,
  SparklesIcon,
  Wrench01Icon,
  CancelCircleIcon,
  AlertCircleIcon,
  ListViewIcon,
  Calendar01Icon as CalendarDaysIcon,
  MoreHorizontalIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Logout01Icon
} from '@/lib/icons';

interface Guest {
  id: number;
  first_name?: string;
  last_name?: string;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  is_vip?: boolean;
  loyalty_points?: number;
  loyalty_level?: {
    level: string;
    color: string;
  };
}

interface ReservationRoom {
  id: number;
  room?: number;
  room_details?: {
    id: number;
    number: string;
    room_type_name: string;
    floor: number;
    status: string;
    current_price: number;
  };
  room_number: string;
  room_type_name: string;
  rate: string | number;
  total_amount: number;
  nights?: number;
}

interface Reservation {
  id: number;
  reservation_number: string;
  guest?: number;
  guest_details?: Guest;
  guest_name: string;
  check_in_date: string;
  check_out_date: string;
  nights: number;
  adults: number;
  children: number;
  status: string;
  status_display: string;
  booking_source: string;
  booking_source_display?: string;
  total_rooms: number;
  total_amount: number;
  deposit_amount?: string;
  created_at: string;
  rooms?: ReservationRoom[];
  special_requests?: string;
  notes?: string;
  can_cancel: boolean;
}

interface ReservationFilters {
  status?: string;
  booking_source?: string;
  search?: string;
  check_in_date?: string;
  check_out_date?: string;
}

interface RoomFilters {
  room_type?: string;
  floor?: string;
  status?: string;
  search?: string;
}

const MOCK_RESERVATIONS: Reservation[] = [
  // Current/Recent bookings for calendar demonstration
  {
    id: 1,
    reservation_number: 'RSV001',
    guest_name: 'John Smith',
    guest_details: {
      id: 1,
      full_name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+62-812-1111-0001',
      nationality: 'United States'
    },
    check_in_date: '2025-08-26',
    check_out_date: '2025-08-29',
    nights: 3,
    adults: 2,
    children: 0,
    status: 'CONFIRMED',
    status_display: 'Confirmed',
    booking_source: 'DIRECT',
    total_rooms: 1,
    total_amount: 6750000,
    created_at: '2024-08-23T10:30:00Z',
    rooms: [
      {
        id: 1,
        room_number: '101',
        room_type_name: 'Standard Room',
        rate: 2250000,
        total_amount: 6750000
      }
    ],
    special_requests: 'Late check-in requested',
    can_cancel: true
  },
  {
    id: 2,
    reservation_number: 'RSV002',
    guest_name: 'Maria Rodriguez',
    guest_details: {
      id: 2,
      full_name: 'Maria Rodriguez',
      email: 'maria.rodriguez@email.com',
      phone: '+62-812-1111-0002',
      nationality: 'Spain'
    },
    check_in_date: '2025-08-26',
    check_out_date: '2025-08-30',
    nights: 4,
    adults: 2,
    children: 1,
    status: 'CHECKED_IN',
    status_display: 'Checked In',
    booking_source: 'OTA',
    total_rooms: 1,
    total_amount: 9600000,
    created_at: '2024-08-20T14:15:00Z',
    rooms: [
      {
        id: 2,
        room_number: '201',
        room_type_name: 'Deluxe Room',
        rate: 2400000,
        total_amount: 9600000
      }
    ],
    special_requests: 'Extra towels requested',
    can_cancel: false
  },
  {
    id: 3,
    reservation_number: 'RSV003',
    guest_name: 'Ahmed Hassan',
    guest_details: {
      id: 3,
      full_name: 'Ahmed Hassan',
      email: 'ahmed.hassan@email.com',
      phone: '+62-812-1111-0003',
      nationality: 'Egypt'
    },
    check_in_date: '2025-08-27',
    check_out_date: '2025-08-31',
    nights: 4,
    adults: 1,
    children: 0,
    status: 'CONFIRMED',
    status_display: 'Confirmed',
    booking_source: 'WEBSITE',
    total_rooms: 1,
    total_amount: 12000000,
    created_at: '2024-08-22T09:15:00Z',
    rooms: [
      {
        id: 3,
        room_number: '301',
        room_type_name: 'Junior Suite',
        rate: 3000000,
        total_amount: 12000000
      }
    ],
    special_requests: 'Business center access',
    can_cancel: true
  },
  {
    id: 4,
    reservation_number: 'RSV004',
    guest_name: 'Sarah Johnson',
    guest_details: {
      id: 4,
      full_name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+62-812-1111-0004',
      nationality: 'Australia'
    },
    check_in_date: '2025-08-28',
    check_out_date: '2025-09-02',
    nights: 5,
    adults: 2,
    children: 2,
    status: 'PENDING',
    status_display: 'Pending',
    booking_source: 'OTA',
    total_rooms: 1,
    total_amount: 18000000,
    created_at: '2024-08-24T16:20:00Z',
    rooms: [
      {
        id: 4,
        room_number: '401',
        room_type_name: 'Family Suite',
        rate: 3600000,
        total_amount: 18000000
      }
    ],
    special_requests: 'Connecting rooms if available',
    can_cancel: true
  },
  {
    id: 5,
    reservation_number: 'RSV005',
    guest_name: 'Liu Wei',
    guest_details: {
      id: 5,
      full_name: 'Liu Wei',
      email: 'liu.wei@email.com',
      phone: '+62-812-1111-0005',
      nationality: 'China'
    },
    check_in_date: '2025-08-29',
    check_out_date: '2025-09-01',
    nights: 3,
    adults: 1,
    children: 0,
    status: 'CONFIRMED',
    status_display: 'Confirmed',
    booking_source: 'DIRECT',
    total_rooms: 1,
    total_amount: 13500000,
    created_at: '2024-08-21T11:45:00Z',
    rooms: [
      {
        id: 5,
        room_number: '501',
        room_type_name: 'Presidential Suite',
        rate: 4500000,
        total_amount: 13500000
      }
    ],
    special_requests: 'VIP treatment, champagne welcome',
    can_cancel: true
  },
  {
    id: 6,
    reservation_number: 'RSV006',
    guest_name: 'Emma Wilson',
    guest_details: {
      id: 6,
      full_name: 'Emma Wilson',
      email: 'emma.wilson@email.com',
      phone: '+62-812-1111-0006',
      nationality: 'United Kingdom'
    },
    check_in_date: '2025-08-30',
    check_out_date: '2025-09-03',
    nights: 4,
    adults: 2,
    children: 0,
    status: 'CONFIRMED',
    status_display: 'Confirmed',
    booking_source: 'OTA',
    total_rooms: 1,
    total_amount: 9600000,
    created_at: '2024-08-19T13:30:00Z',
    rooms: [
      {
        id: 6,
        room_number: '102',
        room_type_name: 'Standard Room',
        rate: 2400000,
        total_amount: 9600000
      }
    ],
    special_requests: 'Honeymoon package',
    can_cancel: true
  },
  {
    id: 7,
    reservation_number: 'RSV007',
    guest_name: 'Pierre Dubois',
    guest_details: {
      id: 7,
      full_name: 'Pierre Dubois',
      email: 'pierre.dubois@email.com',
      phone: '+62-812-1111-0007',
      nationality: 'France'
    },
    check_in_date: '2025-08-31',
    check_out_date: '2025-09-04',
    nights: 4,
    adults: 3,
    children: 1,
    status: 'CONFIRMED',
    status_display: 'Confirmed',
    booking_source: 'DIRECT',
    total_rooms: 1,
    total_amount: 14400000,
    created_at: '2024-08-18T08:15:00Z',
    rooms: [
      {
        id: 7,
        room_number: '202',
        room_type_name: 'Deluxe Room',
        rate: 3600000,
        total_amount: 14400000
      }
    ],
    special_requests: 'Baby crib needed',
    can_cancel: true
  },
  {
    id: 8,
    reservation_number: 'RSV008',
    guest_name: 'Raj Patel',
    guest_details: {
      id: 8,
      full_name: 'Raj Patel',
      email: 'raj.patel@email.com',
      phone: '+62-812-1111-0008',
      nationality: 'India'
    },
    check_in_date: '2025-09-01',
    check_out_date: '2025-09-05',
    nights: 4,
    adults: 2,
    children: 0,
    status: 'CONFIRMED',
    status_display: 'Confirmed',
    booking_source: 'WEBSITE',
    total_rooms: 1,
    total_amount: 12000000,
    created_at: '2024-08-25T14:22:00Z',
    rooms: [
      {
        id: 8,
        room_number: '302',
        room_type_name: 'Executive Suite',
        rate: 3000000,
        total_amount: 12000000
      }
    ],
    special_requests: 'Vegetarian meals only',
    can_cancel: true
  },
  {
    id: 9,
    reservation_number: 'RSV009',
    guest_name: 'Anna Kowalski',
    guest_details: {
      id: 9,
      full_name: 'Anna Kowalski',
      email: 'anna.kowalski@email.com',
      phone: '+62-812-1111-0009',
      nationality: 'Poland'
    },
    check_in_date: '2025-09-02',
    check_out_date: '2025-09-06',
    nights: 4,
    adults: 1,
    children: 0,
    status: 'CHECKED_IN',
    status_display: 'Checked In',
    booking_source: 'OTA',
    total_rooms: 1,
    total_amount: 9000000,
    created_at: '2024-08-26T17:10:00Z',
    rooms: [
      {
        id: 9,
        room_number: '203',
        room_type_name: 'Deluxe Room',
        rate: 2250000,
        total_amount: 9000000
      }
    ],
    special_requests: 'Late checkout requested',
    can_cancel: false
  },
  {
    id: 10,
    reservation_number: 'RSV010',
    guest_name: 'Carlos Silva',
    guest_details: {
      id: 10,
      full_name: 'Carlos Silva',
      email: 'carlos.silva@email.com',
      phone: '+62-812-1111-0010',
      nationality: 'Brazil'
    },
    check_in_date: '2025-09-03',
    check_out_date: '2025-09-07',
    nights: 4,
    adults: 4,
    children: 2,
    status: 'PENDING',
    status_display: 'Pending',
    booking_source: 'DIRECT',
    total_rooms: 1,
    total_amount: 21600000,
    created_at: '2024-08-17T12:05:00Z',
    rooms: [
      {
        id: 10,
        room_number: '402',
        room_type_name: 'Family Suite',
        rate: 5400000,
        total_amount: 21600000
      }
    ],
    special_requests: 'Large family, need extra beds',
    can_cancel: true
  },
  // Additional bookings to show overlapping dates and different rooms
  {
    id: 11,
    reservation_number: 'RSV011',
    guest_name: 'Hans Mueller',
    guest_details: {
      id: 11,
      full_name: 'Hans Mueller',
      email: 'hans.mueller@email.com',
      phone: '+62-812-1111-0011',
      nationality: 'Germany'
    },
    check_in_date: '2025-08-27',
    check_out_date: '2025-08-30',
    nights: 3,
    adults: 2,
    children: 0,
    status: 'CONFIRMED',
    status_display: 'Confirmed',
    booking_source: 'DIRECT',
    total_rooms: 1,
    total_amount: 9000000,
    created_at: '2024-08-15T11:20:00Z',
    rooms: [
      {
        id: 11,
        room_number: '103',
        room_type_name: 'Standard Room',
        rate: 3000000,
        total_amount: 9000000
      }
    ],
    special_requests: 'Early breakfast preferred',
    can_cancel: true
  },
  {
    id: 12,
    reservation_number: 'RSV012',
    guest_name: 'Sofia Andersson',
    guest_details: {
      id: 12,
      full_name: 'Sofia Andersson',
      email: 'sofia.andersson@email.com',
      phone: '+62-812-1111-0012',
      nationality: 'Sweden'
    },
    check_in_date: '2025-08-29',
    check_out_date: '2025-09-02',
    nights: 4,
    adults: 2,
    children: 1,
    status: 'CONFIRMED',
    status_display: 'Confirmed',
    booking_source: 'WEBSITE',
    total_rooms: 1,
    total_amount: 16000000,
    created_at: '2024-08-29T13:40:00Z',
    rooms: [
      {
        id: 12,
        room_number: '204',
        room_type_name: 'Deluxe Room',
        rate: 4000000,
        total_amount: 16000000
      }
    ],
    special_requests: 'Baby crib needed',
    can_cancel: true
  },
  {
    id: 13,
    reservation_number: 'RSV013',
    guest_name: 'Yuki Tanaka',
    guest_details: {
      id: 13,
      full_name: 'Yuki Tanaka',
      email: 'yuki.tanaka@email.com',
      phone: '+62-812-1111-0013',
      nationality: 'Japan'
    },
    check_in_date: '2025-09-01',
    check_out_date: '2025-09-03',
    nights: 2,
    adults: 1,
    children: 0,
    status: 'PENDING',
    status_display: 'Pending',
    booking_source: 'OTA',
    total_rooms: 1,
    total_amount: 6000000,
    created_at: '2024-08-30T09:25:00Z',
    rooms: [
      {
        id: 13,
        room_number: '104',
        room_type_name: 'Standard Room',
        rate: 3000000,
        total_amount: 6000000
      }
    ],
    special_requests: 'Quiet room please',
    can_cancel: true
  },
];

interface Room {
  id: number;
  number: string;
  room_type_name: string;
  floor: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'OUT_OF_ORDER' | 'CLEANING' | 'MAINTENANCE' | 'BLOCKED';
  status_display: string;
  is_active: boolean;
  current_guest?: string;
  checkout_time?: string;
  checkin_time?: string;
}

const MOCK_ROOMS: Room[] = [
  // Simplified mock rooms - will be replaced by API data
  { 
    id: 101, 
    number: '101', 
    room_type_name: 'Standard Room', 
    floor: 1, 
    status: 'AVAILABLE',
    status_display: 'Available',
    is_active: true
  },
  { 
    id: 102, 
    number: '102', 
    room_type_name: 'Standard Room', 
    floor: 1, 
    status: 'OCCUPIED',
    status_display: 'Occupied',
    is_active: true,
    current_guest: 'John Smith',
    checkout_time: '11:00 AM'
  },
];

const BookingsPage = () => {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('');
  const [bookingSourceFilter, setBookingSourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkInDateFilter, setCheckInDateFilter] = useState('');
  const [checkOutDateFilter, setCheckOutDateFilter] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAddReservation, setShowAddReservation] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [availableRooms, setAvailableRooms] = useState<any[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  
  // Calendar view pagination states
  const [roomsCurrentPage, setRoomsCurrentPage] = useState(1);
  const [roomsTotalPages, setRoomsTotalPages] = useState(1);
  const [roomsTotalCount, setRoomsTotalCount] = useState(0);
  const [roomsLoading, setRoomsLoading] = useState(false);
  
  // Calendar view filters
  const [roomTypeFilter, setRoomTypeFilter] = useState('');
  const [roomFloorFilter, setRoomFloorFilter] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('');
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
      loyalty_number: ''
    },
    check_in_date: '',
    check_out_date: '',
    adults: 1,
    children: 0,
    booking_source: 'DIRECT',
    special_requests: '',
    notes: ''
  });
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date; end: Date }>(() => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 11); // 12 days to show more booking data
    return {
      start: today,
      end: endDate
    };
  });
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const itemsPerPage = 10;

  const wizardSteps = [
    { id: 1, number: 1, title: 'Guest Information', description: 'Personal details and contact info' },
    { id: 2, number: 2, title: 'Booking Details', description: 'Dates, rooms, and preferences' },
    { id: 3, number: 3, title: 'Payment Information', description: 'Billing and payment details' },
    { id: 4, number: 4, title: 'Review & Confirm', description: 'Final review and confirmation' }
  ];

  const resetWizard = () => {
    setWizardStep(1);
    setShowAddReservation(false);
    setAvailableRooms([]);
    setSelectedRoom(null);
    setFormData({
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
        loyalty_number: ''
      },
      check_in_date: '',
      check_out_date: '',
      adults: 1,
      children: 0,
      booking_source: 'DIRECT',
      special_requests: '',
      notes: ''
    });
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation
    if (!selectedRoom) {
      alert('Please select a room before submitting');
      return;
    }
    
    if (!formData.guest.first_name || !formData.guest.last_name || !formData.guest.email || !formData.guest.phone || !formData.guest.date_of_birth || !formData.guest.id_number) {
      alert('Please fill in all required guest information (Name, Email, Call02Icon, Date of Birth, and ID Number)');
      return;
    }
    
    if (!formData.check_in_date || !formData.check_out_date) {
      alert('Please select check-in and check-out dates');
      return;
    }
    
    try {
      setLoading(true);
      
      // Prepare room assignments with the selected room
      const roomAssignments = [{
        room_id: selectedRoom.id,
        rate: selectedRoom.room_type?.base_price || selectedRoom.current_price || 0,
        discount_amount: 0,
        extra_charges: 0
      }];

      const reservationData = {
        ...formData,
        room_assignments: roomAssignments,
      };

      console.log('Creating reservation with data:', reservationData);
      const newReservation = await createReservation(reservationData);
      
      // Refresh reservations list
      await loadReservations(currentPage);
      
      // Reset form and close modal
      resetWizard();
      
      alert('Reservation created successfully!');
      
    } catch (error) {
      alert('Failed to create reservation. Please try again.');
      console.error('Reservation creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAvailabilityAndProceed = async () => {
    if (!formData.check_in_date || !formData.check_out_date) {
      alert('Please select check-in and check-out dates');
      return;
    }

    console.log('Starting availability check...', {
      check_in_date: formData.check_in_date,
      check_out_date: formData.check_out_date,
      adults: formData.adults,
      children: formData.children
    });

    try {
      setLoading(true);
      const available = await fetchAvailableRooms(
        formData.check_in_date,
        formData.check_out_date,
        formData.adults,
        formData.children
      );
      
      console.log('Available rooms found:', available.length, available);
      setAvailableRooms(available);
      setWizardStep(3); // Move to room selection step
    } catch (error) {
      console.error('Availability check error:', error);
      alert('Failed to check availability. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleNavigateToPayment = (reservation: Reservation) => {
    const params = new URLSearchParams({
      reservationId: reservation.id.toString(),
      guest: reservation.guest_name,
      room: reservation.rooms?.[0]?.room_number || '',
      checkIn: reservation.check_in_date,
      checkOut: reservation.check_out_date,
      amount: reservation.total_amount.toString()
    });
    
    router.push(`/payments?${params.toString()}`);
  };

  // API service functions
  const fetchReservations = async (page = 1, filters: ReservationFilters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(filters.status && { status: filters.status }),
        ...(filters.booking_source && { booking_source: filters.booking_source }),
        ...(filters.search && { search: filters.search }),
        ...(filters.check_in_date && { check_in_date: filters.check_in_date }),
        ...(filters.check_out_date && { check_out_date: filters.check_out_date }),
        ordering: sortOrder === 'asc' ? sortField : `-${sortField}`
      });
      
      const response = await fetch(buildApiUrl(`reservations/?${params}`));
      if (!response.ok) {
        throw new Error('Failed to fetch reservations');
      }
      const data = await response.json();
      
      // Handle paginated response
      if (data.results) {
        setTotalPages(data.total_pages || Math.ceil(data.count / 20)); // Use API total_pages or fallback
        setTotalCount(data.count);
        return data.results;
      }
      
      return data.results || data; // Handle both paginated and direct array responses
    } catch (error) {
      console.error('Error fetching reservations:', error);
      // Fallback to mock data if API fails
      return MOCK_RESERVATIONS;
    }
  };

  // Function to load reservations with current filters
  const loadReservations = async (page = currentPage) => {
    setLoading(true);
    try {
      const filters: ReservationFilters = {
        ...(statusFilter && { status: statusFilter }),
        ...(bookingSourceFilter && { booking_source: bookingSourceFilter }),
        ...(searchQuery && { search: searchQuery }),
        ...(checkInDateFilter && { check_in_date: checkInDateFilter }),
        ...(checkOutDateFilter && { check_out_date: checkOutDateFilter }),
      };
      
      const reservationsData = await fetchReservations(page, filters);
      setReservations(reservationsData);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async (page = 1, filters: RoomFilters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(filters.room_type && { room_type: filters.room_type }),
        ...(filters.floor && { floor: filters.floor }),
        ...(filters.status && { status: filters.status }),
        ...(filters.search && { search: filters.search }),
        ordering: 'number' // Order rooms by room number
      });
      
      const response = await fetch(buildApiUrl(`rooms/?${params}`));
      if (!response.ok) {
        throw new Error('Failed to fetch rooms');
      }
      const data = await response.json();
      
      // Handle paginated response
      if (data.results) {
        setRoomsTotalPages(data.total_pages || Math.ceil(data.count / 50)); // Use API total_pages or fallback (rooms use 50 per page)
        setRoomsTotalCount(data.count);
        return data.results;
      }
      
      return data.results || data; // Handle both paginated and direct array responses
    } catch (error) {
      console.error('Error fetching rooms:', error);
      // Fallback to mock data if API fails
      return MOCK_ROOMS;
    }
  };

  // Function to load rooms with current filters for calendar view
  const loadRooms = async (page = roomsCurrentPage) => {
    setRoomsLoading(true);
    try {
      const filters: RoomFilters = {
        ...(roomTypeFilter && { room_type: roomTypeFilter }),
        ...(roomFloorFilter && { floor: roomFloorFilter }),
        ...(roomStatusFilter && { status: roomStatusFilter }),
      };
      
      const roomsData = await fetchRooms(page, filters);
      setRooms(roomsData);
      setRoomsCurrentPage(page);
    } catch (error) {
      console.error('Error loading rooms:', error);
    } finally {
      setRoomsLoading(false);
    }
  };

  // Room assignment and reservation actions
  const confirmReservation = async (reservationId: number) => {
    try {
      const response = await fetch(buildApiUrl(`reservations/${reservationId}/confirm/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to confirm reservation');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error confirming reservation:', error);
      throw error;
    }
  };

  const cancelReservation = async (reservationId: number, reason: string) => {
    try {
      const response = await fetch(buildApiUrl(`reservations/${reservationId}/cancel/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to cancel reservation');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  };

  const checkInGuest = async (reservationId: number) => {
    try {
      const response = await fetch(buildApiUrl(`reservations/${reservationId}/check_in/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to check in guest');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking in guest:', error);
      throw error;
    }
  };

  const checkOutGuest = async (reservationId: number) => {
    try {
      const response = await fetch(buildApiUrl(`reservations/${reservationId}/check_out/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to check out guest');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error checking out guest:', error);
      throw error;
    }
  };

  const createReservation = async (reservationData: {
    guest: {
      first_name: string;
      last_name: string;
      email: string;
      phone: string;
      nationality?: string;
      date_of_birth?: string;
      gender?: string;
      id_type?: string;
      id_number?: string;
      address?: string;
      is_return_customer?: boolean;
      previous_stay_date?: string;
      loyalty_number?: string;
    };
    check_in_date: string;
    check_out_date: string;
    adults: number;
    children: number;
    booking_source?: string;
    special_requests?: string;
    notes?: string;
    room_assignments?: Array<{
      room_id: number;
      rate?: number;
      discount_amount?: number;
      extra_charges?: number;
      notes?: string;
    }>;
  }) => {
    try {
      // First create or get the guest
      const guestResponse = await fetch(buildApiUrl('guests/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData.guest),
      });
      
      let guest;
      if (guestResponse.ok) {
        guest = await guestResponse.json();
      } else {
        // Guest might already exist, try to find by email
        const existingGuestResponse = await fetch(buildApiUrl(`guests/?email=${reservationData.guest.email}`));
        if (existingGuestResponse.ok) {
          const guestData = await existingGuestResponse.json();
          guest = guestData.results?.[0] || guestData[0];
        }
        if (!guest) {
          throw new Error('Failed to create or find guest');
        }
      }

      // Create the reservation
      const reservationPayload = {
        guest: guest.id,
        check_in_date: reservationData.check_in_date,
        check_out_date: reservationData.check_out_date,
        adults: reservationData.adults,
        children: reservationData.children,
        booking_source: reservationData.booking_source || 'DIRECT',
        special_requests: reservationData.special_requests,
        room_assignments: reservationData.room_assignments || [],
      };

      const response = await fetch(buildApiUrl('reservations/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationPayload),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create reservation');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  };

  const fetchAvailableRooms = async (checkInDate: string, checkOutDate: string, adults: number, children: number) => {
    console.log('fetchAvailableRooms called with:', { checkInDate, checkOutDate, adults, children });
    
    try {
      // Calculate number of nights and check if dates are valid
      const checkIn = new Date(checkInDate);
      const checkOut = new Date(checkOutDate);
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 3600 * 24));
      
      console.log('Date calculation:', { checkIn, checkOut, nights });
      
      if (nights <= 0) {
        throw new Error('Invalid date range');
      }

      // Fetch all rooms with enhanced data (availability + pricing)
      console.log('Fetching rooms from API...');
      const response = await fetch(buildApiUrl('rooms/'));
      if (!response.ok) {
        console.error('Failed to fetch rooms:', response.status, response.statusText);
        throw new Error('Failed to fetch rooms');
      }
      
      const data = await response.json();
      const rooms = data.results || data;
      console.log(`Fetched ${rooms.length} total rooms`);
      
      // Filter rooms based on guest capacity first
      const eligibleRooms = rooms.filter((room: any) => {
        if (!room.is_active || room.status !== 'AVAILABLE') return false;
        if (room.room_type?.max_occupancy && (adults + children) > room.room_type.max_occupancy) {
          return false;
        }
        return true;
      });
      
      console.log(`Found ${eligibleRooms.length} eligible rooms out of ${rooms.length} total rooms`);
      
      // For now, let's use a simpler approach - check if stay is within 7 days from today
      const today = new Date();
      const maxDate = new Date(today);
      maxDate.setDate(today.getDate() + 7);
      
      if (checkIn > maxDate) {
        console.warn('Check-in date is more than 7 days ahead - using simplified availability check');
        // Return eligible rooms with basic info for dates beyond 7-day window
        const basicAvailableRooms = eligibleRooms.slice(0, 10).map((room: any) => ({
          ...room,
          room_type_name: room.room_type_name || 'Standard Room',
          current_price: room.room_type?.base_price || 350000,
          base_price: room.room_type?.base_price || 350000,
          total_cost: (room.room_type?.base_price || 350000) * nights,
          nights: nights,
          availability_status: 'available',
          pricing_info: {
            base_price: room.room_type?.base_price || 350000,
            current_price: room.room_type?.base_price || 350000,
            currency: 'IDR',
            price_includes: ['Room accommodation', 'Basic amenities'],
            price_excludes: ['PPN/VAT (11%)', 'Service charge', 'Extra services']
          }
        }));
        
        console.log(`Returning ${basicAvailableRooms.length} rooms with basic availability check`);
        return basicAvailableRooms;
      }
      
      // Fetch detailed availability for rooms (limit to first 20 for performance)
      const roomsToCheck = eligibleRooms.slice(0, 20);
      console.log(`Checking detailed availability for ${roomsToCheck.length} rooms`);
      
      const roomPromises = roomsToCheck.map(async (room: any) => {
        try {
          const roomDetailResponse = await fetch(buildApiUrl(`rooms/${room.id}/`));
          if (!roomDetailResponse.ok) {
            console.warn(`Failed to fetch details for room ${room.id}: ${roomDetailResponse.status}`);
            return null;
          }
          
          const roomDetail = await roomDetailResponse.json();
          
          // Check availability for each night of the stay using the 7-day calendar
          let isAvailableForStay = true;
          const availabilityCalendar = roomDetail.availability_7_days || [];
          
          // Only check dates within the 7-day calendar range
          for (let i = 0; i < nights; i++) {
            const stayDate = new Date(checkIn);
            stayDate.setDate(stayDate.getDate() + i);
            const stayDateStr = stayDate.toISOString().split('T')[0];
            
            // Find this date in the availability calendar
            const dayAvailability = availabilityCalendar.find((day: any) => day.date === stayDateStr);
            
            // If date is outside 7-day window, assume available (fallback)
            if (!dayAvailability) {
              console.warn(`Date ${stayDateStr} is outside the 7-day availability window for room ${room.number} - assuming available`);
              continue;
            }
            
            if (!dayAvailability.available) {
              isAvailableForStay = false;
              break;
            }
          }
          
          if (isAvailableForStay) {
            return {
              ...roomDetail,
              // Calculate total cost for the stay
              total_cost: (roomDetail.current_price || roomDetail.base_price || 0) * nights,
              nights: nights,
              // Add availability status from calendar
              availability_status: 'available',
              // Include pricing info
              pricing_info: roomDetail.pricing_info
            };
          }
          
          return null;
        } catch (roomError) {
          console.error(`Error fetching details for room ${room.id}:`, roomError);
          return null;
        }
      });
      
      // Wait for all room checks to complete with timeout
      const roomResults = await Promise.allSettled(roomPromises);
      const availableRooms = roomResults
        .filter(result => result.status === 'fulfilled' && result.value !== null)
        .map(result => (result as any).value);
      
      // Sort by price (ascending)
      availableRooms.sort((a, b) => (a.current_price || a.base_price || 0) - (b.current_price || b.base_price || 0));
      
      console.log(`Successfully found ${availableRooms.length} available rooms`);
      return availableRooms;
    } catch (error) {
      console.error('Error fetching available rooms:', error);
      return [];
    }
  };

  useEffect(() => {
    // Start with mock data, then load API data
    setReservations(MOCK_RESERVATIONS);
    setRooms(MOCK_ROOMS);
    setLoading(false);
    
    // Load API data in the background
    const loadApiData = async () => {
      if (typeof window === 'undefined') return;
      
      try {
        // Load rooms for calendar view
        await loadRooms(1);
        
        // Load reservations with current filters
        await loadReservations(1);
        
        console.log('API Data loaded');
        console.log('Calendar rooms data loaded for page 1');
      } catch (error) {
        console.error('Error loading API data:', error);
        // Keep mock data on error
      }
    };

    // Load API data after component mounts
    setTimeout(loadApiData, 100);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
      if (showDateRangePicker && !(event.target as Element).closest('.date-range-picker')) {
        setShowDateRangePicker(false);
      }
    };

    if (openMenuId !== null || showDateRangePicker) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId, showDateRangePicker]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        loadReservations(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Auto-load reservations when filters change
  useEffect(() => {
    loadReservations(1);
  }, [statusFilter, bookingSourceFilter, checkInDateFilter, checkOutDateFilter, sortField, sortOrder]);

  // Auto-load rooms when calendar filters change
  useEffect(() => {
    loadRooms(1);
  }, [roomTypeFilter, roomFloorFilter, roomStatusFilter]);

  // Generate week dates starting from today
  const getWeekDates = () => {
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();


  const getRoomStatusIcon = (status: string) => {
    const iconProps = { className: "h-4 w-4" };
    switch (status) {
      case 'AVAILABLE': return <UserCheckIcon {...iconProps} className="h-4 w-4 text-green-600" />;
      case 'OCCUPIED': return <UserIcon {...iconProps} className="h-4 w-4 text-red-600" />;
      case 'CLEANING': return <SparklesIcon {...iconProps} className="h-4 w-4 text-yellow-600" />;
      case 'MAINTENANCE': return <Wrench01Icon {...iconProps} className="h-4 w-4 text-orange-600" />;
      case 'BLOCKED': return <CancelCircleIcon {...iconProps} className="h-4 w-4 text-purple-600" />;
      case 'OUT_OF_ORDER': return <AlertCircleIcon {...iconProps} className="h-4 w-4 text-gray-600" />;
      default: return <UserCheckIcon {...iconProps} className="h-4 w-4 text-gray-400" />;
    }
  };

  const formatCalendarDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper functions for calendar view
  const getCalendarDates = () => {
    const dates = [];
    const current = new Date(selectedDateRange.start);
    
    while (current <= selectedDateRange.end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  };

  const getRoomsForCalendar = () => {
    // Convert API room data to calendar format
    const calendarRooms = rooms.slice(0, 20).map(room => ({
      number: room.number,
      type: room.room_type_name,
      status: room.status ? room.status.toLowerCase().replace('_', '-') : 'available',
      maintenance_note: room.status === 'MAINTENANCE' ? 'Under maintenance' : null
    }));
    
    if (rooms.length > 0 && calendarRooms.length === 0) {
      console.warn('Calendar rooms conversion issue:', { rooms: rooms.slice(0, 2), calendarRooms });
    }
    
    return calendarRooms;
  };

  const getReservationForRoomAndDate = (roomNumber: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    
    return reservations.find(reservation => {
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      const currentDate = new Date(dateStr);
      
      // Handle both API structure (rooms array with room_number) and mock structure
      const hasRoom = reservation.rooms?.some(room => 
        room.room_number === roomNumber || room.room_details?.number === roomNumber
      );
      
      return hasRoom && currentDate >= checkIn && currentDate < checkOut;
    });
  };

  const getFilteredRoomsAndReservations = () => {
    // For calendar view, just return rooms and reservations as-is
    // Filtering is now handled by server-side API calls
    const filteredRooms = getRoomsForCalendar();
    const filteredReservations = reservations;
    
    return { filteredRooms, filteredReservations };
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

  const getRoomStatusColor = (status: string) => {
    const normalizedStatus = status ? status.toLowerCase().replace('_', '-') : 'available';
    switch (normalizedStatus) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-blue-100 text-blue-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      case 'cleaning': return 'bg-purple-100 text-purple-800';
      case 'out-of-order': return 'bg-gray-100 text-gray-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  const getRoomStatusText = (status: string) => {
    const normalizedStatus = status ? status.toLowerCase().replace('_', '-') : 'available';
    switch (normalizedStatus) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'reserved': return 'Reserved';
      case 'maintenance': return 'Maintenance';
      case 'cleaning': return 'Cleaning';
      case 'out-of-order': return 'Out of Order';
      default: return 'Available';
    }
  };

  // Generate a consistent color for each reservation based on status
  const getReservationColor = (reservation: Reservation) => {
    switch (reservation.status) {
      case 'CONFIRMED': return 'bg-blue-500';
      case 'CHECKED_IN': return 'bg-green-500';
      case 'CHECKED_OUT': return 'bg-gray-500';
      case 'CANCELLED': return 'bg-red-500';
      case 'PENDING': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  // Get booking periods for a room
  const getBookingPeriods = (roomNumber: string, dates: Date[]) => {
    const periods: Array<{
      reservation: any;
      startIndex: number;
      endIndex: number;
      color: string;
    }> = [];

    const reservationsForRoom = reservations.filter(res => 
      res.rooms?.some(room => 
        room.room_number === roomNumber || room.room_details?.number === roomNumber
      )
    );

    reservationsForRoom.forEach(reservation => {
      const checkIn = new Date(reservation.check_in_date);
      const checkOut = new Date(reservation.check_out_date);
      
      let startIndex = -1;
      let endIndex = -1;
      
      dates.forEach((date, index) => {
        if (date >= checkIn && date < checkOut) {
          if (startIndex === -1) startIndex = index;
          endIndex = index;
        }
      });
      
      if (startIndex !== -1 && endIndex !== -1) {
        periods.push({
          reservation,
          startIndex,
          endIndex,
          color: getReservationColor(reservation)
        });
      }
    });

    return periods;
  };

  // Render a room row with booking periods
  const renderRoomRow = (room: any, dates: Date[]) => {
    const bookingPeriods = getBookingPeriods(room.number, dates);
    
    return dates.map((date, dateIndex) => {
      const isToday = date.toDateString() === new Date().toDateString();
      
      // Find if this date is part of any booking period
      const currentPeriod = bookingPeriods.find(period => 
        dateIndex >= period.startIndex && dateIndex <= period.endIndex
      );
      
      if (currentPeriod) {
        const { reservation, startIndex, endIndex, color } = currentPeriod;
        const isFirstDay = dateIndex === startIndex;
        const isLastDay = dateIndex === endIndex;
        const spanLength = endIndex - startIndex + 1;
        
        if (isFirstDay) {
          // First cell of the booking period - render the full booking bar
          return (
            <td 
              key={date.toISOString()} 
              colSpan={spanLength}
              className={`py-2 px-1 text-center text-xs border-l border-gray-100 relative ${isToday ? 'bg-blue-50' : ''}`}
            >
              <div 
                className={`${color} text-white px-2 py-3 text-xs font-medium shadow-sm cursor-pointer hover:opacity-90 transition-opacity relative`}
                title={`${reservation.guest_name} (${reservation.reservation_number})\n${reservation.adults} adults${reservation.children > 0 ? `, ${reservation.children} children` : ''}\n${formatDate(reservation.check_in_date)} - ${formatDate(reservation.check_out_date)}\n${formatCurrency(reservation.total_amount)}`}
              >
                <div className="font-semibold truncate">
                  {reservation.guest_name}
                </div>
                <div className="text-xs opacity-90 mt-1">
                  {reservation.nights}N • {reservation.adults}A{reservation.children > 0 ? `+${reservation.children}C` : ''}
                </div>
                <div className={`absolute top-1 right-1 px-1 py-0.5 text-xs ${getStatusColor(reservation.status)} bg-opacity-80`}>
                  {reservation.status_display}
                </div>
              </div>
            </td>
          );
        } else {
          // Subsequent cells are hidden due to colSpan
          return null;
        }
      } else {
        // Available cell
        return (
          <td key={date.toISOString()} className={`py-2 px-1 text-center text-xs border-l border-gray-100 ${isToday ? 'bg-blue-50' : ''}`}>
            <div className="text-gray-300 text-xs py-3">
              Available
            </div>
          </td>
        );
      }
    }).filter(Boolean); // Remove null values
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR'
    }).format(amount);
  };

  const handleSort = (field: string) => {
    let newSortOrder: 'asc' | 'desc' = 'asc';
    
    if (sortField === field) {
      newSortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      newSortOrder = 'asc';
    }
    
    setSortField(field);
    setSortOrder(newSortOrder);
    
    // Trigger new API call with updated sorting
    setTimeout(() => loadReservations(1), 100);
  };

  // Removed unused getSortedAndPaginatedReservations function - now using server-side pagination
    // First, sort the reservations
    const sorted = [...reservations].sort((a, b) => {
      let aValue: string | number | Date = a[sortField as keyof Reservation] as string | number | Date;
      let bValue: string | number | Date = b[sortField as keyof Reservation] as string | number | Date;
      
      // Handle nested properties
      if (sortField === 'guest_name') {
        aValue = a.guest_name;
        bValue = b.guest_name;
      } else if (sortField === 'check_in_date') {
        aValue = new Date(a.check_in_date);
        bValue = new Date(b.check_in_date);
      } else if (sortField === 'total_amount') {
        aValue = a.total_amount;
        bValue = b.total_amount;
      } else if (sortField === 'created_at') {
        aValue = new Date(a.created_at);
        bValue = new Date(b.created_at);
      } else if (sortField === 'adults') {
        aValue = a.adults;
        bValue = b.adults;
      } else if (sortField === 'room_number') {
        aValue = a.rooms?.[0]?.room_number || '';
        bValue = b.rooms?.[0]?.room_number || '';
      } else if (sortField === 'status') {
        aValue = a.status;
        bValue = b.status;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Then paginate
  const getTotalPages = () => totalPages; // Use API pagination

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? 
      <ChevronUpIcon className="h-3 w-3 inline ml-1 text-white" /> : 
      <ChevronDownIcon className="h-3 w-3 inline ml-1 text-white" />;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bookings & Reservations</h1>
            <p className="text-sm text-gray-600 mt-1">Manage all hotel reservations and bookings</p>
          </div>
        </div>
      </div>

      {/* View Mode Toggle and Add Reservation Button */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-[#005357] text-white'
                : 'bg-white text-gray-600 hover:text-[#005357] border border-gray-200'
            }`}
          >
            <ListViewIcon className="h-4 w-4" />
            <span>List View</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'calendar'
                ? 'bg-[#005357] text-white'
                : 'bg-white text-gray-600 hover:text-[#005357] border border-gray-200'
            }`}
          >
            <CalendarDaysIcon className="h-4 w-4" />
            <span>Calendar View</span>
          </button>
        </div>
        
        <button 
          onClick={() => router.push('/reservations/new')}
          className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-4 text-sm font-bold hover:bg-[#004147] transition-colors"
        >
          <Add01Icon className="h-4 w-4" />
          <span>New Reservation</span>
        </button>
      </div>


      {/* Calendar View */}
      {viewMode === 'calendar' ? (
        <div className="bg-white shadow">
          {/* Calendar Header with Compact Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-gray-900">Calendar View</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {roomsTotalCount} total rooms • Page {roomsCurrentPage} of {roomsTotalPages} • {formatCalendarDate(selectedDateRange.start)} - {formatCalendarDate(selectedDateRange.end)}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* Search Form */}
                <div className="relative">
                  <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search reservations..."
                    value=""
                    readOnly
                    className="w-64 pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm bg-gray-50"
                  />
                </div>
                
                {/* Date Range Picker */}
                <div className="relative">
                  <Calendar01Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                  <input 
                    type="text" 
                    value={`${selectedDateRange.start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${selectedDateRange.end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    readOnly
                    placeholder="Select date range"
                    className="w-48 pl-10 pr-3 py-2 bg-white border border-gray-300 text-sm focus:ring-[#005357] focus:outline-none cursor-pointer"
                    onClick={() => setShowDateRangePicker(!showDateRangePicker)}
                  />
                  
                  {/* Date Range Picker */}
                  {showDateRangePicker && (
                    <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 shadow-lg z-50 p-4 date-range-picker">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Start Date Calendar */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Start Date</h4>
                          <input 
                            type="date" 
                            value={selectedDateRange.start.toISOString().split('T')[0]}
                            onChange={(e) => setSelectedDateRange(prev => ({ ...prev, start: new Date(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-200 text-sm focus:ring-2 focus:ring-[#005357] focus:outline-none"
                          />
                        </div>
                        
                        {/* End Date Calendar */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">End Date</h4>
                          <input 
                            type="date" 
                            value={selectedDateRange.end.toISOString().split('T')[0]}
                            onChange={(e) => setSelectedDateRange(prev => ({ ...prev, end: new Date(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-200 text-sm focus:ring-2 focus:ring-[#005357] focus:outline-none"
                          />
                        </div>
                      </div>
                      
                      {/* Quick Select Options */}
                      <div className="mt-4 pt-3 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date();
                              const nextWeek = new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000);
                              setSelectedDateRange({ start: today, end: nextWeek });
                            }}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            Next 7 days
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date();
                              const nextTwoWeeks = new Date(today.getTime() + 13 * 24 * 60 * 60 * 1000);
                              setSelectedDateRange({ start: today, end: nextTwoWeeks });
                            }}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            Next 14 days
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const today = new Date();
                              const nextMonth = new Date(today.getTime() + 29 * 24 * 60 * 60 * 1000);
                              setSelectedDateRange({ start: today, end: nextMonth });
                            }}
                            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                          >
                            Next 30 days
                          </button>
                        </div>
                      </div>
                      
                      {/* Apply/Close buttons */}
                      <div className="mt-4 flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setShowDateRangePicker(false)}
                          className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          Close
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDateRangePicker(false)}
                          className="px-3 py-1 bg-[#005357] text-white text-sm hover:bg-[#004147] transition-colors"
                        >
                          Apply
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <CalendarDaysIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          </div>
          
          
          <div className="overflow-x-auto">
            <div style={{ minWidth: `${272 + (getCalendarDates().length * 100)}px` }}>
              <table className="w-full">
              <thead>
                <tr className="bg-[#005357]">
                  <th className="text-left py-3 px-4 text-sm font-bold text-white uppercase tracking-wider w-[152px] sticky left-0 bg-[#005357] z-20">
                    Room
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-bold text-white uppercase tracking-wider w-[120px] sticky left-[152px] bg-[#005357] z-20 shadow-lg" style={{boxShadow: '4px 0 6px -1px rgba(0, 0, 0, 0.1)'}}>
                    Status
                  </th>
                  {getCalendarDates().map((date) => (
                    <th key={date.toISOString()} className="text-center py-3 px-2 text-xs font-bold text-white uppercase tracking-wider min-w-[100px]">
                      <div>
                        <div>{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div>{date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {getFilteredRoomsAndReservations().filteredRooms.map((room) => (
                  <tr key={room.number} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4 font-medium text-gray-900 w-[152px] sticky left-0 bg-white border-r border-gray-200 z-10">
                      <div>
                        <div className="font-bold">Room {room.number}</div>
                        <div className="text-sm text-gray-600">{room.type}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center w-[120px] sticky left-[152px] bg-white border-r border-gray-200 z-10" style={{boxShadow: '4px 0 6px -1px rgba(0, 0, 0, 0.1)'}}>
                      <div className="flex flex-col items-center space-y-1">
                        <span className={`px-2 py-1 text-xs font-medium ${getRoomStatusColor(room.status || 'available')}`}>
                          {getRoomStatusText(room.status || 'available')}
                        </span>
                        {room.maintenance_note && (
                          <div className="text-xs text-gray-500 text-center max-w-[80px] truncate" title={room.maintenance_note}>
                            {room.maintenance_note}
                          </div>
                        )}
                      </div>
                    </td>
{renderRoomRow(room, getCalendarDates())}
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
          
          {/* Room Pagination */}
          {rooms.length > 0 && (
            <div className="px-6 py-4 flex items-center justify-between bg-white border-t border-gray-200">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => loadRooms(Math.max(1, roomsCurrentPage - 1))}
                  disabled={roomsCurrentPage === 1 || roomsLoading}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadRooms(Math.min(roomsTotalPages, roomsCurrentPage + 1))}
                  disabled={roomsCurrentPage === roomsTotalPages || roomsLoading}
                  className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{((roomsCurrentPage - 1) * 20) + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(roomsCurrentPage * 20, roomsTotalCount)}</span> of{' '}
                    <span className="font-medium">{roomsTotalCount}</span> rooms
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => loadRooms(Math.max(1, roomsCurrentPage - 1))}
                      disabled={roomsCurrentPage === 1 || roomsLoading}
                      className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    
                    {(() => {
                      const totalPages = roomsTotalPages;
                      const current = roomsCurrentPage;
                      const pages = [];
                      
                      if (totalPages <= 7) {
                        // Show all pages if 7 or fewer
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Smart pagination with ellipsis
                        if (current <= 4) {
                          // Show: 1 2 3 4 5 ... last
                          pages.push(1, 2, 3, 4, 5);
                          if (totalPages > 6) pages.push('...', totalPages);
                        } else if (current >= totalPages - 3) {
                          // Show: 1 ... (last-4) (last-3) (last-2) (last-1) last
                          pages.push(1);
                          if (totalPages > 6) pages.push('...');
                          for (let i = totalPages - 4; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Show: 1 ... (current-1) current (current+1) ... last
                          pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
                        }
                      }
                      
                      return pages.map((page, index) => {
                        if (page === '...') {
                          return (
                            <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => loadRooms(Number(page))}
                            disabled={roomsLoading}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                              page === current
                                ? 'z-10 bg-[#005357] text-white'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                    
                    <button
                      onClick={() => loadRooms(Math.min(roomsTotalPages, roomsCurrentPage + 1))}
                      disabled={roomsCurrentPage === roomsTotalPages || roomsLoading}
                      className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* List View - Existing Reservations Table */
        <div className="bg-white shadow">
          {/* Table Header with Filters */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-bold text-gray-900">All Reservations</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {totalCount} total reservations • Page {currentPage} of {getTotalPages()}
                </p>
              </div>
              
              {/* Compact Filters */}
              <div className="flex items-center space-x-3">
                {/* Search */}
                <div className="relative">
                  <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery || ''}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && loadReservations(1)}
                    className="w-48 pl-10 pr-4 py-2 text-sm border border-gray-300 focus:border-[#005357] focus:ring-[#005357]"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter || ''}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-32 px-3 py-2 text-sm border border-gray-300 focus:border-[#005357] focus:ring-[#005357]"
                >
                  <option value="">Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="CHECKED_OUT">Checked Out</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                {/* Booking Source Filter */}
                <select
                  value={bookingSourceFilter || ''}
                  onChange={(e) => setBookingSourceFilter(e.target.value)}
                  className="w-32 px-3 py-2 text-sm border border-gray-300 focus:border-[#005357] focus:ring-[#005357]"
                >
                  <option value="">Source</option>
                  <option value="ONLINE">Online</option>
                  <option value="PHONE">Phone</option>
                  <option value="WALK_IN">Walk-in</option>
                  <option value="AGENT">Agent</option>
                  <option value="CORPORATE">Corporate</option>
                </select>

                {/* Date Range Filter - Single Component */}
                <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 bg-white text-sm">
                  <Calendar01Icon className="h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={checkInDateFilter || ''}
                    onChange={(e) => setCheckInDateFilter(e.target.value)}
                    className="border-0 p-0 text-sm focus:ring-0 w-28"
                    placeholder="From"
                  />
                  <span className="text-gray-400">—</span>
                  <input
                    type="date"
                    value={checkOutDateFilter || ''}
                    onChange={(e) => setCheckOutDateFilter(e.target.value)}
                    className="border-0 p-0 text-sm focus:ring-0 w-28"
                    placeholder="To"
                  />
                </div>

                {/* Clear Filters */}
                {(statusFilter || bookingSourceFilter || searchQuery || checkInDateFilter || checkOutDateFilter) && (
                  <button
                    onClick={() => {
                      setStatusFilter('');
                      setBookingSourceFilter('');
                      setSearchQuery('');
                      setCheckInDateFilter('');
                      setCheckOutDateFilter('');
                      loadReservations(1);
                    }}
                    className="text-sm text-gray-600 hover:text-[#005357] transition-colors px-2 py-1"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Advanced Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#005357]">
                <tr>
                  <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                    <button 
                      className="flex items-center hover:text-gray-200 transition-colors"
                      onClick={() => handleSort('guest_name')}
                    >
                      Guest & Reservation
                      {getSortIcon('guest_name')}
                    </button>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                    <button 
                      className="flex items-center hover:text-gray-200 transition-colors"
                      onClick={() => handleSort('check_in_date')}
                    >
                      Dates & Duration
                      {getSortIcon('check_in_date')}
                    </button>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                    <button 
                      className="flex items-center hover:text-gray-200 transition-colors"
                      onClick={() => handleSort('adults')}
                    >
                      Guests & Rooms
                      {getSortIcon('adults')}
                    </button>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                    <button 
                      className="flex items-center hover:text-gray-200 transition-colors"
                      onClick={() => handleSort('room_number')}
                    >
                      Room Details
                      {getSortIcon('room_number')}
                    </button>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                    <button 
                      className="flex items-center hover:text-gray-200 transition-colors"
                      onClick={() => handleSort('total_amount')}
                    >
                      Amount
                      {getSortIcon('total_amount')}
                    </button>
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                    <button 
                      className="flex items-center hover:text-gray-200 transition-colors"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      {getSortIcon('status')}
                    </button>
                  </th>
                  <th className="text-right py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                    <div className="flex items-center justify-end">
                      <span>Actions</span>
                      <ChevronDownIcon className="h-3 w-3 ml-1 text-white opacity-70" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {reservations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Calendar01Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No reservations found</p>
                    </td>
                  </tr>
                ) : (
                  reservations.map((reservation) => (
                    <tr key={reservation.id} className="hover:bg-gray-50 transition-colors">
                      {/* Guest & Reservation */}
                      <td className="px-6 py-4">
                        <div>
                          <Link
                            href={`/bookings/${reservation.reservation_number}`}
                            className="font-semibold text-gray-900 hover:text-[#005357] hover:underline transition-colors cursor-pointer"
                          >
                            {reservation.guest_name}
                          </Link>
                          <p className="text-sm text-gray-600">{reservation.reservation_number}</p>
                          <p className="text-xs text-gray-500">
                            {formatDate(reservation.created_at)} • {reservation.booking_source_display || reservation.booking_source}
                          </p>
                        </div>
                      </td>

                      {/* Dates & Duration */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{formatDate(reservation.check_in_date)}</p>
                          <p className="text-sm text-gray-500">to {formatDate(reservation.check_out_date)}</p>
                          <p className="text-sm font-medium text-[#005357]">{reservation.nights} nights</p>
                        </div>
                      </td>

                      {/* Guests & Rooms */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {reservation.adults} adults
                            {reservation.children > 0 && `, ${reservation.children} children`}
                          </p>
                          <p className="text-sm text-gray-500">{reservation.total_rooms} room(s)</p>
                        </div>
                      </td>

                      {/* Room Details */}
                      <td className="px-6 py-4">
                        <div>
                          {reservation.rooms && reservation.rooms.length > 0 ? (
                            <div className="space-y-1">
                              {reservation.rooms.map((room, index) => (
                                <div key={index}>
                                  <p className="font-medium text-gray-900">Room {room.room_number}</p>
                                  <p className="text-sm text-gray-500">{room.room_type_name}</p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">No rooms assigned</p>
                          )}
                        </div>
                      </td>

                      {/* Amount */}
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-bold text-base text-gray-900">
                            {formatCurrency(reservation.total_amount)}
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(reservation.status)}`}>
                          {reservation.status_display}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="relative flex justify-end">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === reservation.id ? null : reservation.id)}
                            className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded"
                            title="More actions"
                          >
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </button>
                          
                          {openMenuId === reservation.id && (
                            <>
                              {/* Backdrop */}
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              ></div>
                              
                              {/* Dropdown Menu */}
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg z-20">
                                <div className="py-1">
                                  <Link
                                    href={`/bookings/${reservation.reservation_number}`}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                    onClick={() => setOpenMenuId(null)}
                                  >
                                    <EyeIcon className="h-4 w-4" />
                                    <span>View Details</span>
                                  </Link>
                                  <button
                                    onClick={() => setOpenMenuId(null)}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                                  >
                                    <PencilEdit02Icon className="h-4 w-4" />
                                    <span>Edit Reservation</span>
                                  </button>
                                  <div className="border-t border-gray-100 my-1"></div>
                                  
                                  {/* Status-based Actions */}
                                  {(reservation.status === 'confirmed' || reservation.status === 'CONFIRMED') && (
                                    <>
                                      <button
                                        onClick={async () => {
                                          try {
                                            setLoading(true);
                                            await checkInGuest(reservation.id);
                                            // Refresh data
                                            await loadReservations(currentPage);
                                            setOpenMenuId(null);
                                            alert('Guest checked in successfully!');
                                          } catch (error) {
                                            alert('Failed to check in guest. Please try again.');
                                          } finally {
                                            setLoading(false);
                                          }
                                        }}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors w-full text-left"
                                      >
                                        <UserCheckIcon className="h-4 w-4" />
                                        <span>Check In</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleNavigateToPayment(reservation);
                                          setOpenMenuId(null);
                                        }}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                                      >
                                        <CreditCardIcon className="h-4 w-4" />
                                        <span>Process Payment</span>
                                      </button>
                                    </>
                                  )}
                                  
                                  {(reservation.status === 'checked_in' || reservation.status === 'CHECKED_IN') && (
                                    <>
                                      <button
                                        onClick={async () => {
                                          try {
                                            setLoading(true);
                                            await checkOutGuest(reservation.id);
                                            // Refresh data
                                            await loadReservations(currentPage);
                                            setOpenMenuId(null);
                                            alert('Guest checked out successfully!');
                                          } catch (error) {
                                            alert('Failed to check out guest. Please try again.');
                                          } finally {
                                            setLoading(false);
                                          }
                                        }}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors w-full text-left"
                                      >
                                        <Logout01Icon className="h-4 w-4" />
                                        <span>Check Out</span>
                                      </button>
                                      <button
                                        onClick={() => setOpenMenuId(null)}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                                      >
                                        <CreditCardIcon className="h-4 w-4" />
                                        <span>Process Additional Charges</span>
                                      </button>
                                    </>
                                  )}
                                  
                                  {(reservation.status === 'pending' || reservation.status === 'PENDING' || reservation.status === 'partial_paid' || reservation.status === 'PARTIAL_PAID') && (
                                    <>
                                      <button
                                        onClick={() => {
                                          handleNavigateToPayment(reservation);
                                          setOpenMenuId(null);
                                        }}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                                      >
                                        <CreditCardIcon className="h-4 w-4" />
                                        <span>Process Payment</span>
                                      </button>
                                      <button
                                        onClick={async () => {
                                          try {
                                            setLoading(true);
                                            const result = await confirmReservation(reservation.id);
                                            // Refresh data
                                            await loadReservations(currentPage);
                                            setOpenMenuId(null);
                                            alert(result.message || 'Reservation confirmed and room assigned!');
                                          } catch (error) {
                                            alert('Failed to confirm reservation. Please try again.');
                                          } finally {
                                            setLoading(false);
                                          }
                                        }}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors w-full text-left"
                                      >
                                        <UserCheckIcon className="h-4 w-4" />
                                        <span>Confirm Reservation</span>
                                      </button>
                                    </>
                                  )}
                                  
                                  {(reservation.status === 'checked_out' || reservation.status === 'CHECKED_OUT') && (
                                    <div className="px-4 py-2 text-sm text-gray-500 italic">
                                      Guest has checked out
                                    </div>
                                  )}
                                  
                                  {(reservation.status === 'cancelled' || reservation.status === 'CANCELLED') && (
                                    <div className="px-4 py-2 text-sm text-red-500 italic">
                                      Reservation cancelled
                                    </div>
                                  )}
                                  {reservation.can_cancel && (
                                    <>
                                      <div className="border-t border-gray-100 my-1"></div>
                                      <button
                                        onClick={async () => {
                                          const reason = prompt('Please enter cancellation reason:');
                                          if (reason) {
                                            try {
                                              setLoading(true);
                                              await cancelReservation(reservation.id, reason);
                                              // Refresh data
                                              await loadReservations(currentPage);
                                              setOpenMenuId(null);
                                              alert('Reservation cancelled successfully!');
                                            } catch (error) {
                                              alert('Failed to cancel reservation. Please try again.');
                                            } finally {
                                              setLoading(false);
                                            }
                                          }
                                        }}
                                        className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                      >
                                        <Cancel01Icon className="h-4 w-4" />
                                        <span>Cancel Reservation</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {reservations.length > 0 && (
            <div className="px-6 py-4 flex items-center justify-between bg-white">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => loadReservations(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1 || loading}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => loadReservations(Math.min(getTotalPages(), currentPage + 1))}
                  disabled={currentPage === getTotalPages() || loading}
                  className="ml-3 relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing{' '}
                    <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span>
                    {' '}to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, reservations.length)}
                    </span>
                    {' '}of{' '}
                    <span className="font-medium">{reservations.length}</span>
                    {' '}results
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => loadReservations(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1 || loading}
                      className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </button>
                    
                    {(() => {
                      const totalPages = getTotalPages();
                      const current = currentPage;
                      const pages = [];
                      
                      if (totalPages <= 7) {
                        // Show all pages if 7 or fewer
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        // Smart pagination with ellipsis
                        if (current <= 4) {
                          // Show: 1 2 3 4 5 ... last
                          pages.push(1, 2, 3, 4, 5);
                          if (totalPages > 6) pages.push('...', totalPages);
                        } else if (current >= totalPages - 3) {
                          // Show: 1 ... (last-4) (last-3) (last-2) (last-1) last
                          pages.push(1);
                          if (totalPages > 6) pages.push('...');
                          for (let i = totalPages - 4; i <= totalPages; i++) {
                            pages.push(i);
                          }
                        } else {
                          // Show: 1 ... (current-1) current (current+1) ... last
                          pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
                        }
                      }
                      
                      return pages.map((page, index) => {
                        if (page === '...') {
                          return (
                            <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white">
                              ...
                            </span>
                          );
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => loadReservations(Number(page))}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium transition-colors ${
                              page === current
                                ? 'z-10 bg-[#005357] text-white'
                                : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                    
                    <button
                      onClick={() => loadReservations(Math.min(getTotalPages(), currentPage + 1))}
                      disabled={currentPage === getTotalPages() || loading}
                      className="relative inline-flex items-center px-2 py-2 text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Reservation Modal */}
      <Dialog.Root open={showAddReservation} onOpenChange={setShowAddReservation}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto z-50">
            {/* Header */}
            <div className="p-6 bg-[#005357]">
              <div className="flex items-center justify-between">
                <div>
                  <Dialog.Title className="text-xl font-bold text-white">
                    New Reservation
                  </Dialog.Title>
                  <p className="text-sm text-gray-200 mt-1">Create a new booking for a guest</p>
                </div>
                <Dialog.Close asChild>
                  <button className="p-2 text-white hover:text-gray-200">
                    <Cancel01Icon className="h-5 w-5" />
                  </button>
                </Dialog.Close>
              </div>
            </div>

            {/* Step Navigation */}
            <div className="px-6 py-4 bg-white border-b border-gray-200">
              <nav className="flex justify-center">
                <ol className="flex items-center space-x-8">
                  {wizardSteps.map((step) => (
                    <li key={step.id} className="flex items-center">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        wizardStep >= step.id 
                          ? 'bg-[#005357] text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step.id}
                      </div>
                      <span className={`ml-2 text-sm font-medium ${
                        wizardStep >= step.id ? 'text-[#005357]' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                      {step.number < wizardSteps.length && (
                        <div className={`w-8 h-0.5 ml-8 ${
                          wizardStep > step.id ? 'bg-[#005357]' : 'bg-gray-200'
                        }`} />
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            {/* Form Content */}
            <div className="p-6 bg-gray-50">
              <form onSubmit={handleFormSubmit} className="space-y-6">
                {/* Step 1: Guest Information */}
                {wizardStep === 1 && (
                  <div className="bg-white p-6 rounded shadow">
                    <h3 className="font-bold text-gray-900 mb-4">Guest Information</h3>
                    
                    {/* Return Customer Check */}
                    <div className="mb-6 p-4 bg-blue-50 rounded">
                      <div className="flex items-center space-x-3">
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
                          ✓ This is a return customer
                        </label>
                      </div>
                      {formData.guest.is_return_customer && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Previous Stay Date</label>
                            <input
                              type="date"
                              value={formData.guest.previous_stay_date}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, previous_stay_date: e.target.value }
                              }))}
                              className="w-full px-3 py-2 bg-white rounded focus:ring-2 focus:ring-[#005357] focus:outline-none border border-blue-200"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-blue-700 mb-1">Loyalty/Member Number</label>
                            <input
                              type="text"
                              value={formData.guest.loyalty_number}
                              onChange={(e) => setFormData(prev => ({
                                ...prev,
                                guest: { ...prev.guest, loyalty_number: e.target.value }
                              }))}
                              className="w-full px-3 py-2 bg-white rounded focus:ring-2 focus:ring-[#005357] focus:outline-none border border-blue-200"
                              placeholder="KR123456 or Member ID"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Basic Information */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-800 mb-3">Basic Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                            placeholder="Enter first name"
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
                            className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                            placeholder="Enter last name"
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
                            className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
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
                            className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
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
                            className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                            placeholder="e.g., Indonesian, American, etc."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-800 mb-3">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                          <input
                            type="email"
                            required
                            value={formData.guest.email}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              guest: { ...prev.guest, email: e.target.value }
                            }))}
                            className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                            placeholder="guest@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            required
                            value={formData.guest.phone}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              guest: { ...prev.guest, phone: e.target.value }
                            }))}
                            className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                            placeholder="+62-812-1111-0001"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                          <textarea
                            value={formData.guest.address}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              guest: { ...prev.guest, address: e.target.value }
                            }))}
                            className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                            placeholder="Full address including city, state/province, and country"
                            rows={3}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Document Information */}
                    <div className="mb-6">
                      <h4 className="font-medium text-gray-800 mb-3">Document Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                          <select
                            required
                            value={formData.guest.id_type}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              guest: { ...prev.guest, id_type: e.target.value }
                            }))}
                            className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                          >
                            <option value="passport">Passport</option>
                            <option value="national_id">National ID Card</option>
                            <option value="drivers_license">Driver's License</option>
                            <option value="ktp">KTP (Indonesian ID)</option>
                            <option value="kitas">KITAS (Indonesian Residence Permit)</option>
                            <option value="other">Other Government ID</option>
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
                            className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                            placeholder="Enter document number"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Special Requests */}
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Special Requests</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Requests or Notes</label>
                        <textarea
                          value={formData.special_requests}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            special_requests: e.target.value
                          }))}
                          className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                          placeholder="Any special requests, dietary restrictions, accessibility needs, or other notes..."
                          rows={4}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Examples: Late check-in, extra pillows, vegetarian meals, wheelchair access, anniversary celebration, etc.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 2: Booking Details */}
                {wizardStep === 2 && (
                  <div className="bg-white p-6 rounded shadow">
                    <h3 className="font-bold text-gray-900 mb-4">Booking Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-in Date *</label>
                        <input
                          type="date"
                          required
                          value={formData.check_in_date}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            check_in_date: e.target.value
                          }))}
                          className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Check-out Date *</label>
                        <input
                          type="date"
                          required
                          value={formData.check_out_date}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            check_out_date: e.target.value
                          }))}
                          className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Adults *</label>
                        <select
                          required
                          value={formData.adults}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            adults: parseInt(e.target.value)
                          }))}
                          className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                        >
                          <option value="1">1 Adult</option>
                          <option value="2">2 Adults</option>
                          <option value="3">3 Adults</option>
                          <option value="4">4 Adults</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                        <select
                          value={formData.children}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            children: parseInt(e.target.value)
                          }))}
                          className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                        >
                          <option value="0">0 Children</option>
                          <option value="1">1 Child</option>
                          <option value="2">2 Children</option>
                          <option value="3">3 Children</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Booking Source</label>
                        <select
                          value={formData.booking_source}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            booking_source: e.target.value
                          }))}
                          className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                        >
                          <option value="DIRECT">Direct Booking</option>
                          <option value="ONLINE">Online Booking</option>
                          <option value="OTA">Online Travel Agent</option>
                          <option value="WALK_IN">Walk-in</option>
                          <option value="PHONE">Phone Booking</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
                        <textarea
                          value={formData.special_requests}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            special_requests: e.target.value
                          }))}
                          className="w-full px-3 py-2 bg-gray-50 rounded focus:ring-2 focus:ring-[#005357] focus:outline-none"
                          rows={3}
                          placeholder="Any special requests or notes..."
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Room Selection */}
                {wizardStep === 3 && (
                  <div className="bg-white p-6 rounded shadow">
                    <h3 className="font-bold text-gray-900 mb-4">Select Room</h3>
                    {availableRooms.length > 0 ? (
                      <div className="space-y-4">
                        {availableRooms.map((room) => (
                          <div
                            key={room.id}
                            onClick={() => setSelectedRoom(room)}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              selectedRoom?.id === room.id
                                ? 'border-[#005357] bg-[#005357]/5'
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
                                <div className="flex-grow">
                                  <h4 className="font-medium text-gray-900">Room {room.number}</h4>
                                  <p className="text-sm text-gray-500">{room.room_type_name}</p>
                                  <div className="flex items-center space-x-2 text-xs text-gray-400">
                                    <span>Floor {room.floor}</span>
                                    <span>•</span>
                                    <span>Max {room.room_type?.max_occupancy || 'N/A'} guests</span>
                                    <span>•</span>
                                    <span className="text-green-600 font-medium">✓ Available all nights</span>
                                  </div>
                                  {room.pricing_info && (
                                    <div className="mt-2 text-xs text-gray-500">
                                      <p>Includes: {room.pricing_info.price_includes?.join(', ')}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                <div className="mb-1">
                                  <p className="text-lg font-bold text-gray-900">
                                    {formatCurrency(room.current_price || room.base_price || 0)}
                                  </p>
                                  <p className="text-xs text-gray-500">per night</p>
                                </div>
                                <div className="border-t pt-2 mt-2">
                                  <p className="text-sm font-semibold text-[#005357]">
                                    {formatCurrency(room.total_cost || 0)}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    total ({room.nights || 0} nights)
                                  </p>
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  + {room.pricing_info?.price_excludes?.[0] || 'taxes'}
                                </div>
                              </div>
                            </div>
                            
                            {/* Availability Calendar Preview (if available) */}
                            {room.availability_7_days && room.availability_7_days.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-xs font-medium text-gray-600 mb-2">7-Day Availability</p>
                                <div className="flex space-x-1">
                                  {room.availability_7_days.slice(0, 7).map((day: any) => (
                                    <div
                                      key={day.date}
                                      className={`w-8 h-8 rounded text-xs flex items-center justify-center ${
                                        day.available 
                                          ? 'bg-green-100 text-green-700' 
                                          : 'bg-red-100 text-red-700'
                                      }`}
                                      title={`${day.date} (${day.day_name}): ${day.available ? 'Available' : 'Not Available'}`}
                                    >
                                      {day.date.split('-')[2]}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500 mb-4">No rooms available for the selected dates and guest count.</p>
                        <button
                          type="button"
                          onClick={() => setWizardStep(2)}
                          className="text-[#005357] hover:underline"
                        >
                          ← Go back to change dates or guest count
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 4: Confirmation */}
                {wizardStep === 4 && (
                  <div className="bg-white p-6 rounded shadow">
                    <h3 className="font-bold text-gray-900 mb-4">Review & Confirm</h3>
                    
                    {/* Guest Information Summary */}
                    <div className="mb-6 p-4 bg-gray-50 rounded">
                      <h4 className="font-medium text-gray-900 mb-3">Guest Information</h4>
                      
                      {/* Return Customer Badge */}
                      {formData.guest.is_return_customer && (
                        <div className="mb-3 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ✓ Return Customer
                          {formData.guest.loyalty_number && ` • ${formData.guest.loyalty_number}`}
                        </div>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                        <div className="space-y-2">
                          <p><strong>Full Name:</strong> {formData.guest.first_name} {formData.guest.last_name}</p>
                          {formData.guest.date_of_birth && (
                            <p><strong>Date of Birth:</strong> {new Date(formData.guest.date_of_birth).toLocaleDateString('id-ID')}</p>
                          )}
                          {formData.guest.gender && (
                            <p><strong>Gender:</strong> {formData.guest.gender.charAt(0).toUpperCase() + formData.guest.gender.slice(1)}</p>
                          )}
                          {formData.guest.nationality && (
                            <p><strong>Nationality:</strong> {formData.guest.nationality}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <p><strong>Email:</strong> {formData.guest.email}</p>
                          <p><strong>Phone:</strong> {formData.guest.phone}</p>
                          <p><strong>Document:</strong> {formData.guest.id_type.charAt(0).toUpperCase() + formData.guest.id_type.slice(1).replace('_', ' ')} - {formData.guest.id_number}</p>
                          {formData.guest.address && (
                            <p><strong>Address:</strong> {formData.guest.address}</p>
                          )}
                        </div>
                      </div>
                      
                      {formData.guest.is_return_customer && formData.guest.previous_stay_date && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <p className="text-sm text-blue-700">
                            <strong>Previous Stay:</strong> {new Date(formData.guest.previous_stay_date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Booking Details Summary */}
                    <div className="mb-6 p-4 bg-gray-50 rounded">
                      <h4 className="font-medium text-gray-900 mb-3">Booking Details</h4>
                      <div className="text-sm text-gray-700">
                        <p><strong>Check-in:</strong> {formatDate(formData.check_in_date)}</p>
                        <p><strong>Check-out:</strong> {formatDate(formData.check_out_date)}</p>
                        <p><strong>Guests:</strong> {formData.adults} adults{formData.children > 0 ? `, ${formData.children} children` : ''}</p>
                        <p><strong>Booking Source:</strong> {formData.booking_source}</p>
                        {formData.special_requests && <p><strong>Special Requests:</strong> {formData.special_requests}</p>}
                      </div>
                    </div>

                    {/* Room Summary */}
                    {selectedRoom && (
                      <div className="mb-6 p-4 bg-gray-50 rounded">
                        <h4 className="font-medium text-gray-900 mb-3">Room Assignment</h4>
                        <div className="text-sm text-gray-700 space-y-2">
                          <div className="flex justify-between">
                            <span><strong>Room:</strong> {selectedRoom.number} - {selectedRoom.room_type_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span><strong>Floor:</strong> {selectedRoom.floor}</span>
                          </div>
                          <div className="flex justify-between">
                            <span><strong>Rate:</strong></span>
                            <span>{formatCurrency(selectedRoom.current_price || selectedRoom.base_price || 0)} per night</span>
                          </div>
                          <div className="flex justify-between">
                            <span><strong>Nights:</strong></span>
                            <span>{selectedRoom.nights || 0} nights</span>
                          </div>
                          
                          {/* Pricing Breakdown */}
                          <div className="border-t pt-3 mt-3 space-y-1">
                            <div className="flex justify-between">
                              <span><strong>Subtotal:</strong></span>
                              <span>{formatCurrency(selectedRoom.total_cost || 0)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-600">
                              <span>PPN/VAT (11%):</span>
                              <span>{formatCurrency((selectedRoom.total_cost || 0) * 0.11)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-[#005357] text-base border-t pt-2">
                              <span><strong>Grand Total:</strong></span>
                              <span>{formatCurrency((selectedRoom.total_cost || 0) * 1.11)}</span>
                            </div>
                          </div>
                          
                          {/* What's Included */}
                          {selectedRoom.pricing_info && (
                            <div className="mt-4 pt-3 border-t">
                              <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                  <p className="font-medium text-green-700 mb-1">✓ Included:</p>
                                  <ul className="text-gray-600 space-y-0.5">
                                    {selectedRoom.pricing_info.price_includes?.map((item: string, index: number) => (
                                      <li key={index}>• {item}</li>
                                    ))}
                                  </ul>
                                </div>
                                <div>
                                  <p className="font-medium text-orange-700 mb-1">+ Additional:</p>
                                  <ul className="text-gray-600 space-y-0.5">
                                    {selectedRoom.pricing_info.price_excludes?.map((item: string, index: number) => (
                                      <li key={index}>• {item}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!selectedRoom && (
                      <div className="mb-6 p-4 bg-yellow-50 rounded">
                        <p className="text-sm text-yellow-700">
                          <strong>Note:</strong> No room selected. The reservation will be created without room assignment. 
                          A room can be assigned later when the reservation is confirmed.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Navigation buttons */}
                <div className="flex justify-between pt-6">
                  <button
                    type="button"
                    onClick={() => setWizardStep(Math.max(1, wizardStep - 1))}
                    disabled={wizardStep === 1}
                    className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                      wizardStep === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Previous
                  </button>
                  
                  {wizardStep === 1 && (
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="px-4 py-2 bg-[#005357] text-white text-sm font-medium rounded hover:bg-[#004449] transition-colors"
                    >
                      Next
                    </button>
                  )}
                  
                  {wizardStep === 2 && (
                    <button
                      type="button"
                      onClick={checkAvailabilityAndProceed}
                      disabled={!formData.check_in_date || !formData.check_out_date || loading}
                      className="px-4 py-2 bg-[#005357] text-white text-sm font-medium rounded hover:bg-[#004449] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Checking Availability...' : 'Check Availability'}
                    </button>
                  )}
                  
                  {wizardStep === 3 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedRoom) {
                          alert('Please select a room to continue');
                          return;
                        }
                        setWizardStep(4);
                      }}
                      disabled={!selectedRoom}
                      className="px-4 py-2 bg-[#005357] text-white text-sm font-medium rounded hover:bg-[#004449] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Review Booking
                    </button>
                  )}
                  
                  {wizardStep === 4 && (
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-[#005357] text-white text-sm font-medium rounded hover:bg-[#004449] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Creating Reservation...' : 'Complete Reservation'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Payment processing now redirects to POS page */}
      </div>
    </AppLayout>
  );
};

export default BookingsPage;