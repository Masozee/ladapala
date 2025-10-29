'use client';

import { useState } from 'react';
import SupportLayout from '@/components/SupportLayout';
import {
  PackageIcon,
  Add01Icon,
  Search02Icon,
  Clock01Icon,
  UserCheckIcon,
  UserIcon,
  Location01Icon,
  Calendar01Icon,
  EyeIcon,
  PencilEdit02Icon,
  MoreHorizontalIcon,
  SparklesIcon,
  BedIcon,
  Call02Icon,
  Mail01Icon,
  AlertCircleIcon,
  Alert01Icon
} from '@/lib/icons';

export default function AmenitiesPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Sample amenities data
  const amenitiesStats = {
    pendingRequests: 8,
    inProgress: 3,
    completedToday: 12,
    urgentRequests: 2,
    totalStock: 156,
    lowStock: 5
  };

  const amenityRequests = [
    {
      id: 'AMN-001',
      guestName: 'Maria Santos',
      roomNumber: '205',
      category: 'food_beverage',
      item: 'Welcome Fruit Basket',
      quantity: 1,
      priority: 'high',
      status: 'pending',
      requestedAt: '2024-08-28 14:30',
      deliveryTime: 'ASAP',
      specialInstructions: 'VIP guest - premium selection preferred',
      assignedTo: 'Room Service',
      estimatedCost: 150000,
      notes: 'Guest has dietary restrictions - no citrus fruits',
      deliveredAt: null,
      guestRating: null
    },
    {
      id: 'AMN-002',
      guestName: 'Liu Wei',
      roomNumber: '312',
      category: 'toiletries',
      item: 'Extra Towels & Toiletries Set',
      quantity: 2,
      priority: 'medium',
      status: 'in_progress',
      requestedAt: '2024-08-28 13:15',
      deliveryTime: '15:00',
      specialInstructions: 'Premium brand toiletries requested',
      assignedTo: 'Housekeeping',
      estimatedCost: 75000,
      notes: 'Guest extending stay - needs full amenities refresh',
      deliveredAt: null,
      guestRating: null
    },
    {
      id: 'AMN-003',
      guestName: 'Ahmed Hassan',
      roomNumber: '108',
      category: 'beverage',
      item: 'Champagne & Glasses',
      quantity: 1,
      priority: 'urgent',
      status: 'pending',
      requestedAt: '2024-08-28 15:00',
      deliveryTime: '16:00',
      specialInstructions: 'Anniversary celebration - include card',
      assignedTo: 'Room Service',
      estimatedCost: 250000,
      notes: 'Wedding anniversary - special presentation requested',
      deliveredAt: null,
      guestRating: null
    },
    {
      id: 'AMN-004',
      guestName: 'Emma Wilson',
      roomNumber: '501',
      category: 'laundry',
      item: 'Express Laundry Service',
      quantity: 1,
      priority: 'high',
      status: 'completed',
      requestedAt: '2024-08-28 10:00',
      deliveryTime: '14:00',
      specialInstructions: 'Dry cleaning for business attire',
      assignedTo: 'Laundry Service',
      estimatedCost: 125000,
      notes: 'Important business meeting tomorrow',
      deliveredAt: '2024-08-28 13:45',
      guestRating: 5
    },
    {
      id: 'AMN-005',
      guestName: 'David Chen',
      roomNumber: '220',
      category: 'technology',
      item: 'WiFi Extender & Cable',
      quantity: 1,
      priority: 'medium',
      status: 'completed',
      requestedAt: '2024-08-28 11:30',
      deliveryTime: '13:00',
      specialInstructions: 'Work setup - stable connection needed',
      assignedTo: 'IT Support',
      estimatedCost: 0,
      notes: 'Remote work requirements - technical support provided',
      deliveredAt: '2024-08-28 12:30',
      guestRating: 4
    },
    {
      id: 'AMN-006',
      guestName: 'Sarah Johnson',
      roomNumber: '415',
      category: 'flowers',
      item: 'Fresh Flower Arrangement',
      quantity: 1,
      priority: 'low',
      status: 'in_progress',
      requestedAt: '2024-08-28 12:00',
      deliveryTime: '17:00',
      specialInstructions: 'Romantic setup for surprise proposal',
      assignedTo: 'Concierge',
      estimatedCost: 200000,
      notes: 'Top secret - coordinate with guest for timing',
      deliveredAt: null,
      guestRating: null
    }
  ];

  const amenityCategories = [
    {
      id: 'food_beverage',
      name: 'Food & Beverage',
      icon: PackageIcon,
      items: ['Welcome Basket', 'Room Service', 'Mini Bar', 'Special Dietary'],
      stockLevel: 95,
      dailyRequests: 8
    },
    {
      id: 'toiletries',
      name: 'Toiletries & Bath',
      icon: PackageIcon,
      items: ['Premium Toiletries', 'Extra Towels', 'Bath Robes', 'Slippers'],
      stockLevel: 78,
      dailyRequests: 12
    },
    {
      id: 'beverage',
      name: 'Beverages',
      icon: PackageIcon,
      items: ['Champagne', 'Wine Selection', 'Coffee/Tea', 'Soft Drinks'],
      stockLevel: 85,
      dailyRequests: 6
    },
    {
      id: 'laundry',
      name: 'Laundry & Cleaning',
      icon: PackageIcon,
      items: ['Express Laundry', 'Dry Cleaning', 'Shoe Shine', 'Pressing'],
      stockLevel: 100,
      dailyRequests: 4
    },
    {
      id: 'technology',
      name: 'Technology',
      icon: PackageIcon,
      items: ['WiFi Support', 'Charging Cables', 'Adapters', 'Tech Setup'],
      stockLevel: 92,
      dailyRequests: 3
    },
    {
      id: 'flowers',
      name: 'Flowers & Decor',
      icon: SparklesIcon,
      items: ['Flower Arrangements', 'Special Occasions', 'Room Decoration'],
      stockLevel: 65,
      dailyRequests: 2
    }
  ];

  const serviceStaff = [
    {
      id: 1,
      name: 'Lisa Martinez',
      role: 'Concierge Manager',
      department: 'Guest Services',
      status: 'available',
      activeRequests: 2,
      completedToday: 5,
      specialization: 'VIP Services',
      phone: '+62-818-9012-3456'
    },
    {
      id: 2,
      name: 'James Wilson',
      role: 'Room Service Coordinator',
      department: 'F&B',
      status: 'busy',
      activeRequests: 4,
      completedToday: 8,
      specialization: 'Food & Beverage',
      phone: '+62-819-0123-4567'
    },
    {
      id: 3,
      name: 'Anna Kim',
      role: 'Guest Relations',
      department: 'Front Office',
      status: 'available',
      activeRequests: 1,
      completedToday: 6,
      specialization: 'Special Requests',
      phone: '+62-820-1234-5678'
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
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
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Dalam Proses';
      case 'pending': return 'Menunggu';
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    const cat = amenityCategories.find(c => c.id === category);
    return cat ? cat.icon : PackageIcon;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food_beverage': return 'bg-orange-100 text-orange-800';
      case 'toiletries': return 'bg-blue-100 text-blue-800';
      case 'beverage': return 'bg-purple-100 text-purple-800';
      case 'laundry': return 'bg-cyan-100 text-cyan-800';
      case 'technology': return 'bg-green-100 text-green-800';
      case 'flowers': return 'bg-pink-100 text-pink-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryName = (category: string) => {
    const cat = amenityCategories.find(c => c.id === category);
    return cat ? cat.name : category;
  };

  const getStockColor = (level: number) => {
    if (level >= 80) return 'bg-green-100 text-green-800';
    if (level >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  // Calculate dynamic counts for tabs
  const pendingCount = amenityRequests.filter(r => r.status === 'pending').length;
  const inProgressCount = amenityRequests.filter(r => r.status === 'in_progress').length;
  const completedCount = amenityRequests.filter(r => r.status === 'completed').length;
  const urgentCount = amenityRequests.filter(r => r.priority === 'urgent').length;
  const allCount = amenityRequests.length;

  const filteredRequests = amenityRequests.filter(request => {
    const matchesTab = activeTab === 'all' ||
                      (activeTab === 'pending' && request.status === 'pending') ||
                      (activeTab === 'in_progress' && request.status === 'in_progress') ||
                      (activeTab === 'completed' && request.status === 'completed') ||
                      (activeTab === 'urgent' && request.priority === 'urgent');

    const matchesSearch = request.guestName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.roomNumber.includes(searchQuery) ||
                         request.item.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || request.category === selectedCategory;

    return matchesTab && matchesSearch && matchesCategory;
  });

  const TabButton = ({ tabId, label, count }: { tabId: string; label: string; count?: number }) => (
    <button
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition-colors ${
        activeTab === tabId
          ? 'bg-[#F87B1B] text-white'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className={`px-2 py-0.5 text-xs rounded-full ${
          activeTab === tabId ? 'bg-white text-[#F87B1B]' : 'bg-gray-200 text-gray-600'
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
          <h1 className="text-3xl font-bold text-gray-900">Amenities Management</h1>
          <p className="text-gray-600 mt-2">Kelola permintaan amenities, layanan tamu, dan inventaris</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-100 rounded">
                <Clock01Icon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{amenitiesStats.pendingRequests}</div>
            <div className="text-base font-semibold text-gray-900">Pending Requests</div>
            <div className="text-sm text-gray-600 mt-1">Menunggu diproses</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded">
                <Clock01Icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{amenitiesStats.inProgress}</div>
            <div className="text-base font-semibold text-gray-900">In Progress</div>
            <div className="text-sm text-gray-600 mt-1">Sedang diproses</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded">
                <UserCheckIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{amenitiesStats.completedToday}</div>
            <div className="text-base font-semibold text-gray-900">Completed Today</div>
            <div className="text-sm text-gray-600 mt-1">Selesai hari ini</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded">
                <Alert01Icon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{amenitiesStats.urgentRequests}</div>
            <div className="text-base font-semibold text-gray-900">Urgent Requests</div>
            <div className="text-sm text-gray-600 mt-1">Prioritas tinggi</div>
          </div>
        </div>


        {/* Amenities Requests Title */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Amenities Requests</h2>
            <p className="text-gray-600 mt-1">Kelola semua permintaan amenities dan layanan tamu</p>
          </div>
          <button className="bg-[#F87B1B] text-white px-4 py-2 font-medium hover:bg-[#E06A0A] transition-colors flex items-center space-x-2">
            <Add01Icon className="h-4 w-4" />
            <span>New Request</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search02Icon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Cari tamu, kamar, atau item..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B] focus:border-[#F87B1B] w-full"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
          >
            <option value="all">Semua Kategori</option>
            {amenityCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <div className="flex space-x-1 bg-gray-100 p-1">
            <TabButton tabId="pending" label="Pending" count={pendingCount} />
            <TabButton tabId="in_progress" label="In Progress" count={inProgressCount} />
            <TabButton tabId="completed" label="Completed" count={completedCount} />
            <TabButton tabId="urgent" label="Urgent" count={urgentCount} />
            <TabButton tabId="all" label="All" count={allCount} />
          </div>
        </div>

        {/* Requests Table */}
        <table className="w-full border-collapse bg-white border border-gray-200">
          <thead>
            <tr className="bg-[#F87B1B] text-white">
              <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">ID</th>
              <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Guest</th>
              <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Room</th>
              <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Item</th>
              <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Category</th>
              <th className="border border-gray-200 px-6 py-4 text-center text-sm font-medium">Qty</th>
              <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Priority</th>
              <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Status</th>
              <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Delivery</th>
              <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Assigned</th>
              <th className="border border-gray-200 px-6 py-4 text-center text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.map((request) => (
              <tr key={request.id} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-6 py-4 text-sm font-medium text-gray-900">{request.id}</td>
                <td className="border border-gray-200 px-6 py-4 text-sm text-gray-900">{request.guestName}</td>
                <td className="border border-gray-200 px-6 py-4 text-sm font-semibold text-[#F87B1B]">#{request.roomNumber}</td>
                <td className="border border-gray-200 px-6 py-4 text-sm text-gray-900">
                  <div className="whitespace-normal break-words">{request.item}</div>
                </td>
                <td className="border border-gray-200 px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getCategoryColor(request.category)}`}>
                    {getCategoryName(request.category)}
                  </span>
                </td>
                <td className="border border-gray-200 px-6 py-4 text-sm text-center font-medium text-gray-900">100</td>
                <td className="border border-gray-200 px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPriorityColor(request.priority)}`}>
                    {getPriorityLabel(request.priority)}
                  </span>
                </td>
                <td className="border border-gray-200 px-6 py-4">
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(request.status)}`}>
                    {getStatusLabel(request.status)}
                  </span>
                </td>
                <td className="border border-gray-200 px-6 py-4 text-sm text-gray-900">{request.deliveryTime}</td>
                <td className="border border-gray-200 px-6 py-4 text-sm text-gray-900">{request.assignedTo}</td>
                <td className="border border-gray-200 px-6 py-4 text-center">
                  <div className="flex items-center justify-center relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === request.id ? null : request.id)}
                      className="p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    >
                      <MoreHorizontalIcon className="h-4 w-4 text-gray-600" />
                    </button>
                    {openMenuId === request.id && (
                      <div className="absolute right-0 top-12 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-10 rounded">
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2">
                          <EyeIcon className="h-4 w-4" />
                          <span>View Details</span>
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2">
                          <PencilEdit02Icon className="h-4 w-4" />
                          <span>Edit Request</span>
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2">
                          <UserCheckIcon className="h-4 w-4" />
                          <span>Mark Complete</span>
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2 border-t border-gray-200">
                          <AlertCircleIcon className="h-4 w-4" />
                          <span>Cancel Request</span>
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={11} className="text-center py-8 text-gray-600">
                  No requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </SupportLayout>
  );
}