'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import Link from 'next/link';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import { ChevronLeftIcon } from '@/lib/icons';

interface DiscountFormData {
  name: string;
  description: string;
  discount_type: string;
  discount_percentage: string;
  discount_amount: string;
  max_discount_amount: string;
  min_booking_amount: string;
  min_nights: string;
  booking_window_days: string;
  applicable_days: string[];
  priority: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
  conditions: string;
}

export default function NewDiscountPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<DiscountFormData>({
    name: '',
    description: '',
    discount_type: 'EARLY_BIRD',
    discount_percentage: '',
    discount_amount: '',
    max_discount_amount: '',
    min_booking_amount: '0',
    min_nights: '1',
    booking_window_days: '',
    applicable_days: [],
    priority: '1',
    is_active: true,
    start_date: '',
    end_date: '',
    conditions: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const csrfToken = getCsrfToken();
      const payload: any = {
        name: formData.name,
        description: formData.description,
        discount_type: formData.discount_type,
        min_booking_amount: formData.min_booking_amount || '0',
        min_nights: parseInt(formData.min_nights) || 1,
        priority: parseInt(formData.priority) || 1,
        is_active: formData.is_active,
        valid_from: formData.start_date,
        valid_until: formData.end_date,
        conditions: formData.conditions,
      };

      // Add discount percentage or amount
      if (formData.discount_percentage) {
        payload.discount_percentage = formData.discount_percentage;
      }
      if (formData.discount_amount) {
        payload.discount_amount = formData.discount_amount;
      }
      if (formData.max_discount_amount) {
        payload.max_discount_amount = formData.max_discount_amount;
      }
      if (formData.booking_window_days) {
        payload.booking_window_days = parseInt(formData.booking_window_days);
      }
      if (formData.applicable_days.length > 0) {
        payload.applicable_days = formData.applicable_days;
      }

      const response = await fetch(buildApiUrl('hotel/discounts/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert('Diskon berhasil dibuat!');
        router.push('/office/promotions');
      } else {
        const error = await response.json();
        alert(`Gagal menyimpan: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error creating discount:', error);
      alert('Gagal membuat diskon');
    } finally {
      setSaving(false);
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      applicable_days: prev.applicable_days.includes(day)
        ? prev.applicable_days.filter(d => d !== day)
        : [...prev.applicable_days, day]
    }));
  };

  const daysOfWeek = [
    { value: 'MONDAY', label: 'Senin' },
    { value: 'TUESDAY', label: 'Selasa' },
    { value: 'WEDNESDAY', label: 'Rabu' },
    { value: 'THURSDAY', label: 'Kamis' },
    { value: 'FRIDAY', label: 'Jumat' },
    { value: 'SATURDAY', label: 'Sabtu' },
    { value: 'SUNDAY', label: 'Minggu' },
  ];

  return (
    <OfficeLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link
            href="/office/promotions"
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buat Discount Baru</h1>
            <p className="text-gray-600 mt-1">Tambahkan diskon promosi baru</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-4xl">
          <div className="bg-white border border-gray-200 p-6 space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Diskon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipe Diskon <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  >
                    <option value="EARLY_BIRD">Early Bird</option>
                    <option value="LAST_MINUTE">Last Minute</option>
                    <option value="LONG_STAY">Long Stay</option>
                    <option value="SEASONAL">Seasonal</option>
                    <option value="MEMBERSHIP">Membership</option>
                    <option value="PACKAGE">Package Deal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Discount Amount */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Discount Amount</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Percentage (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.discount_percentage}
                    onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value, discount_amount: '' })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kosongkan jika menggunakan fixed amount</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Amount (Rp)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={formData.discount_amount}
                    onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value, discount_percentage: '' })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kosongkan jika menggunakan percentage</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Discount Amount (Rp)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={formData.max_discount_amount}
                    onChange={(e) => setFormData({ ...formData, max_discount_amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Opsional, untuk membatasi maksimal diskon</p>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Conditions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Booking Amount (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    required
                    value={formData.min_booking_amount}
                    onChange={(e) => setFormData({ ...formData, min_booking_amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Nights <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.min_nights}
                    onChange={(e) => setFormData({ ...formData, min_nights: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Booking Window (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.booking_window_days}
                    onChange={(e) => setFormData({ ...formData, booking_window_days: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Berapa hari sebelum check-in harus booking</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Prioritas diskon (angka lebih rendah = prioritas lebih tinggi)</p>
                </div>
              </div>
            </div>

            {/* Applicable Days */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Applicable Days</h2>
              <p className="text-sm text-gray-600 mb-4">Pilih hari-hari yang berlaku untuk diskon ini</p>
              <div className="flex flex-wrap gap-3">
                {daysOfWeek.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={`px-4 py-2 border transition-colors ${
                      formData.applicable_days.includes(day.value)
                        ? 'bg-[#4E61D3] text-white border-[#4E61D3]'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">Kosongkan jika berlaku untuk semua hari</p>
            </div>

            {/* Validity Period */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Validity Period</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Additional Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Conditions
              </label>
              <textarea
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                placeholder="Syarat dan ketentuan tambahan..."
              />
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 text-[#4E61D3] focus:ring-[#4E61D3] border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Active</span>
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-6">
            <Link
              href="/office/promotions"
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#4E61D3] text-white hover:bg-[#3D4EA8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Menyimpan...' : 'Buat Discount'}
            </button>
          </div>
        </form>
      </div>
    </OfficeLayout>
  );
}
