"use client"

import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserIcon,
  Package01Icon,
  Clock01Icon,
  CancelCircleIcon,
  Wallet01Icon,
  CreditCardIcon,
  EyeIcon,
  ChefHatIcon,
  Calendar01Icon,
  ArrowRight01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon,
  KitchenUtensilsIcon
} from "@hugeicons/core-free-icons"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface StatCard {
  title: string
  value: string
  change: string
  icon: typeof Wallet01Icon
  trend: "up" | "down" | "neutral"
}

const stats: StatCard[] = [
  {
    title: "Total Penjualan Hari Ini",
    value: "Rp 12.450.000",
    change: "+12.3%",
    icon: Wallet01Icon,
    trend: "up"
  },
  {
    title: "Transaksi",
    value: "145",
    change: "+8.2%",
    icon: CreditCardIcon,
    trend: "up"
  },
  {
    title: "Pengunjung",
    value: "324",
    change: "-2.4%",
    icon: UserIcon,
    trend: "down"
  },
  {
    title: "Menu Terjual",
    value: "482",
    change: "+15.3%",
    icon: Package01Icon,
    trend: "up"
  }
]

const recentOrders = [
  { 
    id: "ORD008", 
    table: "Meja 2", 
    amount: "Rp 185.000", 
    status: "preparing", 
    time: "10:35",
    items: [
      { name: "Nasi Gudeg", qty: 2, price: "Rp 45.000" },
      { name: "Teh Manis", qty: 2, price: "Rp 10.000" },
      { name: "Kerupuk", qty: 3, price: "Rp 15.000" }
    ],
    customerCount: 2,
    estimatedTime: "15 menit",
    waiter: "Sari"
  },
  { 
    id: "ORD009", 
    table: "Meja 6", 
    amount: "Rp 320.000", 
    status: "ready", 
    time: "10:30",
    items: [
      { name: "Rendang", qty: 2, price: "Rp 75.000" },
      { name: "Nasi Putih", qty: 3, price: "Rp 8.000" },
      { name: "Es Jeruk", qty: 3, price: "Rp 12.000" }
    ],
    customerCount: 3,
    estimatedTime: "Siap disajikan",
    waiter: "Budi"
  },
  { 
    id: "ORD010", 
    table: "Take Away", 
    amount: "Rp 95.000", 
    status: "completed", 
    time: "10:25",
    items: [
      { name: "Mie Ayam", qty: 2, price: "Rp 25.000" },
      { name: "Es Teh", qty: 2, price: "Rp 8.000" }
    ],
    customerCount: 1,
    estimatedTime: "Selesai",
    waiter: "Andi"
  },
  { 
    id: "ORD011", 
    table: "Meja 4", 
    amount: "Rp 210.000", 
    status: "pending", 
    time: "10:20",
    items: [
      { name: "Soto Betawi", qty: 2, price: "Rp 35.000" },
      { name: "Kerak Telor", qty: 2, price: "Rp 25.000" },
      { name: "Es Cendol", qty: 3, price: "Rp 18.000" }
    ],
    customerCount: 2,
    estimatedTime: "Menunggu konfirmasi",
    waiter: "Dewi"
  },
  { 
    id: "ORD012", 
    table: "Meja 9", 
    amount: "Rp 275.000", 
    status: "preparing", 
    time: "10:15",
    items: [
      { name: "Ikan Bakar", qty: 1, price: "Rp 85.000" },
      { name: "Sayur Kangkung", qty: 2, price: "Rp 20.000" },
      { name: "Nasi Putih", qty: 3, price: "Rp 8.000" }
    ],
    customerCount: 3,
    estimatedTime: "20 menit",
    waiter: "Rini"
  },
]

const unavailableMenuItems = [
  { name: "Ayam Bakar Madu", reason: "Habis madu", estimatedTime: "2 jam" },
  { name: "Ikan Gurame Asam Manis", reason: "Stok ikan habis", estimatedTime: "Besok" },
  { name: "Soto Betawi", reason: "Santan habis", estimatedTime: "1 jam" },
  { name: "Rujak Buah", reason: "Buah belum datang", estimatedTime: "3 jam" },
]

// Mock data for unpaid tables with detailed transaction info
const unpaidTables = [
  { 
    tableNumber: "Meja 5", 
    amount: "Rp 250.000", 
    duration: "45 menit", 
    orderTime: "09:30", 
    status: "dining",
    orderId: "ORD001",
    items: [
      { name: "Nasi Gudeg", qty: 2, price: "Rp 45.000" },
      { name: "Ayam Bakar", qty: 1, price: "Rp 65.000" },
      { name: "Es Teh Manis", qty: 3, price: "Rp 15.000" },
      { name: "Kerupuk", qty: 2, price: "Rp 10.000" }
    ],
    customerCount: 3
  },
  { 
    tableNumber: "Meja 12", 
    amount: "Rp 180.000", 
    duration: "32 menit", 
    orderTime: "09:58", 
    status: "dining",
    orderId: "ORD002",
    items: [
      { name: "Soto Betawi", qty: 2, price: "Rp 35.000" },
      { name: "Kerak Telor", qty: 1, price: "Rp 25.000" },
      { name: "Es Cendol", qty: 2, price: "Rp 18.000" }
    ],
    customerCount: 2
  },
  { 
    tableNumber: "Meja 3", 
    amount: "Rp 320.000", 
    duration: "1 jam 15 menit", 
    orderTime: "08:45", 
    status: "dining",
    orderId: "ORD003",
    items: [
      { name: "Rendang", qty: 2, price: "Rp 75.000" },
      { name: "Nasi Putih", qty: 4, price: "Rp 8.000" },
      { name: "Sayur Asem", qty: 2, price: "Rp 25.000" },
      { name: "Es Jeruk", qty: 4, price: "Rp 12.000" }
    ],
    customerCount: 4
  },
  { 
    tableNumber: "Meja 8", 
    amount: "Rp 150.000", 
    duration: "28 menit", 
    orderTime: "10:02", 
    status: "dining",
    orderId: "ORD004",
    items: [
      { name: "Gado-gado", qty: 2, price: "Rp 30.000" },
      { name: "Lontong Sayur", qty: 1, price: "Rp 25.000" },
      { name: "Teh Tarik", qty: 2, price: "Rp 15.000" }
    ],
    customerCount: 2
  },
  { 
    tableNumber: "Meja 15", 
    amount: "Rp 95.000", 
    duration: "18 menit", 
    orderTime: "10:12", 
    status: "dining",
    orderId: "ORD005",
    items: [
      { name: "Mie Ayam", qty: 1, price: "Rp 25.000" },
      { name: "Pangsit Goreng", qty: 1, price: "Rp 15.000" },
      { name: "Es Teh", qty: 2, price: "Rp 8.000" }
    ],
    customerCount: 1
  },
  { 
    tableNumber: "Meja 7", 
    amount: "Rp 275.000", 
    duration: "52 menit", 
    orderTime: "09:18", 
    status: "dining",
    orderId: "ORD006",
    items: [
      { name: "Ikan Bakar", qty: 1, price: "Rp 85.000" },
      { name: "Nasi Putih", qty: 3, price: "Rp 8.000" },
      { name: "Sayur Kangkung", qty: 2, price: "Rp 20.000" },
      { name: "Es Kelapa Muda", qty: 3, price: "Rp 18.000" }
    ],
    customerCount: 3
  },
  { 
    tableNumber: "Meja 10", 
    amount: "Rp 135.000", 
    duration: "24 menit", 
    orderTime: "10:06", 
    status: "dining",
    orderId: "ORD007",
    items: [
      { name: "Bakso Malang", qty: 2, price: "Rp 28.000" },
      { name: "Siomay", qty: 1, price: "Rp 20.000" },
      { name: "Es Teh Manis", qty: 3, price: "Rp 10.000" }
    ],
    customerCount: 2
  },
]


export default function HomePage() {
  const [selectedTable, setSelectedTable] = useState<typeof unpaidTables[0] | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<typeof recentOrders[0] | null>(null)
  
  const today = new Date().toLocaleDateString("id-ID", { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })

  const totalUnpaidAmount = unpaidTables.reduce((sum, table) => {
    const amount = parseInt(table.amount.replace(/[^\d]/g, ''))
    return sum + amount
  }, 0)
  
  const handlePaymentRedirect = (table: typeof unpaidTables[0]) => {
    // Redirect to transaction page with table info
    window.location.href = `/transaction?table=${encodeURIComponent(table.tableNumber)}&orderId=${table.orderId}`
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">{today}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => {
          return (
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
          )
        })}
      </div>

      {/* Transactions Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Transactions</h2>
        
        {/* Unpaid Tables - 2 Rows Layout */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {unpaidTables.map((table) => (
            <Dialog key={table.tableNumber}>
              <DialogTrigger asChild>
                <div className="p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-[#58ff34] cursor-pointer transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-orange-700">
                        {table.tableNumber.split(' ')[1]}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{table.tableNumber}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-semibold text-gray-900">{table.amount}</div>
                    <div className="text-sm text-orange-600 font-medium">{table.duration}</div>
                    <div className="text-xs text-gray-500">Mulai: {table.orderTime}</div>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-semibold text-orange-700">
                        {table.tableNumber.split(' ')[1]}
                      </span>
                    </div>
                    Detail Transaksi {table.tableNumber}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {/* Transaction Info */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm text-gray-500">Order ID</div>
                      <div className="font-medium">{table.orderId}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Jumlah Tamu</div>
                      <div className="font-medium">{table.customerCount} orang</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Waktu Mulai</div>
                      <div className="font-medium">{table.orderTime}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Durasi</div>
                      <div className="font-medium text-orange-600">{table.duration}</div>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <HugeiconsIcon icon={ChefHatIcon} size={32} strokeWidth={2} className="text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Item Pesanan</span>
                    </div>
                    <div className="space-y-2">
                      {table.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                          <div>
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500">Qty: {item.qty}</div>
                          </div>
                          <div className="font-medium text-sm">{item.price}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Total */}
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-700">Total Tagihan:</span>
                      <span className="text-xl font-bold text-orange-600">{table.amount}</span>
                    </div>
                  </div>
                  
                  {/* Payment Button */}
                  <Button
                    onClick={() => handlePaymentRedirect(table)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <HugeiconsIcon icon={CreditCardIcon} size={32} strokeWidth={2} className="mr-2" />
                    Proses Pembayaran
                    <HugeiconsIcon icon={ArrowRight01Icon} size={32} strokeWidth={2} className="ml-2" />
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
                Rp {totalUnpaidAmount.toLocaleString('id-ID')}
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
            {recentOrders.map((order) => (
              <Dialog key={order.id}>
                <DialogTrigger asChild>
                  <div className="p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-[#58ff34] cursor-pointer transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          order.status === 'completed' ? 'bg-green-100' :
                          order.status === 'preparing' ? 'bg-blue-100' :
                          order.status === 'ready' ? 'bg-yellow-100' :
                          'bg-gray-100'
                        }`}>
                          {order.status === 'completed' ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} strokeWidth={2} className="text-green-600" /> :
                           order.status === 'preparing' ? <HugeiconsIcon icon={ChefHatIcon} size={32} strokeWidth={2} className="text-blue-600" /> :
                           order.status === 'ready' ? <HugeiconsIcon icon={KitchenUtensilsIcon} size={32} strokeWidth={2} className="text-yellow-600" /> :
                           <HugeiconsIcon icon={AlertCircleIcon} size={32} strokeWidth={2} className="text-gray-600" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{order.id}</div>
                          <div className="text-sm text-gray-500">{order.table}</div>
                        </div>
                      </div>
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
                    </div>
                    <div className="space-y-1">
                      <div className="text-lg font-semibold text-gray-900">{order.amount}</div>
                      <div className="text-sm text-gray-600">{order.estimatedTime}</div>
                      <div className="text-xs text-gray-500">Waktu: {order.time}</div>
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        order.status === 'completed' ? 'bg-green-100' :
                        order.status === 'preparing' ? 'bg-blue-100' :
                        order.status === 'ready' ? 'bg-yellow-100' :
                        'bg-gray-100'
                      }`}>
                        {order.status === 'completed' ? <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} strokeWidth={2} className="text-green-600" /> :
                         order.status === 'preparing' ? <HugeiconsIcon icon={ChefHatIcon} size={32} strokeWidth={2} className="text-blue-600" /> :
                         order.status === 'ready' ? <HugeiconsIcon icon={KitchenUtensilsIcon} size={32} strokeWidth={2} className="text-yellow-600" /> :
                         <HugeiconsIcon icon={AlertCircleIcon} size={32} strokeWidth={2} className="text-gray-600" />}
                      </div>
                      Detail Pesanan {order.id}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Order Info */}
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-sm text-gray-500">Meja</div>
                        <div className="font-medium">{order.table}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Pelayan</div>
                        <div className="font-medium">{order.waiter}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Waktu Order</div>
                        <div className="font-medium">{order.time}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">Jumlah Tamu</div>
                        <div className="font-medium">{order.customerCount} orang</div>
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'ready' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status === 'completed' ? 'Selesai' :
                           order.status === 'preparing' ? 'Diproses' :
                           order.status === 'ready' ? 'Siap Disajikan' :
                           'Menunggu Konfirmasi'}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">{order.estimatedTime}</div>
                    </div>
                    
                    {/* Order Items */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <HugeiconsIcon icon={ChefHatIcon} size={32} strokeWidth={2} className="text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Item Pesanan</span>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                            <div>
                              <div className="font-medium text-sm">{item.name}</div>
                              <div className="text-xs text-gray-500">Qty: {item.qty}</div>
                            </div>
                            <div className="font-medium text-sm">{item.price}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Total */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-700">Total Pesanan:</span>
                        <span className="text-xl font-bold text-blue-600">{order.amount}</span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      {order.status === 'pending' && (
                        <Button className="bg-green-600 hover:bg-green-700 text-white">
                          <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} strokeWidth={2} className="mr-2" />
                          Konfirmasi
                        </Button>
                      )}
                      {order.status === 'ready' && (
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                          <HugeiconsIcon icon={KitchenUtensilsIcon} size={32} strokeWidth={2} className="mr-2" />
                          Sajikan
                        </Button>
                      )}
                      {(order.status === 'pending' || order.status === 'ready') && (
                        <Button variant="outline">
                          <HugeiconsIcon icon={EyeIcon} size={32} strokeWidth={2} className="mr-2" />
                          Lihat Detail
                        </Button>
                      )}
                      {order.status === 'preparing' && (
                        <>
                          <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
                            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={32} strokeWidth={2} className="mr-2" />
                            Siap
                          </Button>
                          <Button variant="outline">
                            <HugeiconsIcon icon={Clock01Icon} size={32} strokeWidth={2} className="mr-2" />
                            Update Status
                          </Button>
                        </>
                      )}
                      {order.status === 'completed' && (
                        <Button variant="outline" className="col-span-2">
                          <HugeiconsIcon icon={EyeIcon} size={32} strokeWidth={2} className="mr-2" />
                          Lihat Riwayat
                        </Button>
                      )}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </div>

        {/* Unavailable Menu */}
        <Card className="rounded-lg border border-gray-200 shadow-none hover:border-[#58ff34] transition-colors cursor-pointer">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={CancelCircleIcon} size={32} strokeWidth={2} className="text-red-500" />
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
  )
}