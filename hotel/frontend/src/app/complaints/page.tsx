'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout, { HeaderActions } from '@/components/AppLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import Link from 'next/link';
import {
  Search02Icon,
  AlertCircleIcon,
  Mail01Icon,
  UserIcon,
  Clock01Icon,
  UserCheckIcon,
  CancelCircleIcon,
  EyeIcon,
  PencilEdit02Icon,
  FilterIcon,
  Calendar01Icon,
  SparklesIcon,
  Call02Icon,
  Location01Icon,
  ViewIcon,
  ListViewIcon,
  Add01Icon,
  Cancel01Icon,
  UserMultipleIcon,
  Building03Icon,
  PackageIcon,
  BedIcon,
  Shield01Icon,
  File01Icon,
  HeadphonesIcon,
  Alert01Icon
} from '@/lib/icons';

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
  status: 'SUBMITTED' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED' | 'OPEN';
  source: string;
  guest: Guest;
  room_number?: string;
  incident_date: string;
  assigned_to?: number;
  assigned_to_name?: string;
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

  // Form modal state
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    guest_id: '',
    room_id: '',
    category: 'OTHER',
    priority: 'MEDIUM',
    title: '',
    description: '',
    incident_date: new Date().toISOString().split('T')[0]
  });

  // Image upload states
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Assign staff states
  const [showAssignStaffDialog, setShowAssignStaffDialog] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [staffMembers, setStaffMembers] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  // Edit complaint states
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editStatus, setEditStatus] = useState('');

  // Close complaint states
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [closeReason, setCloseReason] = useState('');

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

  // Load guests and rooms when form is opened
  useEffect(() => {
    if (showComplaintForm) {
      const loadFormData = async () => {
        try {
          // Load guests
          const guestsResponse = await fetch(buildApiUrl('guests/'));
          if (guestsResponse.ok) {
            const guestsData = await guestsResponse.json();
            setGuests(guestsData.results || []);
          }

          // Load rooms
          const roomsResponse = await fetch(buildApiUrl('rooms/'));
          if (roomsResponse.ok) {
            const roomsData = await roomsResponse.json();
            setRooms(roomsData.results || []);
          }
        } catch (err) {
          console.error('Error loading form data:', err);
        }
      };

      loadFormData();
    }
  }, [showComplaintForm]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 images
    const newImages = [...selectedImages, ...files].slice(0, 5);
    setSelectedImages(newImages);

    // Create preview URLs
    const newPreviews = newImages.map(file => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  // Remove image
  const handleRemoveImage = (index: number) => {
    const newImages = selectedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Handle form submission
  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError(null);

    try {
      // First, create the complaint
      const response = await fetch(buildApiUrl('hotel/complaints/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        setFormError(errorData.error || 'Failed to submit complaint');
        return;
      }

      const newComplaint = await response.json();

      // Then, upload images if any
      if (selectedImages.length > 0) {
        for (const image of selectedImages) {
          const imageFormData = new FormData();
          imageFormData.append('image', image);
          imageFormData.append('complaint', newComplaint.id.toString());

          await fetch(buildApiUrl('hotel/complaint-images/'), {
            method: 'POST',
            body: imageFormData
          });
        }
      }

      // Success - reload complaints and close form
      setShowComplaintForm(false);
      setFormData({
        guest_id: '',
        room_id: '',
        category: 'OTHER',
        priority: 'MEDIUM',
        title: '',
        description: '',
        incident_date: new Date().toISOString().split('T')[0]
      });
      setSelectedImages([]);
      setImagePreviews([]);

      // Reload complaints list
      const data = await fetchComplaints();
      setComplaintsData(data);
    } catch (err: any) {
      setFormError('Failed to submit complaint. Please try again.');
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // Load staff members when assign dialog is opened
  useEffect(() => {
    if (showAssignStaffDialog) {
      const loadStaff = async () => {
        try {
          const response = await fetch(buildApiUrl('user/users/'), {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            setStaffMembers(data.results || data || []);
          }
        } catch (err) {
          console.error('Error loading staff:', err);
        }
      };

      loadStaff();
    }
  }, [showAssignStaffDialog]);

  // Handle assign staff
  const handleAssignStaff = async () => {
    if (!selectedComplaint || !selectedStaffId) return;

    try {
      setFormLoading(true);

      // Get CSRF token
      const csrfToken = getCsrfToken();

      const response = await fetch(
        buildApiUrl(`hotel/complaints/${selectedComplaint.id}/assign_staff/`),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ user_id: selectedStaffId })
        }
      );

      if (response.ok) {
        // Reload complaints
        const data = await fetchComplaints();
        setComplaintsData(data);
        setShowAssignStaffDialog(false);
        setSelectedComplaint(null);
        setSelectedStaffId('');
        alert('Staff assigned successfully!');
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        alert(errorData.error || 'Failed to assign staff');
      }
    } catch (err) {
      console.error('Error assigning staff:', err);
      alert('Failed to assign staff. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle edit complaint (status only)
  const handleEditComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setEditStatus(complaint.status);
    setShowEditDialog(true);
    setOpenDropdown(null);
  };

  const handleSubmitEdit = async () => {
    if (!selectedComplaint) return;

    try {
      setFormLoading(true);
      const csrfToken = getCsrfToken();

      const response = await fetch(
        buildApiUrl(`hotel/complaints/${selectedComplaint.id}/`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({ status: editStatus })
        }
      );

      if (response.ok) {
        const data = await fetchComplaints();
        setComplaintsData(data);
        setShowEditDialog(false);
        setSelectedComplaint(null);
        alert('Complaint status updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update complaint status');
      }
    } catch (err) {
      console.error('Error updating complaint:', err);
      alert('Failed to update complaint. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  // Handle close complaint
  const handleCloseComplaint = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setCloseReason('');
    setShowCloseDialog(true);
    setOpenDropdown(null);
  };

  const handleSubmitClose = async () => {
    if (!selectedComplaint) return;
    if (!closeReason.trim() || closeReason.trim().length < 10) {
      alert('Please provide a detailed reason (minimum 10 characters)');
      return;
    }

    try {
      setFormLoading(true);
      const csrfToken = getCsrfToken();

      const response = await fetch(
        buildApiUrl(`hotel/complaints/${selectedComplaint.id}/`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
          },
          credentials: 'include',
          body: JSON.stringify({
            status: 'CLOSED',
            description: `${selectedComplaint.description}\n\n[CLOSED] Reason: ${closeReason}`
          })
        }
      );

      if (response.ok) {
        const data = await fetchComplaints();
        setComplaintsData(data);
        setShowCloseDialog(false);
        setSelectedComplaint(null);
        setCloseReason('');
        alert('Complaint closed successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to close complaint');
      }
    } catch (err) {
      console.error('Error closing complaint:', err);
      alert('Failed to close complaint. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

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
    if (!categoryName) return <Alert01Icon className={className} />;
    const lowerName = categoryName.toLowerCase();
    if (lowerName.includes('room')) return <BedIcon className={className} />;
    if (lowerName.includes('service')) return <UserCheckIcon className={className} />;
    if (lowerName.includes('food') || lowerName.includes('beverage')) return <PackageIcon className={className} />;
    if (lowerName.includes('noise')) return <HeadphonesIcon className={className} />;
    if (lowerName.includes('clean')) return <Shield01Icon className={className} />;
    if (lowerName.includes('amenities')) return <SparklesIcon className={className} />;
    if (lowerName.includes('billing')) return <File01Icon className={className} />;
    if (lowerName.includes('staff')) return <UserMultipleIcon className={className} />;
    return <Alert01Icon className={className} />;
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
            <button
              onClick={() => setShowComplaintForm(true)}
              className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors"
            >
              <Add01Icon className="h-4 w-4" />
              <span>New Complaint</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.in_progress}</div>
                <div className="text-sm text-gray-600 mt-1">In Progress</div>
              </div>
              <div className="w-12 h-12 bg-[#005357] flex items-center justify-center">
                <Clock01Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.urgent}</div>
                <div className="text-sm text-gray-600 mt-1">Urgent</div>
              </div>
              <div className="w-12 h-12 bg-red-600 flex items-center justify-center">
                <Alert01Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-gray-900">{stats.overdue}</div>
                <div className="text-sm text-gray-600 mt-1">Overdue</div>
              </div>
              <div className="w-12 h-12 bg-red-800 flex items-center justify-center">
                <CancelCircleIcon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-end">
          <div className="flex items-center space-x-2 h-10">
            {/* Search Form */}
            <div className="relative h-full">
              <Search02Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
              <FilterIcon className="h-4 w-4" />
              <span>Advanced Filter</span>
            </button>
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
              <Alert01Icon className="h-5 w-5 text-red-600" />
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
          /* Table View */
          <div className="bg-white border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Complaints Overview</h3>
                  <p className="text-sm text-gray-600 mt-1">Track and manage all guest complaints</p>
                </div>
                <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                  <Mail01Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-[#005357]">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">
                      Complaint
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">
                      Guest
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">
                      Priority
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">
                      Assigned To
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-white border border-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredComplaints.map((complaint) => (
                    <tr key={complaint.id} className="hover:bg-gray-50">
                      {/* Complaint Info */}
                      <td className="px-6 py-4 border border-gray-200">
                        <div>
                          <Link href={`/complaints/${complaint.complaint_number}`} className="font-bold text-[#005357] hover:text-[#004147] hover:underline">
                            {complaint.complaint_number}
                          </Link>
                          <div className="text-sm text-gray-900 font-medium">{complaint.title}</div>
                          <div className="text-xs text-gray-600 line-clamp-2">{complaint.description}</div>
                        </div>
                      </td>

                      {/* Guest Info */}
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm">
                          <div className="font-medium text-gray-900">{(complaint as any).guest_name || complaint.guest?.full_name || 'Guest'}</div>
                          <div className="text-gray-600 text-xs">{complaint.guest?.email || ''}</div>
                          {complaint.room_number && (
                            <div className="text-gray-600 text-xs">Room {complaint.room_number}</div>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="flex items-center space-x-2">
                          {getCategoryIcon((complaint as any).category_display || complaint.category?.name || complaint.category, "h-4 w-4 text-gray-600")}
                          <span className="text-sm text-gray-700">{(complaint as any).category_display || complaint.category?.name || complaint.category}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{complaint.assigned_department?.name || 'Unassigned'}</div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 border border-gray-200">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(complaint.status)}`}>
                          {complaint.status.replace('_', ' ')}
                        </span>
                        <div className="flex items-center space-x-3 mt-1">
                          {complaint.response_count > 0 && (
                            <div className="text-xs text-gray-500 flex items-center space-x-1">
                              <Mail01Icon className="h-3 w-3" />
                              <span>{complaint.response_count} response{complaint.response_count !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {complaint.image_count > 0 && (
                            <div className="text-xs text-gray-500 flex items-center space-x-1">
                              <ViewIcon className="h-3 w-3" />
                              <span>{complaint.image_count} image{complaint.image_count !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                        {complaint.is_escalated && (
                          <div className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                            <SparklesIcon className="h-3 w-3" />
                            <span>Escalated</span>
                          </div>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4 border border-gray-200">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                        {complaint.follow_up_required && (
                          <div className="text-xs text-orange-600 mt-1 flex items-center space-x-1">
                            <Clock01Icon className="h-3 w-3" />
                            <span>Follow-up due</span>
                          </div>
                        )}
                        {complaint.is_overdue && (
                          <div className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                            <CancelCircleIcon className="h-3 w-3" />
                            <span>Overdue</span>
                          </div>
                        )}
                      </td>

                      {/* Assigned To */}
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm text-gray-900">
                          {complaint.assigned_to_name || 'Unassigned'}
                        </div>
                      </td>

                      {/* Created */}
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="text-sm text-gray-900">
                          {formatDateTime(complaint.created_at)}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 border border-gray-200">
                        <div className="relative" ref={openDropdown === complaint.id ? dropdownRef : null}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === complaint.id ? null : complaint.id)}
                            className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            •••
                          </button>
                          {openDropdown === complaint.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-300 border py-1 z-10">
                              <Link
                                href={`/complaints/${complaint.complaint_number}`}
                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <EyeIcon className="h-4 w-4 inline mr-2" />
                                View Details
                              </Link>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => handleEditComplaint(complaint)}
                              >
                                <PencilEdit02Icon className="h-4 w-4 inline mr-2" />
                                Update Status
                              </button>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                onClick={() => {
                                  setSelectedComplaint(complaint);
                                  setShowAssignStaffDialog(true);
                                  setOpenDropdown(null);
                                }}
                              >
                                <UserCheckIcon className="h-4 w-4 inline mr-2" />
                                Assign Staff
                              </button>
                              <div className="border-t border-gray-100 my-1"></div>
                              <button
                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                onClick={() => handleCloseComplaint(complaint)}
                                disabled={complaint.status === 'CLOSED'}
                              >
                                <CancelCircleIcon className="h-4 w-4 inline mr-2" />
                                {complaint.status === 'CLOSED' ? 'Already Closed' : 'Close Complaint'}
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
                      <FilterIcon className="h-4 w-4 text-white" />
                    </div>
                    <button
                      onClick={() => setShowAdvancedFilter(false)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Cancel01Icon className="h-4 w-4" />
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
            <Mail01Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}

        {/* Complaint Form Modal */}
        {showComplaintForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">New Complaint</h3>
                    <p className="text-sm text-gray-600 mt-1">Submit a new guest complaint</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                      <Alert01Icon className="h-4 w-4 text-white" />
                    </div>
                    <button
                      onClick={() => setShowComplaintForm(false)}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Cancel01Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Content - Form */}
              <form onSubmit={handleSubmitComplaint} className="p-6 bg-gray-50">
                {formError && (
                  <div className="mb-4 bg-red-50 border border-red-200 p-4">
                    <div className="flex items-center space-x-2">
                      <Alert01Icon className="h-5 w-5 text-red-600" />
                      <span className="text-red-800">{formError}</span>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Guest Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Guest <span className="text-red-600">*</span>
                    </label>
                    <select
                      required
                      value={formData.guest_id}
                      onChange={(e) => setFormData({ ...formData, guest_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    >
                      <option value="">Select a guest</option>
                      {guests.map((guest) => (
                        <option key={guest.id} value={guest.id}>
                          {guest.full_name} - {guest.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room Selection (Optional) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Room (Optional)</label>
                    <select
                      value={formData.room_id}
                      onChange={(e) => setFormData({ ...formData, room_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    >
                      <option value="">No specific room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.id}>
                          Room {room.number} - {room.room_type_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category and Priority */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category <span className="text-red-600">*</span>
                      </label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                      >
                        <option value="SERVICE">Service</option>
                        <option value="ROOM">Room</option>
                        <option value="FACILITY">Facility</option>
                        <option value="BILLING">Billing</option>
                        <option value="FOOD">Food & Beverage</option>
                        <option value="CLEANLINESS">Cleanliness</option>
                        <option value="NOISE">Noise</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Priority <span className="text-red-600">*</span>
                      </label>
                      <select
                        required
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Incident Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Incident Date</label>
                    <input
                      type="date"
                      value={formData.incident_date}
                      onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="Brief summary of the complaint"
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Detailed description of the complaint..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                    />
                  </div>

                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Evidence Images (Optional)
                    </label>
                    <div className="space-y-3">
                      {/* File Input */}
                      <div className="flex items-center space-x-3">
                        <label className="cursor-pointer flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors">
                          <Add01Icon className="h-4 w-4" />
                          <span>Add Images</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                            className="hidden"
                            disabled={selectedImages.length >= 5}
                          />
                        </label>
                        <span className="text-xs text-gray-500">
                          {selectedImages.length}/5 images selected
                        </span>
                      </div>

                      {/* Image Previews */}
                      {imagePreviews.length > 0 && (
                        <div className="grid grid-cols-5 gap-2">
                          {imagePreviews.map((preview, index) => (
                            <div key={index} className="relative aspect-square bg-gray-100">
                              <img
                                src={preview}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1 right-1 w-5 h-5 bg-red-600 text-white flex items-center justify-center hover:bg-red-700 transition-colors"
                              >
                                <Cancel01Icon className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowComplaintForm(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50"
                    disabled={formLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#005357] text-white text-sm hover:bg-[#004147] disabled:opacity-50"
                    disabled={formLoading}
                  >
                    {formLoading ? 'Submitting...' : 'Submit Complaint'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Complaint Dialog */}
        {showEditDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Dialog Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Update Complaint Status</h3>
                    {selectedComplaint && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedComplaint.complaint_number}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                      <PencilEdit02Icon className="h-4 w-4 text-white" />
                    </div>
                    <button
                      onClick={() => {
                        setShowEditDialog(false);
                        setSelectedComplaint(null);
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Cancel01Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Dialog Content */}
              <div className="p-6 bg-gray-50">
                {selectedComplaint && (
                  <div className="mb-4 p-4 bg-gray-100 border border-gray-200 rounded">
                    <p className="text-sm font-medium text-gray-900">{selectedComplaint.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Guest: {(selectedComplaint as any).guest_name || selectedComplaint.guest?.full_name}
                    </p>
                    <p className="text-xs text-gray-600">
                      Priority: <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(selectedComplaint.priority)}`}>
                        {selectedComplaint.priority}
                      </span>
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status <span className="text-red-600">*</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                  >
                    <option value="SUBMITTED">Submitted</option>
                    <option value="ACKNOWLEDGED">Acknowledged</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="UNDER_REVIEW">Under Review</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-2">
                    Only the complaint status can be updated. Use "Close Complaint" for proper closure with reason.
                  </p>
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowEditDialog(false);
                    setSelectedComplaint(null);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitEdit}
                  className="px-4 py-2 bg-[#005357] text-white text-sm hover:bg-[#004147] disabled:opacity-50"
                  disabled={formLoading}
                >
                  {formLoading ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Close Complaint Dialog */}
        {showCloseDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full">
              {/* Dialog Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Close Complaint</h3>
                    {selectedComplaint && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedComplaint.complaint_number}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-red-600 flex items-center justify-center">
                      <CancelCircleIcon className="h-4 w-4 text-white" />
                    </div>
                    <button
                      onClick={() => {
                        setShowCloseDialog(false);
                        setSelectedComplaint(null);
                        setCloseReason('');
                      }}
                      className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Cancel01Icon className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Dialog Content */}
              <div className="p-6 bg-gray-50">
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> Closing this complaint will mark it as resolved and no further action will be taken.
                  </p>
                </div>

                {selectedComplaint && (
                  <div className="mb-4 p-4 bg-gray-100 border border-gray-200 rounded">
                    <p className="text-sm font-medium text-gray-900">{selectedComplaint.title}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Guest: {(selectedComplaint as any).guest_name || selectedComplaint.guest?.full_name}
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Closure Reason <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={closeReason}
                    onChange={(e) => setCloseReason(e.target.value)}
                    placeholder="Please provide a detailed reason for closing this complaint (minimum 10 characters)"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 10 characters required
                  </p>
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCloseDialog(false);
                    setSelectedComplaint(null);
                    setCloseReason('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitClose}
                  className="px-4 py-2 bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
                  disabled={formLoading || !closeReason.trim() || closeReason.trim().length < 10}
                >
                  {formLoading ? 'Closing...' : 'Close Complaint'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Staff Dialog */}
        {showAssignStaffDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full">
              {/* Dialog Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Assign Staff</h3>
                    {selectedComplaint && (
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedComplaint.complaint_number} - {selectedComplaint.title}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setShowAssignStaffDialog(false);
                      setSelectedComplaint(null);
                      setSelectedStaffId('');
                    }}
                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <Cancel01Icon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Dialog Content */}
              <div className="p-6 bg-gray-50">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Staff Member
                  </label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm"
                  >
                    <option value="">-- Select Staff --</option>
                    {staffMembers.map((staff: any) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.first_name} {staff.last_name} ({staff.email})
                      </option>
                    ))}
                  </select>
                  {selectedComplaint?.assigned_to && (
                    <p className="text-xs text-gray-500 mt-2">
                      Currently assigned to: {selectedComplaint.assigned_to_name || 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              {/* Dialog Footer */}
              <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignStaffDialog(false);
                    setSelectedComplaint(null);
                    setSelectedStaffId('');
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm hover:bg-gray-50 transition-colors"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignStaff}
                  className="px-4 py-2 bg-[#005357] text-white text-sm hover:bg-[#004147] disabled:opacity-50"
                  disabled={formLoading || !selectedStaffId}
                >
                  {formLoading ? 'Assigning...' : 'Assign Staff'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ComplaintsPage;