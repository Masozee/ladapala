'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  UserIcon,
  Cancel01Icon,
  UserCheckIcon,
  ChevronLeftIcon,
  SparklesIcon
} from '@/lib/icons';

interface GuestFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  id_type: string;
  id_number: string;
  address: string;
  preferences: string;
  allergies: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  is_vip: boolean;
}

export default function EditGuestPage() {
  const router = useRouter();
  const params = useParams();
  const guestId = params?.id as string;

  const [formData, setFormData] = useState<GuestFormData>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    gender: '',
    nationality: '',
    id_type: 'passport',
    id_number: '',
    address: '',
    preferences: '',
    allergies: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relation: '',
    is_vip: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!guestId) return;

    const fetchGuest = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl(`hotel/guests/${guestId}/`), {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to fetch guest data');
        }

        const data = await response.json();
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
          date_of_birth: data.date_of_birth || '',
          gender: data.gender || '',
          nationality: data.nationality || '',
          id_type: data.id_type || 'passport',
          id_number: data.id_number || '',
          address: data.address || '',
          preferences: data.preferences || '',
          allergies: data.allergies || '',
          emergency_contact_name: data.emergency_contact_name || '',
          emergency_contact_phone: data.emergency_contact_phone || '',
          emergency_contact_relation: data.emergency_contact_relation || '',
          is_vip: data.is_vip || false,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load guest');
        console.error('Error fetching guest:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGuest();
  }, [guestId]);

  const handleChange = (field: keyof GuestFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`hotel/guests/${guestId}/`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update guest');
      }

      router.push(`/guests/${guestId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update guest');
      console.error('Error updating guest:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4E61D3] mx-auto mb-4"></div>
            <p className="text-gray-600">Loading guest data...</p>
          </div>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push(`/guests/${guestId}`)}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Guest</h1>
            <p className="text-gray-600 mt-1">Update guest information</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <div className="flex items-center">
              <Cancel01Icon className="h-5 w-5 text-red-400 mr-3" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form - Left & Center Columns */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">Basic Information</h2>
                    <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                      <UserIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => handleChange('first_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => handleChange('last_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleChange('date_of_birth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        value={formData.gender}
                        onChange={(e) => handleChange('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      >
                        <option value="">Select Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nationality
                      </label>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => handleChange('nationality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                        placeholder="e.g., Malaysia, Indonesia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID Type
                      </label>
                      <select
                        value={formData.id_type}
                        onChange={(e) => handleChange('id_type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      >
                        <option value="passport">Passport</option>
                        <option value="national_id">National ID</option>
                        <option value="driving_license">Driving License</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID Number
                      </label>
                      <input
                        type="text"
                        value={formData.id_number}
                        onChange={(e) => handleChange('id_number', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3] resize-none"
                      placeholder="Enter full address"
                    />
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Emergency Contact</h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_name}
                        onChange={(e) => handleChange('emergency_contact_name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.emergency_contact_phone}
                        onChange={(e) => handleChange('emergency_contact_phone', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relation
                      </label>
                      <input
                        type="text"
                        value={formData.emergency_contact_relation}
                        onChange={(e) => handleChange('emergency_contact_relation', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                        placeholder="e.g., Spouse, Parent, Sibling"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences & Allergies */}
              <div className="bg-white border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">Preferences & Special Requirements</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Preferences
                      </label>
                      <textarea
                        value={formData.preferences}
                        onChange={(e) => handleChange('preferences', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3] resize-none"
                        placeholder="Room preferences, bed type, floor, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Allergies
                      </label>
                      <textarea
                        value={formData.allergies}
                        onChange={(e) => handleChange('allergies', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-[#4E61D3] focus:border-[#4E61D3] resize-none"
                        placeholder="Food allergies, medical conditions"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - VIP Status */}
            <div>
              <div className="bg-white border border-gray-200 sticky top-6">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900">VIP Status</h3>
                    <div className="w-8 h-8 bg-[#4E61D3] flex items-center justify-center">
                      <SparklesIcon className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_vip}
                      onChange={(e) => handleChange('is_vip', e.target.checked)}
                      className="w-5 h-5 text-[#4E61D3] border-gray-300 rounded focus:ring-[#4E61D3]"
                    />
                    <span className="text-sm font-medium text-gray-900">Mark as VIP Guest</span>
                  </label>
                  <p className="mt-3 text-sm text-gray-600">
                    VIP guests receive premium service and special attention
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="p-6 border-t border-gray-200 space-y-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#4E61D3] text-white font-medium hover:bg-[#3D4EA8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <UserCheckIcon className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/guests/${guestId}`)}
                    disabled={saving}
                    className="w-full px-4 py-3 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </OfficeLayout>
  );
}
