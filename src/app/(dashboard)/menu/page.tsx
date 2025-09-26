"use client"

import { useState } from "react"
import Image from "next/image"
import { Plus, Minus, Trash2, User, CreditCard, Receipt, Coffee, Soup, Utensils, Clock, IceCream, Sparkles, ChefHat, Wine, Edit3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

// Filter categories
const filterCategories = [
  { id: "breakfast", name: "Sarapan", description: "Menu pagi hari", icon: Coffee, color: "orange" },
  { id: "lunch", name: "Makan Siang", description: "Hidangan utama", icon: Utensils, color: "green" },
  { id: "dinner", name: "Makan Malam", description: "Menu malam", icon: Clock, color: "purple" },
  { id: "soup", name: "Sup", description: "Hidangan berkuah", icon: Soup, color: "blue" },
  { id: "dessert", name: "Pencuci Mulut", description: "Hidangan penutup", icon: IceCream, color: "pink" },
  { id: "seasonal", name: "Musiman", description: "Menu spesial", icon: Sparkles, color: "yellow" },
  { id: "appetizer", name: "Pembuka", description: "Hidangan pembuka", icon: ChefHat, color: "indigo" },
  { id: "beverage", name: "Minuman", description: "Minuman segar", icon: Wine, color: "teal" },
]

// Sample menu data organized by categories
const menuData = {
  "Nasi & Makanan Utama": [
    {
      id: 1,
      name: "Nasi Gudeg Jogja",
      description: "Nasi dengan gudeg khas Jogja, ayam kampung, telur, dan sambal krecek",
      price: "Rp 35.000",
      image: "/api/placeholder/300/200",
      category: "lunch",
      qty: 0,
      notes: ""
    },
    {
      id: 2,
      name: "Nasi Padang Komplit",
      description: "Nasi dengan rendang daging, ayam pop, gulai tunjang, dan sambal hijau",
      price: "Rp 45.000",
      image: "/api/placeholder/300/200",
      category: "lunch",
      qty: 0,
      notes: ""
    },
    {
      id: 3,
      name: "Nasi Liwet Solo",
      description: "Nasi liwet dengan ayam kampung, telur puyuh, tahu, dan sambal krecek",
      price: "Rp 32.000",
      image: "/api/placeholder/300/200",
      category: "dinner",
      qty: 0,
      notes: ""
    }
  ],
  "Sarapan & Jajanan Pagi": [
    {
      id: 4,
      name: "Bubur Ayam Betawi",
      description: "Bubur ayam dengan suwiran ayam, kerupuk, bawang goreng, dan sambal",
      price: "Rp 18.000",
      image: "/api/placeholder/300/200",
      category: "breakfast",
      qty: 0,
      notes: ""
    },
    {
      id: 5,
      name: "Lontong Sayur Jakarta",
      description: "Lontong dengan sayur labu siam, tahu goreng, tempe, dan bumbu kelapa",
      price: "Rp 15.000",
      image: "/api/placeholder/300/200",
      category: "breakfast",
      qty: 0,
      notes: ""
    },
    {
      id: 6,
      name: "Soto Betawi",
      description: "Soto dengan daging sapi, jeroan, kentang, tomat dan santan",
      price: "Rp 28.000",
      image: "/api/placeholder/300/200",
      category: "soup",
      qty: 0,
      notes: ""
    }
  ],
  "Sup & Berkuah": [
    {
      id: 7,
      name: "Sop Buntut Bakar",
      description: "Sup buntut sapi dengan kentang, wortel, daun bawang, dan kerupuk",
      price: "Rp 55.000",
      image: "/api/placeholder/300/200",
      category: "soup",
      qty: 0,
      notes: ""
    },
    {
      id: 8,
      name: "Rawon Surabaya",
      description: "Rawon dengan daging sapi empuk, tauge, telur asin, dan kerupuk",
      price: "Rp 38.000",
      image: "/api/placeholder/300/200",
      category: "soup",
      qty: 0,
      notes: ""
    }
  ],
  "Pembuka & Camilan": [
    {
      id: 9,
      name: "Gado-gado Jakarta",
      description: "Sayuran segar dengan bumbu kacang, kerupuk, dan lontong",
      price: "Rp 22.000",
      image: "/api/placeholder/300/200",
      category: "appetizer",
      qty: 0,
      notes: ""
    },
    {
      id: 10,
      name: "Ketoprak Betawi",
      description: "Tahu, lontong, tauge dengan bumbu kacang dan kerupuk",
      price: "Rp 18.000",
      image: "/api/placeholder/300/200",
      category: "appetizer",
      qty: 0,
      notes: ""
    }
  ],
  "Pencuci Mulut": [
    {
      id: 11,
      name: "Es Cendol Durian",
      description: "Es cendol dengan santan, gula merah, dan durian segar",
      price: "Rp 20.000",
      image: "/api/placeholder/300/200",
      category: "dessert",
      qty: 0,
      notes: ""
    },
    {
      id: 12,
      name: "Klepon Pandan",
      description: "Klepon pandan isi gula merah dengan kelapa parut (5 pcs)",
      price: "Rp 15.000",
      image: "/api/placeholder/300/200",
      category: "dessert",
      qty: 0,
      notes: ""
    }
  ],
  "Minuman": [
    {
      id: 13,
      name: "Es Teh Manis Jogja",
      description: "Teh manis dingin khas Jogja dengan gula batu",
      price: "Rp 8.000",
      image: "/api/placeholder/300/200",
      category: "beverage",
      qty: 0,
      notes: ""
    },
    {
      id: 14,
      name: "Jus Alpukat Segar",
      description: "Jus alpukat murni dengan susu kental manis",
      price: "Rp 18.000",
      image: "/api/placeholder/300/200",
      category: "beverage",
      qty: 0,
      notes: ""
    },
    {
      id: 15,
      name: "Wedang Jahe Merah",
      description: "Minuman hangat jahe merah dengan gula aren",
      price: "Rp 12.000",
      image: "/api/placeholder/300/200",
      category: "beverage",
      qty: 0,
      notes: ""
    }
  ]
}

export default function MenuPage() {
  const [activeFilter, setActiveFilter] = useState("")
  const [menuItems, setMenuItems] = useState(() => {
    const allItems: any[] = []
    Object.values(menuData).forEach(categoryItems => {
      allItems.push(...categoryItems)
    })
    return allItems
  })
  const [tableNumber, setTableNumber] = useState("")
  const [showNotesFor, setShowNotesFor] = useState<number | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [customerName, setCustomerName] = useState("")

  // Filter menu items based on selected category
  const filteredMenuData = Object.entries(menuData).reduce((acc, [categoryName, items]) => {
    const filteredItems = activeFilter === "" ? items : items.filter(item => item.category === activeFilter)
    if (filteredItems.length > 0) {
      acc[categoryName] = filteredItems
    }
    return acc
  }, {} as typeof menuData)

  const updateQuantity = (itemId: number, increment: boolean) => {
    setMenuItems(prevItems =>
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
    setMenuItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          return { ...item, notes }
        }
        return item
      })
    )
  }

  const removeItem = (itemId: number) => {
    setMenuItems(prevItems =>
      prevItems.map(item => {
        if (item.id === itemId) {
          return { ...item, qty: 0 }
        }
        return item
      })
    )
  }

  const getItemQuantity = (itemId: number) => {
    const item = menuItems.find(item => item.id === itemId)
    return item?.qty || 0
  }

  const orderItems = menuItems.filter(item => item.qty > 0)
  const subtotal = orderItems.reduce((total, item) => {
    const price = parseFloat(item.price.replace('Rp ', '').replace('.', ''))
    return total + (price * item.qty)
  }, 0)
  const tax = subtotal * 0.1 // 10% tax
  const total = subtotal + tax

  const handleProcessOrder = () => {
    if (orderItems.length === 0) {
      alert("Silakan pilih menu terlebih dahulu")
      return
    }
    setShowPaymentModal(true)
  }

  const handlePayment = () => {
    if (!customerName.trim()) {
      alert("Silakan masukkan nama pelanggan")
      return
    }
    
    // Process the order
    console.log("Processing order:", {
      customerName,
      tableNumber,
      items: orderItems,
      subtotal,
      tax,
      total
    })
    
    // Reset everything
    setMenuItems(prevItems => prevItems.map(item => ({ ...item, qty: 0 })))
    setTableNumber("")
    setCustomerName("")
    setShowPaymentModal(false)
    
    alert("Pembayaran berhasil diproses!")
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Menu Section - Left Side */}
          <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
      {/* Filter Categories */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Kategori Menu</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {filterCategories.map((category) => {
            const IconComponent = category.icon
            return (
              <Card
                key={category.id}
                className={`cursor-pointer transition-all hover:shadow-md rounded-none ${
                  activeFilter === category.id
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => setActiveFilter(activeFilter === category.id ? "" : category.id)}
              >
                <CardContent className="p-2.5">
                  <div className="flex items-center gap-2">
                    <div className={`inline-flex items-center justify-center w-7 h-7 rounded ${
                      activeFilter === category.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                      <IconComponent className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium text-xs ${
                        activeFilter === category.id ? "text-blue-900" : "text-gray-900"
                      }`}>
                        {category.name}
                      </h3>
                      <p className={`text-[10px] ${
                        activeFilter === category.id ? "text-blue-700" : "text-gray-500"
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
        {Object.entries(filteredMenuData).map(([categoryName, items]) => (
          <div key={categoryName}>
            <h3 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-2">
              {categoryName}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item) => {
                const quantity = getItemQuantity(item.id)
                return (
                  <Card key={item.id} className="overflow-hidden hover:shadow-md transition-all rounded-lg border-gray-200">
                    <div className="relative">
                      <div className="aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 relative">
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                          <Utensils className="h-12 w-12 opacity-50" />
                        </div>
                      </div>
                      <Badge 
                        variant="secondary" 
                        className="absolute top-2 right-2 bg-white/95 text-gray-700 text-[10px] px-2 py-0.5"
                      >
                        {filterCategories.find(cat => cat.id === item.category)?.name}
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
                        <span className="text-base font-bold text-blue-600">
                          {item.price}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, false)}
                            disabled={quantity === 0}
                            className="h-7 w-7 p-0 rounded border-gray-300"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-medium text-gray-900 min-w-[24px] text-center text-sm">
                            {quantity}
                          </span>
                          <Button
                            size="sm"
                            onClick={() => updateQuantity(item.id, true)}
                            className="h-7 w-7 p-0 rounded bg-blue-600 hover:bg-blue-700"
                          >
                            <Plus className="h-3 w-3" />
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
          <div className="w-96 bg-white rounded-lg shadow-sm flex flex-col sticky top-8 h-[calc(100vh-8rem)]">
        {/* Header */}
        <div className="px-4 py-3 border-b bg-gray-50 flex-shrink-0 rounded-t-lg">
          <h2 className="text-lg font-bold text-gray-900">Pesanan Baru</h2>
        </div>

        {/* Table Info */}
        <div className="p-4 border-b flex-shrink-0">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">
              No. Meja (Opsional)
            </label>
            <Input
              type="text"
              placeholder="No. meja"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full h-9 rounded-none"
            />
          </div>
        </div>

        {/* Order Items - Scrollable middle section */}
        <div className="flex-1 overflow-y-auto min-h-0 max-h-96">
          {orderItems.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Receipt className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>Belum ada menu dipilih</p>
              <p className="text-sm">Pilih menu dari daftar di sebelah kiri</p>
            </div>
          ) : (
            <div className="p-3 space-y-2">
              {orderItems.map((item) => (
                <div key={item.id} className="p-3 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowNotesFor(showNotesFor === item.id ? null : item.id)}
                        className={`h-6 w-6 p-0 rounded-none ${
                          item.notes ? "text-orange-600" : "text-gray-400"
                        }`}
                        title="Tambah catatan"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.name}
                        </h4>
                        <p className="text-sm text-gray-500">{item.price}</p>
                        {item.notes && (
                          <p className="text-xs text-orange-600 truncate">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateQuantity(item.id, false)}
                        className="h-7 w-7 p-0 rounded-none"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-medium text-gray-900 min-w-[20px] text-center">
                        {item.qty}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => updateQuantity(item.id, true)}
                        className="h-7 w-7 p-0 rounded-none"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeItem(item.id)}
                        className="h-7 w-7 p-0 ml-2 text-red-600 hover:text-red-700 rounded-none"
                      >
                        <Trash2 className="h-3 w-3" />
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
                <span>Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Pajak (10%):</span>
                <span>Rp {tax.toLocaleString('id-ID')}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total:</span>
                  <span>Rp {Math.round(total).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                onClick={handleProcessOrder}
                className="w-full bg-green-600 hover:bg-green-700 rounded-none h-10"
              >
                <Receipt className="h-4 w-4 mr-2" />
                Proses Pesanan
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setMenuItems(prevItems => prevItems.map(item => ({ ...item, qty: 0 })))
                  setTableNumber("")
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
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pajak (10%):</span>
                  <span>Rp {tax.toLocaleString('id-ID')}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total:</span>
                    <span>Rp {Math.round(total).toLocaleString('id-ID')}</span>
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
            
            {/* Payment Methods */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-none">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Tunai
                </Button>
                <Button variant="outline" className="rounded-none">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Kartu
                </Button>
              </div>
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
                Bayar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}