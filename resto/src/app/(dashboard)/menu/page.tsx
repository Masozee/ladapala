"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Remove01Icon, CreditCardIcon, Invoice01Icon, Coffee01Icon, Dish01Icon, KitchenUtensilsIcon, Clock01Icon, IceCream01Icon, SparklesIcon, ChefHatIcon, DrinkIcon, Edit01Icon } from "@hugeicons/core-free-icons"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { api, type Product, type Category, type Table } from "@/lib/api"

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
  const [activeFilter, setActiveFilter] = useState("")
  const [categories, setCategories] = useState<Category[]>([])
  const [allProducts, setAllProducts] = useState<MenuItem[]>([])
  const [availableTables, setAvailableTables] = useState<Table[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null)
  const [showNotesFor, setShowNotesFor] = useState<number | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [customerName, setCustomerName] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

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
    const price = parseFloat(item.price)
    return total + (price * item.qty)
  }, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax

  const formatCurrency = (value: number) => {
    return `Rp ${Math.round(value).toLocaleString('id-ID')}`
  }

  const handleProcessOrder = () => {
    if (orderItems.length === 0) {
      alert("Silakan pilih menu terlebih dahulu")
      return
    }
    setShowPaymentModal(true)
  }

  const handlePayment = async () => {
    if (!customerName.trim()) {
      alert("Silakan masukkan nama pelanggan")
      return
    }

    try {
      // Create order via API
      const branchId = process.env.NEXT_PUBLIC_API_BRANCH_ID || '5'
      const orderData = {
        branch: parseInt(branchId),
        table: selectedTableId,
        order_type: (selectedTableId ? 'DINE_IN' : 'TAKEAWAY') as 'DINE_IN' | 'TAKEAWAY' | 'DELIVERY',
        customer_name: customerName,
        customer_phone: '0812345678900', // You can add a phone input field
        items: orderItems.map(item => ({
          product: item.id,
          quantity: item.qty,
          unit_price: item.price,
          notes: item.notes || ''
        }))
      }

      console.log('Creating order with data:', orderData)
      await api.createOrder(orderData)

      // Reset everything
      setAllProducts(prevItems => prevItems.map(item => ({ ...item, qty: 0, notes: '' })))
      setSelectedTableId(null)
      setCustomerName("")
      setShowPaymentModal(false)

      // Refresh available tables
      const tablesResponse = await api.getTables({ is_available: true })
      setAvailableTables(tablesResponse.results)

      alert("Pesanan berhasil dibuat!")
    } catch (error) {
      console.error('Error creating order:', error)
      alert("Gagal membuat pesanan. Silakan coba lagi.")
    }
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
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-gray-900 mb-1.5 line-clamp-1 text-sm">
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                              {item.description}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-base font-bold text-black">
                                {formatCurrency(parseFloat(item.price))}
                              </span>
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
          <div className="w-96 bg-white rounded-lg flex flex-col sticky top-8 h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="px-4 py-3 border-b bg-gray-50 flex-shrink-0 rounded-t-lg">
              <h2 className="text-lg font-bold text-gray-900">Pesanan Baru</h2>
            </div>

            {/* Table Info */}
            <div className="p-4 border-b flex-shrink-0">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">
                  Pilih Meja (Opsional)
                </label>
                <select
                  value={selectedTableId || ""}
                  onChange={(e) => setSelectedTableId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full h-9 rounded-none border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#58ff34]"
                >
                  <option value="">Takeaway (Tanpa Meja)</option>
                  {availableTables.map((table) => (
                    <option key={table.id} value={table.id}>
                      Meja {table.number} - Kapasitas {table.capacity} orang
                    </option>
                  ))}
                </select>
                {availableTables.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">Tidak ada meja tersedia</p>
                )}
              </div>
            </div>

            {/* Order Items - Scrollable middle section */}
            <div className="flex-1 overflow-y-auto min-h-0 max-h-96">
              {orderItems.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <HugeiconsIcon icon={Invoice01Icon} size={48} strokeWidth={2} className="mx-auto mb-3 text-gray-300 size-12" />
                  <p>Belum ada menu dipilih</p>
                  <p className="text-sm">Pilih menu dari daftar di sebelah kiri</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {orderItems.map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {item.name}
                          </h4>
                          <p className="text-sm text-gray-500">{formatCurrency(parseFloat(item.price))}</p>
                          {item.notes && (
                            <p className="text-xs text-orange-600 truncate">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, false)}
                            className="h-7 w-7 p-0 rounded-none"
                          >
                            <HugeiconsIcon icon={Remove01Icon} size={16} strokeWidth={2} className="size-4" />
                          </Button>
                          <span className="font-medium text-gray-900 min-w-[20px] text-center">
                            {item.qty}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => updateQuantity(item.id, true)}
                            className="h-7 w-7 p-0 rounded-none"
                          >
                            <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} className="size-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowNotesFor(showNotesFor === item.id ? null : item.id)}
                            className={`h-7 w-7 p-0 ml-2 rounded-none ${
                              item.notes ? "text-orange-600 border-orange-600" : "text-gray-600"
                            }`}
                            title="Tambah catatan"
                          >
                            <HugeiconsIcon icon={Edit01Icon} size={16} strokeWidth={2} className="size-4" />
                          </Button>
                        </div>
                      </div>
                      {showNotesFor === item.id && (
                        <div className="mt-3 pt-3 border-t">
                          <Input
                            type="text"
                            placeholder="Catatan untuk pesanan (mis: extra pedas, tanpa bawang)"
                            value={item.notes}
                            onChange={(e) => updateItemNotes(item.id, e.target.value)}
                            className="w-full h-8 text-sm"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Order Summary & Buttons - Always visible at bottom */}
            {orderItems.length > 0 && (
              <div className="flex-shrink-0 border-t p-3 space-y-3 bg-white">
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

                <div className="space-y-2">
                  <Button
                    onClick={handleProcessOrder}
                    className="w-full bg-green-600 hover:bg-green-700 rounded-none h-10"
                  >
                    <HugeiconsIcon icon={Invoice01Icon} size={20} strokeWidth={2} className="mr-2 size-5" />
                    Proses Pesanan
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAllProducts(prevItems => prevItems.map(item => ({ ...item, qty: 0, notes: '' })))
                      setSelectedTableId(null)
                    }}
                    className="w-full rounded-none h-10"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Pembayaran</h3>

            {/* Order Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded">
              <h4 className="font-semibold text-gray-900 mb-3">Ringkasan Pesanan</h4>
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
            </div>

            {/* Customer Info */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Pelanggan *
              </label>
              <Input
                type="text"
                placeholder="Masukkan nama pelanggan"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full"
                autoFocus
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPaymentModal(false)
                  setCustomerName("")
                }}
                className="flex-1 rounded-none"
              >
                Batal
              </Button>
              <Button
                onClick={handlePayment}
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-none"
                disabled={!customerName.trim()}
              >
                Buat Pesanan
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
