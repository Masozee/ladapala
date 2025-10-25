'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { buildApiUrl } from '@/lib/config';
import {
  Cancel01Icon,
  UserCheckIcon,
  ChevronLeftIcon
} from '@/lib/icons';

interface RoomType {
  id: number;
  name: string;
  description: string;
  base_price: string;
  max_occupancy: number;
  size_sqm: number | null;
  amenities: string;
  is_active: boolean;
}

export default function EditRoomTypePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<RoomType>({
    id: 0,
    name: '',
    description: '',
    base_price: '',
    max_occupancy: 1,
    size_sqm: null,
    amenities: '',
    is_active: true,
  });

  useEffect(() => {
    const fetchRoomType = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl(`hotel/room-types/${id}/`), {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch room type');
        }

        const data = await response.json();
        setFormData(data);
      } catch (err) {
        setError('Failed to load room type');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchRoomType();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(buildApiUrl(`hotel/room-types/${id}/`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update room type');
      }

      router.push('/rooms');
    } catch (err: any) {
      setError(err.message || 'Failed to save changes');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#005357] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Room Type</h1>
          <p className="text-gray-600 mt-2">Update room type information and settings</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 p-6">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Room Type Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#005357]"
                placeholder="e.g., Deluxe Room, Suite"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#005357]"
                placeholder="Describe the room type..."
              />
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Base Price */}
              <div>
                <label htmlFor="base_price" className="block text-sm font-medium text-gray-700 mb-2">
                  Base Price (IDR) *
                </label>
                <input
                  type="number"
                  id="base_price"
                  name="base_price"
                  required
                  min="0"
                  step="1000"
                  value={formData.base_price}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#005357]"
                  placeholder="500000"
                />
              </div>

              {/* Max Occupancy */}
              <div>
                <label htmlFor="max_occupancy" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Occupancy *
                </label>
                <input
                  type="number"
                  id="max_occupancy"
                  name="max_occupancy"
                  required
                  min="1"
                  value={formData.max_occupancy}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#005357]"
                  placeholder="2"
                />
              </div>

              {/* Room Size */}
              <div>
                <label htmlFor="size_sqm" className="block text-sm font-medium text-gray-700 mb-2">
                  Room Size (sqm)
                </label>
                <input
                  type="number"
                  id="size_sqm"
                  name="size_sqm"
                  min="0"
                  step="0.1"
                  value={formData.size_sqm || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#005357]"
                  placeholder="25"
                />
              </div>
            </div>

            {/* Amenities */}
            <div>
              <label htmlFor="amenities" className="block text-sm font-medium text-gray-700 mb-2">
                Amenities
              </label>
              <textarea
                id="amenities"
                name="amenities"
                rows={3}
                value={formData.amenities || ''}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#005357]"
                placeholder="WiFi, TV, AC, Mini Bar (comma separated)"
              />
              <p className="text-xs text-gray-500 mt-1">Separate amenities with commas</p>
            </div>

            {/* Active Status */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-[#005357] focus:ring-[#005357]"
                />
                <span className="text-sm font-medium text-gray-700">Active (available for booking)</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center"
            >
              <Cancel01Icon className="h-4 w-4 mr-2" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#005357] text-white hover:bg-[#004147] transition-colors disabled:opacity-50 flex items-center"
            >
              <UserCheckIcon className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
