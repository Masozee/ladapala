'use client';

import React from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import Link from 'next/link';
import {
  PackageIcon,
  Archive03Icon,
  FileTextIcon,
  TruckDeliveryIcon,
  ArrowRightIcon,
  ClipboardCheckIcon,
  Shield01Icon,
  UserMultipleIcon,
  Building03Icon
} from '@/lib/icons';

export default function WarehouseDashboardPage() {
  const menuItems = [
    {
      title: 'Master Data Item',
      description: 'Kelola data barang inventory',
      icon: Archive03Icon,
      href: '/office/warehouse/master-data',
      color: 'bg-blue-500',
      stats: 'Lihat & kelola semua item'
    },
    {
      title: 'Department Buffers',
      description: 'Kelola buffer stock departemen',
      icon: Building03Icon,
      href: '/office/warehouse/department-buffers',
      color: 'bg-cyan-500',
      stats: 'Transfer & monitor stok departemen'
    },
    {
      title: 'Suppliers',
      description: 'Kelola data supplier',
      icon: UserMultipleIcon,
      href: '/office/suppliers',
      color: 'bg-teal-500',
      stats: 'Manajemen supplier & vendor'
    },
    {
      title: 'Purchase Orders',
      description: 'Kelola pesanan pembelian',
      icon: TruckDeliveryIcon,
      href: '/office/warehouse/purchase-orders',
      color: 'bg-green-500',
      stats: 'Buat & lacak PO'
    },
    {
      title: 'Stock Movements',
      description: 'Riwayat pergerakan stok',
      icon: FileTextIcon,
      href: '/office/warehouse/stock-movements',
      color: 'bg-purple-500',
      stats: 'Lihat semua transaksi stok'
    },
    {
      title: 'Stock Opname',
      description: 'Perhitungan fisik persediaan',
      icon: ClipboardCheckIcon,
      href: '/office/warehouse/stock-opname',
      color: 'bg-orange-500',
      stats: 'Hitung & sesuaikan stok fisik'
    },
    {
      title: 'Audit Trail',
      description: 'Riwayat aktivitas warehouse',
      icon: Shield01Icon,
      href: '/office/warehouse/audit',
      color: 'bg-indigo-500',
      stats: 'Lacak semua perubahan data'
    }
  ];

  return (
    <OfficeLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <PackageIcon className="h-8 w-8 text-[#4E61D3]" />
            <h1 className="text-3xl font-bold text-gray-900">Warehouse Management</h1>
          </div>
          <p className="text-gray-600">Sistem manajemen gudang dan inventori</p>
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

        {/* Quick Stats */}
        <div className="mt-8 bg-gradient-to-r from-[#4E61D3] to-[#3d4fa8] p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">Warehouse System</h2>
          <p className="text-blue-100">
            Kelola seluruh inventory, purchase order, dan pergerakan stok dalam satu sistem terintegrasi.
          </p>
        </div>
      </div>
    </OfficeLayout>
  );
}
