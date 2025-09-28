'use client';

import { useState, useEffect } from 'react';
import OfficeLayout from '@/components/OfficeLayout';
import { Package, AlertTriangle, TrendingDown, TrendingUp, Search, Plus, Edit, Trash2, Eye, MoreHorizontal, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

export default function WarehousePage() {
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  // Sample amenities data
  const amenitiesStock = [
    {
      id: 1,
      name: 'Handuk Mandi',
      category: 'Linen',
      currentStock: 150,
      minStock: 50,
      maxStock: 300,
      unit: 'pcs',
      lastUpdated: '2024-01-15',
      status: 'good'
    },
    {
      id: 2,
      name: 'Sabun Batang',
      category: 'Toiletries',
      currentStock: 25,
      minStock: 30,
      maxStock: 200,
      unit: 'pcs',
      lastUpdated: '2024-01-14',
      status: 'low'
    },
    {
      id: 3,
      name: 'Shampoo Kemasan Kecil',
      category: 'Toiletries',
      currentStock: 89,
      minStock: 40,
      maxStock: 180,
      unit: 'btl',
      lastUpdated: '2024-01-15',
      status: 'good'
    },
    {
      id: 4,
      name: 'Seprai Putih',
      category: 'Linen',
      currentStock: 12,
      minStock: 25,
      maxStock: 100,
      unit: 'set',
      lastUpdated: '2024-01-13',
      status: 'critical'
    },
    {
      id: 5,
      name: 'Tissue Kotak',
      category: 'Amenities',
      currentStock: 76,
      minStock: 30,
      maxStock: 150,
      unit: 'kotak',
      lastUpdated: '2024-01-15',
      status: 'good'
    },
    {
      id: 6,
      name: 'Sikat Gigi',
      category: 'Toiletries',
      currentStock: 18,
      minStock: 20,
      maxStock: 100,
      unit: 'pcs',
      lastUpdated: '2024-01-14',
      status: 'low'
    }
  ];

  // Chart data for warehouse analytics
  const stockLevelData = [
    { category: 'Linen', good: 3, low: 1, critical: 1 },
    { category: 'Toiletries', good: 1, low: 2, critical: 0 },
    { category: 'Amenities', good: 1, low: 0, critical: 0 }
  ];

  const categoryDistribution = [
    { name: 'Linen', value: 2, color: '#005357' },
    { name: 'Toiletries', value: 3, color: '#2baf6a' },
    { name: 'Amenities', value: 1, color: '#60a5fa' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'low': return 'text-yellow-600 bg-yellow-50';
      case 'good': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'critical': return 'Kritis';
      case 'low': return 'Rendah';
      case 'good': return 'Baik';
      default: return 'Normal';
    }
  };

  const categories = ['Semua', 'Linen', 'Toiletries', 'Amenities'];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openMenuId !== null) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openMenuId]);

  return (
    <OfficeLayout>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Total Item</h3>
                  <p className="text-sm text-gray-100 mt-1">Total jenis barang</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <Package className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-[#005357] mb-2">{amenitiesStock.length}</div>
                <div className="text-sm text-gray-600">jenis item</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Stok Kritis</h3>
                  <p className="text-sm text-gray-100 mt-1">Butuh segera diisi</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-500 mb-2">
                  {amenitiesStock.filter(item => item.status === 'critical').length}
                </div>
                <div className="text-sm text-gray-600">item kritis</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Stok Rendah</h3>
                  <p className="text-sm text-gray-100 mt-1">Perlu diperhatikan</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <TrendingDown className="h-4 w-4 text-yellow-500" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-500 mb-2">
                  {amenitiesStock.filter(item => item.status === 'low').length}
                </div>
                <div className="text-sm text-gray-600">item rendah</div>
              </div>
            </div>
          </div>

          <div className="bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Stok Baik</h3>
                  <p className="text-sm text-gray-100 mt-1">Kondisi normal</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-500 mb-2">
                  {amenitiesStock.filter(item => item.status === 'good').length}
                </div>
                <div className="text-sm text-gray-600">item baik</div>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock Level by Category Chart */}
          <div className="bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Level Stok per Kategori</h3>
                  <p className="text-sm text-gray-100 mt-1">Distribusi status stok berdasarkan kategori</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockLevelData} barCategoryGap="20%">
                    <XAxis 
                      dataKey="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                    />
                    <Bar 
                      dataKey="good" 
                      fill="#10B981" 
                      radius={[2, 2, 0, 0]}
                      name="Baik"
                    />
                    <Bar 
                      dataKey="low" 
                      fill="#F59E0B" 
                      radius={[2, 2, 0, 0]}
                      name="Rendah"
                    />
                    <Bar 
                      dataKey="critical" 
                      fill="#EF4444" 
                      radius={[2, 2, 0, 0]}
                      name="Kritis"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center justify-center mt-4">
                <div className="flex items-center space-x-6 text-xs">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500"></div>
                    <span className="text-gray-600">Stok Baik</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-yellow-500"></div>
                    <span className="text-gray-600">Stok Rendah</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-red-500"></div>
                    <span className="text-gray-600">Stok Kritis</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Category Distribution Chart */}
          <div className="bg-white shadow">
            <div className="p-6 bg-[#005357] text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Distribusi Kategori</h3>
                  <p className="text-sm text-gray-100 mt-1">Pembagian item berdasarkan kategori</p>
                </div>
                <div className="w-8 h-8 bg-white flex items-center justify-center">
                  <PieChart className="h-4 w-4 text-[#005357]" />
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50">
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={categoryDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {categoryDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2">
                {categoryDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3" style={{ backgroundColor: item.color }}></div>
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <span className="text-gray-900 font-medium">{item.value} item</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Management */}
        <div className="bg-white shadow">
          <div className="p-6 bg-[#005357] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Inventaris Amenitas</h3>
                <p className="text-sm text-gray-100 mt-1">Monitoring stok barang amenitas hotel</p>
              </div>
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <Package className="h-4 w-4 text-[#005357]" />
              </div>
            </div>
          </div>
          <div className="p-6 bg-gray-50">
            <div className="flex items-center justify-between mb-6">
              <button className="bg-[#005357] text-white px-4 py-2 flex items-center space-x-2 hover:bg-[#004147] transition-colors">
                <Plus className="h-4 w-4" />
                <span className="text-sm">Tambah Item</span>
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Kategori:</span>
                  <select className="px-3 py-1 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]">
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <select className="px-3 py-1 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357]">
                    <option value="semua">Semua</option>
                    <option value="critical">Kritis</option>
                    <option value="low">Rendah</option>
                    <option value="good">Baik</option>
                  </select>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama item..."
                  className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#005357] focus:border-[#005357] w-64"
                />
              </div>
            </div>

            {/* Inventory Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#005357]">
                  <tr>
                    <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Nama Item & Kategori
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Stok Saat Ini
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Batas Stok (Min/Max)
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Status & Kondisi
                    </th>
                    <th className="text-left py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Terakhir Update
                    </th>
                    <th className="text-right py-4 px-6 text-sm font-bold text-white uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {amenitiesStock.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      {/* Nama Item & Kategori */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{item.name}</div>
                          <div className="flex items-center mt-1">
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 font-medium">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Stok Saat Ini */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-bold text-base text-gray-900">
                            {item.currentStock} {item.unit}
                          </div>
                          <div className="text-sm text-gray-500">
                            Unit: {item.unit}
                          </div>
                        </div>
                      </td>

                      {/* Batas Stok */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-gray-900">
                            <span className="text-red-600 font-medium">Min: {item.minStock}</span>
                          </div>
                          <div className="text-sm text-gray-900">
                            <span className="text-green-600 font-medium">Max: {item.maxStock}</span>
                          </div>
                        </div>
                      </td>

                      {/* Status & Kondisi */}
                      <td className="px-6 py-4">
                        <div>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(item.status)}`}>
                            {getStatusText(item.status)}
                          </span>
                          {item.status === 'critical' && (
                            <div className="text-xs text-red-600 mt-1 font-medium">
                              Perlu segera diisi ulang!
                            </div>
                          )}
                          {item.status === 'low' && (
                            <div className="text-xs text-yellow-600 mt-1 font-medium">
                              Stok menipis
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Terakhir Update */}
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{item.lastUpdated}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(item.lastUpdated).toLocaleDateString('id-ID', { 
                              weekday: 'short'
                            })}
                          </div>
                        </div>
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4">
                        <div className="relative flex justify-end">
                          <button
                            onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                            className="flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors rounded"
                            title="More actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          
                          {openMenuId === item.id && (
                            <>
                              {/* Backdrop */}
                              <div 
                                className="fixed inset-0 z-10" 
                                onClick={() => setOpenMenuId(null)}
                              ></div>
                              
                              {/* Dropdown Menu */}
                              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded shadow-lg z-20">
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      console.log('View item:', item.name);
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                                  >
                                    <Eye className="h-4 w-4" />
                                    <span>Lihat Detail</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      console.log('Edit item:', item.name);
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
                                  >
                                    <Edit className="h-4 w-4" />
                                    <span>Edit Item</span>
                                  </button>
                                  
                                  <div className="border-t border-gray-100 my-1"></div>
                                  
                                  {/* Stock Actions */}
                                  <button
                                    onClick={() => {
                                      console.log('Add stock for:', item.name);
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors w-full text-left"
                                  >
                                    <Plus className="h-4 w-4" />
                                    <span>Tambah Stok</span>
                                  </button>
                                  
                                  {item.status === 'critical' && (
                                    <button
                                      onClick={() => {
                                        console.log('Urgent restock for:', item.name);
                                        setOpenMenuId(null);
                                      }}
                                      className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                    >
                                      <AlertTriangle className="h-4 w-4" />
                                      <span>Restok Mendesak</span>
                                    </button>
                                  )}
                                  
                                  <div className="border-t border-gray-100 my-1"></div>
                                  
                                  <button
                                    onClick={() => {
                                      if (confirm(`Apakah Anda yakin ingin menghapus ${item.name}?`)) {
                                        console.log('Delete item:', item.name);
                                      }
                                      setOpenMenuId(null);
                                    }}
                                    className="flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Hapus Item</span>
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  );
}