"use client"

import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserIcon,
  Package01Icon,
  Wallet01Icon,
  CreditCardIcon,
  EyeIcon,
  ChefHatIcon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  KitchenUtensilsIcon,
  CancelCircleIcon,
  MoreVerticalIcon,
  Delete01Icon
} from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { api, type Order, type DashboardData } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

interface StatCard {
  title: string
  value: string
  change: string
  icon: typeof Wallet01Icon
  trend: "up" | "down" | "neutral"
}

export default function HomePage() {
  const { staff } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [unpaidOrders, setUnpaidOrders] = useState<Order[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("dashboard")

  // Transaction list state
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  // Void dialog state
  const [showVoidDialog, setShowVoidDialog] = useState(false)
  const [showManagerAuth, setShowManagerAuth] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [voidReason, setVoidReason] = useState("")
  const [managerEmail, setManagerEmail] = useState("")
  const [managerPassword, setManagerPassword] = useState("")
  const [isVoiding, setIsVoiding] = useState(false)

  useEffect(() => {
    fetchData()

    // Auto-refresh every 30 seconds to show latest data
    const interval = setInterval(() => {
      fetchData()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)

      // First, try to get active cashier session
      let sessionId: number | undefined
      try {
        const sessions = await api.getActiveCashierSession()
        if (sessions && sessions.length > 0) {
          setActiveSession(sessions[0])
          sessionId = sessions[0].id
        } else {
          setActiveSession(null)
        }
      } catch (error) {
        console.log('No active session found, showing daily stats')
        setActiveSession(null)
      }

      // Fetch dashboard summary (session-based if session exists, otherwise daily)
      const summary = await api.getDashboardSummary(sessionId)
      setDashboardData(summary)

      // Fetch unpaid orders (COMPLETED status = food delivered, waiting for payment)
      // Note: COMPLETED means food has been delivered to customer, now waiting for payment
      // Exclude orders that already have COMPLETED payments
      // Only show TODAY's orders (filter out old orders from previous days)
      const unpaidResponse = await api.getOrders({ status: 'COMPLETED' })
      const todayDate = new Date().toDateString()
      const filteredUnpaid = unpaidResponse.results.filter(order => {
        const hasCompletedPayment = order.payments && order.payments.some((p: any) => p.status === 'COMPLETED')
        const orderDate = new Date(order.created_at!).toDateString()
        const isToday = orderDate === todayDate
        return !hasCompletedPayment && isToday
      })
      const sortedUnpaid = filteredUnpaid.sort((a, b) => {
        const tableA = parseInt(a.table_number || '999')
        const tableB = parseInt(b.table_number || '999')
        return tableA - tableB
      })
      setUnpaidOrders(sortedUnpaid)

      // Fetch recent orders - show orders in progress (CONFIRMED, PREPARING, READY)
      // COMPLETED orders are shown in "Transaksi Belum Bayar" section above
      // Only show TODAY's orders (filter out old orders from previous days)
      const allOrdersResponse = await api.getOrders({})
      const filteredRecent = allOrdersResponse.results
        .filter(order => {
          const isActiveStatus = ['CONFIRMED', 'PREPARING', 'READY'].includes(order.status || '')
          const orderDate = new Date(order.created_at!).toDateString()
          const isToday = orderDate === todayDate
          return isActiveStatus && isToday
        })
        .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime())
        .slice(0, 5)
      setRecentOrders(filteredRecent)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true)

      // Fetch payments for current session only
      let url = `${process.env.NEXT_PUBLIC_API_URL}/payments/?ordering=-created_at`

      // If there's an active session, filter by session
      if (activeSession) {
        url += `&cashier_session=${activeSession.id}`
        console.log('Fetching transactions for session:', activeSession.id)
      } else {
        // If no active session, show today's transactions
        const today = new Date().toISOString().split('T')[0]
        url += `&created_at__gte=${today}`
        console.log('Fetching transactions for today:', today)
      }

      console.log('Transaction API URL:', url)

      const response = await fetch(url, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Transactions received:', data.count || data.results?.length || 0)
        setTransactions(data.results || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  // Fetch transactions when switching to transactions tab
  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchTransactions()
    }
  }, [activeTab])

  const handleVoidClick = (payment: any) => {
    setSelectedPayment(payment)
    setShowManagerAuth(true)
  }

  const handleManagerAuthSubmit = async () => {
    try {
      // Validate manager credentials
      const response = await api.login(managerEmail, managerPassword)

      if (response.staff?.role && ['MANAGER', 'ADMIN'].includes(response.staff.role)) {
        // Manager authenticated, show void reason dialog
        setShowManagerAuth(false)
        setShowVoidDialog(true)
        setManagerEmail("")
        setManagerPassword("")
      } else {
        alert("Hanya Manager atau Admin yang dapat melakukan void transaksi")
      }
    } catch (error) {
      console.error('Manager auth error:', error)
      alert("Email atau password salah")
    }
  }

  const handleVoidPayment = async () => {
    if (!selectedPayment || !voidReason.trim()) {
      alert("Alasan void harus diisi!")
      return
    }

    try {
      setIsVoiding(true)
      await api.voidPayment(selectedPayment.id, voidReason)

      alert("Pembayaran berhasil di-void!")
      setShowVoidDialog(false)
      setVoidReason("")
      setSelectedPayment(null)

      // Refresh transactions
      fetchTransactions()
      fetchData()
    } catch (error: any) {
      console.error('Void error:', error)
      alert("Gagal void pembayaran: " + (error?.message || "Unknown error"))
    } finally {
      setIsVoiding(false)
    }
  }

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const totalUnpaidAmount = unpaidOrders.reduce((sum, order) => {
    return sum + parseFloat(order.total_amount || '0')
  }, 0)

  const stats: StatCard[] = [
    {
      title: activeSession ? "Total Penjualan Sesi Ini" : "Total Penjualan Hari Ini",
      value: `Rp ${parseFloat(dashboardData?.total_revenue_today || '0').toLocaleString('id-ID')}`,
      change: "+12.3%",
      icon: Wallet01Icon,
      trend: "up"
    },
    {
      title: activeSession ? "Transaksi Sesi Ini" : "Transaksi Hari Ini",
      value: dashboardData?.total_orders_today?.toString() || "0",
      change: "+8.2%",
      icon: CreditCardIcon,
      trend: "up"
    },
    {
      title: activeSession ? "Meja Aktif Sesi Ini" : "Meja Aktif",
      value: dashboardData?.active_tables?.toString() || "0",
      change: "-2.4%",
      icon: UserIcon,
      trend: "down"
    },
    {
      title: "Stok Rendah",
      value: dashboardData?.low_stock_items?.toString() || "0",
      change: "+15.3%",
      icon: Package01Icon,
      trend: "up"
    }
  ]

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'COMPLETED':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Selesai', icon: CheckmarkCircle01Icon, iconColor: 'text-green-600' }
      case 'PREPARING':
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Sedang Dimasak', icon: ChefHatIcon, iconColor: 'text-blue-600' }
      case 'READY':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Siap Diantar', icon: KitchenUtensilsIcon, iconColor: 'text-yellow-600' }
      case 'CONFIRMED':
        return { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Dikonfirmasi', icon: CheckmarkCircle01Icon, iconColor: 'text-purple-600' }
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Menunggu', icon: AlertCircleIcon, iconColor: 'text-gray-600' }
    }
  }

  const formatCurrency = (value: string | number) => {
    return `Rp ${parseFloat(value.toString()).toLocaleString('id-ID')}`
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

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">{today}</p>
          {activeSession && (
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="font-medium">Sesi Aktif: {activeSession.cashier_name} - {activeSession.shift_type}</span>
            </div>
          )}
        </div>
        <Button
          onClick={activeTab === 'dashboard' ? fetchData : fetchTransactions}
          variant="outline"
          disabled={loading || loadingTransactions}
          className="flex items-center gap-2"
        >
          <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={2} className={(loading || loadingTransactions) ? "animate-spin" : ""} />
          {(loading || loadingTransactions) ? "Memuat..." : "Refresh"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.title} className="rounded-lg border border-gray-200 shadow-none hover:border-[#58ff34] transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <HugeiconsIcon icon={stat.icon} size={32} strokeWidth={2} className="text-gray-400" />
                <span className={`text-sm font-medium ${
                  stat.trend === "up" ? "text-green-600" :
                  stat.trend === "down" ? "text-red-600" :
                  "text-gray-600"
                }`}>
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.title}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Transactions Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Transaksi Belum Bayar</h2>

        {/* Unpaid Tables */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {unpaidOrders.map((order) => (
            <Dialog key={order.id}>
              <DialogTrigger asChild>
                <div className="p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-[#58ff34] cursor-pointer transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-orange-700">
                        {order.table_number || 'TA'}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {order.table_number ? `Meja ${order.table_number}` : order.order_type}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(order.total_amount || 0)}
                    </div>
                    <div className="text-sm text-orange-600 font-medium">
                      {getTimeDiff(order.created_at!)}
                    </div>
                    <div className="text-xs text-gray-500">
                      Order: {order.order_number}
                    </div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-orange-700">
                        {order.table_number || 'TA'}
                      </span>
                    </div>
                    Detail Transaksi {order.order_number}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Transaction Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Order ID</div>
                      <div className="font-medium">{order.order_number}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Customer</div>
                      <div className="font-medium">{order.customer_name}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Waktu</div>
                      <div className="font-medium">
                        {new Date(order.created_at!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Durasi</div>
                      <div className="font-medium text-orange-600">{getTimeDiff(order.created_at!)}</div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <HugeiconsIcon icon={ChefHatIcon} size={20} strokeWidth={2} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Item Pesanan</span>
                    </div>
                    <div className="space-y-2">
                      {order.items?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border">
                          <div>
                            <div className="font-medium text-sm">{item.product_name}</div>
                            <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                          </div>
                          <div className="font-medium text-sm">{formatCurrency(item.subtotal || 0)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total */}
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Tagihan:</span>
                      <span className="text-xl font-bold text-orange-600">
                        {formatCurrency(order.total_amount || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Payment Button */}
                  <Button
                    onClick={() => window.location.href = `/transaction?orderId=${order.id}`}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <HugeiconsIcon icon={CreditCardIcon} size={20} strokeWidth={2} className="mr-2" />
                    Proses Pembayaran
                    <HugeiconsIcon icon={ArrowRight01Icon} size={20} strokeWidth={2} className="ml-2" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>

        {/* Total Summary */}
        <Card className="rounded-lg border border-gray-200 shadow-none hover:border-[#58ff34] transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Belum Bayar:</span>
              <span className="text-xl font-bold text-orange-600">
                {formatCurrency(totalUnpaidAmount)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Pesanan Terbaru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentOrders.map((order) => {
              const statusInfo = getStatusBadge(order.status)
              return (
                <Dialog key={order.id}>
                  <DialogTrigger asChild>
                    <div className="p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-[#58ff34] cursor-pointer transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusInfo.bg}`}>
                            <HugeiconsIcon icon={statusInfo.icon} size={20} strokeWidth={2} className={statusInfo.iconColor} />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{order.order_number}</div>
                            <div className="text-sm text-gray-500">
                              {order.table_number ? `Meja ${order.table_number}` : order.order_type}
                            </div>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-lg font-semibold text-gray-900">
                          {formatCurrency(order.total_amount || 0)}
                        </div>
                        <div className="text-sm text-gray-600">{order.customer_name}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.created_at!).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Detail Pesanan {order.order_number}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-500">Meja/Tipe</div>
                          <div className="font-medium">
                            {order.table_number ? `Meja ${order.table_number}` : order.order_type}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-500">Status</div>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.text}`}>
                            {statusInfo.label}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <HugeiconsIcon icon={ChefHatIcon} size={20} strokeWidth={2} className="text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">Item Pesanan</span>
                        </div>
                        <div className="space-y-2">
                          {order.items?.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border">
                              <div>
                                <div className="font-medium text-sm">{item.product_name}</div>
                                <div className="text-xs text-gray-500">Qty: {item.quantity}</div>
                              </div>
                              <div className="font-medium text-sm">{formatCurrency(item.subtotal || 0)}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-700">Total:</span>
                          <span className="text-xl font-bold text-blue-600">
                            {formatCurrency(order.total_amount || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Status Update Buttons */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium text-gray-700 mb-2">Ubah Status Pesanan:</div>
                        <div className="grid grid-cols-2 gap-2">
                          {order.status === 'CONFIRMED' && (
                            <Button
                              onClick={async () => {
                                try {
                                  await api.updateOrderStatus(order.id!, 'PREPARING')
                                  await fetchData()
                                  alert('Status diubah ke PREPARING')
                                } catch (error) {
                                  console.error('Error:', error)
                                  alert('Gagal mengubah status')
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                              size="sm"
                            >
                              <HugeiconsIcon icon={ChefHatIcon} size={16} strokeWidth={2} className="mr-1" />
                              Mulai Siapkan
                            </Button>
                          )}
                          {order.status === 'PREPARING' && (
                            <Button
                              onClick={async () => {
                                try {
                                  await api.updateOrderStatus(order.id!, 'READY')
                                  await fetchData()
                                  alert('Status diubah ke READY - Siap diantar')
                                } catch (error) {
                                  console.error('Error:', error)
                                  alert('Gagal mengubah status')
                                }
                              }}
                              className="bg-yellow-600 hover:bg-yellow-700"
                              size="sm"
                            >
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} strokeWidth={2} className="mr-1" />
                              Siap Diantar
                            </Button>
                          )}
                          {order.status === 'READY' && (
                            <Button
                              onClick={async () => {
                                try {
                                  await api.updateOrderStatus(order.id!, 'COMPLETED')
                                  await fetchData()
                                  alert('Pesanan sudah diantar ke pelanggan')
                                } catch (error) {
                                  console.error('Error:', error)
                                  alert('Gagal mengubah status')
                                }
                              }}
                              className="bg-green-600 hover:bg-green-700"
                              size="sm"
                            >
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={16} strokeWidth={2} className="mr-1" />
                              Sudah Diantar
                            </Button>
                          )}
                          <Button
                            onClick={async () => {
                              if (!confirm('Batalkan pesanan ini?')) return
                              try {
                                await api.updateOrderStatus(order.id!, 'CANCELLED')
                                await fetchData()
                                alert('Pesanan dibatalkan')
                              } catch (error) {
                                console.error('Error:', error)
                                alert('Gagal membatalkan pesanan')
                              }
                            }}
                            variant="outline"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                            size="sm"
                          >
                            <HugeiconsIcon icon={CancelCircleIcon} size={16} strokeWidth={2} className="mr-1" />
                            Batalkan
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )
            })}
          </div>
        </div>

        {/* System Info */}
        <Card className="rounded-lg border border-gray-200 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} size={20} strokeWidth={2} className="text-blue-500" />
              Informasi Sistem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Pesanan Pending</div>
                  <div className="text-sm text-gray-500">Menunggu konfirmasi</div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-gray-900">
                    {dashboardData?.pending_orders || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Stok Rendah</div>
                  <div className="text-sm text-gray-500">Perlu restok</div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-orange-600">
                    {dashboardData?.low_stock_items || 0}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">Staff Bertugas</div>
                  <div className="text-sm text-gray-500">Hari ini</div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-600">
                    {dashboardData?.staff_on_duty || 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                Daftar Transaksi {activeSession && `- Sesi ${activeSession.shift_type}`}
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                {activeSession
                  ? `Menampilkan transaksi untuk sesi kasir aktif`
                  : `Menampilkan transaksi hari ini`
                }
              </p>
            </CardHeader>
            <CardContent>
              {loadingTransactions ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Memuat transaksi...</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Waktu</TableHead>
                      <TableHead>ID Transaksi</TableHead>
                      <TableHead>No. Pesanan</TableHead>
                      <TableHead className="text-right">Jumlah</TableHead>
                      <TableHead>Metode</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Kasir</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          Belum ada transaksi
                        </TableCell>
                      </TableRow>
                    ) : (
                      transactions.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="text-sm">
                            {new Date(payment.created_at).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.transaction_id}
                          </TableCell>
                          <TableCell className="font-medium">
                            {payment.order_number || '-'}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            Rp {parseFloat(payment.amount).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.payment_method}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              payment.status === 'COMPLETED' ? 'default' :
                              payment.status === 'REFUNDED' ? 'destructive' :
                              'secondary'
                            }>
                              {payment.status === 'REFUNDED' ? 'VOID' : payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {payment.processed_by_name || '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            {payment.status === 'COMPLETED' && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <HugeiconsIcon icon={MoreVerticalIcon} size={16} strokeWidth={2} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => handleVoidClick(payment)}
                                    className="text-red-600"
                                  >
                                    <HugeiconsIcon icon={Delete01Icon} size={16} strokeWidth={2} className="mr-2" />
                                    Void Pembayaran
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Manager Authentication Dialog */}
      <Dialog open={showManagerAuth} onOpenChange={setShowManagerAuth}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>🔐 Autentikasi Manager</DialogTitle>
            <DialogDescription>
              Masukkan kredensial Manager atau Admin untuk melanjutkan void transaksi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="manager-email">Email</Label>
              <Input
                id="manager-email"
                type="email"
                value={managerEmail}
                onChange={(e) => setManagerEmail(e.target.value)}
                placeholder="manager@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="manager-password">Password</Label>
              <Input
                id="manager-password"
                type="password"
                value={managerPassword}
                onChange={(e) => setManagerPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowManagerAuth(false)
                setManagerEmail("")
                setManagerPassword("")
                setSelectedPayment(null)
              }}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleManagerAuthSubmit}
              disabled={!managerEmail || !managerPassword}
            >
              Verifikasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Void Reason Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Void Pembayaran</DialogTitle>
            <DialogDescription>
              Tindakan ini akan membatalkan pembayaran. Pesanan akan kembali ke status menunggu pembayaran.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedPayment && (
              <div className="bg-gray-50 p-4 rounded space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">ID Transaksi:</span>
                  <span className="font-mono text-xs">{selectedPayment.transaction_id}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jumlah:</span>
                  <span className="font-semibold">Rp {parseFloat(selectedPayment.amount).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Metode:</span>
                  <span className="font-semibold">{selectedPayment.payment_method}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="void-reason" className="text-red-600 font-semibold">
                Alasan Void (Wajib) *
              </Label>
              <Textarea
                id="void-reason"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                placeholder="Contoh: Kesalahan input pembayaran, customer request refund, dll"
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3">
              <p className="text-xs text-yellow-800">
                <strong>Perhatian:</strong> Tindakan void akan tercatat dalam audit log dan tidak dapat dibatalkan.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowVoidDialog(false)
                setVoidReason("")
                setSelectedPayment(null)
              }}
              disabled={isVoiding}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleVoidPayment}
              disabled={!voidReason.trim() || isVoiding}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isVoiding ? "Memproses..." : "Ya, Void Pembayaran"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
