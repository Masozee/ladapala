'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  DeliveryTruck01Icon,
  Delete02Icon,
  Edit01Icon,
  PackageReceiveIcon,
  MessageAdd01Icon
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { api, PurchaseOrder, PurchaseOrderItem } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

export default function PurchaseOrderDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { staff } = useAuth()
  const { toast } = useToast()

  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)

  // Receive modal state
  const [showReceiveModal, setShowReceiveModal] = useState(false)
  const [actualDeliveryDate, setActualDeliveryDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [receivedItems, setReceivedItems] = useState<{
    [key: number]: {
      quantity_received: number
      expiry_date: string
      manufacturing_date: string
    }
  }>({})

  useEffect(() => {
    fetchPurchaseOrder()
  }, [params.id])

  const fetchPurchaseOrder = async () => {
    try {
      setIsLoading(true)
      const data = await api.getPurchaseOrder(Number(params.id))
      setPurchaseOrder(data)

      // Initialize received items with ordered quantities and default dates
      const initialReceived: { [key: number]: { quantity_received: number; expiry_date: string; manufacturing_date: string } } = {}
      const defaultExpiryDate = new Date()
      defaultExpiryDate.setMonth(defaultExpiryDate.getMonth() + 6) // Default 6 months from now

      data.items.forEach(item => {
        initialReceived[item.id] = {
          quantity_received: parseFloat(item.quantity),
          expiry_date: defaultExpiryDate.toISOString().split('T')[0],
          manufacturing_date: new Date().toISOString().split('T')[0]
        }
      })
      setReceivedItems(initialReceived)
    } catch (error) {
      console.error('Error fetching purchase order:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data purchase order",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!purchaseOrder) return

    try {
      setIsActionLoading(true)
      await api.submitPurchaseOrder(purchaseOrder.id)
      toast({
        title: "Berhasil",
        description: "Purchase order berhasil diajukan"
      })
      fetchPurchaseOrder()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Gagal mengajukan purchase order",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!purchaseOrder) return

    try {
      setIsActionLoading(true)
      await api.approvePurchaseOrder(purchaseOrder.id)
      toast({
        title: "Berhasil",
        description: "Purchase order berhasil disetujui"
      })
      fetchPurchaseOrder()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Gagal menyetujui purchase order",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleReceive = async () => {
    if (!purchaseOrder) return

    try {
      setIsActionLoading(true)

      // Build received items array with expiry dates
      const receivedItemsArray = Object.entries(receivedItems).map(([itemId, data]) => ({
        item_id: parseInt(itemId),
        quantity_received: data.quantity_received,
        expiry_date: data.expiry_date,
        manufacturing_date: data.manufacturing_date || undefined
      }))

      await api.receivePurchaseOrder(purchaseOrder.id, {
        actual_delivery_date: actualDeliveryDate,
        received_items: receivedItemsArray
      })

      toast({
        title: "Berhasil",
        description: "Purchase order berhasil diterima dan stok telah diperbarui"
      })

      setShowReceiveModal(false)
      fetchPurchaseOrder()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Gagal menerima purchase order",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!purchaseOrder) return

    if (!confirm('Apakah Anda yakin ingin membatalkan purchase order ini?')) {
      return
    }

    try {
      setIsActionLoading(true)
      await api.cancelPurchaseOrder(purchaseOrder.id)
      toast({
        title: "Berhasil",
        description: "Purchase order berhasil dibatalkan"
      })
      fetchPurchaseOrder()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Gagal membatalkan purchase order",
        variant: "destructive"
      })
    } finally {
      setIsActionLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Draft', className: 'bg-gray-500' },
      SUBMITTED: { label: 'Diajukan', className: 'bg-blue-500' },
      APPROVED: { label: 'Disetujui', className: 'bg-green-500' },
      RECEIVED: { label: 'Diterima', className: 'bg-emerald-500' },
      CANCELLED: { label: 'Dibatalkan', className: 'bg-red-500' },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-500'
    }

    return <Badge className={`${config.className} text-white`}>{config.label}</Badge>
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return `Rp ${num.toLocaleString('id-ID')}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Memuat data...</p>
      </div>
    )
  }

  if (!purchaseOrder) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Purchase order tidak ditemukan</p>
      </div>
    )
  }

  const isManager = staff?.role === 'MANAGER' || staff?.role === 'ADMIN'

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          size="sm"
          className="rounded"
          onClick={() => router.back()}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={18} strokeWidth={2} className="mr-2" />
          Kembali
        </Button>

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{purchaseOrder.po_number}</h1>
            <p className="text-muted-foreground">Detail Purchase Order</p>
          </div>
          <div className="flex gap-2">
            {purchaseOrder.status === 'DRAFT' && (
              <>
                <Button
                  variant="outline"
                  className="rounded"
                  onClick={() => router.push(`/office/stock/purchase-orders/${purchaseOrder.id}/edit`)}
                  disabled={isActionLoading}
                >
                  <HugeiconsIcon icon={Edit01Icon} size={18} strokeWidth={2} className="mr-2" />
                  Edit
                </Button>
                <Button
                  className="rounded bg-blue-500 hover:bg-blue-600"
                  onClick={handleSubmit}
                  disabled={isActionLoading}
                >
                  <HugeiconsIcon icon={MessageAdd01Icon} size={18} strokeWidth={2} className="mr-2" />
                  Ajukan
                </Button>
              </>
            )}

            {purchaseOrder.status === 'SUBMITTED' && isManager && (
              <Button
                className="rounded bg-green-500 hover:bg-green-600"
                onClick={handleApprove}
                disabled={isActionLoading}
              >
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} strokeWidth={2} className="mr-2" />
                Setujui
              </Button>
            )}

            {purchaseOrder.status === 'APPROVED' && (
              <Button
                className="rounded bg-emerald-500 hover:bg-emerald-600"
                onClick={() => setShowReceiveModal(true)}
                disabled={isActionLoading}
              >
                <HugeiconsIcon icon={PackageReceiveIcon} size={18} strokeWidth={2} className="mr-2" />
                Terima Barang
              </Button>
            )}

            {['DRAFT', 'SUBMITTED', 'APPROVED'].includes(purchaseOrder.status) && (
              <Button
                variant="destructive"
                className="rounded"
                onClick={handleCancel}
                disabled={isActionLoading}
              >
                <HugeiconsIcon icon={Delete02Icon} size={18} strokeWidth={2} className="mr-2" />
                Batalkan
              </Button>
            )}
          </div>
        </div>

        {/* PO Information */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-white rounded-lg border">
            <CardHeader>
              <CardTitle>Informasi Supplier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nama Supplier</Label>
                <p className="font-medium">{purchaseOrder.supplier_name}</p>
              </div>
              {purchaseOrder.supplier_contact && (
                <div>
                  <Label className="text-sm text-muted-foreground">Kontak Person</Label>
                  <p className="font-medium">{purchaseOrder.supplier_contact}</p>
                </div>
              )}
              {purchaseOrder.supplier_email && (
                <div>
                  <Label className="text-sm text-muted-foreground">Email</Label>
                  <p className="font-medium">{purchaseOrder.supplier_email}</p>
                </div>
              )}
              {purchaseOrder.supplier_phone && (
                <div>
                  <Label className="text-sm text-muted-foreground">Telepon</Label>
                  <p className="font-medium">{purchaseOrder.supplier_phone}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border">
            <CardHeader>
              <CardTitle>Informasi Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm text-muted-foreground">Status</Label>
                <div className="mt-1">{getStatusBadge(purchaseOrder.status)}</div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Tanggal Order</Label>
                <p className="font-medium">{formatDate(purchaseOrder.order_date)}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Tgl Pengiriman Diharapkan</Label>
                <p className="font-medium">{formatDate(purchaseOrder.expected_delivery_date)}</p>
              </div>
              {purchaseOrder.actual_delivery_date && (
                <div>
                  <Label className="text-sm text-muted-foreground">Tgl Pengiriman Aktual</Label>
                  <p className="font-medium">{formatDate(purchaseOrder.actual_delivery_date)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Staff Information */}
        <Card className="bg-white rounded-lg border">
          <CardHeader>
            <CardTitle>Informasi Staff</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-sm text-muted-foreground">Dibuat Oleh</Label>
              <p className="font-medium">{purchaseOrder.created_by_name || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Disetujui Oleh</Label>
              <p className="font-medium">{purchaseOrder.approved_by_name || '-'}</p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">Diterima Oleh</Label>
              <p className="font-medium">{purchaseOrder.received_by_name || '-'}</p>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card className="bg-white rounded-lg border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Daftar Item ({purchaseOrder.total_items} item)</CardTitle>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{formatCurrency(purchaseOrder.total_amount)}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Nama Item</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Jumlah</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Harga Satuan</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrder.items.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 border-b">
                      <TableCell className="font-medium py-4 px-6">
                        {item.inventory_item_name}
                      </TableCell>
                      <TableCell className="text-right py-4 px-6">
                        {parseFloat(item.quantity).toLocaleString('id-ID')} {item.inventory_item_unit}
                      </TableCell>
                      <TableCell className="text-right py-4 px-6">
                        {formatCurrency(item.unit_price)}
                      </TableCell>
                      <TableCell className="text-right font-semibold py-4 px-6">
                        {formatCurrency(item.total_price || '0')}
                      </TableCell>
                      <TableCell className="text-muted-foreground py-4 px-6">
                        {item.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Notes and Terms */}
        {(purchaseOrder.notes || purchaseOrder.terms_and_conditions) && (
          <div className="grid gap-6 md:grid-cols-2">
            {purchaseOrder.notes && (
              <Card className="bg-white rounded-lg border">
                <CardHeader>
                  <CardTitle>Catatan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{purchaseOrder.notes}</p>
                </CardContent>
              </Card>
            )}

            {purchaseOrder.terms_and_conditions && (
              <Card className="bg-white rounded-lg border">
                <CardHeader>
                  <CardTitle>Syarat & Ketentuan</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{purchaseOrder.terms_and_conditions}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      {/* Receive Modal */}
      <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terima Barang</DialogTitle>
            <DialogDescription>
              Konfirmasi penerimaan barang dan sesuaikan jumlah jika diperlukan
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <Label htmlFor="delivery-date">Tanggal Penerimaan Aktual</Label>
              <Input
                id="delivery-date"
                type="date"
                value={actualDeliveryDate}
                onChange={(e) => setActualDeliveryDate(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label>Item yang Diterima</Label>
              <div className="mt-2 rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold">Item</TableHead>
                      <TableHead className="font-semibold text-right">Dipesan</TableHead>
                      <TableHead className="font-semibold text-right">Diterima</TableHead>
                      <TableHead className="font-semibold">Tgl. Kadaluarsa</TableHead>
                      <TableHead className="font-semibold">Tgl. Produksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrder.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.inventory_item_name}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {parseFloat(item.quantity).toLocaleString('id-ID')} {item.inventory_item_unit}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            step="0.01"
                            value={receivedItems[item.id]?.quantity_received || 0}
                            onChange={(e) => setReceivedItems({
                              ...receivedItems,
                              [item.id]: {
                                ...receivedItems[item.id],
                                quantity_received: parseFloat(e.target.value) || 0
                              }
                            })}
                            className="w-32 ml-auto"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={receivedItems[item.id]?.expiry_date || ''}
                            onChange={(e) => setReceivedItems({
                              ...receivedItems,
                              [item.id]: {
                                ...receivedItems[item.id],
                                expiry_date: e.target.value
                              }
                            })}
                            className="w-40"
                            required
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="date"
                            value={receivedItems[item.id]?.manufacturing_date || ''}
                            onChange={(e) => setReceivedItems({
                              ...receivedItems,
                              [item.id]: {
                                ...receivedItems[item.id],
                                manufacturing_date: e.target.value
                              }
                            })}
                            className="w-40"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                * Tanggal kadaluarsa wajib diisi untuk setiap item
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReceiveModal(false)}
              disabled={isActionLoading}
            >
              Batal
            </Button>
            <Button
              onClick={handleReceive}
              disabled={isActionLoading}
              className="bg-emerald-500 hover:bg-emerald-600"
            >
              {isActionLoading ? 'Memproses...' : 'Konfirmasi Penerimaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RoleGuard>
  )
}
