"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Add01Icon,
  Edit01Icon,
  Delete01Icon,
  MoreVerticalIcon,
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
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { StockActionTabs } from "@/components/stock-action-tabs"
import { api, Inventory } from "@/lib/api"
import { useRouter } from "next/navigation"

export default function ItemMasterPage() {
  const router = useRouter()
  const { staff } = useAuth()
  const { toast } = useToast()

  const [inventory, setInventory] = useState<Inventory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLocation, setSelectedLocation] = useState<string>("all")

  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<Inventory | null>(null)

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unit: "pcs",
    min_quantity: 0,
    location: "WAREHOUSE" as 'WAREHOUSE' | 'KITCHEN'
  })

  const canModify = staff && ['ADMIN', 'MANAGER', 'WAREHOUSE'].includes(staff.role)
  const units = ["pcs", "kg", "gram", "liter", "ml", "box", "pack", "bottle", "porsi"]

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
    if (!staff?.branch) return

    try {
      setIsLoading(true)
      const params: any = { branch: staff.branch.id }
      if (searchTerm) params.search = searchTerm

      const data = await api.getAllInventory(params)
      setInventory(data)
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
    const matchesLocation = selectedLocation === "all" || item.location === selectedLocation
    return matchesLocation
  })

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      unit: "pcs",
      min_quantity: 0,
      location: "WAREHOUSE"
    })
  }

  const handleAddItem = async () => {
    if (!staff?.branch || !formData.name) {
      toast({
        title: "Error",
        description: "Nama item harus diisi",
        variant: "destructive"
      })
      return
    }

    try {
      await api.createInventory({
        branch: staff.branch.id,
        name: formData.name,
        description: formData.description,
        unit: formData.unit,
        min_quantity: formData.min_quantity,
        location: formData.location
      })

      toast({
        title: "Berhasil",
        description: "Item master berhasil ditambahkan",
      })

      resetForm()
      setIsAddOpen(false)
      fetchInventory()
    } catch (error: any) {
      console.error('Error adding item:', error)
      toast({
        title: "Error",
        description: error.message || "Gagal menambah item",
        variant: "destructive"
      })
    }
  }

  const handleEdit = (item: Inventory) => {
    setSelectedItem(item)
    setFormData({
      name: item.name,
      description: item.description || "",
      unit: item.unit,
      min_quantity: item.min_quantity,
      location: item.location
    })
    setIsEditOpen(true)
  }

  const handleUpdateItem = async () => {
    if (!selectedItem) return

    try {
      await api.updateInventory(selectedItem.id, {
        name: formData.name,
        description: formData.description,
        unit: formData.unit,
        min_quantity: formData.min_quantity,
        location: formData.location
      })

      toast({
        title: "Berhasil",
        description: "Data item berhasil diperbarui",
      })

      setIsEditOpen(false)
      resetForm()
      fetchInventory()
    } catch (error: any) {
      console.error('Error updating item:', error)
      toast({
        title: "Error",
        description: error.message || "Gagal memperbarui item",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Yakin ingin menghapus item ini? Data tidak bisa dikembalikan.')) return

    try {
      await api.deleteInventory(id)
      toast({
        title: "Berhasil",
        description: "Item berhasil dihapus",
      })
      fetchInventory()
    } catch (error: any) {
      console.error('Error deleting item:', error)
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus item",
        variant: "destructive"
      })
    }
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE', 'CASHIER', 'KITCHEN']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Master Item</h1>
            <p className="text-muted-foreground">Kelola daftar item stok</p>
          </div>
          {canModify && (
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded bg-[#58ff34] hover:bg-[#4de82a] text-black">
                  <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} className="mr-2" />
                  Tambah Item
                </Button>
              </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Tambah Item Master Baru</DialogTitle>
                      <DialogDescription>Data master item (harga & supplier diinput saat penerimaan barang)</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label>Nama Item *</Label>
                        <Input
                          placeholder="Contoh: Beras Premium"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>

                      <div className="col-span-2 space-y-2">
                        <Label>Deskripsi</Label>
                        <Textarea
                          placeholder="Deskripsi item (opsional)"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Satuan *</Label>
                        <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
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
                        <Label>Min. Stok</Label>
                        <Input
                          type="number"
                          min="0"
                          value={formData.min_quantity}
                          onChange={(e) => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Lokasi Default *</Label>
                        <Select value={formData.location} onValueChange={(value: any) => setFormData({ ...formData, location: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="WAREHOUSE">Gudang</SelectItem>
                            <SelectItem value="KITCHEN">Dapur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => {
                        setIsAddOpen(false)
                        resetForm()
                      }}>
                        Batal
                      </Button>
                      <Button
                        className="rounded bg-[#58ff34] hover:bg-[#4de82a]"
                        onClick={handleAddItem}
                        disabled={!formData.name}
                      >
                        Tambah Item
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
        </div>

        {/* Quick Action Tabs */}
        <StockActionTabs />

        {/* Search & Filter */}
        <div className="flex justify-end gap-3">
          <div className="relative w-64">
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              strokeWidth={2}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Cari nama item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Semua Lokasi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Lokasi</SelectItem>
              <SelectItem value="WAREHOUSE">Gudang</SelectItem>
              <SelectItem value="KITCHEN">Dapur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Items Table */}
        {isLoading ? (
          <Card className="bg-white rounded-lg border">
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground">Memuat data...</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredItems.length === 0 ? (
          <Card className="bg-white rounded-lg border">
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground">Belum ada item</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-900 py-4 px-6">Nama Item</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4 px-6">Deskripsi</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Satuan</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Stok</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Min. Stok</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4 px-6">Lokasi</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Status</TableHead>
                  {canModify && <TableHead className="font-semibold text-gray-900 text-center py-4 px-6 w-20">Aksi</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50 border-b">
                    <TableCell className="font-medium py-4 px-6">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate py-4 px-6">
                      {item.description || '-'}
                    </TableCell>
                    <TableCell className="text-right py-4 px-6">{item.unit}</TableCell>
                    <TableCell className={`text-right font-semibold py-4 px-6 ${item.needs_restock ? 'text-red-600' : 'text-green-600'}`}>
                      {parseFloat(item.quantity.toString()).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground py-4 px-6">
                      {item.min_quantity}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <Badge variant={item.location === 'WAREHOUSE' ? 'default' : 'secondary'}>
                        {item.location === 'WAREHOUSE' ? 'Gudang' : 'Dapur'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center py-4 px-6">
                      {item.needs_restock ? (
                        <Badge variant="destructive">Stok Rendah</Badge>
                      ) : (
                        <Badge className="bg-green-500">Normal</Badge>
                      )}
                    </TableCell>
                    {canModify && (
                      <TableCell className="text-center py-4 px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <HugeiconsIcon icon={MoreVerticalIcon} size={16} strokeWidth={2} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <HugeiconsIcon icon={Edit01Icon} size={16} strokeWidth={2} className="mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <HugeiconsIcon icon={Delete01Icon} size={16} strokeWidth={2} className="mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Item Master</DialogTitle>
              <DialogDescription>Update informasi item master</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label>Nama Item *</Label>
                <Input
                  placeholder="Nama item"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Deskripsi</Label>
                <Textarea
                  placeholder="Deskripsi item (opsional)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Satuan *</Label>
                <Select value={formData.unit} onValueChange={(value) => setFormData({ ...formData, unit: value })}>
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
                <Label>Min. Stok</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.min_quantity}
                  onChange={(e) => setFormData({ ...formData, min_quantity: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label>Lokasi *</Label>
                <Select value={formData.location} onValueChange={(value: any) => setFormData({ ...formData, location: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WAREHOUSE">Gudang</SelectItem>
                    <SelectItem value="KITCHEN">Dapur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsEditOpen(false)
                resetForm()
              }}>
                Batal
              </Button>
              <Button
                className="rounded bg-[#58ff34] hover:bg-[#4de82a]"
                onClick={handleUpdateItem}
              >
                Simpan Perubahan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </RoleGuard>
  )
}
