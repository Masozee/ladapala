'use client'

import { useState, useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle01Icon,
  Loading03Icon,
  Cancel01Icon,
  Clock01Icon,
  RestaurantIcon,
  UserIcon,
  LogoutCircle02Icon,
  LoginCircle02Icon
} from '@hugeicons/core-free-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api, BarOrder, ActiveStaff } from '@/lib/api'
import { useStaffSession } from '@/hooks/useStaffSession'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function BarDisplayPage() {
  const [orders, setOrders] = useState<BarOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'UNASSIGNED' | 'MY_ORDERS' | 'PENDING' | 'PREPARING' | 'READY'>('ALL')
  const [activeStaff, setActiveStaff] = useState<ActiveStaff[]>([])
  const [assigningOrder, setAssigningOrder] = useState<number | null>(null)

  const { session, hasActiveSession, startSession, endSession, refreshSession } = useStaffSession()

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      // Fetch bar orders (only beverage items)
      const barOrders = await api.getBarOrders({})

      setOrders(barOrders)
    } catch (error) {
      console.error('Error fetching bar orders:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchActiveStaff = async () => {
    try {
      // Fetch active staff with BAR role
      const staff = await api.getActiveStaff('BAR')
      setActiveStaff(staff)
    } catch (error) {
      console.error('Error fetching active staff:', error)
    }
  }

  useEffect(() => {
    if (hasActiveSession) {
      fetchOrders()
      fetchActiveStaff()

      // Auto-refresh every 30 seconds
      const interval = setInterval(() => {
        fetchOrders(true)
        fetchActiveStaff()
        refreshSession()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [filter, hasActiveSession])

  const handleStartSession = async () => {
    try {
      // Determine shift type based on current time
      const now = new Date()
      const hour = now.getHours()
      let shift_type = 'MORNING'

      if (hour >= 6 && hour < 12) {
        shift_type = 'MORNING'
      } else if (hour >= 12 && hour < 17) {
        shift_type = 'AFTERNOON'
      } else if (hour >= 17 && hour < 21) {
        shift_type = 'EVENING'
      } else {
        shift_type = 'NIGHT'
      }

      await startSession({ shift_type })
      await fetchOrders()
      await fetchActiveStaff()
    } catch (error: any) {
      alert(error.message || 'Gagal memulai sesi')
    }
  }

  const handleEndSession = async () => {
    if (confirm('Yakin ingin mengakhiri sesi? Pastikan semua pesanan sudah selesai.')) {
      try {
        await endSession()
        setOrders([])
        setActiveStaff([])
      } catch (error: any) {
        alert(error.message || 'Gagal mengakhiri sesi')
      }
    }
  }

  const handleAssignOrder = async (barOrderId: number, staffId: number) => {
    try {
      await api.assignBarOrder(barOrderId, staffId)
      await fetchOrders(true)
      setAssigningOrder(null)
    } catch (error: any) {
      alert(error.message || 'Gagal menugaskan pesanan')
    }
  }

  const handleStartPreparation = async (barOrderId: number) => {
    try {
      // Optimistic update
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === barOrderId ? { ...order, status: 'PREPARING' as const } : order
        )
      )

      await api.startBarPreparation(barOrderId)
      await fetchOrders(true)
      await refreshSession()
    } catch (error) {
      console.error('Error starting preparation:', error)
      alert('Gagal memulai persiapan')
      await fetchOrders()
    }
  }

  const handleMarkReady = async (barOrderId: number) => {
    try {
      // Optimistic update
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === barOrderId ? { ...order, status: 'READY' as const } : order
        )
      )

      await api.markBarReady(barOrderId)
      await fetchOrders(true)
      await refreshSession()
    } catch (error) {
      console.error('Error marking as ready:', error)
      alert('Gagal menandai siap')
      await fetchOrders()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'PREPARING': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'READY': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Menunggu'
      case 'PREPARING': return 'Sedang Dibuat'
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

  const unassignedOrders = orders.filter(o => !o.assigned_to && o.status === 'PENDING')
  const myOrders = session ? orders.filter(o => o.assigned_to === session.staff) : []
  const pendingOrders = orders.filter(o => o.status === 'PENDING')
  const preparingOrders = orders.filter(o => o.status === 'PREPARING')
  const readyOrders = orders.filter(o => o.status === 'READY')

  // Filter by active tab
  const filteredOrders = filter === 'ALL' ? orders
    : filter === 'UNASSIGNED' ? unassignedOrders
    : filter === 'MY_ORDERS' ? myOrders
    : orders.filter(o => o.status === filter)

  // No session - show session start screen
  if (!hasActiveSession) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md w-full">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-[#58ff34]/20 rounded-full">
                  <HugeiconsIcon icon={RestaurantIcon} className="h-12 w-12 text-[#58ff34]" strokeWidth={2} />
                </div>
              </div>
              <CardTitle className="text-center text-2xl">Bar Display System</CardTitle>
              <p className="text-center text-muted-foreground mt-2">
                Mulai sesi untuk melihat pesanan
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleStartSession}
                className="w-full gap-2"
                size="lg"
              >
                <HugeiconsIcon icon={LoginCircle02Icon} className="h-5 w-5" strokeWidth={2} />
                Mulai Sesi
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Sistem akan memeriksa jadwal Anda untuk hari ini
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header with Session Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#58ff34]/20 rounded-lg">
              <HugeiconsIcon icon={RestaurantIcon} className="h-8 w-8 text-[#58ff34]" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Bar Display System</h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Sesi: {session?.staff_name}</span>
                <span>•</span>
                <span>{session?.shift_type}</span>
                <span>•</span>
                <span>{session?.orders_prepared_count} minuman dibuat</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => {
                fetchOrders(true)
                fetchActiveStaff()
                refreshSession()
              }}
              variant="outline"
              className="gap-2"
              disabled={refreshing}
            >
              <HugeiconsIcon
                icon={Loading03Icon}
                className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
                strokeWidth={2}
              />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              onClick={handleEndSession}
              variant="outline"
              className="gap-2 text-red-600 hover:text-red-700"
            >
              <HugeiconsIcon icon={LogoutCircle02Icon} className="h-4 w-4" strokeWidth={2} />
              Akhiri Sesi
            </Button>
          </div>
        </div>

        {/* Active Staff Section */}
        {activeStaff.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Staf Bar Aktif ({activeStaff.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {activeStaff.map((staff) => (
                  <Badge
                    key={staff.id}
                    variant="outline"
                    className={`px-3 py-1 ${staff.staff_id === session?.staff ? 'bg-[#58ff34]/20 border-[#58ff34]' : ''}`}
                  >
                    <HugeiconsIcon icon={UserIcon} className="h-3 w-3 mr-1" strokeWidth={2} />
                    {staff.staff_name}
                    {staff.staff_id === session?.staff && ' (Anda)'}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {staff.orders_prepared_count} pesanan
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Belum Diambil</p>
                  <p className="text-3xl font-bold">{unassignedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pesanan Saya</p>
                  <p className="text-3xl font-bold">{myOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Menunggu</p>
                  <p className="text-3xl font-bold">{pendingOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sedang Dibuat</p>
                  <p className="text-3xl font-bold">{preparingOrders.length}</p>
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
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 border-b overflow-x-auto">
          <button
            onClick={() => setFilter('UNASSIGNED')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              filter === 'UNASSIGNED'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Belum Diambil ({unassignedOrders.length})
          </button>
          <button
            onClick={() => setFilter('MY_ORDERS')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              filter === 'MY_ORDERS'
                ? 'border-[#58ff34] text-[#58ff34]'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Pesanan Saya ({myOrders.length})
          </button>
          <button
            onClick={() => setFilter('ALL')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              filter === 'ALL'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Semua ({orders.length})
          </button>
          <button
            onClick={() => setFilter('PENDING')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              filter === 'PENDING'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Menunggu ({pendingOrders.length})
          </button>
          <button
            onClick={() => setFilter('PREPARING')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              filter === 'PREPARING'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Sedang Dibuat ({preparingOrders.length})
          </button>
          <button
            onClick={() => setFilter('READY')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
              filter === 'READY'
                ? 'border-black text-black'
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
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <HugeiconsIcon icon={RestaurantIcon} className="h-16 w-16 text-gray-300 mx-auto" strokeWidth={2} />
              <p className="text-xl font-medium text-muted-foreground">Tidak ada pesanan</p>
              <p className="text-sm text-muted-foreground">Pesanan baru akan muncul di sini</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredOrders.map((barOrder) => {
              const isMyOrder = barOrder.assigned_to === session?.staff
              const isUnassigned = !barOrder.assigned_to

              return (
                <Card
                  key={barOrder.id}
                  className={`border shadow-none ${isMyOrder ? 'border-[#58ff34] border-2' : ''} ${isUnassigned ? 'border-red-300 border-2' : ''}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{barOrder.order_number}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{barOrder.table_number ? `Meja ${barOrder.table_number}` : getOrderTypeLabel(barOrder.order_type)}</span>
                          <span>•</span>
                          <span>{getTimeSince(barOrder.created_at)}</span>
                        </div>
                        {barOrder.assigned_to_name && (
                          <div className="text-xs font-medium text-[#58ff34]">
                            Dibuat oleh: {barOrder.assigned_to_name}
                            {isMyOrder && ' (Anda)'}
                          </div>
                        )}
                      </div>
                      <Badge className={`${getStatusColor(barOrder.status)} border`}>
                        {getStatusLabel(barOrder.status)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Order Items - ONLY BEVERAGE ITEMS */}
                    <div className="space-y-2">
                      {barOrder.items.map((item, idx) => (
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

                    {/* Action Buttons */}
                    <div className="pt-2 space-y-2">
                      {/* Unassigned orders - can assign */}
                      {isUnassigned && barOrder.status === 'PENDING' && (
                        <>
                          {activeStaff.length > 0 && (
                            <>
                              {assigningOrder === barOrder.id ? (
                                <div className="space-y-2">
                                  <Select onValueChange={(value) => handleAssignOrder(barOrder.id, parseInt(value))}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih staf..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {activeStaff.map((staff) => (
                                        <SelectItem key={staff.staff_id} value={staff.staff_id.toString()}>
                                          {staff.staff_name} ({staff.orders_prepared_count} pesanan)
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    onClick={() => setAssigningOrder(null)}
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                  >
                                    Batal
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  onClick={() => setAssigningOrder(barOrder.id)}
                                  className="w-full gap-2 bg-[#58ff34] hover:bg-[#4de02c] text-black"
                                >
                                  <HugeiconsIcon icon={UserIcon} className="h-4 w-4" strokeWidth={2} />
                                  Tugaskan ke Staf
                                </Button>
                              )}
                            </>
                          )}
                        </>
                      )}

                      {/* My orders - can update status */}
                      {isMyOrder && barOrder.status === 'PENDING' && (
                        <Button
                          onClick={() => handleStartPreparation(barOrder.id)}
                          className="w-full gap-2"
                        >
                          <HugeiconsIcon icon={RestaurantIcon} className="h-4 w-4" strokeWidth={2} />
                          Mulai Membuat
                        </Button>
                      )}

                      {isMyOrder && barOrder.status === 'PREPARING' && (
                        <Button
                          onClick={() => handleMarkReady(barOrder.id)}
                          className="w-full gap-2"
                        >
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4" strokeWidth={2} />
                          Tandai Siap
                        </Button>
                      )}

                      {barOrder.status === 'READY' && (
                        <div className="text-center py-2 bg-green-50 rounded-md border border-green-200">
                          <p className="text-sm font-medium text-green-700">✓ Minuman siap disajikan</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
