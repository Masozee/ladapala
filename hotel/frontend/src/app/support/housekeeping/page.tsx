'use client';

import { useState } from 'react';
import Link from 'next/link';
import SupportLayout, { SupportHeaderActions } from '@/components/SupportLayout';
import {
  PackageIcon,
  Search02Icon,
  FilterIcon,
  Calendar01Icon,
  Clock01Icon,
  UserIcon,
  UserCheckIcon,
  CancelCircleIcon,
  AlertCircleIcon,
  EyeIcon,
  PencilEdit02Icon,
  Add01Icon,
  ViewIcon,
  ListViewIcon,
  BedIcon,
  Building03Icon,
  SparklesIcon,
  Location01Icon,
  UserMultipleIcon,
  Wrench01Icon,
  Call02Icon,
  Mail01Icon,
  ArrowUp01Icon,
  PieChartIcon,
  Settings02Icon
} from '@/lib/icons';

interface HousekeepingTask {
  id: number;
  task_name: string;
  description: string;
  estimated_time: number; // in minutes
  priority: 'low' | 'medium' | 'high';
  category: 'cleaning' | 'maintenance' | 'inspection' | 'restocking';
}

interface RoomTask {
  id: number;
  room_number: string;
  room_type: string;
  floor: number;
  status: 'dirty' | 'cleaning' | 'inspecting' | 'clean' | 'out_of_order' | 'maintenance';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_staff: string;
  staff_id: number;
  guest_checkout?: string;
  next_guest_checkin?: string;
  estimated_completion: string;
  actual_start_time?: string;
  completion_time?: string;
  tasks: HousekeepingTask[];
  notes: string;
  guest_requests?: string[];
  amenities_needed: string[];
  inspection_passed?: boolean;
  inspector?: string;
  inspection_notes?: string;
  maintenance_issues?: string[];
  duration_minutes?: number;
}

interface Staff {
  id: number;
  name: string;
  role: 'housekeeper' | 'supervisor' | 'inspector' | 'maintenance';
  shift: 'morning' | 'afternoon' | 'night';
  phone: string;
  active_rooms: number;
  efficiency_rating: number;
  total_rooms_today: number;
}

const HOUSEKEEPING_TASKS: HousekeepingTask[] = [
  {
    id: 1,
    task_name: 'Bed Making',
    description: 'Strip old linens, make bed with fresh sheets and pillowcases',
    estimated_time: 15,
    priority: 'high',
    category: 'cleaning'
  },
  {
    id: 2,
    task_name: 'Bathroom Cleaning',
    description: 'Deep clean bathroom, sanitize all surfaces, replace towels',
    estimated_time: 25,
    priority: 'high',
    category: 'cleaning'
  },
  {
    id: 3,
    task_name: 'Vacuum & Mop',
    description: 'Vacuum carpets and rugs, mop hard floors',
    estimated_time: 20,
    priority: 'medium',
    category: 'cleaning'
  },
  {
    id: 4,
    task_name: 'Amenities Restocking',
    description: 'Check and refill mini bar, toiletries, coffee supplies',
    estimated_time: 10,
    priority: 'medium',
    category: 'restocking'
  },
  {
    id: 5,
    task_name: 'Quality Inspection',
    description: 'Final room inspection before marking as ready',
    estimated_time: 5,
    priority: 'high',
    category: 'inspection'
  }
];

const MOCK_ROOM_TASKS: RoomTask[] = [
  {
    id: 1,
    room_number: '1205',
    room_type: 'Deluxe King Suite',
    floor: 12,
    status: 'cleaning',
    priority: 'high',
    assigned_staff: 'Sari Wulandari',
    staff_id: 1,
    guest_checkout: '2024-08-25T11:00:00Z',
    next_guest_checkin: '2024-08-25T15:00:00Z',
    estimated_completion: '2024-08-25T14:00:00Z',
    actual_start_time: '2024-08-25T12:00:00Z',
    tasks: HOUSEKEEPING_TASKS.filter(t => [1,2,3,4,5].includes(t.id)),
    notes: 'Guest complained about AC noise, needs technical check after cleaning',
    guest_requests: ['Extra pillows', 'Late checkout'],
    amenities_needed: ['Mini bar items', 'Premium toiletries'],
    maintenance_issues: ['AC unit making noise'],
    duration_minutes: 90
  },
  {
    id: 2,
    room_number: '1012',
    room_type: 'Executive Twin',
    floor: 10,
    status: 'dirty',
    priority: 'medium',
    assigned_staff: 'Rina Sari',
    staff_id: 2,
    guest_checkout: '2024-08-25T10:00:00Z',
    next_guest_checkin: '2024-08-25T16:00:00Z',
    estimated_completion: '2024-08-25T15:00:00Z',
    tasks: HOUSEKEEPING_TASKS.filter(t => [1,2,3,4,5].includes(t.id)),
    notes: 'Standard cleaning required',
    amenities_needed: ['Coffee supplies', 'Bath towels'],
    duration_minutes: 75
  },
  {
    id: 3,
    room_number: '2001',
    room_type: 'Presidential Suite',
    floor: 20,
    status: 'clean',
    priority: 'low',
    assigned_staff: 'Maria Santos',
    staff_id: 3,
    guest_checkout: '2024-08-24T11:00:00Z',
    next_guest_checkin: '2024-08-26T14:00:00Z',
    estimated_completion: '2024-08-24T16:00:00Z',
    completion_time: '2024-08-24T15:45:00Z',
    tasks: HOUSEKEEPING_TASKS.filter(t => [1,2,3,4,5].includes(t.id)),
    notes: 'Deep cleaning completed for VIP guest arrival',
    amenities_needed: ['Premium amenities', 'Champagne service'],
    inspection_passed: true,
    inspector: 'Lisa Wong',
    inspection_notes: 'Excellent standard maintained',
    duration_minutes: 120
  },
  {
    id: 4,
    room_number: '805',
    room_type: 'Standard King',
    floor: 8,
    status: 'inspecting',
    priority: 'medium',
    assigned_staff: 'Ahmad Rianto',
    staff_id: 4,
    guest_checkout: '2024-08-25T10:30:00Z',
    next_guest_checkin: '2024-08-25T15:00:00Z',
    estimated_completion: '2024-08-25T13:30:00Z',
    actual_start_time: '2024-08-25T11:00:00Z',
    completion_time: '2024-08-25T13:15:00Z',
    tasks: HOUSEKEEPING_TASKS.filter(t => [1,2,3,4,5].includes(t.id)),
    notes: 'Cleaning completed, waiting for inspection',
    amenities_needed: ['Standard amenities'],
    inspector: 'Lisa Wong',
    duration_minutes: 60
  },
  {
    id: 5,
    room_number: '603',
    room_type: 'Family Suite',
    floor: 6,
    status: 'out_of_order',
    priority: 'urgent',
    assigned_staff: 'Maintenance Team',
    staff_id: 5,
    estimated_completion: '2024-08-26T10:00:00Z',
    tasks: HOUSEKEEPING_TASKS.filter(t => t.category === 'maintenance'),
    notes: 'Water damage in bathroom, requires professional repair',
    amenities_needed: [],
    maintenance_issues: ['Water leak in bathroom', 'Carpet replacement needed', 'AC system check'],
    duration_minutes: 480
  }
];

const MOCK_STAFF: Staff[] = [
  {
    id: 1,
    name: 'Sari Wulandari',
    role: 'housekeeper',
    shift: 'morning',
    phone: '+62-812-3456-1234',
    active_rooms: 2,
    efficiency_rating: 4.8,
    total_rooms_today: 6
  },
  {
    id: 2,
    name: 'Rina Sari',
    role: 'housekeeper',
    shift: 'morning',
    phone: '+62-812-3456-5678',
    active_rooms: 1,
    efficiency_rating: 4.6,
    total_rooms_today: 5
  },
  {
    id: 3,
    name: 'Maria Santos',
    role: 'supervisor',
    shift: 'morning',
    phone: '+62-812-3456-9012',
    active_rooms: 0,
    efficiency_rating: 4.9,
    total_rooms_today: 8
  },
  {
    id: 4,
    name: 'Ahmad Rianto',
    role: 'housekeeper',
    shift: 'afternoon',
    phone: '+62-812-3456-3456',
    active_rooms: 1,
    efficiency_rating: 4.4,
    total_rooms_today: 4
  },
  {
    id: 5,
    name: 'Lisa Wong',
    role: 'inspector',
    shift: 'morning',
    phone: '+62-812-3456-7890',
    active_rooms: 0,
    efficiency_rating: 4.7,
    total_rooms_today: 10
  }
];

const HousekeepingPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterStaff, setFilterStaff] = useState<string>('all');

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'dirty': return 'bg-red-100 text-red-800';
      case 'cleaning': return 'bg-yellow-100 text-yellow-800';
      case 'inspecting': return 'bg-blue-100 text-blue-800';
      case 'clean': return 'bg-green-100 text-green-800';
      case 'out_of_order': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'dirty': return <Delete02Icon className="h-4 w-4" />;
      case 'cleaning': return <PackageIcon className="h-4 w-4" />;
      case 'inspecting': return <EyeIcon className="h-4 w-4" />;
      case 'clean': return <UserCheckIcon className="h-4 w-4" />;
      case 'out_of_order': return <CancelCircleIcon className="h-4 w-4" />;
      case 'maintenance': return <Wrench01Icon className="h-4 w-4" />;
      default: return <Alert01Icon className="h-4 w-4" />;
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case 'dirty': return 'Needs Cleaning';
      case 'cleaning': return 'In Progress';
      case 'inspecting': return 'Inspection';
      case 'clean': return 'Ready';
      case 'out_of_order': return 'Out of Order';
      case 'maintenance': return 'Maintenance';
      default: return 'Unknown';
    }
  };

  const filteredRooms = MOCK_ROOM_TASKS.filter(room => {
    if (searchTerm && !room.room_number.includes(searchTerm) &&
        !room.assigned_staff.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !room.room_type.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterStatus !== 'all' && room.status !== filterStatus) {
      return false;
    }
    if (filterPriority !== 'all' && room.priority !== filterPriority) {
      return false;
    }
    if (filterFloor !== 'all' && room.floor.toString() !== filterFloor) {
      return false;
    }
    if (filterStaff !== 'all' && room.staff_id.toString() !== filterStaff) {
      return false;
    }
    return true;
  });

  const getStatusStats = () => {
    return {
      dirty: MOCK_ROOM_TASKS.filter(r => r.status === 'dirty').length,
      cleaning: MOCK_ROOM_TASKS.filter(r => r.status === 'cleaning').length,
      inspecting: MOCK_ROOM_TASKS.filter(r => r.status === 'inspecting').length,
      clean: MOCK_ROOM_TASKS.filter(r => r.status === 'clean').length,
      out_of_order: MOCK_ROOM_TASKS.filter(r => r.status === 'out_of_order').length,
      total: MOCK_ROOM_TASKS.length
    };
  };

  const stats = getStatusStats();

  const getTimeUntilDeadline = (estimatedCompletion: string) => {
    const now = new Date();
    const deadline = new Date(estimatedCompletion);
    const diffMs = deadline.getTime() - now.getTime();
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) return { text: `${Math.abs(diffHours)}h overdue`, color: 'text-red-600' };
    if (diffHours <= 1) return { text: `${diffHours}h remaining`, color: 'text-orange-600' };
    if (diffHours <= 4) return { text: `${diffHours}h remaining`, color: 'text-yellow-600' };
    return { text: `${diffHours}h remaining`, color: 'text-green-600' };
  };

  return (
    <SupportLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Housekeeping Dashboard</h1>
            <p className="text-gray-600 mt-2">Manage room cleaning, maintenance, and staff assignments</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors">
              <UserCheckIcon className="h-4 w-4" />
              <span>Daily Report</span>
            </button>
            <button className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors">
              <Add01Icon className="h-4 w-4" />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.dirty}</h3>
                  <p className="text-sm text-gray-600 mt-1">Needs Cleaning</p>
                </div>
                <div className="w-8 h-8 bg-red-500 flex items-center justify-center">
                  <Delete02Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
          </div>
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.cleaning}</h3>
                  <p className="text-sm text-gray-600 mt-1">In Progress</p>
                </div>
                <div className="w-8 h-8 bg-yellow-500 flex items-center justify-center">
                  <PackageIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
          </div>
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.inspecting}</h3>
                  <p className="text-sm text-gray-600 mt-1">Inspection</p>
                </div>
                <div className="w-8 h-8 bg-blue-500 flex items-center justify-center">
                  <EyeIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
          </div>
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.clean}</h3>
                  <p className="text-sm text-gray-600 mt-1">Ready</p>
                </div>
                <div className="w-8 h-8 bg-green-500 flex items-center justify-center">
                  <UserCheckIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
          </div>
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.out_of_order}</h3>
                  <p className="text-sm text-gray-600 mt-1">Out of Order</p>
                </div>
                <div className="w-8 h-8 bg-gray-500 flex items-center justify-center">
                  <CancelCircleIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
          </div>
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{stats.total}</h3>
                  <p className="text-sm text-gray-600 mt-1">Total Rooms</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <Building03Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50"></div>
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
                placeholder="Search rooms, staff, or room type..."
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
          {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''} found
        </div>

        {/* Room Tasks Display */}
        {viewMode === 'card' ? (
          /* Card View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => {
              const timeDeadline = getTimeUntilDeadline(room.estimated_completion);
              return (
                <div key={room.id} className="bg-white border border-gray-200">
                  {/* Room Card Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900">Room {room.room_number}</h3>
                          <div className="flex items-center space-x-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(room.status)}`}>
                              {getStatusName(room.status)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(room.priority)}`}>
                              {room.priority}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{room.room_type}</p>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Building03Icon className="h-3 w-3" />
                            <span>Floor {room.floor}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <UserCheckIcon className="h-3 w-3" />
                            <span>{room.assigned_staff}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock01Icon className="h-3 w-3" />
                            <span className={timeDeadline.color}>{timeDeadline.text}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                        {getStatusIcon(room.status)}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-gray-50">
                    {/* Guest Information */}
                    {(room.guest_checkout || room.next_guest_checkin) && (
                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                        <h4 className="font-medium text-blue-900 text-xs uppercase tracking-wide mb-2">Guest Schedule</h4>
                        <div className="space-y-1 text-xs">
                          {room.guest_checkout && (
                            <p className="text-blue-800">Checkout: {formatDateTime(room.guest_checkout)}</p>
                          )}
                          {room.next_guest_checkin && (
                            <p className="text-blue-800">Next Checkin: {formatDateTime(room.next_guest_checkin)}</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Progress Info */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{room.completion_time ? '100%' : '60%'}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${room.completion_time ? 'bg-green-500' : 'bg-yellow-500'}`}
                          style={{width: room.completion_time ? '100%' : '60%'}}
                        ></div>
                      </div>
                      <div className="mt-2 text-xs text-gray-600">
                        <p>Estimated: {room.duration_minutes} minutes</p>
                        {room.actual_start_time && (
                          <p>Started: {formatDateTime(room.actual_start_time)}</p>
                        )}
                      </div>
                    </div>

                    {/* Tasks Summary */}
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 text-xs uppercase tracking-wide mb-2">Tasks ({room.tasks.length})</h4>
                      <div className="space-y-1">
                        {room.tasks.slice(0, 3).map((task, index) => (
                          <div key={task.id} className="flex items-center space-x-2 text-xs">
                            <UserCheckIcon className="h-3 w-3 text-green-500" />
                            <span className="text-gray-700">{task.task_name}</span>
                            <span className="text-gray-500">({task.estimated_time}min)</span>
                          </div>
                        ))}
                        {room.tasks.length > 3 && (
                          <p className="text-xs text-gray-500">+{room.tasks.length - 3} more tasks</p>
                        )}
                      </div>
                    </div>

                    {/* Issues & Notes */}
                    {(room.maintenance_issues?.length || room.notes) && (
                      <div className="mb-4">
                        {room.maintenance_issues?.length && (
                          <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded">
                            <h5 className="text-xs font-medium text-orange-900 mb-1">Issues</h5>
                            {room.maintenance_issues.slice(0, 2).map((issue, index) => (
                              <p key={index} className="text-xs text-orange-800">• {issue}</p>
                            ))}
                            {room.maintenance_issues.length > 2 && (
                              <p className="text-xs text-orange-600">+{room.maintenance_issues.length - 2} more</p>
                            )}
                          </div>
                        )}
                        {room.notes && (
                          <div className="p-2 bg-gray-100 rounded">
                            <p className="text-xs text-gray-700 line-clamp-2">{room.notes}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Inspection Status */}
                    {room.inspection_passed !== undefined && (
                      <div className={`mb-4 p-2 rounded ${room.inspection_passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                        <div className="flex items-center space-x-2">
                          {room.inspection_passed ? (
                            <UserCheckIcon className="h-4 w-4 text-green-600" />
                          ) : (
                            <CancelCircleIcon className="h-4 w-4 text-red-600" />
                          )}
                          <span className={`text-xs font-medium ${room.inspection_passed ? 'text-green-900' : 'text-red-900'}`}>
                            Inspection {room.inspection_passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                        {room.inspector && (
                          <p className="text-xs text-gray-600 mt-1">Inspector: {room.inspector}</p>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2">
                      <Link 
                        href={`/housekeeping/${room.id}`}
                        className="text-xs bg-gray-100 text-gray-700 px-3 py-2 hover:bg-gray-200 transition-colors text-center"
                      >
                        <EyeIcon className="h-3 w-3 inline mr-1" />
                        View Details
                      </Link>
                      <button className="text-xs bg-[#005357] text-white px-3 py-2 hover:bg-[#004147] transition-colors">
                        <PencilEdit02Icon className="h-3 w-3 inline mr-1" />
                        Update Status
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
                  Room
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white">
                  Assigned Staff
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white">
                  Progress
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white">
                  Timeline
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white">
                  Issues
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-white">
                  Actions
                </th>
              </tr>
              </thead>
              <tbody className="bg-white divide-y-2 divide-gray-200">
                {filteredRooms.map((room) => {
                  const timeDeadline = getTimeUntilDeadline(room.estimated_completion);
                  return (
                    <tr key={room.id} className="hover:bg-gray-50">
                      {/* Room Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                            <BedIcon className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-900">Room {room.room_number}</div>
                            <div className="text-sm text-gray-600">{room.room_type}</div>
                            <div className="text-xs text-gray-500">Floor {room.floor}</div>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(room.status)}
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(room.status)}`}>
                              {getStatusName(room.status)}
                            </span>
                          </div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPriorityColor(room.priority)}`}>
                            {room.priority}
                          </span>
                        </div>
                      </td>

                      {/* Staff */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <UserCheckIcon className="h-4 w-4 text-gray-500" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{room.assigned_staff}</div>
                            <div className="text-xs text-gray-500">
                              {MOCK_STAFF.find(s => s.id === room.staff_id)?.role}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">{room.completion_time ? '100%' : '60%'}</span>
                          </div>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${room.completion_time ? 'bg-green-500' : 'bg-yellow-500'}`}
                              style={{width: room.completion_time ? '100%' : '60%'}}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {room.tasks.length} tasks • {room.duration_minutes}min
                          </div>
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-xs">
                          <div className={`font-medium ${timeDeadline.color}`}>
                            {timeDeadline.text}
                          </div>
                          {room.actual_start_time && (
                            <div className="text-gray-600">
                              Started: {formatDateTime(room.actual_start_time)}
                            </div>
                          )}
                          {room.next_guest_checkin && (
                            <div className="text-blue-600">
                              Next: {formatDateTime(room.next_guest_checkin)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Issues */}
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {room.maintenance_issues?.length ? (
                            <div className="flex items-center space-x-1">
                              <Alert01Icon className="h-3 w-3 text-orange-500" />
                              <span className="text-xs text-orange-600">
                                {room.maintenance_issues.length} issue{room.maintenance_issues.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-500">No issues</span>
                          )}
                          {room.inspection_passed !== undefined && (
                            <div className="flex items-center space-x-1">
                              {room.inspection_passed ? (
                                <>
                                  <UserCheckIcon className="h-3 w-3 text-green-500" />
                                  <span className="text-xs text-green-600">Inspection passed</span>
                                </>
                              ) : (
                                <>
                                  <CancelCircleIcon className="h-3 w-3 text-red-500" />
                                  <span className="text-xs text-red-600">Inspection failed</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Link 
                            href={`/housekeeping/${room.id}`}
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

        {/* Staff Performance Summary */}
        <div className="bg-white border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Staff Performance Today</h3>
                <p className="text-sm text-gray-600 mt-1">Current shift efficiency and task completion</p>
              </div>
              <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                <UserMultipleIcon className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {MOCK_STAFF.map((staff) => (
                <div key={staff.id} className="bg-white p-4 border border-gray-200">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{staff.name}</h4>
                      <p className="text-xs text-gray-600 capitalize">{staff.role}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Rooms</span>
                      <span className="font-medium text-gray-900">{staff.active_rooms}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Today</span>
                      <span className="font-medium text-gray-900">{staff.total_rooms_today}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Efficiency</span>
                      <div className="flex items-center space-x-1">
                        <SparklesIcon className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="font-medium text-gray-900">{staff.efficiency_rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shift</span>
                      <span className="font-medium text-gray-900 capitalize">{staff.shift}</span>
                    </div>
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
        {filteredRooms.length === 0 && (
          <div className="text-center py-12">
            <PackageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rooms found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </SupportLayout>
  );
};

export default HousekeepingPage;