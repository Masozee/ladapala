"use client"

import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { UserIcon, Clock01Icon, Invoice01Icon, GridTableIcon, AnalyticsUpIcon, Wallet01Icon, UserAdd01Icon, MoreHorizontalIcon, ShoppingCart01Icon, CreditCardIcon, Calendar01Icon } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { api, type Table, type Order } from "@/lib/api"

interface TableWithOrders extends Table {
  orders: Order[]
  revenue: number
  occupiedTime: string | null
  currentGuests: number
  status: 'occupied' | 'available' | 'reserved' | 'cleaning'
}

export default function TablePage() {
  const [tables, setTables] = useState<TableWithOrders[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showSplitBill, setShowSplitBill] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [joinTables, setJoinTables] = useState<number[]>([])
  const [showMoreMenu, setShowMoreMenu] = useState<number | null>(null)
  const [showBooking, setShowBooking] = useState(false)
  const [splitAmount, setSplitAmount] = useState(2)
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'occupied' | 'reserved'>('all')
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([])
  const [processingOrders, setProcessingOrders] = useState<Order[]>([])
  const [bookingData, setBookingData] = useState({
    customer_name: '',
    booking_date: '',
    guest_count: 2,
    notes: ''
  })

  useEffect(() => {
    fetchTablesData()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreMenu !== null) {
        const target = event.target as HTMLElement
        if (!target.closest('.more-menu-container')) {
          setShowMoreMenu(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreMenu])

  const fetchTablesData = async () => {
    try {
      setLoading(true)

      // Fetch all tables
      const tablesResponse = await api.getTables()

      // Fetch active orders (not COMPLETED or CANCELLED)
      // Filter on client side to ensure we only get truly active orders
      const ordersResponse = await api.getOrders({})
      const activeOrders = ordersResponse.results.filter(
        order => {
          const isActive = order.status !== 'COMPLETED' && order.status !== 'CANCELLED'
          const hasTable = order.table !== null && order.table !== undefined
          return isActive && hasTable
        }
      )

      // Fetch unpaid orders using dedicated endpoint
      const unpaidResponse = await api.getUnpaidOrders()
      setUnpaidOrders(unpaidResponse.results)

      // Fetch processing orders using dedicated endpoint
      const processingResponse = await api.getProcessingOrders()
      setProcessingOrders(processingResponse.results)

      // Get bookings from localStorage
      const bookings = JSON.parse(localStorage.getItem('tableBookings') || '[]')
      const reservedTableIds = bookings.map((b: any) => b.table_id)

      // Group orders by table
      const ordersByTable = activeOrders.reduce((acc, order) => {
        if (!order.table) return acc
        if (!acc[order.table]) acc[order.table] = []
        acc[order.table].push(order)
        return acc
      }, {} as Record<number, Order[]>)

      // Combine tables with their orders
      const tablesWithOrders: TableWithOrders[] = tablesResponse.results.map(table => {
        const tableOrders = ordersByTable[table.id] || []
        const revenue = tableOrders.reduce((sum, order) =>
          sum + parseFloat(order.total_amount || '0'), 0
        )

        // Calculate occupied time from oldest active order
        let occupiedTime = null
        if (tableOrders.length > 0) {
          const oldestOrder = tableOrders.sort((a, b) =>
            new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime()
          )[0]
          occupiedTime = getTimeDiff(oldestOrder.created_at!)
        }

        // Estimate guests (count unique orders as groups)
        const currentGuests = tableOrders.length > 0 ? Math.min(tableOrders.length * 2, table.capacity) : 0

        // Determine table status
        // Priority: 1) Reservations, 2) Active orders, 3) Backend is_available flag
        let status: 'occupied' | 'available' | 'reserved' | 'cleaning' = 'available'
        if (reservedTableIds.includes(table.id)) {
          status = 'reserved'
        } else if (tableOrders.length > 0) {
          // Has active orders - definitely occupied
          status = 'occupied'
        } else if (table.is_available) {
          // No active orders and marked as available - available
          status = 'available'
        } else {
          // No active orders but marked as unavailable - could be cleaning
          status = 'occupied'
        }

        return {
          ...table,
          orders: tableOrders,
          revenue,
          occupiedTime,
          currentGuests,
          status
        }
      })

      // Sort tables by number (numerically, not alphabetically)
      tablesWithOrders.sort((a, b) => {
        const numA = parseInt(a.number) || 0
        const numB = parseInt(b.number) || 0
        return numA - numB
      })

      setTables(tablesWithOrders)
    } catch (error) {
      console.error('Error fetching tables data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeDiff = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) {
      return `${diffMins} menit`
    } else {
      const hours = Math.floor(diffMins / 60)
      const mins = diffMins % 60
      return `${hours} jam ${mins} menit`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied": return "bg-red-100 text-red-800 border-red-200"
      case "available": return "bg-green-100 text-green-800 border-green-200"
      case "reserved": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cleaning": return "bg-blue-100 text-blue-800 border-blue-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "occupied": return "Terisi"
      case "available": return "Tersedia"
      case "reserved": return "Reservasi"
      case "cleaning": return "Dibersihkan"
      default: return "Tidak Diketahui"
    }
  }

  const getOrderStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Sudah Diantar', iconColor: 'text-green-600' }
      case 'PREPARING':
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sedang Dimasak', iconColor: 'text-blue-600' }
      case 'READY':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Siap Diantar', iconColor: 'text-yellow-600' }
      case 'CONFIRMED':
        return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Dikonfirmasi', iconColor: 'text-purple-600' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Menunggu', iconColor: 'text-gray-600' }
    }
  }

  const formatCurrency = (value: string | number) => {
    return `Rp ${parseFloat(value.toString()).toLocaleString('id-ID')}`
  }

  const toggleTableJoin = (tableId: number) => {
    if (joinTables.includes(tableId)) {
      setJoinTables(joinTables.filter(id => id !== tableId))
    } else {
      setJoinTables([...joinTables, tableId])
    }
  }

  const handleJoinTables = async () => {
    if (joinTables.length < 2) return

    try {
      // Get selected tables info
      const selectedTables = tables.filter(t => joinTables.includes(t.id))
      const tableNumbers = selectedTables.map(t => t.number).join(", ")

      // Collect all orders from selected tables
      const allOrders = selectedTables.flatMap(t => t.orders)

      // In production, you would:
      // 1. Create a "joined table" record in backend
      // 2. Transfer/link all orders to the primary table
      // For now, store in localStorage
      const joinedTablesData = JSON.parse(localStorage.getItem('joinedTables') || '[]')
      joinedTablesData.push({
        tables: joinTables,
        table_numbers: tableNumbers,
        created_at: new Date().toISOString(),
        total_guests: selectedTables.reduce((sum, t) => sum + t.currentGuests, 0),
        total_orders: allOrders.length
      })
      localStorage.setItem('joinedTables', JSON.stringify(joinedTablesData))

      alert(`✅ Meja ${tableNumbers} berhasil digabung!\n\nTotal tamu: ${selectedTables.reduce((sum, t) => sum + t.currentGuests, 0)} orang\nTotal pesanan: ${allOrders.length}`)

      setJoinTables([])
      await fetchTablesData()
    } catch (error) {
      console.error('Error joining tables:', error)
      alert("Gagal menggabung meja. Silakan coba lagi.")
    }
  }

  const currentTable = selectedTable ? tables.find(t => t.id === selectedTable) : null

  const getProcessButtonText = (table: TableWithOrders) => {
    if (table.status === "available" || table.status === "cleaning") {
      return "Order"
    } else if (table.status === "occupied") {
      return "Payment"
    } else if (table.status === "reserved") {
      return "Check In"
    }
    return "Process"
  }

  const getProcessButtonIcon = (table: TableWithOrders) => {
    if (table.status === "available" || table.status === "cleaning") {
      return ShoppingCart01Icon
    } else if (table.status === "occupied") {
      return CreditCardIcon
    } else if (table.status === "reserved") {
      return UserIcon
    }
    return Invoice01Icon
  }

  const handleProcessAction = async (table: TableWithOrders) => {
    if (table.status === "available" || table.status === "cleaning") {
      // Redirect to order/menu page with table number
      window.location.href = `/menu?table=${table.id}`
    } else if (table.status === "occupied") {
      // Redirect to transaction page with table orders
      if (table.orders.length > 0) {
        window.location.href = `/transaction?tableId=${table.id}`
      } else {
        setSelectedTable(table.id)
        setShowOrderDetails(true)
      }
    } else if (table.status === "reserved") {
      // Check in the reservation
      try {
        await api.setTableOccupied(table.id)
        await fetchTablesData()
        alert(`Meja ${table.number} berhasil di-check in!`)
      } catch (error) {
        console.error('Error checking in table:', error)
        alert('Gagal check in meja')
      }
    }
  }

  // Analytics calculations
  const totalTables = tables.length
  const occupiedTables = tables.filter(t => t.status === "occupied").length
  const availableTables = tables.filter(t => t.status === "available").length
  const reservedTables = tables.filter(t => t.status === "reserved").length
  const totalRevenue = tables.reduce((sum, table) => sum + table.revenue, 0)
  const averageOccupancy = totalTables > 0 ? ((occupiedTables / totalTables) * 100).toFixed(1) : '0.0'

  // Filter tables based on status
  const filteredTables = statusFilter === 'all'
    ? tables
    : tables.filter(t => t.status === statusFilter)

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading tables...</div>
        </div>
      </div>
    )
  }

  const totalUnpaidAmount = unpaidOrders.reduce((sum, order) => {
    return sum + parseFloat(order.total_amount || '0')
  }, 0)

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-700">Manajemen Meja</h1>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(true)}
            className="rounded"
          >
            <HugeiconsIcon icon={AnalyticsUpIcon} size={32} strokeWidth={2} className="mr-2" />
            Analytics
          </Button>
          {joinTables.length >= 2 && (
            <Button
              onClick={handleJoinTables}
              className="bg-[#58ff34] hover:bg-[#4de82a] rounded-none text-black"
            >
              <HugeiconsIcon icon={UserAdd01Icon} size={32} strokeWidth={2} className="mr-2" />
              Gabung Meja ({joinTables.length})
            </Button>
          )}
          <Button
            onClick={fetchTablesData}
            variant="outline"
            className="rounded"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats - Filter Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card
          className={`rounded-xl border shadow-none cursor-pointer transition-all ${
            statusFilter === 'available'
              ? 'border-green-500 bg-green-50 ring-2 ring-green-500'
              : 'border-gray-200 hover:border-green-500'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'available' ? 'all' : 'available')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meja Tersedia</p>
                <p className="text-2xl font-bold text-green-500">{availableTables}</p>
              </div>
              <HugeiconsIcon icon={GridTableIcon} size={32} strokeWidth={2} className="text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card
          className={`rounded-xl border shadow-none cursor-pointer transition-all ${
            statusFilter === 'occupied'
              ? 'border-red-500 bg-red-50 ring-2 ring-red-500'
              : 'border-gray-200 hover:border-red-500'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'occupied' ? 'all' : 'occupied')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meja Terisi</p>
                <p className="text-2xl font-bold text-red-500">{occupiedTables}</p>
              </div>
              <HugeiconsIcon icon={UserIcon} size={32} strokeWidth={2} className="text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card
          className={`rounded-xl border shadow-none cursor-pointer transition-all ${
            statusFilter === 'reserved'
              ? 'border-yellow-500 bg-yellow-50 ring-2 ring-yellow-500'
              : 'border-gray-200 hover:border-yellow-500'
          }`}
          onClick={() => setStatusFilter(statusFilter === 'reserved' ? 'all' : 'reserved')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meja Reservasi</p>
                <p className="text-2xl font-bold text-yellow-500">{reservedTables}</p>
              </div>
              <HugeiconsIcon icon={Calendar01Icon} size={32} strokeWidth={2} className="text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border border-gray-200 shadow-none hover:border-[#58ff34] transition-colors">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Aktif</p>
                <p className="text-lg font-bold text-gray-700">Rp {Math.round(totalRevenue).toLocaleString('id-ID')}</p>
              </div>
              <HugeiconsIcon icon={Wallet01Icon} size={32} strokeWidth={2} className="text-[#58ff34]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Info */}
      {statusFilter !== 'all' && (
        <div className="mb-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Filter aktif:</span>
            <span className={`text-sm font-semibold ${
              statusFilter === 'available' ? 'text-green-600' :
              statusFilter === 'occupied' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {statusFilter === 'available' ? 'Meja Tersedia' :
               statusFilter === 'occupied' ? 'Meja Terisi' :
               'Meja Reservasi'}
            </span>
            <span className="text-sm text-gray-500">({filteredTables.length} meja)</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setStatusFilter('all')}
            className="rounded text-xs"
          >
            Reset Filter
          </Button>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTables.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            <p>Tidak ada meja dengan status ini</p>
          </div>
        ) : (
          filteredTables.map((table) => (
          <Card
            key={table.id}
            className={`cursor-pointer transition-all rounded-xl border border-gray-200 shadow-none hover:border-[#58ff34] ${
              joinTables.includes(table.id) ? "ring-2 ring-[#58ff34] bg-green-50" : ""
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg text-gray-700">Meja {table.number}</CardTitle>
                <Badge
                  variant="outline"
                  className={`${getStatusColor(table.status)} rounded-none`}
                >
                  {getStatusText(table.status)}
                </Badge>
              </div>
              <div className="border-b border-gray-200 pb-2 mt-2">
                <p className="text-sm text-gray-600">Kapasitas: {table.capacity} orang</p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-full pt-3">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-4 text-base font-semibold text-gray-700">
                  <div className="flex items-center gap-1.5">
                    <HugeiconsIcon icon={UserIcon} size={20} strokeWidth={2} className="size-5" />
                    <span>{table.currentGuests}/{table.capacity}</span>
                  </div>
                  {table.occupiedTime && (
                    <div className="flex items-center gap-1.5">
                      <HugeiconsIcon icon={Clock01Icon} size={20} strokeWidth={2} className="size-5" />
                      <span className="text-sm">{table.occupiedTime}</span>
                    </div>
                  )}
                </div>

                {table.orders.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-gray-600">
                      {table.orders.length} pesanan aktif
                    </div>
                    {/* Show latest order status */}
                    {table.orders[0] && (() => {
                      const latestOrder = table.orders.sort((a, b) =>
                        new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime()
                      )[0]
                      const statusInfo = getOrderStatusBadge(latestOrder.status)
                      return (
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {latestOrder.order_number}
                          </span>
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Fixed Bottom Buttons */}
              <div className="mt-4 flex gap-1 pt-3 border-t border-gray-200">
                <Button
                  size="sm"
                  onClick={() => handleProcessAction(table)}
                  className="flex-[3] rounded text-xs h-8 bg-[#58ff34] hover:bg-[#4de82a] text-black"
                  disabled={table.status === "cleaning"}
                >
                  {(() => {
                    const IconComponent = getProcessButtonIcon(table)
                    return <HugeiconsIcon icon={IconComponent} size={32} strokeWidth={2} className="mr-1" />
                  })()}
                  {getProcessButtonText(table)}
                </Button>
                <div className="relative flex-[2] more-menu-container">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMoreMenu(showMoreMenu === table.id ? null : table.id)}
                    className="w-full rounded text-xs h-8 border-gray-300"
                    disabled={table.status === "cleaning"}
                  >
                    <HugeiconsIcon icon={MoreHorizontalIcon} size={32} strokeWidth={2} className="mr-1" />
                    More
                  </Button>

                  {/* Dropdown Menu */}
                  {showMoreMenu === table.id && (
                    <div className="absolute bottom-full right-0 mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedTable(table.id)
                            setShowSplitBill(true)
                            setShowMoreMenu(null)
                          }}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={table.orders.length === 0}
                        >
                          <HugeiconsIcon icon={GridTableIcon} size={32} strokeWidth={2} className="mr-2 text-gray-500" />
                          <span>Split Bill</span>
                        </button>
                        <button
                          onClick={() => {
                            toggleTableJoin(table.id)
                            setShowMoreMenu(null)
                          }}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 flex items-center transition-colors"
                        >
                          <HugeiconsIcon icon={UserAdd01Icon} size={32} strokeWidth={2} className="mr-2 text-gray-500" />
                          <span>{joinTables.includes(table.id) ? "Batal Gabung" : "Gabung Meja"}</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTable(table.id)
                            setShowBooking(true)
                            setShowMoreMenu(null)
                          }}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={table.status === "occupied"}
                        >
                          <HugeiconsIcon icon={Calendar01Icon} size={32} strokeWidth={2} className="mr-2 text-gray-500" />
                          <span>Booking</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && currentTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              Detail Pesanan - Meja {currentTable.number}
            </h3>

            <div className="space-y-4 mb-6">
              {currentTable.orders.map((order) => (
                <div key={order.id} className="p-4 bg-gray-50 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-700">{order.customer_name}</h4>
                      <p className="text-sm text-gray-500">Order: {order.order_number}</p>
                    </div>
                    <span className="font-bold text-green-500">
                      Rp {parseFloat(order.total_amount || '0').toLocaleString('id-ID')}
                    </span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {order.items?.map((item, index) => (
                      <li key={index}>• {item.product_name} x{item.quantity}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowOrderDetails(false)}
                className="rounded"
              >
                Tutup
              </Button>
              {currentTable.orders.length > 0 && (
                <Button
                  onClick={() => window.location.href = `/transaction?tableId=${currentTable.id}`}
                  className="bg-green-600 hover:bg-green-700 rounded"
                >
                  Proses Pembayaran
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Split Bill Modal */}
      {showSplitBill && currentTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              Split Bill - Meja {currentTable.number}
            </h3>

            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-700">Total Bill:</span>
                <span className="text-lg font-bold text-green-500">
                  Rp {Math.round(currentTable.revenue).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah Orang
                  </label>
                  <Input
                    type="number"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-full rounded-none"
                    min="2"
                    max={currentTable.capacity}
                  />
                </div>

                <div className="p-3 bg-green-50 rounded">
                  <p className="text-sm text-green-800">
                    <strong>Per orang:</strong> Rp {Math.round(currentTable.revenue / splitAmount).toLocaleString('id-ID')}
                  </p>
                </div>

                {/* Show order breakdown */}
                <div className="border-t pt-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">Detail Pesanan:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {currentTable.orders.map((order) => (
                      <div key={order.id} className="text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{order.customer_name}</span>
                          <span className="font-semibold">Rp {parseFloat(order.total_amount || '0').toLocaleString('id-ID')}</span>
                        </div>
                        <ul className="text-xs text-gray-500 ml-2">
                          {order.items?.map((item, idx) => (
                            <li key={idx}>• {item.product_name} x{item.quantity}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSplitBill(false)}
                className="flex-1 rounded-none"
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  setShowSplitBill(false)
                  // Redirect to transaction page with split info
                  const perPersonAmount = Math.round(currentTable.revenue / splitAmount)
                  window.location.href = `/transaction?tableId=${currentTable.id}&split=${splitAmount}&amount=${perPersonAmount}`
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-none"
              >
                Lanjut ke Pembayaran
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-700 mb-6">Analytics Meja</h3>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <Card className="rounded-xl border border-gray-200 shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-700">Tingkat Okupansi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#58ff34] mb-2">
                    {averageOccupancy}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {occupiedTables} dari {totalTables} meja terisi
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl border border-gray-200 shadow-none">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-700">Revenue per Meja</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500 mb-2">
                    Rp {totalTables > 0 ? Math.round(totalRevenue / totalTables).toLocaleString('id-ID') : '0'}
                  </div>
                  <div className="text-sm text-gray-500">Rata-rata per meja</div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-6">
              <h4 className="font-semibold text-gray-700 mb-3">Detail per Meja</h4>
              <div className="space-y-2">
                {tables.map((table) => (
                  <div key={table.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <span className="font-medium text-gray-700">Meja {table.number}</span>
                      <span className="ml-2 text-sm text-gray-500">
                        ({table.currentGuests}/{table.capacity} kursi)
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(table.status)} rounded-none`}
                      >
                        {getStatusText(table.status)}
                      </Badge>
                      <span className="font-semibold text-green-500 min-w-[100px] text-right">
                        Rp {Math.round(table.revenue).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAnalytics(false)}
                className="rounded"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && currentTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-700 mb-4">
              Booking - Meja {currentTable.number}
            </h3>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Pelanggan *
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan nama pelanggan"
                  value={bookingData.customer_name}
                  onChange={(e) => setBookingData({...bookingData, customer_name: e.target.value})}
                  className="w-full rounded-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal & Waktu *
                </label>
                <Input
                  type="datetime-local"
                  value={bookingData.booking_date}
                  onChange={(e) => setBookingData({...bookingData, booking_date: e.target.value})}
                  className="w-full rounded-none"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Tamu *
                </label>
                <Input
                  type="number"
                  placeholder="Jumlah tamu"
                  value={bookingData.guest_count}
                  onChange={(e) => setBookingData({...bookingData, guest_count: parseInt(e.target.value) || 1})}
                  className="w-full rounded-none"
                  min="1"
                  max={currentTable.capacity}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan (Opsional)
                </label>
                <Input
                  type="text"
                  placeholder="Catatan khusus (alergi, acara spesial, dll)"
                  value={bookingData.notes}
                  onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                  className="w-full rounded-none"
                />
              </div>

              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-xs text-blue-800">
                  <strong>Info:</strong> Meja akan direservasi untuk Anda. Harap datang 15 menit sebelum waktu booking.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBooking(false)}
                className="flex-1 rounded-none"
              >
                Batal
              </Button>
              <Button
                onClick={async () => {
                  if (!bookingData.customer_name || !bookingData.booking_date) {
                    alert("Mohon lengkapi nama pelanggan dan tanggal booking")
                    return
                  }

                  try {
                    // Mark table as reserved (temporarily use setTableOccupied API)
                    // In production, you would create a Reservation model in backend
                    await api.setTableOccupied(currentTable!.id)

                    // Save booking info to localStorage for now (since no backend reservation model)
                    const bookings = JSON.parse(localStorage.getItem('tableBookings') || '[]')
                    bookings.push({
                      table_id: currentTable!.id,
                      table_number: currentTable!.number,
                      ...bookingData,
                      created_at: new Date().toISOString()
                    })
                    localStorage.setItem('tableBookings', JSON.stringify(bookings))

                    alert(`Booking berhasil dibuat!\n\nDetail:\n- Meja: ${currentTable!.number}\n- Nama: ${bookingData.customer_name}\n- Waktu: ${new Date(bookingData.booking_date).toLocaleString('id-ID')}\n- Tamu: ${bookingData.guest_count} orang`)

                    setShowBooking(false)
                    setBookingData({ customer_name: '', booking_date: '', guest_count: 2, notes: '' })
                    await fetchTablesData()
                  } catch (error) {
                    console.error('Error creating booking:', error)
                    alert("Gagal membuat booking. Silakan coba lagi.")
                  }
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-none"
                disabled={!bookingData.customer_name || !bookingData.booking_date}
              >
                Konfirmasi Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
