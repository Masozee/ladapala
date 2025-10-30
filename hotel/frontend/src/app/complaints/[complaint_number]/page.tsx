'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLayout, { HeaderActions } from '@/components/AppLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  ChevronLeftIcon,
  AlertCircleIcon,
  Mail01Icon,
  UserIcon,
  Clock01Icon,
  UserCheckIcon,
  PencilEdit02Icon,
  SparklesIcon,
  Call02Icon,
  Building03Icon,
  File01Icon,
  Add01Icon,
  PackageIcon,
  Shield01Icon,
  HeadphonesIcon,
  BedIcon,
  UserMultipleIcon,
  CancelCircleIcon,
  ViewIcon,
  ArrowUp01Icon,
  ChevronDownIcon,
  EyeIcon,
  Cancel01Icon,
  Alert01Icon,
  Delete02Icon
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
  response_type: 'ACKNOWLEDGMENT' | 'UPDATE' | 'RESOLUTION' | 'FOLLOW_UP' | 'INTERNAL_NOTE' | 'GUEST_COMMUNICATION';
  message: string;
  visibility: 'GUEST' | 'INTERNAL' | 'MANAGEMENT';
  responded_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
  } | null;
  department: any;
  action_taken: string | null;
  estimated_resolution_date: string | null;
  requires_follow_up: boolean;
  follow_up_date: string | null;
  guest_notified: boolean;
  guest_notified_at: string | null;
  notification_method: string | null;
  attachments: any[];
  created_at: string;
  updated_at: string;
}

interface TimelineEvent {
  id: string;
  type: 'complaint_created' | 'status_change' | 'response' | 'assignment' | 'resolution';
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  user_role?: string;
  status_from?: string;
  status_to?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ComplaintImage {
  id: number;
  image: string;
  image_url: string;
  caption: string | null;
  is_evidence: boolean;
  uploaded_by: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    full_name: string;
    email: string;
  } | null;
  created_at: string;
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
  guest: number;
  guest_name?: string;
  guest_details?: Guest;
  room_number?: string;
  incident_date: string;
  assigned_to?: any;
  assigned_to_name?: string;
  assigned_department?: AssignedDepartment;
  is_escalated: boolean;
  follow_up_required: boolean;
  is_overdue: boolean;
  response_time?: number;
  image_count: number;
  response_count: number;
  responses: ComplaintResponse[];
  images: ComplaintImage[];
  created_at: string;
  updated_at: string;
}

const ComplaintDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newResponse, setNewResponse] = useState('');
  const [newActionTaken, setNewActionTaken] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [responseSuccess, setResponseSuccess] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  
  // Image upload states
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [imageUploadSuccess, setImageUploadSuccess] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imageCaption, setImageCaption] = useState('');
  const [isEvidence, setIsEvidence] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState<string | null>(null);

  useEffect(() => {
    // No authentication required for now

    const loadComplaint = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl(`hotel/complaints/by-number/${params.complaint_number}/`), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          mode: 'cors',
          credentials: 'omit'
        });
        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Complaint not found');
        }
        const data = await response.json();
        setComplaint(data);
        setError(null);
      } catch (err) {
        console.error('Error loading complaint:', err);
        if (err instanceof TypeError && err.message === 'Failed to fetch') {
          setError('Unable to connect to the server. Please check your internet connection.');
        } else {
          setError('Failed to load complaint details');
        }
      } finally {
        setLoading(false);
      }
    };

    if (params.complaint_number) {
      loadComplaint();
    }
  }, [params.complaint_number, router]);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
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

  const handleAddResponse = async () => {
    if (!newResponse.trim() || !complaint) return;

    setSubmittingResponse(true);
    setResponseError(null);
    setResponseSuccess(null);

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`hotel/complaints/${complaint.id}/add_response/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({
          message: newResponse,
          action_taken: newActionTaken || null,
          response_type: 'UPDATE',
          visibility: 'GUEST'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to add response');
      }

      // Reload the complaint to get updated data
      const complaintResponse = await fetch(buildApiUrl(`hotel/complaints/by-number/${complaint.complaint_number}/`), {
        credentials: 'include'
      });
      if (complaintResponse.ok) {
        const updatedComplaint = await complaintResponse.json();
        setComplaint(updatedComplaint);
      }

      setNewResponse('');
      setNewActionTaken('');
      setResponseSuccess('Response added successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setResponseSuccess(null), 3000);
    } catch (err) {
      setResponseError('Failed to add response. Please try again.');
      console.error('Error adding response:', err);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || !complaint) return;

    setUpdatingStatus(true);
    setStatusError(null);
    setStatusSuccess(null);

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`hotel/complaints/${complaint.id}/`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      const updatedComplaint = await response.json();
      setComplaint(updatedComplaint);
      setNewStatus('');
      setStatusSuccess('Status updated successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setStatusSuccess(null), 3000);
    } catch (err) {
      setStatusError('Failed to update status. Please try again.');
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setImageUploadError('Please select a valid image file (JPG, PNG, GIF, WebP)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setImageUploadError('Image size must be less than 10MB');
        return;
      }
      
      setSelectedImage(file);
      setImageUploadError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !complaint) return;

    setUploadingImage(true);
    setImageUploadError(null);
    setImageUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedImage);
      formData.append('complaint', complaint.id.toString());
      if (imageCaption) {
        formData.append('caption', imageCaption);
      }
      formData.append('is_evidence', isEvidence.toString());

      // Get CSRF token
      const csrfToken = getCsrfToken();
      const headers: HeadersInit = {};
      if (csrfToken) {
        headers['X-CSRFToken'] = csrfToken;
      }

      const response = await fetch(buildApiUrl('hotel/complaint-images/'), {
        method: 'POST',
        headers: headers,
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Image upload error:', errorData);
        throw new Error(errorData.detail || errorData.error || 'Failed to upload image');
      }

      // Clear form
      setSelectedImage(null);
      setImageCaption('');
      setIsEvidence(false);
      setPreviewImage(null);
      setImageUploadSuccess('Image uploaded successfully!');

      // Reload complaint data
      const complaintResponse = await fetch(buildApiUrl(`hotel/complaints/by-number/${complaint.complaint_number}/`), {
        credentials: 'include'
      });
      if (complaintResponse.ok) {
        const updatedComplaint = await complaintResponse.json();
        setComplaint(updatedComplaint);
      }

      setTimeout(() => setImageUploadSuccess(null), 3000);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload image. Please try again.';
      setImageUploadError(errorMessage);
      console.error('Error uploading image:', err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!complaint) return;

    if (!confirm('Are you sure you want to delete this image?')) return;

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`hotel/complaint-images/${imageId}/`), {
        method: 'DELETE',
        headers: {
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      // Reload complaint data
      const complaintResponse = await fetch(buildApiUrl(`hotel/complaints/by-number/${complaint.complaint_number}/`), {
        credentials: 'include'
      });
      if (complaintResponse.ok) {
        const updatedComplaint = await complaintResponse.json();
        setComplaint(updatedComplaint);
      }
      alert('Image deleted successfully!');
    } catch (err) {
      console.error('Error deleting image:', err);
      alert('Failed to delete image. Please try again.');
    }
  };

  const getEventIconColor = (type: string) => {
    switch (type) {
      case 'complaint_created': return 'bg-red-500';
      case 'assignment': return 'bg-purple-500';
      case 'response': return 'bg-green-500';
      case 'status_change': return 'bg-yellow-500';
      case 'resolution': return 'bg-blue-500';
      default: return 'bg-[#005357]';
    }
  };

  const generateTimelineEvents = (complaint: Complaint): TimelineEvent[] => {
    const events: TimelineEvent[] = [];
    
    // Initial complaint created
    events.push({
      id: 'created',
      type: 'complaint_created',
      title: 'Complaint Submitted',
      description: `Guest ${complaint.guest_details?.full_name || complaint.guest_name || 'Unknown'} submitted a complaint about "${complaint.title}"`,
      timestamp: complaint.created_at,
      user: complaint.guest_details?.full_name || complaint.guest_name || 'Unknown',
      user_role: 'Guest',
      icon: AlertCircleIcon,
      color: 'bg-red-100 text-red-800'
    });

    // Assignment event (if assigned)
    if (complaint.assigned_department) {
      events.push({
        id: 'assigned',
        type: 'assignment',
        title: 'Complaint Assigned',
        description: `Assigned to ${complaint.assigned_department?.name || 'Unknown Department'}`,
        timestamp: complaint.created_at, // In real app, would have separate timestamp
        user: 'System',
        user_role: 'System',
        icon: UserCheckIcon,
        color: 'bg-purple-100 text-purple-800'
      });
    }

    // Status changes (simulated - in real app would track actual status changes)
    if (complaint.status === 'IN_PROGRESS') {
      events.push({
        id: 'status-progress',
        type: 'status_change',
        title: 'Status Updated',
        description: 'Complaint status changed to In Progress',
        timestamp: complaint.updated_at,
        status_from: 'SUBMITTED',
        status_to: 'IN_PROGRESS',
        icon: Clock01Icon,
        color: 'bg-yellow-100 text-yellow-800'
      });
    }

    // Resolution event (if resolved)
    if (complaint.status === 'RESOLVED' || complaint.status === 'CLOSED') {
      events.push({
        id: 'resolved',
        type: 'resolution',
        title: 'Complaint Resolved',
        description: 'Complaint has been marked as resolved',
        timestamp: complaint.updated_at,
        icon: UserCheckIcon,
        color: 'bg-blue-100 text-blue-800'
      });
    }

    // Sort events by timestamp
    return events.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  };

  if (loading || !complaint) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="p-6">
          <div className="text-center">
            <Alert01Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complaint Not Found</h2>
            <p className="text-gray-600 mb-6">{error || "The complaint you're looking for doesn't exist or has been removed."}</p>
            <Link 
              href="/complaints"
              className="inline-flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 hover:bg-[#004147] transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              <span>Back to Complaints</span>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <Link 
            href="/complaints"
            className="inline-flex items-center space-x-2 text-gray-600 hover:text-[#005357] transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Complaints</span>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-gray-900">Complaint Details</h1>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded ${getStatusColor(complaint.status)}`}>
                  {complaint.status ? complaint.status.replace('_', ' ') : 'Unknown'}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded ${getPriorityColor(complaint.priority)}`}>
                  {complaint.priority}
                </span>
              </div>
              <p className="text-gray-600 mt-2">
                {complaint.complaint_number} • Created on {formatDateTime(complaint.created_at)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors">
                <PencilEdit02Icon className="h-4 w-4" />
                <span>Update Status</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Guest Information */}
          <div className="bg-[#005357] p-6 sticky top-6 self-start">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-white">Guest Information & Complaint Details</h2>
              <p className="text-green-100">Information provided by the guest</p>
            </div>
            
            <div className="space-y-6">
            {/* Guest Information */}
            <div className="bg-[#004147] border border-gray-200">
              <div className="p-6 border-b border-[#003035]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Guest Information</h3>
                    <p className="text-sm text-green-100 mt-1">Contact details and reservation info</p>
                  </div>
                  <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                    <UserIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-[#003035]">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-green-200">Guest Name</label>
                    <p className="text-white font-bold text-lg">{complaint.guest_name || complaint.guest_details?.full_name || 'N/A'}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center space-x-2">
                      <Mail01Icon className="h-4 w-4 text-green-300" />
                      <span className="text-green-100">{complaint.guest_details?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Call02Icon className="h-4 w-4 text-green-300" />
                      <span className="text-green-100">{complaint.guest_details?.phone || 'N/A'}</span>
                    </div>
                    {complaint.room_number && (
                      <div className="flex items-center space-x-2">
                        <Building03Icon className="h-4 w-4 text-green-300" />
                        <span className="text-green-100">Room {complaint.room_number}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Complaint Description */}
            <div className="bg-[#004147] border border-gray-200">
              <div className="p-6 border-b border-[#003035]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Complaint Description</h3>
                    <p className="text-sm text-green-100 mt-1">Guest's detailed complaint</p>
                  </div>
                  <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                    <Mail01Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-[#003035]">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-3">{complaint.title}</h4>
                    <p className="text-green-100 leading-relaxed whitespace-pre-wrap">
                      {complaint.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Attachments */}
            <div className="bg-[#004147] border border-gray-200">
              <div className="p-6 border-b border-[#003035]">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">Attachments</h3>
                    <p className="text-sm text-green-100 mt-1">Supporting documents and images</p>
                  </div>
                  <div className="w-8 h-8 bg-[#2baf6a] flex items-center justify-center">
                    <PackageIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-[#003035]">
                {complaint.image_count > 0 ? (
                  <div className="space-y-2">
                    <div className="text-center py-4">
                      <File01Icon className="h-12 w-12 text-green-300 mx-auto mb-2" />
                      <p className="text-green-100">{complaint.image_count} image{complaint.image_count !== 1 ? 's' : ''} attached</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PackageIcon className="h-12 w-12 text-green-300 mx-auto mb-2" />
                    <p className="text-green-100">No attachments</p>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          {/* Middle Column - Internal Details */}
          <div className="space-y-6">
            {/* Complaint Details */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Internal Details</h3>
                    <p className="text-sm text-gray-600 mt-1">Category and assignment information</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-600 flex items-center justify-center">
                    {getCategoryIcon((complaint as any).category_display || complaint.category?.name || complaint.category || '')}
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Category</label>
                    <div className="flex items-center space-x-2 mt-1">
                      {getCategoryIcon((complaint as any).category_display || complaint.category?.name || complaint.category || '', "h-4 w-4 text-gray-600")}
                      <span className="font-medium text-gray-900">{(complaint as any).category_display || complaint.category?.name || complaint.category || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Department</label>
                    <p className="text-gray-900 font-medium">{complaint.assigned_department?.name || 'Unassigned'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Assigned To</label>
                    <p className="text-gray-900 font-medium">{complaint.assigned_to_name || 'Unassigned'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Source</label>
                    <p className="text-gray-900">{complaint.source ? complaint.source.replace('_', ' ') : 'N/A'}</p>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-600">Incident Date</label>
                    <p className="text-gray-900">{formatDateTime(complaint.incident_date)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Information */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Status Information</h3>
                    <p className="text-sm text-gray-600 mt-1">Follow-up and status details</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-600 flex items-center justify-center">
                    <SparklesIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-4">
                  {complaint.follow_up_required && (
                    <div className="p-3 bg-orange-50 border border-orange-200 rounded">
                      <div className="flex items-center space-x-2 text-orange-800">
                        <Clock01Icon className="h-4 w-4" />
                        <span className="font-medium">Follow-up Required</span>
                      </div>
                    </div>
                  )}

                  {complaint.is_escalated && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-center space-x-2 text-red-800">
                        <SparklesIcon className="h-4 w-4" />
                        <span className="font-medium">Complaint Escalated</span>
                      </div>
                    </div>
                  )}

                  {complaint.is_overdue && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded">
                      <div className="flex items-center space-x-2 text-red-800">
                        <CancelCircleIcon className="h-4 w-4" />
                        <span className="font-medium">Overdue Response</span>
                      </div>
                    </div>
                  )}

                  <div className="text-sm text-gray-600">
                    <p><span className="font-medium">Created:</span> {formatDateTime(complaint.created_at)}</p>
                    <p><span className="font-medium">Last Updated:</span> {formatDateTime(complaint.updated_at)}</p>
                    {complaint.response_count > 0 && (
                      <p><span className="font-medium">Responses:</span> {complaint.response_count}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                    <p className="text-sm text-gray-600 mt-1">Update complaint status</p>
                  </div>
                  <div className="w-8 h-8 bg-gray-600 flex items-center justify-center">
                    <Shield01Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-3">
                  {statusError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
                      {statusError}
                    </div>
                  )}
                  {statusSuccess && (
                    <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded">
                      {statusSuccess}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Change Status</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      disabled={updatingStatus}
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm disabled:opacity-50"
                    >
                      <option value="">Select new status...</option>
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  </div>
                  <button 
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || updatingStatus}
                    className="w-full bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors disabled:opacity-50"
                  >
                    {updatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Timeline & Actions */}
          <div className="space-y-6">
            {/* Images Section */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Images</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {complaint?.images?.length || 0} image{(complaint?.images?.length || 0) !== 1 ? 's' : ''} attached
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <ViewIcon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                {/* Existing Images */}
                {complaint?.images && complaint.images.length > 0 ? (
                  <div className="mb-6">
                    <div className="grid grid-cols-2 gap-3">
                      {complaint.images.map((image) => (
                        <div key={image.id} className="relative group">
                          <div className="aspect-square bg-gray-100 border overflow-hidden">
                            <img
                              src={image.image_url}
                              alt={image.caption || 'Complaint image'}
                              className="w-full h-full object-cover cursor-pointer transition-all"
                              onClick={() => setShowImageModal(image.image_url)}
                            />
                          </div>

                          {/* Image overlay - only visible on hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-2">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setShowImageModal(image.image_url)}
                                className="bg-white text-gray-700 p-2 rounded hover:bg-gray-100 transition-colors shadow-lg"
                                title="View full size"
                              >
                                <EyeIcon className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteImage(image.id)}
                                className="bg-red-600 text-white p-2 rounded hover:bg-red-700 transition-colors shadow-lg"
                                title="Delete image"
                              >
                                <Delete02Icon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Image info */}
                          <div className="mt-2">
                            {image.caption && (
                              <p className="text-xs text-gray-600 mb-1">{image.caption}</p>
                            )}
                            {image.is_evidence && (
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                                Evidence
                              </span>
                            )}
                            <div className="text-xs text-gray-500 mt-1">
                              By {image.uploaded_by?.full_name || image.uploaded_by?.username || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDateTime(image.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 mb-6">
                    <ViewIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No images attached</p>
                  </div>
                )}
                
                {/* Upload New Image */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Upload New Image</h4>
                  
                  {imageUploadError && (
                    <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
                      {imageUploadError}
                    </div>
                  )}
                  
                  {imageUploadSuccess && (
                    <div className="mb-3 text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded">
                      {imageUploadSuccess}
                    </div>
                  )}
                  
                  {/* File input */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      disabled={uploadingImage}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-medium file:bg-[#005357] file:text-white hover:file:bg-[#004147] file:cursor-pointer disabled:opacity-50"
                    />
                  </div>
                  
                  {/* Preview */}
                  {previewImage && (
                    <div className="mb-3">
                      <img
                        src={previewImage}
                        alt="Preview"
                        className="w-32 h-32 object-cover border"
                      />
                    </div>
                  )}
                  
                  {/* Caption input */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Caption (Optional)</label>
                    <input
                      type="text"
                      value={imageCaption}
                      onChange={(e) => setImageCaption(e.target.value)}
                      disabled={uploadingImage}
                      placeholder="Describe the image..."
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm disabled:opacity-50"
                    />
                  </div>
                  
                  {/* Evidence checkbox */}
                  <div className="mb-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={isEvidence}
                        onChange={(e) => setIsEvidence(e.target.checked)}
                        disabled={uploadingImage}
                        className="h-4 w-4 text-[#005357] focus:ring-[#005357] border-gray-300 disabled:opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Mark as evidence</span>
                    </label>
                  </div>
                  
                  {/* Upload button */}
                  <button
                    onClick={handleImageUpload}
                    disabled={!selectedImage || uploadingImage}
                    className="w-full flex items-center justify-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors disabled:opacity-50"
                  >
                    <ArrowUp01Icon className="h-4 w-4" />
                    <span>{uploadingImage ? 'Uploading...' : 'Upload Image'}</span>
                  </button>
                </div>
              </div>
            </div>
            {/* Complaint Timeline */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Complaint Timeline</h3>
                    <p className="text-sm text-gray-600 mt-1">Complete history from submission to resolution</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <Clock01Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-gray-50">
                <div className="flow-root">
                  <ul className="-mb-8">
                    {generateTimelineEvents(complaint).map((event, eventIdx) => (
                      <li key={event.id}>
                        <div className="relative pb-8">
                          {eventIdx !== generateTimelineEvents(complaint).length - 1 ? (
                            <span
                              className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                              aria-hidden="true"
                            />
                          ) : null}
                          <div className="relative flex space-x-3">
                            <div>
                              <span className={`h-8 w-8 rounded-full ${getEventIconColor(event.type)} flex items-center justify-center ring-8 ring-white`}>
                                <event.icon className="h-4 w-4 text-white" aria-hidden="true" />
                              </span>
                            </div>
                            <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{event.title}</p>
                                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{event.description}</p>
                                {event.user && (
                                  <p className="text-xs text-gray-500 mt-1">
                                    by {event.user} {event.user_role && `(${event.user_role})`}
                                  </p>
                                )}
                                {event.type === 'response' && (
                                  <div className="mt-2 text-xs">
                                    <span className={`inline-flex px-2 py-1 rounded ${event.color}`}>
                                      Staff Response
                                    </span>
                                  </div>
                                )}
                                {event.type === 'status_change' && event.status_from && event.status_to && (
                                  <div className="mt-2 text-xs">
                                    <span className="text-gray-500">
                                      Status changed from <span className="font-medium">{event.status_from}</span> to <span className="font-medium">{event.status_to}</span>
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="whitespace-nowrap text-right text-sm text-gray-500">
                                <time dateTime={event.timestamp}>
                                  {formatDateTime(event.timestamp)}
                                </time>
                              </div>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Responses Section */}
            {complaint.responses && complaint.responses.length > 0 && (
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Responses</h3>
                      <p className="text-sm text-gray-600 mt-1">{complaint.responses.length} response{complaint.responses.length !== 1 ? 's' : ''} to this complaint</p>
                    </div>
                    <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                      <Mail01Icon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="space-y-4">
                    {complaint.responses.map((response, index) => (
                      <div key={response.id} className="bg-white border-l-4 border-[#005357] p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center space-x-2 mb-1">
                              <span className={`px-2 py-1 text-xs font-medium rounded ${
                                response.response_type === 'RESOLUTION' ? 'bg-green-100 text-green-800' :
                                response.response_type === 'ACKNOWLEDGMENT' ? 'bg-blue-100 text-blue-800' :
                                response.response_type === 'FOLLOW_UP' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {response.response_type ? response.response_type.replace('_', ' ') : 'Unknown'}
                              </span>
                              {response.visibility === 'INTERNAL' && (
                                <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">
                                  Internal Only
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">
                                {response.responded_by ? (
                                  response.responded_by.full_name || response.responded_by.username
                                ) : 'Anonymous'}
                              </span>
                              {' • '}
                              <time dateTime={response.created_at}>
                                {formatDateTime(response.created_at)}
                              </time>
                            </div>
                          </div>
                          <div className="text-right text-xs text-gray-500">
                            #{index + 1}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <p className="text-gray-900 whitespace-pre-wrap">{response.message}</p>
                        </div>
                        
                        {response.action_taken && (
                          <div className="mb-3 p-3 bg-blue-50 border border-blue-200">
                            <div className="text-sm font-medium text-blue-900 mb-1">Action Taken:</div>
                            <div className="text-sm text-blue-800">{response.action_taken}</div>
                          </div>
                        )}
                        
                        {response.requires_follow_up && (
                          <div className="flex items-center text-sm text-orange-600">
                            <Clock01Icon className="h-4 w-4 mr-1" />
                            <span>Follow-up required</span>
                            {response.follow_up_date && (
                              <span className="ml-2">by {formatDateTime(response.follow_up_date)}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Add Response */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Add Response</h3>
                    <p className="text-sm text-gray-600 mt-1">Respond to the guest's complaint</p>
                  </div>
                  <div className="w-8 h-8 bg-[#005357] flex items-center justify-center">
                    <Add01Icon className="h-4 w-4 text-white" />
                  </div>
                </div>
              </div>
              <div className="p-4 bg-gray-50">
                <div className="space-y-4">
                  {responseError && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
                      {responseError}
                    </div>
                  )}
                  {responseSuccess && (
                    <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded">
                      {responseSuccess}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Response Message</label>
                    <textarea
                      value={newResponse}
                      onChange={(e) => setNewResponse(e.target.value)}
                      disabled={submittingResponse}
                      placeholder="Type your response to the guest..."
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm disabled:opacity-50"
                      rows={4}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Actions Taken (Optional)</label>
                    <textarea
                      value={newActionTaken}
                      onChange={(e) => setNewActionTaken(e.target.value)}
                      disabled={submittingResponse}
                      placeholder="Describe what actions were taken to resolve the issue..."
                      className="w-full px-3 py-2 border border-gray-300 focus:ring-[#005357] focus:border-[#005357] text-sm disabled:opacity-50"
                      rows={3}
                    />
                  </div>
                  
                  <button 
                    onClick={handleAddResponse}
                    disabled={!newResponse.trim() || submittingResponse}
                    className="w-full flex items-center justify-center space-x-2 bg-[#005357] text-white px-4 py-2 text-sm font-medium hover:bg-[#004147] transition-colors disabled:opacity-50"
                  >
                    <Mail01Icon className="h-4 w-4" />
                    <span>{submittingResponse ? 'Sending...' : 'Send Response'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50" onClick={() => setShowImageModal(null)}>
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setShowImageModal(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <Cancel01Icon className="h-8 w-8" />
            </button>
            <img
              src={showImageModal}
              alt="Full size view"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </AppLayout>
  );
};

export default ComplaintDetailPage;