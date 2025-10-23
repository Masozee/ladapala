"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  Invoice01Icon,
  UserIcon,
  CallIcon,
  Location01Icon,
  Calendar03Icon,
  CreditCardIcon,
  ShoppingCart01Icon,
  PrinterIcon,
  CellsIcon,
} from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api, type Order } from "@/lib/api"

export default function SalesHistoryDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const orderId = params?.id ? parseInt(params.id as string) : null

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail()
    }
  }, [orderId])

  const fetchOrderDetail = async () => {
    if (!orderId) return

    try {
      setLoading(true)
      const response = await api.getOrder(orderId)
      setOrder(response)
    } catch (error) {
      console.error('Error fetching order detail:', error)
      alert('Gagal memuat detail penjualan: ' + (error as Error).message)
      router.push('/office/sales-history')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: string | number) => {
    return `Rp ${parseFloat(value.toString()).toLocaleString('id-ID')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
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
      <span className={`px-3 py-1 rounded text-sm font-medium ${badge.bg} ${badge.text}`}>
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

  const getPaymentMethodLabel = (method: string) => {
    const methods = {
      'CASH': 'Tunai',
      'CARD': 'Kartu',
      'MOBILE': 'QRIS/E-Wallet',
      'OTHER': 'Lainnya',
    }
    return methods[method as keyof typeof methods] || method
  }

  const handlePrint = () => {
    window.print()
  }

  // Calculate totals
  const subtotal = order?.items.reduce((sum, item) => {
    const itemSubtotal = parseFloat(item.unit_price) * item.quantity
    return sum + itemSubtotal
  }, 0) || 0

  const discountTotal = order?.items.reduce((sum, item) => {
    const discount = item.discount_amount ? parseFloat(item.discount_amount) : 0
    return sum + discount
  }, 0) || 0

  const grandTotal = order?.total_amount ? parseFloat(order.total_amount) : 0

  const totalItems = order?.items.reduce((sum, item) => sum + item.quantity, 0) || 0

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Memuat detail penjualan...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <HugeiconsIcon icon={Invoice01Icon} size={64} strokeWidth={2} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl text-gray-600">Pesanan tidak ditemukan</p>
            <Button onClick={() => router.push('/office/sales-history')} className="mt-4" variant="outline">
              Kembali ke Riwayat
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={() => router.push('/office/sales-history')} variant="outline" size="sm">
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} className="mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detail Penjualan</h1>
            <p className="text-sm text-gray-600 mt-1">Order #{order.order_number}</p>
          </div>
        </div>
        <Button onClick={handlePrint} variant="outline">
          <HugeiconsIcon icon={PrinterIcon} size={20} strokeWidth={2} className="mr-2" />
          Cetak
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HugeiconsIcon icon={Invoice01Icon} size={24} strokeWidth={2} className="mr-2" />
                Informasi Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">
                    {order.status && getStatusBadge(order.status)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipe Pesanan</p>
                  <p className="mt-1 font-medium">{getOrderTypeLabel(order.order_type)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tanggal & Waktu</p>
                  <div className="mt-1 flex items-start">
                    <HugeiconsIcon icon={Calendar03Icon} size={16} strokeWidth={2} className="mr-2 mt-0.5 text-gray-400" />
                    <p className="text-sm font-medium">
                      {order.created_at ? formatDate(order.created_at) : '-'}
                    </p>
                  </div>
                </div>
                {order.table_number && (
                  <div>
                    <p className="text-sm text-gray-600">Nomor Meja</p>
                    <div className="mt-1 flex items-center">
                      <HugeiconsIcon icon={CellsIcon} size={16} strokeWidth={2} className="mr-2 text-gray-400" />
                      <p className="font-medium">Meja {order.table_number}</p>
                    </div>
                  </div>
                )}
                {order.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600">Catatan</p>
                    <p className="mt-1 text-sm italic text-gray-700">{order.notes}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HugeiconsIcon icon={ShoppingCart01Icon} size={24} strokeWidth={2} className="mr-2" />
                Item Pesanan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Harga
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Diskon
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items.map((item) => {
                      const itemSubtotal = parseFloat(item.unit_price) * item.quantity
                      const itemDiscount = item.discount_amount ? parseFloat(item.discount_amount) : 0
                      const itemTotal = itemSubtotal - itemDiscount
                      return (
                        <tr key={item.id}>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900">{item.product_name}</div>
                            {item.notes && (
                              <div className="text-xs text-gray-500 italic mt-1">{item.notes}</div>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center text-sm text-gray-600">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-gray-600">
                            {formatCurrency(item.unit_price)}
                          </td>
                          <td className="px-4 py-4 text-right text-sm text-gray-600">
                            {itemDiscount > 0 ? formatCurrency(itemDiscount) : '-'}
                          </td>
                          <td className="px-4 py-4 text-right text-sm font-medium text-gray-900">
                            {formatCurrency(itemTotal)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                        Subtotal:
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                        {formatCurrency(subtotal)}
                      </td>
                    </tr>
                    {discountTotal > 0 && (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-right text-sm font-medium text-gray-700">
                          Total Diskon:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium text-red-600">
                          -{formatCurrency(discountTotal)}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t-2 border-gray-300">
                      <td colSpan={4} className="px-4 py-4 text-right text-base font-bold text-gray-900">
                        Total:
                      </td>
                      <td className="px-4 py-4 text-right text-lg font-bold text-gray-900">
                        {formatCurrency(grandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Payment Info */}
          {order.payments && order.payments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HugeiconsIcon icon={CreditCardIcon} size={24} strokeWidth={2} className="mr-2" />
                  Informasi Pembayaran
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.payments.map((payment: any) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{getPaymentMethodLabel(payment.payment_method)}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
                        <span className={`text-xs px-2 py-1 rounded ${
                          payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          payment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                          payment.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HugeiconsIcon icon={UserIcon} size={24} strokeWidth={2} className="mr-2" />
                Informasi Pelanggan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Nama</p>
                  <div className="mt-1 flex items-center">
                    <HugeiconsIcon icon={UserIcon} size={16} strokeWidth={2} className="mr-2 text-gray-400" />
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telepon</p>
                  <div className="mt-1 flex items-center">
                    <HugeiconsIcon icon={CallIcon} size={16} strokeWidth={2} className="mr-2 text-gray-400" />
                    <p className="font-medium">{order.customer_phone}</p>
                  </div>
                </div>
                {order.delivery_address && (
                  <div>
                    <p className="text-sm text-gray-600">Alamat Pengiriman</p>
                    <div className="mt-1 flex items-start">
                      <HugeiconsIcon icon={Location01Icon} size={16} strokeWidth={2} className="mr-2 mt-0.5 text-gray-400" />
                      <p className="text-sm">{order.delivery_address}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HugeiconsIcon icon={ShoppingCart01Icon} size={24} strokeWidth={2} className="mr-2" />
                Ringkasan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Item</span>
                  <span className="font-medium">{totalItems}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Jenis Item</span>
                  <span className="font-medium">{order.items.length}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Pembayaran</span>
                    <span className="text-lg font-bold text-green-600">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
