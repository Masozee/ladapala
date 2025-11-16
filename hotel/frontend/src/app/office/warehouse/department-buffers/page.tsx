'use client';

import { useState, useEffect } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import {
  PackageIcon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Alert01Icon,
  RefreshIcon,
  Add01Icon,
  Building03Icon,
  UserMultipleIcon
} from '@/lib/icons';

interface DepartmentInventory {
  id: number;
  department: string;
  department_display: string;
  inventory_item: number;
  inventory_item_name: string;
  inventory_item_category: string;
  unit_of_measurement: string;
  current_stock: string;
  min_stock: string;
  max_stock: string;
  location: string;
  stock_status: string;
  is_low_stock: boolean;
  suggested_restock_quantity: number;
  last_restocked: string | null;
}

interface InventoryItem {
  id: number;
  name: string;
  category_name: string;
  current_stock: number;
  unit_of_measurement: string;
}

const DEPARTMENTS = [
  { value: 'HOUSEKEEPING', label: 'Housekeeping' },
  { value: 'F&B', label: 'F&B' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'FRONT_DESK', label: 'Front Desk' },
  { value: 'ENGINEERING', label: 'Engineering' },
  { value: 'LAUNDRY', label: 'Laundry' },
];

export default function DepartmentBuffersPage() {
  const [selectedDepartment, setSelectedDepartment] = useState('HOUSEKEEPING');
  const [buffers, setBuffers] = useState<DepartmentInventory[]>([]);
  const [warehouseItems, setWarehouseItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedBuffer, setSelectedBuffer] = useState<DepartmentInventory | null>(null);
  const [transferQuantity, setTransferQuantity] = useState('');
  const [transferNotes, setTransferNotes] = useState('');

  const buildApiUrl = (endpoint: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';
    return `${baseUrl}/hotel/${endpoint}`;
  };

  const fetchDepartmentBuffers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        buildApiUrl(`department-inventory/?department=${encodeURIComponent(selectedDepartment)}`),
        { credentials: 'include' }
      );
      if (response.ok) {
        const data = await response.json();
        setBuffers(data.results || []);
      }
    } catch (error) {
      console.error('Error fetching department buffers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouseItems = async () => {
    try {
      const response = await fetch(buildApiUrl('inventory/'), { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setWarehouseItems(data.results || data || []);
      }
    } catch (error) {
      console.error('Error fetching warehouse items:', error);
    }
  };

  useEffect(() => {
    fetchDepartmentBuffers();
    fetchWarehouseItems();
  }, [selectedDepartment]);

  const handleTransfer = async () => {
    if (!selectedBuffer || !transferQuantity) return;

    try {
      const response = await fetch(
        buildApiUrl(`department-inventory/${selectedBuffer.id}/transfer_from_warehouse/`),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            quantity: parseFloat(transferQuantity),
            notes: transferNotes
          })
        }
      );

      if (response.ok) {
        alert('Transfer successful!');
        setShowTransferModal(false);
        setTransferQuantity('');
        setTransferNotes('');
        fetchDepartmentBuffers();
      } else {
        const error = await response.json();
        alert(error.error || 'Transfer failed');
      }
    } catch (error) {
      console.error('Transfer error:', error);
      alert('Transfer failed');
    }
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case 'Low Stock': return 'text-red-600 bg-red-50';
      case 'At Capacity': return 'text-blue-600 bg-blue-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  const lowStockCount = buffers.filter(b => b.is_low_stock).length;
  const totalItems = buffers.length;
  const totalStock = buffers.reduce((sum, b) => sum + parseFloat(b.current_stock), 0);

  return (
    <OfficeLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Department Inventory Buffers</h1>
              <p className="text-gray-600 mt-1">Manage stock allocated to each department</p>
            </div>
            <button
              onClick={fetchDepartmentBuffers}
              className="flex items-center space-x-2 px-4 py-2 bg-[#4E61D3] text-white hover:bg-[#3d4db5] transition"
            >
              <RefreshIcon className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Department Tabs */}
        <div className="mb-6 bg-white border border-gray-200">
          <div className="flex overflow-x-auto">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.value}
                onClick={() => setSelectedDepartment(dept.value)}
                className={`px-6 py-4 border-b-2 transition whitespace-nowrap text-sm font-medium ${
                  selectedDepartment === dept.value
                    ? 'border-[#4E61D3] text-[#4E61D3] bg-blue-50'
                    : 'border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                {dept.label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalItems}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 flex items-center justify-center">
                <PackageIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Stock</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{totalStock.toFixed(0)}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 flex items-center justify-center">
                <Building03Icon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Low Stock Items</p>
                <p className="text-3xl font-bold text-red-600 mt-1">{lowStockCount}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 flex items-center justify-center">
                <Alert01Icon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Buffers Table */}
        <div className="bg-white border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {DEPARTMENTS.find(d => d.value === selectedDepartment)?.label} Buffer Stock
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : buffers.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No buffer items configured for this department</p>
              <button className="mt-4 px-4 py-2 bg-[#4E61D3] text-white hover:bg-[#3d4db5]">
                Add Items
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-[#4E61D3]">
                  <tr>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Item
                    </th>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Location
                    </th>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Current Stock
                    </th>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Min / Max
                    </th>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Status
                    </th>
                    <th className="border border-gray-300 px-6 py-3 text-left text-sm font-bold text-white">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {buffers.map((buffer) => (
                    <tr key={buffer.id} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{buffer.inventory_item_name}</div>
                          <div className="text-sm text-gray-500">{buffer.inventory_item_category}</div>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-6 py-4 text-sm text-gray-900">
                        {buffer.location || '-'}
                      </td>
                      <td className="border border-gray-300 px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-semibold text-gray-900">
                            {parseFloat(buffer.current_stock).toFixed(0)}
                          </span>
                          <span className="text-sm text-gray-500">{buffer.unit_of_measurement}</span>
                        </div>
                        {buffer.is_low_stock && (
                          <div className="text-xs text-red-600 mt-1 flex items-center space-x-1">
                            <Alert01Icon className="w-3 h-3" />
                            <span>Restock needed: {buffer.suggested_restock_quantity.toFixed(0)} units</span>
                          </div>
                        )}
                      </td>
                      <td className="border border-gray-300 px-6 py-4 text-sm text-gray-600">
                        {parseFloat(buffer.min_stock).toFixed(0)} / {parseFloat(buffer.max_stock).toFixed(0)}
                      </td>
                      <td className="border border-gray-300 px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold ${getStockStatusColor(buffer.stock_status)}`}>
                          {buffer.stock_status}
                        </span>
                      </td>
                      <td className="border border-gray-300 px-6 py-4">
                        <button
                          onClick={() => {
                            setSelectedBuffer(buffer);
                            setTransferQuantity(buffer.suggested_restock_quantity.toString());
                            setShowTransferModal(true);
                          }}
                          className="flex items-center space-x-1 px-3 py-1.5 bg-[#4E61D3] text-white text-sm hover:bg-[#3d4db5] transition"
                        >
                          <ArrowDown01Icon className="w-4 h-4" />
                          <span>Transfer</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Transfer Modal */}
        {showTransferModal && selectedBuffer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white border border-gray-300 max-w-md w-full mx-4">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Transfer from Warehouse
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {selectedBuffer.inventory_item_name} → {selectedBuffer.department_display}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={transferQuantity}
                    onChange={(e) => setTransferQuantity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                    placeholder="Enter quantity"
                    min="0"
                    max={selectedBuffer.max_stock}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Suggested: {selectedBuffer.suggested_restock_quantity.toFixed(0)} {selectedBuffer.unit_of_measurement}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                    rows={3}
                    placeholder="Reason for transfer..."
                  />
                </div>

                <div className="bg-gray-50 p-3">
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Buffer:</span>
                      <span className="font-medium">{parseFloat(selectedBuffer.current_stock).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">After Transfer:</span>
                      <span className="font-medium text-green-600">
                        {(parseFloat(selectedBuffer.current_stock) + parseFloat(transferQuantity || '0')).toFixed(0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max Capacity:</span>
                      <span className="font-medium">{parseFloat(selectedBuffer.max_stock).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 flex space-x-3">
                <button
                  onClick={() => {
                    setShowTransferModal(false);
                    setTransferQuantity('');
                    setTransferNotes('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={!transferQuantity || parseFloat(transferQuantity) <= 0}
                  className="flex-1 px-4 py-2 bg-[#4E61D3] text-white hover:bg-[#3d4db5] transition disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  Transfer Stock
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OfficeLayout>
  );
}
