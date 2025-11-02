'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import SupportLayout from '@/components/SupportLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
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
  Cancel01Icon,
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
  Settings02Icon,
  Alert01Icon,
  MoreHorizontalIcon
} from '@/lib/icons';

interface MaintenanceRequest {
  id: number;
  request_number: string;
  title: string;
  description: string;
  category: string;
  category_display?: string;
  priority: string;
  priority_display?: string;
  status: string;
  status_display?: string;
  source: string;
  source_display?: string;
  room?: number;
  room_number?: string;
  guest?: number;
  guest_name?: string;
  assigned_technician?: string;
  technician_notes?: string;
  requested_date: string;
  acknowledged_date?: string;
  started_date?: string;
  completed_date?: string;
  estimated_completion?: string;
  estimated_cost?: number;
  actual_cost?: number;
  customer_satisfaction?: number;
  resolution_time_hours?: number;
  efficiency_score?: number;
  created_at: string;
  updated_at: string;
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

const MaintenancePage = () => {
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);

  // Form state for new request
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'MEDIUM',
    source: 'STAFF_REPORT',
    room: '',
    estimated_cost: ''
  });

  // Fetch maintenance requests
  useEffect(() => {
    const fetchMaintenanceRequests = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl('hotel/maintenance-requests/'));
        if (response.ok) {
          const data = await response.json();
          setRequests(data.results || data || []);
        }
      } catch (error) {
        console.error('Error fetching maintenance requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaintenanceRequests();
  }, []);

  // Fetch rooms for dropdown
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(buildApiUrl('hotel/rooms/'));
        if (response.ok) {
          const data = await response.json();
          setRooms(data.results || data || []);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchRooms();
  }, []);

  // Refresh requests
  const refreshRequests = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/maintenance-requests/'));
      if (response.ok) {
        const data = await response.json();
        setRequests(data.results || data || []);
      }
    } catch (error) {
      console.error('Error refreshing requests:', error);
    }
  };

  // Handle create new request
  const handleCreateRequest = async () => {
    if (!newRequest.title || !newRequest.description) {
      alert('Title and description are required');
      return;
    }

    try {
      setFormLoading(true);
      const csrfToken = getCsrfToken();

      const requestData: any = {
        title: newRequest.title,
        description: newRequest.description,
        category: newRequest.category,
        priority: newRequest.priority,
        source: newRequest.source,
      };

      if (newRequest.room) {
        requestData.room = parseInt(newRequest.room);
      }

      if (newRequest.estimated_cost) {
        requestData.estimated_cost = parseFloat(newRequest.estimated_cost);
      }

      const response = await fetch(buildApiUrl('hotel/maintenance-requests/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        setShowNewRequestDialog(false);
        setNewRequest({
          title: '',
          description: '',
          category: 'General',
          priority: 'MEDIUM',
          source: 'STAFF_REPORT',
          room: '',
          estimated_cost: ''
        });
        await refreshRequests();
        alert('Maintenance request created successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create request');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Failed to create request. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle update status
  const handleUpdateStatus = async (requestId: number, action: string) => {
    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(
        buildApiUrl(`hotel/maintenance-requests/${requestId}/${action}/`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
        }
      );

      if (response.ok) {
        await refreshRequests();
        setOpenMenuId(null);
        alert(`Request ${action.replace('_', ' ')} successfully!`);
      } else {
        const errorData = await response.json();
        alert(errorData.error || `Failed to ${action.replace('_', ' ')}`);
      }
    } catch (error) {
      console.error(`Error ${action}:`, error);
      alert(`Failed to ${action.replace('_', ' ')}. Please try again.`);
    }
  };

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
    const normalizedStatus = status?.toUpperCase();
    switch (normalizedStatus) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'ACKNOWLEDGED': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    const normalizedPriority = priority?.toUpperCase();
    switch (normalizedPriority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'hvac': return <PackageIcon className="h-4 w-4" />;
      case 'plumbing': return <PackageIcon className="h-4 w-4" />;
      case 'electrical': return <SparklesIcon className="h-4 w-4" />;
      case 'elevator': return <Building03Icon className="h-4 w-4" />;
      case 'security': return <Shield01Icon className="h-4 w-4" />;
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

  const filteredRequests = requests.filter(request => {
    if (searchTerm &&
        !request.title?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.request_number?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !request.room_number?.includes(searchTerm) &&
        !request.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterStatus !== 'all' && request.status?.toUpperCase() !== filterStatus.toUpperCase()) {
      return false;
    }
    if (filterCategory !== 'all' && request.category?.toUpperCase() !== filterCategory.toUpperCase()) {
      return false;
    }
    return true;
  });

  const getStatusStats = () => {
    return {
      submitted: requests.filter(r => r.status?.toUpperCase() === 'SUBMITTED').length,
      in_progress: requests.filter(r => r.status?.toUpperCase() === 'IN_PROGRESS').length,
      completed: requests.filter(r => r.status?.toUpperCase() === 'COMPLETED').length,
      urgent: requests.filter(r => r.priority?.toUpperCase() === 'URGENT').length,
      total: requests.length
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Maintenance Management</h1>
          <p className="text-gray-600 mt-2">Track and manage all maintenance requests and technical issues</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded">
                <AlertCircleIcon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.submitted}</div>
            <div className="text-sm font-medium text-gray-600">Submitted Requests</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded">
                <Wrench01Icon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.in_progress}</div>
            <div className="text-sm font-medium text-gray-600">In Progress</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded">
                <UserCheckIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.completed}</div>
            <div className="text-sm font-medium text-gray-600">Completed</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-100 rounded">
                <Alert01Icon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.urgent}</div>
            <div className="text-sm font-medium text-gray-600">Urgent Priority</div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search02Icon className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search tickets, titles, location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B] focus:border-[#F87B1B] w-full rounded"
              />
            </div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B] rounded"
            >
              <option value="all">All Categories</option>
              <option value="HVAC">HVAC</option>
              <option value="Electrical">Electrical</option>
              <option value="Plumbing">Plumbing</option>
              <option value="Elevator">Elevator</option>
              <option value="IT/Network">IT/Network</option>
              <option value="General">General</option>
              <option value="Security">Security</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B] rounded"
            >
              <option value="all">All Status</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <button
            onClick={() => setShowNewRequestDialog(true)}
            className="bg-[#F87B1B] text-white px-4 py-2 text-sm font-medium hover:bg-[#E06A0A] transition-colors flex items-center space-x-2 rounded"
          >
            <Add01Icon className="h-4 w-4" />
            <span>New Request</span>
          </button>
        </div>

        {/* Maintenance Requests Table */}
        <table className="w-full border-collapse bg-white border border-gray-200">
            <thead className="bg-[#F87B1B]">
              <tr>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium text-white">Request</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium text-white">Category</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium text-white">Status</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium text-white">Source</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium text-white">Technician</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium text-white">Timeline</th>
                <th className="border border-gray-200 px-6 py-4 text-center text-sm font-medium text-white">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="border border-gray-200 px-6 py-12 text-center">
                    <div className="text-gray-500">Loading complaints...</div>
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-gray-200 px-6 py-12 text-center">
                    <Wrench01Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No maintenance requests found</h3>
                    <p className="text-gray-600">No maintenance requests yet. Click "New Request" to create one.</p>
                  </td>
                </tr>
              ) : (
                filteredRequests.map((request) => {
                  const timeDeadline = request.estimated_completion ? getTimeUntilDeadline(request.estimated_completion) : null;
                  return (
                    <tr key={request.id} className="hover:bg-gray-50">
                      {/* Request Info */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPriorityColor(request.priority)}`}>
                            {request.priority_display || request.priority}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-gray-900">{request.request_number}</div>
                        <div className="text-sm text-gray-900 font-medium">{request.title}</div>
                        {request.room_number && (
                          <div className="text-xs text-gray-600">Room {request.room_number}</div>
                        )}
                        {request.guest_name && (
                          <div className="text-xs text-gray-500">Guest: {request.guest_name}</div>
                        )}
                      </td>

                      {/* Category */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-700">{request.category_display || request.category}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="border border-gray-200 px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(request.status)}`}>
                          {request.status_display || request.status}
                        </span>
                      </td>

                      {/* Source */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="text-sm text-gray-700">
                          {request.source_display || request.source}
                        </div>
                      </td>

                      {/* Technician */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="text-sm">
                          {request.assigned_technician ? (
                            <div className="text-gray-900 font-medium">{request.assigned_technician}</div>
                          ) : (
                            <span className="text-gray-500">Unassigned</span>
                          )}
                        </div>
                      </td>

                      {/* Timeline */}
                      <td className="border border-gray-200 px-6 py-4">
                        <div className="space-y-1 text-xs">
                          <div className="text-gray-600">
                            Requested: {formatDateTime(request.requested_date)}
                          </div>
                          {request.completed_date && (
                            <div className="text-green-600">
                              Completed: {formatDateTime(request.completed_date)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="border border-gray-200 px-6 py-4 text-center">
                        <div className="flex items-center justify-center relative">
                          <button
                            onClick={() => {
                              setOpenMenuId(openMenuId === request.id ? null : request.id);
                              setSelectedRequest(request);
                            }}
                            className="p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                          >
                            <MoreHorizontalIcon className="h-4 w-4 text-gray-600" />
                          </button>
                          {openMenuId === request.id && (
                            <div className="absolute right-0 top-12 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-10 rounded">
                              {request.status === 'SUBMITTED' && (
                                <button
                                  onClick={() => handleUpdateStatus(request.id, 'acknowledge')}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                >
                                  Acknowledge
                                </button>
                              )}
                              {(request.status === 'SUBMITTED' || request.status === 'ACKNOWLEDGED') && (
                                <button
                                  onClick={() => handleUpdateStatus(request.id, 'start_work')}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                >
                                  Start Work
                                </button>
                              )}
                              {request.status === 'IN_PROGRESS' && (
                                <button
                                  onClick={() => handleUpdateStatus(request.id, 'complete')}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100"
                                >
                                  Mark Complete
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  // Could add view details functionality here
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                View Details
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

        {/* New Request Dialog */}
        {showNewRequestDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Dialog Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-gray-900">New Maintenance Request</h3>
                  <button
                    onClick={() => {
                      setShowNewRequestDialog(false);
                      setNewRequest({
                        title: '',
                        description: '',
                        category: 'General',
                        priority: 'MEDIUM',
                        source: 'STAFF_REPORT',
                        room: '',
                        estimated_cost: ''
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Cancel01Icon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Dialog Content */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                    placeholder="e.g., AC not working in room 301"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                    placeholder="Provide detailed description of the issue..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newRequest.category}
                      onChange={(e) => setNewRequest({ ...newRequest, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                    >
                      <option value="HVAC">HVAC</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Elevator">Elevator</option>
                      <option value="IT/Network">IT/Network</option>
                      <option value="General">General</option>
                      <option value="Security">Security</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newRequest.priority}
                      onChange={(e) => setNewRequest({ ...newRequest, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                    <select
                      value={newRequest.source}
                      onChange={(e) => setNewRequest({ ...newRequest, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                    >
                      <option value="STAFF_REPORT">Staff Report</option>
                      <option value="GUEST_REQUEST">Guest Request</option>
                      <option value="PREVENTIVE">Preventive Maintenance</option>
                      <option value="INSPECTION">Inspection</option>
                      <option value="EMERGENCY">Emergency</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room (Optional)</label>
                    <select
                      value={newRequest.room}
                      onChange={(e) => setNewRequest({ ...newRequest, room: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                    >
                      <option value="">-- Select Room --</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          {room.number} - {room.room_type_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Cost (Optional)
                  </label>
                  <input
                    type="number"
                    value={newRequest.estimated_cost}
                    onChange={(e) => setNewRequest({ ...newRequest, estimated_cost: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                    placeholder="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowNewRequestDialog(false);
                    setNewRequest({
                      title: '',
                      description: '',
                      category: 'General',
                      priority: 'MEDIUM',
                      source: 'STAFF_REPORT',
                      room: '',
                      estimated_cost: ''
                    });
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRequest}
                  className="px-4 py-2 bg-[#F87B1B] text-white text-sm hover:bg-[#E06A0A] disabled:opacity-50"
                  disabled={formLoading || !newRequest.title || !newRequest.description}
                >
                  {formLoading ? 'Creating...' : 'Create Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SupportLayout>
  );
};

export default MaintenancePage;