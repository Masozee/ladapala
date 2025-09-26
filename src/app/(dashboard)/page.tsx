"use client"

import { 
  TrendingUp, 
  ShoppingCart, 
  Users, 
  DollarSign,
  Package,
  AlertCircle,
  BarChart3,
  Eye,
  XCircle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StatCard {
  title: string
  value: string
  change: string
  icon: React.ComponentType<{ className?: string }>
  trend: "up" | "down" | "neutral"
}

const stats: StatCard[] = [
  {
    title: "Total Penjualan Hari Ini",
    value: "Rp 12.450.000",
    change: "+12.3%",
    icon: DollarSign,
    trend: "up"
  },
  {
    title: "Transaksi",
    value: "145",
    change: "+8.2%",
    icon: ShoppingCart,
    trend: "up"
  },
  {
    title: "Pengunjung",
    value: "324",
    change: "-2.4%",
    icon: Users,
    trend: "down"
  },
  {
    title: "Menu Terjual",
    value: "482",
    change: "+15.3%",
    icon: Package,
    trend: "up"
  }
]

const recentOrders = [
  { id: "ORD001", table: "Meja 5", amount: "Rp 250.000", status: "preparing", time: "10:30" },
  { id: "ORD002", table: "Meja 12", amount: "Rp 180.000", status: "ready", time: "10:25" },
  { id: "ORD003", table: "Take Away", amount: "Rp 95.000", status: "completed", time: "10:20" },
  { id: "ORD004", table: "Meja 3", amount: "Rp 320.000", status: "pending", time: "10:15" },
  { id: "ORD005", table: "Meja 8", amount: "Rp 150.000", status: "preparing", time: "10:10" },
]

const unavailableMenuItems = [
  { name: "Ayam Bakar Madu", reason: "Habis madu", estimatedTime: "2 jam" },
  { name: "Ikan Gurame Asam Manis", reason: "Stok ikan habis", estimatedTime: "Besok" },
  { name: "Soto Betawi", reason: "Santan habis", estimatedTime: "1 jam" },
  { name: "Rujak Buah", reason: "Buah belum datang", estimatedTime: "3 jam" },
]

// Mock data for charts
const weeklyVisitorData = [
  { day: "Sen", visitors: 45, revenue: 2400000 },
  { day: "Sel", visitors: 52, revenue: 2800000 },
  { day: "Rab", visitors: 48, revenue: 2600000 },
  { day: "Kam", visitors: 61, revenue: 3200000 },
  { day: "Jum", visitors: 55, revenue: 3000000 },
  { day: "Sab", visitors: 78, revenue: 4100000 },
  { day: "Min", visitors: 72, revenue: 3800000 },
]

const weeklyRevenueData = [
  { day: "Sen", revenue: 2400000 },
  { day: "Sel", revenue: 2800000 },
  { day: "Rab", revenue: 2600000 },
  { day: "Kam", revenue: 3200000 },
  { day: "Jum", revenue: 3000000 },
  { day: "Sab", revenue: 4100000 },
  { day: "Min", revenue: 3800000 },
]

export default function HomePage() {
  const today = new Date().toLocaleDateString("id-ID", { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const maxVisitors = Math.max(...weeklyVisitorData.map(d => d.visitors))
  const maxRevenue = Math.max(...weeklyRevenueData.map(d => d.revenue))

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">{today}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.title} className="rounded-lg border-gray-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="h-8 w-8 text-gray-400" />
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
              )
            })}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Visitor Chart */}
            <Card className="rounded-lg border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-blue-600" />
                  Pengunjung Mingguan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyVisitorData.map((data) => (
                    <div key={data.day} className="flex items-center gap-3">
                      <div className="w-8 text-sm text-gray-600">{data.day}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div 
                          className="bg-blue-500 h-full rounded-full transition-all"
                          style={{ width: `${(data.visitors / maxVisitors) * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                          {data.visitors}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Total minggu ini: {weeklyVisitorData.reduce((sum, d) => sum + d.visitors, 0)} pengunjung
                </div>
              </CardContent>
            </Card>

            {/* Revenue Chart */}
            <Card className="rounded-lg border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-green-600" />
                  Pendapatan Mingguan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {weeklyRevenueData.map((data) => (
                    <div key={data.day} className="flex items-center gap-3">
                      <div className="w-8 text-sm text-gray-600">{data.day}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative overflow-hidden">
                        <div 
                          className="bg-green-500 h-full rounded-full transition-all"
                          style={{ width: `${(data.revenue / maxRevenue) * 100}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-700">
                          Rp {(data.revenue / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-sm text-gray-500">
                  Total minggu ini: Rp {(weeklyRevenueData.reduce((sum, d) => sum + d.revenue, 0) / 1000000).toFixed(1)}M
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Recent Orders */}
            <Card className="lg:col-span-2 rounded-lg border-gray-200">
              <CardHeader>
                <CardTitle>Pesanan Terbaru</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-medium text-gray-900">{order.id}</div>
                          <div className="text-sm text-gray-500">{order.table}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">{order.amount}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status === 'completed' ? 'Selesai' :
                             order.status === 'preparing' ? 'Diproses' :
                             order.status === 'ready' ? 'Siap' :
                             'Menunggu'}
                          </span>
                          <span className="text-xs text-gray-500">{order.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Unavailable Menu */}
            <Card className="rounded-lg border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  Menu Tidak Tersedia
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {unavailableMenuItems.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500">{item.reason}</div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {item.estimatedTime}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}