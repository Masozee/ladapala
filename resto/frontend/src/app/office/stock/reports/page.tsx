'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Analytics01Icon,
  Package01Icon,
  Alert01Icon,
  Download01Icon,
  Calendar01Icon,
  AnalyticsDownIcon
} from "@hugeicons/core-free-icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { StockActionTabs } from "@/components/stock-action-tabs"
import { api, Inventory, InventoryTransaction } from "@/lib/api"

export default function StockReportsPage() {
  const router = useRouter()
  const { staff } = useAuth()

  const [inventory, setInventory] = useState<Inventory[]>([])
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [staff])

  const fetchData = async () => {
    if (!staff?.branch?.id) return

    try {
      setIsLoading(true)
      const [invData, transData] = await Promise.all([
        api.getAllInventory({ branch: staff.branch.id }),
        api.getInventoryTransactions({ branch: staff.branch.id })
      ])
      setInventory(invData)
      setTransactions(transData.results || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const lowStockItems = inventory.filter(item => item.needs_restock)
  const warehouseInventory = inventory.filter(item => item.location === 'WAREHOUSE')
  const kitchenInventory = inventory.filter(item => item.location === 'KITCHEN')

  const totalValue = inventory.reduce((acc, item) => acc + (item.quantity * parseFloat(item.average_cost || '0')), 0)
  const warehouseValue = warehouseInventory.reduce((acc, item) => acc + (item.quantity * parseFloat(item.average_cost || '0')), 0)
  const kitchenValue = kitchenInventory.reduce((acc, item) => acc + (item.quantity * parseFloat(item.average_cost || '0')), 0)

  const todayTransactions = transactions.filter(t => {
    const transDate = new Date(t.created_at)
    const today = new Date()
    return transDate.toDateString() === today.toDateString()
  })

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Laporan Stok</h1>
            <p className="text-muted-foreground">Ringkasan dan analisis inventori</p>
          </div>
          <Button className="rounded bg-[#58ff34] hover:bg-[#4de82a]">
            <HugeiconsIcon icon={Download01Icon} size={18} strokeWidth={2} className="mr-2" />
            Export PDF
          </Button>
        </div>

        {/* Quick Action Tabs */}
        <StockActionTabs />

        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="bg-white rounded-lg border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Item</CardTitle>
              <HugeiconsIcon icon={Package01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{inventory.length}</div>
              <p className="text-xs text-muted-foreground">Semua lokasi</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nilai Total</CardTitle>
              <HugeiconsIcon icon={AnalyticsDownIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {totalValue.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground">Total inventori</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
              <HugeiconsIcon icon={Alert01Icon} size={16} strokeWidth={2} className="text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {lowStockItems.length}
              </div>
              <p className="text-xs text-muted-foreground">Perlu restock</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
              <HugeiconsIcon icon={Calendar01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayTransactions.length}</div>
              <p className="text-xs text-muted-foreground">Pergerakan stok</p>
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        {lowStockItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <HugeiconsIcon icon={Alert01Icon} size={20} strokeWidth={2} className="text-yellow-500" />
                  Item Stok Rendah
                </h2>
                <p className="text-sm text-muted-foreground">Item yang perlu segera direstock</p>
              </div>
              <Badge className="bg-yellow-500">{lowStockItems.length} Item</Badge>
            </div>
            <div className="rounded-lg border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Nama Item</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Lokasi</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Stok Saat Ini</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Min. Stok</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Kekurangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lowStockItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 border-b">
                      <TableCell className="font-medium py-4 px-6">{item.name}</TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge variant={item.location === 'WAREHOUSE' ? 'default' : 'secondary'}>
                          {item.location === 'WAREHOUSE' ? 'Gudang' : 'Dapur'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-red-600 py-4 px-6">
                        {parseFloat(item.quantity).toLocaleString('id-ID')} {item.unit}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground py-4 px-6">
                        {item.min_quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-yellow-600 py-4 px-6">
                        {(item.min_quantity - parseFloat(item.quantity)).toLocaleString('id-ID')} {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Location Breakdown */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="bg-white rounded-lg border">
            <CardHeader>
              <CardTitle>Stok Gudang</CardTitle>
              <CardDescription>{warehouseInventory.length} item</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Item</span>
                  <span className="text-sm font-semibold">{warehouseInventory.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Nilai Total</span>
                  <span className="text-sm font-semibold">
                    Rp {warehouseValue.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stok Rendah</span>
                  <span className="text-sm font-semibold text-yellow-600">
                    {warehouseInventory.filter(i => i.needs_restock).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border">
            <CardHeader>
              <CardTitle>Stok Dapur</CardTitle>
              <CardDescription>{kitchenInventory.length} item</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Item</span>
                  <span className="text-sm font-semibold">{kitchenInventory.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Nilai Total</span>
                  <span className="text-sm font-semibold">
                    Rp {kitchenValue.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Stok Rendah</span>
                  <span className="text-sm font-semibold text-yellow-600">
                    {kitchenInventory.filter(i => i.needs_restock).length}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Transaksi Terbaru</h2>
              <p className="text-sm text-muted-foreground">10 transaksi terakhir</p>
            </div>
          </div>
          {transactions.length === 0 ? (
            <Card className="bg-white rounded-lg border">
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  Belum ada transaksi
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Tanggal</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Item</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Jenis</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Jumlah</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Catatan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 10).map((transaction) => (
                    <TableRow key={transaction.id} className="hover:bg-gray-50 border-b">
                      <TableCell className="py-4 px-6">
                        {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                      </TableCell>
                      <TableCell className="font-medium py-4 px-6">
                        {inventory.find(i => i.id === transaction.item)?.name || '-'}
                      </TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge
                          variant={
                            transaction.transaction_type === 'RECEIPT' ? 'default' :
                            transaction.transaction_type === 'TRANSFER_IN' ? 'secondary' :
                            transaction.transaction_type === 'TRANSFER_OUT' ? 'outline' :
                            'destructive'
                          }
                        >
                          {transaction.transaction_type === 'RECEIPT' && 'Penerimaan'}
                          {transaction.transaction_type === 'TRANSFER_IN' && 'Transfer Masuk'}
                          {transaction.transaction_type === 'TRANSFER_OUT' && 'Transfer Keluar'}
                          {transaction.transaction_type === 'ADJUSTMENT' && 'Koreksi'}
                          {transaction.transaction_type === 'USAGE' && 'Pemakaian'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold py-4 px-6">
                        {parseFloat(transaction.quantity).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-muted-foreground py-4 px-6">
                        {transaction.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  )
}
