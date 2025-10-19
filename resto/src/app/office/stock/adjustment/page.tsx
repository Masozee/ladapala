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
import { api, type Inventory } from "@/lib/api"

export default function AdjustmentPage() {
  const router = useRouter()
  const { staff } = useAuth()
  const { toast } = useToast()

  const [warehouseInventory, setWarehouseInventory] = useState<Inventory[]>([])
  const [kitchenInventory, setKitchenInventory] = useState<Inventory[]>([])
  const [activeTab, setActiveTab] = useState("warehouse")
  const [submitting, setSubmitting] = useState(false)

  const [adjustmentForm, setAdjustmentForm] = useState({
    item_id: '',
    adjustment_type: 'reduce' as 'add' | 'reduce',
    quantity: '',
    reason: '',
    notes: ''
  })

  useEffect(() => {
    fetchInventory()
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

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

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

      if (adjustmentForm.adjustment_type === 'reduce' && Math.abs(adjustmentQty) > item.quantity) {
        toast({
          title: "Error",
          description: `Stok tidak cukup untuk dikurangi. Tersedia: ${item.quantity} ${item.unit}`,
          variant: "destructive"
        })
        return
      }

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

      // Reset form
      setAdjustmentForm({
        item_id: '',
        adjustment_type: 'reduce',
        quantity: '',
        reason: '',
        notes: ''
      })

      fetchInventory()
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
            <h1 className="text-3xl font-bold">Koreksi Stok</h1>
            <p className="text-muted-foreground">Sesuaikan stok untuk selisih fisik, kerusakan, atau kadaluarsa</p>
          </div>
        </div>

        {/* Quick Action Tabs */}
        <StockActionTabs />

        {/* Adjustment Form */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white rounded-lg border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={Edit01Icon} size={24} strokeWidth={2} className="text-purple-600" />
                Form Koreksi Stok
              </CardTitle>
              <CardDescription>
                Tambah atau kurangi stok dengan alasan yang jelas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAdjustment} className="space-y-4">
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
                  className="w-full rounded bg-[#58ff34] hover:bg-[#4de82a]"
                  disabled={submitting}
                >
                  <HugeiconsIcon icon={Edit01Icon} size={18} strokeWidth={2} className="mr-2" />
                  {submitting ? 'Menyimpan...' : 'Simpan Koreksi'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <div className="space-y-4">
            <Card className="bg-purple-50 rounded-lg border-purple-200">
              <CardHeader>
                <CardTitle className="text-purple-900">Informasi Koreksi Stok</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2"></div>
                  <p className="text-purple-900">
                    <strong>Kurangi Stok:</strong> Untuk barang rusak, kadaluarsa, hilang, atau selisih negatif
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2"></div>
                  <p className="text-purple-900">
                    <strong>Tambah Stok:</strong> Untuk koreksi kesalahan input atau selisih positif
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2"></div>
                  <p className="text-purple-900">
                    <strong>Audit Trail:</strong> Semua koreksi tercatat dengan alasan untuk audit
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-600 mt-2"></div>
                  <p className="text-purple-900">
                    <strong>Validasi:</strong> Pengurangan stok hanya bisa dilakukan jika stok tersedia
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-yellow-50 rounded-lg border-yellow-200">
              <CardHeader>
                <CardTitle className="text-yellow-900 flex items-center gap-2">
                  <HugeiconsIcon icon={Alert01Icon} size={20} strokeWidth={2} />
                  Peringatan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-yellow-900">
                <p>
                  Koreksi stok akan langsung mempengaruhi jumlah stok. Pastikan:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Alasan koreksi jelas dan akurat</li>
                  <li>Jumlah koreksi sudah diverifikasi</li>
                  <li>Catatan detail untuk audit trail</li>
                </ul>
              </CardContent>
            </Card>

            {selectedItem && adjustmentForm.quantity && (
              <Card className="bg-green-50 rounded-lg border-green-200">
                <CardHeader>
                  <CardTitle className="text-green-900">Ringkasan Koreksi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-green-700">Item:</span>
                    <span className="font-semibold text-green-900">{selectedItem.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Lokasi:</span>
                    <span className="font-semibold text-green-900">
                      {selectedItem.location === 'WAREHOUSE' ? 'Gudang' : 'Dapur'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Jenis:</span>
                    <span className="font-semibold text-green-900">
                      {adjustmentForm.adjustment_type === 'reduce' ? 'Pengurangan (-)' : 'Penambahan (+)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Jumlah:</span>
                    <span className="font-semibold text-green-900">
                      {adjustmentForm.adjustment_type === 'reduce' ? '-' : '+'}
                      {parseFloat(adjustmentForm.quantity).toLocaleString('id-ID')} {selectedItem.unit}
                    </span>
                  </div>
                  <div className="border-t border-green-300 my-2"></div>
                  <div className="flex justify-between">
                    <span className="text-green-700">Stok Saat Ini:</span>
                    <span className="font-semibold text-green-900">
                      {parseFloat(selectedItem.quantity.toString()).toLocaleString('id-ID')} {selectedItem.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-base">
                    <span className="text-green-700 font-semibold">Stok Setelah Koreksi:</span>
                    <span className="font-bold text-green-900">
                      {(
                        parseFloat(selectedItem.quantity.toString()) +
                        (adjustmentForm.adjustment_type === 'reduce' ? -1 : 1) * parseFloat(adjustmentForm.quantity)
                      ).toLocaleString('id-ID')} {selectedItem.unit}
                    </span>
                  </div>
                  {adjustmentForm.reason && (
                    <>
                      <div className="border-t border-green-300 my-2"></div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Alasan:</span>
                        <span className="font-semibold text-green-900">{adjustmentForm.reason}</span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
