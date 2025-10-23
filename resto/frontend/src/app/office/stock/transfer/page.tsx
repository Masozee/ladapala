'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowRight01Icon,
  PackageIcon,
  Add01Icon,
} from "@hugeicons/core-free-icons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { StockActionTabs } from "@/components/stock-action-tabs"
import { api, type Inventory, type StockTransfer } from "@/lib/api"

export default function TransferPage() {
  const router = useRouter()
  const { staff } = useAuth()
  const { toast } = useToast()

  const [warehouseInventory, setWarehouseInventory] = useState<Inventory[]>([])
  const [kitchenInventory, setKitchenInventory] = useState<Inventory[]>([])
  const [transferHistory, setTransferHistory] = useState<StockTransfer[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const [transferForm, setTransferForm] = useState({
    warehouse_item_id: '',
    kitchen_item_id: '',
    quantity: '',
    notes: ''
  })

  useEffect(() => {
    fetchInventory()
    fetchTransferHistory()
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

  const fetchTransferHistory = async () => {
    if (!staff?.branch) return

    try {
      const transfers = await api.getRecentStockTransfers()
      setTransferHistory(transfers)
    } catch (error) {
      console.error('Error fetching transfer history:', error)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await api.createStockTransfer({
        warehouse_item_id: parseInt(transferForm.warehouse_item_id),
        kitchen_item_id: parseInt(transferForm.kitchen_item_id),
        quantity: parseFloat(transferForm.quantity),
        notes: transferForm.notes || undefined
      })

      toast({
        title: "Berhasil",
        description: "Transfer stok berhasil dengan konversi unit otomatis"
      })

      // Reset form
      setTransferForm({
        warehouse_item_id: '',
        kitchen_item_id: '',
        quantity: '',
        notes: ''
      })

      setDialogOpen(false)
      fetchInventory()
      fetchTransferHistory()
    } catch (error: any) {
      console.error('Error transferring stock:', error)
      toast({
        title: "Error",
        description: error.message || "Gagal transfer stok",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedWarehouseItem = warehouseInventory.find(i => i.id === parseInt(transferForm.warehouse_item_id))
  const selectedKitchenItem = kitchenInventory.find(i => i.id === parseInt(transferForm.kitchen_item_id))

  // Calculate converted quantity if units differ
  const getConvertedQuantity = () => {
    if (!selectedWarehouseItem || !selectedKitchenItem || !transferForm.quantity) return null

    const qty = parseFloat(transferForm.quantity)
    const warehouseUnit = selectedWarehouseItem.unit.toLowerCase()
    const kitchenUnit = selectedKitchenItem.unit.toLowerCase()

    if (warehouseUnit === kitchenUnit) return qty

    // kg -> gram or liter -> ml
    if ((warehouseUnit === 'kg' || warehouseUnit === 'kilogram') &&
        (kitchenUnit === 'gram' || kitchenUnit === 'g')) {
      return qty * 1000
    }
    if ((warehouseUnit === 'liter' || warehouseUnit === 'l') &&
        (kitchenUnit === 'ml' || kitchenUnit === 'milliliter')) {
      return qty * 1000
    }

    return qty
  }

  const convertedQuantity = getConvertedQuantity()

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Transfer Stok</h1>
            <p className="text-muted-foreground">Transfer otomatis dengan konversi unit dan harga</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="rounded bg-[#58ff34] hover:bg-[#4de82a] text-black">
                <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} className="mr-2" />
                Transfer Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={ArrowRight01Icon} size={24} strokeWidth={2} className="text-orange-600" />
                  Form Transfer Stok
                </DialogTitle>
                <DialogDescription>
                  Sistem otomatis menangani konversi unit (kg→gram) dan harga
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleTransfer} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="warehouse_item">Item di Gudang *</Label>
                  <Select
                    value={transferForm.warehouse_item_id}
                    onValueChange={(value) => {
                      const item = warehouseInventory.find(i => i.id === parseInt(value))
                      setTransferForm({
                        ...transferForm,
                        warehouse_item_id: value,
                        kitchen_item_id: kitchenInventory.find(k => k.name === item?.name)?.id.toString() || ''
                      })
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih item dari gudang" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouseInventory.map(item => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name} ({item.quantity} {item.unit} @ Rp {parseFloat(item.cost_per_unit).toLocaleString('id-ID')}/{item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="kitchen_item">Item di Dapur *</Label>
                  <Select
                    value={transferForm.kitchen_item_id}
                    onValueChange={(value) => setTransferForm({...transferForm, kitchen_item_id: value})}
                    required
                    disabled={!transferForm.warehouse_item_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={transferForm.warehouse_item_id ? "Pilih item tujuan" : "Pilih item gudang dulu"} />
                    </SelectTrigger>
                    <SelectContent>
                      {kitchenInventory
                        .filter(k => k.name === selectedWarehouseItem?.name)
                        .map(item => (
                          <SelectItem key={item.id} value={item.id.toString()}>
                            {item.name} ({item.quantity} {item.unit} @ Rp {parseFloat(item.cost_per_unit).toLocaleString('id-ID')}/{item.unit})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {selectedWarehouseItem && selectedKitchenItem &&
                   selectedWarehouseItem.unit !== selectedKitchenItem.unit && (
                    <p className="text-xs text-blue-600">
                      ℹ️ Konversi otomatis: {selectedWarehouseItem.unit} → {selectedKitchenItem.unit}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer_quantity">Jumlah Transfer *</Label>
                  <Input
                    id="transfer_quantity"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedWarehouseItem?.quantity || undefined}
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({...transferForm, quantity: e.target.value})}
                    placeholder={selectedWarehouseItem ? `Maks: ${selectedWarehouseItem.quantity}` : "0"}
                    required
                    disabled={!selectedWarehouseItem}
                  />
                  {selectedWarehouseItem && (
                    <p className="text-xs text-muted-foreground">
                      Tersedia: {selectedWarehouseItem.quantity} {selectedWarehouseItem.unit}
                    </p>
                  )}
                  {convertedQuantity && selectedKitchenItem &&
                   selectedWarehouseItem && selectedWarehouseItem.unit !== selectedKitchenItem.unit && (
                    <p className="text-xs text-green-600 font-semibold">
                      Dapur akan menerima: {convertedQuantity.toLocaleString('id-ID')} {selectedKitchenItem.unit}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="transfer_notes">Catatan</Label>
                  <Textarea
                    id="transfer_notes"
                    value={transferForm.notes}
                    onChange={(e) => setTransferForm({...transferForm, notes: e.target.value})}
                    placeholder="Catatan transfer (opsional)"
                    rows={3}
                  />
                </div>

                {/* Info Summary */}
                {selectedWarehouseItem && transferForm.quantity && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 space-y-2">
                    <p className="text-sm font-semibold text-blue-900">Ringkasan Transfer</p>
                    <div className="space-y-1 text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Item:</span>
                        <span className="font-medium">{selectedWarehouseItem.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Transfer:</span>
                        <span className="font-medium">{parseFloat(transferForm.quantity).toLocaleString('id-ID')} {selectedWarehouseItem.unit}</span>
                      </div>
                      {convertedQuantity && selectedKitchenItem && selectedWarehouseItem.unit !== selectedKitchenItem.unit && (
                        <div className="flex justify-between">
                          <span>Diterima Dapur:</span>
                          <span className="font-medium">{convertedQuantity.toLocaleString('id-ID')} {selectedKitchenItem.unit}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 rounded"
                    onClick={() => setDialogOpen(false)}
                    disabled={submitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 rounded bg-[#58ff34] hover:bg-[#4de82a] text-black"
                    disabled={submitting || !transferForm.warehouse_item_id || !transferForm.kitchen_item_id}
                  >
                    <HugeiconsIcon icon={ArrowRight01Icon} size={18} strokeWidth={2} className="mr-2" />
                    {submitting ? 'Memproses...' : 'Transfer Sekarang'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Quick Action Tabs */}
        <StockActionTabs />

        {/* Transfer History Table */}
        <Card className="bg-white rounded-lg border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Riwayat Transfer</CardTitle>
                <CardDescription>Transfer stok gudang ke dapur (7 hari terakhir)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {transferHistory.length === 0 ? (
              <div className="text-center py-12 px-6">
                <HugeiconsIcon icon={PackageIcon} size={48} strokeWidth={1.5} className="mx-auto mb-2 opacity-30" />
                <p className="text-muted-foreground">Belum ada riwayat transfer</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Tanggal & Waktu</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Item</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Jumlah</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Unit</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Dari</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Ke</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Oleh</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferHistory.map((transfer) => (
                      <TableRow key={transfer.id} className="hover:bg-gray-50 border-b">
                        <TableCell className="py-4 px-6 whitespace-nowrap">
                          {new Date(transfer.transfer_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="font-medium py-4 px-6">{transfer.item_name}</TableCell>
                        <TableCell className="text-right font-semibold py-4 px-6 text-blue-600">
                          {parseFloat(transfer.quantity).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge variant="outline" className="font-mono">{transfer.unit}</Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className="bg-orange-500 text-white">Gudang</Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className="bg-green-500 text-white">Dapur</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground py-4 px-6">{transfer.transferred_by_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm py-4 px-6 max-w-xs">
                          <div className="whitespace-normal break-words">
                            {transfer.notes || '-'}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
