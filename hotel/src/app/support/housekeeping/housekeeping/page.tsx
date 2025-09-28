'use client';

import { useState } from 'react';
import SupportLayout from '@/components/SupportLayout';
import { 
  Bed, 
  Plus,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle,
  User,
  MapPin,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  Timer,
  Sparkles,
  ShowerHead,
  Coffee,
  Shirt,
  Utensils,
  Wind,
  Package,
  RefreshCw,
  Camera,
  MoreHorizontal,
  Users,
  Star,
  ClipboardCheck,
  Settings
} from 'lucide-react';

export default function HousekeepingPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample housekeeping data
  const housekeepingStats = {
    pendingRooms: 12,
    cleaningInProgress: 8,
    completedToday: 15,
    maintenanceRequired: 3,
    checkouts: 7,
    checkins: 9,
    averageCleanTime: 35, // minutes
    staffOnDuty: 6
  };

  const housekeepingTasks = [
    {
      id: 'HSK-001',
      roomNumber: '205',
      roomType: 'Deluxe',
      taskType: 'checkout_cleaning',
      priority: 'high',
      status: 'pending',
      guestCheckout: '2024-08-28 11:00',
      nextCheckIn: '2024-08-28 15:00',
      assignedTo: 'Maria Santos',
      estimatedTime: '45 minutes',
      specialRequests: ['Deep cleaning', 'Extra towels', 'Mini bar restock'],
      notes: 'Guest reported stain on carpet - may need special treatment',
      createdAt: '2024-08-28 11:15',
      completedAt: null,
      guestRating: null,
      issues: ['Carpet stain'],
      amenitiesNeeded: ['Towels', 'Toiletries', 'Mini bar items']
    },
    {
      id: 'HSK-002',
      roomNumber: '312',
      roomType: 'Suite',
      taskType: 'maintenance_cleaning',
      priority: 'medium',
      status: 'in_progress',
      guestCheckout: null,
      nextCheckIn: null,
      assignedTo: 'Sarah Johnson',
      estimatedTime: '60 minutes',
      specialRequests: ['Bathroom deep clean', 'Window cleaning'],
      notes: 'Maintenance completed - ready for final cleaning',
      createdAt: '2024-08-28 09:30',
      completedAt: null,
      guestRating: null,
      issues: [],
      amenitiesNeeded: ['Cleaning supplies', 'Glass cleaner']
    },
    {
      id: 'HSK-003',
      roomNumber: '108',
      roomType: 'Standard',
      taskType: 'daily_cleaning',
      priority: 'low',
      status: 'completed',
      guestCheckout: null,
      nextCheckIn: null,
      assignedTo: 'Emma Wilson',
      estimatedTime: '30 minutes',
      specialRequests: ['Change linens', 'Vacuum'],
      notes: 'Guest out for day - routine cleaning completed',
      createdAt: '2024-08-28 10:00',
      completedAt: '2024-08-28 10:25',
      guestRating: 5,
      issues: [],
      amenitiesNeeded: ['Fresh linens', 'Toiletries']
    },
    {
      id: 'HSK-004',
      roomNumber: '501',
      roomType: 'Presidential Suite',
      taskType: 'vip_cleaning',
      priority: 'urgent',
      status: 'in_progress',
      guestCheckout: '2024-08-28 12:00',
      nextCheckIn: '2024-08-28 16:00',
      assignedTo: 'Maria Santos',
      estimatedTime: '90 minutes',
      specialRequests: ['Premium service', 'Fresh flowers', 'Champagne setup'],
      notes: 'VIP guest arriving - premium cleaning and setup required',
      createdAt: '2024-08-28 12:15',
      completedAt: null,
      guestRating: null,
      issues: [],
      amenitiesNeeded: ['Premium amenities', 'Fresh flowers', 'Champagne']
    },
    {
      id: 'HSK-005',
      roomNumber: '220',
      roomType: 'Deluxe',
      taskType: 'checkout_cleaning',
      priority: 'medium',
      status: 'pending',
      guestCheckout: '2024-08-28 10:30',
      nextCheckIn: '2024-08-28 14:00',
      assignedTo: 'David Park',
      estimatedTime: '40 minutes',
      specialRequests: ['Standard checkout cleaning'],
      notes: 'Regular checkout - no special requirements',
      createdAt: '2024-08-28 10:45',
      completedAt: null,
      guestRating: null,
      issues: [],
      amenitiesNeeded: ['Standard amenities']
    },
    {
      id: 'HSK-006',
      roomNumber: '415',
      roomType: 'Junior Suite',
      taskType: 'checkout_cleaning',
      priority: 'high',
      status: 'completed',
      guestCheckout: '2024-08-28 08:00',
      nextCheckIn: '2024-08-28 14:30',
      assignedTo: 'Lisa Chen',
      estimatedTime: '50 minutes',
      specialRequests: ['Deep bathroom clean', 'Balcony cleaning'],
      notes: 'Extended stay guest - thorough cleaning completed',
      createdAt: '2024-08-28 08:15',
      completedAt: '2024-08-28 09:10',
      guestRating: 4,
      issues: [],
      amenitiesNeeded: ['Fresh linens', 'Toiletries', 'Welcome amenities']
    }
  ];

  const housekeepingStaff = [
    {
      id: 1,
      name: 'Maria Santos',
      role: 'Housekeeping Supervisor',
      shift: 'Day (07:00-15:00)',
      status: 'busy',
      currentRoom: '501',
      assignedRooms: ['205', '501', '312'],
      completedToday: 3,
      rating: 4.8,
      phone: '+62-813-4567-8901',
      specialization: 'VIP/Suite cleaning'
    },
    {
      id: 2,
      name: 'Sarah Johnson',
      role: 'Room Attendant',
      shift: 'Day (07:00-15:00)',
      status: 'busy',
      currentRoom: '312',
      assignedRooms: ['108', '312', '415'],
      completedToday: 2,
      rating: 4.6,
      phone: '+62-814-5678-9012',
      specialization: 'Deep cleaning'
    },
    {
      id: 3,
      name: 'Emma Wilson',
      role: 'Room Attendant',
      shift: 'Day (07:00-15:00)',
      status: 'available',
      currentRoom: null,
      assignedRooms: ['108', '220', '225'],
      completedToday: 4,
      rating: 4.7,
      phone: '+62-815-6789-0123',
      specialization: 'Standard rooms'
    },
    {
      id: 4,
      name: 'David Park',
      role: 'Room Attendant',
      shift: 'Day (07:00-15:00)',
      status: 'available',
      currentRoom: null,
      assignedRooms: ['220', '330', '405'],
      completedToday: 2,
      rating: 4.5,
      phone: '+62-816-7890-1234',
      specialization: 'Maintenance cleaning'
    },
    {
      id: 5,
      name: 'Lisa Chen',
      role: 'Room Attendant',
      shift: 'Evening (15:00-23:00)',
      status: 'off_duty',
      currentRoom: null,
      assignedRooms: ['415', '420', '425'],
      completedToday: 3,
      rating: 4.9,
      phone: '+62-817-8901-2345',
      specialization: 'Turnover cleaning'
    }
  ];

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Darurat';
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return priority;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Dalam Proses';
      case 'pending': return 'Menunggu';
      case 'overdue': return 'Terlambat';
      default: return status;
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'checkout_cleaning': return <RefreshCw className="h-4 w-4" />;
      case 'daily_cleaning': return <Sparkles className="h-4 w-4" />;
      case 'maintenance_cleaning': return <Settings className="h-4 w-4" />;
      case 'vip_cleaning': return <Star className="h-4 w-4" />;
      default: return <Bed className="h-4 w-4" />;
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'checkout_cleaning': return 'bg-blue-100 text-blue-800';
      case 'daily_cleaning': return 'bg-green-100 text-green-800';
      case 'maintenance_cleaning': return 'bg-orange-100 text-orange-800';
      case 'vip_cleaning': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaskTypeLabel = (type: string) => {
    switch (type) {
      case 'checkout_cleaning': return 'Checkout Cleaning';
      case 'daily_cleaning': return 'Daily Cleaning';
      case 'maintenance_cleaning': return 'Maintenance Cleaning';
      case 'vip_cleaning': return 'VIP Cleaning';
      default: return type;
    }
  };

  const getStaffStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-red-100 text-red-800';
      case 'off_duty': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStaffStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Tersedia';
      case 'busy': return 'Sibuk';
      case 'off_duty': return 'Off Duty';
      default: return status;
    }
  };

  const filteredTasks = housekeepingTasks.filter(task => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'pending' && task.status === 'pending') ||
                      (activeTab === 'in_progress' && task.status === 'in_progress') ||
                      (activeTab === 'completed' && task.status === 'completed') ||
                      (activeTab === 'urgent' && task.priority === 'urgent');
    
    const matchesSearch = task.roomNumber.includes(searchQuery) ||
                         task.taskType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.assignedTo.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = selectedPriority === 'all' || task.priority === selectedPriority;
    const matchesRoom = selectedRoom === 'all' || task.roomNumber === selectedRoom;
    
    return matchesTab && matchesSearch && matchesPriority && matchesRoom;
  });

  const TabButton = ({ tabId, label, count }: { tabId: string; label: string; count?: number }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
        activeTab === tabId
          ? 'bg-[#005357] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          activeTab === tabId ? 'bg-white text-[#005357]' : 'bg-gray-200 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <SupportLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Housekeeping Management</h1>
          <p className="text-gray-600 mt-2">Kelola tugas housekeeping, pembersihan kamar, dan layanan tamu</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Pending Rooms</h3>
                  <p className="text-sm text-gray-100 mt-1">Menunggu dibersihkan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Clock className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{housekeepingStats.pendingRooms}</div>
                <div className="text-sm text-gray-600">kamar</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">In Progress</h3>
                  <p className="text-sm text-gray-100 mt-1">Sedang dikerjakan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <RefreshCw className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{housekeepingStats.cleaningInProgress}</div>
                <div className="text-sm text-gray-600">kamar</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Completed Today</h3>
                  <p className="text-sm text-gray-100 mt-1">Selesai hari ini</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{housekeepingStats.completedToday}</div>
                <div className="text-sm text-gray-600">kamar</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Staff On Duty</h3>
                  <p className="text-sm text-gray-100 mt-1">Tim housekeeping</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{housekeepingStats.staffOnDuty}</div>
                <div className="text-sm text-gray-600">staff</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Housekeeping Tasks</h3>
                <p className="text-sm text-gray-100 mt-1">Kelola semua tugas pembersihan dan perawatan kamar</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="bg-white text-[#005357] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>New Task</span>
                </button>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Bed className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1">
              <TabButton tabId="pending" label="Pending" count={housekeepingStats.pendingRooms} />
              <TabButton tabId="in_progress" label="In Progress" count={housekeepingStats.cleaningInProgress} />
              <TabButton tabId="completed" label="Completed" count={housekeepingStats.completedToday} />
              <TabButton tabId="urgent" label="Urgent" />
              <TabButton tabId="all" label="All" />
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari kamar, task, atau staff..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357] focus:border-[#005357] w-64"
                  />
                </div>
                <select 
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                >
                  <option value="all">Semua Prioritas</option>
                  <option value="urgent">Darurat</option>
                  <option value="high">Tinggi</option>
                  <option value="medium">Sedang</option>
                  <option value="low">Rendah</option>
                </select>
              </div>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
              {filteredTasks.map((task) => (
                <div key={task.id} className="bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl font-bold text-[#005357]">#{task.roomNumber}</span>
                        <span className="text-sm bg-gray-100 px-2 py-1 text-gray-600">{task.roomType}</span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${getTaskTypeColor(task.taskType)}`}>
                          {getTaskTypeIcon(task.taskType)}
                          <span className="ml-1">{getTaskTypeLabel(task.taskType)}</span>
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {getPriorityLabel(task.priority)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(task.status)}`}>
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Assigned to:</span>
                          <div className="font-medium text-gray-900">{task.assignedTo}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Estimated time:</span>
                          <div className="font-medium text-gray-900">{task.estimatedTime}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <div className="font-medium text-gray-900">{formatDate(task.createdAt)}</div>
                        </div>
                        {task.completedAt && (
                          <div>
                            <span className="text-gray-600">Completed:</span>
                            <div className="font-medium text-green-600">{formatDate(task.completedAt)}</div>
                          </div>
                        )}
                      </div>

                      {task.guestCheckout && (
                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <span className="text-gray-600">Guest checkout:</span>
                            <div className="font-medium text-gray-900">{formatTime(task.guestCheckout)}</div>
                          </div>
                          {task.nextCheckIn && (
                            <div>
                              <span className="text-gray-600">Next check-in:</span>
                              <div className="font-medium text-orange-600">{formatTime(task.nextCheckIn)}</div>
                            </div>
                          )}
                        </div>
                      )}

                      {task.specialRequests.length > 0 && (
                        <div className="mb-4">
                          <span className="text-sm text-gray-600">Special requests:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {task.specialRequests.map((request, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 text-xs">
                                {request}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {task.amenitiesNeeded.length > 0 && (
                        <div className="mb-4">
                          <span className="text-sm text-gray-600">Amenities needed:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {task.amenitiesNeeded.map((item, index) => (
                              <span key={index} className="bg-green-100 text-green-800 px-2 py-1 text-xs">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {task.issues.length > 0 && (
                        <div className="mb-4">
                          <span className="text-sm text-gray-600">Issues reported:</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                            {task.issues.map((issue, index) => (
                              <span key={index} className="bg-red-100 text-red-800 px-2 py-1 text-xs">
                                {issue}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {task.notes && (
                        <div className="bg-gray-50 p-3 mb-3">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {task.notes}
                          </p>
                        </div>
                      )}

                      {task.guestRating && (
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-600">Guest rating:</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < task.guestRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                            <span className="text-gray-900 font-medium">({task.guestRating}/5)</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button className="p-2 text-gray-400 hover:text-[#005357] hover:bg-gray-100 transition-colors rounded">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded">
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Staff Status */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Housekeeping Staff</h3>
                <p className="text-sm text-gray-100 mt-1">Status dan performa tim housekeeping</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <Users className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {housekeepingStaff.map((staff) => (
                <div key={staff.id} className="bg-white p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-[#005357] flex items-center justify-center text-white font-bold">
                      {staff.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{staff.name}</h4>
                      <p className="text-sm text-gray-600">{staff.role}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shift:</span>
                      <span className="text-gray-900">{staff.shift}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium ${getStaffStatusColor(staff.status)}`}>
                        {getStaffStatusLabel(staff.status)}
                      </span>
                    </div>
                    {staff.currentRoom && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current room:</span>
                        <span className="text-[#005357] font-medium">#{staff.currentRoom}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Assigned rooms:</span>
                      <span className="text-gray-900">{staff.assignedRooms.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed today:</span>
                      <span className="text-gray-900">{staff.completedToday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Rating:</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span className="text-gray-900">{staff.rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Specialization:</span>
                      <span className="text-gray-900 text-xs">{staff.specialization}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <button className="flex-1 bg-[#005357] text-white px-3 py-2 text-sm font-medium hover:bg-[#004347] transition-colors">
                      Assign Room
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors rounded">
                      <Phone className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded">
                      <Mail className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SupportLayout>
  );
}