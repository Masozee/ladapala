"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Remove01Icon, CreditCardIcon, Invoice01Icon, Coffee01Icon, Dish01Icon, KitchenUtensilsIcon, Clock01Icon, IceCream01Icon, SparklesIcon, ChefHatIcon, DrinkIcon, Edit01Icon, Delete01Icon, ShoppingBasket01Icon } from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api, type Product, type Category, type Table } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

// Filter categories
const filterCategories = [
  { id: "breakfast", name: "Sarapan", description: "Menu pagi hari", icon: Coffee01Icon, color: "orange" },
  { id: "lunch", name: "Makan Siang", description: "Hidangan utama", icon: KitchenUtensilsIcon, color: "green" },
  { id: "dinner", name: "Makan Malam", description: "Menu malam", icon: Clock01Icon, color: "purple" },
  { id: "soup", name: "Sup", description: "Hidangan berkuah", icon: Dish01Icon, color: "blue" },
  { id: "dessert", name: "Pencuci Mulut", description: "Hidangan penutup", icon: IceCream01Icon, color: "pink" },
  { id: "seasonal", name: "Musiman", description: "Menu spesial", icon: SparklesIcon, color: "yellow" },
  { id: "appetizer", name: "Pembuka", description: "Hidangan pembuka", icon: ChefHatIcon, color: "indigo" },
  { id: "beverage", name: "Minuman", description: "Minuman segar", icon: DrinkIcon, color: "teal" },
]

interface MenuItem extends Product {
  qty: number
  notes: string
}

export default function MenuPage() {
  const router = useRouter()
  const { staff, isLoading: authLoading } = useAuth()
  const [activeFilter, setActiveFilter] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<MenuItem[]>([])
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [customerName, setCustomerName] = useState("")
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKEAWAY'>('DINE_IN')
  const [orderNotes, setOrderNotes] = useState("")

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!authLoading && !staff) {
      router.push('/login')
      return
    }

    if (!staff) return

    fetchData()
  }, [staff, authLoading, router])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch categories
      const categoriesResponse = await api.getCategories()
      setCategories(categoriesResponse.results)

      // Fetch all products
      const productsResponse = await api.getProducts()
      const productsWithQty: MenuItem[] = productsResponse.results.map(p => ({
        ...p,
        qty: 0,
        notes: ''
      }))
      setAllProducts(productsWithQty)

      // Fetch available tables
      const tablesResponse = await api.getTables({ is_available: true })
      setAvailableTables(tablesResponse.results)
    } catch (error) {
      console.error('Error fetching menu data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Map category names to filter IDs for filtering
  const categoryFilterMap: Record<string, string> = {
    'Sarapan & Jajanan Pagi': 'breakfast',
    'Nasi & Makanan Utama': 'lunch',
    'Sup & Berkuah': 'soup',
    'Pembuka & Camilan': 'appetizer',
    'Pencuci Mulut': 'dessert',
    'Minuman': 'beverage',
  }

  // Filter products based on active filter
  const filteredProducts = activeFilter
    ? allProducts.filter(product => categoryFilterMap[product.category_name] === activeFilter)
    : allProducts

  // Group products by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    const categoryName = product.category_name
    if (!acc[categoryName]) {
      acc[categoryName] = []
    }
    acc[categoryName].push(product)
    return acc
  }, {} as Record<string, MenuItem[]>)

  const removeFromCart = (itemId: number) => {
    setAllProducts(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          return { ...item, qty: 0, notes: '' }
        }
        return item
      })
    )
  }

  const updateQuantity = (itemId: number, increment: boolean) => {
    setAllProducts(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          const newQty = increment ? item.qty + 1 : Math.max(0, item.qty - 1)
          return { ...item, qty: newQty }
        }
        return item
      })
    )
  }

  const updateItemNotes = (itemId: number, notes: string) => {
    setAllProducts(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          return { ...item, notes }
        }
        return item
      })
    )
  }

  const getItemQuantity = (itemId: number) => {
    const item = allProducts.find(item => item.id === itemId)
    return item?.qty || 0
  }

  const orderItems = allProducts.filter(item => item.qty > 0)
  const subtotal = orderItems.reduce((total, item) => {
    const price = item.effective_price ? parseFloat(item.effective_price) : parseFloat(item.price)
    return total + (price * item.qty)
  }, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax

  const formatCurrency = (value: number) => {
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`
  }

  const handleProcessOrder = async () => {
    if (orderItems.length === 0) {
      alert("Silakan pilih menu terlebih dahulu")
      return
    }

    if (!customerName.trim()) {
      alert("Silakan masukkan nama pelanggan")
      return
    }

    if (orderType === 'DINE_IN' && !selectedTableId) {
      alert("Silakan pilih meja untuk dine-in")
      return
    }

    try {
      // Create order via API
      const branchId = parseInt(process.env.NEXT_PUBLIC_API_BRANCH_ID || '5')
      const orderData = {
        branch: branchId,
        table: orderType === 'DINE_IN' ? selectedTableId : null,
        order_type: orderType,
        customer_name: customerName,
        customer_phone: '0812345678900',
        notes: orderNotes,
        status: 'CONFIRMED',
        items: orderItems.map(item => ({
          product: item.id,
          quantity: item.qty,
          unit_price: item.effective_price || item.price,
          notes: item.notes || ''
        }))
      }

      console.log('Creating order with data:', orderData)
      console.log('Branch ID from env:', process.env.NEXT_PUBLIC_API_BRANCH_ID)
      await api.createOrder(orderData)

      // Reset everything
      setAllProducts(prevItems => prevItems.map(item => ({ ...item, qty: 0, notes: '' })))
      setSelectedTableId(null)
      setCustomerName("")
      setOrderNotes("")

      // Refresh available tables
      const tablesResponse = await api.getTables({ is_available: true })
      setAvailableTables(tablesResponse.results)

      alert("Pesanan berhasil dibuat!")
    } catch (error) {
      console.error('Error creating order:', error)
      const errorMessage = error instanceof Error ? error.message : "Gagal membuat pesanan. Silakan coba lagi."
      alert(errorMessage)
    }
  }

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

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">Loading menu...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Menu Section - Left Side */}
          <div className="flex-1">
            {/* Filter Categories */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Menu Ladapala</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {filterCategories.map((category) => {
                  const IconComponent = category.icon
                  return (
                    <Card
                      key={category.id}
                      className={`cursor-pointer transition-all rounded-lg shadow-none ${
                        activeFilter === category.id
                          ? "border-2 border-[#58ff34] bg-[#58ff34]"
                          : "border border-gray-200 hover:bg-gray-50 hover:border-[#58ff34]"
                      }`}
                      onClick={() => setActiveFilter(activeFilter === category.id ? "" : category.id)}
                    >
                      <CardContent className="p-2.5">
                        <div className="flex items-center gap-2">
                          <HugeiconsIcon
                            icon={IconComponent}
                            size={20}
                            strokeWidth={2}
                            className={`size-5 ${activeFilter === category.id ? "text-black" : "text-gray-600"}`}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className={`font-semibold text-sm ${
                              activeFilter === category.id ? "text-black" : "text-gray-900"
                            }`}>
                              {category.name}
                            </h3>
                            <p className={`text-xs ${
                              activeFilter === category.id ? "text-black/70" : "text-gray-500"
                            } hidden sm:block`}>
                              {category.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>

            {/* Menu Sections */}
            <div className="space-y-8 pb-6">
              {Object.entries(groupedProducts).map(([categoryName, products]) => (
                <div key={categoryName}>
                  <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">
                    {categoryName}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.filter(p => p.is_available).map((item) => {
                      const quantity = getItemQuantity(item.id)
                      return (
                        <Card key={item.id} className="bg-card text-card-foreground flex flex-col shadow-none overflow-hidden border border-gray-200 hover:border-[#58ff34] transition-all rounded-xl">
                          <div className="relative">
                            <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                              {item.image ? (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                  <HugeiconsIcon icon={KitchenUtensilsIcon} size={48} strokeWidth={2} className="opacity-50 size-12" />
                                </div>
                              )}
                            </div>
                            <Badge
                              variant="secondary"
                              className="absolute top-2 right-2 bg-white/95 text-gray-700 text-[10px] px-2 py-0.5"
                            >
                              {categoryName}
                            </Badge>
                            {/* Seasonal Badge */}
                            {item.is_seasonal && (
                              <Badge className="absolute top-2 left-2 bg-yellow-500 text-white text-[10px] px-2 py-0.5">
                                <HugeiconsIcon icon={SparklesIcon} size={12} strokeWidth={2} className="mr-1 inline" />
                                Musiman
                              </Badge>
                            )}
                            {/* Promo Badge */}
                            {item.is_promo_active && (
                              <Badge className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] px-2 py-0.5 font-bold">
                                {item.promo_label || (item.discount_percentage ? `${parseFloat(item.discount_percentage)}% OFF` : 'PROMO')}
                              </Badge>
                            )}
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-1.5 line-clamp-1 text-sm">
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <div className="flex flex-col">
                                {item.is_promo_active && item.effective_price ? (
                                  <>
                                    <span className="text-base font-bold text-red-600">
                                      {formatCurrency(parseFloat(item.effective_price))}
                                    </span>
                                    <span className="text-xs text-gray-400 line-through">
                                      {formatCurrency(parseFloat(item.price))}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-base font-bold text-black">
                                    {formatCurrency(parseFloat(item.price))}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateQuantity(item.id, false)}
                                  disabled={quantity === 0}
                                  className="h-7 w-7 p-0 rounded border-gray-300"
                                >
                                  <HugeiconsIcon icon={Remove01Icon} size={16} strokeWidth={2} className="size-4" />
                                </Button>
                                <span className="font-medium text-gray-900 min-w-[24px] text-center text-sm">
                                  {quantity}
                                </span>
                                <Button
                                  size="sm"
                                  onClick={() => updateQuantity(item.id, true)}
                                  className="h-7 w-7 p-0 rounded bg-[#58ff34] hover:bg-[#4de82a] text-black"
                                >
                                  <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} className="text-black size-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* POS Order Sidebar - Right Side */}
          <div className="w-96">
            <Card className="flex flex-col">
              <CardHeader className="flex-shrink-0">
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={ShoppingBasket01Icon} className="h-5 w-5" strokeWidth={2} />
                  Keranjang ({orderItems.length})
                </CardTitle>
                <CardDescription>Buat pesanan baru untuk pelanggan</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col space-y-4 p-4">
                {/* Order Type */}
                <div>
                  <Label>Tipe Pesanan</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <Button
                      variant={orderType === 'DINE_IN' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setOrderType('DINE_IN')
                        if (availableTables.length > 0 && !selectedTableId) {
                          setSelectedTableId(availableTables[0].id || null)
                        }
                      }}
                    >
                      Dine In
                    </Button>
                    <Button
                      variant={orderType === 'TAKEAWAY' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setOrderType('TAKEAWAY')
                        setSelectedTableId(null)
                      }}
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
                      value={selectedTableId || ''}
                      onChange={(e) => setSelectedTableId(Number(e.target.value))}
                    >
                      <option value="">Pilih meja...</option>
                      {availableTables.map(table => (
                        <option key={table.id} value={table.id}>
                          Meja {table.number} (Kapasitas: {table.capacity})
                        </option>
                      ))}
                    </select>
                    {availableTables.length === 0 && (
                      <p className="text-xs text-red-500 mt-1">Tidak ada meja tersedia</p>
                    )}
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
                  <Label className="mb-2">Item Pesanan</Label>
                  {orderItems.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <HugeiconsIcon icon={Invoice01Icon} size={48} strokeWidth={2} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">Keranjang masih kosong</p>
                    </div>
                  ) : (
                    <div className="space-y-3 mt-3">
                      {orderItems.map(item => (
                        <div key={item.id} className="p-3 border rounded">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-medium text-sm">{item.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="h-6 w-6 p-0"
                            >
                              <HugeiconsIcon icon={Delete01Icon} className="h-4 w-4" strokeWidth={2} />
                            </Button>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, false)}
                              className="h-6 w-6 p-0"
                            >
                              <HugeiconsIcon icon={Remove01Icon} className="h-3 w-3" strokeWidth={2} />
                            </Button>
                            <span className="text-sm w-8 text-center">{item.qty}</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateQuantity(item.id, true)}
                              className="h-6 w-6 p-0"
                            >
                              <HugeiconsIcon icon={Add01Icon} className="h-3 w-3" strokeWidth={2} />
                            </Button>
                            <span className="text-sm ml-auto">
                              Rp {((item.effective_price ? parseFloat(item.effective_price) : parseFloat(item.price)) * item.qty).toLocaleString('id-ID')}
                            </span>
                          </div>
                          <Input
                            placeholder="Catatan item..."
                            value={item.notes}
                            onChange={(e) => updateItemNotes(item.id, e.target.value)}
                            className="text-xs h-7"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Order Notes */}
                {orderItems.length > 0 && (
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
                )}

                {/* Total & Submit */}
                {orderItems.length > 0 && (
                  <div className="border-t pt-4 space-y-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pajak (10%):</span>
                        <span>{formatCurrency(tax)}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span>Total:</span>
                          <span>{formatCurrency(total)}</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={handleProcessOrder}
                      disabled={!customerName.trim() || (orderType === 'DINE_IN' && !selectedTableId)}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <HugeiconsIcon icon={Invoice01Icon} size={20} strokeWidth={2} className="mr-2" />
                      Proses Pesanan
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </>
  )
}
