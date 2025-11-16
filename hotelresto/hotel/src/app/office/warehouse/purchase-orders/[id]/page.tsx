'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  PackageIcon,
  ChevronLeftIcon,
  UserCheckIcon,
  Cancel01Icon,
  File01Icon,
  AlertCircleIcon,
  Delete02Icon,
  PencilEdit02Icon,
} from '@/lib/icons';

interface POItem {
  id: number;
  inventory_item: number;
  inventory_item_name: string;
  inventory_item_unit: string;
  quantity_ordered: number;
  unit_price: string;
  quantity_received: number;
  subtotal: string;
  is_fully_received: boolean;
  quantity_pending: number;
}

interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier: number;
  supplier_name: string;
  order_date: string;
  expected_delivery: string | null;
  status: 'DRAFT' | 'SUBMITTED' | 'RECEIVED' | 'CANCELLED';
  status_display: string;
  notes: string | null;
  total_amount: string;
  items: POItem[];
  items_count: number;
  created_by_name: string | null;
  received_by_name: string | null;
  received_date: string | null;
  created_at: string;
  updated_at: string;
}

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivingQuantities, setReceivingQuantities] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    if (params.id) {
      fetchPO();
    }
  }, [params.id]);

  const fetchPO = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl(`hotel/purchase-orders/${params.id}/`), {
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to fetch PO');

      const data = await response.json();
      setPO(data);

      // Initialize receiving quantities
      const initialQuantities: { [key: number]: number } = {};
      data.items.forEach((item: POItem) => {
        initialQuantities[item.id] = item.quantity_pending;
      });
      setReceivingQuantities(initialQuantities);
    } catch (error) {
      console.error('Error fetching PO:', error);
      alert('Failed to load purchase order');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPO = async () => {
    if (!po) return;

    if (!confirm('Submit purchase order ini? Status akan berubah menjadi SUBMITTED.')) return;

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`hotel/purchase-orders/${po.id}/submit/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to submit PO');

      alert('Purchase order berhasil disubmit!');
      fetchPO();
    } catch (error) {
      console.error('Error submitting PO:', error);
      alert('Gagal submit purchase order');
    }
  };

  const handleCancelPO = async () => {
    if (!po) return;

    if (!confirm('Cancel purchase order ini? Tindakan ini tidak dapat dibatalkan.')) return;

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`hotel/purchase-orders/${po.id}/cancel/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to cancel PO');

      alert('Purchase order berhasil dibatalkan');
      fetchPO();
    } catch (error) {
      console.error('Error cancelling PO:', error);
      alert('Gagal cancel purchase order');
    }
  };

  const handleReceiveGoods = async () => {
    if (!po) return;

    // Build items array for API
    const itemsToReceive = Object.entries(receivingQuantities)
      .filter(([_, quantity]) => quantity > 0)
      .map(([itemId, quantity]) => ({
        id: parseInt(itemId),
        quantity_received: quantity,
      }));

    if (itemsToReceive.length === 0) {
      alert('Masukkan quantity yang akan diterima');
      return;
    }

    try {
      const csrfToken = getCsrfToken();
      const response = await fetch(buildApiUrl(`hotel/purchase-orders/${po.id}/receive/`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({ items: itemsToReceive }),
      });

      if (!response.ok) throw new Error('Failed to receive goods');

      alert('Barang berhasil diterima! Stock telah diupdate.');
      setShowReceiveModal(false);
      fetchPO();
    } catch (error) {
      console.error('Error receiving goods:', error);
      alert('Gagal menerima barang');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED':
        return 'bg-blue-100 text-blue-800';
      case 'RECEIVED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return File01Icon;
      case 'SUBMITTED':
        return PackageIcon;
      case 'RECEIVED':
        return UserCheckIcon;
      case 'CANCELLED':
        return AlertCircleIcon;
      default:
        return PackageIcon;
    }
  };

  const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(numValue);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E61D3]"></div>
            <p className="text-gray-600 mt-4">Memuat purchase order...</p>
          </div>
        </div>
      </OfficeLayout>
    );
  }

  if (!po) {
    return (
      <OfficeLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Purchase order tidak ditemukan</p>
        </div>
      </OfficeLayout>
    );
  }

  const StatusIcon = getStatusIcon(po.status);
  const hasPendingItems = po.items.some((item) => item.quantity_pending > 0);

  return (
    <OfficeLayout>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/office/warehouse/purchase-orders')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          Kembali ke Daftar PO
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{po.po_number}</h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded ${getStatusColor(
                  po.status
                )}`}
              >
                <StatusIcon className="h-4 w-4" />
                {po.status_display}
              </span>
            </div>
            <p className="text-gray-600">Detail purchase order</p>
          </div>

          <div className="flex gap-2">
            {po.status === 'DRAFT' && (
              <>
                <button
                  onClick={handleSubmitPO}
                  className="bg-[#4E61D3] text-white px-4 py-2 text-sm hover:bg-[#3d4fa8] flex items-center gap-2"
                >
                  <UserCheckIcon className="h-4 w-4" />
                  Submit PO
                </button>
                <button
                  onClick={handleCancelPO}
                  className="bg-red-600 text-white px-4 py-2 text-sm hover:bg-red-700 flex items-center gap-2"
                >
                  <Cancel01Icon className="h-4 w-4" />
                  Cancel
                </button>
              </>
            )}

            {po.status === 'SUBMITTED' && hasPendingItems && (
              <button
                onClick={() => setShowReceiveModal(true)}
                className="bg-green-600 text-white px-4 py-2 text-sm hover:bg-green-700 flex items-center gap-2"
              >
                <PackageIcon className="h-4 w-4" />
                Terima Barang
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* PO Information */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi PO</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Supplier</label>
                <p className="font-medium text-gray-900">{po.supplier_name}</p>
              </div>

              <div>
                <label className="text-sm text-gray-600">Tanggal Order</label>
                <p className="font-medium text-gray-900">{formatDate(po.order_date)}</p>
              </div>

              {po.expected_delivery && (
                <div>
                  <label className="text-sm text-gray-600">Estimasi Pengiriman</label>
                  <p className="font-medium text-gray-900">{formatDate(po.expected_delivery)}</p>
                </div>
              )}

              <div>
                <label className="text-sm text-gray-600">Dibuat Oleh</label>
                <p className="font-medium text-gray-900">{po.created_by_name || '-'}</p>
              </div>

              {po.received_by_name && (
                <>
                  <div>
                    <label className="text-sm text-gray-600">Diterima Oleh</label>
                    <p className="font-medium text-gray-900">{po.received_by_name}</p>
                  </div>

                  {po.received_date && (
                    <div>
                      <label className="text-sm text-gray-600">Tanggal Diterima</label>
                      <p className="font-medium text-gray-900">{formatDate(po.received_date)}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {po.notes && (
              <div className="mt-4 pt-4 border-t">
                <label className="text-sm text-gray-600">Catatan</label>
                <p className="text-gray-900 mt-1">{po.notes}</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="bg-white border border-gray-200">
            <div className="p-4 bg-[#4E61D3] text-white">
              <h3 className="text-lg font-bold">Item Pesanan ({po.items_count})</h3>
            </div>

            <div className="overflow-visible">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                      Item
                    </th>
                    <th className="border px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                      Qty Order
                    </th>
                    <th className="border px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                      Qty Terima
                    </th>
                    <th className="border px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                      Pending
                    </th>
                    <th className="border px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                      Harga
                    </th>
                    <th className="border px-4 py-3 text-right text-xs font-bold text-gray-700 uppercase">
                      Subtotal
                    </th>
                    <th className="border px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {po.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="border px-4 py-3">
                        <div className="font-medium text-gray-900">{item.inventory_item_name}</div>
                        <div className="text-xs text-gray-500">{item.inventory_item_unit}</div>
                      </td>
                      <td className="border px-4 py-3 text-center font-medium">
                        {item.quantity_ordered}
                      </td>
                      <td className="border px-4 py-3 text-center">
                        <span className="text-green-600 font-medium">{item.quantity_received}</span>
                      </td>
                      <td className="border px-4 py-3 text-center">
                        <span
                          className={`font-medium ${
                            item.quantity_pending > 0 ? 'text-orange-600' : 'text-gray-400'
                          }`}
                        >
                          {item.quantity_pending}
                        </span>
                      </td>
                      <td className="border px-4 py-3 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="border px-4 py-3 text-right font-semibold text-[#4E61D3]">
                        {formatCurrency(item.subtotal)}
                      </td>
                      <td className="border px-4 py-3 text-center">
                        {item.is_fully_received ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                            <UserCheckIcon className="h-3 w-3" />
                            Complete
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded">
                            <AlertCircleIcon className="h-3 w-3" />
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ringkasan</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Items:</span>
                <span className="font-medium">{po.items_count} item</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Qty:</span>
                <span className="font-medium">
                  {po.items.reduce((sum, item) => sum + item.quantity_ordered, 0)} unit
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Qty Diterima:</span>
                <span className="font-medium text-green-600">
                  {po.items.reduce((sum, item) => sum + item.quantity_received, 0)} unit
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Qty Pending:</span>
                <span className="font-medium text-orange-600">
                  {po.items.reduce((sum, item) => sum + item.quantity_pending, 0)} unit
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="font-bold text-xl text-[#4E61D3]">
                    {formatCurrency(po.total_amount)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>Dibuat: {formatDate(po.created_at)}</p>
              <p>Diupdate: {formatDate(po.updated_at)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Receive Goods Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Terima Barang - {po.po_number}</h3>
                <button
                  onClick={() => setShowReceiveModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Cancel01Icon className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">
                Masukkan jumlah barang yang diterima untuk setiap item. Anda dapat menerima sebagian
                atau seluruh pesanan.
              </p>

              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="border px-4 py-2 text-left text-xs font-bold text-gray-700">
                      Item
                    </th>
                    <th className="border px-4 py-2 text-center text-xs font-bold text-gray-700">
                      Pending
                    </th>
                    <th className="border px-4 py-2 text-center text-xs font-bold text-gray-700">
                      Qty Terima
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {po.items
                    .filter((item) => item.quantity_pending > 0)
                    .map((item) => (
                      <tr key={item.id}>
                        <td className="border px-4 py-3">
                          <div className="font-medium">{item.inventory_item_name}</div>
                          <div className="text-xs text-gray-500">{item.inventory_item_unit}</div>
                        </td>
                        <td className="border px-4 py-3 text-center font-medium">
                          {item.quantity_pending}
                        </td>
                        <td className="border px-4 py-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max={item.quantity_pending}
                            value={receivingQuantities[item.id] || 0}
                            onChange={(e) =>
                              setReceivingQuantities({
                                ...receivingQuantities,
                                [item.id]: Math.min(
                                  Math.max(0, parseInt(e.target.value) || 0),
                                  item.quantity_pending
                                ),
                              })
                            }
                            className="w-24 px-3 py-2 border text-center"
                          />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowReceiveModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                onClick={handleReceiveGoods}
                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700"
              >
                Konfirmasi Penerimaan
              </button>
            </div>
          </div>
        </div>
      )}
    </OfficeLayout>
  );
}
