"use client"

import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon, SmartPhone01Icon, DollarCircleIcon, Invoice01Icon, Add01Icon, Remove01Icon, Delete01Icon } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api, type Order } from "@/lib/api"
import { Receipt, type ReceiptData } from "@/components/receipt"

export default function TransactionPage() {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qris">("cash")
  const [cashAmount, setCashAmount] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [shouldPrint, setShouldPrint] = useState(false)

  useEffect(() => {
    fetchPendingOrders()

    // Auto-refresh every 10 seconds to show latest orders
    const interval = setInterval(() => {
      fetchPendingOrders()
    }, 10000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchPendingOrders = async () => {
    try {
      setLoading(true)
      console.log('Fetching active orders...')
      // Fetch all active orders (CONFIRMED, PREPARING, READY, COMPLETED)
      const response = await api.getOrders({})
      console.log('Orders received:', response)

      // Filter to show only active orders (not CANCELLED)
      // COMPLETED means food delivered to customer, waiting for payment
      const activeOrders = response.results.filter(
        order => ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].includes(order.status)
      )
      setPendingOrders(activeOrders)

      // Check if current selected order is still active
      if (selectedOrder) {
        const stillActive = activeOrders.find(o => o.id === selectedOrder.id)
        if (!stillActive) {
          // Current order is no longer active (completed/cancelled), clear it
          console.log('Current order is no longer active, clearing selection')
          setSelectedOrder(null)
          setCustomerName("")
        }
      }

      // Auto-select first COMPLETED order if available (delivered, waiting payment), otherwise READY, then first order
      // Only auto-select if no order is currently selected
      if (!selectedOrder || activeOrders.findIndex(o => o.id === selectedOrder.id) === -1) {
        const firstCompletedOrder = activeOrders.find(o => o.status === 'COMPLETED')
        const firstReadyOrder = activeOrders.find(o => o.status === 'READY')
        const orderToSelect = firstCompletedOrder || firstReadyOrder || activeOrders[0]

        if (orderToSelect) {
          console.log('Auto-selecting order:', orderToSelect)
          setSelectedOrder(orderToSelect)
          setCustomerName(orderToSelect.customer_name)
        }
      }
    } catch (error) {
      console.error('Error fetching active orders:', error)
      alert('Gagal memuat pesanan aktif: ' + (error as Error).message)
    } finally {
      setLoading(false)
    }
  }

  // Calculate totals from selected order
  const subtotal = selectedOrder
    ? selectedOrder.items.reduce((sum, item) => sum + (parseFloat(item.unit_price) * item.quantity), 0)
    : 0
  const tax = Math.round(subtotal * 0.1)
  const total = subtotal + tax

  // Update item quantity
  const updateQuantity = (itemId: number, increment: boolean) => {
    if (!selectedOrder) return

    setSelectedOrder({
      ...selectedOrder,
      items: selectedOrder.items.map(item => {
        if (item.id === itemId) {
          const newQty = increment ? item.quantity + 1 : Math.max(1, item.quantity - 1)
          return { ...item, quantity: newQty }
        }
        return item
      })
    })
  }

  // Remove item
  const removeItem = (itemId: number) => {
    if (!selectedOrder) return

    setSelectedOrder({
      ...selectedOrder,
      items: selectedOrder.items.filter(item => item.id !== itemId)
    })
  }

  // Handle number pad input
  const handleNumberPad = (value: string) => {
    if (value === 'C') {
      setCashAmount("")
    } else if (value === 'DEL') {
      setCashAmount(prev => prev.slice(0, -1))
    } else if (value === '00') {
      setCashAmount(prev => prev + '00')
    } else {
      setCashAmount(prev => prev + value)
    }
  }

  // Handle quick cash amounts
  const handleQuickCash = (amount: number) => {
    const currentAmount = parseFloat(cashAmount) || 0
    setCashAmount((currentAmount + amount).toString())
  }

  // Calculate change
  const cashReceived = parseFloat(cashAmount) || 0
  const change = cashReceived - total

  // Prepare receipt data for printing
  const prepareReceiptData = (): ReceiptData | null => {
    if (!selectedOrder) return null

    return {
      order_number: selectedOrder.order_number || '',
      table_number: selectedOrder.table_number,
      customer_name: customerName,
      items: selectedOrder.items,
      subtotal: subtotal,
      tax: tax,
      total: total,
      payment_method: paymentMethod,
      cash_received: paymentMethod === 'cash' ? cashReceived : undefined,
      change: paymentMethod === 'cash' ? change : undefined,
    }
  }

  // Process payment
  const handlePayment = async () => {
    if (!selectedOrder) {
      alert("Tidak ada pesanan dipilih!")
      return
    }

    if (paymentMethod === "cash" && cashReceived < total) {
      alert("Uang tidak cukup!")
      return
    }

    if (!customerName.trim()) {
      alert("Nama pelanggan harus diisi!")
      return
    }

    try {
      // Create payment via API
      await api.createPayment({
        order: selectedOrder.id!,
        amount: total.toString(),
        payment_method: paymentMethod.toUpperCase() as 'CASH' | 'CARD' | 'MOBILE',
        status: 'COMPLETED'
      })

      // Update order status to COMPLETED after successful payment
      await api.updateOrderStatus(selectedOrder.id!, 'COMPLETED')

      // Prepare and trigger receipt printing
      const receipt = prepareReceiptData()
      if (receipt) {
        setReceiptData(receipt)
        setShouldPrint(true)
      }

      // Show success message briefly
      setShowPaymentSuccess(true)

      // Immediately refresh the order list to remove completed order
      await fetchPendingOrders()

      // Reset form after a short delay
      setTimeout(() => {
        setCashAmount("")
        setCustomerName("")
        setShowPaymentSuccess(false)
        setShouldPrint(false)
        setReceiptData(null)
      }, 2000)
    } catch (error) {
      console.error('Payment error:', error)
      alert("Gagal memproses pembayaran. Silakan coba lagi.")
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Memuat pesanan aktif...</p>
        </div>
      </div>
    )
  }

  if (pendingOrders.length === 0) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <HugeiconsIcon icon={Invoice01Icon} size={64} strokeWidth={2} className="mx-auto mb-4 text-gray-300" />
            <p className="text-xl text-gray-600">Tidak ada pesanan aktif</p>
            <p className="text-sm text-gray-500 mt-2">Pesanan baru akan muncul di sini</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-6">
        {/* Left Side - Order List */}
        <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Kasir</h1>
            <Button
              onClick={fetchPendingOrders}
              variant="outline"
              size="sm"
              className="rounded"
              disabled={loading}
            >
              {loading ? "Memuat..." : "Refresh"}
            </Button>
          </div>
          {selectedOrder && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-600">
                {selectedOrder.table_number ? `Meja ${selectedOrder.table_number}` : 'Takeaway'} • ID: {selectedOrder.order_number}
              </p>
              <span className={`text-xs px-2 py-1 rounded ${
                selectedOrder.status === 'COMPLETED'
                  ? 'bg-green-100 text-green-700'
                  : selectedOrder.status === 'READY'
                  ? 'bg-yellow-100 text-yellow-700'
                  : selectedOrder.status === 'PREPARING'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {selectedOrder.status === 'COMPLETED' ? 'SUDAH DIANTAR' :
                 selectedOrder.status === 'READY' ? 'SIAP DIANTAR' :
                 selectedOrder.status === 'PREPARING' ? 'SEDANG DIMASAK' : 'DIKONFIRMASI'}
              </span>
            </div>
          )}
        </div>

        {/* Order Selection */}
        {pendingOrders.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pilih Pesanan ({pendingOrders.filter(o => o.status === 'READY').length} siap bayar):
            </label>
            <select
              className="w-full p-2 border border-gray-300 rounded"
              value={selectedOrder?.id}
              onChange={(e) => {
                const order = pendingOrders.find(o => o.id === parseInt(e.target.value))
                if (order) {
                  setSelectedOrder(order)
                  setCustomerName(order.customer_name)
                }
              }}
            >
              {pendingOrders.map(order => {
                const statusLabel =
                  order.status === 'COMPLETED' ? '✓ SUDAH DIANTAR - SIAP BAYAR' :
                  order.status === 'READY' ? '🍽️ SIAP DIANTAR' :
                  order.status === 'PREPARING' ? '⏳ SEDANG DIMASAK' :
                  '📋 DIKONFIRMASI'
                return (
                  <option key={order.id} value={order.id}>
                    {statusLabel} - {order.table_number ? `Meja ${order.table_number}` : 'Takeaway'} - {order.order_number}
                  </option>
                )
              })}
            </select>
          </div>
        )}

        {/* Customer Name */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Nama Pelanggan"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="rounded-none"
          />
        </div>

        {/* Order Items */}
        <Card className="flex-1 rounded-lg overflow-hidden border-0">
          <CardHeader className="pb-3 bg-gray-50">
            <CardTitle className="text-lg">Daftar Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="overflow-y-auto h-full">
              {!selectedOrder || selectedOrder.items.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <HugeiconsIcon icon={Invoice01Icon} size={32} strokeWidth={2} className="mx-auto mb-3 text-gray-300" />
                  <p>Belum ada item</p>
                </div>
              ) : (
                <div className="divide-y">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.product_name}</h4>
                          <p className="text-sm text-gray-600">
                            @ Rp {parseFloat(item.unit_price).toLocaleString('id-ID')}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-orange-600 mt-1 italic">
                              Catatan: {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium w-12 text-center">x{item.quantity}</span>
                          <div className="w-24 text-right font-semibold">
                            Rp {(parseFloat(item.unit_price) * item.quantity).toLocaleString('id-ID')}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <Card className="mt-4 rounded-lg border-0">
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Pajak (10%):</span>
                <span>Rp {tax.toLocaleString('id-ID')}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-[#58ff34]">Rp {total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>

        {/* Right Side - Payment Module */}
        <div className="w-[450px] bg-white rounded-lg shadow-sm p-6 flex flex-col">
        {/* Payment Methods */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3">Metode Pembayaran</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={paymentMethod === "cash" ? "default" : "outline"}
              onClick={() => setPaymentMethod("cash")}
              className="flex flex-col items-center p-3 h-auto rounded-none"
            >
              <HugeiconsIcon icon={DollarCircleIcon} size={32} strokeWidth={2} className="mb-1" />
              <span className="text-xs">Tunai</span>
            </Button>
            <Button
              variant={paymentMethod === "card" ? "default" : "outline"}
              onClick={() => setPaymentMethod("card")}
              className="flex flex-col items-center p-3 h-auto rounded-none"
            >
              <HugeiconsIcon icon={CreditCardIcon} size={32} strokeWidth={2} className="mb-1" />
              <span className="text-xs">Kartu</span>
            </Button>
            <Button
              variant={paymentMethod === "qris" ? "default" : "outline"}
              onClick={() => setPaymentMethod("qris")}
              className="flex flex-col items-center p-3 h-auto rounded-none"
            >
              <HugeiconsIcon icon={SmartPhone01Icon} size={32} strokeWidth={2} className="mb-1" />
              <span className="text-xs">QRIS</span>
            </Button>
          </div>
        </div>

        {paymentMethod === "cash" && (
          <>
            {/* Cash Amount Display */}
            <Card className="mb-4 rounded-lg border-0">
              <CardContent className="p-4">
                <div className="mb-2">
                  <label className="text-sm text-gray-600">Uang Diterima:</label>
                  <div className="text-2xl font-bold text-[#58ff34]">
                    Rp {cashAmount ? parseInt(cashAmount).toLocaleString('id-ID') : '0'}
                  </div>
                </div>
                {cashReceived >= total && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200">
                    <div className="text-sm text-green-800">
                      <strong>Kembalian:</strong>
                      <div className="text-xl font-bold">
                        Rp {Math.round(change).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Cash Amounts */}
            <div className="mb-4">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleQuickCash(100000)}
                  className="rounded text-sm py-3"
                >
                  100.000
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickCash(50000)}
                  className="rounded text-sm py-3"
                >
                  50.000
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickCash(20000)}
                  className="rounded text-sm py-3"
                >
                  20.000
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickCash(10000)}
                  className="rounded text-sm py-3"
                >
                  10.000
                </Button>
              </div>
            </div>

            {/* Number Pad */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[7, 8, 9, 4, 5, 6, 1, 2, 3].map(num => (
                <Button
                  key={num}
                  variant="outline"
                  onClick={() => handleNumberPad(num.toString())}
                  className="h-14 rounded-none text-lg font-semibold"
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => handleNumberPad('0')}
                className="h-14 rounded-none text-lg font-semibold"
              >
                0
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNumberPad('00')}
                className="h-14 rounded-none text-lg font-semibold"
              >
                00
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNumberPad('000')}
                className="h-14 rounded-none text-lg font-semibold"
              >
                000
              </Button>
            </div>

            {/* Clear and Delete */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                variant="outline"
                onClick={() => handleNumberPad('C')}
                className="rounded bg-red-50 hover:bg-red-100 text-red-600"
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNumberPad('DEL')}
                className="rounded bg-orange-50 hover:bg-orange-100 text-orange-600"
              >
                Delete
              </Button>
            </div>
          </>
        )}

        {paymentMethod === "card" && (
          <Card className="mb-4 rounded-lg border-0 flex-1">
            <CardContent className="p-4">
              <div className="h-full flex flex-col items-center justify-center text-center">
                <HugeiconsIcon icon={CreditCardIcon} size={32} strokeWidth={2} className="text-[#58ff34] mb-4" />
                <p className="text-lg font-semibold mb-2">Pembayaran Kartu</p>
                <p className="text-sm text-gray-600">
                  Silakan gesek/tap kartu pada mesin EDC
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Total: <strong>Rp {total.toLocaleString('id-ID')}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {paymentMethod === "qris" && (
          <Card className="mb-4 rounded-lg border-0 flex-1">
            <CardContent className="p-4">
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="w-40 h-40 bg-white border-2 border-dashed border-purple-300 mb-4 flex items-center justify-center">
                  <span className="text-purple-600">QR Code</span>
                </div>
                <p className="text-lg font-semibold mb-2">QRIS Payment</p>
                <p className="text-sm text-gray-600">
                  Scan dengan aplikasi e-wallet
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  Total: <strong>Rp {total.toLocaleString('id-ID')}</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Warning for orders not yet delivered */}
        {selectedOrder && selectedOrder.status !== 'COMPLETED' && (
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded">
            <p className="text-sm text-orange-800 mb-3">
              <strong>⚠️ Pesanan belum diantar ke pelanggan</strong>
              <br />
              Status: {selectedOrder.status === 'READY' ? 'Siap diantar' :
                       selectedOrder.status === 'PREPARING' ? 'Sedang dimasak' : 'Dikonfirmasi'}
            </p>
            {selectedOrder.status === 'READY' && (
              <Button
                onClick={async () => {
                  if (!selectedOrder) return
                  try {
                    await api.updateOrderStatus(selectedOrder.id!, 'COMPLETED')
                    await fetchPendingOrders()
                    alert('Status: Pesanan sudah diantar ke pelanggan')
                  } catch (error) {
                    console.error('Error updating status:', error)
                    alert('Gagal mengubah status pesanan')
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="sm"
              >
                Tandai Sudah Diantar
              </Button>
            )}
            {selectedOrder.status === 'PREPARING' && (
              <Button
                onClick={async () => {
                  if (!selectedOrder) return
                  try {
                    await api.updateOrderStatus(selectedOrder.id!, 'READY')
                    await fetchPendingOrders()
                    alert('Status: Pesanan siap diantar')
                  } catch (error) {
                    console.error('Error updating status:', error)
                    alert('Gagal mengubah status pesanan')
                  }
                }}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                size="sm"
              >
                Tandai Siap Diantar
              </Button>
            )}
            {selectedOrder.status === 'CONFIRMED' && (
              <Button
                onClick={async () => {
                  if (!selectedOrder) return
                  try {
                    await api.updateOrderStatus(selectedOrder.id!, 'PREPARING')
                    await fetchPendingOrders()
                    alert('Status: Pesanan mulai dimasak')
                  } catch (error) {
                    console.error('Error updating status:', error)
                    alert('Gagal mengubah status pesanan')
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                Mulai Masak
              </Button>
            )}
          </div>
        )}

        {/* Process Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={
            !selectedOrder ||
            selectedOrder.items.length === 0 ||
            !customerName.trim() ||
            (paymentMethod === "cash" && cashReceived < total) ||
            selectedOrder.status !== 'COMPLETED'
          }
          className="w-full h-14 rounded bg-green-600 hover:bg-green-700 text-white text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <HugeiconsIcon icon={Invoice01Icon} size={32} strokeWidth={2} className="mr-2" />
          {selectedOrder && selectedOrder.status === 'COMPLETED' ? 'BAYAR' : 'BELUM DIANTAR'}
        </Button>
          </div>

      {/* Success Modal */}
      {showPaymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-xl text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HugeiconsIcon icon={Invoice01Icon} size={32} strokeWidth={2} className="text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Berhasil!</h3>
            {paymentMethod === "cash" && change > 0 && (
              <p className="text-lg text-gray-600">
                Kembalian: <strong>Rp {Math.round(change).toLocaleString('id-ID')}</strong>
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">Mencetak struk...</p>
          </div>
        </div>
      )}

      {/* Receipt Component for Auto-Printing */}
      {receiptData && shouldPrint && (
        <Receipt
          data={receiptData}
          autoPrint={true}
          onPrintComplete={() => {
            console.log('Receipt printed successfully')
          }}
        />
      )}
      </div>
    </div>
  )
}
