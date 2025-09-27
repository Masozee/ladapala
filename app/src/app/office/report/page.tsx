"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Download,
  Filter,
  FileBarChart,
  ArrowUp,
  ArrowDown
} from "lucide-react"
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

interface SalesData {
  date: string
  revenue: number
  orders: number
  avgOrderValue: number
  topProduct: string
}

interface ExpenseData {
  category: string
  amount: number
  percentage: number
  trend: "up" | "down" | "stable"
}

const mockSalesData: SalesData[] = [
  { date: "2024-01-15", revenue: 4500000, orders: 87, avgOrderValue: 51724, topProduct: "Nasi Goreng Spesial" },
  { date: "2024-01-14", revenue: 3800000, orders: 76, avgOrderValue: 50000, topProduct: "Ayam Bakar Madu" },
  { date: "2024-01-13", revenue: 5200000, orders: 102, avgOrderValue: 50980, topProduct: "Nasi Goreng Spesial" },
  { date: "2024-01-12", revenue: 4100000, orders: 82, avgOrderValue: 50000, topProduct: "Sate Ayam" },
  { date: "2024-01-11", revenue: 3600000, orders: 71, avgOrderValue: 50704, topProduct: "Mie Ayam" },
]

const mockExpenses: ExpenseData[] = [
  { category: "Bahan Baku", amount: 12500000, percentage: 45, trend: "up" },
  { category: "Gaji Karyawan", amount: 8000000, percentage: 29, trend: "stable" },
  { category: "Sewa Tempat", amount: 3500000, percentage: 13, trend: "stable" },
  { category: "Utilitas", amount: 1800000, percentage: 7, trend: "down" },
  { category: "Marketing", amount: 1000000, percentage: 4, trend: "up" },
  { category: "Lainnya", amount: 700000, percentage: 2, trend: "down" },
]

const popularProducts = [
  { name: "Nasi Goreng Spesial", sold: 342, revenue: 8550000 },
  { name: "Ayam Bakar Madu", sold: 256, revenue: 8960000 },
  { name: "Sate Ayam", sold: 198, revenue: 5940000 },
  { name: "Mie Ayam", sold: 187, revenue: 4675000 },
  { name: "Es Teh Manis", sold: 456, revenue: 3648000 },
]


export default function ReportPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("week")
  const [selectedBranch, setSelectedBranch] = useState("all")

  const totalRevenue = mockSalesData.reduce((acc, data) => acc + data.revenue, 0)
  const totalOrders = mockSalesData.reduce((acc, data) => acc + data.orders, 0)
  const avgRevenue = totalRevenue / mockSalesData.length
  const totalExpenses = mockExpenses.reduce((acc, expense) => acc + expense.amount, 0)
  const netProfit = totalRevenue - totalExpenses

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case "down":
        return <ArrowDown className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }


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
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
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
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button className="rounded bg-[#58ff34] hover:bg-[#4de82a] text-black">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendapatan</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(totalRevenue / 1000000).toFixed(1)}jt</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +12.5% dari minggu lalu
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +8.2% dari minggu lalu
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata-rata Pesanan</CardTitle>
            <FileBarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {Math.round(avgRevenue / totalOrders * mockSalesData.length).toLocaleString("id-ID")}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingDown className="h-3 w-3 text-red-500" />
              -2.1% dari minggu lalu
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pengeluaran</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {(totalExpenses / 1000000).toFixed(1)}jt</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-red-500" />
              +5.3% dari minggu lalu
            </p>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Laba Bersih</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
              Rp {(Math.abs(netProfit) / 1000000).toFixed(1)}jt
            </div>
            <p className="text-xs text-muted-foreground">
              Margin: {((netProfit / totalRevenue) * 100).toFixed(1)}%
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
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Riwayat Penjualan</h2>
              <p className="text-muted-foreground">Detail penjualan harian</p>
            </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Pendapatan</TableHead>
                    <TableHead>Jumlah Pesanan</TableHead>
                    <TableHead>Rata-rata Pesanan</TableHead>
                    <TableHead>Produk Terlaris</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockSalesData.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell>{data.date}</TableCell>
                      <TableCell className="font-semibold">
                        Rp {data.revenue.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell>{data.orders}</TableCell>
                      <TableCell>Rp {data.avgOrderValue.toLocaleString("id-ID")}</TableCell>
                      <TableCell>{data.topProduct}</TableCell>
                      <TableCell>
                        {data.revenue > 4000000 ? (
                          <Badge className="bg-green-500 text-white">Bagus</Badge>
                        ) : (
                          <Badge className="bg-yellow-500 text-white">Normal</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Breakdown Pengeluaran</h2>
              <p className="text-muted-foreground">Analisis pengeluaran per kategori</p>
            </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Persentase</TableHead>
                    <TableHead>Tren</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockExpenses.map((expense, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{expense.category}</TableCell>
                      <TableCell>Rp {expense.amount.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-[#58ff34] h-2 rounded-full"
                              style={{ width: `${expense.percentage}%` }}
                            />
                          </div>
                          <span className="text-sm">{expense.percentage}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getTrendIcon(expense.trend)}</TableCell>
                      <TableCell>
                        {expense.trend === "up" && (
                          <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                            Naik
                          </Badge>
                        )}
                        {expense.trend === "down" && (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            Turun
                          </Badge>
                        )}
                        {expense.trend === "stable" && (
                          <Badge variant="outline">Stabil</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Produk Terlaris</h2>
              <p className="text-muted-foreground">Performa produk berdasarkan penjualan</p>
            </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produk</TableHead>
                    <TableHead>Terjual</TableHead>
                    <TableHead>Pendapatan</TableHead>
                    <TableHead>Kontribusi</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {popularProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>{product.sold} porsi</TableCell>
                      <TableCell>Rp {product.revenue.toLocaleString("id-ID")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(product.revenue / totalRevenue * 100)}%` }}
                            />
                          </div>
                          <span className="text-sm">
                            {((product.revenue / totalRevenue) * 100).toFixed(1)}%
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
                  ))}
                </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Tren Penjualan Mingguan</h2>
                <p className="text-muted-foreground">Perbandingan minggu ini vs minggu lalu</p>
              </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Senin</span>
                    <div className="flex items-center gap-2">
                      <span>Rp 3.6jt</span>
                      <Badge className="bg-green-500 text-white text-xs">+15%</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Selasa</span>
                    <div className="flex items-center gap-2">
                      <span>Rp 4.1jt</span>
                      <Badge className="bg-green-500 text-xs">+8%</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Rabu</span>
                    <div className="flex items-center gap-2">
                      <span>Rp 5.2jt</span>
                      <Badge className="bg-green-500 text-xs">+22%</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Kamis</span>
                    <div className="flex items-center gap-2">
                      <span>Rp 3.8jt</span>
                      <Badge className="bg-red-500 text-white text-xs">-5%</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Jumat</span>
                    <div className="flex items-center gap-2">
                      <span>Rp 4.5jt</span>
                      <Badge className="bg-green-500 text-xs">+10%</Badge>
                    </div>
                  </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">Jam Sibuk</h2>
                <p className="text-muted-foreground">Distribusi pesanan per jam</p>
              </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>12:00 - 13:00</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-[#58ff34] h-2 rounded-full" style={{ width: '85%' }} />
                      </div>
                      <span className="text-sm">85%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>19:00 - 20:00</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-[#58ff34] h-2 rounded-full" style={{ width: '75%' }} />
                      </div>
                      <span className="text-sm">75%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>13:00 - 14:00</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-[#58ff34] h-2 rounded-full" style={{ width: '60%' }} />
                      </div>
                      <span className="text-sm">60%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>18:00 - 19:00</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className="bg-[#58ff34] h-2 rounded-full" style={{ width: '55%' }} />
                      </div>
                      <span className="text-sm">55%</span>
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