'use client';

import { useState } from 'react';
import Link from 'next/link';
import SupportLayout from '@/components/SupportLayout';
import {
  Wrench01Icon,
  Search02Icon,
  FilterIcon,
  Calendar01Icon,
  Clock01Icon,
  UserIcon,
  AlertCircleIcon,
  UserCheckIcon,
  CancelCircleIcon,
  EyeIcon,
  PencilEdit02Icon,
  Add01Icon,
  ViewIcon,
  ListViewIcon,
  SparklesIcon,
  PackageIcon,
  Shield01Icon,
  Building03Icon,
  UserMultipleIcon,
  Call02Icon,
  Mail01Icon,
  ArrowUp01Icon,
  PieChartIcon,
  Location01Icon,
  Settings02Icon
} from '@/lib/icons';

interface MaintenanceRequest {
  id: number;
  ticket_number: string;
  title: string;
  description: string;
  category: 'hvac' | 'plumbing' | 'electrical' | 'general' | 'elevator' | 'security' | 'it_network' | 'furniture' | 'appliances';
  priority: 'low' | 'medium' | 'high' | 'urgent' | 'emergency';
  status: 'open' | 'assigned' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
  location: string;
  room_number?: string;
  floor?: number;
  building_section?: string;
  reported_by: string;
  reporter_role: string;
  reporter_contact: string;
  created_at: string;
  updated_at: string;
  assigned_to?: string;
  technician_id?: number;
  estimated_completion?: string;
  actual_completion?: string;
  estimated_cost?: number;
  actual_cost?: number;
  parts_needed: string[];
  parts_cost?: number;
  labor_hours?: number;
  labor_cost?: number;
  guest_impact: boolean;
  downtime_start?: string;
  downtime_end?: string;
  safety_issue: boolean;
  warranty_covered: boolean;
  vendor_required: boolean;
  vendor_name?: string;
  notes: string;
  photos?: string[];
  completion_notes?: string;
  guest_satisfaction?: number;
  preventive_maintenance: boolean;
  next_service_date?: string;
}

interface Technician {
  id: number;
  name: string;
  specialization: string[];
  skill_level: 'junior' | 'senior' | 'expert';
  phone: string;
  email: string;
  active_requests: number;
  efficiency_rating: number;
  total_completed_today: number;
  shift: 'morning' | 'afternoon' | 'night' | 'on_call';
  current_location?: string;
  available: boolean;
}

const MOCK_MAINTENANCE_REQUESTS: MaintenanceRequest[] = [
  {
    id: 1,
    ticket_number: 'MNT-2024-001',
    title: 'Air conditioning unit making loud noise',
    description: 'AC unit in room 1205 making unusual grinding noise and not cooling effectively. Guest complaints received. Unit appears to be operational but inefficient.',
    category: 'hvac',
    priority: 'high',
    status: 'assigned',
    location: 'Room 1205',
    room_number: '1205',
    floor: 12,
    building_section: 'Main Tower',
    reported_by: 'Sari Wulandari',
    reporter_role: 'Housekeeper',
    reporter_contact: '+62-812-3456-1234',
    created_at: '2024-08-25T08:30:00Z',
    updated_at: '2024-08-25T09:15:00Z',
    assigned_to: 'Ahmad Technical',
    technician_id: 1,
    estimated_completion: '2024-08-25T14:00:00Z',
    estimated_cost: 750000,
    parts_needed: ['AC Filter', 'Lubricant', 'Belt replacement'],
    guest_impact: true,
    safety_issue: false,
    warranty_covered: true,
    vendor_required: false,
    notes: 'Guest has been relocated temporarily. Priority due to VIP guest arrival tonight.',
    photos: ['/maintenance/ac-unit-1205-1.jpg', '/maintenance/ac-unit-1205-2.jpg'],
    preventive_maintenance: false
  },
  {
    id: 2,
    ticket_number: 'MNT-2024-002',
    title: 'Elevator #2 intermittent malfunction',
    description: 'Elevator stopping between floors 8 and 9, doors opening slowly. Safety sensors may be misaligned. Affects guest access to upper floors.',
    category: 'elevator',
    priority: 'urgent',
    status: 'in_progress',
    location: 'Elevator Bank A',
    floor: 0,
    building_section: 'Main Lobby',
    reported_by: 'Security Desk',
    reporter_role: 'Security Officer',
    reporter_contact: '+62-812-9876-5432',
    created_at: '2024-08-25T06:45:00Z',
    updated_at: '2024-08-25T10:30:00Z',
    assigned_to: 'Budi Elevator Tech',
    technician_id: 2,
    estimated_completion: '2024-08-25T16:00:00Z',
    estimated_cost: 2500000,
    parts_needed: ['Door sensor', 'Control board', 'Safety cable'],
    parts_cost: 1800000,
    labor_hours: 6,
    labor_cost: 700000,
    guest_impact: true,
    downtime_start: '2024-08-25T07:00:00Z',
    safety_issue: true,
    warranty_covered: false,
    vendor_required: true,
    vendor_name: 'Jakarta Elevator Services',
    notes: 'Elevator taken out of service for safety. Using stairs or alternate elevators. Vendor technician on site.',
    photos: ['/maintenance/elevator-2-control.jpg'],
    preventive_maintenance: false
  },
  {
    id: 3,
    ticket_number: 'MNT-2024-003',
    title: 'Bathroom faucet leak in room 803',
    description: 'Continuous dripping from bathroom sink faucet. Water damage risk to ceiling below. Guest reported water pressure issues.',
    category: 'plumbing',
    priority: 'medium',
    status: 'completed',
    location: 'Room 803',
    room_number: '803',
    floor: 8,
    building_section: 'Main Tower',
    reported_by: 'Guest Services',
    reporter_role: 'Front Desk',
    reporter_contact: '+62-812-5555-0123',
    created_at: '2024-08-24T14:20:00Z',
    updated_at: '2024-08-24T17:45:00Z',
    assigned_to: 'Joko Plumber',
    technician_id: 3,
    estimated_completion: '2024-08-24T16:00:00Z',
    actual_completion: '2024-08-24T17:30:00Z',
    estimated_cost: 300000,
    actual_cost: 275000,
    parts_needed: ['Faucet cartridge', 'O-rings', 'Sealant'],
    parts_cost: 150000,
    labor_hours: 2,
    labor_cost: 125000,
    guest_impact: false,
    safety_issue: false,
    warranty_covered: false,
    vendor_required: false,
    notes: 'Replaced faucet cartridge and seals. Tested for leaks. Guest satisfied with repair.',
    photos: ['/maintenance/faucet-repair-803.jpg'],
    completion_notes: 'Repair completed successfully. No further issues detected. Guest room ready for occupancy.',
    guest_satisfaction: 5,
    preventive_maintenance: false
  },
  {
    id: 4,
    ticket_number: 'MNT-2024-004',
    title: 'Lobby lighting system partial failure',
    description: 'Multiple LED panel lights not functioning in main lobby area. Affects ambiance and guest experience. Some flickering observed.',
    category: 'electrical',
    priority: 'high',
    status: 'open',
    location: 'Main Lobby',
    floor: 1,
    building_section: 'Main Entrance',
    reported_by: 'Facilities Manager',
    reporter_role: 'Management',
    reporter_contact: '+62-812-7777-8888',
    created_at: '2024-08-25T07:00:00Z',
    updated_at: '2024-08-25T07:00:00Z',
    estimated_cost: 1200000,
    parts_needed: ['LED panels', 'Ballast', 'Wiring components'],
    guest_impact: true,
    safety_issue: false,
    warranty_covered: true,
    vendor_required: false,
    notes: 'Affects main entrance lighting. Priority repair needed before evening guest arrivals.',
    photos: ['/maintenance/lobby-lighting-1.jpg', '/maintenance/lobby-lighting-2.jpg'],
    preventive_maintenance: false
  },
  {
    id: 5,
    ticket_number: 'MNT-2024-005',
    title: 'WiFi network instability in conference room',
    description: 'Intermittent WiFi connectivity in Executive Conference Room. Affects business meetings and guest satisfaction.',
    category: 'it_network',
    priority: 'medium',
    status: 'on_hold',
    location: 'Executive Conference Room',
    floor: 3,
    building_section: 'Business Center',
    reported_by: 'Conference Services',
    reporter_role: 'Event Coordinator',
    reporter_contact: '+62-812-4444-5555',
    created_at: '2024-08-24T11:30:00Z',
    updated_at: '2024-08-25T09:00:00Z',
    assigned_to: 'IT Support Team',
    technician_id: 4,
    estimated_completion: '2024-08-26T10:00:00Z',
    estimated_cost: 500000,
    parts_needed: ['Network router', 'Ethernet cables', 'Access point'],
    guest_impact: true,
    safety_issue: false,
    warranty_covered: false,
    vendor_required: true,
    vendor_name: 'TechNet Solutions',
    notes: 'Waiting for network equipment delivery. Temporary solution implemented using mobile hotspot.',
    photos: ['/maintenance/wifi-conference-room.jpg'],
    preventive_maintenance: false
  },
  {
    id: 6,
    ticket_number: 'MNT-2024-006',
    title: 'Monthly HVAC preventive maintenance',
    description: 'Scheduled preventive maintenance for all HVAC systems. Filter replacement, system cleaning, and performance check.',
    category: 'hvac',
    priority: 'low',
    status: 'assigned',
    location: 'Building-wide',
    building_section: 'All Sections',
    reported_by: 'Maintenance Schedule',
    reporter_role: 'System',
    reporter_contact: 'system@hotel.com',
    created_at: '2024-08-25T00:00:00Z',
    updated_at: '2024-08-25T08:00:00Z',
    assigned_to: 'HVAC Team',
    technician_id: 1,
    estimated_completion: '2024-08-26T18:00:00Z',
    estimated_cost: 2000000,
    parts_needed: ['Air filters', 'Cleaning supplies', 'Lubricants'],
    guest_impact: false,
    safety_issue: false,
    warranty_covered: false,
    vendor_required: false,
    notes: 'Routine preventive maintenance. Schedule during low occupancy hours.',
    preventive_maintenance: true,
    next_service_date: '2024-09-25T00:00:00Z'
  }
];

const MOCK_TECHNICIANS: Technician[] = [
  {
    id: 1,
    name: 'Ahmad Technical',
    specialization: ['HVAC', 'General Maintenance'],
    skill_level: 'senior',
    phone: '+62-812-1111-2222',
    email: 'ahmad.tech@hotel.com',
    active_requests: 2,
    efficiency_rating: 4.7,
    total_completed_today: 3,
    shift: 'morning',
    current_location: 'Floor 12',
    available: false
  },
  {
    id: 2,
    name: 'Budi Elevator Tech',
    specialization: ['Elevator', 'Mechanical Systems'],
    skill_level: 'expert',
    phone: '+62-812-3333-4444',
    email: 'budi.elevator@hotel.com',
    active_requests: 1,
    efficiency_rating: 4.9,
    total_completed_today: 1,
    shift: 'morning',
    current_location: 'Elevator Bank A',
    available: false
  },
  {
    id: 3,
    name: 'Joko Plumber',
    specialization: ['Plumbing', 'Water Systems'],
    skill_level: 'senior',
    phone: '+62-812-5555-6666',
    email: 'joko.plumber@hotel.com',
    active_requests: 0,
    efficiency_rating: 4.6,
    total_completed_today: 2,
    shift: 'afternoon',
    current_location: 'Available',
    available: true
  },
  {
    id: 4,
    name: 'IT Support Team',
    specialization: ['IT Network', 'Security Systems'],
    skill_level: 'expert',
    phone: '+62-812-7777-9999',
    email: 'it.support@hotel.com',
    active_requests: 1,
    efficiency_rating: 4.5,
    total_completed_today: 0,
    shift: 'on_call',
    current_location: 'IT Office',
    available: true
  },
  {
    id: 5,
    name: 'Electrical Team',
    specialization: ['Electrical', 'Lighting Systems'],
    skill_level: 'senior',
    phone: '+62-812-8888-0000',
    email: 'electrical@hotel.com',
    active_requests: 0,
    efficiency_rating: 4.8,
    total_completed_today: 1,
    shift: 'morning',
    current_location: 'Available',
    available: true
  }
];

const MaintenancePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTechnician, setFilterTechnician] = useState<string>('all');

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
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
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'on_hold': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'emergency': return 'bg-red-200 text-red-900';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hvac': return <PackageIcon className="h-4 w-4" />;
      case 'plumbing': return <PackageIcon className="h-4 w-4" />;
      case 'electrical': return <SparklesIcon className="h-4 w-4" />;
      case 'elevator': return <Building03Icon className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'it_network': return <SparklesIcon className="h-4 w-4" />;
      case 'general': return <Wrench01Icon className="h-4 w-4" />;
      case 'furniture': return <Settings02Icon className="h-4 w-4" />;
      case 'appliances': return <PieChartIcon className="h-4 w-4" />;
      default: return <Wrench01Icon className="h-4 w-4" />;
    }
  };

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'hvac': return 'HVAC';
      case 'plumbing': return 'Plumbing';
      case 'electrical': return 'Electrical';
      case 'elevator': return 'Elevator';
      case 'security': return 'Security';
      case 'it_network': return 'IT/Network';
      case 'general': return 'General';
      case 'furniture': return 'Furniture';
      case 'appliances': return 'Appliances';
      default: return 'Other';
    }
  };

  const filteredRequests = MOCK_MAINTENANCE_REQUESTS.filter(request => {
    if (searchTerm && 
        !request.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.location.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.room_number?.includes(searchTerm)) {
      return false;
    }
    if (filterStatus !== 'all' && request.status !== filterStatus) {
      return false;
    }
    if (filterPriority !== 'all' && request.priority !== filterPriority) {
      return false;
    }
    if (filterCategory !== 'all' && request.category !== filterCategory) {
      return false;
    }
    if (filterTechnician !== 'all' && request.technician_id?.toString() !== filterTechnician) {
      return false;
    }
    return true;
  });

  const getStatusStats = () => {
    return {
      open: MOCK_MAINTENANCE_REQUESTS.filter(r => r.status === 'open').length,
      assigned: MOCK_MAINTENANCE_REQUESTS.filter(r => r.status === 'assigned').length,
      in_progress: MOCK_MAINTENANCE_REQUESTS.filter(r => r.status === 'in_progress').length,
      on_hold: MOCK_MAINTENANCE_REQUESTS.filter(r => r.status === 'on_hold').length,
      completed: MOCK_MAINTENANCE_REQUESTS.filter(r => r.status === 'completed').length,
      urgent: MOCK_MAINTENANCE_REQUESTS.filter(r => r.priority === 'urgent' || r.priority === 'emergency').length,
      total: MOCK_MAINTENANCE_REQUESTS.length
    };
  };

  const stats = getStatusStats();

  const getTimeUntilDeadline = (estimatedCompletion: string) => {
    const now = new Date();
    const deadline = new Date(estimatedCompletion);
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) return { text: `${Math.abs(diffHours)}h overdue`, color: 'text-red-600' };
    if (diffHours <= 2) return { text: `${diffHours}h remaining`, color: 'text-orange-600' };
    if (diffHours <= 8) return { text: `${diffHours}h remaining`, color: 'text-yellow-600' };
    return { text: `${diffHours}h remaining`, color: 'text-green-600' };
  };

  return (
    <SupportLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance Dashboard</h1>
            <p className="text-gray-600 mt-2">Track and manage all maintenance requests and technical issues</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors">
              <PieChartIcon className="h-4 w-4" />
              <span>Reports</span>
            </button>
            <button className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors">
              <Add01Icon className="h-4 w-4" />
              <span>New Request</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-12 gap-4">
          {/* First Column - 6 cards in 2 rows */}
          <div className="col-span-9">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="bg-white border border-gray-200 hover:bg-[#005357] hover:text-white transition-colors duration-200 cursor-pointer group">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-white">{stats.open}</h3>
                      <p className="text-sm text-gray-600 group-hover:text-gray-200 mt-1">Open</p>
                    </div>
                    <div className="w-8 h-8 bg-[#005357] group-hover:bg-white flex items-center justify-center transition-colors duration-200">
                      <AlertCircleIcon className="h-4 w-4 text-white group-hover:text-[#005357] transition-colors duration-200" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50"></div>
              </div>
              <div className="bg-white border border-gray-200 hover:bg-[#005357] hover:text-white transition-colors duration-200 cursor-pointer group">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-white">{stats.assigned}</h3>
                      <p className="text-sm text-gray-600 group-hover:text-gray-200 mt-1">Assigned</p>
                    </div>
                    <div className="w-8 h-8 bg-[#005357] group-hover:bg-white flex items-center justify-center transition-colors duration-200">
                      <UserIcon className="h-4 w-4 text-white group-hover:text-[#005357] transition-colors duration-200" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50"></div>
              </div>
              <div className="bg-white border border-gray-200 hover:bg-[#005357] hover:text-white transition-colors duration-200 cursor-pointer group">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-white">{stats.in_progress}</h3>
                      <p className="text-sm text-gray-600 group-hover:text-gray-200 mt-1">In Progress</p>
                    </div>
                    <div className="w-8 h-8 bg-[#005357] group-hover:bg-white flex items-center justify-center transition-colors duration-200">
                      <Wrench01Icon className="h-4 w-4 text-white group-hover:text-[#005357] transition-colors duration-200" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 hover:bg-[#005357] hover:text-white transition-colors duration-200 cursor-pointer group">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-white">{stats.on_hold}</h3>
                      <p className="text-sm text-gray-600 group-hover:text-gray-200 mt-1">On Hold</p>
                    </div>
                    <div className="w-8 h-8 bg-[#005357] group-hover:bg-white flex items-center justify-center transition-colors duration-200">
                      <Clock01Icon className="h-4 w-4 text-white group-hover:text-[#005357] transition-colors duration-200" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50"></div>
              </div>
              <div className="bg-white border border-gray-200 hover:bg-[#005357] hover:text-white transition-colors duration-200 cursor-pointer group">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-white">{stats.completed}</h3>
                      <p className="text-sm text-gray-600 group-hover:text-gray-200 mt-1">Completed</p>
                    </div>
                    <div className="w-8 h-8 bg-[#005357] group-hover:bg-white flex items-center justify-center transition-colors duration-200">
                      <UserCheckIcon className="h-4 w-4 text-white group-hover:text-[#005357] transition-colors duration-200" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50"></div>
              </div>
              <div className="bg-white border border-gray-200 hover:bg-[#005357] hover:text-white transition-colors duration-200 cursor-pointer group">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 group-hover:text-white">{stats.urgent}</h3>
                      <p className="text-sm text-gray-600 group-hover:text-gray-200 mt-1">Urgent</p>
                    </div>
                    <div className="w-8 h-8 bg-red-500 group-hover:bg-white flex items-center justify-center transition-colors duration-200">
                      <Alert01Icon className="h-4 w-4 text-white group-hover:text-red-500 transition-colors duration-200" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50"></div>
              </div>
            </div>
          </div>
          
          {/* Second Column - Total card */}
          <div className="col-span-3">
            <div className="bg-white border border-gray-200 h-full hover:bg-[#005357] hover:text-white transition-colors duration-200 cursor-pointer group">
              <div className="p-6 h-full flex flex-col justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 bg-[#005357] group-hover:bg-white flex items-center justify-center mx-auto mb-4 rounded-full transition-colors duration-200">
                    <Wrench01Icon className="h-6 w-6 text-white group-hover:text-[#005357] transition-colors duration-200" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900 group-hover:text-white mb-2">{stats.total}</h3>
                  <p className="text-sm text-gray-600 group-hover:text-gray-200">Total Requests</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & View Control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              className="flex items-center space-x-2 px-4 py-2 bg-[#005357] text-white text-sm font-medium hover:bg-[#004147] transition-colors"
            >
              <Settings02Icon className="h-4 w-4" />
              <span>Advanced Filter</span>
            </button>
            
            {/* Search Form */}
            <div className="relative">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets, titles, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
              />
            </div>
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

        {/* Results Summary */}
        <div className="text-sm text-gray-600">
          {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''} found
        </div>

        {/* Maintenance Requests Display */}
        {viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => {
              const timeDeadline = request.estimated_completion ? getTimeUntilDeadline(request.estimated_completion) : null;
              return (
                <div key={request.id} className="bg-white border border-gray-200 flex flex-col h-full">
                  {/* Request Card Header */}
                  <div className="p-6 bg-[#005357] text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-white">{request.ticket_number}</h3>
                        <div className="text-sm text-gray-100 mt-1">
                          {request.status.replace('_', ' ')} • {request.priority} • {request.title} • {getCategoryName(request.category)} • {request.location} • {request.reported_by} • {timeDeadline ? timeDeadline.text : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50 flex-1 flex flex-col">
                    {/* Description */}
                    <p className="text-sm text-gray-700 mb-4 line-clamp-3">
                      {request.description}
                    </p>

                    {/* Key Info */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#005357]">
                          {request.estimated_cost ? formatCurrency(request.estimated_cost) : 'TBD'}
                        </div>
                        <div className="text-xs text-gray-600">Est. Cost</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-[#005357]">
                          {request.labor_hours ? `${request.labor_hours}h` : 'TBD'}
                        </div>
                        <div className="text-xs text-gray-600">Est. Time</div>
                      </div>
                    </div>

                    {/* Assigned Technician */}
                    {request.assigned_to && (
                      <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-center space-x-2">
                          <Shield01Icon className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-800 text-sm font-medium">
                            Assigned to: {request.assigned_to}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Alerts */}
                    <div className="space-y-2 mb-4">
                      {request.guest_impact && (
                        <div className="flex items-center space-x-2 p-2 bg-orange-50 border border-orange-200 rounded">
                          <Alert01Icon className="h-3 w-3 text-orange-600" />
                          <span className="text-orange-800 text-xs font-medium">Guest Impact</span>
                        </div>
                      )}
                      {request.safety_issue && (
                        <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded">
                          <Shield className="h-3 w-3 text-red-600" />
                          <span className="text-red-800 text-xs font-medium">Safety Issue</span>
                        </div>
                      )}
                      {request.vendor_required && (
                        <div className="flex items-center space-x-2 p-2 bg-purple-50 border border-purple-200 rounded">
                          <UserMultipleIcon className="h-3 w-3 text-purple-600" />
                          <span className="text-purple-800 text-xs font-medium">Vendor: {request.vendor_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Parts Needed */}
                    <div className="flex-1">
                      {request.parts_needed.length > 0 && (
                        <div className="mb-4">
                          <h5 className="font-medium text-gray-900 text-xs uppercase tracking-wide mb-2">Parts Needed</h5>
                          <div className="flex flex-wrap gap-1">
                            {request.parts_needed.slice(0, 3).map((part, index) => (
                              <span key={index} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded">
                                {part}
                              </span>
                            ))}
                            {request.parts_needed.length > 3 && (
                              <span className="inline-block bg-gray-200 text-gray-600 px-2 py-1 text-xs rounded">
                                +{request.parts_needed.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions - Fixed to bottom */}
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <Link 
                        href={`/maintenance/${request.id}`}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-2 hover:bg-gray-200 transition-colors text-center"
                      >
                        <EyeIcon className="h-3 w-3 inline mr-1" />
                        View Details
                      </Link>
                      <button className="text-xs bg-[#005357] text-white px-3 py-2 hover:bg-[#004147] transition-colors">
                        <PencilEdit02Icon className="h-3 w-3 inline mr-1" />
                        Update
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-gray-200">
              <thead className="bg-[#005357]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Request
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Timeline
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Cost
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y-2 divide-gray-200">
                  {filteredRequests.map((request) => {
                    const timeDeadline = request.estimated_completion ? getTimeUntilDeadline(request.estimated_completion) : null;
                    return (
                      <tr key={request.id} className="hover:bg-gray-50">
                        {/* Request Info */}
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-bold text-gray-900">{request.ticket_number}</div>
                            <div className="text-sm text-gray-900 font-medium">{request.title}</div>
                            <div className="text-xs text-gray-600">{request.location}</div>
                            <div className="text-xs text-gray-500">by {request.reported_by}</div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(request.category)}
                            <span className="text-sm text-gray-700">{getCategoryName(request.category)}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(request.status)}`}>
                              {request.status.replace('_', ' ')}
                            </span>
                            <span className={`block px-2 py-1 text-xs font-medium rounded ${getPriorityColor(request.priority)}`}>
                              {request.priority}
                            </span>
                          </div>
                        </td>

                        {/* Assigned To */}
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {request.assigned_to ? (
                              <div className="text-gray-900 font-medium">{request.assigned_to}</div>
                            ) : (
                              <span className="text-gray-500">Unassigned</span>
                            )}
                          </div>
                        </td>

                        {/* Timeline */}
                        <td className="px-6 py-4">
                          <div className="space-y-1 text-xs">
                            <div className="text-gray-600">
                              Created: {formatDateTime(request.created_at)}
                            </div>
                            {request.estimated_completion && (
                              <div className={`font-medium ${timeDeadline?.color}`}>
                                {timeDeadline?.text}
                              </div>
                            )}
                            {request.actual_completion && (
                              <div className="text-green-600">
                                Completed: {formatDateTime(request.actual_completion)}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Cost */}
                        <td className="px-6 py-4">
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#005357]">
                              {request.estimated_cost ? formatCurrency(request.estimated_cost) : 'TBD'}
                            </div>
                            {request.actual_cost && (
                              <div className="text-xs text-gray-600">
                                Actual: {formatCurrency(request.actual_cost)}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <Link 
                              href={`/maintenance/${request.id}`}
                              className="text-xs bg-gray-100 text-gray-700 px-3 py-2 hover:bg-gray-200 transition-colors rounded"
                            >
                              <EyeIcon className="h-3 w-3 inline mr-1" />
                              View
                            </Link>
                            <button className="text-xs bg-[#005357] text-white px-3 py-2 hover:bg-[#004147] transition-colors rounded">
                              <PencilEdit02Icon className="h-3 w-3 inline mr-1" />
                              Update
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
            </table>
          </div>
        )}

        {/* Technician Status */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 ">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Technician Status</h3>
                <p className="text-sm text-gray-600 mt-1">Current availability and workload</p>
              </div>
              <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                <UserMultipleIcon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {MOCK_TECHNICIANS.map((tech) => (
                <div key={tech.id} className="bg-white p-4 bg-gray-100 rounded">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tech.available ? 'bg-green-100' : 'bg-red-100'}`}>
                      <Shield01Icon className={`h-4 w-4 ${tech.available ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{tech.name}</h4>
                      <p className="text-xs text-gray-600">{tech.skill_level}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active</span>
                      <span className="font-medium text-gray-900">{tech.active_requests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Today</span>
                      <span className="font-medium text-gray-900">{tech.total_completed_today}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rating</span>
                      <div className="flex items-center space-x-1">
                        <div className="text-yellow-400">★</div>
                        <span className="font-medium text-gray-900">{tech.efficiency_rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location</span>
                      <span className="font-medium text-gray-900 text-xs">{tech.current_location}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mt-3">
                    {tech.specialization.slice(0, 2).map((spec, index) => (
                      <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded">
                        {spec}
                      </span>
                    ))}
                  </div>
                  
                  <button className="w-full mt-3 text-xs bg-gray-100 text-gray-700 px-3 py-2 hover:bg-gray-200 transition-colors">
                    <Call02Icon className="h-3 w-3 inline mr-1" />
                    Contact
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* No Results */}
        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Wrench01Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance requests found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </SupportLayout>
  );
};

export default MaintenancePage;