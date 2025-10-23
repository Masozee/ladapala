'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Edit01Icon,
  Alert01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
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
import { api, type Inventory, type InventoryTransaction } from "@/lib/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Add01Icon } from "@hugeicons/core-free-icons"

export default function AdjustmentPage() {
  const router = useRouter()
  const { staff } = useAuth()
  const { toast } = useToast()

  const [warehouseInventory, setWarehouseInventory] = useState<Inventory[]>([])
  const [kitchenInventory, setKitchenInventory] = useState<Inventory[]>([])
  const [adjustmentHistory, setAdjustmentHistory] = useState<InventoryTransaction[]>([])
  const [activeTab, setActiveTab] = useState("warehouse")
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)

  const [adjustmentForm, setAdjustmentForm] = useState({
    item_id: '',
    adjustment_type: 'reduce' as 'add' | 'reduce',
    quantity: '',
    reason: '',
    notes: ''
  })

  useEffect(() => {
    fetchInventory()
    fetchAdjustmentHistory()
  }, [staff])

  const fetchInventory = async () => {
    if (!staff?.branch) return

    try {
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
    }
  }

  const fetchAdjustmentHistory = async () => {
    if (!staff?.branch?.id) return

    try {
      const response = await api.getInventoryTransactions({
        branch: staff.branch.id,
        transaction_type: 'ADJUST',
        ordering: '-created_at',
        limit: 50
      })
      setAdjustmentHistory(response.results || [])
    } catch (error) {
      console.error('Error fetching adjustment history:', error)
    }
  }

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate item exists
    const item = [...warehouseInventory, ...kitchenInventory].find(i => i.id === parseInt(adjustmentForm.item_id))

    if (!item) {
      toast({
        title: "Error",
        description: "Item tidak ditemukan",
        variant: "destructive"
      })
      return
    }

    // Validate quantity for reduction
    const adjustmentQty = adjustmentForm.adjustment_type === 'reduce'
      ? -Math.abs(parseFloat(adjustmentForm.quantity))
      : Math.abs(parseFloat(adjustmentForm.quantity))

    if (adjustmentForm.adjustment_type === 'reduce' && Math.abs(adjustmentQty) > item.quantity) {
      toast({
        title: "Error",
        description: `Stok tidak cukup untuk dikurangi. Tersedia: ${item.quantity} ${item.unit}`,
        variant: "destructive"
      })
      return
    }

    // Show confirmation dialog
    setConfirmDialogOpen(true)
  }

  const handleConfirmAdjustment = async () => {
    setSubmitting(true)
    setConfirmDialogOpen(false)

    try {
      const item = [...warehouseInventory, ...kitchenInventory].find(i => i.id === parseInt(adjustmentForm.item_id))

      if (!item) {
        toast({
          title: "Error",
          description: "Item tidak ditemukan",
          variant: "destructive"
        })
        return
      }

      const adjustmentQty = adjustmentForm.adjustment_type === 'reduce'
        ? -Math.abs(parseFloat(adjustmentForm.quantity))
        : Math.abs(parseFloat(adjustmentForm.quantity))

      await api.createInventoryTransaction({
        inventory: parseInt(adjustmentForm.item_id),
        transaction_type: 'ADJUST',
        quantity: adjustmentQty,
        unit_cost: item.average_cost || '0',
        notes: `${adjustmentForm.reason}${adjustmentForm.notes ? ` | ${adjustmentForm.notes}` : ''}`
      })

      toast({
        title: "Berhasil",
        description: "Koreksi stok berhasil dicatat"
      })

      // Reset form and close dialog
      setAdjustmentForm({
        item_id: '',
        adjustment_type: 'reduce',
        quantity: '',
        reason: '',
        notes: ''
      })
      setDialogOpen(false)

      fetchInventory()
      fetchAdjustmentHistory()
    } catch (error: any) {
      console.error('Error adjusting stock:', error)
      toast({
        title: "Error",
        description: error.message || "Gagal koreksi stok",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const currentInventory = activeTab === "warehouse" ? warehouseInventory : kitchenInventory
  const selectedItem = currentInventory.find(i => i.id === parseInt(adjustmentForm.item_id))

  const adjustmentReasons = [
    'Barang rusak/pecah',
    'Barang kadaluarsa',
    'Selisih hasil stock opname',
    'Kehilangan/hilang',
    'Koreksi kesalahan input',
    'Lainnya'
  ]

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Koreksi Stok
              <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
                <DialogTrigger asChild>
                  <button className="text-blue-600 hover:text-blue-700 transition-colors">
                    <HugeiconsIcon icon={InformationCircleIcon} size={28} strokeWidth={2} />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-purple-900">Informasi Koreksi Stok</DialogTitle>
                    <DialogDescription>
                      Panduan penggunaan fitur koreksi stok
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 mt-4">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2"></div>
                      <p className="text-sm text-purple-900">
                        <strong>Kurangi Stok:</strong> Untuk barang rusak, kadaluarsa, hilang, atau selisih negatif
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2"></div>
                      <p className="text-sm text-purple-900">
                        <strong>Tambah Stok:</strong> Untuk koreksi kesalahan input atau selisih positif
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2"></div>
                      <p className="text-sm text-purple-900">
                        <strong>Audit Trail:</strong> Semua koreksi tercatat dengan alasan untuk audit
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2"></div>
                      <p className="text-sm text-purple-900">
                        <strong>Validasi:</strong> Pengurangan stok hanya bisa dilakukan jika stok tersedia
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </h1>
            <p className="text-muted-foreground">Sesuaikan stok untuk selisih fisik, kerusakan, atau kadaluarsa</p>
          </div>
        </div>

        {/* Quick Action Tabs */}
        <StockActionTabs />

        {/* Adjustment History Table */}
        <Card className="bg-white rounded-lg border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Riwayat Koreksi Stok</CardTitle>
                <CardDescription>50 koreksi terakhir (penambahan dan pengurangan)</CardDescription>
              </div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded bg-[#58ff34] hover:bg-[#4de82a] text-black">
                <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} className="mr-2" />
                Koreksi Stok
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={Edit01Icon} size={24} strokeWidth={2} className="text-purple-600" />
                  Form Koreksi Stok
                </DialogTitle>
                <DialogDescription>
                  Tambah atau kurangi stok dengan alasan yang jelas
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleFormSubmit} className="space-y-4 mt-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="warehouse">Gudang</TabsTrigger>
                    <TabsTrigger value="kitchen">Dapur</TabsTrigger>
                  </TabsList>

                  <TabsContent value="warehouse" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="warehouse_item">Item Gudang *</Label>
                      <Select
                        value={adjustmentForm.item_id}
                        onValueChange={(value) => setAdjustmentForm({...adjustmentForm, item_id: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih item" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouseInventory.map(item => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name} (Stok: {item.quantity} {item.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="kitchen" className="mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="kitchen_item">Item Dapur *</Label>
                      <Select
                        value={adjustmentForm.item_id}
                        onValueChange={(value) => setAdjustmentForm({...adjustmentForm, item_id: value})}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih item" />
                        </SelectTrigger>
                        <SelectContent>
                          {kitchenInventory.map(item => (
                            <SelectItem key={item.id} value={item.id.toString()}>
                              {item.name} (Stok: {item.quantity} {item.unit})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="space-y-2">
                  <Label htmlFor="adjustment_type">Jenis Koreksi *</Label>
                  <Select
                    value={adjustmentForm.adjustment_type}
                    onValueChange={(value: 'add' | 'reduce') => setAdjustmentForm({...adjustmentForm, adjustment_type: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reduce">Kurangi Stok (-)</SelectItem>
                      <SelectItem value="add">Tambah Stok (+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adjustment_quantity">Jumlah *</Label>
                  <Input
                    id="adjustment_quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, quantity: e.target.value})}
                    placeholder="Jumlah koreksi"
                    required
                  />
                  {selectedItem && (
                    <p className="text-xs text-muted-foreground">
                      Stok saat ini: {selectedItem.quantity} {selectedItem.unit}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reason">Alasan Koreksi *</Label>
                  <Select
                    value={adjustmentForm.reason}
                    onValueChange={(value) => setAdjustmentForm({...adjustmentForm, reason: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih alasan koreksi" />
                    </SelectTrigger>
                    <SelectContent>
                      {adjustmentReasons.map(reason => (
                        <SelectItem key={reason} value={reason}>
                          {reason}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adjustment_notes">Catatan Detail</Label>
                  <Textarea
                    id="adjustment_notes"
                    value={adjustmentForm.notes}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, notes: e.target.value})}
                    placeholder="Jelaskan detail koreksi (opsional)"
                    rows={3}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full rounded bg-[#58ff34] hover:bg-[#4de82a] text-black"
                  disabled={submitting}
                >
                  <HugeiconsIcon icon={Edit01Icon} size={18} strokeWidth={2} className="mr-2" />
                  {submitting ? 'Menyimpan...' : 'Simpan Koreksi'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {adjustmentHistory.length === 0 ? (
              <div className="text-center py-12 px-6">
                <HugeiconsIcon icon={Edit01Icon} size={48} strokeWidth={1.5} className="mx-auto mb-2 opacity-30" />
                <p className="text-muted-foreground">Belum ada riwayat koreksi stok</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Tanggal & Waktu</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Item</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Lokasi</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Jenis</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Jumlah</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Oleh</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Alasan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustmentHistory.map((adjustment) => {
                      const isAddition = parseFloat(adjustment.quantity.toString()) > 0

                      return (
                        <TableRow key={adjustment.id} className="hover:bg-gray-50 border-b">
                          <TableCell className="py-4 px-6 whitespace-nowrap">
                            {new Date(adjustment.created_at).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell className="font-medium py-4 px-6">{adjustment.inventory_name}</TableCell>
                          <TableCell className="py-4 px-6">
                            <Badge variant="outline" className="font-normal">
                              {adjustment.inventory_location === 'WAREHOUSE' ? 'Gudang' : 'Dapur'}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <Badge className={isAddition ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}>
                              {isAddition ? 'Penambahan (+)' : 'Pengurangan (-)'}
                            </Badge>
                          </TableCell>
                          <TableCell className={`text-right font-semibold py-4 px-6 ${isAddition ? 'text-green-600' : 'text-red-600'}`}>
                            {isAddition ? '+' : ''}{parseFloat(adjustment.quantity.toString()).toLocaleString('id-ID')}
                          </TableCell>
                          <TableCell className="text-muted-foreground py-4 px-6">{adjustment.performed_by_name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm py-4 px-6 max-w-xs">
                            <div className="whitespace-normal break-words">
                              {adjustment.notes || '-'}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Confirmation Alert Dialog */}
        <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-yellow-900">
                <HugeiconsIcon icon={Alert01Icon} size={24} strokeWidth={2} />
                Peringatan - Konfirmasi Koreksi Stok
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                <p className="text-yellow-900 font-medium">
                  Koreksi stok akan langsung mempengaruhi jumlah stok. Pastikan:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-yellow-900">
                  <li>Alasan koreksi jelas dan akurat</li>
                  <li>Jumlah koreksi sudah diverifikasi</li>
                  <li>Catatan detail untuk audit trail</li>
                </ul>

                {selectedItem && adjustmentForm.quantity && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-semibold text-blue-900 mb-2">Ringkasan Koreksi:</p>
                    <div className="space-y-1 text-sm text-blue-900">
                      <div className="flex justify-between">
                        <span>Item:</span>
                        <span className="font-semibold">{selectedItem.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jenis:</span>
                        <span className="font-semibold">
                          {adjustmentForm.adjustment_type === 'reduce' ? 'Pengurangan (-)' : 'Penambahan (+)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Jumlah:</span>
                        <span className="font-semibold">
                          {adjustmentForm.adjustment_type === 'reduce' ? '-' : '+'}
                          {parseFloat(adjustmentForm.quantity).toLocaleString('id-ID')} {selectedItem.unit}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-blue-300 pt-1 mt-1">
                        <span>Stok Saat Ini:</span>
                        <span className="font-semibold">
                          {parseFloat(selectedItem.quantity.toString()).toLocaleString('id-ID')} {selectedItem.unit}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-base">
                        <span>Stok Setelah Koreksi:</span>
                        <span className="text-blue-900">
                          {(
                            parseFloat(selectedItem.quantity.toString()) +
                            (adjustmentForm.adjustment_type === 'reduce' ? -1 : 1) * parseFloat(adjustmentForm.quantity)
                          ).toLocaleString('id-ID')} {selectedItem.unit}
                        </span>
                      </div>
                      {adjustmentForm.reason && (
                        <div className="flex justify-between border-t border-blue-300 pt-1 mt-1">
                          <span>Alasan:</span>
                          <span className="font-semibold">{adjustmentForm.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-600 mt-4">
                  Apakah Anda yakin ingin melanjutkan koreksi stok ini?
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={submitting}>Batal</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleConfirmAdjustment}
                disabled={submitting}
                className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
              >
                {submitting ? 'Memproses...' : 'Ya, Lanjutkan Koreksi'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </RoleGuard>
  )
}
