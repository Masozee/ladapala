'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  Archive03Icon,
  Location01Icon,
  UserIcon,
  Calendar01Icon,
  PackageIcon,
  SparklesIcon,
  CheckmarkCircle02Icon,
  ArrowLeft01Icon,
  PencilEdit02Icon,
  Settings02Icon,
  Clock01Icon,
  AlertCircleIcon,
  Delete02Icon,
  SaveIcon
} from '@/lib/icons';

interface LostFoundItem {
  id: number;
  item_number: string;
  report_type: string;
  report_type_display: string;
  item_name: string;
  description: string;
  category: string;
  category_display: string;
  status: string;
  status_display: string;
  location_type: string;
  location_type_display: string;
  room: number | null;
  room_number: string | null;
  specific_location: string;
  guest: number | null;
  guest_name: string | null;
  reservation: number | null;
  reservation_number: string | null;
  reported_by: number | null;
  reported_by_name: string | null;
  reported_date: string;
  reported_time: string;
  found_date: string | null;
  storage_location: string;
  handler: number | null;
  handler_name: string | null;
  claimed_by_name: string;
  claimed_by_contact: string;
  claimed_date: string | null;
  claimed_time: string | null;
  claim_verified_by: number | null;
  claim_verified_by_name: string | null;
  claim_notes: string;
  disposal_date: string | null;
  disposal_method: string;
  disposal_notes: string;
  estimated_value: number | null;
  is_valuable: boolean;
  images: string[];
  notes: string;
  days_in_storage: number;
  is_unclaimed_long: boolean;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_STORAGE: 'bg-blue-100 text-blue-800 border-blue-200',
  CLAIMED: 'bg-green-100 text-green-800 border-green-200',
  RETURNED_TO_GUEST: 'bg-purple-100 text-purple-800 border-purple-200',
  DISPOSED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function LostFoundDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<LostFoundItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusData, setStatusData] = useState<any>({});

  useEffect(() => {
    fetchItem();
  }, [id]);

  const fetchItem = async () => {
    try {
      const response = await fetch(buildApiUrl(`hotel/lost-and-found/${id}/`), {
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to fetch item');

      const data = await response.json();
      setItem(data);
    } catch (error) {
      console.error('Error fetching item:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus || !item) return;

    setSaving(true);
    try {
      const csrfToken = await getCsrfToken();
      const response = await fetch(
        buildApiUrl(`hotel/lost-and-found/${id}/update_status/`),
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include',
          body: JSON.stringify({
            status: selectedStatus,
            ...statusData
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to update status');
      }

      await fetchItem();
      setShowStatusModal(false);
      setSelectedStatus('');
      setStatusData({});
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateStr: string | null, timeStr: string | null) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    if (timeStr) {
      const [hours, minutes] = timeStr.split(':');
      date.setHours(parseInt(hours), parseInt(minutes));
    }
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading item details...</p>
          </div>
        </div>
      </OfficeLayout>
    );
  }

  if (!item) {
    return (
      <OfficeLayout>
        <div className="p-8">
          <div className="text-center py-12">
            <AlertCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Item not found</p>
            <button
              onClick={() => router.push('/office/lost-and-found')}
              className="mt-4 text-blue-600 hover:text-blue-700"
            >
              Back to Lost & Found
            </button>
          </div>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/office/lost-and-found')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft01Icon className="h-5 w-5" />
            Back to Lost & Found
          </button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{item.item_name}</h1>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${
                  STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-800 border-gray-200'
                }`}>
                  {item.status_display}
                </span>
                {item.is_valuable && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
                    <SparklesIcon className="h-4 w-4 mr-1" />
                    Valuable Item
                  </span>
                )}
              </div>
              <p className="text-gray-600">Item #{item.item_number}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStatusModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Settings02Icon className="h-5 w-5" />
                Update Status
              </button>
            </div>
          </div>
        </div>

        {/* Warning for long unclaimed */}
        {item.is_unclaimed_long && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded p-4 flex items-start gap-3">
            <AlertCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Long-term Unclaimed Item</h3>
              <p className="text-sm text-red-700 mt-1">
                This item has been unclaimed for over 30 days ({item.days_in_storage} days).
                Consider disposing according to hotel policy.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Item Details */}
            <div className="bg-white rounded border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Item Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Report Type</label>
                  <div className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${
                    item.report_type === 'FOUND' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {item.report_type_display}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                  <p className="text-gray-900">{item.category_display}</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                  <p className="text-gray-900">{item.description}</p>
                </div>
                {item.estimated_value && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Estimated Value</label>
                    <p className="text-gray-900">Rp {item.estimated_value.toLocaleString()}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Days in System</label>
                  <p className={`font-medium ${
                    item.days_in_storage > 30 ? 'text-red-600' :
                    item.days_in_storage > 14 ? 'text-orange-600' :
                    'text-gray-900'
                  }`}>
                    {item.days_in_storage} days
                  </p>
                </div>
              </div>
            </div>

            {/* Location Details */}
            <div className="bg-white rounded border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Location01Icon className="h-5 w-5" />
                Location Details
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Location Type</label>
                  <p className="text-gray-900">{item.location_type_display}</p>
                </div>
                {item.room_number && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Room</label>
                    <p className="text-gray-900">Room {item.room_number}</p>
                  </div>
                )}
                {item.specific_location && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Specific Location</label>
                    <p className="text-gray-900">{item.specific_location}</p>
                  </div>
                )}
                {item.storage_location && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Storage Location</label>
                    <p className="text-gray-900 font-medium">{item.storage_location}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Guest Information */}
            {item.guest_name && (
              <div className="bg-white rounded border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  Guest Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Guest Name</label>
                    <p className="text-gray-900">{item.guest_name}</p>
                  </div>
                  {item.reservation_number && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Reservation</label>
                      <p className="text-gray-900">{item.reservation_number}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Claim Information */}
            {(item.status === 'CLAIMED' || item.status === 'RETURNED_TO_GUEST') && (
              <div className="bg-green-50 border border-green-200 rounded p-6">
                <h2 className="text-lg font-semibold text-green-900 mb-4 flex items-center gap-2">
                  <CheckmarkCircle02Icon className="h-5 w-5" />
                  Claim Information
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {item.claimed_by_name && (
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">Claimed By</label>
                      <p className="text-green-900 font-medium">{item.claimed_by_name}</p>
                    </div>
                  )}
                  {item.claimed_by_contact && (
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">Contact</label>
                      <p className="text-green-900">{item.claimed_by_contact}</p>
                    </div>
                  )}
                  {item.claimed_date && (
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">Claim Date</label>
                      <p className="text-green-900">{formatDateTime(item.claimed_date, item.claimed_time)}</p>
                    </div>
                  )}
                  {item.claim_verified_by_name && (
                    <div>
                      <label className="block text-sm font-medium text-green-700 mb-1">Verified By</label>
                      <p className="text-green-900">{item.claim_verified_by_name}</p>
                    </div>
                  )}
                  {item.claim_notes && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-green-700 mb-1">Notes</label>
                      <p className="text-green-900">{item.claim_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Disposal Information */}
            {item.status === 'DISPOSED' && (
              <div className="bg-gray-50 border border-gray-200 rounded p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Disposal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Disposal Date</label>
                    <p className="text-gray-900">{formatDate(item.disposal_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Disposal Method</label>
                    <p className="text-gray-900">{item.disposal_method}</p>
                  </div>
                  {item.disposal_notes && (
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                      <p className="text-gray-900">{item.disposal_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {item.notes && (
              <div className="bg-white rounded border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes</h2>
                <p className="text-gray-700">{item.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Timeline */}
            <div className="bg-white rounded border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Clock01Icon className="h-5 w-5" />
                Timeline
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                    <span className="text-sm font-medium text-gray-900">Reported</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-4">{formatDateTime(item.reported_date, item.reported_time)}</p>
                  {item.reported_by_name && (
                    <p className="text-xs text-gray-500 ml-4">by {item.reported_by_name}</p>
                  )}
                </div>

                {item.found_date && item.found_date !== item.reported_date && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      <span className="text-sm font-medium text-gray-900">Found</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-4">{formatDate(item.found_date)}</p>
                  </div>
                )}

                {item.storage_location && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-purple-600"></div>
                      <span className="text-sm font-medium text-gray-900">Moved to Storage</span>
                    </div>
                    <p className="text-sm text-gray-600 ml-4">{item.storage_location}</p>
                    {item.handler_name && (
                      <p className="text-xs text-gray-500 ml-4">by {item.handler_name}</p>
                    )}
                  </div>
                )}

                {item.claimed_date && (
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.status === 'RETURNED_TO_GUEST' ? 'Returned' : 'Claimed'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 ml-4">{formatDateTime(item.claimed_date, item.claimed_time)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions (based on status) */}
            <div className="bg-white rounded border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {item.status === 'PENDING' && (
                  <button
                    onClick={() => {
                      setSelectedStatus('IN_STORAGE');
                      setShowStatusModal(true);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Move to Storage
                  </button>
                )}
                {(item.status === 'PENDING' || item.status === 'IN_STORAGE') && item.guest_name && (
                  <button
                    onClick={() => {
                      setSelectedStatus('RETURNED_TO_GUEST');
                      setShowStatusModal(true);
                    }}
                    className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    Return to Guest
                  </button>
                )}
                {(item.status === 'PENDING' || item.status === 'IN_STORAGE') && (
                  <button
                    onClick={() => {
                      setSelectedStatus('CLAIMED');
                      setShowStatusModal(true);
                    }}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Mark as Claimed
                  </button>
                )}
                {(item.status === 'PENDING' || item.status === 'IN_STORAGE') && item.is_unclaimed_long && (
                  <button
                    onClick={() => {
                      setSelectedStatus('DISPOSED');
                      setShowStatusModal(true);
                    }}
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Dispose Item
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Status Update Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Status</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select status...</option>
                    <option value="IN_STORAGE">In Storage</option>
                    <option value="CLAIMED">Claimed</option>
                    <option value="RETURNED_TO_GUEST">Returned to Guest</option>
                    <option value="DISPOSED">Disposed</option>
                  </select>
                </div>

                {selectedStatus === 'IN_STORAGE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Storage Location *</label>
                    <input
                      type="text"
                      value={statusData.storage_location || ''}
                      onChange={(e) => setStatusData({ ...statusData, storage_location: e.target.value })}
                      placeholder="e.g., Cabinet A, Shelf 2"
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {selectedStatus === 'CLAIMED' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Claimed By Name *</label>
                      <input
                        type="text"
                        value={statusData.claimed_by_name || ''}
                        onChange={(e) => setStatusData({ ...statusData, claimed_by_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Contact</label>
                      <input
                        type="text"
                        value={statusData.claimed_by_contact || ''}
                        onChange={(e) => setStatusData({ ...statusData, claimed_by_contact: e.target.value })}
                        placeholder="Phone or email"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Verification Notes</label>
                      <textarea
                        value={statusData.claim_notes || ''}
                        onChange={(e) => setStatusData({ ...statusData, claim_notes: e.target.value })}
                        placeholder="How was identity verified?"
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                {selectedStatus === 'DISPOSED' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Disposal Method *</label>
                      <input
                        type="text"
                        value={statusData.disposal_method || ''}
                        onChange={(e) => setStatusData({ ...statusData, disposal_method: e.target.value })}
                        placeholder="e.g., Donated, Discarded"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                      <textarea
                        value={statusData.disposal_notes || ''}
                        onChange={(e) => setStatusData({ ...statusData, disposal_notes: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleStatusUpdate}
                  disabled={!selectedStatus || saving}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Updating...' : 'Update Status'}
                </button>
                <button
                  onClick={() => {
                    setShowStatusModal(false);
                    setSelectedStatus('');
                    setStatusData({});
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  );
}
