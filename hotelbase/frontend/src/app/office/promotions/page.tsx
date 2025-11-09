'use client';

import React from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import Link from 'next/link';
import {
  SparklesIcon,
  CreditCardIcon,
  ArrowRightIcon,
  UserMultipleIcon,
} from '@/lib/icons';

export default function PromotionsDashboardPage() {
  const menuItems = [
    {
      title: 'Vouchers',
      description: 'Kelola kode voucher dan promosi',
      icon: SparklesIcon,
      href: '/office/promotions/vouchers',
      color: 'bg-purple-500',
      stats: 'Buat & kelola voucher diskon'
    },
    {
      title: 'Discounts',
      description: 'Atur diskon otomatis',
      icon: CreditCardIcon,
      href: '/office/promotions/discounts',
      color: 'bg-green-500',
      stats: 'Early bird, last minute, long stay'
    },
    {
      title: 'Loyalty Program',
      description: 'Program poin pelanggan',
      icon: UserMultipleIcon,
      href: '/office/promotions/loyalty',
      color: 'bg-blue-500',
      stats: 'Kelola poin reward tamu'
    }
  ];

  return (
    <OfficeLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SparklesIcon className="h-8 w-8 text-[#4E61D3]" />
            <h1 className="text-3xl font-bold text-gray-900">Promotions & Rewards</h1>
          </div>
          <p className="text-gray-600">Kelola voucher, diskon otomatis, dan program loyalitas pelanggan</p>
        </div>

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block bg-white border border-gray-200 hover:shadow-lg transition-all duration-200 hover:border-[#4E61D3] group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`${item.color} p-3`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-[#4E61D3] group-hover:translate-x-1 transition-all" />
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-[#4E61D3] transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3">
                    {item.description}
                  </p>

                  <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2">
                    {item.stats}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </OfficeLayout>
  );
}
