"use client"

import { useState, useEffect } from "react"
import { Users, Clock, Receipt, Split, BarChart3, DollarSign, UserPlus, MoreHorizontal, ShoppingCart, CreditCard, Calendar } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"

// Sample table data
const initialTables = [
  {
    id: 1,
    number: 1,
    maxSeats: 4,
    currentGuests: 2,
    description: "Lantai 1, AC, Area Keluarga",
    status: "occupied", // occupied, available, reserved, cleaning
    orders: [
      { id: 1, items: ["Nasi Gudeg Jogja", "Es Teh Manis"], total: 43000, customer: "Budi" },
      { id: 2, items: ["Jus Alpukat"], total: 18000, customer: "Sari" }
    ],
    occupiedTime: "45 menit",
    revenue: 61000
  },
  {
    id: 2,
    number: 2,
    maxSeats: 6,
    currentGuests: 0,
    description: "Lantai 1, AC, Meja Besar",
    status: "available",
    orders: [],
    occupiedTime: null,
    revenue: 0
  },
  {
    id: 3,
    number: 3,
    maxSeats: 2,
    currentGuests: 2,
    description: "Lantai 2, Non-AC, Area Smoking",
    status: "occupied",
    orders: [
      { id: 3, items: ["Nasi Padang Komplit", "Wedang Jahe Merah"], total: 57000, customer: "Andi" }
    ],
    occupiedTime: "20 menit",
    revenue: 57000
  },
  {
    id: 4,
    number: 4,
    maxSeats: 8,
    currentGuests: 0,
    description: "Lantai 1, AC, VVIP Area",
    status: "reserved",
    orders: [],
    occupiedTime: null,
    revenue: 0
  },
  {
    id: 5,
    number: 5,
    maxSeats: 4,
    currentGuests: 0,
    description: "Lantai 2, AC, Dekat Jendela",
    status: "cleaning",
    orders: [],
    occupiedTime: null,
    revenue: 0
  },
  {
    id: 6,
    number: 6,
    maxSeats: 4,
    currentGuests: 4,
    description: "Lantai 1, AC, Area Keluarga",
    status: "occupied",
    orders: [
      { id: 4, items: ["Soto Betawi", "Rawon Surabaya"], total: 66000, customer: "Keluarga Budi" }
    ],
    occupiedTime: "1 jam 15 menit",
    revenue: 66000
  },
  {
    id: 7,
    number: 7,
    maxSeats: 2,
    currentGuests: 0,
    description: "Lantai 2, Non-AC, Area Outdoor",
    status: "available",
    orders: [],
    occupiedTime: null,
    revenue: 0
  },
  {
    id: 8,
    number: 8,
    maxSeats: 6,
    currentGuests: 0,
    description: "Lantai 1, AC, Private Room",
    status: "available",
    orders: [],
    occupiedTime: null,
    revenue: 0
  }
]

export default function TablePage() {
  const [tables] = useState(initialTables)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showSplitBill, setShowSplitBill] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [joinTables, setJoinTables] = useState<number[]>([])
  const [showMoreMenu, setShowMoreMenu] = useState<number | null>(null)
  const [showBooking, setShowBooking] = useState(false)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMoreMenu !== null) {
        const target = event.target as HTMLElement
        if (!target.closest('.more-menu-container')) {
          setShowMoreMenu(null)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMoreMenu])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "occupied": return "bg-red-100 text-red-800 border-red-200"
      case "available": return "bg-green-100 text-green-800 border-green-200"
      case "reserved": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "cleaning": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "occupied": return "Terisi"
      case "available": return "Tersedia"
      case "reserved": return "Reservasi"
      case "cleaning": return "Dibersihkan"
      default: return "Tidak Diketahui"
    }
  }

  const toggleTableJoin = (tableId: number) => {
    if (joinTables.includes(tableId)) {
      setJoinTables(joinTables.filter(id => id !== tableId))
    } else {
      setJoinTables([...joinTables, tableId])
    }
  }

  const handleJoinTables = () => {
    if (joinTables.length < 2) return
    
    // Logic to join tables
    console.log("Joining tables:", joinTables)
    setJoinTables([])
    alert(`Meja ${joinTables.join(", ")} berhasil digabung!`)
  }

  const currentTable = selectedTable ? tables.find(t => t.id === selectedTable) : null

  const getProcessButtonText = (table: typeof initialTables[0]) => {
    if (table.status === "available" || table.status === "cleaning") {
      return "Order"
    } else if (table.status === "occupied") {
      return "Payment"
    } else if (table.status === "reserved") {
      return "Check In"
    }
    return "Process"
  }

  const getProcessButtonIcon = (table: typeof initialTables[0]) => {
    if (table.status === "available" || table.status === "cleaning") {
      return ShoppingCart
    } else if (table.status === "occupied") {
      return CreditCard
    } else if (table.status === "reserved") {
      return Users
    }
    return Receipt
  }

  const handleProcessAction = (table: typeof initialTables[0]) => {
    if (table.status === "available" || table.status === "cleaning") {
      // Redirect to order/menu page with table number
      window.location.href = `/dashboard/menu?table=${table.number}`
    } else if (table.status === "occupied") {
      // Show payment modal
      setSelectedTable(table.id)
      setShowOrderDetails(true) // For now, show order details
    } else if (table.status === "reserved") {
      // Check in the reservation
      console.log("Check in table:", table.number)
      alert(`Meja ${table.number} berhasil di-check in!`)
    }
  }

  // Analytics calculations
  const totalTables = tables.length
  const occupiedTables = tables.filter(t => t.status === "occupied").length
  const availableTables = tables.filter(t => t.status === "available").length
  const totalRevenue = tables.reduce((sum, table) => sum + table.revenue, 0)
  const averageOccupancy = ((occupiedTables / totalTables) * 100).toFixed(1)

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manajemen Meja</h1>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowAnalytics(true)}
            className="rounded"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          {joinTables.length >= 2 && (
            <Button
              onClick={handleJoinTables}
              className="bg-[#58ff34] hover:bg-[#4de82a] rounded-none"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Gabung Meja ({joinTables.length})
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card className="rounded-none border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Meja</p>
                <p className="text-2xl font-bold">{totalTables}</p>
              </div>
              <Users className="h-8 w-8 text-[#58ff34]" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meja Terisi</p>
                <p className="text-2xl font-bold text-red-600">{occupiedTables}</p>
              </div>
              <Users className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Meja Tersedia</p>
                <p className="text-2xl font-bold text-green-600">{availableTables}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-none border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Revenue Hari Ini</p>
                <p className="text-lg font-bold text-[#58ff34]">Rp {totalRevenue.toLocaleString('id-ID')}</p>
              </div>
              <DollarSign className="h-8 w-8 text-[#58ff34]" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((table) => (
          <Card 
            key={table.id} 
            className={`cursor-pointer transition-all rounded-none border-0 ${
              joinTables.includes(table.id) ? "ring-2 ring-[#58ff34] bg-green-50" : ""
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg">Meja {table.number}</CardTitle>
                <Badge 
                  variant="outline" 
                  className={`${getStatusColor(table.status)} rounded-none`}
                >
                  {getStatusText(table.status)}
                </Badge>
              </div>
              <div className="border-b border-gray-200 pb-2 mt-2">
                <p className="text-sm text-gray-600">{table.description}</p>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col h-full pt-3">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{table.currentGuests}/{table.maxSeats}</span>
                  </div>
                  {table.occupiedTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{table.occupiedTime}</span>
                    </div>
                  )}
                </div>

                {table.revenue > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Revenue: </span>
                    <span className="font-semibold text-green-600">
                      Rp {table.revenue.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}

                {table.orders.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <span>{table.orders.length} pesanan aktif</span>
                  </div>
                )}
              </div>

              {/* Fixed Bottom Buttons */}
              <div className="mt-4 flex gap-1 pt-3 border-t border-gray-200">
                <Button
                  size="sm"
                  onClick={() => handleProcessAction(table)}
                  className="flex-[3] rounded text-xs h-8 bg-[#58ff34] hover:bg-[#4de82a] text-white"
                  disabled={table.status === "cleaning"}
                >
                  {(() => {
                    const IconComponent = getProcessButtonIcon(table)
                    return <IconComponent className="h-3 w-3 mr-1" />
                  })()}
                  {getProcessButtonText(table)}
                </Button>
                <div className="relative flex-[2] more-menu-container">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowMoreMenu(showMoreMenu === table.id ? null : table.id)}
                    className="w-full rounded text-xs h-8 border-gray-300"
                    disabled={table.status === "cleaning"}
                  >
                    <MoreHorizontal className="h-3 w-3 mr-1" />
                    More
                  </Button>
                  
                  {/* Dropdown Menu */}
                  {showMoreMenu === table.id && (
                    <div className="absolute bottom-full right-0 mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setSelectedTable(table.id)
                            setShowSplitBill(true)
                            setShowMoreMenu(null)
                          }}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={table.orders.length === 0}
                        >
                          <Split className="h-3.5 w-3.5 mr-2 text-gray-500" />
                          <span>Split Bill</span>
                        </button>
                        <button
                          onClick={() => {
                            toggleTableJoin(table.id)
                            setShowMoreMenu(null)
                          }}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 flex items-center transition-colors"
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-2 text-gray-500" />
                          <span>{joinTables.includes(table.id) ? "Batal Gabung" : "Gabung Meja"}</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTable(table.id)
                            setShowBooking(true)
                            setShowMoreMenu(null)
                          }}
                          className="w-full px-3 py-2 text-xs text-left hover:bg-gray-100 flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={table.status === "occupied"}
                        >
                          <Calendar className="h-3.5 w-3.5 mr-2 text-gray-500" />
                          <span>Booking</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && currentTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Detail Pesanan - Meja {currentTable.number}
            </h3>
            
            <div className="space-y-4 mb-6">
              {currentTable.orders.map((order) => (
                <div key={order.id} className="p-4 bg-gray-50 rounded">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold">{order.customer}</h4>
                    <span className="font-bold text-green-600">
                      Rp {order.total.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {order.items.map((item, index) => (
                      <li key={index}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowOrderDetails(false)}
                className="rounded"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Split Bill Modal */}
      {showSplitBill && currentTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Split Bill - Meja {currentTable.number}
            </h3>
            
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total Bill:</span>
                <span className="text-lg font-bold text-green-600">
                  Rp {currentTable.revenue.toLocaleString('id-ID')}
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Jumlah Orang
                  </label>
                  <Input
                    type="number"
                    placeholder="2"
                    className="w-full rounded-none"
                    min="2"
                    max={currentTable.maxSeats}
                  />
                </div>
                
                <div className="p-3 bg-green-50 rounded">
                  <p className="text-sm text-green-800">
                    <strong>Per orang:</strong> Rp {Math.round(currentTable.revenue / 2).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSplitBill(false)}
                className="flex-1 rounded-none"
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  setShowSplitBill(false)
                  alert("Bill berhasil di-split!")
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-none"
              >
                Split Bill
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Analytics Meja</h3>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Card className="rounded-none border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Tingkat Okupansi</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#58ff34] mb-2">
                    {averageOccupancy}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {occupiedTables} dari {totalTables} meja terisi
                  </div>
                </CardContent>
              </Card>
              
              <Card className="rounded-none border-0">
                <CardHeader>
                  <CardTitle className="text-lg">Revenue per Meja</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    Rp {Math.round(totalRevenue / totalTables).toLocaleString('id-ID')}
                  </div>
                  <div className="text-sm text-gray-600">Rata-rata per meja</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="mb-6">
              <h4 className="font-semibold mb-3">Detail per Meja</h4>
              <div className="space-y-2">
                {tables.map((table) => (
                  <div key={table.id} className="flex justify-between items-center py-2 border-b">
                    <div>
                      <span className="font-medium">Meja {table.number}</span>
                      <span className="ml-2 text-sm text-gray-600">
                        ({table.currentGuests}/{table.maxSeats} kursi)
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge 
                        variant="outline" 
                        className={`${getStatusColor(table.status)} rounded-none`}
                      >
                        {getStatusText(table.status)}
                      </Badge>
                      <span className="font-semibold text-green-600">
                        Rp {table.revenue.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowAnalytics(false)}
                className="rounded"
              >
                Tutup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && currentTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Booking - Meja {currentTable.number}
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nama Pelanggan
                </label>
                <Input
                  type="text"
                  placeholder="Masukkan nama pelanggan"
                  className="w-full rounded-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tanggal & Waktu
                </label>
                <Input
                  type="datetime-local"
                  className="w-full rounded-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Tamu
                </label>
                <Input
                  type="number"
                  placeholder="Jumlah tamu"
                  className="w-full rounded-none"
                  min="1"
                  max={currentTable.maxSeats}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catatan (Opsional)
                </label>
                <Input
                  type="text"
                  placeholder="Catatan khusus"
                  className="w-full rounded-none"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowBooking(false)}
                className="flex-1 rounded-none"
              >
                Batal
              </Button>
              <Button
                onClick={() => {
                  setShowBooking(false)
                  alert("Booking berhasil dibuat!")
                }}
                className="flex-1 bg-green-600 hover:bg-green-700 rounded-none"
              >
                Buat Booking
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}