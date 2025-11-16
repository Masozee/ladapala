'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  CheckmarkCircle01Icon,
  Loading03Icon,
  UserIcon,
  Add01Icon,
  Restaurant01Icon,
  ShoppingBasket01Icon,
  Delete01Icon,
  Remove01Icon,
  KitchenUtensilsIcon
} from '@hugeicons/core-free-icons'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api, Order, type Product, type Category, type Table } from '@/lib/api'
import { useAuth } from '@/contexts/auth-context'

interface CartItem {
  product: Product
  quantity: number
  notes: string
}

export default function WaitressPage() {
  const router = useRouter()
  const { staff, isLoading: authLoading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'READY' | 'COMPLETED'>('READY')
  const [activeTab, setActiveTab] = useState<'new' | 'orders'>('new')

  // New Order State
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [tables, setTables] = useState<Table[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN')
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [submittingOrder, setSubmittingOrder] = useState(false)

  const fetchOrders = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true)
      } else {
        setRefreshing(true)
      }

      const response = await api.getOrders({})
      const ordersList = Array.isArray(response) ? response : (response.results || [])
      const waitressOrders = ordersList.filter((order: Order) =>
        ['READY', 'COMPLETED'].includes(order.status || '')
      )

      setOrders(waitressOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !staff) {
      router.push('/login')
      return
    }

    if (!staff) return

    fetchOrders()
    fetchProducts()
    fetchCategories()
    fetchTables()

    const interval = setInterval(() => fetchOrders(true), 30000)
    return () => clearInterval(interval)
  }, [staff, authLoading, router])

  const fetchProducts = async () => {
    try {
      const response = await api.getProducts()
      setProducts(response.results || response)
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await api.getCategories()
      setCategories(response.results || response)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchTables = async () => {
    try {
      const response = await api.getTables()
      setTables(response.results || response)
    } catch (error) {
      console.error('Error fetching tables:', error)
    }
  }

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1, notes: '' }])
    }
  }

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.product.id !== productId))
  }

  const updateCartItemQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
    } else {
      setCart(cart.map(item =>
        item.product.id === productId ? { ...item, quantity } : item
      ))
    }
  }

  const updateCartItemNotes = (productId: number, notes: string) => {
    setCart(cart.map(item =>
      item.product.id === productId ? { ...item, notes } : item
    ))
  }

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (parseFloat(item.product.price.toString()) * item.quantity), 0)
  }

  const handleSubmitOrder = async () => {
    if (cart.length === 0) {
      alert('Keranjang masih kosong!')
      return
    }

    if (orderType === 'DINE_IN' && !selectedTable) {
      alert('Pilih meja untuk dine-in!')
      return
    }

    if (!customerName.trim()) {
      alert('Masukkan nama pelanggan!')
      return
    }

    try {
      setSubmittingOrder(true)

      const orderData = {
        branch: 1,
        order_type: orderType,
        table: orderType === 'DINE_IN' ? selectedTable : null,
        customer_name: customerName,
        customer_phone: '0812345678900',
        notes: orderNotes,
        status: 'CONFIRMED',
        items: cart.map(item => ({
          product: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price.toString(),
          notes: item.notes
        }))
      }

      await api.createOrder(orderData)
      alert('Pesanan berhasil dibuat!')

      setCart([])
      setCustomerName('')
      setOrderNotes('')
      setSelectedTable(null)
      setActiveTab('orders')
      fetchOrders(true)
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Gagal membuat pesanan: ' + (error as Error).message)
    } finally {
      setSubmittingOrder(false)
    }
  }

  const handleMarkAsServed = async (orderId: number) => {
    try {
      await api.updateOrderStatus(orderId, 'COMPLETED')
      await fetchOrders(true)
    } catch (error) {
      console.error('Error marking order as served:', error)
      alert('Gagal mengubah status pesanan')
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'READY': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'READY': return 'Siap Diantar'
      case 'COMPLETED': return 'Sudah Diantar'
      default: return status
    }
  }

  const readyOrders = orders.filter(o => o.status === 'READY')
  const completedOrders = orders.filter(o => o.status === 'COMPLETED')
  const filteredProducts = selectedCategory
    ? products.filter(p => p.category === selectedCategory && p.is_available)
    : products.filter(p => p.is_available)

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

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-[#58ff34]/20 rounded-lg">
              <HugeiconsIcon icon={UserIcon} className="h-8 w-8 text-[#58ff34]" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Waitress System</h1>
              <p className="text-muted-foreground">Buat pesanan baru dan kelola pesanan siap diantar</p>
            </div>
          </div>
          <Button onClick={() => fetchOrders(true)} variant="outline" className="gap-2" disabled={refreshing}>
            <HugeiconsIcon icon={Loading03Icon} className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} strokeWidth={2} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'new' | 'orders')}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="new" className="gap-2">
              <HugeiconsIcon icon={Add01Icon} className="h-4 w-4" strokeWidth={2} />
              Buat Pesanan Baru
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <HugeiconsIcon icon={Restaurant01Icon} className="h-4 w-4" strokeWidth={2} />
              Daftar Pesanan ({orders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Menu Selection */}
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Pilih Menu</CardTitle>
                    <CardDescription>Pilih produk untuk ditambahkan ke pesanan</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Category Filter */}
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                      <Button
                        variant={selectedCategory === null ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedCategory(null)}
                      >
                        Semua
                      </Button>
                      {categories.map(cat => (
                        <Button
                          key={cat.id}
                          variant={selectedCategory === cat.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedCategory(cat.id || null)}
                        >
                          {cat.name}
                        </Button>
                      ))}
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {filteredProducts.map(product => (
                        <div
                          key={product.id}
                          className="bg-white rounded-lg border border-gray-200 hover:border-[#58ff34] cursor-pointer transition-all overflow-hidden"
                          onClick={() => addToCart(product)}
                        >
                          {/* Product Image */}
                          <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                            {product.image ? (
                              <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 50vw, 33vw"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                <HugeiconsIcon icon={KitchenUtensilsIcon} size={48} strokeWidth={2} className="opacity-50" />
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="p-3">
                            <h4 className="font-semibold text-sm text-gray-900 mb-1 line-clamp-1">
                              {product.name}
                            </h4>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {product.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-black">
                                Rp {parseFloat(product.price.toString()).toLocaleString('id-ID')}
                              </span>
                              <Button
                                size="sm"
                                className="h-7 w-7 p-0 rounded bg-[#58ff34] hover:bg-[#4de82a] text-black"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  addToCart(product)
                                }}
                              >
                                <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} className="text-black" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right: Cart and Order Details */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HugeiconsIcon icon={ShoppingBasket01Icon} className="h-5 w-5" strokeWidth={2} />
                      Keranjang ({cart.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Order Type */}
                    <div>
                      <Label>Tipe Pesanan</Label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <Button
                          variant={orderType === 'DINE_IN' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setOrderType('DINE_IN')}
                        >
                          Dine In
                        </Button>
                        <Button
                          variant={orderType === 'TAKEAWAY' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setOrderType('TAKEAWAY')}
                        >
                          Bungkus
                        </Button>
                      </div>
                    </div>

                    {/* Table Selection */}
                    {orderType === 'DINE_IN' && (
                      <div>
                        <Label>Pilih Meja</Label>
                        <select
                          className="w-full mt-2 p-2 border rounded"
                          value={selectedTable || ''}
                          onChange={(e) => setSelectedTable(Number(e.target.value))}
                        >
                          <option value="">Pilih meja...</option>
                          {tables.filter(t => t.is_available).map(table => (
                            <option key={table.id} value={table.id}>
                              Meja {table.number} (Kapasitas: {table.capacity})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Customer Name */}
                    <div>
                      <Label>Nama Pelanggan</Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Masukkan nama..."
                        className="mt-2"
                      />
                    </div>

                    {/* Cart Items */}
                    <div className="border-t pt-4">
                      <Label className="mb-2 block">Item Pesanan</Label>
                      {cart.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">Keranjang masih kosong</p>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {cart.map(item => (
                            <div key={item.product.id} className="p-3 border rounded">
                              <div className="flex justify-between items-start mb-2">
                                <span className="font-medium text-sm">{item.product.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFromCart(item.product.id!)}
                                  className="h-6 w-6 p-0"
                                >
                                  <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" strokeWidth={2} />
                                </Button>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateCartItemQuantity(item.product.id!, item.quantity - 1)}
                                  className="h-6 w-6 p-0"
                                >
                                  <HugeiconsIcon icon={Remove01Icon} className="h-3 w-3" strokeWidth={2} />
                                </Button>
                                <span className="text-sm w-8 text-center">{item.quantity}</span>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateCartItemQuantity(item.product.id!, item.quantity + 1)}
                                  className="h-6 w-6 p-0"
                                >
                                  <HugeiconsIcon icon={Add01Icon} className="h-3 w-3" strokeWidth={2} />
                                </Button>
                                <span className="text-sm ml-auto">
                                  Rp {(parseFloat(item.product.price.toString()) * item.quantity).toLocaleString('id-ID')}
                                </span>
                              </div>
                              <Input
                                placeholder="Catatan item..."
                                value={item.notes}
                                onChange={(e) => updateCartItemNotes(item.product.id!, e.target.value)}
                                className="text-xs h-7"
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Order Notes */}
                    <div>
                      <Label>Catatan Pesanan (Optional)</Label>
                      <Textarea
                        value={orderNotes}
                        onChange={(e) => setOrderNotes(e.target.value)}
                        placeholder="Catatan tambahan..."
                        rows={2}
                        className="mt-2"
                      />
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold">Total:</span>
                        <span className="text-xl font-bold">
                          Rp {calculateTotal().toLocaleString('id-ID')}
                        </span>
                      </div>

                      <Button
                        onClick={handleSubmitOrder}
                        disabled={cart.length === 0 || submittingOrder || !customerName.trim() || (orderType === 'DINE_IN' && !selectedTable)}
                        className="w-full"
                      >
                        {submittingOrder ? 'Memproses...' : 'Buat Pesanan'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Siap Diantar</p>
                      <p className="text-3xl font-bold">{readyOrders.length}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sudah Diantar</p>
                      <p className="text-3xl font-bold">{completedOrders.length}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex gap-2 border-b">
                <button
                  onClick={() => setFilter('READY')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    filter === 'READY' ? 'border-black text-black' : 'border-transparent text-gray-600'
                  }`}
                >
                  Siap Diantar ({readyOrders.length})
                </button>
                <button
                  onClick={() => setFilter('COMPLETED')}
                  className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                    filter === 'COMPLETED' ? 'border-black text-black' : 'border-transparent text-gray-600'
                  }`}
                >
                  Sudah Diantar ({completedOrders.length})
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <HugeiconsIcon icon={Loading03Icon} className="h-12 w-12 text-gray-400 animate-spin" strokeWidth={2} />
                </div>
              ) : orders.filter(o => o.status === filter).length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <HugeiconsIcon icon={UserIcon} className="h-16 w-16 text-gray-300 mx-auto mb-3" strokeWidth={2} />
                    <p className="text-xl font-medium text-muted-foreground">Tidak ada pesanan</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {orders.filter(o => o.status === filter).map((order) => (
                    <Card key={order.id} className="border">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{order.order_number}</CardTitle>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
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
                        <div className="space-y-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <div className="flex-1">
                                <span className="font-medium">{item.quantity}x</span>
                                <span className="ml-2">{item.product_name}</span>
                                {item.notes && (
                                  <p className="text-xs text-muted-foreground ml-6 italic">
                                    Catatan: {item.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {order.notes && (
                          <div className="pt-2 border-t">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Catatan:</p>
                            <p className="text-sm italic">{order.notes}</p>
                          </div>
                        )}
                        <div className="pt-2">
                          {order.status === 'READY' && (
                            <Button onClick={() => handleMarkAsServed(order.id!)} className="w-full gap-2">
                              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="h-4 w-4" strokeWidth={2} />
                              Sudah Diantar
                            </Button>
                          )}
                          {order.status === 'COMPLETED' && (
                            <div className="text-center py-2 bg-gray-50 rounded border">
                              <p className="text-sm font-medium text-gray-700">Pesanan sudah diantar</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
