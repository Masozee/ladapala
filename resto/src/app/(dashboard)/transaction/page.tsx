"use client"

import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon, SmartPhone01Icon, DollarCircleIcon, Invoice01Icon, Add01Icon, Remove01Icon, Delete01Icon } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

// Sample active order
const sampleOrder = {
  id: "TRX001",
  tableNumber: 3,
  customerName: "",
  items: [
    { id: 1, name: "Nasi Gudeg Jogja", price: 35000, qty: 2, notes: "Pedas sedang, tambah kerupuk" },
    { id: 2, name: "Es Teh Manis", price: 8000, qty: 2, notes: "" },
    { id: 3, name: "Jus Alpukat", price: 18000, qty: 1, notes: "Tanpa gula tambahan" },
    { id: 4, name: "Soto Betawi", price: 28000, qty: 1, notes: "" },
    { id: 5, name: "Rawon Surabaya", price: 38000, qty: 1, notes: "Extra daging, tanpa tauge" }
  ],
  timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

export default function TransactionPage() {
  const [orderItems, setOrderItems] = useState(sampleOrder.items)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qris">("cash")
  const [cashAmount, setCashAmount] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.qty), 0)
  const tax = Math.round(subtotal * 0.1)
  const total = subtotal + tax

  // Update item quantity
  const updateQuantity = (itemId: number, increment: boolean) => {
    setOrderItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const newQty = increment ? item.qty + 1 : Math.max(1, item.qty - 1)
          return { ...item, qty: newQty }
        }
        return item
      })
    )
  }

  // Remove item
  const removeItem = (itemId: number) => {
    setOrderItems(prevItems => prevItems.filter(item => item.id !== itemId))
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

  // Print receipt function
  const printReceipt = () => {
    const receiptWindow = window.open('', '', 'width=300,height=600')
    if (!receiptWindow) return

    const receiptDate = new Date()
    const receiptTime = receiptDate.toLocaleString('id-ID', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    })

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            padding: 10px;
            margin: 0;
            width: 280px;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
          }
          .header p {
            margin: 2px 0;
            font-size: 11px;
          }
          .info {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .info p {
            margin: 2px 0;
            font-size: 11px;
          }
          .items {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .item {
            margin-bottom: 5px;
          }
          .item-name {
            font-weight: bold;
            font-size: 11px;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            margin-left: 10px;
          }
          .item-notes {
            font-size: 10px;
            margin-left: 10px;
            font-style: italic;
            color: #666;
          }
          .totals {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-size: 11px;
          }
          .total-row.bold {
            font-weight: bold;
            font-size: 13px;
            margin-top: 5px;
          }
          .payment {
            margin-bottom: 10px;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
          }
          .payment p {
            margin: 3px 0;
            font-size: 11px;
          }
          .footer {
            text-align: center;
            margin-top: 10px;
          }
          .footer p {
            margin: 2px 0;
            font-size: 10px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>LADAPALA</h1>
          <p>Restaurant POS System</p>
          <p>Jl. Contoh No. 123</p>
          <p>Tel: (021) 12345678</p>
        </div>
        
        <div class="info">
          <p>No: ${sampleOrder.id}</p>
          <p>Tanggal: ${receiptTime}</p>
          <p>Meja: ${sampleOrder.tableNumber}</p>
          <p>Pelanggan: ${customerName}</p>
          <p>Kasir: Admin</p>
        </div>
        
        <div class="items">
          ${orderItems.map(item => `
            <div class="item">
              <div class="item-name">${item.name}</div>
              <div class="item-details">
                <span>${item.qty} x Rp ${item.price.toLocaleString('id-ID')}</span>
                <span>Rp ${(item.qty * item.price).toLocaleString('id-ID')}</span>
              </div>
              ${item.notes ? `<div class="item-notes">${item.notes}</div>` : ''}
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>Rp ${subtotal.toLocaleString('id-ID')}</span>
          </div>
          <div class="total-row">
            <span>Pajak (10%):</span>
            <span>Rp ${tax.toLocaleString('id-ID')}</span>
          </div>
          <div class="total-row bold">
            <span>TOTAL:</span>
            <span>Rp ${total.toLocaleString('id-ID')}</span>
          </div>
        </div>
        
        <div class="payment">
          <p>Metode: ${paymentMethod === 'cash' ? 'TUNAI' : paymentMethod === 'card' ? 'KARTU' : 'QRIS'}</p>
          ${paymentMethod === 'cash' ? `
            <p>Bayar: Rp ${cashReceived.toLocaleString('id-ID')}</p>
            <p style="font-weight: bold;">Kembali: Rp ${Math.round(change).toLocaleString('id-ID')}</p>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>===========================</p>
          <p>Terima Kasih</p>
          <p>Atas Kunjungan Anda</p>
          <p>===========================</p>
        </div>
      </body>
      </html>
    `

    receiptWindow.document.write(receiptHTML)
    receiptWindow.document.close()
    
    // Wait for content to load then print
    receiptWindow.onload = () => {
      receiptWindow.print()
      receiptWindow.close()
    }
  }

  // Process payment
  const handlePayment = () => {
    if (paymentMethod === "cash" && cashReceived < total) {
      alert("Uang tidak cukup!")
      return
    }

    if (!customerName.trim()) {
      alert("Nama pelanggan harus diisi!")
      return
    }

    // Process the payment
    console.log("Processing payment:", {
      customer: customerName,
      method: paymentMethod,
      total: total,
      cashReceived: paymentMethod === "cash" ? cashReceived : null,
      change: paymentMethod === "cash" ? change : null
    })

    setShowPaymentSuccess(true)
    
    // Print receipt automatically after payment
    printReceipt()
    
    setTimeout(() => {
      // Reset after success
      setOrderItems([])
      setCashAmount("")
      setCustomerName("")
      setShowPaymentSuccess(false)
    }, 3000)
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-6">
        {/* Left Side - Order List */}
        <div className="flex-1 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Kasir</h1>
          <p className="text-sm text-gray-600">
            Meja {sampleOrder.tableNumber} • {sampleOrder.timestamp} • ID: {sampleOrder.id}
          </p>
        </div>

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
              {orderItems.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <HugeiconsIcon icon={Invoice01Icon} size={32} strokeWidth={2} className="mx-auto mb-3 text-gray-300" />
                  <p>Belum ada item</p>
                </div>
              ) : (
                <div className="divide-y">
                  {orderItems.map((item) => (
                    <div key={item.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">
                            @ Rp {item.price.toLocaleString('id-ID')}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-orange-600 mt-1 italic">
                              Catatan: {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, false)}
                              className="h-8 w-8 p-0 rounded"
                            >
                              <HugeiconsIcon icon={Remove01Icon} size={32} strokeWidth={2} />
                            </Button>
                            <span className="font-medium w-8 text-center">{item.qty}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateQuantity(item.id, true)}
                              className="h-8 w-8 p-0 rounded"
                            >
                              <HugeiconsIcon icon={Add01Icon} size={32} strokeWidth={2} />
                            </Button>
                          </div>
                          <div className="w-24 text-right font-semibold">
                            Rp {(item.price * item.qty).toLocaleString('id-ID')}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 p-0 rounded text-red-600 hover:text-red-700"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={32} strokeWidth={2} />
                          </Button>
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

        {/* Process Payment Button */}
        <Button
          onClick={handlePayment}
          disabled={
            orderItems.length === 0 ||
            !customerName.trim() ||
            (paymentMethod === "cash" && cashReceived < total)
          }
          className="w-full h-14 rounded bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
        >
          <HugeiconsIcon icon={Invoice01Icon} size={32} strokeWidth={2} className="mr-2" />
          BAYAR
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
      </div>
    </div>
  )
}