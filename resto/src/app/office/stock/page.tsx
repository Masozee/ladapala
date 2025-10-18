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

      const [inventoryRes, lowStockRes, transactionsRes] = await Promise.all([
        api.getInventory({ branch: staff?.branch?.id }),
        api.getLowStockInventory(staff?.branch?.id),
        api.getInventoryTransactions({ branch: staff?.branch?.id })
      ])

      // Separate warehouse and kitchen inventory
      const allInventory = inventoryRes.results || []
      setWarehouseInventory(allInventory.filter(item => item.location === 'WAREHOUSE'))
      setKitchenInventory(allInventory.filter(item => item.location === 'KITCHEN'))

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
    acc + (item.quantity * parseFloat(item.cost_per_unit)), 0
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

          {/* Stats Cards */}
          <TabsContent value={activeTab} className="mt-0 space-y-4">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="bg-white rounded-lg border-0 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Item</CardTitle>
                  <HugeiconsIcon icon={Package01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentInventory.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {activeTab === 'warehouse' ? 'Bahan baku mentah' : 'Siap pakai di dapur'}
                  </p>
                </CardContent>
              </Card>

          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nilai Total</CardTitle>
              <HugeiconsIcon icon={AnalyticsDownIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {totalValue.toLocaleString("id-ID")}
              </div>
              <p className="text-xs text-muted-foreground">Nilai inventori</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-lg border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push('/office/stock/reports')}>
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

          <Card className="bg-white rounded-lg border-0 shadow-sm">
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

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/office/stock/items')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <HugeiconsIcon icon={Package01Icon} size={24} strokeWidth={2} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Master Item</CardTitle>
                  <CardDescription>Kelola data item</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/office/stock/movements?tab=receipt')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-lg">
                  <HugeiconsIcon icon={PackageReceiveIcon} size={24} strokeWidth={2} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Penerimaan</CardTitle>
                  <CardDescription>Terima barang masuk</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/office/stock/movements?tab=transfer')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <HugeiconsIcon icon={ArrowRight01Icon} size={24} strokeWidth={2} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Transfer Stok</CardTitle>
                  <CardDescription>Gudang ke Dapur</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="bg-gradient-to-br from-purple-50 to-purple-100 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/office/stock/movements?tab=adjustment')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500 rounded-lg">
                  <HugeiconsIcon icon={Edit01Icon} size={24} strokeWidth={2} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Koreksi Stok</CardTitle>
                  <CardDescription>Penyesuaian stok</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card
            className="bg-gradient-to-br from-gray-50 to-gray-100 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => router.push('/office/stock/reports')}
          >
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-500 rounded-lg">
                  <HugeiconsIcon icon={AnalyticsDownIcon} size={24} strokeWidth={2} className="text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">Laporan</CardTitle>
                  <CardDescription>Lihat laporan stok</CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Low Stock Alerts */}
        {(lowStock || []).length > 0 && (
          <Card className="bg-white rounded-lg border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Peringatan Stok Rendah</CardTitle>
                <CardDescription>Item yang perlu segera direstock</CardDescription>
              </div>
              <Button
                variant="outline"
                className="rounded"
                onClick={() => router.push('/office/stock/reports')}
              >
                Lihat Semua
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="ml-2" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(lowStock || []).slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <HugeiconsIcon icon={Alert01Icon} size={20} strokeWidth={2} className="text-yellow-600" />
                      <div>
                        <h4 className="font-semibold">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Stok: {item.quantity} {item.unit} | Min: {item.min_quantity} {item.unit}
                        </p>
                      </div>
                    </div>
                    {canModify && (
                      <Button
                        size="sm"
                        className="bg-[#58ff34] hover:bg-[#4de82a]"
                        onClick={() => router.push('/office/stock/movements?tab=receipt&item=' + item.id)}
                      >
                        Restock
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stock Availability */}
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Ketersediaan Stok {activeTab === 'warehouse' ? 'Gudang' : 'Dapur'}</CardTitle>
              <CardDescription>Daftar item dan jumlah stok saat ini</CardDescription>
            </div>
            <Button
              variant="outline"
              className="rounded"
              onClick={() => router.push('/office/stock/items')}
            >
              Kelola Item
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} strokeWidth={2} className="ml-2" />
            </Button>
          </CardHeader>
          <CardContent>
            {currentInventory.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Belum ada item di {activeTab === 'warehouse' ? 'gudang' : 'dapur'}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Item</TableHead>
                    <TableHead>Stok Tersedia</TableHead>
                    <TableHead>Min. Stok</TableHead>
                    <TableHead>Harga/Unit</TableHead>
                    <TableHead>Nilai Total</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentInventory.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className={item.needs_restock ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}>
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.min_quantity} {item.unit}
                      </TableCell>
                      <TableCell>
                        Rp {parseFloat(item.cost_per_unit).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="font-semibold">
                        Rp {parseFloat(item.total_value).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell>
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
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>
    </RoleGuard>
  )
}
