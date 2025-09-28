'use client';

import { useState } from 'react';
import SupportLayout from '@/components/SupportLayout';
import { 
  Wrench, 
  Bed, 
  Package, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Users,
  TrendingUp,
  Calendar,
  MessageSquare,
  Star,
  ArrowRight,
  Plus,
  Filter,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Timer
} from 'lucide-react';

export default function SupportDashboard() {
  const [selectedFilter, setSelectedFilter] = useState('all');

  // Sample support data
  const supportStats = {
    activeMaintenance: 3,
    pendingHousekeeping: 7,
    amenitiesRequests: 2,
    emergencyAlerts: 0,
    completedToday: 12,
    averageResponseTime: 15, // minutes
    teamMembers: 18,
    satisfaction: 4.6
  };

  const recentRequests = [
    {
      id: 'MNT-001',
      type: 'maintenance',
      title: 'AC Unit Not Working',
      location: 'Room 205',
      priority: 'high',
      status: 'in_progress',
      assignedTo: 'Ahmad Rahman',
      createdAt: '2024-08-28 08:30',
      estimatedTime: '2 hours',
      description: 'AC unit in room 205 is not cooling properly'
    },
    {
      id: 'HSK-012',
      type: 'housekeeping',
      title: 'Deep Cleaning Required',
      location: 'Suite 501',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'Maria Santos',
      createdAt: '2024-08-28 09:15',
      estimatedTime: '3 hours',
      description: 'Guest requested deep cleaning after checkout'
    },
    {
      id: 'AMN-005',
      type: 'amenities',
      title: 'Extra Towels Request',
      location: 'Room 312',
      priority: 'low',
      status: 'completed',
      assignedTo: 'Sarah Johnson',
      createdAt: '2024-08-28 10:00',
      estimatedTime: '30 minutes',
      description: 'Guest requested additional bath towels'
    },
    {
      id: 'MNT-002',
      type: 'maintenance',
      title: 'Leaking Faucet',
      location: 'Room 108',
      priority: 'medium',
      status: 'pending',
      assignedTo: 'David Chen',
      createdAt: '2024-08-28 07:45',
      estimatedTime: '1 hour',
      description: 'Bathroom faucet is dripping continuously'
    },
    {
      id: 'EMR-001',
      type: 'emergency',
      title: 'Power Outage',
      location: 'Floor 3',
      priority: 'urgent',
      status: 'completed',
      assignedTo: 'Emergency Team',
      createdAt: '2024-08-27 22:30',
      estimatedTime: '4 hours',
      description: 'Power outage affecting entire floor 3'
    }
  ];

  const teamMembers = [
    {
      id: 1,
      name: 'Ahmad Rahman',
      role: 'Maintenance Lead',
      department: 'Maintenance',
      status: 'available',
      activeJobs: 2,
      phone: '+62-812-3456-7890',
      location: 'Floor 2'
    },
    {
      id: 2,
      name: 'Maria Santos',
      role: 'Housekeeping Supervisor',
      department: 'Housekeeping',
      status: 'busy',
      activeJobs: 3,
      phone: '+62-813-4567-8901',
      location: 'Floor 5'
    },
    {
      id: 3,
      name: 'Sarah Johnson',
      role: 'Room Attendant',
      department: 'Housekeeping',
      status: 'available',
      activeJobs: 1,
      phone: '+62-814-5678-9012',
      location: 'Floor 3'
    },
    {
      id: 4,
      name: 'David Chen',
      role: 'Technician',
      department: 'Maintenance',
      status: 'on_break',
      activeJobs: 0,
      phone: '+62-815-6789-0123',
      location: 'Workshop'
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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'maintenance': return <Wrench className="h-4 w-4" />;
      case 'housekeeping': return <Bed className="h-4 w-4" />;
      case 'amenities': return <Package className="h-4 w-4" />;
      case 'emergency': return <AlertTriangle className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      case 'housekeeping': return 'bg-purple-100 text-purple-800';
      case 'amenities': return 'bg-green-100 text-green-800';
      case 'emergency': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTeamStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'busy': return 'bg-red-100 text-red-800';
      case 'on_break': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTeamStatusLabel = (status: string) => {
    switch (status) {
      case 'available': return 'Tersedia';
      case 'busy': return 'Sibuk';
      case 'on_break': return 'Istirahat';
      default: return status;
    }
  };

  return (
    <SupportLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Support Dashboard</h1>
          <p className="text-gray-600 mt-2">Manajemen maintenance, housekeeping, dan permintaan amenities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Active Maintenance</h3>
                  <p className="text-sm text-gray-100 mt-1">Sedang dikerjakan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Wrench className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{supportStats.activeMaintenance}</div>
                <div className="text-sm text-gray-600">tugas aktif</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Housekeeping</h3>
                  <p className="text-sm text-gray-100 mt-1">Tugas pending</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Bed className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{supportStats.pendingHousekeeping}</div>
                <div className="text-sm text-gray-600">tugas menunggu</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Amenities Request</h3>
                  <p className="text-sm text-gray-100 mt-1">Permintaan baru</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Package className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{supportStats.amenitiesRequests}</div>
                <div className="text-sm text-gray-600">permintaan</div>
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
                <div className="text-3xl font-bold text-green-600">{supportStats.completedToday}</div>
                <div className="text-sm text-gray-600">tugas selesai</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Requests */}
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Recent Requests</h3>
                  <p className="text-sm text-gray-100 mt-1">Permintaan terbaru dari semua departemen</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="bg-[#005357] text-white px-3 py-2 text-sm font-medium hover:bg-[#004347] transition-colors flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>New Request</span>
                  </button>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-[#005357]" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50">
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentRequests.map((request) => (
                  <div key={request.id} className="bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${getTypeColor(request.type)}`}>
                            {getTypeIcon(request.type)}
                            <span className="ml-1">{request.id}</span>
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium ${getPriorityColor(request.priority)}`}>
                            {getPriorityLabel(request.priority)}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(request.status)}`}>
                            {getStatusLabel(request.status)}
                          </span>
                        </div>
                        <h4 className="font-semibold text-gray-900">{request.title}</h4>
                        <p className="text-sm text-gray-100 mt-1">{request.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>{request.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{request.assignedTo}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Timer className="h-3 w-3" />
                            <span>{request.estimatedTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <button className="p-1 text-gray-400 hover:text-[#005357] hover:bg-gray-100 transition-colors rounded">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded">
                          <Edit className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Team Status */}
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Team Status</h3>
                  <p className="text-sm text-gray-100 mt-1">Status real-time tim support</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50">
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-[#005357] flex items-center justify-center text-white font-bold">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.role}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium ${getTeamStatusColor(member.status)}`}>
                              {getTeamStatusLabel(member.status)}
                            </span>
                            <span className="text-xs text-gray-500">{member.activeJobs} active jobs</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{member.location}</div>
                        <div className="flex items-center space-x-2 mt-2">
                          <button className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors rounded">
                            <Phone className="h-4 w-4" />
                          </button>
                          <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded">
                            <Mail className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Quick Actions</h3>
                <p className="text-sm text-gray-100 mt-1">Aksi cepat untuk tugas support umum</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 bg-white hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                    <Wrench className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Create Maintenance Request</h3>
                    <p className="text-sm text-gray-600">Buat permintaan maintenance baru</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-white hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 flex items-center justify-center">
                    <Bed className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Schedule Housekeeping</h3>
                    <p className="text-sm text-gray-600">Jadwalkan tugas housekeeping</p>
                  </div>
                </div>
              </button>

              <button className="p-4 bg-white hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 flex items-center justify-center">
                    <Package className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Request Amenities</h3>
                    <p className="text-sm text-gray-600">Permintaan amenities untuk tamu</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </SupportLayout>
  );
}