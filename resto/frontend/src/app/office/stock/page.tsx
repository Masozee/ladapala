"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Package01Icon,
  Alert01Icon,
  AnalyticsDownIcon,
  ArrowRight01Icon,
  Add01Icon,
  Download01Icon,
  Edit01Icon,
  PackageReceiveIcon,
  PackageSentIcon,
  FileEditIcon,
  Delete02Icon
} from "@hugeicons/core-free-icons"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { StockActionTabs } from "@/components/stock-action-tabs"
import { api, Inventory, InventoryTransaction } from "@/lib/api"

export default function StockDashboard() {
  const router = useRouter()
  const { staff } = useAuth()

  const [warehouseInventory, setWarehouseInventory] = useState<Inventory[]>([])
  const [kitchenInventory, setKitchenInventory] = useState<Inventory[]>([])
  const [lowStock, setLowStock] = useState<Inventory[]>([])
  const [recentTransactions, setRecentTransactions] = useState<InventoryTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("warehouse")

  const canModify = staff && ['ADMIN', 'MANAGER', 'WAREHOUSE'].includes(staff.role)

  useEffect(() => {
    fetchData()
  }, [staff])

  const fetchData = async () => {
    try {
      setIsLoading(true)

      // Fetch warehouse and kitchen inventory separately to avoid pagination issues
      const [warehouse, kitchen, lowStockRes, transactionsRes] = await Promise.all([
        api.getAllInventory({ branch: staff?.branch?.id, location: 'WAREHOUSE' }),
        api.getAllInventory({ branch: staff?.branch?.id, location: 'KITCHEN' }),
        api.getLowStockInventory(staff?.branch?.id),
        api.getInventoryTransactions({ branch: staff?.branch?.id })
      ])

      console.log('📦 Inventory fetched:', {
        total: warehouse.length + kitchen.length,
        warehouse: warehouse.length,
        kitchen: kitchen.length
      })

      setWarehouseInventory(warehouse)
      setKitchenInventory(kitchen)

      setLowStock(lowStockRes.results || [])
      setRecentTransactions((transactionsRes.results || []).slice(0, 10))
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const currentInventory = activeTab === "warehouse" ? warehouseInventory : kitchenInventory
  const totalValue = currentInventory.reduce((acc, item) =>
    acc + (item.quantity * parseFloat(item.cost_per_unit || '0')), 0
  )

  const todayTransactions = recentTransactions.filter(t => {
    const today = new Date().toISOString().split('T')[0]
    const txDate = new Date(t.created_at).toISOString().split('T')[0]
    return today === txDate
  }).length

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case "IN":
        return <Badge className="bg-green-500">Masuk</Badge>
      case "OUT":
        return <Badge className="bg-red-500">Keluar</Badge>
      case "ADJUST":
        return <Badge className="bg-blue-500">Koreksi</Badge>
      case "WASTE":
        return <Badge className="bg-orange-500">Rusak</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Memuat data...</p>
      </div>
    )
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE', 'CASHIER', 'KITCHEN']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Dashboard Stok</h1>
            <p className="text-muted-foreground">Sistem manajemen stok gudang dan dapur</p>
          </div>
        </div>

        {/* Quick Action Tabs */}
        <StockActionTabs />

        {/* Location Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
            <TabsTrigger value="warehouse" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
              <HugeiconsIcon icon={Package01Icon} size={16} strokeWidth={2} className="mr-2" />
              Gudang (Warehouse)
            </TabsTrigger>
            <TabsTrigger value="kitchen" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">
              <HugeiconsIcon icon={PackageSentIcon} size={16} strokeWidth={2} className="mr-2" />
              Dapur (Kitchen)
            </TabsTrigger>
          </TabsList>

          {/* Warehouse Tab */}
          <TabsContent value="warehouse" className="mt-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-white rounded-lg border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Item</CardTitle>
                  <HugeiconsIcon icon={Package01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{warehouseInventory.length}</div>
                  <p className="text-xs text-muted-foreground">Bahan baku mentah</p>
                </CardContent>
              </Card>

          <Card className="bg-white rounded-lg border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nilai Total</CardTitle>
              <HugeiconsIcon icon={AnalyticsDownIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {warehouseInventory.reduce((acc, item) => acc + (item.quantity * parseFloat(item.cost_per_unit || '0')), 0).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground">Nilai inventori</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border cursor-pointer" onClick={() => router.push('/office/stock/reports')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
              <HugeiconsIcon icon={Alert01Icon} size={16} strokeWidth={2} className="text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {(lowStock || []).length}
              </div>
              <p className="text-xs text-muted-foreground">Perlu direstock</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
              <HugeiconsIcon icon={FileEditIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayTransactions}</div>
              <p className="text-xs text-muted-foreground">Pergerakan stok</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Availability - Warehouse */}
        <div className="space-y-4">
          <div className="flex flex-row items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Ketersediaan Stok Gudang</h2>
              <p className="text-muted-foreground">Daftar item dan jumlah stok saat ini</p>
            </div>
            <Button
              variant="outline"
              className="rounded"
              onClick={() => router.push('/office/stock/items')}
            >
              Kelola Item
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="ml-2" />
            </Button>
          </div>

          {warehouseInventory.length === 0 ? (
            <Card className="bg-white rounded-lg border">
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground">Belum ada item di gudang</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Nama Item</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Stok Tersedia</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Min. Stok</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Rata² Harga</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Nilai Estimasi</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {warehouseInventory.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 border-b">
                      <TableCell className="font-medium py-4 px-6">{item.name}</TableCell>
                      <TableCell className={`text-right font-semibold py-4 px-6 ${item.needs_restock ? 'text-red-600' : 'text-green-600'}`}>
                        {Number(item.quantity).toLocaleString('id-ID')} {item.unit}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground py-4 px-6">
                        {Number(item.min_quantity).toLocaleString('id-ID')} {item.unit}
                      </TableCell>
                      <TableCell className="text-right py-4 px-6">
                        Rp {parseFloat(item.cost_per_unit || '0').toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right font-semibold py-4 px-6">
                        Rp {parseFloat(item.total_value).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-center py-4 px-6">
                        {item.needs_restock ? (
                          <Badge className="bg-red-500 text-white">Rendah</Badge>
                        ) : item.quantity > item.min_quantity * 2 ? (
                          <Badge className="bg-green-500 text-white">Aman</Badge>
                        ) : (
                          <Badge className="bg-yellow-500 text-white">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
          </TabsContent>

          {/* Kitchen Tab */}
          <TabsContent value="kitchen" className="mt-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-white rounded-lg border">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Item</CardTitle>
                  <HugeiconsIcon icon={Package01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{kitchenInventory.length}</div>
                  <p className="text-xs text-muted-foreground">Siap pakai di dapur</p>
                </CardContent>
              </Card>

          <Card className="bg-white rounded-lg border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nilai Total</CardTitle>
              <HugeiconsIcon icon={AnalyticsDownIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {kitchenInventory.reduce((acc, item) => acc + (item.quantity * parseFloat(item.cost_per_unit || '0')), 0).toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground">Nilai inventori</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border cursor-pointer" onClick={() => router.push('/office/stock/reports')}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Rendah</CardTitle>
              <HugeiconsIcon icon={Alert01Icon} size={16} strokeWidth={2} className="text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {(lowStock || []).length}
              </div>
              <p className="text-xs text-muted-foreground">Perlu direstock</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transaksi Hari Ini</CardTitle>
              <HugeiconsIcon icon={FileEditIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayTransactions}</div>
              <p className="text-xs text-muted-foreground">Pergerakan stok</p>
            </CardContent>
          </Card>
        </div>

        {/* Stock Availability - Kitchen */}
        <div className="space-y-4">

          <div className="flex flex-row items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Ketersediaan Stok Dapur</h2>
              <p className="text-muted-foreground">Daftar item dan jumlah stok saat ini</p>
            </div>
            <Button
              variant="outline"
              className="rounded"
              onClick={() => router.push('/office/stock/items')}
            >
              Kelola Item
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="ml-2" />
            </Button>
          </div>

          {kitchenInventory.length === 0 ? (
            <Card className="bg-white rounded-lg border">
              <CardContent className="py-12">
                <div className="text-center">
                  <p className="text-muted-foreground">Belum ada item di dapur</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-lg border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Nama Item</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Stok Tersedia</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Min. Stok</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Rata² Harga</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Nilai Estimasi</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {kitchenInventory.map((item, index) => (
                    <TableRow key={item.id} className="hover:bg-gray-50 border-b">
                      <TableCell className="font-medium py-4 px-6">{item.name}</TableCell>
                      <TableCell className={`text-right font-semibold py-4 px-6 ${item.needs_restock ? 'text-red-600' : 'text-green-600'}`}>
                        {Number(item.quantity).toLocaleString('id-ID')} {item.unit}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground py-4 px-6">
                        {Number(item.min_quantity).toLocaleString('id-ID')} {item.unit}
                      </TableCell>
                      <TableCell className="text-right py-4 px-6">
                        Rp {parseFloat(item.cost_per_unit || '0').toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right font-semibold py-4 px-6">
                        Rp {parseFloat(item.total_value).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-center py-4 px-6">
                        {item.needs_restock ? (
                          <Badge className="bg-red-500 text-white">Rendah</Badge>
                        ) : item.quantity > item.min_quantity * 2 ? (
                          <Badge className="bg-green-500 text-white">Aman</Badge>
                        ) : (
                          <Badge className="bg-yellow-500 text-white">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}
