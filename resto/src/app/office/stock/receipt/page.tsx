'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PackageReceiveIcon,
  CheckmarkCircle01Icon,
  DeliveryTruck01Icon,
  InformationCircleIcon,
} from "@hugeicons/core-free-icons"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { StockActionTabs } from "@/components/stock-action-tabs"
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
import { api, type PurchaseOrder, type InventoryTransaction } from "@/lib/api"

export default function ReceiptPage() {
  const router = useRouter()
  const { staff } = useAuth()
  const { toast } = useToast()

  const [approvedPOs, setApprovedPOs] = useState<PurchaseOrder[]>([])
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [receiptHistory, setReceiptHistory] = useState<InventoryTransaction[]>([])
  const [receivedQuantities, setReceivedQuantities] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [infoDialogOpen, setInfoDialogOpen] = useState(false)

  useEffect(() => {
    fetchApprovedPOs()
    fetchReceiptHistory()
  }, [staff])

  const fetchApprovedPOs = async () => {
    if (!staff?.branch?.id) return

    try {
      const response = await api.getPurchaseOrders({
        branch: staff.branch.id,
        status: 'APPROVED',
        ordering: '-created_at'
      })
      setApprovedPOs(response.results || [])
    } catch (error) {
      console.error('Error fetching approved POs:', error)
    }
  }

  const fetchReceiptHistory = async () => {
    if (!staff?.branch?.id) return

    try {
      const response = await api.getInventoryTransactions({
        branch: staff.branch.id,
        transaction_type: 'IN',
        ordering: '-created_at',
        limit: 50
      })
      setReceiptHistory(response.results || [])
    } catch (error) {
      console.error('Error fetching receipt history:', error)
    }
  }

  const initializeReceivedQuantities = (po: PurchaseOrder) => {
    const quantities: Record<number, string> = {}
    po.items?.forEach(item => {
      quantities[item.id] = item.quantity // Default to full quantity
    })
    setReceivedQuantities(quantities)
  }

  const handleSelectPO = (po: PurchaseOrder) => {
    setSelectedPO(po)
    initializeReceivedQuantities(po)
  }

  const handleQuantityChange = (itemId: number, value: string) => {
    setReceivedQuantities(prev => ({
      ...prev,
      [itemId]: value
    }))
  }

  const getTotalReceivedValue = () => {
    if (!selectedPO) return 0
    return selectedPO.items?.reduce((total, item) => {
      const receivedQty = parseFloat(receivedQuantities[item.id] || '0')
      const unitPrice = parseFloat(item.unit_price)
      return total + (receivedQty * unitPrice)
    }, 0) || 0
  }

  const getReceivedItemsCount = () => {
    if (!selectedPO) return 0
    return selectedPO.items?.filter(item => {
      const receivedQty = parseFloat(receivedQuantities[item.id] || '0')
      return receivedQty > 0
    }).length || 0
  }

  const handleReceivePO = async () => {
    if (!selectedPO) return

    // Validate at least one item has quantity > 0
    const hasItems = selectedPO.items?.some(item => {
      const receivedQty = parseFloat(receivedQuantities[item.id] || '0')
      return receivedQty > 0
    })

    if (!hasItems) {
      toast({
        title: "Error",
        description: "Minimal 1 item harus diterima dengan jumlah > 0",
        variant: "destructive"
      })
      return
    }

    // Validate quantities don't exceed ordered
    const invalidItems = selectedPO.items?.filter(item => {
      const receivedQty = parseFloat(receivedQuantities[item.id] || '0')
      const orderedQty = parseFloat(item.quantity)
      return receivedQty > orderedQty
    })

    if (invalidItems && invalidItems.length > 0) {
      toast({
        title: "Error",
        description: `Jumlah terima tidak boleh melebihi jumlah order untuk: ${invalidItems[0].inventory_item_name}`,
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)

    try {
      // Build received_items array (only items with qty > 0)
      const received_items = selectedPO.items
        ?.filter(item => {
          const receivedQty = parseFloat(receivedQuantities[item.id] || '0')
          return receivedQty > 0
        })
        .map(item => ({
          item_id: item.inventory_item,
          quantity_received: parseFloat(receivedQuantities[item.id])
        })) || []

      await api.receivePurchaseOrder(selectedPO.id, {
        actual_delivery_date: new Date().toISOString().split('T')[0],
        received_items
      })

      const receivedCount = received_items.length
      const totalItems = selectedPO.items?.length || 0

      toast({
        title: "Berhasil",
        description: `${receivedCount} dari ${totalItems} item berhasil diterima. Harga otomatis diupdate dengan moving average.`
      })

      setDialogOpen(false)
      setSelectedPO(null)
      setReceivedQuantities({})
      fetchApprovedPOs()
      fetchReceiptHistory()
    } catch (error: any) {
      console.error('Error receiving PO:', error)
      toast({
        title: "Error",
        description: error.message || "Gagal menerima Purchase Order",
        variant: "destructive"
      })
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
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Penerimaan Barang
              <Dialog open={infoDialogOpen} onOpenChange={setInfoDialogOpen}>
                <DialogTrigger asChild>
                  <button className="text-blue-600 hover:text-blue-700 transition-colors">
                    <HugeiconsIcon icon={InformationCircleIcon} size={28} strokeWidth={2} />
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-blue-900 flex items-center gap-2">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={24} strokeWidth={2} />
                      Sistem Moving Average Pricing
                    </DialogTitle>
                    <DialogDescription>
                      Informasi tentang sistem perhitungan harga rata-rata bergerak
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                      <p className="text-sm">
                        <strong className="text-blue-900">Update Otomatis:</strong> Saat menerima PO, harga rata-rata (cost_per_unit) otomatis diupdate menggunakan formula moving average
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                      <p className="text-sm">
                        <strong className="text-blue-900">Formula:</strong> (Stok Lama × Harga Lama + Stok Baru × Harga Baru) / Total Stok
                      </p>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-2 flex-shrink-0"></div>
                      <p className="text-sm">
                        <strong className="text-blue-900">Contoh:</strong> Stok 100 kg @ Rp 10,000 + Terima 50 kg @ Rp 12,000 = 150 kg @ Rp 10,667/kg
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </h1>
            <p className="text-muted-foreground">Terima Purchase Order dengan update harga otomatis (Moving Average)</p>
          </div>
        </div>

        {/* Quick Action Tabs */}
        <StockActionTabs />

        {/* Approved POs List */}
        <Card className="bg-white rounded-lg border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={DeliveryTruck01Icon} size={24} strokeWidth={2} className="text-green-600" />
                  Purchase Order Siap Diterima
                </CardTitle>
                <CardDescription>
                  PO yang sudah disetujui dan siap untuk penerimaan barang ({approvedPOs.length} PO)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {approvedPOs.length === 0 ? (
              <div className="text-center py-12 px-6">
                <HugeiconsIcon icon={PackageReceiveIcon} size={48} strokeWidth={1.5} className="mx-auto mb-2 opacity-30" />
                <p className="text-muted-foreground">Tidak ada PO yang siap diterima</p>
                <p className="text-sm text-muted-foreground mt-1">Buat Purchase Order baru di menu Purchase Orders</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">No. PO</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Supplier</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Tanggal Order</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total Item</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total Nilai</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Tgl. Kirim</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedPOs.map((po) => (
                      <TableRow key={po.id} className="hover:bg-gray-50 border-b">
                        <TableCell className="font-medium py-4 px-6">
                          <Badge variant="outline" className="font-mono">{po.po_number}</Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6">{po.supplier_name}</TableCell>
                        <TableCell className="py-4 px-6 whitespace-nowrap">
                          {new Date(po.order_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">{po.total_items} item</TableCell>
                        <TableCell className="text-right font-semibold py-4 px-6">
                          Rp {parseFloat(po.total_amount).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="py-4 px-6 whitespace-nowrap">
                          {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          <Badge className="bg-green-500 text-white">APPROVED</Badge>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6">
                          <Dialog open={dialogOpen && selectedPO?.id === po.id} onOpenChange={(open) => {
                            setDialogOpen(open)
                            if (!open) setSelectedPO(null)
                          }}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                className="rounded bg-[#58ff34] hover:bg-[#4de82a] text-black"
                                onClick={() => handleSelectPO(po)}
                              >
                                <HugeiconsIcon icon={PackageReceiveIcon} size={16} strokeWidth={2} className="mr-1" />
                                Terima
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <HugeiconsIcon icon={PackageReceiveIcon} size={24} strokeWidth={2} className="text-green-600" />
                                  Terima Purchase Order
                                </DialogTitle>
                                <DialogDescription>
                                  Konfirmasi penerimaan barang dari PO {po.po_number}
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4 mt-4">
                                {/* PO Details */}
                                <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">No. PO:</span>
                                    <span className="font-semibold">{po.po_number}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Supplier:</span>
                                    <span className="font-semibold">{po.supplier_name}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Item:</span>
                                    <span className="font-semibold">{po.total_items} item</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Total Nilai:</span>
                                    <span className="font-semibold">Rp {parseFloat(po.total_amount).toLocaleString('id-ID')}</span>
                                  </div>
                                </div>

                                {/* Items Preview */}
                                <div>
                                  <h4 className="font-semibold mb-2">Detail Item - Edit Jumlah Terima</h4>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    Ubah jumlah terima jika ada item yang tidak tersedia atau diterima sebagian
                                  </p>
                                  <div className="border rounded-lg overflow-hidden">
                                    <Table>
                                      <TableHeader>
                                        <TableRow className="bg-gray-50">
                                          <TableHead className="font-semibold">Item</TableHead>
                                          <TableHead className="font-semibold text-right">Qty Order</TableHead>
                                          <TableHead className="font-semibold text-right">Qty Terima</TableHead>
                                          <TableHead className="font-semibold text-right">Harga/Unit</TableHead>
                                          <TableHead className="font-semibold text-right">Total</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {po.items?.map((item) => {
                                          const receivedQty = parseFloat(receivedQuantities[item.id] || '0')
                                          const orderedQty = parseFloat(item.quantity)
                                          const unitPrice = parseFloat(item.unit_price)
                                          const isPartial = receivedQty < orderedQty && receivedQty > 0
                                          const isNone = receivedQty === 0

                                          return (
                                            <TableRow key={item.id} className={isNone ? 'bg-red-50' : isPartial ? 'bg-yellow-50' : ''}>
                                              <TableCell className="font-medium">{item.inventory_item_name}</TableCell>
                                              <TableCell className="text-right text-muted-foreground">
                                                {orderedQty.toLocaleString('id-ID')} {item.inventory_item_unit}
                                              </TableCell>
                                              <TableCell className="text-right">
                                                <Input
                                                  type="number"
                                                  step="0.01"
                                                  min="0"
                                                  max={item.quantity}
                                                  value={receivedQuantities[item.id] || ''}
                                                  onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                  className="w-24 text-right"
                                                />
                                              </TableCell>
                                              <TableCell className="text-right">
                                                Rp {unitPrice.toLocaleString('id-ID')}
                                              </TableCell>
                                              <TableCell className="text-right font-semibold">
                                                Rp {(receivedQty * unitPrice).toLocaleString('id-ID')}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        })}
                                      </TableBody>
                                    </Table>
                                  </div>

                                  {/* Summary */}
                                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                      <span className="text-blue-900">Item Diterima:</span>
                                      <span className="font-semibold text-blue-900">
                                        {getReceivedItemsCount()} dari {po.items?.length || 0} item
                                      </span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                      <span className="text-blue-900">Total Nilai Terima:</span>
                                      <span className="font-semibold text-blue-900">
                                        Rp {getTotalReceivedValue().toLocaleString('id-ID')}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Warning about Moving Average */}
                                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                                  <p className="text-sm text-blue-900">
                                    <strong>ℹ️ Perhatian:</strong> Menerima PO ini akan:
                                  </p>
                                  <ul className="text-sm text-blue-800 mt-2 space-y-1 ml-4 list-disc">
                                    <li>Menambah stok gudang sesuai qty PO</li>
                                    <li>Update harga rata-rata (cost_per_unit) dengan formula moving average</li>
                                    <li>Mencatat transaksi penerimaan untuk audit trail</li>
                                  </ul>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 pt-4">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1 rounded"
                                    onClick={() => {
                                      setDialogOpen(false)
                                      setSelectedPO(null)
                                    }}
                                    disabled={submitting}
                                  >
                                    Batal
                                  </Button>
                                  <Button
                                    type="button"
                                    className="flex-1 rounded bg-[#58ff34] hover:bg-[#4de82a] text-black"
                                    onClick={handleReceivePO}
                                    disabled={submitting}
                                  >
                                    <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} strokeWidth={2} className="mr-2" />
                                    {submitting ? 'Memproses...' : 'Konfirmasi Terima Barang'}
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Receipt History Table */}
        <Card className="bg-white rounded-lg border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Riwayat Penerimaan Barang</CardTitle>
                <CardDescription>50 penerimaan terakhir ke gudang</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {receiptHistory.length === 0 ? (
              <div className="text-center py-12 px-6">
                <HugeiconsIcon icon={PackageReceiveIcon} size={48} strokeWidth={1.5} className="mx-auto mb-2 opacity-30" />
                <p className="text-muted-foreground">Belum ada riwayat penerimaan</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Tanggal & Waktu</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Item</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Jumlah</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Harga/Unit</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total Nilai</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">No. Referensi</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Oleh</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receiptHistory.map((receipt) => (
                      <TableRow key={receipt.id} className="hover:bg-gray-50 border-b">
                        <TableCell className="py-4 px-6 whitespace-nowrap">
                          {new Date(receipt.created_at).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell className="font-medium py-4 px-6">{receipt.inventory_name}</TableCell>
                        <TableCell className="text-right font-semibold py-4 px-6 text-green-600">
                          +{parseFloat(receipt.quantity.toString()).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">
                          Rp {parseFloat(receipt.unit_cost).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right font-semibold py-4 px-6">
                          Rp {parseFloat(receipt.total_cost).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {receipt.reference_number ? (
                            <Badge variant="outline" className="font-mono">{receipt.reference_number}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground py-4 px-6">{receipt.performed_by_name}</TableCell>
                        <TableCell className="text-muted-foreground text-sm py-4 px-6 max-w-xs">
                          <div className="whitespace-normal break-words">
                            {receipt.notes || '-'}
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
