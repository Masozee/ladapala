'use client'

import { useState, useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ChefHatIcon,
  CheckmarkCircle01Icon,
  Loading03Icon,
  Cancel01Icon,
  Clock01Icon,
  RestaurantIcon
} from '@hugeicons/core-free-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api, Order } from '@/lib/api'

export default function KitchenDisplayPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'ALL' | 'CONFIRMED' | 'PREPARING' | 'READY'>('ALL')

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.getOrders({
        status: filter === 'ALL' ? undefined : filter
      })

      // Handle both array and paginated responses
      const ordersList = Array.isArray(response) ? response : (response.results || [])

      // Filter to show only kitchen-relevant orders (CONFIRMED, PREPARING, READY)
      const kitchenOrders = ordersList.filter((order: Order) =>
        ['CONFIRMED', 'PREPARING', 'READY'].includes(order.status || '')
      )

      setOrders(kitchenOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000)

    return () => clearInterval(interval)
  }, [filter])

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus)
      await fetchOrders() // Refresh the list
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Gagal mengubah status pesanan')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'PREPARING': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'READY': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'Dikonfirmasi'
      case 'PREPARING': return 'Sedang Dimasak'
      case 'READY': return 'Siap Disajikan'
      default: return status
    }
  }

  const getOrderTypeLabel = (type: string) => {
    switch (type) {
      case 'DINE_IN': return 'Dine In'
      case 'TAKEAWAY': return 'Bungkus'
      case 'DELIVERY': return 'Delivery'
      default: return type
    }
  }

  const getTimeSince = (createdAt: string) => {
    const now = new Date()
    const created = new Date(createdAt)
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Baru saja'
    if (diffMins < 60) return `${diffMins} menit yang lalu`

    const diffHours = Math.floor(diffMins / 60)
    return `${diffHours} jam ${diffMins % 60} menit yang lalu`
  }

  const confirmedOrders = orders.filter(o => o.status === 'CONFIRMED')
  const preparingOrders = orders.filter(o => o.status === 'PREPARING')
  const readyOrders = orders.filter(o => o.status === 'READY')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-[#58ff34]/20 rounded-lg">
            <HugeiconsIcon icon={ChefHatIcon} className="h-8 w-8 text-[#58ff34]" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Kitchen Display System</h1>
            <p className="text-muted-foreground">Monitor dan kelola antrian pesanan dapur</p>
          </div>
        </div>
        <Button
          onClick={fetchOrders}
          variant="outline"
          className="gap-2"
        >
          <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4" strokeWidth={2} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pesanan Baru</p>
                <p className="text-3xl font-bold">{confirmedOrders.length}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-lg">
                <HugeiconsIcon icon={Clock01Icon} className="h-6 w-6 text-yellow-600" strokeWidth={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sedang Dimasak</p>
                <p className="text-3xl font-bold">{preparingOrders.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <HugeiconsIcon icon={ChefHatIcon} className="h-6 w-6 text-blue-600" strokeWidth={2} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Siap Disajikan</p>
                <p className="text-3xl font-bold">{readyOrders.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-6 w-6 text-green-600" strokeWidth={2} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter('ALL')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'ALL'
              ? 'border-[#58ff34] text-[#58ff34]'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Semua ({orders.length})
        </button>
        <button
          onClick={() => setFilter('CONFIRMED')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'CONFIRMED'
              ? 'border-yellow-500 text-yellow-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Dikonfirmasi ({confirmedOrders.length})
        </button>
        <button
          onClick={() => setFilter('PREPARING')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'PREPARING'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Sedang Dimasak ({preparingOrders.length})
        </button>
        <button
          onClick={() => setFilter('READY')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            filter === 'READY'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          Siap Disajikan ({readyOrders.length})
        </button>
      </div>

      {/* Orders Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <HugeiconsIcon icon={Loading03Icon} className="h-12 w-12 text-gray-400 mx-auto animate-spin" strokeWidth={2} />
            <p className="text-muted-foreground">Memuat pesanan...</p>
          </div>
        </div>
      ) : orders.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <HugeiconsIcon icon={RestaurantIcon} className="h-16 w-16 text-gray-300 mx-auto" strokeWidth={2} />
            <p className="text-xl font-medium text-muted-foreground">Tidak ada pesanan</p>
            <p className="text-sm text-muted-foreground">Pesanan baru akan muncul di sini</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {orders.map((order) => (
            <Card key={order.id} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{order.order_number}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>{order.table_number ? `Meja ${order.table_number}` : getOrderTypeLabel(order.order_type)}</span>
                      <span>•</span>
                      <span>{getTimeSince(order.created_at || '')}</span>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(order.status || '')} border`}>
                    {getStatusLabel(order.status || '')}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Order Items */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <span className="font-medium">{item.quantity}x</span>
                        <span className="ml-2">{item.product_name}</span>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground ml-6 mt-1 italic">
                            Catatan: {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Customer Notes */}
                {order.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Catatan Pesanan:</p>
                    <p className="text-sm italic">{order.notes}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  {order.status === 'CONFIRMED' && (
                    <Button
                      onClick={() => handleStatusUpdate(order.id!, 'PREPARING')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                      <HugeiconsIcon icon={ChefHatIcon} className="h-4 w-4" strokeWidth={2} />
                      Mulai Memasak
                    </Button>
                  )}

                  {order.status === 'PREPARING' && (
                    <Button
                      onClick={() => handleStatusUpdate(order.id!, 'READY')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4" strokeWidth={2} />
                      Tandai Siap
                    </Button>
                  )}

                  {order.status === 'READY' && (
                    <div className="text-center py-2 bg-green-50 rounded-md border border-green-200">
                      <p className="text-sm font-medium text-green-700">Menunggu diantar ke pelanggan</p>
                    </div>
                  )}

                  {/* Cancel Button - only for CONFIRMED orders */}
                  {order.status === 'CONFIRMED' && (
                    <Button
                      onClick={() => {
                        if (confirm('Yakin ingin membatalkan pesanan ini?')) {
                          handleStatusUpdate(order.id!, 'CANCELLED')
                        }
                      }}
                      variant="outline"
                      className="w-full border-red-300 text-red-600 hover:bg-red-50 gap-2"
                    >
                      <HugeiconsIcon icon={Cancel01Icon} className="h-4 w-4" strokeWidth={2} />
                      Batalkan
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
