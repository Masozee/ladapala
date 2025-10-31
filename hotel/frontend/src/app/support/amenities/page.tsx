'use client';

import { useState, useEffect } from 'react';
import SupportLayout from '@/components/SupportLayout';
import { buildApiUrl } from '@/lib/config';
import {
  PackageIcon,
  Add01Icon,
  Search02Icon,
  Clock01Icon,
  UserCheckIcon,
  EyeIcon,
  PencilEdit02Icon,
  MoreHorizontalIcon,
  AlertCircleIcon,
  Alert01Icon,
  Cancel01Icon
} from '@/lib/icons';

interface AmenityCategory {
  id: number;
  name: string;
}

interface InventoryItem {
  id: number;
  name: string;
  category: number;
  category_name?: string;
  current_stock: number;
  unit_of_measurement: string;
  unit_price: string;
}

interface Room {
  id: number;
  number: string;
  room_type: string;
  status: string;
  floor: number;
}

interface AmenityRequest {
  id: number;
  request_number: string;
  guest_name: string;
  room_number: string;
  category: number;
  category_name: string;
  inventory_item: number | null;
  inventory_item_name: string | null;
  inventory_item_stock: number | null;
  item: string;
  quantity: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  status_display: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  priority_display: string;
  requested_at: string;
  delivery_time: string | null;
  delivered_at: string | null;
  assigned_to: number | null;
  assigned_to_name: string | null;
  assigned_to_department: string | null;
  special_instructions: string | null;
  notes: string | null;
  estimated_cost: string;
  guest_rating: number | null;
  guest_feedback: string | null;
  is_urgent: boolean;
  is_overdue: boolean;
}

interface Stats {
  pending: number;
  in_progress: number;
  completed: number;
  urgent: number;
  total: number;
}

export default function AmenitiesPage() {
  const [activeTab, setActiveTab] = useState('active'); // 'active' or 'history'
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);

  // Data states
  const [requests, setRequests] = useState<AmenityRequest[]>([]);
  const [categories, setCategories] = useState<AmenityCategory[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, in_progress: 0, completed: 0, urgent: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AmenityRequest | null>(null);

  // Form data
  const [formData, setFormData] = useState({
    guest_name: '',
    room_number: '',
    category: '',
    inventory_item: '',
    item: '',
    quantity: '1',
    priority: 'MEDIUM',
    delivery_time: '',
    special_instructions: ''
  });

  const [csrfToken, setCsrfToken] = useState('');

  useEffect(() => {
    fetchCSRFToken();
    fetchRequests();
    fetchCategories();
    fetchInventoryItems();
    fetchRooms();
    fetchStats();
  }, []);

  const fetchCSRFToken = async () => {
    try {
      const response = await fetch(buildApiUrl('user/csrf/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const csrfCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='));
        if (csrfCookie) {
          setCsrfToken(csrfCookie.split('=')[1]);
        }
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('hotel/amenity-requests/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/amenity-categories/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/amenity-requests/inventory_items/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Inventory items fetched:', data);
        setInventoryItems(data);
      } else {
        console.error('Failed to fetch inventory items. Status:', response.status);
      }
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    }
  };

  const fetchRooms = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/rooms/?page_size=1000'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/amenity-requests/stats/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!formData.guest_name || !formData.room_number || !formData.category || !formData.inventory_item) {
      alert('Mohon isi semua field yang wajib');
      return;
    }

    try {
      const response = await fetch(buildApiUrl('hotel/amenity-requests/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({
          guest_name: formData.guest_name,
          room_number: formData.room_number,
          category: parseInt(formData.category),
          inventory_item: formData.inventory_item ? parseInt(formData.inventory_item) : null,
          item: formData.item,
          quantity: parseInt(formData.quantity),
          priority: formData.priority,
          delivery_time: formData.delivery_time || null,
          special_instructions: formData.special_instructions || null,
        }),
      });

      if (response.ok) {
        alert('Request berhasil dibuat!');
        setShowNewRequestModal(false);
        resetForm();
        fetchRequests();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Gagal membuat request: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error creating request:', error);
      alert('Gagal membuat request');
    }
  };

  const handleUpdateRequest = async () => {
    if (!selectedRequest || !formData.guest_name || !formData.room_number || !formData.inventory_item) {
      alert('Mohon isi semua field yang wajib');
      return;
    }

    try {
      const response = await fetch(buildApiUrl(`hotel/amenity-requests/${selectedRequest.id}/`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({
          guest_name: formData.guest_name,
          room_number: formData.room_number,
          category: parseInt(formData.category),
          inventory_item: formData.inventory_item ? parseInt(formData.inventory_item) : null,
          item: formData.item,
          quantity: parseInt(formData.quantity),
          priority: formData.priority,
          delivery_time: formData.delivery_time || null,
          special_instructions: formData.special_instructions || null,
        }),
      });

      if (response.ok) {
        alert('Request berhasil diupdate!');
        setShowEditModal(false);
        setSelectedRequest(null);
        resetForm();
        fetchRequests();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Gagal update request: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error updating request:', error);
      alert('Gagal update request');
    }
  };

  const handleMarkComplete = async (request: AmenityRequest) => {
    if (!confirm(`Tandai request ${request.request_number} sebagai selesai?`)) return;

    try {
      const response = await fetch(buildApiUrl(`hotel/amenity-requests/${request.id}/mark_completed/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
      });

      if (response.ok) {
        alert('Request berhasil diselesaikan!');
        fetchRequests();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Gagal: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error marking complete:', error);
      alert('Gagal menyelesaikan request');
    }
  };

  const handleCancelRequest = async (request: AmenityRequest) => {
    if (!confirm(`Batalkan request ${request.request_number}?`)) return;

    try {
      const response = await fetch(buildApiUrl(`hotel/amenity-requests/${request.id}/cancel/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
      });

      if (response.ok) {
        alert('Request berhasil dibatalkan!');
        fetchRequests();
        fetchStats();
      } else {
        const error = await response.json();
        alert(`Gagal: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      alert('Gagal membatalkan request');
    }
  };

  const openViewModal = (request: AmenityRequest) => {
    setSelectedRequest(request);
    setShowViewModal(true);
    setOpenMenuId(null);
  };

  const openEditModal = (request: AmenityRequest) => {
    setSelectedRequest(request);
    setFormData({
      guest_name: request.guest_name,
      room_number: request.room_number,
      category: request.category.toString(),
      inventory_item: request.inventory_item ? request.inventory_item.toString() : '',
      item: request.item,
      quantity: request.quantity.toString(),
      priority: request.priority,
      delivery_time: request.delivery_time || '',
      special_instructions: request.special_instructions || '',
    });
    setShowEditModal(true);
    setOpenMenuId(null);
  };

  const resetForm = () => {
    setFormData({
      guest_name: '',
      room_number: '',
      category: '',
      inventory_item: '',
      item: '',
      quantity: '1',
      priority: 'MEDIUM',
      delivery_time: '',
      special_instructions: ''
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-100 text-red-800';
      case 'HIGH': return 'bg-orange-100 text-orange-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(parseFloat(amount));
  };

  const filteredRequests = requests.filter(request => {
    // Tab filtering: 'active' = PENDING + IN_PROGRESS, 'history' = COMPLETED + CANCELLED
    const matchesTab = activeTab === 'active'
      ? ['PENDING', 'IN_PROGRESS'].includes(request.status)
      : ['COMPLETED', 'CANCELLED'].includes(request.status);

    const matchesSearch = request.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.room_number.includes(searchQuery) ||
                         request.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         request.request_number.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || request.category.toString() === selectedCategory;

    return matchesTab && matchesSearch && matchesCategory;
  });

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
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-yellow-100 rounded">
                <Clock01Icon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.pending}</div>
            <div className="text-sm font-medium text-gray-600">Pending Requests</div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded">
                <Clock01Icon className="h-6 w-6 text-blue-600" />
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
              <div className="p-3 bg-red-100 rounded">
                <Alert01Icon className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">{stats.urgent}</div>
            <div className="text-sm font-medium text-gray-600">Urgent Requests</div>
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
                placeholder="Cari tamu, kamar, atau item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B] focus:border-[#F87B1B] w-full rounded"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#F87B1B] rounded"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.display_name}</option>
              ))}
            </select>
          </div>

          {/* Tab Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`px-6 py-2 text-sm font-medium rounded transition-colors ${
                activeTab === 'active'
                  ? 'bg-[#F87B1B] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              Active Requests ({stats.pending + stats.in_progress})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2 text-sm font-medium rounded transition-colors ${
                activeTab === 'history'
                  ? 'bg-[#F87B1B] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              History ({stats.completed})
            </button>
          </div>

          <button
            onClick={() => setShowNewRequestModal(true)}
            className="bg-[#F87B1B] text-white px-4 py-2 text-sm font-medium hover:bg-[#E06A0A] transition-colors flex items-center space-x-2 rounded"
          >
            <Add01Icon className="h-4 w-4" />
            <span>New Request</span>
          </button>
        </div>

        {/* Requests Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#F87B1B]"></div>
            <p className="text-gray-600 mt-4">Memuat data...</p>
          </div>
        ) : (
          <table className="w-full border-collapse bg-white border border-gray-200">
            <thead>
              <tr className="bg-[#F87B1B] text-white">
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">ID</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Guest</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Room</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Item</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Category</th>
                <th className="border border-gray-200 px-6 py-4 text-center text-sm font-medium">Qty</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Priority</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Status</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Delivery</th>
                <th className="border border-gray-200 px-6 py-4 text-left text-sm font-medium">Assigned</th>
                <th className="border border-gray-200 px-6 py-4 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-6 py-4 text-sm font-medium text-gray-900">{request.request_number}</td>
                  <td className="border border-gray-200 px-6 py-4 text-sm text-gray-900">{request.guest_name}</td>
                  <td className="border border-gray-200 px-6 py-4 text-sm font-semibold text-[#F87B1B]">#{request.room_number}</td>
                  <td className="border border-gray-200 px-6 py-4 text-sm text-gray-900">
                    <div className="whitespace-normal break-words">{request.item}</div>
                  </td>
                  <td className="border border-gray-200 px-6 py-4">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {request.category_name}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-6 py-4 text-sm text-center font-medium text-gray-900">{request.quantity}</td>
                  <td className="border border-gray-200 px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPriorityColor(request.priority)}`}>
                      {request.priority_display}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(request.status)}`}>
                      {request.status_display}
                    </span>
                  </td>
                  <td className="border border-gray-200 px-6 py-4 text-sm text-gray-900">{request.delivery_time || 'ASAP'}</td>
                  <td className="border border-gray-200 px-6 py-4 text-sm text-gray-900">{request.assigned_to_department || '-'}</td>
                  <td className="border border-gray-200 px-6 py-4 text-center">
                    <div className="flex items-center justify-center relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === request.id ? null : request.id)}
                        className="p-2 border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                      >
                        <MoreHorizontalIcon className="h-4 w-4 text-gray-600" />
                      </button>
                      {openMenuId === request.id && (
                        <div className="absolute right-0 top-12 mt-2 w-48 bg-white border border-gray-200 shadow-lg z-10 rounded">
                          <button
                            onClick={() => openViewModal(request)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                          >
                            <EyeIcon className="h-4 w-4" />
                            <span>View Details</span>
                          </button>
                          <button
                            onClick={() => openEditModal(request)}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                          >
                            <PencilEdit02Icon className="h-4 w-4" />
                            <span>Edit Request</span>
                          </button>
                          {(request.status === 'PENDING' || request.status === 'IN_PROGRESS') && (
                            <button
                              onClick={() => handleMarkComplete(request)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                            >
                              <UserCheckIcon className="h-4 w-4" />
                              <span>Mark Complete</span>
                            </button>
                          )}
                          {request.status !== 'COMPLETED' && request.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelRequest(request)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-2 border-t border-gray-200"
                            >
                              <AlertCircleIcon className="h-4 w-4" />
                              <span>Cancel Request</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-600">
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {/* New Request Modal */}
        {showNewRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">New Amenity Request</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guest Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.guest_name}
                      onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    >
                      <option value="">Select Room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.number}>
                          Room {room.number} - {room.room_type} ({room.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value, inventory_item: '', item: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Item from Warehouse <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.inventory_item}
                    onChange={(e) => {
                      const selectedItem = inventoryItems.find(item => item.id === parseInt(e.target.value));
                      setFormData({
                        ...formData,
                        inventory_item: e.target.value,
                        item: selectedItem ? selectedItem.name : ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                  >
                    <option value="">Select item...</option>
                    {inventoryItems
                      .filter((item) => {
                        if (!formData.category) return true; // Show all if no category selected
                        return item.category === parseInt(formData.category);
                      })
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stock: {item.current_stock} {item.unit_of_measurement})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.category ? 'Showing items matching selected category' : 'Select a category to filter items'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
                    <input
                      type="text"
                      placeholder="ASAP or HH:MM"
                      value={formData.delivery_time}
                      onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <textarea
                    value={formData.special_instructions}
                    onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowNewRequestModal(false); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRequest}
                  className="flex-1 px-4 py-2 bg-[#F87B1B] text-white rounded hover:bg-[#E06A0A] transition-colors"
                >
                  Create Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showViewModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold">Request Details</h2>
                <button onClick={() => setShowViewModal(false)}>
                  <Cancel01Icon className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">Request Number</label>
                    <p className="font-medium">{selectedRequest.request_number}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Status</label>
                    <p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getStatusColor(selectedRequest.status)}`}>
                        {selectedRequest.status_display}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Guest Name</label>
                    <p className="font-medium">{selectedRequest.guest_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Room Number</label>
                    <p className="font-medium">#{selectedRequest.room_number}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Category</label>
                    <p className="font-medium">{selectedRequest.category_name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Priority</label>
                    <p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getPriorityColor(selectedRequest.priority)}`}>
                        {selectedRequest.priority_display}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Item</label>
                    <p className="font-medium">{selectedRequest.item}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Quantity</label>
                    <p className="font-medium">{selectedRequest.quantity}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Delivery Time</label>
                    <p className="font-medium">{selectedRequest.delivery_time || 'ASAP'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Estimated Cost</label>
                    <p className="font-medium">{formatCurrency(selectedRequest.estimated_cost)}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Assigned To</label>
                    <p className="font-medium">{selectedRequest.assigned_to_department || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Requested At</label>
                    <p className="font-medium">{new Date(selectedRequest.requested_at).toLocaleString('id-ID')}</p>
                  </div>
                </div>

                {selectedRequest.special_instructions && (
                  <div>
                    <label className="text-sm text-gray-600">Special Instructions</label>
                    <p className="font-medium">{selectedRequest.special_instructions}</p>
                  </div>
                )}

                {selectedRequest.notes && (
                  <div>
                    <label className="text-sm text-gray-600">Notes</label>
                    <p className="font-medium">{selectedRequest.notes}</p>
                  </div>
                )}

                {selectedRequest.delivered_at && (
                  <div>
                    <label className="text-sm text-gray-600">Delivered At</label>
                    <p className="font-medium">{new Date(selectedRequest.delivered_at).toLocaleString('id-ID')}</p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-full px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Request Modal */}
        {showEditModal && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Edit Request - {selectedRequest.request_number}</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Guest Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.guest_name}
                      onChange={(e) => setFormData({ ...formData, guest_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Room Number <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.room_number}
                      onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    >
                      <option value="">Select Room</option>
                      {rooms.map((room) => (
                        <option key={room.id} value={room.number}>
                          Room {room.number} - {room.room_type} ({room.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value, inventory_item: '', item: '' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Item from Warehouse <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.inventory_item}
                    onChange={(e) => {
                      const selectedItem = inventoryItems.find(item => item.id === parseInt(e.target.value));
                      setFormData({
                        ...formData,
                        inventory_item: e.target.value,
                        item: selectedItem ? selectedItem.name : ''
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                  >
                    <option value="">Select item...</option>
                    {inventoryItems
                      .filter((item) => {
                        if (!formData.category) return true; // Show all if no category selected
                        return item.category === parseInt(formData.category);
                      })
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name} (Stock: {item.current_stock} {item.unit_of_measurement})
                        </option>
                      ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.category ? 'Showing items matching selected category' : 'Select a category to filter items'}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
                    <input
                      type="text"
                      placeholder="ASAP or HH:MM"
                      value={formData.delivery_time}
                      onChange={(e) => setFormData({ ...formData, delivery_time: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <textarea
                    value={formData.special_instructions}
                    onChange={(e) => setFormData({ ...formData, special_instructions: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F87B1B]"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => { setShowEditModal(false); setSelectedRequest(null); resetForm(); }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateRequest}
                  className="flex-1 px-4 py-2 bg-[#F87B1B] text-white rounded hover:bg-[#E06A0A] transition-colors"
                >
                  Update Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SupportLayout>
  );
}
