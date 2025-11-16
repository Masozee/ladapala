"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { CreditCardIcon, SmartPhone01Icon, DollarCircleIcon, Invoice01Icon, Add01Icon, Remove01Icon, Delete01Icon, MoreVerticalIcon } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { api, type Order } from "@/lib/api"
import { Receipt, type ReceiptData } from "@/components/receipt"
import { useAuth } from "@/contexts/auth-context"

export default function TransactionPage() {
  const router = useRouter()
  const { staff, isLoading: authLoading } = useAuth()
  const [activeTab, setActiveTab] = useState("payment")
  const [pendingOrders, setPendingOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "qris">("cash")
  const [cashAmount, setCashAmount] = useState("")
  const [customerName, setCustomerName] = useState("")
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
  const [shouldPrint, setShouldPrint] = useState(false)
  const [printReceipts, setPrintReceipts] = useState(true) // Default to true
  const [hasActiveSession, setHasActiveSession] = useState(true) // Track if cashier has active session

  // Transaction list state
  const [transactions, setTransactions] = useState<any[]>([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)

  // Void transaction state
  const [showVoidDialog, setShowVoidDialog] = useState(false)
  const [showManagerAuth, setShowManagerAuth] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<any>(null)
  const [voidReason, setVoidReason] = useState("")
  const [managerEmail, setManagerEmail] = useState("")
  const [managerPassword, setManagerPassword] = useState("")
  const [isVoiding, setIsVoiding] = useState(false)

  // Member lookup state
  const [showMemberLookup, setShowMemberLookup] = useState(false)
  const [memberPhone, setMemberPhone] = useState("")
  const [memberData, setMemberData] = useState<any>(null)
  const [memberSearchError, setMemberSearchError] = useState("")
  const [isSearchingMember, setIsSearchingMember] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !staff) {
      router.push('/login')
      return
    }

    if (!staff) return

    // Fetch restaurant settings
    const fetchSettings = async () => {
      try {
        const settings = await api.getCurrentSettings()
        setPrintReceipts(settings.print_receipts)
      } catch (error) {
        console.error('Failed to fetch settings:', error)
        // Keep default value (true)
      }
    }
    fetchSettings()

    // Check if cashier has active session
    const checkCashierSession = async () => {
      if (staff?.role === 'CASHIER') {
        try {
          const sessions = await api.getActiveCashierSession()
          setHasActiveSession(sessions.length > 0)
        } catch (error) {
          console.error('Failed to check cashier session:', error)
          setHasActiveSession(false)
        }
      }
    }
    checkCashierSession()

    // Initial fetch with loading state
    fetchPendingOrders(false)

    // Auto-refresh every 10 seconds in background without disrupting UI
    const interval = setInterval(() => {
      fetchPendingOrders(true)
    }, 10000)

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staff, authLoading, router])

  const fetchPendingOrders = async (keepSelection = true) => {
    try {
      // Only show loading on initial fetch, not during auto-refresh
      if (!keepSelection) {
        setLoading(true)
      }
      console.log('Fetching active orders...')
      // Fetch all active orders (CONFIRMED, PREPARING, READY, COMPLETED)
      const response = await api.getOrders({})
      console.log('Orders received:', response)

      // Filter to show only active orders (not CANCELLED)
      // COMPLETED means food delivered to customer, waiting for payment
      // Exclude orders that already have COMPLETED payments
      // Only show TODAY's orders (filter out old orders from previous days)
      const today = new Date().toDateString()
      const activeOrders = response.results.filter(order => {
        const hasActiveStatus = order.status && ['CONFIRMED', 'PREPARING', 'READY', 'COMPLETED'].includes(order.status)
        const hasCompletedPayment = order.payments && order.payments.some((p: unknown) => (p as { status: string }).status === 'COMPLETED')
        const orderDate = new Date(order.created_at!).toDateString()
        const isToday = orderDate === today
        return hasActiveStatus && !hasCompletedPayment && isToday
      })
      setPendingOrders(activeOrders)

      // Check if current selected order is still active
      if (selectedOrder) {
        const updatedOrder = activeOrders.find(o => o.id === selectedOrder.id)
        if (updatedOrder) {
          // Update selected order with fresh data
          setSelectedOrder(updatedOrder)
        } else {
          // Current order is no longer active (completed/cancelled), clear it
          console.log('Current order is no longer active, clearing selection')
          setSelectedOrder(null)
          setCustomerName("")
        }
      }

      // Auto-select first COMPLETED order if available (delivered, waiting payment), otherwise READY, then first order
      // Only auto-select if no order is currently selected
      if (!selectedOrder) {
        const firstCompletedOrder = activeOrders.find(o => o.status === 'COMPLETED')
        const firstReadyOrder = activeOrders.find(o => o.status === 'READY')
        const orderToSelect = firstCompletedOrder || firstReadyOrder || activeOrders[0]

        if (orderToSelect) {
          console.log('Auto-selecting order:', orderToSelect)
          setSelectedOrder(orderToSelect)
          setCustomerName(orderToSelect.customer_name)
        }
      }
    } catch (error: any) {
      console.error('Error fetching active orders:', error)

      // Check if it's an authentication error
      if (error?.message?.includes('logged in') || error?.message?.includes('authentication')) {
        console.log('Authentication error detected, redirecting to login...')
        router.push('/login')
        return
      }

      if (!keepSelection) {
        alert('Gagal memuat pesanan aktif: ' + (error as Error).message)
      }
    } finally {
      if (!keepSelection) {
        setLoading(false)
      }
    }
  }

  // Fetch transactions when switching to transactions tab
  useEffect(() => {
    if (activeTab === 'history') {
      fetchTransactions()
    }
  }, [activeTab])

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true)
      const url = `${process.env.NEXT_PUBLIC_API_URL}/payments/today/`
      const response = await fetch(url, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setTransactions(data || [])
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoadingTransactions(false)
    }
  }

  const handleVoidClick = (payment: any) => {
    setSelectedPayment(payment)
    setShowManagerAuth(true)
  }

  const handleManagerAuthSubmit = async () => {
    try {
      const response = await api.login(managerEmail, managerPassword)
      if (response.staff?.role && ['MANAGER', 'ADMIN'].includes(response.staff.role)) {
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
      fetchTransactions()
      fetchPendingOrders()
    } catch (error: any) {
      console.error('Void error:', error)
      alert("Gagal void pembayaran: " + (error?.message || "Unknown error"))
    } finally {
      setIsVoiding(false)
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

  // Member lookup handlers
  const handleMemberSearch = async () => {
    if (!memberPhone.trim()) {
      setMemberSearchError("Masukkan nomor telepon")
      return
    }

    try {
      setIsSearchingMember(true)
      setMemberSearchError("")
      const customer = await api.lookupCustomer(memberPhone)
      setMemberData(customer)
      setMemberSearchError("")
    } catch (error: any) {
      if (error.message?.includes('not found')) {
        setMemberSearchError("Member tidak ditemukan")
        setShowRegisterForm(true)
      } else {
        setMemberSearchError("Gagal mencari member: " + error.message)
      }
      setMemberData(null)
    } finally {
      setIsSearchingMember(false)
    }
  }

  const handleQuickRegister = async () => {
    if (!memberPhone.trim() || !registerName.trim()) {
      alert("Nomor telepon dan nama harus diisi!")
      return
    }

    try {
      const customer = await api.quickRegisterCustomer({
        phone_number: memberPhone,
        name: registerName,
        email: registerEmail
      })
      setMemberData(customer)
      setShowRegisterForm(false)
      setRegisterName("")
      setRegisterEmail("")
      alert(`Member baru terdaftar! Membership: ${customer.membership_number}`)
    } catch (error: any) {
      alert("Gagal mendaftar: " + error.message)
    }
  }

  const handleLinkMember = async () => {
    if (!selectedOrder || !selectedOrder.id || !memberData) return

    try {
      await api.linkCustomerToOrder(selectedOrder.id, memberData.id)
      setShowMemberLookup(false)
      alert(`Member ${memberData.name} berhasil ditautkan ke pesanan ini`)
      // Refresh order to get updated customer info
      fetchPendingOrders(true)
    } catch (error: any) {
      alert("Gagal menautkan member: " + error.message)
    }
  }

  const calculatePointsToEarn = () => {
    if (!memberData) return 0
    // Get tier multiplier (default to 1.0 for BRONZE)
    const multipliers: Record<string, number> = {
      'BRONZE': 1.0,
      'SILVER': 1.2,
      'GOLD': 1.5,
      'PLATINUM': 2.0
    }
    const multiplier = multipliers[memberData.membership_tier] || 1.0
    return Math.floor((total * multiplier) / 1000)
  }

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

    // Check if cashier has active session
    if (staff?.role === 'CASHIER' && !hasActiveSession) {
      alert("Anda harus membuka sesi kasir terlebih dahulu!\n\nSilakan buka sesi kasir di menu Session > Open Session.")
      return
    }

    try {
      // Create payment via API
      // Backend automatically updates order status when payment is COMPLETED
      // Map QRIS to MOBILE for backend
      const backendPaymentMethod = paymentMethod === 'qris' ? 'MOBILE' : paymentMethod.toUpperCase()
      await api.createPayment({
        order: selectedOrder.id!,
        amount: total.toString(),
        payment_method: backendPaymentMethod as 'CASH' | 'CARD' | 'MOBILE',
        status: 'COMPLETED'
      })

      // Prepare and trigger receipt printing (if enabled in settings)
      if (printReceipts) {
        const receipt = prepareReceiptData()
        if (receipt) {
          setReceiptData(receipt)
          setShouldPrint(true)
        }
      }

      // Show success message briefly
      setShowPaymentSuccess(true)

      // Immediately refresh the order list to remove completed order
      await fetchPendingOrders(false)

      // Reset form after a short delay
      setTimeout(() => {
        setCashAmount("")
        setCustomerName("")
        setShowPaymentSuccess(false)
        setShouldPrint(false)
        setReceiptData(null)
      }, 2000)
    } catch (error: any) {
      console.error('Payment error:', error)

      // Handle cashier session error specifically
      if (error?.error === 'Kasir harus membuka sesi kasir terlebih dahulu') {
        alert("⚠️ SESI KASIR BELUM DIBUKA\n\n" + error.detail)
        setHasActiveSession(false)
        return
      }

      // Generic error message
      const errorMsg = error?.detail || error?.message || "Gagal memproses pembayaran. Silakan coba lagi."
      alert(errorMsg)
    }
  }

  // Check if order has completed payment (can be voided)
  const hasCompletedPayment = selectedOrder?.payments?.some((p: any) => p.status === 'COMPLETED')
  const canVoid = hasCompletedPayment && staff?.role && ['MANAGER', 'ADMIN'].includes(staff.role)

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Memeriksa autentikasi...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show nothing (will redirect)
  if (!staff) {
    return null
  }

  return loading ? (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Memuat pesanan aktif...</p>
      </div>
    </div>
  ) : (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Transaksi</h1>

        {/* Cashier Session Warning */}
        {staff?.role === 'CASHIER' && !hasActiveSession && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-1">⚠️ Sesi Kasir Belum Dibuka</h3>
                <p className="text-sm text-red-700 mb-3">
                  Anda harus membuka sesi kasir terlebih dahulu sebelum dapat memproses pembayaran.
                </p>
                <Button
                  onClick={() => window.location.href = '/session/open'}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  size="sm"
                >
                  Buka Sesi Kasir Sekarang
                </Button>
              </div>
            </div>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="payment">Pembayaran</TabsTrigger>
            <TabsTrigger value="history">Riwayat Transaksi</TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="mt-6">
            <div className="flex gap-6">
              {/* Left Side - Order List */}
              <div className="flex-1 flex flex-col">
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">Daftar Pesanan</h2>
                    <Button
                      onClick={() => fetchPendingOrders(true)}
                      variant="outline"
                      size="sm"
                      className="rounded-lg"
                    >
                      Refresh
                    </Button>
                  </div>
          {selectedOrder && (
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm text-gray-600">
                {selectedOrder.table_number ? `Meja ${selectedOrder.table_number}` : 'Takeaway'} • ID: {selectedOrder.order_number}
              </p>
              <span className={`text-xs px-2 py-1 rounded-full ${
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
              className="w-full p-2 border border-gray-300 rounded-lg"
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
            className="rounded-lg"
          />
        </div>

        {/* Member Benefits Section */}
        {!showMemberLookup && !selectedOrder?.customer_info && (
          <div className="mb-4">
            <Button
              onClick={() => setShowMemberLookup(true)}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Tambah Member (Earn Points)
            </Button>
          </div>
        )}

        {/* Member Linked Info */}
        {selectedOrder?.customer_info && (
          <Card className="mb-4 bg-green-50 border-green-200 shadow-none">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Member: {selectedOrder.customer_info.name}
                  </p>
                  <p className="text-xs text-green-700">
                    {selectedOrder.customer_info.membership_tier} • {selectedOrder.customer_info.points_balance} pts
                  </p>
                </div>
                <Badge className="bg-green-600">
                  +{(() => {
                    const multipliers: Record<string, number> = { 'BRONZE': 1.0, 'SILVER': 1.2, 'GOLD': 1.5, 'PLATINUM': 2.0 }
                    const multiplier = multipliers[selectedOrder.customer_info.membership_tier] || 1.0
                    return Math.floor((total * multiplier) / 1000)
                  })()} pts
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Member Lookup Card */}
        {showMemberLookup && (
          <Card className="mb-4 border-blue-200 shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Member Lookup</h3>
                <Button
                  onClick={() => {
                    setShowMemberLookup(false)
                    setMemberData(null)
                    setMemberPhone("")
                    setMemberSearchError("")
                    setShowRegisterForm(false)
                  }}
                  variant="ghost"
                  size="sm"
                >
                  X
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="08123456789"
                    value={memberPhone}
                    onChange={(e) => setMemberPhone(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleMemberSearch()}
                    className="rounded-lg"
                  />
                  <Button
                    onClick={handleMemberSearch}
                    disabled={isSearchingMember}
                  >
                    {isSearchingMember ? 'Cari...' : 'Cari'}
                  </Button>
                </div>

                {memberSearchError && (
                  <p className="text-sm text-red-600">{memberSearchError}</p>
                )}

                {memberData && (
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="font-semibold text-blue-900">{memberData.name}</p>
                    <p className="text-sm text-blue-700">
                      {memberData.membership_tier} • {memberData.points_balance} points
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Member sejak: {new Date(memberData.join_date).toLocaleDateString('id-ID')}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="text-sm font-semibold text-green-700">
                        Akan dapat: {calculatePointsToEarn()} points
                      </p>
                      <Button
                        onClick={handleLinkMember}
                        size="sm"
                        className="bg-blue-600"
                      >
                        Link ke Pesanan
                      </Button>
                    </div>
                  </div>
                )}

                {showRegisterForm && (
                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-sm font-semibold text-yellow-900 mb-2">
                      Daftar Member Baru
                    </p>
                    <div className="space-y-2">
                      <Input
                        type="text"
                        placeholder="Nama Lengkap"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        className="rounded-lg"
                      />
                      <Input
                        type="email"
                        placeholder="Email (opsional)"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        className="rounded-lg"
                      />
                      <Button
                        onClick={handleQuickRegister}
                        size="sm"
                        className="w-full bg-yellow-600"
                      >
                        Daftar Sekarang
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Items */}
        <Card className="flex-1 rounded-lg overflow-hidden border shadow-none">
          <CardHeader className="pb-3 bg-gray-50">
            <CardTitle className="text-lg">Daftar Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-hidden">
            <div className="overflow-y-auto h-full">
              {pendingOrders.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <HugeiconsIcon icon={Invoice01Icon} size={48} strokeWidth={2} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-lg font-medium">Tidak ada pesanan aktif</p>
                  <p className="text-sm mt-2">Pesanan baru akan muncul di sini</p>
                </div>
              ) : !selectedOrder || selectedOrder.items.length === 0 ? (
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
        <Card className="mt-4 rounded-lg border shadow-none">
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
        <div className="w-[450px] bg-white rounded-lg p-6 flex flex-col">
        {/* Payment Methods */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-3">Metode Pembayaran</h3>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant={paymentMethod === "cash" ? "default" : "outline"}
              onClick={() => setPaymentMethod("cash")}
              className="flex flex-col items-center p-3 h-auto rounded-lg"
            >
              <HugeiconsIcon icon={DollarCircleIcon} size={32} strokeWidth={2} className="mb-1" />
              <span className="text-xs">Tunai</span>
            </Button>
            <Button
              variant={paymentMethod === "card" ? "default" : "outline"}
              onClick={() => setPaymentMethod("card")}
              className="flex flex-col items-center p-3 h-auto rounded-lg"
            >
              <HugeiconsIcon icon={CreditCardIcon} size={32} strokeWidth={2} className="mb-1" />
              <span className="text-xs">Kartu</span>
            </Button>
            <Button
              variant={paymentMethod === "qris" ? "default" : "outline"}
              onClick={() => setPaymentMethod("qris")}
              className="flex flex-col items-center p-3 h-auto rounded-lg"
            >
              <HugeiconsIcon icon={SmartPhone01Icon} size={32} strokeWidth={2} className="mb-1" />
              <span className="text-xs">QRIS</span>
            </Button>
          </div>
        </div>

        {paymentMethod === "cash" && (
          <>
            {/* Cash Amount Display */}
            <Card className="mb-4 rounded-lg border shadow-none">
              <CardContent className="p-4">
                <div className="mb-2">
                  <label className="text-sm text-gray-600">Uang Diterima:</label>
                  <div className="text-2xl font-bold text-[#58ff34]">
                    Rp {cashAmount ? parseInt(cashAmount).toLocaleString('id-ID') : '0'}
                  </div>
                </div>
                {cashReceived >= total && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
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
                  className="rounded-lg text-sm py-3"
                >
                  100.000
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickCash(50000)}
                  className="rounded-lg text-sm py-3"
                >
                  50.000
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickCash(20000)}
                  className="rounded-lg text-sm py-3"
                >
                  20.000
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleQuickCash(10000)}
                  className="rounded-lg text-sm py-3"
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
                  className="h-14 rounded-lg text-lg font-semibold"
                >
                  {num}
                </Button>
              ))}
              <Button
                variant="outline"
                onClick={() => handleNumberPad('0')}
                className="h-14 rounded-lg text-lg font-semibold"
              >
                0
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNumberPad('00')}
                className="h-14 rounded-lg text-lg font-semibold"
              >
                00
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNumberPad('000')}
                className="h-14 rounded-lg text-lg font-semibold"
              >
                000
              </Button>
            </div>

            {/* Clear and Delete */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <Button
                variant="outline"
                onClick={() => handleNumberPad('C')}
                className="rounded-lg bg-red-50 hover:bg-red-100 text-red-600"
              >
                Clear
              </Button>
              <Button
                variant="outline"
                onClick={() => handleNumberPad('DEL')}
                className="rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-600"
              >
                Delete
              </Button>
            </div>
          </>
        )}

        {paymentMethod === "card" && (
          <Card className="mb-4 rounded-lg border flex-1 shadow-none">
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
          <Card className="mb-4 rounded-lg border flex-1 shadow-none">
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
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
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
                    await fetchPendingOrders(true)
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
                    await fetchPendingOrders(true)
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
                    await fetchPendingOrders(true)
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
        <div className="space-y-2">
          <Button
            onClick={handlePayment}
            disabled={
              !selectedOrder ||
              selectedOrder.items.length === 0 ||
              !customerName.trim() ||
              (paymentMethod === "cash" && cashReceived < total) ||
              selectedOrder.status !== 'COMPLETED' ||
              (staff?.role === 'CASHIER' && !hasActiveSession)
            }
            className="w-full h-14 rounded-lg bg-green-600 hover:bg-green-700 text-white text-lg font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <HugeiconsIcon icon={Invoice01Icon} size={32} strokeWidth={2} className="mr-2" />
            {staff?.role === 'CASHIER' && !hasActiveSession
              ? 'BUKA SESI KASIR DAHULU'
              : selectedOrder && selectedOrder.status === 'COMPLETED' ? 'BAYAR' : 'BELUM DIANTAR'}
          </Button>

          {/* Void Payment Button - Only for MANAGER/ADMIN */}
          {canVoid && (
            <Button
              onClick={() => setShowVoidDialog(true)}
              variant="outline"
              className="w-full border-red-600 text-red-600 hover:bg-red-50"
            >
              <HugeiconsIcon icon={Delete01Icon} size={20} strokeWidth={2} className="mr-2" />
              Void Pembayaran
            </Button>
          )}
        </div>
          </div>

      {/* Success Modal */}
      {showPaymentSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg border text-center">
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
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <Card className="shadow-none">
              <CardHeader>
                <CardTitle>Daftar Transaksi Hari Ini</CardTitle>
                <CardDescription>Menampilkan semua transaksi hari ini dari semua sesi</CardDescription>
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
                          <TableHead className="text-center">Waktu</TableHead>
                          <TableHead className="text-center">ID Transaksi</TableHead>
                          <TableHead className="text-center">No. Pesanan</TableHead>
                          <TableHead className="text-center">Jumlah</TableHead>
                          <TableHead className="text-center">Metode</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-center">Kasir</TableHead>
                          <TableHead className="text-center">Sesi</TableHead>
                          <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                              Belum ada transaksi
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((payment) => (
                            <TableRow key={payment.id}>
                              <TableCell className="text-sm text-center">
                                {new Date(payment.created_at).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-center">
                                {payment.transaction_id}
                              </TableCell>
                              <TableCell className="font-medium text-center">
                                {payment.order_number || '-'}
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                Rp {parseFloat(payment.amount).toLocaleString('id-ID')}
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">{payment.payment_method}</Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant={
                                  payment.status === 'COMPLETED' ? 'default' :
                                  payment.status === 'REFUNDED' ? 'destructive' :
                                  'secondary'
                                }>
                                  {payment.status === 'REFUNDED' ? 'VOID' : payment.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm text-center">
                                {payment.processed_by_name || '-'}
                              </TableCell>
                              <TableCell className="text-sm text-center">
                                {payment.cashier_session ? (
                                  <Badge variant="secondary" className="font-normal">
                                    {payment.cashier_session.shift_type}
                                  </Badge>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
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
      </div>

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
                className="rounded-lg"
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
                className="rounded-lg"
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

      {/* Void Payment Dialog */}
      <Dialog open={showVoidDialog} onOpenChange={setShowVoidDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ Void Pembayaran</DialogTitle>
            <DialogDescription>
              Tindakan ini akan membatalkan pembayaran yang sudah dilakukan. Pesanan akan kembali ke status menunggu pembayaran.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedOrder && (
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">No. Pesanan:</span>
                  <span className="font-semibold">{selectedOrder.order_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">Rp {total.toLocaleString('id-ID')}</span>
                </div>
                {selectedOrder.payments && selectedOrder.payments.length > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Metode:</span>
                    <span className="font-semibold">
                      {selectedOrder.payments.find((p: any) => p.status === 'COMPLETED')?.payment_method}
                    </span>
                  </div>
                )}
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
