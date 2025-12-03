'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  Archive03Icon,
  ArrowLeft01Icon,
  SaveIcon,
  AlertCircleIcon
} from '@/lib/icons';

interface Room {
  id: number;
  number: string;
  room_type_name: string;
  floor: number;
}

interface Guest {
  id: number;
  full_name: string;
  email: string;
  phone: string;
}

export default function NewLostFoundItemPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [searchGuest, setSearchGuest] = useState('');

  const [formData, setFormData] = useState({
    report_type: 'FOUND',
    item_name: '',
    description: '',
    category: 'OTHER',
    location_type: 'ROOM',
    room: '',
    specific_location: '',
    guest: '',
    found_date: new Date().toISOString().split('T')[0],
    estimated_value: '',
    notes: ''
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (searchGuest.length >= 2) {
      const timer = setTimeout(() => {
        searchGuests(searchGuest);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setGuests([]);
    }
  }, [searchGuest]);

  const fetchRooms = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/rooms/?page_size=500'), {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch rooms');
      const data = await response.json();
      setRooms(data.results || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const searchGuests = async (query: string) => {
    try {
      const response = await fetch(buildApiUrl(`hotel/guests/?search=${query}`), {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to search guests');
      const data = await response.json();
      setGuests(data.results || []);
    } catch (error) {
      console.error('Error searching guests:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // Validate required fields
      if (!formData.item_name || !formData.description) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.location_type === 'ROOM' && !formData.room) {
        throw new Error('Please select a room when location type is ROOM');
      }

      // Prepare data
      const submitData: any = {
        report_type: formData.report_type,
        item_name: formData.item_name,
        description: formData.description,
        category: formData.category,
        location_type: formData.location_type,
        specific_location: formData.specific_location,
        notes: formData.notes
      };

      if (formData.room) submitData.room = parseInt(formData.room);
      if (formData.guest) submitData.guest = parseInt(formData.guest);
      if (formData.found_date) submitData.found_date = formData.found_date;
      if (formData.estimated_value) submitData.estimated_value = parseFloat(formData.estimated_value);

      const csrfToken = await getCsrfToken();
      const response = await fetch(buildApiUrl('hotel/lost-and-found/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create item');
      }

      const data = await response.json();
      router.push('/office/lost-and-found');
    } catch (error: any) {
      console.error('Error creating item:', error);
      setError(error.message || 'Failed to create item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <OfficeLayout>
      <div className="p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/office/lost-and-found')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft01Icon className="h-5 w-5" />
            Back to Lost & Found
          </button>

          <div className="flex items-center gap-3">
            <Archive03Icon className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Report Lost & Found Item</h1>
              <p className="text-gray-600 mt-1">Create a new lost or found item record</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded p-4 flex items-start gap-3">
            <AlertCircleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-red-900">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="FOUND"
                    checked={formData.report_type === 'FOUND'}
                    onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Found Item (Housekeeping found)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    value="LOST"
                    checked={formData.report_type === 'LOST'}
                    onChange={(e) => setFormData({ ...formData, report_type: e.target.value })}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Lost Item (Guest reported)</span>
                </label>
              </div>
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Item Name *
              </label>
              <input
                type="text"
                value={formData.item_name}
                onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                placeholder="e.g., iPhone 13 Pro, Gold Watch, Black Wallet"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the item..."
                required
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ELECTRONICS">Electronics</option>
                <option value="JEWELRY">Jewelry</option>
                <option value="CLOTHING">Clothing</option>
                <option value="DOCUMENTS">Documents</option>
                <option value="MONEY">Money</option>
                <option value="KEYS">Keys</option>
                <option value="ACCESSORIES">Accessories</option>
                <option value="TOILETRIES">Toiletries</option>
                <option value="BOOKS">Books</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Location Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Type *
              </label>
              <select
                value={formData.location_type}
                onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ROOM">Guest Room</option>
                <option value="LOBBY">Lobby</option>
                <option value="RESTAURANT">Restaurant</option>
                <option value="POOL">Pool Area</option>
                <option value="GYM">Gym</option>
                <option value="SPA">Spa</option>
                <option value="PARKING">Parking</option>
                <option value="HALLWAY">Hallway</option>
                <option value="ELEVATOR">Elevator</option>
                <option value="CONFERENCE">Conference Room</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Room (if location type is ROOM) */}
            {formData.location_type === 'ROOM' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room *
                </label>
                <select
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a room...</option>
                  {rooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      Room {room.number} - {room.room_type_name} (Floor {room.floor})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Specific Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Specific Location
              </label>
              <input
                type="text"
                value={formData.specific_location}
                onChange={(e) => setFormData({ ...formData, specific_location: e.target.value })}
                placeholder="e.g., Under the bed, In bathroom, At reception desk"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Guest Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guest (Optional)
              </label>
              <input
                type="text"
                value={searchGuest}
                onChange={(e) => setSearchGuest(e.target.value)}
                placeholder="Search guest by name or email..."
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 mb-2"
              />
              {guests.length > 0 && (
                <div className="border border-gray-300 rounded max-h-48 overflow-y-auto">
                  {guests.map((guest) => (
                    <button
                      key={guest.id}
                      type="button"
                      onClick={() => {
                        setFormData({ ...formData, guest: guest.id.toString() });
                        setSearchGuest(guest.full_name);
                        setGuests([]);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                    >
                      <div className="font-medium">{guest.full_name}</div>
                      <div className="text-sm text-gray-600">{guest.email} • {guest.phone}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Found Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formData.report_type === 'FOUND' ? 'Found Date' : 'Lost Date'}
              </label>
              <input
                type="date"
                value={formData.found_date}
                onChange={(e) => setFormData({ ...formData, found_date: e.target.value })}
                max={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Estimated Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Value (Rp)
              </label>
              <input
                type="number"
                value={formData.estimated_value}
                onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                placeholder="0"
                min="0"
                step="1000"
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                Items in categories Electronics, Jewelry, Money, and Documents are automatically marked as valuable
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SaveIcon className="h-5 w-5" />
                {saving ? 'Creating...' : 'Create Item'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/office/lost-and-found')}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </div>
    </OfficeLayout>
  );
}
