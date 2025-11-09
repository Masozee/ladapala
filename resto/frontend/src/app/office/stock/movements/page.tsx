"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PackageReceiveIcon,
  ArrowRight01Icon,
  Edit01Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { StockActionTabs } from "@/components/stock-action-tabs"
import { api, type Inventory } from "@/lib/api"

function StockMovementsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { staff } = useAuth()

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'receipt')
  const [warehouseInventory, setWarehouseInventory] = useState<Inventory[]>([])
  const [kitchenInventory, setKitchenInventory] = useState<Inventory[]>([])
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false)
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Transfer form state
  const [transferForm, setTransferForm] = useState({
    warehouse_item_id: '',
    kitchen_item_id: '',
    quantity: '',
    notes: ''
  })

  // Receipt form state
  const [receiptForm, setReceiptForm] = useState({
    item_id: '',
    quantity: '',
    unit_cost: '',
    reference_number: '',
    notes: ''
  })

  // Adjustment form state
  const [adjustmentForm, setAdjustmentForm] = useState({
    item_id: '',
    quantity: '',
    notes: ''
  })

  useEffect(() => {
    fetchInventory()
  }, [staff])

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const fetchInventory = async () => {
    try {
      const response = await api.getInventory({ branch: staff?.branch?.id })
      const allInventory = response.results || []

      setWarehouseInventory(allInventory.filter(item => item.location === 'WAREHOUSE'))
      setKitchenInventory(allInventory.filter(item => item.location === 'KITCHEN'))
    } catch (error) {
      console.error('Error fetching inventory:', error)
    }
  }

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const warehouseItem = warehouseInventory.find(i => i.id === parseInt(transferForm.warehouse_item_id))
      const kitchenItem = kitchenInventory.find(i => i.id === parseInt(transferForm.kitchen_item_id))

      if (!warehouseItem || !kitchenItem) {
        alert('Item tidak ditemukan')
        return
      }

      // Create transfer transaction for warehouse (OUT)
      await api.createInventoryTransaction({
        inventory: warehouseItem.id,
        transaction_type: 'OUT',
        quantity: parseFloat(transferForm.quantity),
        unit_cost: warehouseItem.cost_per_unit,
        notes: `Transfer ke dapur: ${transferForm.notes}`
      })

      // Create transfer transaction for kitchen (IN)
      await api.createInventoryTransaction({
        inventory: kitchenItem.id,
        transaction_type: 'IN',
        quantity: parseFloat(transferForm.quantity),
        unit_cost: warehouseItem.cost_per_unit,
        notes: `Transfer dari gudang: ${transferForm.notes}`
      })

      // Reset form
      setTransferForm({
        warehouse_item_id: '',
        kitchen_item_id: '',
        quantity: '',
        notes: ''
      })
      setIsTransferDialogOpen(false)
      fetchInventory()
      alert('Transfer stok berhasil!')
    } catch (error) {
      console.error('Error transferring stock:', error)
      alert('Gagal transfer stok: ' + (error as any).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReceipt = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      await api.createInventoryTransaction({
        inventory: parseInt(receiptForm.item_id),
        transaction_type: 'IN',
        quantity: parseFloat(receiptForm.quantity),
        unit_cost: receiptForm.unit_cost,
        reference_number: receiptForm.reference_number,
        notes: receiptForm.notes
      })

      // Reset form
      setReceiptForm({
        item_id: '',
        quantity: '',
        unit_cost: '',
        reference_number: '',
        notes: ''
      })
      setIsReceiptDialogOpen(false)
      fetchInventory()
      alert('Penerimaan barang berhasil!')
    } catch (error) {
      console.error('Error receiving stock:', error)
      alert('Gagal menerima barang: ' + (error as any).message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const item = [...warehouseInventory, ...kitchenInventory].find(i => i.id === parseInt(adjustmentForm.item_id))

      if (!item) {
        alert('Item tidak ditemukan')
        return
      }

      await api.createInventoryTransaction({
        inventory: parseInt(adjustmentForm.item_id),
        transaction_type: 'ADJUST',
        quantity: parseFloat(adjustmentForm.quantity),
        unit_cost: item.cost_per_unit,
        notes: adjustmentForm.notes
      })

      // Reset form
      setAdjustmentForm({
        item_id: '',
        quantity: '',
        notes: ''
      })
      setIsAdjustmentDialogOpen(false)
      fetchInventory()
      alert('Koreksi stok berhasil!')
    } catch (error) {
      console.error('Error adjusting stock:', error)
      alert('Gagal koreksi stok: ' + (error as any).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Pergerakan Stok</h1>
            <p className="text-muted-foreground">Kelola penerimaan, transfer, dan koreksi stok</p>
          </div>
        </div>

        {/* Quick Action Tabs */}
        <StockActionTabs />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="receipt" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
              <HugeiconsIcon icon={PackageReceiveIcon} size={16} strokeWidth={2} className="mr-2" />
              Penerimaan Barang
            </TabsTrigger>
            <TabsTrigger value="transfer" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="mr-2" />
              Transfer Gudang → Dapur
            </TabsTrigger>
            <TabsTrigger value="adjustment" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
              <HugeiconsIcon icon={Edit01Icon} size={16} strokeWidth={2} className="mr-2" />
              Koreksi Stok
            </TabsTrigger>
          </TabsList>

          {/* Transfer Tab */}
          <TabsContent value="transfer" className="space-y-4">
            <Card className="bg-white rounded-lg border">
              <CardHeader>
                <CardTitle>Transfer Stok dari Gudang ke Dapur</CardTitle>
                <CardDescription>
                  Pindahkan bahan baku dari gudang ke dapur untuk digunakan dalam produksi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
                  onClick={() => setIsTransferDialogOpen(true)}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="mr-2" />
                  Transfer Stok
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Receipt Tab */}
          <TabsContent value="receipt" className="space-y-4">
            <Card className="bg-white rounded-lg border">
              <CardHeader>
                <CardTitle>Penerimaan Barang</CardTitle>
                <CardDescription>
                  Catat penerimaan barang baru ke gudang dari supplier
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
                  onClick={() => setIsReceiptDialogOpen(true)}
                >
                  <HugeiconsIcon icon={PackageReceiveIcon} size={16} strokeWidth={2} className="mr-2" />
                  Terima Barang
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Adjustment Tab */}
          <TabsContent value="adjustment" className="space-y-4">
            <Card className="bg-white rounded-lg border">
              <CardHeader>
                <CardTitle>Koreksi Stok</CardTitle>
                <CardDescription>
                  Penyesuaian stok untuk barang rusak, kadaluarsa, atau selisih fisik
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
                  onClick={() => setIsAdjustmentDialogOpen(true)}
                >
                  <HugeiconsIcon icon={Edit01Icon} size={16} strokeWidth={2} className="mr-2" />
                  Koreksi Stok
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Transfer Dialog */}
        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Transfer Stok Gudang → Dapur</DialogTitle>
              <DialogDescription>
                Pindahkan bahan baku dari gudang ke dapur untuk digunakan
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleTransfer}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="warehouse_item">Item di Gudang</Label>
                  <Select
                    value={transferForm.warehouse_item_id}
                    onValueChange={(value) => {
                      const item = warehouseInventory.find(i => i.id === parseInt(value))
                      setTransferForm({
                        ...transferForm,
                        warehouse_item_id: value,
                        // Auto-select matching kitchen item if exists
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
                          {item.name} (Stok: {item.quantity} {item.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="kitchen_item">Item di Dapur</Label>
                  <Select
                    value={transferForm.kitchen_item_id}
                    onValueChange={(value) => setTransferForm({...transferForm, kitchen_item_id: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih item tujuan di dapur" />
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

                <div className="grid gap-2">
                  <Label htmlFor="quantity">Jumlah Transfer</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={transferForm.quantity}
                    onChange={(e) => setTransferForm({...transferForm, quantity: e.target.value})}
                    placeholder="Masukkan jumlah"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Textarea
                    id="notes"
                    value={transferForm.notes}
                    onChange={(e) => setTransferForm({...transferForm, notes: e.target.value})}
                    placeholder="Catatan transfer (opsional)"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsTransferDialogOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
                  disabled={submitting}
                >
                  {submitting ? 'Memproses...' : 'Transfer Sekarang'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Receipt Dialog */}
        <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Penerimaan Barang</DialogTitle>
              <DialogDescription>
                Catat penerimaan barang baru ke gudang
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleReceipt}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="receipt_item">Item (Gudang)</Label>
                  <Select
                    value={receiptForm.item_id}
                    onValueChange={(value) => setReceiptForm({...receiptForm, item_id: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih item" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouseInventory.map(item => (
                        <SelectItem key={item.id} value={item.id.toString()}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="receipt_quantity">Jumlah Terima</Label>
                  <Input
                    id="receipt_quantity"
                    type="number"
                    step="0.01"
                    value={receiptForm.quantity}
                    onChange={(e) => setReceiptForm({...receiptForm, quantity: e.target.value})}
                    placeholder="Jumlah barang diterima"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="unit_cost">Harga per Unit</Label>
                  <Input
                    id="unit_cost"
                    type="number"
                    step="0.01"
                    value={receiptForm.unit_cost}
                    onChange={(e) => setReceiptForm({...receiptForm, unit_cost: e.target.value})}
                    placeholder="Harga per unit"
                    required
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="reference_number">Nomor Referensi</Label>
                  <Input
                    id="reference_number"
                    value={receiptForm.reference_number}
                    onChange={(e) => setReceiptForm({...receiptForm, reference_number: e.target.value})}
                    placeholder="PO Number, Invoice, dll"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="receipt_notes">Catatan</Label>
                  <Textarea
                    id="receipt_notes"
                    value={receiptForm.notes}
                    onChange={(e) => setReceiptForm({...receiptForm, notes: e.target.value})}
                    placeholder="Catatan penerimaan"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsReceiptDialogOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Terima Barang'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Adjustment Dialog */}
        <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Koreksi Stok</DialogTitle>
              <DialogDescription>
                Sesuaikan stok untuk selisih fisik, kerusakan, atau kadaluarsa
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAdjustment}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="adjustment_item">Item</Label>
                  <Select
                    value={adjustmentForm.item_id}
                    onValueChange={(value) => setAdjustmentForm({...adjustmentForm, item_id: value})}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih item" />
                    </SelectTrigger>
                    <SelectContent>
                      <optgroup label="Gudang">
                        {warehouseInventory.map(item => (
                          <SelectItem key={`w-${item.id}`} value={item.id.toString()}>
                            [Gudang] {item.name} (Stok: {item.quantity})
                          </SelectItem>
                        ))}
                      </optgroup>
                      <optgroup label="Dapur">
                        {kitchenInventory.map(item => (
                          <SelectItem key={`k-${item.id}`} value={item.id.toString()}>
                            [Dapur] {item.name} (Stok: {item.quantity})
                          </SelectItem>
                        ))}
                      </optgroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="adjustment_quantity">Jumlah Koreksi</Label>
                  <Input
                    id="adjustment_quantity"
                    type="number"
                    step="0.01"
                    value={adjustmentForm.quantity}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, quantity: e.target.value})}
                    placeholder="Gunakan minus (-) untuk pengurangan"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Contoh: 10 untuk tambah, -10 untuk kurang
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="adjustment_notes">Alasan Koreksi</Label>
                  <Textarea
                    id="adjustment_notes"
                    value={adjustmentForm.notes}
                    onChange={(e) => setAdjustmentForm({...adjustmentForm, notes: e.target.value})}
                    placeholder="Jelaskan alasan koreksi stok"
                    rows={3}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAdjustmentDialogOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Koreksi'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}


export default function StockMovementsPage() {
  return (
    <Suspense fallback={<div className="container mx-auto p-8">Loading...</div>}>
      <StockMovementsContent />
    </Suspense>
  )
}
