"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  AlertCircleIcon,
  Delete02Icon,
  PackageIcon,
  Calendar03Icon
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
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
import { api, InventoryBatch } from "@/lib/api"

export default function ExpiryManagementPage() {
  const { staff } = useAuth()
  const { toast } = useToast()

  const [expiringBatches, setExpiringBatches] = useState<InventoryBatch[]>([])
  const [expiredBatches, setExpiredBatches] = useState<InventoryBatch[]>([])
  const [allBatches, setAllBatches] = useState<InventoryBatch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("expiring")

  // Dispose modal state
  const [showDisposeModal, setShowDisposeModal] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState<InventoryBatch | null>(null)
  const [disposalMethod, setDisposalMethod] = useState("WASTE")
  const [disposalNotes, setDisposalNotes] = useState("")
  const [isDisposing, setIsDisposing] = useState(false)

  useEffect(() => {
    fetchBatches()
  }, [])

  const fetchBatches = async () => {
    try {
      setIsLoading(true)
      const [expiring, expired, all] = await Promise.all([
        api.getExpiringBatches(),
        api.getExpiredBatches(),
        api.getInventoryBatches({ ordering: 'expiry_date' })
      ])

      setExpiringBatches(expiring)
      setExpiredBatches(expired)
      setAllBatches(all.results || all as any)
    } catch (error) {
      console.error('Error fetching batches:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data batch kadaluarsa",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDisposeClick = (batch: InventoryBatch) => {
    setSelectedBatch(batch)
    setDisposalMethod("WASTE")
    setDisposalNotes("")
    setShowDisposeModal(true)
  }

  const handleDispose = async () => {
    if (!selectedBatch) return

    try {
      setIsDisposing(true)
      await api.disposeBatch(selectedBatch.id, {
        disposal_method: disposalMethod,
        disposal_notes: disposalNotes
      })

      toast({
        title: "Berhasil",
        description: `Batch ${selectedBatch.batch_number} berhasil dibuang`
      })

      setShowDisposeModal(false)
      fetchBatches()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal membuang batch",
        variant: "destructive"
      })
    } finally {
      setIsDisposing(false)
    }
  }

  const getExpiryBadge = (batch: InventoryBatch) => {
    const days = batch.days_until_expiry

    if (days < 0) {
      return <Badge variant="destructive">Kadaluarsa</Badge>
    } else if (days <= 7) {
      return <Badge className="bg-orange-500 hover:bg-orange-600">{days} hari</Badge>
    } else if (days <= 14) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">{days} hari</Badge>
    } else {
      return <Badge className="bg-green-500 hover:bg-green-600">{days} hari</Badge>
    }
  }

  const renderBatchTable = (batches: InventoryBatch[]) => (
    <div className="rounded-lg border bg-white overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 hover:bg-gray-50">
            <TableHead className="font-semibold">Batch Number</TableHead>
            <TableHead className="font-semibold">Item</TableHead>
            <TableHead className="font-semibold text-right">Sisa Qty</TableHead>
            <TableHead className="font-semibold">Tgl. Kadaluarsa</TableHead>
            <TableHead className="font-semibold">Tgl. Terima</TableHead>
            <TableHead className="font-semibold text-center">Status</TableHead>
            <TableHead className="font-semibold text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Tidak ada data batch
              </TableCell>
            </TableRow>
          ) : (
            batches.map((batch) => (
              <TableRow key={batch.id} className="hover:bg-gray-50">
                <TableCell className="font-mono text-sm">{batch.batch_number}</TableCell>
                <TableCell className="font-medium">{batch.inventory_name}</TableCell>
                <TableCell className="text-right">
                  {parseFloat(batch.quantity_remaining).toLocaleString('id-ID')} {batch.inventory_unit}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm">
                      {new Date(batch.expiry_date).toLocaleDateString('id-ID', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    {getExpiryBadge(batch)}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(batch.received_date).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant={
                      batch.status === 'EXPIRED' ? 'destructive' :
                      batch.status === 'EXPIRING' ? 'secondary' :
                      batch.status === 'DISPOSED' ? 'outline' :
                      'default'
                    }
                  >
                    {batch.status === 'ACTIVE' && 'Aktif'}
                    {batch.status === 'EXPIRING' && 'Segera Expired'}
                    {batch.status === 'EXPIRED' && 'Kadaluarsa'}
                    {batch.status === 'DISPOSED' && 'Dibuang'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {batch.status !== 'DISPOSED' && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDisposeClick(batch)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} className="mr-2" />
                      Buang
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Kadaluarsa</h1>
            <p className="text-muted-foreground">
              Pantau dan kelola stok yang segera atau sudah kadaluarsa
            </p>
          </div>
        </div>

        <StockActionTabs />

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Segera Kadaluarsa</CardTitle>
              <HugeiconsIcon icon={AlertCircleIcon} className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiringBatches.length}</div>
              <p className="text-xs text-muted-foreground">
                Batch dalam 30 hari
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sudah Kadaluarsa</CardTitle>
              <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{expiredBatches.length}</div>
              <p className="text-xs text-muted-foreground">
                Perlu segera dibuang
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Batch Aktif</CardTitle>
              <HugeiconsIcon icon={PackageIcon} className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allBatches.filter(b => b.status === 'ACTIVE' || b.status === 'EXPIRING').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Batch dalam sistem
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="expiring" className="gap-2">
              <HugeiconsIcon icon={AlertCircleIcon} size={16} />
              Segera Kadaluarsa ({expiringBatches.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="gap-2">
              <HugeiconsIcon icon={Delete02Icon} size={16} />
              Sudah Kadaluarsa ({expiredBatches.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="gap-2">
              <HugeiconsIcon icon={PackageIcon} size={16} />
              Semua Batch
            </TabsTrigger>
          </TabsList>

          <TabsContent value="expiring" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-gray-500">Loading...</p>
                </CardContent>
              </Card>
            ) : (
              renderBatchTable(expiringBatches)
            )}
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-gray-500">Loading...</p>
                </CardContent>
              </Card>
            ) : (
              renderBatchTable(expiredBatches)
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <p className="text-gray-500">Loading...</p>
                </CardContent>
              </Card>
            ) : (
              renderBatchTable(allBatches)
            )}
          </TabsContent>
        </Tabs>

        {/* Dispose Modal */}
        <Dialog open={showDisposeModal} onOpenChange={setShowDisposeModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Buang Batch</DialogTitle>
              <DialogDescription>
                Konfirmasi pembuangan batch {selectedBatch?.batch_number}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Informasi Batch:</p>
                <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
                  <p><span className="font-medium">Item:</span> {selectedBatch?.inventory_name}</p>
                  <p><span className="font-medium">Jumlah:</span> {selectedBatch?.quantity_remaining} {selectedBatch?.inventory_unit}</p>
                  <p><span className="font-medium">Kadaluarsa:</span> {selectedBatch?.expiry_date && new Date(selectedBatch.expiry_date).toLocaleDateString('id-ID')}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="disposal-method">Metode Pembuangan</Label>
                <Select value={disposalMethod} onValueChange={setDisposalMethod}>
                  <SelectTrigger id="disposal-method" className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WASTE">Buang ke Sampah</SelectItem>
                    <SelectItem value="DONATED">Donasi</SelectItem>
                    <SelectItem value="RETURNED">Return ke Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="disposal-notes">Catatan</Label>
                <Textarea
                  id="disposal-notes"
                  placeholder="Alasan pembuangan..."
                  value={disposalNotes}
                  onChange={(e) => setDisposalNotes(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDisposeModal(false)}
                disabled={isDisposing}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDispose}
                disabled={isDisposing}
              >
                {isDisposing ? 'Memproses...' : 'Konfirmasi Pembuangan'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </RoleGuard>
  )
}
