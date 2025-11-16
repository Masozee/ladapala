'use client';

import { useState, useEffect } from 'react';
import SupportLayout from '@/components/SupportLayout';
import { buildApiUrl } from '@/lib/config';
import {
  Wrench01Icon,
  BedIcon,
  PackageIcon,
  AlertCircleIcon,
  Clock01Icon,
  UserCheckIcon,
  UserMultipleIcon,
  ArrowUp01Icon,
  Calendar01Icon,
  Mail01Icon,
  SparklesIcon,
  Add01Icon,
  FilterIcon,
  MoreHorizontalIcon,
  EyeIcon,
  PencilEdit02Icon,
  CancelCircleIcon,
  Call02Icon,
  Location01Icon
} from '@/lib/icons';

export default function SupportDashboard() {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [supportStats, setSupportStats] = useState({
    activeMaintenance: 0,
    pendingHousekeeping: 0,
    amenitiesRequests: 0,
    emergencyAlerts: 0,
    completedToday: 0,
    averageResponseTime: 0,
    teamMembers: 0,
    satisfaction: 0
  });
  const [recentRequests, setRecentRequests] = useState<any[]>([]);
  const [teamMembers, setTeamMembers] = useState<any[]>([]);

  useEffect(() => {
    fetchAllData();

    // Refresh data when page becomes visible (user switches back to tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAllData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Auto-refresh every 30 seconds
    const refreshInterval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(refreshInterval);
    };
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchMaintenanceData(),
      fetchHousekeepingData(),
      fetchAmenityData(),
      fetchTeamMembers(),
    ]);
    setLoading(false);
  };

  const fetchMaintenanceData = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/maintenance-requests/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        // Handle nested results structure: data.results.results
        const requests = Array.isArray(data.results?.results)
          ? data.results.results
          : (Array.isArray(data.results) ? data.results : (Array.isArray(data) ? data : []));

        // Count active maintenance (not completed or cancelled)
        const activeCount = requests.filter((r: any) =>
          r.status !== 'COMPLETED' && r.status !== 'CANCELLED'
        ).length;

        // Count completed today
        const today = new Date().toISOString().split('T')[0];
        const completedToday = requests.filter((r: any) =>
          r.status === 'COMPLETED' && r.completed_date?.startsWith(today)
        ).length;

        setSupportStats(prev => ({
          ...prev,
          activeMaintenance: activeCount,
          completedToday: prev.completedToday + completedToday,
        }));

        // Map to recent requests format
        const maintenanceRequests = requests.slice(0, 10).map((r: any) => ({
          id: r.request_number,
          type: 'maintenance',
          title: r.title,
          location: r.room_number ? `Room ${r.room_number}` : 'N/A',
          priority: r.priority?.toLowerCase() || 'medium',
          status: r.status === 'IN_PROGRESS' ? 'in_progress' :
                  r.status === 'COMPLETED' ? 'completed' :
                  r.status === 'SUBMITTED' ? 'pending' : 'pending',
          assignedTo: r.assigned_technician || 'Unassigned',
          createdAt: r.requested_date || r.created_at,
          estimatedTime: 'N/A',
          description: r.description || '',
        }));

        setRecentRequests(prev => [...prev, ...maintenanceRequests]);
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
    }
  };

  const fetchHousekeepingData = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/housekeeping-tasks/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const tasks = data.results || data;

        // Count pending housekeeping (not CLEAN status)
        const pendingCount = tasks.filter((t: any) =>
          t.status !== 'CLEAN' && t.status !== 'INSPECTED'
        ).length;

        // Count completed today
        const today = new Date().toISOString().split('T')[0];
        const completedToday = tasks.filter((t: any) =>
          t.status === 'CLEAN' && t.completion_time?.startsWith(today)
        ).length;

        setSupportStats(prev => ({
          ...prev,
          pendingHousekeeping: pendingCount,
          completedToday: prev.completedToday + completedToday,
        }));

        // Map to recent requests format
        const housekeepingRequests = tasks.slice(0, 10).map((t: any) => ({
          id: t.task_number,
          type: 'housekeeping',
          title: t.task_type_display || 'Housekeeping Task',
          location: t.room_number ? `Room ${t.room_number}` : 'N/A',
          priority: t.priority?.toLowerCase() || 'medium',
          status: t.status === 'CLEANING' || t.status === 'DIRTY' ? 'in_progress' :
                  t.status === 'CLEAN' ? 'completed' : 'pending',
          assignedTo: t.assigned_to_name || 'Unassigned',
          createdAt: t.created_at,
          estimatedTime: t.estimated_duration_minutes ? `${t.estimated_duration_minutes} min` : 'N/A',
          description: t.notes || t.guest_requests?.join(', ') || '',
        }));

        setRecentRequests(prev => [...prev, ...housekeepingRequests]);
      }
    } catch (error) {
      console.error('Error fetching housekeeping data:', error);
    }
  };

  const fetchAmenityData = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/amenity-requests/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        const requests = data.results || data;

        // Count pending amenity requests
        const pendingCount = requests.filter((r: any) =>
          r.status === 'pending' || r.status === 'in_progress'
        ).length;

        // Count completed today
        const today = new Date().toISOString().split('T')[0];
        const completedToday = requests.filter((r: any) =>
          r.status === 'completed' && r.updated_at?.startsWith(today)
        ).length;

        setSupportStats(prev => ({
          ...prev,
          amenitiesRequests: pendingCount,
          completedToday: prev.completedToday + completedToday,
        }));

        // Map to recent requests format
        const amenityRequests = requests.slice(0, 10).map((r: any) => ({
          id: r.id,
          type: 'amenities',
          title: r.item_name || 'Amenity Request',
          location: r.room_number ? `Room ${r.room_number}` : 'N/A',
          priority: r.priority?.toLowerCase() || 'low',
          status: r.status,
          assignedTo: r.staff_name || 'Unassigned',
          createdAt: r.request_date || r.created_at,
          estimatedTime: 'N/A',
          description: r.notes || `${r.quantity} x ${r.item_name}`,
        }));

        setRecentRequests(prev => [...prev, ...amenityRequests]);
      }
    } catch (error) {
      console.error('Error fetching amenity data:', error);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(buildApiUrl('user/employees/team_status/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();

        // Map API data to UI format
        const mappedTeam = data.map((member: any) => ({
          id: member.id,
          employeeId: member.employee_id,
          name: member.name,
          role: member.position,
          department: member.department,
          status: member.status, // on_shift, scheduled, off_duty
          activeJobs: member.active_jobs,
          activeMaintenance: member.active_maintenance,
          activeHousekeeping: member.active_housekeeping,
          location: member.department || 'N/A',
          phone: member.phone,
          email: member.email,
          avatar: member.avatar_url,
          shift: member.shift,
        }));

        setTeamMembers(mappedTeam);
        setSupportStats(prev => ({
          ...prev,
          teamMembers: mappedTeam.filter((m: any) => m.status === 'on_shift').length,
        }));
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  // Sort recent requests by date (newest first)
  const sortedRecentRequests = [...recentRequests].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  }).slice(0, 10); // Show only 10 most recent

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
      case 'maintenance': return <Wrench01Icon className="h-4 w-4" />;
      case 'housekeeping': return <BedIcon className="h-4 w-4" />;
      case 'amenities': return <PackageIcon className="h-4 w-4" />;
      case 'emergency': return <AlertCircleIcon className="h-4 w-4" />;
      default: return <Mail01Icon className="h-4 w-4" />;
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
      case 'on_shift': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'off_duty': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTeamStatusLabel = (status: string) => {
    switch (status) {
      case 'on_shift': return 'Sedang Bertugas';
      case 'scheduled': return 'Terjadwal';
      case 'off_duty': return 'Off Duty';
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
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-[#F87B1B] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Active Maintenance</h3>
                  <p className="text-sm text-gray-100 mt-1">Sedang dikerjakan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Wrench01Icon className="h-4 w-4 text-[#F87B1B]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#F87B1B]">{supportStats.activeMaintenance}</div>
                <div className="text-sm text-gray-600">tugas aktif</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-[#F87B1B] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Housekeeping</h3>
                  <p className="text-sm text-gray-100 mt-1">Tugas pending</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <BedIcon className="h-4 w-4 text-[#F87B1B]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#F87B1B]">{supportStats.pendingHousekeeping}</div>
                <div className="text-sm text-gray-600">tugas menunggu</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-[#F87B1B] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Amenities Request</h3>
                  <p className="text-sm text-gray-100 mt-1">Permintaan baru</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <PackageIcon className="h-4 w-4 text-[#F87B1B]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#F87B1B]">{supportStats.amenitiesRequests}</div>
                <div className="text-sm text-gray-600">permintaan</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-[#F87B1B] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Completed Today</h3>
                  <p className="text-sm text-gray-100 mt-1">Selesai hari ini</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <UserCheckIcon className="h-4 w-4 text-[#F87B1B]" />
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
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-[#F87B1B] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Recent Requests</h3>
                  <p className="text-sm text-gray-100 mt-1">Permintaan terbaru dari semua departemen</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="bg-[#F87B1B] text-white px-3 py-2 text-sm font-medium hover:bg-[#E66A0A] transition-colors flex items-center space-x-2">
                    <Add01Icon className="h-4 w-4" />
                    <span>New Request</span>
                  </button>
                  <div className="w-8 h-8 bg-white flex items-center justify-center">
                    <Mail01Icon className="h-4 w-4 text-[#F87B1B]" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <SparklesIcon className="h-12 w-12 text-[#F87B1B] mx-auto animate-spin mb-4" />
                    <p className="text-gray-600">Loading requests...</p>
                  </div>
                </div>
              ) : sortedRecentRequests.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No recent requests found</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {sortedRecentRequests.map((request) => (
                  <div key={`${request.type}-${request.id}`} className="bg-white p-4 border border-gray-200">
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
                            <Location01Icon className="h-3 w-3" />
                            <span>{request.location}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <UserMultipleIcon className="h-3 w-3" />
                            <span>{request.assignedTo}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Clock01Icon className="h-3 w-3" />
                            <span>{request.estimatedTime}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <button className="p-1 text-gray-400 hover:text-[#F87B1B] hover:bg-gray-100 transition-colors rounded">
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded">
                          <PencilEdit02Icon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Team Status */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200 bg-[#F87B1B] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Team Status</h3>
                  <p className="text-sm text-gray-100 mt-1">Status real-time tim support</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <UserMultipleIcon className="h-4 w-4 text-[#F87B1B]" />
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <SparklesIcon className="h-12 w-12 text-[#F87B1B] mx-auto animate-spin mb-4" />
                    <p className="text-gray-600">Loading team...</p>
                  </div>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No team members available</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {teamMembers.map((member) => (
                  <div key={member.id} className="bg-white p-4 border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 bg-[#F87B1B] flex items-center justify-center text-white font-bold rounded-full">
                            {member.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                        )}
                        <div>
                          <h4 className="font-semibold text-gray-900">{member.name}</h4>
                          <p className="text-sm text-gray-600">{member.role}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium ${getTeamStatusColor(member.status)}`}>
                              {getTeamStatusLabel(member.status)}
                            </span>
                            {member.activeJobs > 0 && (
                              <span className="text-xs text-gray-500">
                                {member.activeJobs} tugas aktif
                              </span>
                            )}
                          </div>
                          {member.shift && (
                            <div className="text-xs text-gray-500 mt-1">
                              Shift: {member.shift.start_time} - {member.shift.end_time}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">{member.department || member.location}</div>
                        {member.phone && (
                          <div className="flex items-center space-x-2 mt-2">
                            <a href={`tel:${member.phone}`} className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors rounded">
                              <Call02Icon className="h-4 w-4" />
                            </a>
                            {member.email && (
                              <a href={`mailto:${member.email}`} className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors rounded">
                                <Mail01Icon className="h-4 w-4" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Quick Actions</h3>
                <p className="text-sm text-gray-100 mt-1">Aksi cepat untuk tugas support umum</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <ArrowUp01Icon className="h-4 w-4 text-[#F87B1B]" />
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="p-4 bg-white hover:bg-gray-50 transition-colors text-left">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 flex items-center justify-center">
                    <Wrench01Icon className="h-5 w-5 text-blue-600" />
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
                    <BedIcon className="h-5 w-5 text-purple-600" />
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
                    <PackageIcon className="h-5 w-5 text-green-600" />
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