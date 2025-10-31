'use client'

import { useState, useEffect } from 'react'
import OfficeLayout from '@/components/OfficeLayout'
import { Add01Icon, Search02Icon, ArrowDown01Icon, ArrowUp01Icon, PackageIcon, FilterIcon, Cancel01Icon } from '@/lib/icons'
import { apiFetch } from '@/lib/config'

interface InventoryItem {
  id: number
  name: string
  unit_of_measurement: string
}

interface StockMovement {
  id: number
  inventory_item: number
  inventory_item_name: string
  inventory_item_unit: string
  movement_type: string
  movement_type_display: string
  quantity: number
  balance_after: number
  reference: string
  notes: string
  movement_date: string
  created_at: string
  created_by: number | null
  created_by_name: string | null
}

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: StockMovement[]
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [itemFilter, setItemFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false)
  const [adjustmentData, setAdjustmentData] = useState({
    inventory_item: '',
    quantity: '',
    notes: ''
  })

  useEffect(() => {
    fetchData()
  }, [itemFilter, typeFilter])

  const fetchData = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (itemFilter) params.append('inventory_item', itemFilter)
      if (typeFilter) params.append('movement_type', typeFilter)
      params.append('ordering', '-created_at')

      const [movementsRes, itemsRes] = await Promise.all([
        apiFetch(`hotel/stock-movements/?${params.toString()}`),
        apiFetch('hotel/inventory/')
      ])

      if (movementsRes.ok && itemsRes.ok) {
        const movementsData: PaginatedResponse = await movementsRes.json()
        const itemsData: PaginatedResponse = await itemsRes.json()
        setMovements(movementsData.results || [])
        setInventoryItems(itemsData.results || [])
      } else {
        console.error('API Error:', {
          movementsStatus: movementsRes.status,
          itemsStatus: itemsRes.status
        })
        setMovements([])
        setInventoryItems([])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      setMovements([])
      setInventoryItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdjustment = async () => {
    if (!adjustmentData.inventory_item || !adjustmentData.quantity) {
      alert('Item dan jumlah harus diisi')
      return
    }

    try {
      const response = await apiFetch('hotel/stock-movements/create_adjustment/', {
        method: 'POST',
        body: JSON.stringify({
          inventory_item: parseInt(adjustmentData.inventory_item),
          quantity: parseInt(adjustmentData.quantity),
          notes: adjustmentData.notes
        })
      })

      if (response.ok) {
        setShowAdjustmentModal(false)
        setAdjustmentData({ inventory_item: '', quantity: '', notes: '' })
        fetchData()
      } else {
        const error = await response.json()
        alert(`Gagal membuat penyesuaian: ${JSON.stringify(error)}`)
      }
    } catch (error) {
      console.error('Error creating adjustment:', error)
      alert('Gagal membuat penyesuaian')
    }
  }

  const filteredMovements = movements.filter(movement => {
    const matchesSearch =
      movement.inventory_item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (movement.created_by_name && movement.created_by_name.toLowerCase().includes(searchTerm.toLowerCase()))

    return matchesSearch
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getMovementTypeColor = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return 'bg-green-100 text-green-800'
      case 'ADJUSTMENT':
        return 'bg-blue-100 text-blue-800'
      case 'USAGE':
        return 'bg-orange-100 text-orange-800'
      case 'RETURN':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const activeFilters = []
  if (itemFilter) {
    const item = inventoryItems.find(i => i.id.toString() === itemFilter)
    if (item) activeFilters.push({ type: 'item', value: item.name })
  }
  if (typeFilter) {
    const typeDisplay = movements.find(m => m.movement_type === typeFilter)?.movement_type_display
    if (typeDisplay) activeFilters.push({ type: 'type', value: typeDisplay })
  }

  const removeFilter = (type: string) => {
    if (type === 'item') setItemFilter('')
    if (type === 'type') setTypeFilter('')
  }

  // Calculate summary stats
  const purchaseCount = movements.filter(m => m.movement_type === 'PURCHASE').length
  const adjustmentCount = movements.filter(m => m.movement_type === 'ADJUSTMENT').length
  const usageCount = movements.filter(m => m.movement_type === 'USAGE').length

  return (
    <OfficeLayout>
      {/* Breadcrumb */}
      <div className="mb-4 text-sm text-gray-600">
        <a href="/office/warehouse" className="hover:text-[#4E61D3]">Warehouse</a>
        <span className="mx-2">/</span>
        <span className="text-gray-900 font-medium">Stock Movements</span>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Riwayat Pergerakan Stok</h1>
            <p className="text-gray-600 mt-2">Daftar semua pergerakan stok barang gudang</p>
          </div>
          <button
            onClick={() => setShowAdjustmentModal(true)}
            className="bg-[#4E61D3] text-white px-6 py-3 font-medium hover:bg-[#3d4fa8] transition-colors flex items-center space-x-2"
          >
            <Add01Icon className="h-5 w-5" />
            <span>Penyesuaian Stok</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Pergerakan</p>
              <p className="text-3xl font-bold text-[#4E61D3] mt-2">{movements.length}</p>
            </div>
            <PackageIcon className="h-8 w-8 text-[#4E61D3]" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pembelian</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{purchaseCount}</p>
            </div>
            <ArrowUp01Icon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Penyesuaian</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{adjustmentCount}</p>
            </div>
            <PackageIcon className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Penggunaan</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{usageCount}</p>
            </div>
            <ArrowDown01Icon className="h-8 w-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters Row */}
      <div className="mb-4 flex items-center justify-end gap-3">
        {/* Search */}
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search02Icon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari item, referensi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-full"
          />
        </div>

        {/* Item Filter */}
        <div className="relative w-48">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FilterIcon className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={itemFilter}
            onChange={(e) => setItemFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-full appearance-none bg-white"
          >
            <option value="">Semua Item</option>
            {inventoryItems.map(item => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="relative w-40">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FilterIcon className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-full appearance-none bg-white"
          >
            <option value="">Semua Tipe</option>
            <option value="PURCHASE">Pembelian</option>
            <option value="ADJUSTMENT">Penyesuaian</option>
            <option value="USAGE">Penggunaan</option>
            <option value="RETURN">Retur</option>
          </select>
        </div>
      </div>

      {/* Active Filters Pills */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Filter Aktif:</span>
          {activeFilters.map((filter, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 bg-[#4E61D3] text-white px-3 py-1 text-sm rounded-full"
            >
              <span>{filter.value}</span>
              <button
                onClick={() => removeFilter(filter.type)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <Cancel01Icon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-gray-200 text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E61D3]"></div>
          <p className="text-gray-600 mt-4">Memuat data pergerakan stok...</p>
        </div>
      )}

      {/* Movements Table */}
      {!loading && (
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#4E61D3] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Daftar Pergerakan Stok</h3>
                <p className="text-sm text-gray-100 mt-1">Riwayat lengkap pergerakan barang</p>
              </div>
            </div>
          </div>

          {filteredMovements.length === 0 ? (
            <div className="text-center py-12 bg-gray-50">
              <PackageIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada pergerakan stok</h3>
              <p className="text-gray-600">Belum ada data pergerakan stok yang tercatat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[#4E61D3]">
                  <tr>
                    <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Item
                    </th>
                    <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="border border-gray-300 text-center py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Jumlah
                    </th>
                    <th className="border border-gray-300 text-center py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Saldo Setelah
                    </th>
                    <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Referensi
                    </th>
                    <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Catatan
                    </th>
                    <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Dibuat Oleh
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredMovements.map(movement => (
                    <tr key={movement.id} className="hover:bg-gray-100 transition-colors">
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                        {formatDate(movement.created_at)}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-900">
                        {movement.inventory_item_name}
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getMovementTypeColor(movement.movement_type)}`}>
                          {movement.movement_type_display}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-center">
                        <span className={`font-semibold ${movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.quantity >= 0 ? (
                            <span className="inline-flex items-center gap-1">
                              <ArrowUp01Icon className="h-3 w-3" />
                              +{movement.quantity}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1">
                              <ArrowDown01Icon className="h-3 w-3" />
                              {movement.quantity}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-center font-medium text-gray-900">
                        {movement.balance_after}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                        {movement.reference || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                        {movement.notes || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                        {movement.created_by_name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">Penyesuaian Stok</h2>

              <div className="space-y-4">
                {/* Item Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={adjustmentData.inventory_item}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, inventory_item: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  >
                    <option value="">Pilih Item</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.unit_of_measurement})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={adjustmentData.quantity}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, quantity: e.target.value })}
                    placeholder="Gunakan + untuk tambah, - untuk kurang"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Contoh: +10 untuk menambah, -5 untuk mengurangi
                  </p>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catatan
                  </label>
                  <textarea
                    value={adjustmentData.notes}
                    onChange={(e) => setAdjustmentData({ ...adjustmentData, notes: e.target.value })}
                    rows={3}
                    placeholder="Alasan penyesuaian..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#4E61D3] focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAdjustmentModal(false)
                    setAdjustmentData({ inventory_item: '', quantity: '', notes: '' })
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleCreateAdjustment}
                  className="flex-1 px-4 py-2 bg-[#4E61D3] text-white rounded-lg hover:bg-[#3d4fa8] transition-colors"
                >
                  Simpan Penyesuaian
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </OfficeLayout>
  )
}
