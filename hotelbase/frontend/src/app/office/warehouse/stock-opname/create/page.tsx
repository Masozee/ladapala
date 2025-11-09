'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  ChevronLeftIcon,
  Add01Icon,
  Calendar01Icon,
  Location01Icon,
} from '@/lib/icons';

export default function CreateStockOpnamePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    opname_date: new Date().toISOString().split('T')[0],
    location: 'Main Warehouse',
    notes: '',
    auto_populate_items: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.opname_date) {
      alert('Mohon isi tanggal opname');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(buildApiUrl('hotel/stock-opnames/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCsrfToken() || '',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Stock opname berhasil dibuat!');
        // Redirect to the detail page to start counting
        router.push(`/office/warehouse/stock-opname/${data.id}`);
      } else {
        const error = await response.json();
        alert('Gagal membuat stock opname: ' + (error.detail || JSON.stringify(error)));
      }
    } catch (error) {
      console.error('Error creating opname:', error);
      alert('Terjadi kesalahan saat membuat stock opname');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <OfficeLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.push('/office/warehouse/stock-opname')}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Buat Stock Opname Baru</h1>
            <p className="text-gray-600 mt-1">Mulai perhitungan fisik persediaan barang</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Opname Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar01Icon className="inline h-4 w-4 mr-1" />
                Tanggal Opname <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.opname_date}
                onChange={(e) => setFormData({ ...formData, opname_date: e.target.value })}
                required
                className="px-3 py-2 w-full border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tanggal dilakukannya perhitungan fisik
              </p>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Location01Icon className="inline h-4 w-4 mr-1" />
                Lokasi <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
                className="px-3 py-2 w-full border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
              >
                <option value="Main Warehouse">Main Warehouse</option>
                <option value="Kitchen Storage">Kitchen Storage</option>
                <option value="Bar Storage">Bar Storage</option>
                <option value="Housekeeping Storage">Housekeeping Storage</option>
                <option value="Laundry Storage">Laundry Storage</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Lokasi gudang yang akan dihitung
              </p>
            </div>

            {/* Auto Populate */}
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.auto_populate_items}
                  onChange={(e) => setFormData({ ...formData, auto_populate_items: e.target.checked })}
                  className="w-4 h-4 text-[#4E61D3] border-gray-300 rounded focus:ring-[#4E61D3]"
                />
                <span className="text-sm font-medium text-gray-700">
                  Otomatis tambahkan semua item aktif
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Jika dicentang, semua item inventory yang aktif akan ditambahkan secara otomatis
              </p>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catatan (Opsional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="px-3 py-2 w-full border border-gray-300 rounded focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                placeholder="Contoh: Stock opname bulanan periode November 2025"
              />
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-medium text-blue-900 mb-2">Informasi</h3>
              <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                <li>Stock opname akan dibuat dengan status <strong>DRAFT</strong></li>
                <li>Anda dapat menambah/menghapus item sebelum memulai perhitungan</li>
                <li>Sistem akan merekam stok sistem saat ini untuk setiap item</li>
                <li>Klik tombol "Mulai Perhitungan" untuk memulai input data fisik</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-[#4E61D3] text-white rounded hover:bg-[#3D4EA8] transition disabled:opacity-50 font-medium"
              >
                {submitting ? 'Membuat...' : 'Buat Stock Opname'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/office/warehouse/stock-opname')}
                disabled={submitting}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition font-medium"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </OfficeLayout>
  );
}
