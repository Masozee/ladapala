'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  DeliveryTruck01Icon,
  Search01Icon,
  FilterIcon
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
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { StockActionTabs } from "@/components/stock-action-tabs"
import { api, PurchaseOrder } from "@/lib/api"

export default function PurchaseOrdersPage() {
  const router = useRouter()
  const { staff } = useAuth()

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchPurchaseOrders()
  }, [staff, statusFilter])

  const fetchPurchaseOrders = async () => {
    if (!staff?.branch?.id) return

    try {
      setIsLoading(true)
      const params: any = {
        branch: staff.branch.id,
        ordering: '-created_at'
      }

      if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }

      if (searchQuery) {
        params.search = searchQuery
      }

      const response = await api.getPurchaseOrders(params)
      setPurchaseOrders(response.results || [])
    } catch (error) {
      console.error('Error fetching purchase orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = () => {
    fetchPurchaseOrders()
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
      month: 'short',
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

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Purchase Order</h1>
            <p className="text-muted-foreground">Kelola pesanan pembelian barang</p>
          </div>
          <Button
            className="rounded bg-[#58ff34] hover:bg-[#4de82a] text-black"
            onClick={() => router.push('/office/stock/purchase-orders/create')}
          >
            <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} className="mr-2" />
            Buat PO Baru
          </Button>
        </div>

        {/* Quick Action Tabs */}
        <StockActionTabs />

        {/* Search & Filter */}
        <div className="flex justify-end gap-3">
          <div className="relative w-80">
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              strokeWidth={2}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Cari PO Number atau Supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Semua Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Diajukan</SelectItem>
              <SelectItem value="APPROVED">Disetujui</SelectItem>
              <SelectItem value="RECEIVED">Diterima</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Purchase Orders Table */}
        {purchaseOrders.length === 0 ? (
          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardContent className="py-12">
              <div className="text-center">
                <HugeiconsIcon icon={DeliveryTruck01Icon} size={48} strokeWidth={2} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Belum ada purchase order</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-50">
                  <TableHead className="font-semibold text-gray-900 py-4 px-6">PO Number</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4 px-6">Supplier</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4 px-6">Status</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4 px-6">Tanggal Order</TableHead>
                  <TableHead className="font-semibold text-gray-900 py-4 px-6">Tgl Pengiriman</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total Item</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total Harga</TableHead>
                  <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseOrders.map((po) => (
                  <TableRow key={po.id} className="hover:bg-gray-50 border-b">
                    <TableCell className="font-medium py-4 px-6">
                      {po.po_number}
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      <div>
                        <div className="font-medium">{po.supplier_name}</div>
                        {po.supplier_contact && (
                          <div className="text-sm text-muted-foreground">{po.supplier_contact}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-6">
                      {getStatusBadge(po.status)}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-muted-foreground">
                      {formatDate(po.order_date)}
                    </TableCell>
                    <TableCell className="py-4 px-6 text-muted-foreground">
                      {formatDate(po.expected_delivery_date)}
                    </TableCell>
                    <TableCell className="text-right py-4 px-6">
                      {po.total_items} item
                    </TableCell>
                    <TableCell className="text-right font-semibold py-4 px-6">
                      {formatCurrency(po.total_amount)}
                    </TableCell>
                    <TableCell className="text-center py-4 px-6">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded"
                        onClick={() => router.push(`/office/stock/purchase-orders/${po.id}`)}
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total PO</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{purchaseOrders.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Nilai</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(
                  purchaseOrders.reduce((sum, po) => sum + parseFloat(po.total_amount), 0)
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Menunggu Persetujuan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {purchaseOrders.filter(po => po.status === 'SUBMITTED').length}
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Siap Diterima</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {purchaseOrders.filter(po => po.status === 'APPROVED').length}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleGuard>
  )
}
