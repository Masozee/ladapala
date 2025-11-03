'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import Link from 'next/link';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import { ChevronLeftIcon } from '@/lib/icons';

interface VoucherFormData {
  code: string;
  name: string;
  description: string;
  voucher_type: string;
  discount_percentage: string;
  discount_amount: string;
  max_discount_amount: string;
  min_booking_amount: string;
  min_nights: string;
  usage_limit: string;
  usage_limit_per_guest: string;
  is_public: boolean;
  status: string;
  valid_from: string;
  valid_until: string;
  terms_conditions: string;
}

export default function EditVoucherPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<VoucherFormData>({
    code: '',
    name: '',
    description: '',
    voucher_type: 'PERCENTAGE',
    discount_percentage: '',
    discount_amount: '',
    max_discount_amount: '',
    min_booking_amount: '0',
    min_nights: '1',
    usage_limit: '',
    usage_limit_per_guest: '1',
    is_public: true,
    status: 'ACTIVE',
    valid_from: '',
    valid_until: '',
    terms_conditions: '',
  });

  useEffect(() => {
    if (params.id) {
      fetchVoucher();
    }
  }, [params.id]);

  const fetchVoucher = async () => {
    try {
      const response = await fetch(buildApiUrl(`hotel/vouchers/${params.id}/`), {
        credentials: 'include',
      });
      const data = await response.json();

      setFormData({
        code: data.code || '',
        name: data.name || '',
        description: data.description || '',
        voucher_type: data.voucher_type || 'PERCENTAGE',
        discount_percentage: data.discount_percentage || '',
        discount_amount: data.discount_amount || '',
        max_discount_amount: data.max_discount_amount || '',
        min_booking_amount: data.min_booking_amount || '0',
        min_nights: data.min_nights?.toString() || '1',
        usage_limit: data.usage_limit?.toString() || '',
        usage_limit_per_guest: data.usage_limit_per_guest?.toString() || '1',
        is_public: data.is_public ?? true,
        status: data.status || 'ACTIVE',
        valid_from: data.valid_from ? data.valid_from.split('T')[0] : '',
        valid_until: data.valid_until ? data.valid_until.split('T')[0] : '',
        terms_conditions: data.terms_conditions || '',
      });
    } catch (error) {
      console.error('Error fetching voucher:', error);
      alert('Gagal memuat data voucher');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const csrfToken = getCsrfToken();
      const payload: any = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        voucher_type: formData.voucher_type,
        min_booking_amount: formData.min_booking_amount || '0',
        min_nights: parseInt(formData.min_nights) || 1,
        usage_limit_per_guest: parseInt(formData.usage_limit_per_guest) || 1,
        is_public: formData.is_public,
        status: formData.status,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        terms_conditions: formData.terms_conditions,
      };

      // Add discount percentage or amount based on type
      if (formData.voucher_type === 'PERCENTAGE' && formData.discount_percentage) {
        payload.discount_percentage = formData.discount_percentage;
      }
      if ((formData.voucher_type === 'FIXED_AMOUNT' || formData.voucher_type === 'FREE_NIGHT') && formData.discount_amount) {
        payload.discount_amount = formData.discount_amount;
      }
      if (formData.max_discount_amount) {
        payload.max_discount_amount = formData.max_discount_amount;
      }
      if (formData.usage_limit) {
        payload.usage_limit = parseInt(formData.usage_limit);
      }

      const response = await fetch(buildApiUrl(`hotel/vouchers/${params.id}/`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push(`/office/promotions/vouchers/${params.id}`);
      } else {
        const error = await response.json();
        alert(`Gagal menyimpan: ${JSON.stringify(error)}`);
      }
    } catch (error) {
      console.error('Error saving voucher:', error);
      alert('Gagal menyimpan voucher');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Memuat data...</div>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <Link
            href={`/office/promotions/vouchers/${params.id}`}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Voucher</h1>
            <p className="text-gray-600 mt-1">Perbarui informasi voucher</p>
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
                    Voucher Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent uppercase"
                    placeholder="PROMO2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Voucher <span className="text-red-500">*</span>
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

            {/* Voucher Type & Discount */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Discount Details</h2>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voucher Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.voucher_type}
                    onChange={(e) => setFormData({ ...formData, voucher_type: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  >
                    <option value="PERCENTAGE">Percentage Discount</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                    <option value="FREE_NIGHT">Free Night</option>
                    <option value="UPGRADE">Room Upgrade</option>
                  </select>
                </div>

                {formData.voucher_type === 'PERCENTAGE' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Percentage (%) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        required
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                      />
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
                    </div>
                  </div>
                )}

                {(formData.voucher_type === 'FIXED_AMOUNT' || formData.voucher_type === 'FREE_NIGHT') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Discount Amount (Rp) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="1000"
                      min="0"
                      required
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Conditions */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Usage Conditions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Booking Amount (Rp)
                  </label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    value={formData.min_booking_amount}
                    onChange={(e) => setFormData({ ...formData, min_booking_amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Nights
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_nights}
                    onChange={(e) => setFormData({ ...formData, min_nights: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Usage Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Kosongkan untuk unlimited</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Usage Limit Per Guest
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usage_limit_per_guest}
                    onChange={(e) => setFormData({ ...formData, usage_limit_per_guest: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Validity Period */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Validity Period</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid From <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            {/* Terms & Conditions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions
              </label>
              <textarea
                value={formData.terms_conditions}
                onChange={(e) => setFormData({ ...formData, terms_conditions: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                placeholder="Syarat dan ketentuan penggunaan voucher..."
              />
            </div>

            {/* Settings */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_public}
                      onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                      className="h-4 w-4 text-[#4E61D3] focus:ring-[#4E61D3] border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">Public (Visible to all guests)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4 mt-6">
            <Link
              href={`/office/promotions/vouchers/${params.id}`}
              className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-[#4E61D3] text-white hover:bg-[#3D4EA8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </button>
          </div>
        </form>
      </div>
    </OfficeLayout>
  );
}
