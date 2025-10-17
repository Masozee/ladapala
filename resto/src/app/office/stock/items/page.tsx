"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Add01Icon,
  Package01Icon,
  Edit01Icon,
  Delete01Icon,
  ArrowLeft01Icon
} from "@hugeicons/core-free-icons"
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
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { api, Inventory } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function ItemMasterPage() {
  const router = useRouter()
  const { staff } = useAuth()
  const { toast } = useToast()

  const [inventory, setInventory] = useState<Inventory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    min_quantity: 1,
    cost_per_unit: "",
    supplier: "",
    unit: "pcs"
  })

  const canModify = staff && ['ADMIN', 'MANAGER', 'WAREHOUSE'].includes(staff.role)
  const categories = ["all", "Food Ingredients", "Beverages", "Packaging", "Supplies", "Other"]
  const units = ["pcs", "kg", "liter", "box", "pack", "bottle", "gram", "ml"]

  useEffect(() => {
    fetchInventory()
  }, [staff])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory()
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      const params: any = {}
      if (staff?.branch) params.branch = staff.branch.id
      if (searchTerm) params.search = searchTerm

      const response = await api.getInventory(params)
      setInventory(response.results)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data item",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filteredItems = inventory.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory
    return matchesCategory
  })

  const handleAddItem = async () => {
    if (!staff?.branch) return

    try {
      await api.createInventory({
        branch: staff.branch.id,
        name: formData.name,
        quantity: 0, // Start with 0, add stock via transactions
        min_quantity: formData.min_quantity,
        cost_per_unit: formData.cost_per_unit,
        supplier: formData.supplier,
        unit: formData.unit,
        category: formData.category
      })

      toast({
        title: "Berhasil",
        description: "Item berhasil ditambahkan"
      })

      setIsAddOpen(false)
      setFormData({
        name: "",
        category: "",
        min_quantity: 1,
        cost_per_unit: "",
        supplier: "",
        unit: "pcs"
      })

      fetchInventory()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menambahkan item",
        variant: "destructive"
      })
    }
  }

  const handleUpdateItem = async () => {
    if (!selectedItem) return

    try {
      await api.updateInventory(selectedItem.id, {
        name: formData.name,
        min_quantity: formData.min_quantity,
        cost_per_unit: formData.cost_per_unit,
        supplier: formData.supplier,
        unit: formData.unit,
        category: formData.category
      })

      toast({
        title: "Berhasil",
        description: "Item berhasil diupdate"
      })

      setIsEditOpen(false)
      setSelectedItem(null)
      fetchInventory()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengupdate item",
        variant: "destructive"
      })
    }
  }

  const handleDeleteItem = async (item: Inventory) => {
    if (!confirm(`Hapus ${item.name} dari daftar item?\n\nPeringatan: Ini akan menghapus semua riwayat transaksi item ini.`)) return

    try {
      await api.deleteInventory(item.id)
      toast({
        title: "Berhasil",
        description: "Item berhasil dihapus"
      })
      fetchInventory()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus item",
        variant: "destructive"
      })
    }
  }

  const openEditDialog = (item: Inventory) => {
    setSelectedItem(item)
    setFormData({
      name: item.name,
      category: item.category,
      min_quantity: item.min_quantity,
      cost_per_unit: item.cost_per_unit,
      supplier: item.supplier,
      unit: item.unit
    })
    setIsEditOpen(true)
  }

  const getStockBadge = (item: Inventory) => {
    if (item.quantity === 0) {
      return <Badge className="bg-red-500">Habis</Badge>
    } else if (item.needs_restock) {
      return <Badge className="bg-yellow-500">Rendah</Badge>
    }
    return <Badge className="bg-green-500">Normal</Badge>
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Memuat data...</p>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE', 'CASHIER', 'KITCHEN']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded"
              onClick={() => router.push('/office/stock')}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Master Item</h1>
              <p className="text-muted-foreground">Kelola data item inventori</p>
            </div>
          </div>
          {canModify && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded bg-[#58ff34] hover:bg-[#4de82a]">
                  <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} className="mr-2" />
                  Tambah Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Tambah Item Baru</DialogTitle>
                  <DialogDescription>Tambahkan item baru ke master data (stok awal = 0)</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Item *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Contoh: Beras Jasmine"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Kategori</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Food Ingredients">Food Ingredients</SelectItem>
                        <SelectItem value="Beverages">Beverages</SelectItem>
                        <SelectItem value="Packaging">Packaging</SelectItem>
                        <SelectItem value="Supplies">Supplies</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Minimum Stok *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={formData.min_quantity}
                      onChange={(e) => setFormData({...formData, min_quantity: parseInt(e.target.value) || 1})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Harga Standar per Unit *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.cost_per_unit}
                      onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
                      placeholder="15000"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Satuan *</Label>
                    <Select value={formData.unit} onValueChange={(v) => setFormData({...formData, unit: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Supplier</Label>
                    <Input
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                      placeholder="Nama supplier"
                    />
                  </div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg mt-4">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Catatan:</strong> Item baru akan dibuat dengan stok awal 0. Gunakan menu <strong>Penerimaan Barang</strong> untuk menambah stok.
                  </p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" className="rounded" onClick={() => setIsAddOpen(false)}>
                    Batal
                  </Button>
                  <Button
                    className="rounded bg-[#58ff34] hover:bg-[#4de82a]"
                    onClick={handleAddItem}
                    disabled={!formData.name || !formData.cost_per_unit}
                  >
                    Tambah Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Item</CardTitle>
              <HugeiconsIcon icon={Package01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">Item terdaftar</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Normal</CardTitle>
              <Badge className="bg-green-500">Normal</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inventory.filter(i => i.quantity > i.min_quantity).length}
              </div>
              <p className="text-xs text-muted-foreground">Item dengan stok cukup</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Perlu Restock</CardTitle>
              <Badge className="bg-yellow-500">Rendah</Badge>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inventory.filter(i => i.needs_restock).length}
              </div>
              <p className="text-xs text-muted-foreground">Item perlu direstock</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Daftar Item</h2>
            <div className="flex gap-2">
              <div className="relative">
                <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={2} className="absolute left-2 top-2.5 text-muted-foreground" />
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
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Belum ada data item</p>
                {canModify && (
                  <Button
                    className="mt-4 rounded bg-[#58ff34] hover:bg-[#4de82a]"
                    onClick={() => setIsAddOpen(true)}
                  >
                    <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} className="mr-2" />
                    Tambah Item Pertama
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Item</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Stok Saat Ini</TableHead>
                    <TableHead>Min. Stok</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead>Harga Standar</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    {canModify && <TableHead className="text-right">Aksi</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell className="font-semibold">{item.quantity}</TableCell>
                      <TableCell>{item.min_quantity}</TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell>Rp {parseFloat(item.cost_per_unit).toLocaleString("id-ID")}</TableCell>
                      <TableCell>{item.supplier || '-'}</TableCell>
                      <TableCell>{getStockBadge(item)}</TableCell>
                      {canModify && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(item)}
                            >
                              <HugeiconsIcon icon={Edit01Icon} size={16} strokeWidth={2} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteItem(item)}
                            >
                              <HugeiconsIcon icon={Delete01Icon} size={16} strokeWidth={2} className="text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Item</DialogTitle>
              <DialogDescription>Update informasi item {selectedItem?.name}</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Item *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food Ingredients">Food Ingredients</SelectItem>
                    <SelectItem value="Beverages">Beverages</SelectItem>
                    <SelectItem value="Packaging">Packaging</SelectItem>
                    <SelectItem value="Supplies">Supplies</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Minimum Stok *</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({...formData, min_quantity: parseInt(e.target.value) || 1})}
                />
              </div>
              <div className="space-y-2">
                <Label>Harga Standar per Unit *</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.cost_per_unit}
                  onChange={(e) => setFormData({...formData, cost_per_unit: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Satuan *</Label>
                <Select value={formData.unit} onValueChange={(v) => setFormData({...formData, unit: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                />
              </div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg mt-4">
              <p className="text-sm text-yellow-800">
                ⚠️ <strong>Perhatian:</strong> Perubahan harga standar tidak mempengaruhi transaksi yang sudah tercatat. Gunakan menu <strong>Koreksi Stok</strong> untuk mengubah jumlah stok.
              </p>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" className="rounded" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button
                className="rounded bg-[#58ff34] hover:bg-[#4de82a]"
                onClick={handleUpdateItem}
              >
                Simpan Perubahan
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
