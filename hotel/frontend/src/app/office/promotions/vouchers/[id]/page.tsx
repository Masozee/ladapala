'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import Link from 'next/link';
import { buildApiUrl } from '@/lib/config';
import {
  ChevronLeftIcon,
  PencilEdit02Icon,
  Calendar01Icon,
  Clock01Icon,
  UserMultipleIcon,
} from '@/lib/icons';

interface Voucher {
  id: number;
  code: string;
  name: string;
  description: string;
  voucher_type: string;
  discount_percentage: string | null;
  discount_amount: string | null;
  max_discount_amount: string | null;
  usage_count: number;
  usage_limit: number | null;
  usage_remaining: number | string;
  usage_per_guest: number;
  valid_from: string;
  valid_until: string;
  min_booking_amount: string;
  min_nights: number;
  status: string;
  is_public: boolean;
  terms_and_conditions: string;
  is_currently_valid: boolean;
  created_at: string;
}

export default function VoucherDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [voucher, setVoucher] = useState<Voucher | null>(null);
  const [loading, setLoading] = useState(true);

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
      setVoucher(data);
    } catch (error) {
      console.error('Error fetching voucher:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      case 'USED_UP': return 'bg-gray-100 text-gray-800';
      case 'INACTIVE': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string | null | undefined) => {
    if (!amount) return 'Rp0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseFloat(amount));
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

  if (!voucher) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Voucher tidak ditemukan</div>
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
              href="/office/promotions/vouchers"
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{voucher.code}</h1>
              <p className="text-gray-600 mt-1">{voucher.name}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <span className={`px-3 py-1 text-sm font-medium ${getStatusColor(voucher.status)}`}>
              {voucher.status}
            </span>
            <Link
              href={`/office/promotions/vouchers/${voucher.id}/edit`}
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
                  <div className="text-sm text-gray-600">Type</div>
                  <div className="text-lg font-medium text-gray-900 mt-1">
                    {voucher.voucher_type === 'PERCENTAGE' && 'Percentage Discount'}
                    {voucher.voucher_type === 'FIXED_AMOUNT' && 'Fixed Amount'}
                    {voucher.voucher_type === 'FREE_NIGHT' && 'Free Night'}
                    {voucher.voucher_type === 'UPGRADE' && 'Room Upgrade'}
                  </div>
                </div>
                {voucher.discount_percentage && (
                  <div>
                    <div className="text-sm text-gray-600">Discount</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {voucher.discount_percentage}%
                    </div>
                  </div>
                )}
                {voucher.discount_amount && (
                  <div>
                    <div className="text-sm text-gray-600">Discount Amount</div>
                    <div className="text-2xl font-bold text-green-600 mt-1">
                      {formatCurrency(voucher.discount_amount)}
                    </div>
                  </div>
                )}
                {voucher.max_discount_amount && (
                  <div>
                    <div className="text-sm text-gray-600">Max Discount</div>
                    <div className="text-lg font-medium text-gray-900 mt-1">
                      {formatCurrency(voucher.max_discount_amount)}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">Min Booking Amount</div>
                  <div className="text-lg font-medium text-gray-900 mt-1">
                    {formatCurrency(voucher.min_booking_amount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Min Nights</div>
                  <div className="text-lg font-medium text-gray-900 mt-1">
                    {voucher.min_nights} night{voucher.min_nights > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>

            {/* Description */}
            {voucher.description && (
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{voucher.description}</p>
              </div>
            )}

            {/* Terms & Conditions */}
            {voucher.terms_and_conditions && (
              <div className="bg-white border border-gray-200 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Terms & Conditions</h2>
                <p className="text-gray-700 whitespace-pre-line">{voucher.terms_and_conditions}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Usage Stats */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Usage Statistics</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Used</div>
                  <div className="text-3xl font-bold text-gray-900 mt-1">
                    {voucher.usage_count}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Limit</div>
                  <div className="text-2xl font-medium text-gray-900 mt-1">
                    {voucher.usage_limit || 'Unlimited'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Remaining</div>
                  <div className="text-2xl font-medium text-green-600 mt-1">
                    {voucher.usage_remaining}
                  </div>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">Per Guest Limit</div>
                  <div className="text-lg font-medium text-gray-900 mt-1">
                    {voucher.usage_per_guest}x
                  </div>
                </div>
              </div>
            </div>

            {/* Validity Period */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Validity Period</h3>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Calendar01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Valid From</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(voucher.valid_from).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Calendar01Icon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <div className="text-xs text-gray-500">Valid Until</div>
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(voucher.valid_until).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  {voucher.is_currently_valid ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <div className="h-2 w-2 bg-green-600"></div>
                      <span className="text-sm font-medium">Currently Valid</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-red-600">
                      <div className="h-2 w-2 bg-red-600"></div>
                      <span className="text-sm font-medium">Not Valid</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Visibility */}
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Visibility</h3>
              <div className="flex items-center space-x-2">
                <UserMultipleIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-900">
                  {voucher.is_public ? 'Public Voucher' : 'Private Voucher'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}
