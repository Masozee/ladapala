"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Download, 
  Upload,
  Package,
  AlertTriangle,
  TrendingDown,
  Edit,
  Trash2
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface StockItem {
  id: string
  name: string
  category: string
  unit: string
  quantity: number
  minimumStock: number
  price: number
  lastUpdated: string
  status: "normal" | "low" | "out"
}

const mockStockItems: StockItem[] = [
  {
    id: "1",
    name: "Beras Jasmine",
    category: "Bahan Pokok",
    unit: "kg",
    quantity: 150,
    minimumStock: 50,
    price: 15000,
    lastUpdated: "2024-01-15",
    status: "normal"
  },
  {
    id: "2",
    name: "Minyak Goreng",
    category: "Bahan Pokok",
    unit: "liter",
    quantity: 25,
    minimumStock: 30,
    price: 18000,
    lastUpdated: "2024-01-14",
    status: "low"
  },
  {
    id: "3",
    name: "Ayam Potong",
    category: "Daging",
    unit: "kg",
    quantity: 0,
    minimumStock: 20,
    price: 35000,
    lastUpdated: "2024-01-15",
    status: "out"
  },
  {
    id: "4",
    name: "Cabai Merah",
    category: "Sayuran",
    unit: "kg",
    quantity: 8,
    minimumStock: 10,
    price: 45000,
    lastUpdated: "2024-01-15",
    status: "low"
  },
  {
    id: "5",
    name: "Garam",
    category: "Bumbu",
    unit: "kg",
    quantity: 50,
    minimumStock: 10,
    price: 5000,
    lastUpdated: "2024-01-13",
    status: "normal"
  }
]

export default function StockPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [stockItems] = useState<StockItem[]>(mockStockItems)
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null)

  const categories = ["all", "Bahan Pokok", "Daging", "Sayuran", "Bumbu", "Minuman"]

  const filteredItems = stockItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const lowStockItems = stockItems.filter(item => item.status === "low" || item.status === "out")
  const totalValue = stockItems.reduce((acc, item) => acc + (item.quantity * item.price), 0)

  const getStatusBadge = (status: StockItem["status"]) => {
    switch (status) {
      case "normal":
        return <Badge className="bg-green-500">Normal</Badge>
      case "low":
        return <Badge className="bg-yellow-500">Rendah</Badge>
      case "out":
        return <Badge className="bg-red-500">Habis</Badge>
    }
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Stok</h1>
          <p className="text-muted-foreground">Kelola inventori dan stok bahan baku</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="rounded">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button className="rounded bg-[#58ff34] hover:bg-[#4de82a]">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Item
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Item</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockItems.length}</div>
            <p className="text-xs text-muted-foreground">Jenis bahan baku</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nilai Total</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Rp {totalValue.toLocaleString("id-ID")}
            </div>
            <p className="text-xs text-muted-foreground">Nilai inventori</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.filter(i => i.status === "low").length}</div>
            <p className="text-xs text-muted-foreground">Perlu restock</p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stok Habis</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems.filter(i => i.status === "out").length}</div>
            <p className="text-xs text-muted-foreground">Segera restock</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="inventory" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">Inventori</TabsTrigger>
          <TabsTrigger value="alerts" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">Peringatan Stok</TabsTrigger>
          <TabsTrigger value="history" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">Riwayat</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Daftar Inventori</h2>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari item..."
                    className="pl-8 w-[200px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category === "all" ? "Semua Kategori" : category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Item</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Stok</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead>Min. Stok</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Terakhir Update</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="font-semibold">{item.quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>{item.minimumStock}</TableCell>
                      <TableCell>Rp {item.price.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell>{item.lastUpdated}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Dialog open={isAdjustmentOpen} onOpenChange={setIsAdjustmentOpen}>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedItem(item)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Sesuaikan Stok</DialogTitle>
                                <DialogDescription>
                                  Ubah jumlah stok untuk {selectedItem?.name}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div className="space-y-2">
                                  <Label>Stok Saat Ini</Label>
                                  <Input
                                    value={selectedItem?.quantity}
                                    disabled
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Stok Baru</Label>
                                  <Input
                                    type="number"
                                    placeholder="Masukkan jumlah stok baru"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Alasan Penyesuaian</Label>
                                  <Select>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Pilih alasan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="received">Penerimaan Barang</SelectItem>
                                      <SelectItem value="damaged">Barang Rusak</SelectItem>
                                      <SelectItem value="expired">Kadaluarsa</SelectItem>
                                      <SelectItem value="correction">Koreksi</SelectItem>
                                      <SelectItem value="other">Lainnya</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button variant="outline" className="rounded" onClick={() => setIsAdjustmentOpen(false)}>
                                    Batal
                                  </Button>
                                  <Button className="rounded bg-[#58ff34] hover:bg-[#4de82a]" onClick={() => setIsAdjustmentOpen(false)}>
                                    Simpan Perubahan
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Peringatan Stok</CardTitle>
              <CardDescription>
                Item yang memerlukan perhatian segera
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded ${
                        item.status === "out" ? "bg-red-100" : "bg-yellow-100"
                      }`}>
                        <AlertTriangle className={`h-5 w-5 ${
                          item.status === "out" ? "text-red-500" : "text-yellow-500"
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Stok: {item.quantity} {item.unit} | Minimum: {item.minimumStock} {item.unit}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(item.status)}
                      <Button size="sm">Restock</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Riwayat Perubahan Stok</CardTitle>
              <CardDescription>
                Log aktivitas perubahan inventori
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Item</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Sebelum</TableHead>
                    <TableHead>Perubahan</TableHead>
                    <TableHead>Sesudah</TableHead>
                    <TableHead>Keterangan</TableHead>
                    <TableHead>Operator</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>2024-01-15 10:30</TableCell>
                    <TableCell>Beras Jasmine</TableCell>
                    <TableCell><Badge className="bg-green-500">Masuk</Badge></TableCell>
                    <TableCell>100 kg</TableCell>
                    <TableCell className="text-green-600">+50 kg</TableCell>
                    <TableCell>150 kg</TableCell>
                    <TableCell>Penerimaan barang</TableCell>
                    <TableCell>Admin</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2024-01-15 09:15</TableCell>
                    <TableCell>Ayam Potong</TableCell>
                    <TableCell><Badge className="bg-red-500">Keluar</Badge></TableCell>
                    <TableCell>20 kg</TableCell>
                    <TableCell className="text-red-600">-20 kg</TableCell>
                    <TableCell>0 kg</TableCell>
                    <TableCell>Penggunaan produksi</TableCell>
                    <TableCell>Kitchen</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>2024-01-14 16:45</TableCell>
                    <TableCell>Minyak Goreng</TableCell>
                    <TableCell><Badge className="bg-red-500">Keluar</Badge></TableCell>
                    <TableCell>30 L</TableCell>
                    <TableCell className="text-red-600">-5 L</TableCell>
                    <TableCell>25 L</TableCell>
                    <TableCell>Penggunaan produksi</TableCell>
                    <TableCell>Kitchen</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}