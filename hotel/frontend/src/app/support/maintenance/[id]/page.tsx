'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import SupportLayout from '@/components/SupportLayout';
import { buildApiUrl } from '@/lib/config';
import {
  ChevronLeftIcon,
  Wrench01Icon,
  Clock01Icon,
  UserIcon,
  UserCheckIcon,
  CancelCircleIcon,
  AlertCircleIcon,
  Alert01Icon,
  Add01Icon,
  Building03Icon,
  Call02Icon,
  Mail01Icon,
  SparklesIcon,
  Calendar01Icon,
  Location01Icon,
  EyeIcon,
  File01Icon,
  ViewIcon,
  PackageIcon,
  Shield01Icon,
  Settings02Icon,
  PieChartIcon,
  Loading03Icon,
  UserMultipleIcon,
  CreditCardIcon,
  ArrowUp01Icon,
  PencilEdit02Icon
} from '@/lib/icons';

interface MaintenanceRequest {
  id: number | string;
  request_number?: string;
  ticket_number?: string;
  title: string;
  description: string;
  category: string;
  category_display?: string;
  priority: string;
  priority_display?: string;
  status: string;
  status_display?: string;
  source?: string;
  source_display?: string;
  location?: string;
  room?: number;
  room_number?: string;
  floor?: number;
  building_section?: string;
  guest?: number;
  guest_name?: string;
  reported_by?: string;
  reporter_role?: string;
  reporter_contact?: string;
  assigned_technician?: string;
  technician_notes?: string;
  technician_id?: number;
  requested_date?: string;
  acknowledged_date?: string;
  started_date?: string;
  completed_date?: string;
  created_at: string;
  updated_at: string;
  estimated_completion?: string;
  actual_completion?: string;
  estimated_cost?: number;
  actual_cost?: number;
  parts_needed?: string[];
  parts_cost?: number;
  labor_hours?: number;
  labor_cost?: number;
  guest_impact?: boolean;
  downtime_start?: string;
  downtime_end?: string;
  safety_issue?: boolean;
  warranty_covered?: boolean;
  vendor_required?: boolean;
  vendor_name?: string;
  notes?: string;
  photos?: string[];
  completion_notes?: string;
  guest_satisfaction?: number;
  customer_satisfaction?: number;
  preventive_maintenance?: boolean;
  next_service_date?: string;
  resolution_time_hours?: number;
  efficiency_score?: number;
  is_complaint?: boolean;
  complaint_id?: number;
}

const MaintenanceDetailPage = () => {
  const params = useParams();
  const requestId = params.id as string;
  const [request, setRequest] = useState<MaintenanceRequest | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'work-log'>('details');
  const [newLogEntry, setNewLogEntry] = useState('');
  const [showAssignTechnicianDialog, setShowAssignTechnicianDialog] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [rooms, setRooms] = useState<any[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<any[]>([]);

  // Form data for editing
  const [formData, setFormData] = useState({
    assigned_technician: '',
    estimated_completion: '',
    technician_notes: '',
    category: '',
    priority: '',
  });

  // Parts management
  const [parts, setParts] = useState<Array<{
    id: string;
    name: string;
    quantity: number;
    source: 'warehouse' | 'vendor';
    vendor_name?: string;
    warehouse_item_id?: number;
    available_stock?: number;
  }>>([]);
  const [showAddPartDialog, setShowAddPartDialog] = useState(false);
  const [newPart, setNewPart] = useState({
    name: '',
    quantity: 1,
    source: 'warehouse' as 'warehouse' | 'vendor',
    vendor_name: '',
    warehouse_item_id: null as number | null
  });

  useEffect(() => {
    const fetchMaintenanceRequest = async () => {
      try {
        let endpoint: string;

        // Check if this is a complaint (ID starts with "CMP" or "CPL")
        if (requestId.startsWith('CMP') || requestId.startsWith('CPL')) {
          endpoint = `hotel/maintenance-requests/complaint/${requestId}/`;
        } else {
          endpoint = `hotel/maintenance-requests/${requestId}/`;
        }

        console.log('Fetching from endpoint:', buildApiUrl(endpoint));
        const response = await fetch(buildApiUrl(endpoint));

        if (response.ok) {
          const data = await response.json();
          console.log('Received data:', data);
          setRequest(data);
          // If technician data is available in the response, set it
          // Otherwise, you might need a separate API call to fetch technician details
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch maintenance request. Status:', response.status, 'Response:', errorText);
        }
      } catch (error) {
        console.error('Error fetching maintenance request:', error);
      }
    };

    fetchMaintenanceRequest();
  }, [requestId]);

  // Fetch warehouse items
  useEffect(() => {
    const fetchWarehouseItems = async () => {
      try {
        const response = await fetch(buildApiUrl('hotel/warehouse-items/?is_active=true'));
        if (response.ok) {
          const data = await response.json();
          setWarehouseItems(data);
        }
      } catch (error) {
        console.error('Error fetching warehouse items:', error);
      }
    };

    fetchWarehouseItems();
  }, []);

  // Populate form data when request is loaded
  useEffect(() => {
    if (request) {
      setFormData({
        assigned_technician: request.assigned_technician || '',
        estimated_completion: request.estimated_completion || '',
        technician_notes: request.technician_notes || '',
        category: request.category || '',
        priority: request.priority || '',
      });

      // Load existing parts if any
      if (request.parts_needed && request.parts_needed.length > 0) {
        setParts(request.parts_needed.map((part, index) => ({
          id: `part-${index}`,
          name: part,
          quantity: 1,
          source: 'warehouse' as 'warehouse' | 'vendor',
        })));
      }
    }
  }, [request]);


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
      case 'OPEN': return 'bg-blue-100 text-blue-800';
      case 'ACKNOWLEDGED': return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED': return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS': return 'bg-orange-100 text-orange-800';
      case 'ON_HOLD': return 'bg-purple-100 text-purple-800';
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
      case 'EMERGENCY': return 'bg-red-200 text-red-900';
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


  const handleAddLogEntry = async () => {
    if (!newLogEntry.trim() || !request) {
      alert('Please enter a log entry');
      return;
    }

    try {
      setFormLoading(true);
      const { getCsrfToken } = await import('@/lib/config');
      const csrfToken = getCsrfToken();

      const isComplaint = requestId.startsWith('CMP') || requestId.startsWith('CPL');
      let endpoint: string;

      if (isComplaint) {
        endpoint = `hotel/complaints/${request.complaint_id}/`;
      } else {
        endpoint = `hotel/maintenance-requests/${requestId}/`;
      }

      // Append new log entry to existing notes
      const timestamp = new Date().toLocaleString();
      const engineer = request.assigned_technician || 'Engineer';
      const logEntry = `[${timestamp}] ${engineer}: ${newLogEntry}`;
      const updatedNotes = request.technician_notes
        ? `${request.technician_notes}\n\n${logEntry}`
        : logEntry;

      const response = await fetch(buildApiUrl(endpoint), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({ technician_notes: updatedNotes }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setRequest(updatedData);
        setNewLogEntry('');
        alert('Work log entry added successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add log entry');
      }
    } catch (error) {
      console.error('Error adding log entry:', error);
      alert('Failed to add log entry. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };


  const handleAddPart = () => {
    if (newPart.source === 'warehouse') {
      if (!newPart.warehouse_item_id) {
        alert('Please select an item from warehouse');
        return;
      }

      // Find the warehouse item to get stock info
      const warehouseItem = warehouseItems.find(item => item.id === newPart.warehouse_item_id);
      if (warehouseItem && newPart.quantity > warehouseItem.quantity) {
        alert(`Insufficient stock! Available: ${warehouseItem.quantity}`);
        return;
      }

      setParts([...parts, {
        id: `part-${Date.now()}`,
        name: warehouseItem?.name || newPart.name,
        quantity: newPart.quantity,
        source: 'warehouse',
        warehouse_item_id: newPart.warehouse_item_id,
        available_stock: warehouseItem?.quantity
      }]);
    } else {
      // Vendor part
      if (!newPart.name) {
        alert('Please enter part name');
        return;
      }
      if (!newPart.vendor_name) {
        alert('Please enter vendor name');
        return;
      }

      setParts([...parts, {
        id: `part-${Date.now()}`,
        name: newPart.name,
        quantity: newPart.quantity,
        source: 'vendor',
        vendor_name: newPart.vendor_name
      }]);
    }

    setNewPart({
      name: '',
      quantity: 1,
      source: 'warehouse',
      vendor_name: '',
      warehouse_item_id: null
    });
    setShowAddPartDialog(false);
  };

  const handleRemovePart = (partId: string) => {
    setParts(parts.filter(p => p.id !== partId));
  };

  const handleUpdateRequest = async () => {
    if (!request) return;

    try {
      setFormLoading(true);
      const { getCsrfToken } = await import('@/lib/config');
      const csrfToken = getCsrfToken();

      const isComplaint = requestId.startsWith('CMP') || requestId.startsWith('CPL');
      let endpoint: string;

      if (isComplaint) {
        endpoint = `hotel/complaints/${request.complaint_id}/`;
      } else {
        endpoint = `hotel/maintenance-requests/${requestId}/`;
      }

      const updateData: any = {};

      if (formData.assigned_technician) updateData.assigned_technician = formData.assigned_technician;
      if (formData.estimated_completion) updateData.estimated_completion = formData.estimated_completion;
      if (formData.technician_notes) updateData.technician_notes = formData.technician_notes;
      if (formData.category) updateData.category = formData.category;
      if (formData.priority) updateData.priority = formData.priority;

      // Include parts data
      if (parts.length > 0) {
        updateData.parts_needed = parts.map(p => `${p.name} (${p.quantity}x) - ${p.source === 'warehouse' ? 'Warehouse' : `Vendor: ${p.vendor_name}`}`);
      }

      const response = await fetch(buildApiUrl(endpoint), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken ? { 'X-CSRFToken': csrfToken } : {}),
        },
        credentials: 'include',
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedData = await response.json();
        setRequest(updatedData);
        alert('Request updated successfully!');
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update request');
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Failed to update request. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  if (!request) {
    return (
      <SupportLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Wrench01Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Loading request details...</h3>
          </div>
        </div>
      </SupportLayout>
    );
  }

  return (
    <SupportLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/support/maintenance"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Maintenance</span>
          </Link>
        </div>

        {/* Request Overview */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#F87B1B] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{request.request_number || request.ticket_number || `REQ-${request.id}`}</h3>
                <div className="text-sm text-gray-100 mt-1">
                  {request.title}
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Status & Priority */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Status & Priority</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-600 block mb-1">Status:</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(request.status)}`}>
                      {request.status_display || request.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Priority:</label>
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(request.priority)}`}>
                      {request.priority_display || request.priority}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 block mb-1">Category:</label>
                    <div className="flex items-center space-x-1">
                      <div className="text-[#F87B1B]">{getCategoryIcon(request.category?.toLowerCase())}</div>
                      <span className="text-sm text-gray-900">{request.category_display || getCategoryName(request.category?.toLowerCase())}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Location & Impact */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Location & Impact</h3>
                <div className="space-y-2 text-sm">
                  {(request.location || request.room_number) && (
                    <div className="flex items-center space-x-2">
                      <Location01Icon className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Location:</span>
                      <span className="text-gray-900">
                        {request.location || (request.room_number ? `Room ${request.room_number}` : 'N/A')}
                      </span>
                    </div>
                  )}
                  {request.building_section && (
                    <div className="flex items-center space-x-2">
                      <Building03Icon className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Section:</span>
                      <span className="text-gray-900">{request.building_section}</span>
                    </div>
                  )}
                  {request.guest_name && (
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-3 w-3 text-gray-400" />
                      <span className="text-gray-600">Guest:</span>
                      <span className="text-gray-900">{request.guest_name}</span>
                    </div>
                  )}
                  {request.guest_impact && (
                    <div className="flex items-center space-x-2 p-2 bg-orange-50 border border-orange-200 rounded">
                      <Alert01Icon className="h-3 w-3 text-orange-600" />
                      <span className="text-orange-800 text-xs font-medium">Guest Impact</span>
                    </div>
                  )}
                  {request.safety_issue && (
                    <div className="flex items-center space-x-2 p-2 bg-red-50 border border-red-200 rounded">
                      <Shield01Icon className="h-3 w-3 text-red-600" />
                      <span className="text-red-800 text-xs font-medium">Safety Issue</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Timeline</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Requested:</span>
                    <div className="text-gray-900">{formatDateTime(request.requested_date || request.created_at)}</div>
                  </div>
                  {request.acknowledged_date && (
                    <div>
                      <span className="text-gray-600">Acknowledged:</span>
                      <div className="text-yellow-600">{formatDateTime(request.acknowledged_date)}</div>
                    </div>
                  )}
                  {request.started_date && (
                    <div>
                      <span className="text-gray-600">Started:</span>
                      <div className="text-orange-600">{formatDateTime(request.started_date)}</div>
                    </div>
                  )}
                  {(request.completed_date || request.actual_completion) && (
                    <div>
                      <span className="text-gray-600">Completed:</span>
                      <div className="text-green-600">{formatDateTime(request.completed_date || request.actual_completion!)}</div>
                    </div>
                  )}
                  <div>
                    <label className="text-gray-600 block">Est. Completion:</label>
                    {request.estimated_completion ? (
                      <div className="text-gray-900">{formatDateTime(request.estimated_completion)}</div>
                    ) : (
                      <div className="text-gray-500 text-xs">Not set</div>
                    )}
                  </div>
                </div>
              </div>

            </div>
            
          </div>
        </div>

        {/* Assignment Summary - Shows what's assigned */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#F87B1B] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Work Assignment</h3>
                <p className="text-sm text-gray-100 mt-1">Engineer, parts, and work details</p>
              </div>
              <button
                onClick={() => setShowAssignTechnicianDialog(true)}
                className="px-4 py-2 bg-white text-[#F87B1B] text-sm font-medium rounded hover:bg-gray-100 transition-colors flex items-center space-x-2"
              >
                <PencilEdit02Icon className="h-4 w-4" />
                <span>Update Assignment</span>
              </button>
            </div>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Assigned Engineer */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Assigned Engineer</h4>
                {request.assigned_technician ? (
                  <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{request.assigned_technician}</p>
                      <p className="text-xs text-gray-600">Engineering Team</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-center">
                    <p className="text-sm text-yellow-800">Not assigned yet</p>
                  </div>
                )}
              </div>

              {/* Parts Summary */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Required Parts</h4>
                {parts.length > 0 ? (
                  <div className="p-3 bg-white border border-gray-200 rounded">
                    <p className="text-sm text-gray-900 font-medium">{parts.length} part(s) needed</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {parts.filter(p => p.source === 'warehouse').length} from warehouse, {parts.filter(p => p.source === 'vendor').length} from vendor
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-100 border border-dashed border-gray-300 rounded text-center">
                    <p className="text-sm text-gray-600">No parts specified</p>
                  </div>
                )}
              </div>

              {/* Notes Summary */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Work Notes</h4>
                {request.technician_notes ? (
                  <div className="p-3 bg-white border border-gray-200 rounded">
                    <p className="text-sm text-gray-700 line-clamp-3">{request.technician_notes}</p>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-100 border border-dashed border-gray-300 rounded text-center">
                    <p className="text-sm text-gray-600">No notes added</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Assignment Form Dialog */}
        {showAssignTechnicianDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-2xl w-full rounded-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 bg-[#F87B1B] text-white">
                <h3 className="text-xl font-bold">Update Work Assignment</h3>
                <p className="text-sm text-gray-100 mt-1">Assign engineer and specify requirements</p>
              </div>

              <div className="p-6 space-y-6">
                {/* Engineer Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Assign Engineer</label>
                  <input
                    type="text"
                    value={formData.assigned_technician}
                    onChange={(e) => setFormData({ ...formData, assigned_technician: e.target.value })}
                    placeholder="Enter engineer name"
                    className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#F87B1B] focus:border-[#F87B1B]"
                  />
                </div>

                {/* Priority & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-[#F87B1B] focus:border-[#F87B1B]"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-[#F87B1B] focus:border-[#F87B1B]"
                    >
                      <option value="HVAC">HVAC</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Elevator">Elevator</option>
                      <option value="IT/Network">IT/Network</option>
                      <option value="General">General</option>
                      <option value="Security">Security</option>
                      <option value="Furniture">Furniture</option>
                      <option value="Appliances">Appliances</option>
                    </select>
                  </div>
                </div>

                {/* Parts & Materials */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-900">Parts & Materials</label>
                    <button
                      onClick={() => setShowAddPartDialog(true)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-[#F87B1B] text-white rounded text-sm hover:bg-[#E06A0A]"
                    >
                      <Add01Icon className="h-4 w-4" />
                      <span>Add Part</span>
                    </button>
                  </div>

                  {parts.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {parts.map((part) => (
                        <div key={part.id} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{part.name}</div>
                            <div className="text-xs text-gray-600">
                              Qty: {part.quantity} • {part.source === 'warehouse' ? 'Warehouse Stock' : `Vendor: ${part.vendor_name}`}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemovePart(part.id)}
                            className="text-red-600 hover:text-red-800 p-1"
                          >
                            <CancelCircleIcon className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border border-dashed border-gray-300 rounded text-center">
                      <PackageIcon className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-sm text-gray-600">No parts added</p>
                    </div>
                  )}
                </div>

                {/* Work Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Work Notes</label>
                  <textarea
                    value={formData.technician_notes}
                    onChange={(e) => setFormData({ ...formData, technician_notes: e.target.value })}
                    rows={4}
                    placeholder="Add notes about the work to be performed, observations, etc."
                    className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#F87B1B] focus:border-[#F87B1B]"
                  />
                </div>

                {/* Estimated Completion */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Estimated Completion Date</label>
                  <input
                    type="datetime-local"
                    value={formData.estimated_completion ? new Date(formData.estimated_completion).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setFormData({ ...formData, estimated_completion: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#F87B1B] focus:border-[#F87B1B]"
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3 bg-gray-50">
                <button
                  onClick={() => setShowAssignTechnicianDialog(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-100"
                  disabled={formLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleUpdateRequest();
                    setShowAssignTechnicianDialog(false);
                  }}
                  className="px-6 py-2 bg-[#F87B1B] text-white text-sm font-medium rounded hover:bg-[#E06A0A] disabled:opacity-50 flex items-center space-x-2"
                  disabled={formLoading}
                >
                  {formLoading ? (
                    <>
                      <Loading03Icon className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <UserCheckIcon className="h-4 w-4" />
                      <span>Save Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Part Dialog */}
        {showAddPartDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white max-w-md w-full rounded">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-900">Add Part/Material</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={newPart.source}
                    onChange={(e) => setNewPart({ ...newPart, source: e.target.value as 'warehouse' | 'vendor', warehouse_item_id: null, name: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-[#F87B1B] focus:border-[#F87B1B]"
                  >
                    <option value="warehouse">Warehouse Stock</option>
                    <option value="vendor">External Vendor</option>
                  </select>
                </div>

                {newPart.source === 'warehouse' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Part from Warehouse</label>
                      <select
                        value={newPart.warehouse_item_id || ''}
                        onChange={(e) => {
                          const itemId = parseInt(e.target.value);
                          const item = warehouseItems.find(i => i.id === itemId);
                          setNewPart({ ...newPart, warehouse_item_id: itemId, name: item?.name || '' });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-[#F87B1B] focus:border-[#F87B1B]"
                      >
                        <option value="">-- Select Item --</option>
                        {warehouseItems.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} ({item.code}) - Stock: {item.quantity} {item.unit_display}
                            {item.is_low_stock && ' ⚠️ Low Stock'}
                          </option>
                        ))}
                      </select>
                    </div>
                    {newPart.warehouse_item_id && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        {(() => {
                          const selectedItem = warehouseItems.find(i => i.id === newPart.warehouse_item_id);
                          return selectedItem ? (
                            <div className="text-sm">
                              <p className="font-medium text-blue-900">Available Stock: {selectedItem.quantity} {selectedItem.unit_display}</p>
                              <p className="text-blue-700 text-xs mt-1">Location: {selectedItem.location || 'N/A'}</p>
                              {selectedItem.is_low_stock && (
                                <p className="text-orange-600 text-xs mt-1">⚠️ Low stock - below minimum level</p>
                              )}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                      <input
                        type="text"
                        value={newPart.name}
                        onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
                        placeholder="e.g., Special AC Compressor"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-[#F87B1B] focus:border-[#F87B1B]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Name</label>
                      <input
                        type="text"
                        value={newPart.vendor_name}
                        onChange={(e) => setNewPart({ ...newPart, vendor_name: e.target.value })}
                        placeholder="Enter vendor name"
                        className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-[#F87B1B] focus:border-[#F87B1B]"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    value={newPart.quantity}
                    onChange={(e) => setNewPart({ ...newPart, quantity: parseInt(e.target.value) || 1 })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-[#F87B1B] focus:border-[#F87B1B]"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowAddPartDialog(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPart}
                  className="px-4 py-2 bg-[#F87B1B] text-white text-sm rounded hover:bg-[#E06A0A]"
                >
                  Add Part
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'details', name: 'Details & Problem Description', icon: File01Icon },
              { id: 'work-log', name: 'Work Log & History', icon: UserCheckIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'details' | 'work-log')}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#F87B1B] text-[#F87B1B]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'details' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Problem Description */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#F87B1B] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Problem Description</h3>
                      <p className="text-sm text-gray-100 mt-1">Detailed description of the reported issue</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <File01Icon className="h-4 w-4 text-[#F87B1B]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <p className="text-gray-700 mb-4">{request.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-gray-900">Reported by:</span>
                      <div className="text-sm text-gray-700">{request.reported_by} ({request.reporter_role})</div>
                      <div className="text-sm text-gray-600">{request.reporter_contact}</div>
                    </div>
                    
                    <div>
                      <span className="text-sm font-medium text-gray-900">Additional Notes:</span>
                      <p className="text-sm text-gray-700">{request.notes}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parts Needed */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#F87B1B] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Required Parts</h3>
                      <p className="text-sm text-gray-100 mt-1">Materials needed for repair</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <PackageIcon className="h-4 w-4 text-[#F87B1B]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  {request.parts_needed && request.parts_needed.length > 0 ? (
                    <>
                      <div className="space-y-2">
                        {request.parts_needed.map((part, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                            <div className="flex items-center space-x-2">
                              <PackageIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{part}</span>
                            </div>
                            <span className="text-xs text-gray-600">Required</span>
                          </div>
                        ))}
                      </div>

                      {request.parts_cost && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">Estimated Parts Cost:</span>
                            <span className="font-bold text-[#F87B1B]">{formatCurrency(request.parts_cost)}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-gray-600">No parts specified yet</p>
                  )}
                </div>
              </div>

              {/* Request Photos */}
              {request.photos && request.photos.length > 0 && (
                <div className="lg:col-span-2 bg-white border border-gray-200">
                  <div className="p-6 bg-[#F87B1B] text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white">Photos</h3>
                        <p className="text-sm text-gray-100 mt-1">Documentation of the issue</p>
                      </div>
                      <div className="w-8 h-8 bg-white flex items-center justify-center">
                        <ViewIcon className="h-4 w-4 text-[#F87B1B]" />
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {request.photos.map((photo, index) => (
                        <div key={index} className="bg-gray-100 aspect-video rounded border-2 border-dashed border-gray-300 flex items-center justify-center">
                          <div className="text-center">
                            <ViewIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Photo {index + 1}</p>
                            <p className="text-xs text-gray-500">{photo}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'work-log' && (
            <div className="space-y-6">
              {/* Add New Log Entry */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#F87B1B] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Add Work Log Entry</h3>
                      <p className="text-sm text-gray-100 mt-1">Record progress and updates</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <Add01Icon className="h-4 w-4 text-[#F87B1B]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="space-y-4">
                    <textarea
                      value={newLogEntry}
                      onChange={(e) => setNewLogEntry(e.target.value)}
                      placeholder="Describe the work performed, progress made, or issues encountered..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#F87B1B] focus:border-[#F87B1B] text-sm"
                    />
                    <div className="flex items-center justify-end">
                      <button
                        onClick={handleAddLogEntry}
                        disabled={!newLogEntry.trim() || formLoading}
                        className="bg-[#F87B1B] text-white px-6 py-2 text-sm font-medium rounded hover:bg-[#E66A0A] transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
                      >
                        {formLoading ? (
                          <>
                            <Loading03Icon className="h-4 w-4 animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : (
                          <>
                            <Add01Icon className="h-4 w-4" />
                            <span>Add Entry</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Log Timeline */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#F87B1B] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Work Log History</h3>
                      <p className="text-sm text-gray-100 mt-1">Complete history of work performed</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <UserCheckIcon className="h-4 w-4 text-[#F87B1B]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="space-y-4">
                    {request.technician_notes ? (
                      <div className="space-y-3">
                        {request.technician_notes.split('\n\n').map((entry, index) => {
                          // Parse entry format: [timestamp] engineer: message
                          const match = entry.match(/\[(.*?)\]\s*(.*?):\s*(.*)/s);
                          if (match) {
                            const [, timestamp, engineer, message] = match;
                            return (
                              <div key={index} className="flex space-x-4">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                    <UserCheckIcon className="h-4 w-4 text-blue-600" />
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="bg-white p-4 border border-gray-200 rounded">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <h4 className="font-medium text-gray-900">Work Update</h4>
                                        <p className="text-sm text-gray-600">by {engineer}</p>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-sm text-gray-600">{timestamp}</div>
                                      </div>
                                    </div>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.trim()}</p>
                                  </div>
                                </div>
                              </div>
                            );
                          } else {
                            // Fallback for non-formatted entries
                            return (
                              <div key={index} className="bg-white p-4 border border-gray-200 rounded">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry}</p>
                              </div>
                            );
                          }
                        })}
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-gray-100 border border-dashed border-gray-300 rounded">
                        <UserCheckIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-gray-600">No work log entries yet</p>
                        <p className="text-xs text-gray-500 mt-1">Add your first entry above to start tracking work</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Removed parts and costs tabs - now handled in main form */}
          {activeTab === 'parts-removed' && (
            <div className="space-y-6">
              {/* Parts Used */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#F87B1B] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Parts Used</h3>
                      <p className="text-sm text-gray-100 mt-1">Materials consumed during repair</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <PackageIcon className="h-4 w-4 text-[#F87B1B]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="overflow-visible">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Cost</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Installed</th>
                          <th className="border border-gray-300 px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                        </tr>
                      </thead>
                      <tbody className="">
                        {request.parts_used && request.parts_used.length > 0 ? request.parts_used.map((part) => (
                          <tr key={part.id} className="bg-white">
                            <td className="border border-gray-200 px-4 py-4">
                              <div>
                                <div className="font-medium text-gray-900">{part.part_name}</div>
                                {part.warranty_period && (
                                  <div className="text-xs text-gray-600">Warranty: {part.warranty_period}</div>
                                )}
                                {part.notes && (
                                  <div className="text-xs text-gray-500 mt-1">{part.notes}</div>
                                )}
                              </div>
                            </td>
                            <td className="border border-gray-200 px-4 py-4 text-sm text-gray-900">{part.quantity_used}</td>
                            <td className="border border-gray-200 px-4 py-4 text-sm text-gray-900">{formatCurrency(part.unit_cost)}</td>
                            <td className="border border-gray-200 px-4 py-4 text-sm text-gray-900">{part.supplier}</td>
                            <td className="border border-gray-200 px-4 py-4 text-sm text-gray-900">{formatDateTime(part.installation_date)}</td>
                            <td className="border border-gray-200 px-4 py-4 text-sm font-medium text-gray-900">
                              {formatCurrency(part.unit_cost * part.quantity_used)}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={6} className="border border-gray-200 px-4 py-8 text-center text-sm text-gray-600">
                              No parts used yet
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Parts Inventory Check */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#F87B1B] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Inventory Status</h3>
                      <p className="text-sm text-gray-100 mt-1">Current stock levels for required parts</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <Location01Icon className="h-4 w-4 text-[#F87B1B]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  {request.parts_needed && request.parts_needed.length > 0 ? (
                    <div className="space-y-3">
                      {request.parts_needed.map((part, index) => {
                        const isUsed = request.parts_used?.find(used => used.part_name.includes(part.split(' ')[0]));
                        return (
                          <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${isUsed ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                              <span className="text-sm text-gray-900">{part}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`text-xs px-2 py-1 rounded ${isUsed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                {isUsed ? 'Used' : 'Pending'}
                              </span>
                              <span className="text-xs text-gray-600">Stock: 15</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No parts inventory to track</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'costs-removed' && request.cost_breakdown && (
            <div className="space-y-6">
              {/* Cost Breakdown */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#F87B1B] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Cost Breakdown</h3>
                      <p className="text-sm text-gray-100 mt-1">Detailed cost analysis for this repair</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <PieChartIcon className="h-4 w-4 text-[#F87B1B]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center space-x-2">
                          <Shield01Icon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">Labor Cost</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(request.cost_breakdown.labor_cost)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center space-x-2">
                          <PackageIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">Parts Cost</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(request.cost_breakdown.parts_cost)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center space-x-2">
                          <Wrench01Icon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">Equipment Rental</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(request.cost_breakdown.equipment_rental)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center space-x-2">
                          <UserMultipleIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">Vendor Fees</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(request.cost_breakdown.vendor_fees)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
                        <div className="flex items-center space-x-2">
                          <CreditCardIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">Additional Charges</span>
                        </div>
                        <span className="font-medium text-gray-900">{formatCurrency(request.cost_breakdown.additional_charges)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded p-6">
                      <h4 className="font-bold text-gray-900 mb-4">Cost Summary</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="text-gray-900">{formatCurrency(request.cost_breakdown.total_cost - (request.cost_breakdown.total_cost * 0.1))}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Tax (10%):</span>
                          <span className="text-gray-900">{formatCurrency(request.cost_breakdown.total_cost * 0.1)}</span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between">
                            <span className="font-bold text-lg text-gray-900">Total:</span>
                            <span className="font-bold text-lg text-[#F87B1B]">{formatCurrency(request.cost_breakdown.total_cost)}</span>
                          </div>
                        </div>
                        
                        {request.warranty_covered && (
                          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                            <div className="flex items-center space-x-2">
                              <UserCheckIcon className="h-4 w-4 text-green-600" />
                              <span className="text-green-800 text-sm font-medium">Covered under warranty</span>
                            </div>
                            <p className="text-green-700 text-xs mt-1">Customer charge: {formatCurrency(0)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cost Comparison */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 bg-[#F87B1B] text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">Budget vs Actual</h3>
                      <p className="text-sm text-gray-100 mt-1">Comparison of estimated and actual costs</p>
                    </div>
                    <div className="w-8 h-8 bg-white flex items-center justify-center">
                      <ArrowUp01Icon className="h-4 w-4 text-[#F87B1B]" />
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {formatCurrency(request.estimated_cost || 0)}
                      </div>
                      <div className="text-sm text-gray-600">Original Estimate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#F87B1B]">
                        {formatCurrency(request.cost_breakdown.total_cost)}
                      </div>
                      <div className="text-sm text-gray-600">Actual Cost</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${(request.cost_breakdown.total_cost - (request.estimated_cost || 0)) < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(request.cost_breakdown.total_cost - (request.estimated_cost || 0))}
                      </div>
                      <div className="text-sm text-gray-600">Variance</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </SupportLayout>
  );
};

export default MaintenanceDetailPage;