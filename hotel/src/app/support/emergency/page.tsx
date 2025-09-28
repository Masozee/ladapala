'use client';

import { useState } from 'react';
import SupportLayout from '@/components/SupportLayout';
import { 
  AlertTriangle, 
  Plus,
  Search,
  Clock,
  CheckCircle,
  User,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Edit,
  MoreHorizontal,
  Siren,
  Flame,
  Droplets,
  Zap,
  Shield,
  Users,
  Activity,
  Bell,
  Radio,
  Timer,
  FileText,
  Download,
  RefreshCw
} from 'lucide-react';

export default function EmergencyPage() {
  const [activeTab, setActiveTab] = useState('active');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Sample emergency data
  const emergencyStats = {
    activeAlerts: 1,
    resolvedToday: 3,
    totalThisMonth: 12,
    averageResponseTime: 8, // minutes
    falseAlarms: 2,
    criticalAlerts: 0
  };

  const emergencyIncidents = [
    {
      id: 'EMR-001',
      type: 'fire',
      title: 'Smoke Detection - Kitchen Area',
      description: 'Smoke alarm activated in main kitchen - possible grease fire',
      severity: 'critical',
      status: 'resolved',
      location: 'Main Kitchen - Ground Floor',
      reportedBy: 'Fire Safety System',
      reportedAt: '2024-08-27 22:30',
      respondedAt: '2024-08-27 22:33',
      resolvedAt: '2024-08-27 23:15',
      assignedTeam: ['Fire Safety Team', 'Maintenance', 'Security'],
      responseTime: 3, // minutes
      evacuationRequired: false,
      authoritiesNotified: true,
      guestsAffected: 0,
      notes: 'False alarm - steam from dishwasher triggered sensor. System reset and tested.',
      actions: [
        { time: '22:30', action: 'Smoke alarm triggered', by: 'System' },
        { time: '22:31', action: 'Security team dispatched', by: 'Security Chief' },
        { time: '22:33', action: 'Kitchen staff evacuated area', by: 'Kitchen Manager' },
        { time: '22:35', action: 'Fire department notified', by: 'Security' },
        { time: '22:40', action: 'Source identified - dishwasher steam', by: 'Fire Safety' },
        { time: '23:15', action: 'All clear - system reset', by: 'Maintenance' }
      ]
    },
    {
      id: 'EMR-002',
      type: 'medical',
      title: 'Guest Medical Emergency - Room 312',
      description: 'Guest experiencing chest pains - ambulance requested',
      severity: 'high',
      status: 'resolved',
      location: 'Room 312 - 3rd Floor',
      reportedBy: 'Guest Services',
      reportedAt: '2024-08-28 14:20',
      respondedAt: '2024-08-28 14:22',
      resolvedAt: '2024-08-28 15:45',
      assignedTeam: ['First Aid Team', 'Guest Services', 'Security'],
      responseTime: 2,
      evacuationRequired: false,
      authoritiesNotified: true,
      guestsAffected: 1,
      notes: 'Guest transported to hospital. Family notified. Room secured.',
      actions: [
        { time: '14:20', action: 'Guest called front desk', by: 'Front Desk' },
        { time: '14:21', action: 'First aid team dispatched', by: 'Manager' },
        { time: '14:22', action: 'Ambulance called', by: 'First Aid' },
        { time: '14:25', action: 'Guest stabilized', by: 'First Aid Team' },
        { time: '14:35', action: 'Ambulance arrived', by: 'Paramedics' },
        { time: '15:45', action: 'Guest transported, room secured', by: 'Security' }
      ]
    },
    {
      id: 'EMR-003',
      type: 'power',
      title: 'Power Outage - Floor 3',
      description: 'Complete power failure on 3rd floor affecting 12 rooms',
      severity: 'high',
      status: 'active',
      location: 'Floor 3 - All Rooms',
      reportedBy: 'Guest Complaint',
      reportedAt: '2024-08-28 16:45',
      respondedAt: '2024-08-28 16:47',
      resolvedAt: null,
      assignedTeam: ['Electrical Team', 'Maintenance', 'Guest Services'],
      responseTime: 2,
      evacuationRequired: false,
      authoritiesNotified: false,
      guestsAffected: 18,
      notes: 'Main circuit breaker tripped. Investigating cause. Backup generator activated for essential services.',
      actions: [
        { time: '16:45', action: 'Multiple guest complaints received', by: 'Front Desk' },
        { time: '16:46', action: 'Maintenance team alerted', by: 'Duty Manager' },
        { time: '16:47', action: 'Emergency lighting activated', by: 'Security' },
        { time: '16:50', action: 'Generator started for lifts', by: 'Maintenance' },
        { time: '17:00', action: 'Investigating main panel', by: 'Electrician' }
      ]
    },
    {
      id: 'EMR-004',
      type: 'security',
      title: 'Unauthorized Access Attempt',
      description: 'Security breach detected at staff entrance',
      severity: 'medium',
      status: 'resolved',
      location: 'Staff Entrance - Basement',
      reportedBy: 'Security Camera System',
      reportedAt: '2024-08-28 03:15',
      respondedAt: '2024-08-28 03:16',
      resolvedAt: '2024-08-28 03:45',
      assignedTeam: ['Security Team', 'IT Security'],
      responseTime: 1,
      evacuationRequired: false,
      authoritiesNotified: true,
      guestsAffected: 0,
      notes: 'Former employee attempted access with old keycard. Police notified. Access system updated.',
      actions: [
        { time: '03:15', action: 'Failed access attempt detected', by: 'Security System' },
        { time: '03:16', action: 'Security guard dispatched', by: 'Night Security' },
        { time: '03:18', action: 'Individual identified on CCTV', by: 'Security' },
        { time: '03:20', action: 'Police contacted', by: 'Security Chief' },
        { time: '03:45', action: 'All clear - keycard deactivated', by: 'IT Security' }
      ]
    },
    {
      id: 'EMR-005',
      type: 'flood',
      title: 'Water Leak - Basement Storage',
      description: 'Major water leak from main pipe affecting storage area',
      severity: 'medium',
      status: 'resolved',
      location: 'Basement Storage Room B-2',
      reportedBy: 'Maintenance Staff',
      reportedAt: '2024-08-28 08:30',
      respondedAt: '2024-08-28 08:32',
      resolvedAt: '2024-08-28 11:15',
      assignedTeam: ['Plumbing Team', 'Maintenance', 'Housekeeping'],
      responseTime: 2,
      evacuationRequired: false,
      authoritiesNotified: false,
      guestsAffected: 0,
      notes: 'Pipe joint failure. Water shut off, area pumped out, repairs completed. No inventory damage.',
      actions: [
        { time: '08:30', action: 'Water leak discovered', by: 'Maintenance' },
        { time: '08:32', action: 'Main water valve shut off', by: 'Plumber' },
        { time: '08:45', action: 'Water pumping started', by: 'Maintenance Team' },
        { time: '10:00', action: 'Pipe repair completed', by: 'Plumbing Team' },
        { time: '11:15', action: 'Area cleaned and dried', by: 'Housekeeping' }
      ]
    }
  ];

  const emergencyContacts = [
    {
      id: 1,
      name: 'Fire Department',
      phone: '113',
      type: 'fire',
      available: '24/7',
      priority: 1
    },
    {
      id: 2,
      name: 'Police',
      phone: '110',
      type: 'security',
      available: '24/7',
      priority: 1
    },
    {
      id: 3,
      name: 'Ambulance/Medical',
      phone: '118',
      type: 'medical',
      available: '24/7',
      priority: 1
    },
    {
      id: 4,
      name: 'Security Chief',
      phone: '+62-811-1111-1111',
      type: 'security',
      available: '24/7',
      priority: 2
    },
    {
      id: 5,
      name: 'Maintenance Emergency',
      phone: '+62-812-2222-2222',
      type: 'maintenance',
      available: '24/7',
      priority: 2
    },
    {
      id: 6,
      name: 'Hotel Manager',
      phone: '+62-813-3333-3333',
      type: 'general',
      available: '24/7',
      priority: 3
    }
  ];

  const emergencyTeam = [
    {
      id: 1,
      name: 'Captain Ahmad Rahman',
      role: 'Emergency Response Leader',
      department: 'Security',
      status: 'on_duty',
      certification: 'Fire Safety, First Aid',
      phone: '+62-814-4444-4444',
      location: 'Security Office'
    },
    {
      id: 2,
      name: 'Dr. Maria Santos',
      role: 'First Aid Coordinator',
      department: 'Medical',
      status: 'on_call',
      certification: 'Medical Doctor, Emergency Response',
      phone: '+62-815-5555-5555',
      location: 'Medical Room'
    },
    {
      id: 3,
      name: 'David Chen',
      role: 'Fire Safety Officer',
      department: 'Safety',
      status: 'on_duty',
      certification: 'Fire Safety Inspector',
      phone: '+62-816-6666-6666',
      location: 'Fire Control Room'
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Kritis';
      case 'high': return 'Tinggi';
      case 'medium': return 'Sedang';
      case 'low': return 'Rendah';
      default: return severity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'resolved': return 'Selesai';
      case 'active': return 'Aktif';
      case 'investigating': return 'Investigasi';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fire': return <Flame className="h-4 w-4" />;
      case 'medical': return <Activity className="h-4 w-4" />;
      case 'power': return <Zap className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'flood': return <Droplets className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'fire': return 'bg-red-100 text-red-800';
      case 'medical': return 'bg-blue-100 text-blue-800';
      case 'power': return 'bg-yellow-100 text-yellow-800';
      case 'security': return 'bg-purple-100 text-purple-800';
      case 'flood': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'fire': return 'Kebakaran';
      case 'medical': return 'Medis';
      case 'power': return 'Listrik';
      case 'security': return 'Keamanan';
      case 'flood': return 'Banjir/Bocor';
      default: return type;
    }
  };

  const getTeamStatusColor = (status: string) => {
    switch (status) {
      case 'on_duty': return 'bg-green-100 text-green-800';
      case 'on_call': return 'bg-yellow-100 text-yellow-800';
      case 'off_duty': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTeamStatusLabel = (status: string) => {
    switch (status) {
      case 'on_duty': return 'Bertugas';
      case 'on_call': return 'Siaga';
      case 'off_duty': return 'Off Duty';
      default: return status;
    }
  };

  const filteredIncidents = emergencyIncidents.filter(incident => {
    const matchesTab = activeTab === 'all' || 
                      (activeTab === 'active' && incident.status === 'active') ||
                      (activeTab === 'resolved' && incident.status === 'resolved') ||
                      (activeTab === 'critical' && incident.severity === 'critical');
    
    const matchesSearch = incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         incident.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || incident.type === selectedType;
    
    return matchesTab && matchesSearch && matchesType;
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
          <h1 className="text-3xl font-bold text-gray-900">Emergency Management</h1>
          <p className="text-gray-600 mt-2">Sistem manajemen darurat dan respons cepat</p>
        </div>

        {/* Alert Banner for Active Emergencies */}
        {emergencyStats.activeAlerts > 0 && (
          <div className="bg-red-100 p-4 shadow animate-pulse">
            <div className="flex items-center space-x-3">
              <Siren className="h-6 w-6 text-red-600" />
              <div>
                <h3 className="font-bold text-red-800">EMERGENCY ACTIVE</h3>
                <p className="text-red-700 text-sm">{emergencyStats.activeAlerts} active emergency incident(s) require immediate attention</p>
              </div>
              <button className="bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors">
                View Details
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Active Alerts</h3>
                  <p className="text-sm text-gray-100 mt-1">Darurat aktif</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Siren className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className={`text-3xl font-bold ${emergencyStats.activeAlerts > 0 ? 'text-red-600' : 'text-[#005357]'}`}>
                  {emergencyStats.activeAlerts}
                </div>
                <div className="text-sm text-gray-600">alert aktif</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Resolved Today</h3>
                  <p className="text-sm text-gray-100 mt-1">Diselesaikan hari ini</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{emergencyStats.resolvedToday}</div>
                <div className="text-sm text-gray-600">insiden selesai</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Avg Response Time</h3>
                  <p className="text-sm text-gray-100 mt-1">Rata-rata respons</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Timer className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{emergencyStats.averageResponseTime}</div>
                <div className="text-sm text-gray-600">menit</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">This Month</h3>
                  <p className="text-sm text-gray-100 mt-1">Total bulan ini</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357]">{emergencyStats.totalThisMonth}</div>
                <div className="text-sm text-gray-600">insiden</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white shadow">
          <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Emergency Incidents</h3>
                <p className="text-sm text-gray-100 mt-1">Log dan tracking semua insiden darurat</p>
              </div>
              <div className="flex items-center space-x-3">
                <button className="bg-red-600 text-white px-4 py-2 text-sm font-medium hover:bg-red-700 transition-colors flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Report Emergency</span>
                </button>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gray-50">
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-6 bg-gray-100 p-1">
              <TabButton tabId="active" label="Active" count={emergencyStats.activeAlerts} />
              <TabButton tabId="resolved" label="Resolved" count={emergencyStats.resolvedToday} />
              <TabButton tabId="critical" label="Critical" count={emergencyStats.criticalAlerts} />
              <TabButton tabId="all" label="All" count={emergencyStats.totalThisMonth} />
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
                    placeholder="Cari emergency incident..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357] focus:border-[#005357] w-64"
                  />
                </div>
                <select 
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="fire">Kebakaran</option>
                  <option value="medical">Medis</option>
                  <option value="power">Listrik</option>
                  <option value="security">Keamanan</option>
                  <option value="flood">Banjir/Bocor</option>
                </select>
              </div>
            </div>

            {/* Incidents List */}
            <div className="space-y-6">
              {filteredIncidents.map((incident) => (
                <div key={incident.id} className="bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 text-gray-800">
                          {incident.id}
                        </span>
                        <span className={`inline-flex items-center px-2 py-1 text-xs font-medium ${getTypeColor(incident.type)}`}>
                          {getTypeIcon(incident.type)}
                          <span className="ml-1">{getTypeLabel(incident.type)}</span>
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium ${getSeverityColor(incident.severity)}`}>
                          {getSeverityLabel(incident.severity)}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(incident.status)}`}>
                          {getStatusLabel(incident.status)}
                        </span>
                        {incident.authoritiesNotified && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800">
                            <Radio className="h-3 w-3 mr-1" />
                            Authorities Notified
                          </span>
                        )}
                      </div>
                      
                      <h4 className="font-bold text-lg text-gray-900 mb-2">{incident.title}</h4>
                      <p className="text-sm text-gray-600 mb-4">{incident.description}</p>
                      
                      {/* Key Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Location:</span>
                          <div className="font-medium text-gray-900">{incident.location}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Reported by:</span>
                          <div className="font-medium text-gray-900">{incident.reportedBy}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Response time:</span>
                          <div className="font-medium text-green-600">{incident.responseTime} minutes</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Guests affected:</span>
                          <div className="font-medium text-gray-900">{incident.guestsAffected}</div>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                        <div>
                          <span className="text-gray-600">Reported:</span>
                          <div className="font-medium text-gray-900">{formatDate(incident.reportedAt)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Responded:</span>
                          <div className="font-medium text-blue-600">{formatDate(incident.respondedAt)}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Resolved:</span>
                          <div className="font-medium text-green-600">
                            {incident.resolvedAt ? formatDate(incident.resolvedAt) : 'In Progress'}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-600">Team:</span>
                          <div className="font-medium text-gray-900">{incident.assignedTeam.length} teams</div>
                        </div>
                      </div>

                      {/* Assigned Teams */}
                      <div className="mb-4">
                        <span className="text-sm text-gray-600 font-medium">Response Teams:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {incident.assignedTeam.map((team, index) => (
                            <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 text-xs">
                              {team}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Action Timeline */}
                      <div className="mb-4">
                        <span className="text-sm text-gray-600 font-medium">Action Timeline:</span>
                        <div className="mt-2 space-y-2">
                          {incident.actions.map((action, index) => (
                            <div key={index} className="flex items-center space-x-3 text-sm">
                              <span className="text-gray-500 font-mono text-xs w-12">{action.time}</span>
                              <div className="w-2 h-2 bg-[#005357] rounded-full"></div>
                              <span className="text-gray-900">{action.action}</span>
                              <span className="text-gray-500 text-xs">by {action.by}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Notes */}
                      {incident.notes && (
                        <div className="bg-gray-50 p-3 mb-4">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Resolution Notes:</span> {incident.notes}
                          </p>
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

        {/* Emergency Contacts & Team */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Emergency Contacts */}
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Emergency Contacts</h3>
                  <p className="text-sm text-gray-100 mt-1">Kontak darurat penting</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Phone className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50">
              <div className="space-y-3">
                {emergencyContacts.map((contact) => (
                  <div key={contact.id} className="bg-white p-4 shadow-sm flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{contact.name}</h4>
                      <p className="text-sm text-gray-600">{contact.available}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium ${
                        contact.priority === 1 ? 'bg-red-100 text-red-800' :
                        contact.priority === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        Priority {contact.priority}
                      </span>
                      <a
                        href={`tel:${contact.phone}`}
                        className="bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004347] transition-colors"
                      >
                        {contact.phone}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emergency Team */}
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Emergency Response Team</h3>
                  <p className="text-sm text-gray-100 mt-1">Tim respons darurat internal</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gray-50">
              <div className="space-y-4">
                {emergencyTeam.map((member) => (
                  <div key={member.id} className="bg-white p-4 shadow-sm">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-[#005357] flex items-center justify-center text-white font-bold">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.role}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium ${getTeamStatusColor(member.status)}`}>
                        {getTeamStatusLabel(member.status)}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Department:</span>
                        <span className="text-gray-900">{member.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Certification:</span>
                        <span className="text-gray-900 text-xs">{member.certification}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Location:</span>
                        <span className="text-gray-900">{member.location}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mt-3">
                      <a
                        href={`tel:${member.phone}`}
                        className="flex-1 bg-[#005357] text-white px-3 py-2 text-sm font-medium hover:bg-[#004347] transition-colors text-center"
                      >
                        Call {member.phone}
                      </a>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded">
                        <Radio className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SupportLayout>
  );
}