'use client';

import { useState } from 'react';
import SupportLayout from '@/components/SupportLayout';
import { 
  Package, 
  Plus,
  Search,
  Clock,
  CheckCircle,
  User,
  MapPin,
  Calendar,
  Eye,
  Edit,
  MoreHorizontal,
  Coffee,
  Utensils,
  Shirt,
  Wine,
  Flower,
  Bed,
  ShowerHead,
  Wifi,
  Car,
  Phone,
  Mail,
  Timer,
  AlertTriangle,
  Star
} from 'lucide-react';

export default function AmenitiesPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

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
      guestName: 'Liu Wei',
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
      guestName: 'Maria Santos',
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
      icon: Coffee,
      items: ['Welcome Basket', 'Room Service', 'Mini Bar', 'Special Dietary'],
      stockLevel: 95,
      dailyRequests: 8
    },
    {
      id: 'toiletries',
      name: 'Toiletries & Bath',
      icon: ShowerHead,
      items: ['Premium Toiletries', 'Extra Towels', 'Bath Robes', 'Slippers'],
      stockLevel: 78,
      dailyRequests: 12
    },
    {
      id: 'beverage',
      name: 'Beverages',
      icon: Wine,
      items: ['Champagne', 'Wine Selection', 'Coffee/Tea', 'Soft Drinks'],
      stockLevel: 85,
      dailyRequests: 6
    },
    {
      id: 'laundry',
      name: 'Laundry & Cleaning',
      icon: Shirt,
      items: ['Express Laundry', 'Dry Cleaning', 'Shoe Shine', 'Pressing'],
      stockLevel: 100,
      dailyRequests: 4
    },
    {
      id: 'technology',
      name: 'Technology',
      icon: Wifi,
      items: ['WiFi Support', 'Charging Cables', 'Adapters', 'Tech Setup'],
      stockLevel: 92,
      dailyRequests: 3
    },
    {
      id: 'flowers',
      name: 'Flowers & Decor',
      icon: Flower,
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
    return cat ? cat.icon : Package;
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
          <h1 className="text-3xl font-bold text-gray-900">Amenities Management</h1>
          <p className="text-gray-600 mt-2">Kelola permintaan amenities, layanan tamu, dan inventaris</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Pending Requests</h3>
                  <p className="text-sm text-gray-100 mt-1">Menunggu diproses</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Clock className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{amenitiesStats.pendingRequests}</div>
                <div className="text-sm text-gray-600">permintaan</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">In Progress</h3>
                  <p className="text-sm text-gray-100 mt-1">Sedang diproses</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Timer className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{amenitiesStats.inProgress}</div>
                <div className="text-sm text-gray-600">sedang diproses</div>
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
                <div className="text-3xl font-bold text-green-600">{amenitiesStats.completedToday}</div>
                <div className="text-sm text-gray-600">permintaan selesai</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Urgent Requests</h3>
                  <p className="text-sm text-gray-100 mt-1">Prioritas tinggi</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{amenitiesStats.urgentRequests}</div>
                <div className="text-sm text-gray-600">mendesak</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Amenities Requests</h3>
                <p className="text-sm text-gray-100 mt-1">Kelola semua permintaan amenities dan layanan tamu</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="bg-white text-[#005357] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>New Request</span>
                </button>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Package className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1">
              <TabButton tabId="pending" label="Pending" count={amenitiesStats.pendingRequests} />
              <TabButton tabId="in_progress" label="In Progress" count={amenitiesStats.inProgress} />
              <TabButton tabId="completed" label="Completed" count={amenitiesStats.completedToday} />
              <TabButton tabId="urgent" label="Urgent" count={amenitiesStats.urgentRequests} />
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
                    placeholder="Cari tamu, kamar, atau item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357] focus:border-[#005357] w-64"
                  />
                </div>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                >
                  <option value="all">Semua Kategori</option>
                  {amenityCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Requests List */}
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <div key={request.id} className="bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 text-gray-800">
                          {request.id}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${getCategoryColor(request.category)}`}>
                          {(() => {
                            const IconComponent = getCategoryIcon(request.category);
                            return <IconComponent className="h-4 w-4 mr-1" />;
                          })()}
                          {getCategoryName(request.category)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {getPriorityLabel(request.priority)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusLabel(request.status)}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-lg text-gray-900 mb-2">{request.item}</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Guest:</span>
                          <div className="font-medium text-gray-900">{request.guestName}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Room:</span>
                          <div className="font-medium text-[#005357]">#{request.roomNumber}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Quantity:</span>
                          <div className="font-medium text-gray-900">{request.quantity}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Delivery:</span>
                          <div className="font-medium text-gray-900">{request.deliveryTime}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Requested:</span>
                          <div className="font-medium text-gray-900">{formatDate(request.requestedAt)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Assigned to:</span>
                          <div className="font-medium text-gray-900">{request.assignedTo}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Cost:</span>
                          <div className="font-medium text-gray-900">
                            {request.estimatedCost > 0 ? formatCurrency(request.estimatedCost) : 'Complimentary'}
                          </div>
                        </div>
                        {request.deliveredAt && (
                          <div>
                            <span className="text-gray-600">Delivered:</span>
                            <div className="font-medium text-green-600">{formatDate(request.deliveredAt)}</div>
                          </div>
                        )}
                      </div>

                      {request.specialInstructions && (
                        <div className="bg-blue-50 p-3 mb-3">
                          <p className="text-sm text-blue-800">
                            <span className="font-medium">Special Instructions:</span> {request.specialInstructions}
                          </p>
                        </div>
                      )}

                      {request.notes && (
                        <div className="bg-gray-50 p-3 mb-3">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {request.notes}
                          </p>
                        </div>
                      )}

                      {request.guestRating && (
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-gray-600">Guest rating:</span>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < request.guestRating! ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                            <span className="text-gray-900 font-medium">({request.guestRating}/5)</span>
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

        {/* Categories & Stock */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Amenities Categories & Stock</h3>
                <p className="text-sm text-gray-100 mt-1">Kategori amenities dan status inventaris</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <Package className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {amenityCategories.map((category) => (
                <div key={category.id} className="bg-white p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-[#005357] flex items-center justify-center">
                      <category.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{category.name}</h4>
                      <p className="text-sm text-gray-600">{category.items.length} item types</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Stock Level:</span>
                      <span className={`px-2 py-1 text-xs font-medium ${getStockColor(category.stockLevel)}`}>
                        {category.stockLevel}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 h-2">
                      <div 
                        className="bg-[#005357] h-2" 
                        style={{ width: `${category.stockLevel}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Daily requests:</span>
                      <span className="text-gray-900 font-medium">{category.dailyRequests}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 font-medium">Available Items:</p>
                    {category.items.map((item, index) => (
                      <div key={index} className="text-xs bg-gray-100 px-2 py-1 text-gray-700">
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Service Staff */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Service Staff</h3>
                <p className="text-sm text-gray-100 mt-1">Tim layanan amenities dan guest services</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <User className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {serviceStaff.map((staff) => (
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
                      <span className="text-gray-600">Department:</span>
                      <span className="text-gray-900">{staff.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium ${
                        staff.status === 'busy' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {staff.status === 'busy' ? 'Sibuk' : 'Tersedia'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Requests:</span>
                      <span className="text-gray-900">{staff.activeRequests}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Today:</span>
                      <span className="text-gray-900">{staff.completedToday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Specialization:</span>
                      <span className="text-gray-900 text-xs">{staff.specialization}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <button className="flex-1 bg-[#005357] text-white px-3 py-2 text-sm font-medium hover:bg-[#004347] transition-colors">
                      Assign Request
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