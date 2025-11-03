'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import Link from 'next/link';
import { buildApiUrl } from '@/lib/config';
import {
  ChevronLeftIcon,
  PencilEdit02Icon,
  Calendar01Icon,
  Clock01Icon,
  Alert01Icon,
} from '@/lib/icons';

interface Discount {
  id: number;
  name: string;
  description: string;
  discount_type: string;
  discount_percentage: string | null;
  discount_amount: string | null;
  max_discount_amount: string | null;
  min_booking_amount: string;
  min_nights: number;
  booking_window_days: number | null;
  applicable_days: string[];
  priority: number;
  is_active: boolean;
  start_date: string;
  end_date: string;
  conditions: string;
  created_at: string;
}

export default function DiscountDetailPage() {
  const params = useParams();
  const [discount, setDiscount] = useState<Discount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchDiscount();
    }
  }, [params.id]);

  const fetchDiscount = async () => {
    try {
      const response = await fetch(buildApiUrl(`hotel/discounts/${params.id}/`), {
        credentials: 'include',
      });
      const data = await response.json();
      setDiscount(data);
    } catch (error) {
      console.error('Error fetching discount:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDiscountTypeLabel = (type: string): string => {
    const typeMap: Record<string, string> = {
      'EARLY_BIRD': 'Early Bird',
      'LAST_MINUTE': 'Last Minute',
      'LONG_STAY': 'Long Stay',
      'SEASONAL': 'Seasonal',
      'MEMBERSHIP': 'Membership',
      'PACKAGE': 'Package Deal',
    };
    return typeMap[type] || type;
  };

  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return 'Rp0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getDayLabel = (day: string): string => {
    const dayMap: Record<string, string> = {
      'MONDAY': 'Senin',
      'TUESDAY': 'Selasa',
      'WEDNESDAY': 'Rabu',
      'THURSDAY': 'Kamis',
      'FRIDAY': 'Jumat',
      'SATURDAY': 'Sabtu',
      'SUNDAY': 'Minggu',
    };
    return dayMap[day] || day;
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

  if (!discount) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Diskon tidak ditemukan</div>
        </div>
      </OfficeLayout>
    );
  }

  return (
    <OfficeLayout>
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Link
              href="/office/promotions/discounts"
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{discount.name}</h1>
              <p className="text-gray-600 mt-1">{getDiscountTypeLabel(discount.discount_type)}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 text-sm font-medium ${
              discount.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {discount.is_active ? 'Active' : 'Inactive'}
            </span>
            <Link
              href={`/office/promotions/discounts/${discount.id}/edit`}
              className="flex items-center space-x-2 px-4 py-2 bg-[#4E61D3] text-white hover:bg-[#3D4EA8] transition-colors"
            >
              <PencilEdit02Icon className="h-4 w-4" />
              <span>Edit</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Discount Details */}
            <div className="bg-white border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Discount Details</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-600">Discount Type</div>
                  <div className="text-lg font-medium text-gray-900 mt-1">
                    {getDiscountTypeLabel(discount.discount_type)}
                  </div>
                </div>
                {discount.discount_percentage && (
                  <div>
                    <div className="text-sm text-gray-600">Discount</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {discount.discount_percentage}%
                    </div>
                  </div>
                )}
                {discount.discount_amount && (
                  <div>
                    <div className="text-sm text-gray-600">Discount Amount</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {formatCurrency(discount.discount_amount)}
                    </div>
                  </div>
                )}
                {discount.max_discount_amount && (
                  <div>
                    <div className="text-sm text-gray-600">Max Discount</div>
                    <div className="text-lg font-medium text-gray-900 mt-1">
                      {formatCurrency(discount.max_discount_amount)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">Min Booking Amount</div>
                  <div className="text-lg font-medium text-gray-900 mt-1">
                    {formatCurrency(discount.min_booking_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Min Nights</div>
                  <div className="text-lg font-medium text-gray-900 mt-1">
                    {discount.min_nights} night{discount.min_nights > 1 ? 's' : ''}
                  </div>
                </div>
                {discount.booking_window_days && (
                  <div>
                    <div className="text-sm text-gray-600">Booking Window</div>
                    <div className="text-lg font-medium text-gray-900 mt-1">
                      {discount.booking_window_days} days
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">Priority</div>
                  <div className="text-lg font-medium text-gray-900 mt-1">
                    {discount.priority}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {discount.description && (
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{discount.description}</p>
              </div>
            )}

            {/* Conditions */}
            {discount.conditions && (
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Conditions</h2>
                <p className="text-gray-700 whitespace-pre-line">{discount.conditions}</p>
              </div>
            )}

            {/* Applicable Days */}
            {discount.applicable_days && discount.applicable_days.length > 0 && (
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Applicable Days</h2>
                <div className="flex flex-wrap gap-2">
                  {discount.applicable_days.map((day) => (
                    <span
                      key={day}
                      className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800"
                    >
                      {getDayLabel(day)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Validity Period */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Validity Period</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Calendar01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Start Date</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(discount.start_date)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">End Date</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(discount.end_date)}
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  {discount.is_active ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="h-2 w-2 bg-green-600"></div>
                      <span className="text-sm font-medium">Currently Active</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-gray-600">
                      <div className="h-2 w-2 bg-gray-600"></div>
                      <span className="text-sm font-medium">Inactive</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Metadata</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Clock01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Created At</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(discount.created_at)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}
