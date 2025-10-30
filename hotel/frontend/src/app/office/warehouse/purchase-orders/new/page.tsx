'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import OfficeLayout from '@/components/OfficeLayout';
import { buildApiUrl, getCsrfToken } from '@/lib/config';
import {
  PackageIcon,
  Add01Icon,
  Delete02Icon,
  ChevronLeftIcon,
  Search02Icon,
  Cancel01Icon,
} from '@/lib/icons';

interface InventoryItem {
  id: number;
  name: string;
  unit_price: string;
  unit_of_measurement: string;
  current_stock: number;
  supplier: string | null;
}

interface POItem {
  inventory_item: number;
  inventory_item_name?: string;
  quantity_ordered: number;
  unit_price: string;
  unit_of_measurement?: string;
}

export default function NewPurchaseOrderPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showItemSearch, setShowItemSearch] = useState(false);

  // PO Form Data
  const [supplier, setSupplier] = useState('');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<POItem[]>([]);

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const response = await fetch(buildApiUrl('hotel/inventory/'), {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setInventoryItems(data.results || data);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const addItem = (inventoryItem: InventoryItem) => {
    // Check if item already exists
    const existingItem = items.find((item) => item.inventory_item === inventoryItem.id);
    if (existingItem) {
      alert('Item sudah ditambahkan');
      return;
    }

    const newItem: POItem = {
      inventory_item: inventoryItem.id,
      inventory_item_name: inventoryItem.name,
      quantity_ordered: 1,
      unit_price: inventoryItem.unit_price,
      unit_of_measurement: inventoryItem.unit_of_measurement,
    };

    setItems([...items, newItem]);
    setShowItemSearch(false);
    setSearchQuery('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...items];
    updatedItems[index].quantity_ordered = Math.max(1, quantity);
    setItems(updatedItems);
  };

  const updateItemPrice = (index: number, price: string) => {
    const updatedItems = [...items];
    updatedItems[index].unit_price = price;
    setItems(updatedItems);
  };

  const calculateSubtotal = (item: POItem) => {
    return item.quantity_ordered * parseFloat(item.unit_price);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + calculateSubtotal(item), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async (submitStatus: 'DRAFT' | 'SUBMITTED') => {
    if (!supplier.trim()) {
      alert('Supplier harus diisi');
      return;
    }

    if (items.length === 0) {
      alert('Tambahkan minimal satu item');
      return;
    }

    setLoading(true);

    try {
      const csrfToken = getCsrfToken();

      // Create PO
      const poResponse = await fetch(buildApiUrl('hotel/purchase-orders/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRFToken': csrfToken }),
        },
        credentials: 'include',
        body: JSON.stringify({
          supplier,
          order_date: orderDate,
          expected_delivery: expectedDelivery || null,
          notes,
          status: 'DRAFT',
        }),
      });

      if (!poResponse.ok) throw new Error('Failed to create purchase order');

      const poData = await poResponse.json();

      // Add items to PO
      for (const item of items) {
        const itemResponse = await fetch(
          buildApiUrl(`hotel/purchase-orders/${poData.id}/add_item/`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(csrfToken && { 'X-CSRFToken': csrfToken }),
            },
            credentials: 'include',
            body: JSON.stringify({
              inventory_item: item.inventory_item,
              quantity_ordered: item.quantity_ordered,
              unit_price: item.unit_price,
            }),
          }
        );

        if (!itemResponse.ok) throw new Error('Failed to add item');
      }

      // Submit if requested
      if (submitStatus === 'SUBMITTED') {
        const submitResponse = await fetch(
          buildApiUrl(`hotel/purchase-orders/${poData.id}/submit/`),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(csrfToken && { 'X-CSRFToken': csrfToken }),
            },
            credentials: 'include',
          }
        );

        if (!submitResponse.ok) throw new Error('Failed to submit purchase order');
      }

      alert(
        submitStatus === 'SUBMITTED'
          ? 'Purchase order berhasil dibuat dan disubmit!'
          : 'Purchase order berhasil disimpan sebagai draft!'
      );
      router.push('/office/warehouse/purchase-orders');
    } catch (error) {
      console.error('Error creating purchase order:', error);
      alert('Gagal membuat purchase order');
    } finally {
      setLoading(false);
    }
  };

  const filteredInventory = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <OfficeLayout>
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" />
          Kembali
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Buat Purchase Order Baru</h1>
        <p className="text-gray-600 mt-2">Buat pesanan pembelian barang dari supplier</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - PO Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Informasi Dasar</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Supplier <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Nama supplier"
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Order <span className="text-red-600">*</span>
                </label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimasi Pengiriman
                </label>
                <input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Catatan</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan tambahan (opsional)"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Item Pesanan</h3>
              <button
                onClick={() => setShowItemSearch(!showItemSearch)}
                className="bg-[#4E61D3] text-white px-4 py-2 text-sm hover:bg-[#3d4fa8] flex items-center gap-2"
              >
                <Add01Icon className="h-4 w-4" />
                Tambah Item
              </button>
            </div>

            {/* Item Search Modal */}
            {showItemSearch && (
              <div className="mb-4 p-4 border border-gray-300 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Pilih Item dari Inventory</h4>
                  <button
                    onClick={() => setShowItemSearch(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Cancel01Icon className="h-5 w-5" />
                  </button>
                </div>

                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search02Icon className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Cari item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 w-full text-sm"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredInventory.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => addItem(item)}
                      className="w-full text-left px-3 py-2 hover:bg-white border border-transparent hover:border-[#4E61D3] transition-colors"
                    >
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500">
                        Stock: {item.current_stock} {item.unit_of_measurement} | Harga:{' '}
                        {formatCurrency(parseFloat(item.unit_price))}
                      </div>
                    </button>
                  ))}
                  {filteredInventory.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Tidak ada item ditemukan
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Items Table */}
            {items.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <PackageIcon className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>Belum ada item. Klik "Tambah Item" untuk menambahkan.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-3 py-2 text-left text-xs font-bold text-gray-700">
                        Item
                      </th>
                      <th className="border px-3 py-2 text-center text-xs font-bold text-gray-700">
                        Qty
                      </th>
                      <th className="border px-3 py-2 text-right text-xs font-bold text-gray-700">
                        Harga Satuan
                      </th>
                      <th className="border px-3 py-2 text-right text-xs font-bold text-gray-700">
                        Subtotal
                      </th>
                      <th className="border px-3 py-2 text-center text-xs font-bold text-gray-700 w-16">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={index}>
                        <td className="border px-3 py-2">
                          <div className="font-medium">{item.inventory_item_name}</div>
                          <div className="text-xs text-gray-500">{item.unit_of_measurement}</div>
                        </td>
                        <td className="border px-3 py-2">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity_ordered}
                            onChange={(e) => updateItemQuantity(index, parseInt(e.target.value))}
                            className="w-20 px-2 py-1 border text-center"
                          />
                        </td>
                        <td className="border px-3 py-2">
                          <input
                            type="number"
                            step="0.01"
                            value={item.unit_price}
                            onChange={(e) => updateItemPrice(index, e.target.value)}
                            className="w-32 px-2 py-1 border text-right"
                          />
                        </td>
                        <td className="border px-3 py-2 text-right font-semibold">
                          {formatCurrency(calculateSubtotal(item))}
                        </td>
                        <td className="border px-3 py-2 text-center">
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Delete02Icon className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 p-6 sticky top-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ringkasan</h3>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Jumlah Item:</span>
                <span className="font-medium">{items.length} item</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Quantity:</span>
                <span className="font-medium">
                  {items.reduce((sum, item) => sum + item.quantity_ordered, 0)} unit
                </span>
              </div>
              <div className="border-t pt-3">
                <div className="flex justify-between">
                  <span className="font-bold text-gray-900">Total:</span>
                  <span className="font-bold text-lg text-[#4E61D3]">
                    {formatCurrency(calculateTotal())}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => handleSubmit('SUBMITTED')}
                disabled={loading || items.length === 0 || !supplier.trim()}
                className="w-full bg-[#4E61D3] text-white py-3 font-medium hover:bg-[#3d4fa8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Memproses...' : 'Simpan & Submit'}
              </button>

              <button
                onClick={() => handleSubmit('DRAFT')}
                disabled={loading || items.length === 0 || !supplier.trim()}
                className="w-full bg-gray-600 text-white py-3 font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Simpan sebagai Draft
              </button>

              <button
                onClick={() => router.back()}
                disabled={loading}
                className="w-full border border-gray-300 text-gray-700 py-3 font-medium hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}
