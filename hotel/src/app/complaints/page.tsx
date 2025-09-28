'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout, { HeaderActions } from '@/components/AppLayout';
import { buildApiUrl } from '@/lib/config';
import Link from 'next/link';
import { 
  Search,
  AlertTriangle,
  MessageSquare,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Filter,
  Calendar,
  Star,
  Phone,
  Mail,
  MapPin,
  Grid3X3,
  List,
  Plus,
  X,
  Flag,
  Users,
  Building,
  Utensils,
  Wifi,
  Car,
  Bath,
  Bed,
  Coffee,
  Shield,
  AlertCircle,
  FileText,
  UserCheck,
  Headphones,
  Camera
} from 'lucide-react';

interface ComplaintCategory {
  id: number;
  name: string;
  description: string;
  color: string;
  department: any;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Guest {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  loyalty_points: number;
  is_vip: boolean;
  is_active: boolean;
  gender_display: string;
  loyalty_level: string;
}

interface AssignedDepartment {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface ComplaintResponse {
  id: number;
  responder_name: string;
  responder_role: string;
  response_text: string;
  response_date: string;
  action_taken: string;
}

interface Complaint {
  id: number;
  complaint_number: string;
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'SUBMITTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';
  source: string;
  guest: Guest;
  room_number?: string;
  incident_date: string;
  assigned_to?: any;
  assigned_department?: AssignedDepartment;
  is_escalated: boolean;
  follow_up_required: boolean;
  is_overdue: boolean;
  response_time?: number;
  image_count: number;
  response_count: number;
  created_at: string;
  updated_at: string;
}

interface StatusCounters {
  in_progress: number;
  completed: number;
  escalated: number;
  urgent: number;
  high_priority: number;
  overdue: number;
}

interface CategoryStatusCounter {
  category_id: number;
  category_name: string;
  total_complaints: number;
  status_counts: { [key: string]: number };
}

interface ComplaintsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Complaint[];
  status_counters: StatusCounters;
  category_status_counters: CategoryStatusCounter[];
}

// API functions
const fetchComplaints = async (): Promise<ComplaintsResponse> => {
  try {
    const response = await fetch(buildApiUrl('hotel/complaints/'));
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication required');
      }
      throw new Error('Failed to fetch complaints');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching complaints:', error);
    throw error;
  }
};

const ComplaintsPage = () => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // API state
  const [complaintsData, setComplaintsData] = useState<ComplaintsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load complaints data
  useEffect(() => {
    const loadComplaints = async () => {
      try {
        setLoading(true);
        const data = await fetchComplaints();
        setComplaintsData(data);
        setError(null);
      } catch (err: any) {
        setError('Failed to load complaints. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadComplaints();
  }, [router]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'ACKNOWLEDGED': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'UNDER_REVIEW': return 'bg-purple-100 text-purple-800';
      case 'RESOLVED': return 'bg-green-100 text-green-800';
      case 'CLOSED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'URGENT': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (categoryName: string, className: string = "h-4 w-4 text-white") => {
    if (!categoryName) return <AlertTriangle className={className} />;
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes('room')) return <Bed className={className} />;
    if (lowerName.includes('service')) return <UserCheck className={className} />;
    if (lowerName.includes('food') || lowerName.includes('beverage')) return <Utensils className={className} />;
    if (lowerName.includes('noise')) return <Headphones className={className} />;
    if (lowerName.includes('clean')) return <Bath className={className} />;
    if (lowerName.includes('amenities')) return <Coffee className={className} />;
    if (lowerName.includes('billing')) return <FileText className={className} />;
    if (lowerName.includes('staff')) return <Users className={className} />;
    return <AlertTriangle className={className} />;
  };

  const filteredComplaints = complaintsData?.results?.filter(complaint => {
    const guestName = (complaint as any).guest_name || complaint.guest?.full_name || '';
    const guestEmail = complaint.guest?.email || '';
    
    if (searchTerm && 
        !guestName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !complaint.complaint_number.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !guestEmail.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterStatus !== 'all' && complaint.status !== filterStatus) {
      return false;
    }
    if (filterPriority !== 'all' && complaint.priority !== filterPriority) {
      return false;
    }
    const categoryValue = (complaint as any).category_display || complaint.category?.name || complaint.category;
    if (filterCategory !== 'all' && categoryValue !== filterCategory) {
      return false;
    }
    return true;
  }) || [];

  const stats = complaintsData?.status_counters || {
    in_progress: 0,
    completed: 0,
    escalated: 0,
    urgent: 0,
    high_priority: 0,
    overdue: 0
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Guest Complaints</h1>
            <p className="text-gray-600 mt-2">Track and resolve guest complaints efficiently</p>
          </div>
          <div>
            <button className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors">
              <Plus className="h-4 w-4" />
              <span>New Complaint</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <div className="bg-white shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.in_progress}</div>
                <div className="text-sm text-gray-600">In Progress</div>
              </div>
              <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                <Clock className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.escalated}</div>
                <div className="text-sm text-gray-600">Escalated</div>
              </div>
              <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                <Flag className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.urgent}</div>
                <div className="text-sm text-gray-600">Urgent</div>
              </div>
              <div className="w-8 h-8 bg-red-600 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.high_priority}</div>
                <div className="text-sm text-gray-600">High Priority</div>
              </div>
              <div className="w-8 h-8 bg-orange-600 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.overdue}</div>
                <div className="text-sm text-gray-600">Overdue</div>
              </div>
              <div className="w-8 h-8 bg-red-800 flex items-center justify-center">
                <XCircle className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-2 h-10">
            {/* Search Form */}
            <div className="relative h-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search complaints, guests, or complaint numbers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80 h-full pl-10 pr-3 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
              />
            </div>
            
            {/* Advanced Filter Button */}
            <button
              onClick={() => setShowAdvancedFilter(true)}
              className="flex items-center space-x-2 px-4 h-full border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              <Filter className="h-4 w-4" />
              <span>Advanced Filter</span>
            </button>
            
            {/* View Mode Toggle */}
            <div className="flex border border-gray-300 h-full">
              <button
                onClick={() => setViewMode('card')}
                className={`flex items-center justify-center space-x-2 px-4 text-sm transition-colors h-full ${
                  viewMode === 'card' 
                    ? 'bg-[#005357] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                <span>Cards</span>
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`flex items-center justify-center space-x-2 px-4 text-sm transition-colors border-l border-gray-300 h-full ${
                  viewMode === 'table' 
                    ? 'bg-[#005357] text-white' 
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <List className="h-4 w-4" />
                <span>Table</span>
              </button>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 border-2 border-[#005357] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-gray-600">Loading complaints...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {!loading && !error && (
          <div className="text-sm text-gray-600">
            {filteredComplaints.length} complaint{filteredComplaints.length !== 1 ? 's' : ''} found
          </div>
        )}

        {/* Complaints Display */}
        {!loading && !error && (
          <>
            {viewMode === 'card' ? (
              /* Card View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredComplaints.map((complaint) => (
                  <div key={complaint.id} className="bg-white shadow">
                    {/* Card Header */}
                    <div className="p-6 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{complaint.complaint_number}</h3>
                          <p className="text-sm text-gray-600 mt-1">{complaint.title}</p>
                        </div>
                        <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                          {getCategoryIcon(complaint.category.name)}
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-4 bg-gray-50">
                      {/* Guest Info */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{complaint.guest.full_name}</span>
                          <div className="flex items-center space-x-1">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(complaint.status)}`}>
                              {complaint.status.replace('_', ' ')}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(complaint.priority)}`}>
                              {complaint.priority}
                            </span>
                          </div>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div>{complaint.guest.email}</div>
                          {complaint.room_number && <div>Room {complaint.room_number}</div>}
                        </div>
                      </div>

                      {/* Category & Department */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getCategoryIcon(complaint.category.name, "h-4 w-4 text-gray-600")}
                            <span className="text-sm font-medium text-gray-700">{complaint.category.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">{complaint.assigned_department?.name || 'Unassigned'}</span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <p className="text-sm text-gray-700 line-clamp-3">
                          {complaint.description}
                        </p>
                      </div>

                      {/* Response Info */}
                      <div className="mb-4 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{complaint.response_count} response{complaint.response_count !== 1 ? 's' : ''}</span>
                            </div>
                            {complaint.image_count > 0 && (
                              <div className="flex items-center space-x-1">
                                <Camera className="h-3 w-3" />
                                <span>{complaint.image_count} image{complaint.image_count !== 1 ? 's' : ''}</span>
                              </div>
                            )}
                          </div>
                          <span>{formatDateTime(complaint.created_at)}</span>
                        </div>
                        {complaint.assigned_department && (
                          <div className="flex items-center space-x-2 mt-1">
                            <UserCheck className="h-3 w-3" />
                            <span>Assigned: {complaint.assigned_department.name}</span>
                          </div>
                        )}
                      </div>

                      {/* Follow-up Notice */}
                      {complaint.follow_up_required && (
                        <div className="mb-4 p-2 bg-orange-50 border border-orange-200 text-xs text-orange-800">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Follow-up required</span>
                          </div>
                        </div>
                      )}

                      {/* Escalated Notice */}
                      {complaint.is_escalated && (
                        <div className="mb-4 p-2 bg-red-50 border border-red-200 text-xs text-red-800">
                          <div className="flex items-center space-x-1">
                            <Flag className="h-3 w-3" />
                            <span>Escalated complaint</span>
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-2">
                        <Link 
                          href={`/complaints/${complaint.complaint_number}`}
                          className="text-xs bg-gray-100 text-gray-700 px-3 py-2 hover:bg-gray-200 transition-colors text-center"
                        >
                          <Eye className="h-3 w-3 inline mr-1" />
                          View Details
                        </Link>
                        <button className="text-xs bg-[#005357] text-white px-3 py-2 hover:bg-[#004147] transition-colors">
                          <Edit className="h-3 w-3 inline mr-1" />
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
        ) : (
          /* Table View */
          <div className="bg-white shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Complaints Overview</h3>
                  <p className="text-sm text-gray-600 mt-1">Track and manage all guest complaints</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#005357]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Complaint
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Guest
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50">
                      {/* Complaint Info */}
                      <td className="px-6 py-4">
                        <div>
                          <Link href={`/complaints/${complaint.complaint_number}`} className="font-bold text-[#005357] hover:text-[#004147] hover:underline">
                            {complaint.complaint_number}
                          </Link>
                          <div className="text-sm text-gray-900 font-medium">{complaint.title}</div>
                          <div className="text-xs text-gray-600 line-clamp-2">{complaint.description}</div>
                        </div>
                      </td>

                      {/* Guest Info */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{(complaint as any).guest_name || complaint.guest?.full_name || 'Guest'}</div>
                          <div className="text-gray-600 text-xs">{complaint.guest?.email || ''}</div>
                          {complaint.room_number && (
                            <div className="text-gray-600 text-xs">Room {complaint.room_number}</div>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon((complaint as any).category_display || complaint.category?.name || complaint.category, "h-4 w-4 text-gray-600")}
                          <span className="text-sm text-gray-700">{(complaint as any).category_display || complaint.category?.name || complaint.category}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{complaint.assigned_department?.name || 'Unassigned'}</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-3 mt-1">
                          {complaint.response_count > 0 && (
                            <div className="text-xs text-gray-500 flex items-center space-x-1">
                              <MessageSquare className="h-3 w-3" />
                              <span>{complaint.response_count} response{complaint.response_count !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {complaint.image_count > 0 && (
                            <div className="text-xs text-gray-500 flex items-center space-x-1">
                              <Camera className="h-3 w-3" />
                              <span>{complaint.image_count} image{complaint.image_count !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                        {complaint.is_escalated && (
                          <div className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                            <Flag className="h-3 w-3" />
                            <span>Escalated</span>
                          </div>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                        {complaint.follow_up_required && (
                          <div className="text-xs text-orange-600 mt-1 flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Follow-up due</span>
                          </div>
                        )}
                        {complaint.is_overdue && (
                          <div className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                            <XCircle className="h-3 w-3" />
                            <span>Overdue</span>
                          </div>
                        )}
                      </td>

                      {/* Assigned To */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {complaint.assigned_department?.name || complaint.assigned_to?.full_name || 'Unassigned'}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(complaint.created_at)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="relative" ref={openDropdown === complaint.id ? dropdownRef : null}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === complaint.id ? null : complaint.id)}
                            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            •••
                          </button>
                          {openDropdown === complaint.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white shadow-lg border py-1 z-10">
                              <Link
                                href={`/complaints/${complaint.complaint_number}`}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <Eye className="h-4 w-4 inline mr-2" />
                                View Details
                              </Link>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <Edit className="h-4 w-4 inline mr-2" />
                                Edit Complaint
                              </button>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <UserCheck className="h-4 w-4 inline mr-2" />
                                Assign Staff
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <XCircle className="h-4 w-4 inline mr-2" />
                                Close Complaint
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
            )}
          </>
        )}

        {/* Advanced Filter Modal */}
        {showAdvancedFilter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Advanced Filter</h3>
                    <p className="text-sm text-gray-600 mt-1">Filter complaints by multiple criteria</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                      <Filter className="h-4 w-4 text-white" />
                    </div>
                    <button
                      onClick={() => setShowAdvancedFilter(false)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 bg-gray-50">
                <div className="space-y-6">
                  {/* Basic Filters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Basic Filters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                        >
                          <option value="all">All Status</option>
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                          <option value="escalated">Escalated</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select
                          value={filterPriority}
                          onChange={(e) => setFilterPriority(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                        >
                          <option value="all">All Priority</option>
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="urgent">Urgent</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={filterCategory}
                          onChange={(e) => setFilterCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                        >
                          <option value="all">All Categories</option>
                          <option value="room">Room Issues</option>
                          <option value="service">Service</option>
                          <option value="food">Food & Beverage</option>
                          <option value="noise">Noise</option>
                          <option value="cleanliness">Cleanliness</option>
                          <option value="amenities">Amenities</option>
                          <option value="billing">Billing</option>
                          <option value="staff">Staff</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Advanced Filters</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                        <select
                          value={filterDepartment}
                          onChange={(e) => setFilterDepartment(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                        >
                          <option value="all">All Departments</option>
                          <option value="Engineering">Engineering</option>
                          <option value="Food & Beverage">Food & Beverage</option>
                          <option value="Housekeeping">Housekeeping</option>
                          <option value="Front Office">Front Office</option>
                          <option value="Management">Management</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">Date Range</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Created From</label>
                        <input
                          type="date"
                          value={filterDateFrom}
                          onChange={(e) => setFilterDateFrom(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Created To</label>
                        <input
                          type="date"
                          value={filterDateTo}
                          onChange={(e) => setFilterDateTo(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setFilterStatus('all');
                        setFilterPriority('all');
                        setFilterCategory('all');
                        setFilterDepartment('all');
                        setFilterDateFrom('');
                        setFilterDateTo('');
                      }}
                      className="text-sm text-gray-600 hover:text-gray-800"
                    >
                      Clear All Filters
                    </button>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setShowAdvancedFilter(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowAdvancedFilter(false)}
                        className="px-4 py-2 bg-[#005357] text-white text-sm hover:bg-[#004147]"
                      >
                        Apply Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && filteredComplaints.length === 0 && (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ComplaintsPage;