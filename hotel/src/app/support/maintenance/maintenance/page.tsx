'use client';

import { useState } from 'react';
import SupportLayout from '@/components/SupportLayout';
import { 
  Wrench, 
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
  Settings,
  Zap,
  Droplets,
  Wind,
  Thermometer,
  Lightbulb,
  Wifi,
  Lock,
  Camera,
  MoreHorizontal
} from 'lucide-react';

export default function MaintenancePage() {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Sample maintenance data
  const maintenanceStats = {
    activeRequests: 8,
    pendingRequests: 12,
    completedToday: 5,
    averageResponseTime: 45, // minutes
    urgentRequests: 3,
    overdueRequests: 2
  };

  const maintenanceRequests = [
    {
      id: 'MNT-001',
      title: 'AC Unit Not Working',
      description: 'Air conditioning system in room 205 is not cooling properly. Temperature remains at 28°C despite being set to 22°C.',
      location: 'Room 205',
      category: 'HVAC',
      priority: 'high',
      status: 'in_progress',
      reportedBy: 'Front Desk',
      assignedTo: 'Ahmad Rahman',
      createdAt: '2024-08-28 08:30',
      estimatedCompletion: '2024-08-28 14:30',
      estimatedTime: '6 hours',
      actualTime: '4 hours',
      notes: 'Refrigerant leak detected. Parts ordered.',
      images: 2,
      guestComplaint: true
    },
    {
      id: 'MNT-002',
      title: 'Leaking Faucet',
      description: 'Bathroom faucet in room 108 is dripping continuously. Approximately 1 drop per second.',
      location: 'Room 108',
      category: 'Plumbing',
      priority: 'medium',
      status: 'pending',
      reportedBy: 'Housekeeping',
      assignedTo: 'David Chen',
      createdAt: '2024-08-28 07:45',
      estimatedCompletion: '2024-08-28 12:00',
      estimatedTime: '2 hours',
      actualTime: null,
      notes: 'Cartridge replacement needed',
      images: 1,
      guestComplaint: false
    },
    {
      id: 'MNT-003',
      title: 'Elevator Button Malfunction',
      description: 'Floor 3 button in elevator B is not responding. Guests unable to access floor 3 via this elevator.',
      location: 'Elevator B',
      category: 'Electrical',
      priority: 'high',
      status: 'pending',
      reportedBy: 'Security',
      assignedTo: 'Ahmad Rahman',
      createdAt: '2024-08-28 09:15',
      estimatedCompletion: '2024-08-28 15:00',
      estimatedTime: '4 hours',
      actualTime: null,
      notes: 'Control panel inspection required',
      images: 0,
      guestComplaint: true
    },
    {
      id: 'MNT-004',
      title: 'WiFi Router Replacement',
      description: 'WiFi router on floor 5 is providing intermittent connection. Multiple guest complaints about slow internet.',
      location: 'Floor 5 - IT Closet',
      category: 'Network',
      priority: 'medium',
      status: 'completed',
      reportedBy: 'IT Support',
      assignedTo: 'Sarah Johnson',
      createdAt: '2024-08-27 16:30',
      estimatedCompletion: '2024-08-28 10:00',
      estimatedTime: '3 hours',
      actualTime: '2.5 hours',
      notes: 'Router replaced and tested. All connections stable.',
      images: 1,
      guestComplaint: true
    },
    {
      id: 'MNT-005',
      title: 'Lock Malfunction',
      description: 'Electronic door lock for room 312 is not responding to key cards. Manual key required for access.',
      location: 'Room 312',
      category: 'Security',
      priority: 'urgent',
      status: 'in_progress',
      reportedBy: 'Guest Services',
      assignedTo: 'Ahmad Rahman',
      createdAt: '2024-08-28 11:00',
      estimatedCompletion: '2024-08-28 13:00',
      estimatedTime: '2 hours',
      actualTime: '1.5 hours',
      notes: 'Battery replacement and recalibration in progress',
      images: 0,
      guestComplaint: true
    },
    {
      id: 'MNT-006',
      title: 'Light Fixture Replacement',
      description: 'Ceiling light in lobby area flickering and making buzzing sound. Needs immediate attention.',
      location: 'Main Lobby',
      category: 'Electrical',
      priority: 'low',
      status: 'completed',
      reportedBy: 'Management',
      assignedTo: 'David Chen',
      createdAt: '2024-08-27 14:20',
      estimatedCompletion: '2024-08-28 09:00',
      estimatedTime: '1 hour',
      actualTime: '45 minutes',
      notes: 'LED fixture installed successfully',
      images: 2,
      guestComplaint: false
    }
  ];

  const technicians = [
    {
      id: 1,
      name: 'Ahmad Rahman',
      role: 'Maintenance Lead',
      specialization: 'HVAC, Electrical',
      status: 'busy',
      currentJob: 'MNT-005',
      activeJobs: 2,
      completedToday: 1,
      phone: '+62-812-3456-7890',
      location: 'Room 312'
    },
    {
      id: 2,
      name: 'David Chen',
      role: 'Technician',
      specialization: 'Plumbing, General',
      status: 'available',
      currentJob: null,
      activeJobs: 1,
      completedToday: 2,
      phone: '+62-815-6789-0123',
      location: 'Workshop'
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      role: 'IT Technician',
      specialization: 'Network, Electronics',
      status: 'available',
      currentJob: null,
      activeJobs: 0,
      completedToday: 1,
      phone: '+62-814-5678-9012',
      location: 'IT Office'
    }
  ];

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
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Selesai';
      case 'in_progress': return 'Dalam Proses';
      case 'pending': return 'Menunggu';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'HVAC': return <Wind className="h-4 w-4" />;
      case 'Plumbing': return <Droplets className="h-4 w-4" />;
      case 'Electrical': return <Zap className="h-4 w-4" />;
      case 'Network': return <Wifi className="h-4 w-4" />;
      case 'Security': return <Lock className="h-4 w-4" />;
      case 'General': return <Settings className="h-4 w-4" />;
      default: return <Wrench className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'HVAC': return 'bg-blue-100 text-blue-800';
      case 'Plumbing': return 'bg-cyan-100 text-cyan-800';
      case 'Electrical': return 'bg-yellow-100 text-yellow-800';
      case 'Network': return 'bg-purple-100 text-purple-800';
      case 'Security': return 'bg-red-100 text-red-800';
      case 'General': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending': return <Timer className="h-4 w-4 text-yellow-600" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredRequests = maintenanceRequests.filter(request => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && (request.status === 'in_progress' || request.status === 'pending')) ||
                      (activeTab === 'completed' && request.status === 'completed') ||
                      (activeTab === 'urgent' && request.priority === 'urgent');
    
    const matchesSearch = request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = selectedPriority === 'all' || request.priority === selectedPriority;
    const matchesCategory = selectedCategory === 'all' || request.category === selectedCategory;
    
    return matchesTab && matchesSearch && matchesPriority && matchesCategory;
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
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Management</h1>
          <p className="text-gray-600 mt-2">Kelola permintaan maintenance, perbaikan, dan perawatan fasilitas hotel</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Active Requests</h3>
                  <p className="text-sm text-gray-100 mt-1">Sedang dikerjakan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Clock className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{maintenanceStats.activeRequests}</div>
                <div className="text-sm text-gray-600">permintaan aktif</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Pending</h3>
                  <p className="text-sm text-gray-100 mt-1">Menunggu dikerjakan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Timer className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{maintenanceStats.pendingRequests}</div>
                <div className="text-sm text-gray-600">permintaan pending</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Urgent</h3>
                  <p className="text-sm text-gray-100 mt-1">Prioritas tinggi</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{maintenanceStats.urgentRequests}</div>
                <div className="text-sm text-gray-600">darurat</div>
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
                <div className="text-3xl font-bold text-green-600">{maintenanceStats.completedToday}</div>
                <div className="text-sm text-gray-600">tugas selesai</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Maintenance Requests</h3>
                <p className="text-sm text-gray-100 mt-1">Kelola semua permintaan maintenance dan perbaikan</p>
              </div>
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-white text-[#005357] px-4 py-2 text-sm font-medium hover:bg-gray-100 transition-colors flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Request</span>
                </button>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1">
              <TabButton tabId="active" label="Active" count={maintenanceStats.activeRequests} />
              <TabButton tabId="pending" label="Pending" count={maintenanceStats.pendingRequests} />
              <TabButton tabId="urgent" label="Urgent" count={maintenanceStats.urgentRequests} />
              <TabButton tabId="completed" label="Completed" count={maintenanceStats.completedToday} />
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
                    placeholder="Cari maintenance request..."
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
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                >
                  <option value="all">Semua Kategori</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Network">Network</option>
                  <option value="Security">Security</option>
                  <option value="General">General</option>
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
                          {getCategoryIcon(request.category)}
                          <span className="ml-1">{request.category}</span>
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {getPriorityLabel(request.priority)}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${getStatusColor(request.status)}`}>
                          {getStatusIcon(request.status)}
                          <span className="ml-1">{getStatusLabel(request.status)}</span>
                        </span>
                        {request.guestComplaint && (
                          <span className="inline-flex px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800">
                            Guest Complaint
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-bold text-lg text-gray-900 mb-2">{request.title}</h4>
                      <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-500 mb-3">
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3" />
                          <span>{request.location}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{request.assignedTo}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(request.createdAt)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Timer className="h-3 w-3" />
                          <span>ETA: {request.estimatedTime}</span>
                        </div>
                      </div>

                      {request.notes && (
                        <div className="bg-gray-50 p-3 mb-3">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Notes:</span> {request.notes}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Reported by: {request.reportedBy}</span>
                        {request.images > 0 && (
                          <div className="flex items-center space-x-1">
                            <Camera className="h-3 w-3" />
                            <span>{request.images} foto</span>
                          </div>
                        )}
                      </div>
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

        {/* Technicians Status */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Technicians Status</h3>
                <p className="text-sm text-gray-100 mt-1">Status dan ketersediaan teknisi maintenance</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <User className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {technicians.map((tech) => (
                <div key={tech.id} className="bg-white p-4 shadow-sm">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-12 h-12 bg-[#005357] flex items-center justify-center text-white font-bold">
                      {tech.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{tech.name}</h4>
                      <p className="text-sm text-gray-600">{tech.role}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Specialization:</span>
                      <span className="text-gray-900">{tech.specialization}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 text-xs font-medium ${
                        tech.status === 'busy' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {tech.status === 'busy' ? 'Sibuk' : 'Tersedia'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Jobs:</span>
                      <span className="text-gray-900">{tech.activeJobs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completed Today:</span>
                      <span className="text-gray-900">{tech.completedToday}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="text-gray-900">{tech.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 mt-4">
                    <button className="flex-1 bg-[#005357] text-white px-3 py-2 text-sm font-medium hover:bg-[#004347] transition-colors">
                      Assign Job
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