"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DollarCircleIcon,
  AnalyticsUpIcon,
  AnalyticsDownIcon,
  Download01Icon,
  FilterIcon,
  Analytics01Icon,
  ShoppingCart01Icon,
} from "@/lib/icons"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api } from "@/lib/api"


export default function ReportPage() {
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month' | 'year'>("week")
  const [selectedBranch, setSelectedBranch] = useState(process.env.NEXT_PUBLIC_API_BRANCH_ID || "7")
  const [loading, setLoading] = useState(true)
  const [salesData, setSalesData] = useState<any>(null)
  const [expensesData, setExpensesData] = useState<any>(null)
  const [productsData, setProductsData] = useState<any>(null)
  const [trendsData, setTrendsData] = useState<any>(null)

  useEffect(() => {
    fetchReports()
  }, [selectedPeriod, selectedBranch])

  const handleExportPDF = async () => {
    try {
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(selectedBranch !== "all" && { branch: selectedBranch })
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/export_pdf/?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `laporan_${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Gagal mengexport PDF')
    }
  }

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(selectedBranch !== "all" && { branch: selectedBranch })
      })

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/reports/export_excel/?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `data_laporan_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error exporting Excel:', error)
      alert('Gagal mengexport Excel')
    }
  }

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = {
        period: selectedPeriod,
        branch: selectedBranch !== "all" ? parseInt(selectedBranch) : undefined
      }

      const [sales, expenses, products, trends] = await Promise.all([
        api.getSalesReport(params),
        api.getExpensesReport(params),
        api.getProductsReport({ ...params, limit: 5 }),
        api.getTrendsReport(params)
      ])

      setSalesData(sales)
      setExpensesData(expenses)
      setProductsData(products)
      setTrendsData(trends)
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !salesData || !expensesData || !productsData || !trendsData) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Memuat laporan...</p>
        </div>
      </div>
    )
  }

  const totalRevenue = parseFloat(salesData.summary.total_revenue || '0')
  const totalOrders = salesData.summary.total_orders || 0
  const avgOrderValue = parseFloat(salesData.summary.avg_order_value || '0')
  const totalExpenses = parseFloat(expensesData.summary.total_expenses || '0')
  const netProfit = totalRevenue - totalExpenses
  const revenueGrowth = salesData.comparison?.growth?.revenue_percent || 0
  const ordersGrowth = salesData.comparison?.growth?.orders_percent || 0
  const expensesGrowth = expensesData.comparison?.growth_percentage || 0


  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Laporan & Analisis</h1>
          <p className="text-muted-foreground">Dashboard analisis bisnis dan performa restoran</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Cabang</SelectItem>
              <SelectItem value="1">Cabang Utama</SelectItem>
              <SelectItem value="2">Cabang Barat</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as 'today' | 'week' | 'month' | 'year')}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hari Ini</SelectItem>
              <SelectItem value="week">Minggu Ini</SelectItem>
              <SelectItem value="month">Bulan Ini</SelectItem>
              <SelectItem value="year">Tahun Ini</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded">
            <FilterIcon className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="rounded bg-[#58ff34] hover:bg-[#4de82a] text-black">
                <Download01Icon className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPDF}>
                <Download01Icon className="mr-2 h-4 w-4" />
                Export PDF (Laporan Lengkap)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel}>
                <Download01Icon className="mr-2 h-4 w-4" />
                Export Excel (Data Saja)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarCircleIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(totalRevenue / 1000000).toFixed(1)}jt</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {revenueGrowth >= 0 ? (
                <AnalyticsUpIcon className="h-3 w-3 text-green-500" />
              ) : (
                <AnalyticsDownIcon className="h-3 w-3 text-red-500" />
              )}
              {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% dari periode lalu
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart01Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {ordersGrowth >= 0 ? (
                <AnalyticsUpIcon className="h-3 w-3 text-green-500" />
              ) : (
                <AnalyticsDownIcon className="h-3 w-3 text-red-500" />
              )}
              {ordersGrowth >= 0 ? '+' : ''}{ordersGrowth.toFixed(1)}% dari periode lalu
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
            <AnalyticsUpIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rp {(Math.abs(netProfit) / 1000000).toFixed(1)}jt
            </div>
            <p className="text-xs text-muted-foreground">
              Margin: {totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0'}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="sales" className="space-y-6">
        <TabsList className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <TabsTrigger value="sales" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">Penjualan</TabsTrigger>
          <TabsTrigger value="expenses" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">Pengeluaran</TabsTrigger>
          <TabsTrigger value="products" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">Produk</TabsTrigger>
          <TabsTrigger value="trends" className="inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium data-[state=active]:bg-[#58ff34] data-[state=active]:text-black data-[state=active]:shadow-sm">Tren</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="bg-white p-6 rounded-lg">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Riwayat Penjualan</h2>
              <p className="text-muted-foreground">Detail penjualan harian</p>
            </div>
              <Table className="border">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="border-r">Tanggal</TableHead>
                    <TableHead className="border-r">Pendapatan</TableHead>
                    <TableHead className="border-r">Jumlah Pesanan</TableHead>
                    <TableHead className="border-r">Rata-rata Pesanan</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.daily_breakdown && salesData.daily_breakdown.length > 0 ? (
                    salesData.daily_breakdown.map((data: any, index: number) => {
                      const revenue = parseFloat(data.revenue || '0')
                      const avgValue = parseFloat(data.avg_order_value || '0')
                      return (
                        <TableRow key={index} className="border-b hover:bg-gray-50 cursor-pointer" onClick={() => router.push('/office/sales-history')}>
                          <TableCell className="border-r text-blue-600 hover:text-blue-800 font-medium">
                            {new Date(data.date).toLocaleDateString('id-ID')}
                          </TableCell>
                          <TableCell className="border-r font-semibold">
                            Rp {revenue.toLocaleString("id-ID")}
                          </TableCell>
                          <TableCell className="border-r">{data.orders}</TableCell>
                          <TableCell className="border-r">Rp {Math.round(avgValue).toLocaleString("id-ID")}</TableCell>
                          <TableCell>
                            {revenue > avgOrderValue * data.orders ? (
                              <Badge className="bg-green-500 text-white">Bagus</Badge>
                            ) : (
                              <Badge className="bg-yellow-500 text-white">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow className="border-b">
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Tidak ada data penjualan
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="bg-white p-6 rounded-lg">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Breakdown Pengeluaran</h2>
              <p className="text-muted-foreground">Analisis pengeluaran per kategori</p>
            </div>
              <Table className="border">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="border-r">Kategori</TableHead>
                    <TableHead className="border-r">Jumlah</TableHead>
                    <TableHead>Persentase</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expensesData.by_category && expensesData.by_category.length > 0 ? (
                    expensesData.by_category.map((expense: any, index: number) => {
                      const amount = parseFloat(expense.amount || '0')
                      const percentage = parseFloat(expense.percentage || '0')
                      return (
                        <TableRow key={index} className="border-b">
                          <TableCell className="font-medium border-r">{expense.category}</TableCell>
                          <TableCell className="border-r">Rp {amount.toLocaleString("id-ID")}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-[#58ff34] h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="text-sm">{percentage.toFixed(1)}%</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow className="border-b">
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        Tidak ada data pengeluaran
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="bg-white p-6 rounded-lg">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Produk Terlaris</h2>
              <p className="text-muted-foreground">Performa produk berdasarkan penjualan</p>
            </div>
              <Table className="border">
                <TableHeader>
                  <TableRow className="border-b">
                    <TableHead className="border-r">Produk</TableHead>
                    <TableHead className="border-r">Terjual</TableHead>
                    <TableHead className="border-r">Pendapatan</TableHead>
                    <TableHead className="border-r">Kontribusi</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsData.top_products && productsData.top_products.length > 0 ? (
                    productsData.top_products.map((product: any, index: number) => {
                      const revenue = parseFloat(product.revenue || '0')
                      const contribution = parseFloat(product.contribution_percentage || '0')
                      return (
                        <TableRow key={index} className="border-b">
                          <TableCell className="font-medium border-r">{product.product_name}</TableCell>
                          <TableCell className="border-r">{product.quantity_sold} porsi</TableCell>
                          <TableCell className="border-r">Rp {revenue.toLocaleString("id-ID")}</TableCell>
                          <TableCell className="border-r">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${contribution}%` }}
                                />
                              </div>
                              <span className="text-sm">
                                {contribution.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {index < 3 ? (
                              <Badge className="bg-green-500 text-white">Top {index + 1}</Badge>
                            ) : (
                              <Badge variant="outline">Normal</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })
                  ) : (
                    <TableRow className="border-b">
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Tidak ada data produk
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {/* Daily Revenue Chart */}
          <div className="bg-white p-6 rounded-lg">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Grafik Omzet Harian</h2>
              <p className="text-muted-foreground">Visualisasi penjualan per hari</p>
            </div>
            {salesData.daily_breakdown && salesData.daily_breakdown.length > 0 ? (
              <div className="space-y-2">
                {salesData.daily_breakdown.slice(0, 10).map((day: any, index: number) => {
                  const revenue = parseFloat(day.revenue || '0')
                  const maxRevenue = Math.max(...salesData.daily_breakdown.map((d: any) => parseFloat(d.revenue || '0')))
                  const percentage = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0
                  const orders = day.orders || 0

                  return (
                    <div key={index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700 w-32">
                          {new Date(day.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                        <div className="flex-1 mx-4">
                          <div className="relative w-full bg-gray-200 rounded-full h-8 overflow-hidden">
                            <div
                              className="absolute h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-end pr-2"
                              style={{ width: `${percentage}%` }}
                            >
                              {percentage > 15 && (
                                <span className="text-white text-xs font-semibold">
                                  Rp {(revenue / 1000000).toFixed(1)}jt
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 w-40 justify-end">
                          {percentage <= 15 && (
                            <span className="text-sm font-semibold">
                              Rp {(revenue / 1000000).toFixed(1)}jt
                            </span>
                          )}
                          <Badge className="bg-blue-500 text-white text-xs">
                            {orders} order
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Tidak ada data penjualan</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white p-6 rounded-lg">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Tren Penjualan</h2>
                <p className="text-muted-foreground">Penjualan per hari dalam periode</p>
              </div>
                <div className="space-y-4">
                  {trendsData.time_series && trendsData.time_series.length > 0 ? (
                    trendsData.time_series.slice(0, 7).map((day: any, index: number) => {
                      const revenue = parseFloat(day.revenue || '0')
                      const prevRevenue = index > 0 ? parseFloat(trendsData.time_series[index - 1]?.revenue || '0') : 0
                      const growth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue * 100) : 0
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <span>{new Date(day.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}</span>
                          <div className="flex items-center gap-2">
                            <span>Rp {(revenue / 1000000).toFixed(1)}jt</span>
                            {growth !== 0 && index > 0 && (
                              <Badge className={`${growth >= 0 ? 'bg-green-500' : 'bg-red-500'} text-white text-xs`}>
                                {growth >= 0 ? '+' : ''}{growth.toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-center text-muted-foreground">Tidak ada data tren</p>
                  )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Perbandingan Periode</h2>
                <p className="text-muted-foreground">Periode saat ini vs periode sebelumnya</p>
              </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Pendapatan</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Rp {(trendsData.comparison?.current_period?.revenue / 1000000 || 0).toFixed(1)}jt</span>
                      <Badge className={`${(trendsData.comparison?.growth?.revenue_percent || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'} text-white text-xs`}>
                        {(trendsData.comparison?.growth?.revenue_percent || 0) >= 0 ? '+' : ''}{(trendsData.comparison?.growth?.revenue_percent || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Jumlah Pesanan</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{trendsData.comparison?.current_period?.orders || 0}</span>
                      <Badge className={`${(trendsData.comparison?.growth?.orders_percent || 0) >= 0 ? 'bg-green-500' : 'bg-red-500'} text-white text-xs`}>
                        {(trendsData.comparison?.growth?.orders_percent || 0) >= 0 ? '+' : ''}{(trendsData.comparison?.growth?.orders_percent || 0).toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Rata-rata Harian</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Rp {(trendsData.comparison?.current_period?.avg_daily / 1000000 || 0).toFixed(1)}jt</span>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="text-xs text-muted-foreground">
                      <p>Periode Sebelumnya:</p>
                      <p>Rp {(trendsData.comparison?.previous_period?.revenue / 1000000 || 0).toFixed(1)}jt • {trendsData.comparison?.previous_period?.orders || 0} pesanan</p>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}