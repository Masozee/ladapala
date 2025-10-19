"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon, ShoppingCart01Icon, DollarCircleIcon, Invoice01Icon, Calendar03Icon, CreditCardIcon, Wallet01Icon, MobileNavigator01Icon } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, type Order } from "@/lib/api"

export default function SalesHistoryPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    fetchOrders()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchTerm, paymentFilter, typeFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.getOrders({})
      setOrders(response.results)
    } catch (error) {
      console.error('Error fetching orders:', error)
      alert('Gagal memuat data penjualan: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = [...orders]

    // Filter by search term (order number, customer name, phone)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(order =>
        order.order_number?.toLowerCase().includes(term) ||
        order.customer_name.toLowerCase().includes(term) ||
        order.customer_phone.toLowerCase().includes(term)
      )
    }

    // Filter by payment method
    if (paymentFilter !== "all") {
      filtered = filtered.filter(order =>
        order.payments && order.payments.some(p => p.payment_method === paymentFilter)
      )
    }

    // Filter by order type
    if (typeFilter !== "all") {
      filtered = filtered.filter(order => order.order_type === typeFilter)
    }

    setFilteredOrders(filtered)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      'COMPLETED': { bg: 'bg-green-100', text: 'text-green-700', label: 'SELESAI' },
      'PREPARING': { bg: 'bg-blue-100', text: 'text-blue-700', label: 'DIMASAK' },
      'READY': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'SIAP' },
      'CONFIRMED': { bg: 'bg-purple-100', text: 'text-purple-700', label: 'DIKONFIRMASI' },
      'CANCELLED': { bg: 'bg-red-100', text: 'text-red-700', label: 'DIBATALKAN' },
    }
    const badge = badges[status as keyof typeof badges] || { bg: 'bg-gray-100', text: 'text-gray-700', label: status }
    return (
      <span className={`px-2 py-1 rounded text-xs ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    )
  }

  const getOrderTypeLabel = (type: string) => {
    const types = {
      'DINE_IN': 'Dine In',
      'TAKEAWAY': 'Takeaway',
      'DELIVERY': 'Delivery',
    }
    return types[type as keyof typeof types] || type
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (value: string | number) => {
    return `Rp ${parseFloat(value.toString()).toLocaleString('id-ID')}`
  }

  // Calculate summary statistics
  const totalOrders = filteredOrders.length
  const totalRevenue = filteredOrders.reduce((sum, order) => {
    return sum + (order.total_amount ? parseFloat(order.total_amount) : 0)
  }, 0)
  const averageTransaction = totalOrders > 0 ? totalRevenue / totalOrders : 0

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Memuat data penjualan...</p>
        </div>
      </div>
    )
  }

  const getPaymentMethodIcon = (order: Order) => {
    if (!order.payments || order.payments.length === 0) return null
    const method = order.payments[0].payment_method
    if (method === 'CASH') return { icon: Wallet01Icon, label: 'Tunai', color: 'text-green-600' }
    if (method === 'CARD') return { icon: CreditCardIcon, label: 'Kartu', color: 'text-blue-600' }
    if (method === 'MOBILE') return { icon: MobileNavigator01Icon, label: 'QRIS', color: 'text-purple-600' }
    return { icon: CreditCardIcon, label: 'Lainnya', color: 'text-gray-600' }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Riwayat Penjualan</h1>
        <p className="text-sm text-gray-600 mt-1">Lihat semua transaksi penjualan</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pesanan</CardTitle>
            <HugeiconsIcon icon={ShoppingCart01Icon} size={20} strokeWidth={2} className="text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-gray-500 mt-1">Transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pendapatan</CardTitle>
            <HugeiconsIcon icon={DollarCircleIcon} size={20} strokeWidth={2} className="text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">Dari semua transaksi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Rata-rata Transaksi</CardTitle>
            <HugeiconsIcon icon={Invoice01Icon} size={20} strokeWidth={2} className="text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(averageTransaction)}</div>
            <p className="text-xs text-gray-500 mt-1">Per transaksi</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters Above Table */}
      <div className="mb-4 flex gap-2 justify-end">
        {/* Search */}
        <div className="relative w-64">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            strokeWidth={2}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            type="text"
            placeholder="Cari order..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Payment Filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="h-9 px-3 text-sm border border-gray-300 rounded-md bg-white"
        >
          <option value="all">Pembayaran</option>
          <option value="CASH">Tunai</option>
          <option value="CARD">Kartu</option>
          <option value="MOBILE">QRIS</option>
        </select>

        {/* Type Filter */}
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-9 px-3 text-sm border border-gray-300 rounded-md bg-white"
        >
          <option value="all">Semua Tipe</option>
          <option value="DINE_IN">Dine In</option>
          <option value="TAKEAWAY">Takeaway</option>
          <option value="DELIVERY">Delivery</option>
        </select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <HugeiconsIcon icon={Invoice01Icon} size={64} strokeWidth={2} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg">Tidak ada data penjualan</p>
              <p className="text-sm mt-2">Coba ubah filter pencarian</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nomor Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Pelanggan
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Informasi Pembayaran
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrders.map((order) => {
                    const paymentInfo = getPaymentMethodIcon(order)
                    return (
                      <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => router.push(`/office/sales-history/${order.id}`)}>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <HugeiconsIcon icon={Invoice01Icon} size={16} strokeWidth={2} className="mr-2 text-gray-400" />
                            <span className="text-sm font-medium text-blue-600 hover:text-blue-800">
                              {order.order_number}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-600">
                            <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={2} className="mr-2 text-gray-400" />
                            {order.created_at ? formatDate(order.created_at) : '-'}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">{order.customer_name}</div>
                          <div className="text-xs text-gray-500">{order.customer_phone}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                          {getOrderTypeLabel(order.order_type)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                          {order.total_amount ? formatCurrency(order.total_amount) : '-'}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-center">
                          {paymentInfo ? (
                            <div className="inline-flex items-center gap-2">
                              <HugeiconsIcon icon={paymentInfo.icon} size={18} strokeWidth={2} className={paymentInfo.color} />
                              <span className={`text-sm font-medium ${paymentInfo.color}`}>
                                {paymentInfo.label}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Belum dibayar</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
