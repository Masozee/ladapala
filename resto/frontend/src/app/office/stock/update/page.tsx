'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Search01Icon,
  Edit01Icon,
  Package01Icon,
  PencilEdit02Icon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { StockActionTabs } from "@/components/stock-action-tabs"
import { api, Inventory } from "@/lib/api"

export default function StockUpdatePage() {
  const router = useRouter()
  const { staff } = useAuth()
  const { toast } = useToast()

  const [warehouseInventory, setWarehouseInventory] = useState<Inventory[]>([])
  const [kitchenInventory, setKitchenInventory] = useState<Inventory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("warehouse")
  const [editingItems, setEditingItems] = useState<{ [key: number]: string }>({})
  const [savingItems, setSavingItems] = useState<{ [key: number]: boolean }>({})

  const canModify = staff && ['ADMIN', 'MANAGER', 'WAREHOUSE'].includes(staff.role)

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
      const [warehouse, kitchen] = await Promise.all([
        api.getAllInventory({ branch: staff.branch.id, location: 'WAREHOUSE' }),
        api.getAllInventory({ branch: staff.branch.id, location: 'KITCHEN' })
      ])
      setWarehouseInventory(warehouse)
      setKitchenInventory(kitchen)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data stok",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const currentInventory = activeTab === "warehouse" ? warehouseInventory : kitchenInventory

  const filteredItems = currentInventory.filter(item => {
    if (!searchTerm) return true
    return item.name.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleEditClick = (itemId: number, currentQty: number) => {
    setEditingItems({
      ...editingItems,
      [itemId]: currentQty.toString()
    })
  }

  const handleQuantityChange = (itemId: number, value: string) => {
    setEditingItems({
      ...editingItems,
      [itemId]: value
    })
  }

  const handleSaveClick = async (itemId: number) => {
    const newQuantity = editingItems[itemId]
    if (!newQuantity || isNaN(parseFloat(newQuantity))) {
      toast({
        title: "Error",
        description: "Jumlah tidak valid",
        variant: "destructive"
      })
      return
    }

    try {
      setSavingItems({ ...savingItems, [itemId]: true })

      await api.updateInventory(itemId, {
        // Only update quantity via direct edit - this should create an ADJUST transaction
      })

      // Remove from editing state
      const newEditing = { ...editingItems }
      delete newEditing[itemId]
      setEditingItems(newEditing)

      toast({
        title: "Berhasil",
        description: "Stok berhasil diperbarui"
      })

      fetchInventory()
    } catch (error) {
      console.error('Error updating stock:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Gagal memperbarui stok",
        variant: "destructive"
      })
    } finally {
      setSavingItems({ ...savingItems, [itemId]: false })
    }
  }

  const handleCancelEdit = (itemId: number) => {
    const newEditing = { ...editingItems }
    delete newEditing[itemId]
    setEditingItems(newEditing)
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Update Stok</h1>
            <p className="text-muted-foreground">Update jumlah stok barang secara langsung</p>
          </div>
        </div>

        {/* Quick Action Tabs */}
        <StockActionTabs />

        {/* Search */}
        <Card className="bg-white rounded-lg border">
          <CardContent className="pt-6">
            <div className="relative">
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
          </CardContent>
        </Card>

        {/* Location Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="warehouse" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
              <HugeiconsIcon icon={Package01Icon} size={16} strokeWidth={2} className="mr-2" />
              Gudang
            </TabsTrigger>
            <TabsTrigger value="kitchen" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
              <HugeiconsIcon icon={Package01Icon} size={16} strokeWidth={2} className="mr-2" />
              Dapur
            </TabsTrigger>
          </TabsList>

          {/* Warehouse Tab */}
          <TabsContent value="warehouse" className="mt-0 space-y-4">
            <Card className="bg-white rounded-lg border">
              <CardHeader>
                <CardTitle>Stok Gudang</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Memuat data...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Tidak ada item ditemukan</p>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-white overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-semibold text-gray-900 py-4 px-6">Nama Item</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Satuan</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Stok Saat Ini</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Min. Stok</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Status</TableHead>
                          {canModify && <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Aksi</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => (
                          <TableRow key={item.id} className="hover:bg-gray-50 border-b">
                            <TableCell className="font-medium py-4 px-6">{item.name}</TableCell>
                            <TableCell className="text-right py-4 px-6">{item.unit}</TableCell>
                            <TableCell className="text-right py-4 px-6">
                              {editingItems[item.id] !== undefined ? (
                                <Input
                                  type="number"
                                  value={editingItems[item.id]}
                                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                  className="w-32 text-right ml-auto"
                                  autoFocus
                                />
                              ) : (
                                <span className={`font-semibold ${item.needs_restock ? 'text-red-600' : 'text-green-600'}`}>
                                  {parseFloat(item.quantity.toString()).toLocaleString('id-ID')}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground py-4 px-6">
                              {item.min_quantity}
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              {item.needs_restock ? (
                                <Badge variant="destructive">Stok Rendah</Badge>
                              ) : (
                                <Badge className="bg-green-500">Normal</Badge>
                              )}
                            </TableCell>
                            {canModify && (
                              <TableCell className="text-right py-4 px-6">
                                {editingItems[item.id] !== undefined ? (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded"
                                      onClick={() => handleCancelEdit(item.id)}
                                      disabled={savingItems[item.id]}
                                    >
                                      Batal
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="rounded bg-[#58ff34] hover:bg-[#4de82a]"
                                      onClick={() => handleSaveClick(item.id)}
                                      disabled={savingItems[item.id]}
                                    >
                                      <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} className="mr-2" />
                                      Simpan
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded"
                                    onClick={() => handleEditClick(item.id, item.quantity)}
                                  >
                                    <HugeiconsIcon icon={Edit01Icon} size={16} strokeWidth={2} className="mr-2" />
                                    Edit
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kitchen Tab */}
          <TabsContent value="kitchen" className="mt-0 space-y-4">
            <Card className="bg-white rounded-lg border">
              <CardHeader>
                <CardTitle>Stok Dapur</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Memuat data...</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Tidak ada item ditemukan</p>
                  </div>
                ) : (
                  <div className="rounded-lg border bg-white overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                          <TableHead className="font-semibold text-gray-900 py-4 px-6">Nama Item</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Satuan</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Stok Saat Ini</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Min. Stok</TableHead>
                          <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Status</TableHead>
                          {canModify && <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Aksi</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => (
                          <TableRow key={item.id} className="hover:bg-gray-50 border-b">
                            <TableCell className="font-medium py-4 px-6">{item.name}</TableCell>
                            <TableCell className="text-right py-4 px-6">{item.unit}</TableCell>
                            <TableCell className="text-right py-4 px-6">
                              {editingItems[item.id] !== undefined ? (
                                <Input
                                  type="number"
                                  value={editingItems[item.id]}
                                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                  className="w-32 text-right ml-auto"
                                  autoFocus
                                />
                              ) : (
                                <span className={`font-semibold ${item.needs_restock ? 'text-red-600' : 'text-green-600'}`}>
                                  {parseFloat(item.quantity.toString()).toLocaleString('id-ID')}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground py-4 px-6">
                              {item.min_quantity}
                            </TableCell>
                            <TableCell className="text-center py-4 px-6">
                              {item.needs_restock ? (
                                <Badge variant="destructive">Stok Rendah</Badge>
                              ) : (
                                <Badge className="bg-green-500">Normal</Badge>
                              )}
                            </TableCell>
                            {canModify && (
                              <TableCell className="text-right py-4 px-6">
                                {editingItems[item.id] !== undefined ? (
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="rounded"
                                      onClick={() => handleCancelEdit(item.id)}
                                      disabled={savingItems[item.id]}
                                    >
                                      Batal
                                    </Button>
                                    <Button
                                      size="sm"
                                      className="rounded bg-[#58ff34] hover:bg-[#4de82a]"
                                      onClick={() => handleSaveClick(item.id)}
                                      disabled={savingItems[item.id]}
                                    >
                                      <HugeiconsIcon icon={PencilEdit02Icon} size={16} strokeWidth={2} className="mr-2" />
                                      Simpan
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="rounded"
                                    onClick={() => handleEditClick(item.id, item.quantity)}
                                  >
                                    <HugeiconsIcon icon={Edit01Icon} size={16} strokeWidth={2} className="mr-2" />
                                    Edit
                                  </Button>
                                )}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}
