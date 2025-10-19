"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon, Edit01Icon, Delete02Icon, MoneyBag02Icon,
  AnalyticsDownIcon, ShoppingCart01Icon, TrendUpIcon, Calendar01Icon
} from "@hugeicons/core-free-icons"

interface MenuDetail {
  id: number
  name: string
  price: string
  category: number
  category_name: string
  description: string
  is_available: boolean
  branch: number
  branch_name: string
  created_at: string
  updated_at: string
}

interface SalesData {
  total_orders: number
  total_quantity: number
  total_revenue: string
  avg_order_value: string
  last_30_days: {
    orders: number
    revenue: string
  }
  last_7_days: {
    orders: number
    revenue: string
  }
  today: {
    orders: number
    revenue: string
  }
}

interface OrderHistory {
  id: number
  order_number: string
  quantity: number
  price: string
  total: string
  created_at: string
  payment_status: string
  order_status: string
}

export default function MenuDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [menu, setMenu] = useState<MenuDetail | null>(null)
  const [salesData, setSalesData] = useState<SalesData | null>(null)
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [categories, setCategories] = useState<Array<{id: number, name: string}>>([])

  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    is_available: true
  })

  useEffect(() => {
    if (params.id) {
      fetchMenuData()
    }
  }, [params.id])

  const fetchMenuData = async () => {
    try {
      setIsLoading(true)
      const [menuRes, salesRes, ordersRes, categoriesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}/`, {
          credentials: 'include'
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}/sales_analytics/`, {
          credentials: 'include'
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/order-items/?product=${params.id}&limit=20`, {
          credentials: 'include'
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/categories/`, {
          credentials: 'include'
        })
      ])

      if (menuRes.ok) {
        const menuData = await menuRes.json()
        setMenu(menuData)
        setEditForm({
          name: menuData.name,
          category: menuData.category.toString(),
          price: menuData.price,
          description: menuData.description || '',
          is_available: menuData.is_available
        })
      } else {
        router.push('/office/recipe')
      }

      if (salesRes.ok) {
        const salesData = await salesRes.json()
        setSalesData(salesData)
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrderHistory(ordersData.results || [])
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData.results || [])
      }
    } catch (error) {
      console.error('Error fetching menu data:', error)
      router.push('/office/recipe')
    } finally {
      setIsLoading(false)
    }
  }

  const getCsrfToken = () => {
    const name = 'csrftoken'
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
    return ''
  }

  const handleEditMenu = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const csrfToken = getCsrfToken()

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/products/${params.id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify(editForm)
      })

      if (!res.ok) {
        const error = await res.json()
        console.error('Menu update failed:', error)
        alert('Gagal mengupdate menu: ' + JSON.stringify(error))
        return
      }

      alert('Menu berhasil diupdate!')
      setIsEditOpen(false)
      fetchMenuData()
    } catch (error) {
      console.error('Error updating menu:', error)
      alert('Terjadi kesalahan: ' + error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Memuat data...</p>
      </div>
    )
  }

  if (!menu) {
    return null
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push('/office/recipe')}
            className="rounded"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{menu.name}</h1>
            <p className="text-sm text-muted-foreground">Detail Menu & Analisis Penjualan</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="rounded"
            onClick={() => setIsEditOpen(true)}
          >
            <HugeiconsIcon icon={Edit01Icon} size={16} strokeWidth={2} className="mr-2" />
            Edit Menu
          </Button>
          <Button variant="outline" className="rounded text-red-600 border-red-600 hover:bg-red-50">
            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} className="mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      {/* Edit Menu Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Menu</DialogTitle>
            <DialogDescription>Update informasi menu</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditMenu} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Menu *</Label>
                <Input
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Kategori *</Label>
                <select
                  required
                  className="w-full border rounded px-3 py-2"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label>Harga *</Label>
              <Input
                type="number"
                required
                value={editForm.price}
                onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
              />
            </div>

            <div>
              <Label>Deskripsi</Label>
              <Textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit_is_available"
                checked={editForm.is_available}
                onChange={(e) => setEditForm({ ...editForm, is_available: e.target.checked })}
                className="w-4 h-4"
              />
              <Label htmlFor="edit_is_available">Tersedia untuk dijual</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button type="submit" className="bg-[#58ff34] hover:bg-[#4de82a] text-black">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Menu Info Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Harga Menu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              Rp {parseFloat(menu.price).toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Per porsi</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Kategori</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="text-base px-3 py-1">
              {menu.category_name}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Klasifikasi menu</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={menu.is_available ? "default" : "secondary"}>
              {menu.is_available ? 'Tersedia' : 'Tidak Tersedia'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">Ketersediaan</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Cabang</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold">{menu.branch_name}</p>
            <p className="text-xs text-muted-foreground mt-1">Lokasi</p>
          </CardContent>
        </Card>
      </div>

      {/* Sales Analytics Cards */}
      {salesData && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Analisis Penjualan</h2>
          <div className="grid grid-cols-4 gap-4">
            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Penjualan</CardTitle>
                <HugeiconsIcon icon={MoneyBag02Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp {parseFloat(salesData.total_revenue || '0').toLocaleString('id-ID')}</div>
                <p className="text-xs text-muted-foreground">{salesData.total_orders} pesanan</p>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">30 Hari Terakhir</CardTitle>
                <HugeiconsIcon icon={Calendar01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp {parseFloat(salesData.last_30_days?.revenue || '0').toLocaleString('id-ID')}</div>
                <p className="text-xs text-muted-foreground">{salesData.last_30_days?.orders || 0} pesanan</p>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">7 Hari Terakhir</CardTitle>
                <HugeiconsIcon icon={TrendUpIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp {parseFloat(salesData.last_7_days?.revenue || '0').toLocaleString('id-ID')}</div>
                <p className="text-xs text-muted-foreground">{salesData.last_7_days?.orders || 0} pesanan</p>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
                <HugeiconsIcon icon={ShoppingCart01Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp {parseFloat(salesData.today?.revenue || '0').toLocaleString('id-ID')}</div>
                <p className="text-xs text-muted-foreground">{salesData.today?.orders || 0} pesanan</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Porsi Terjual</CardTitle>
                <HugeiconsIcon icon={AnalyticsDownIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesData.total_quantity}</div>
                <p className="text-xs text-muted-foreground">Jumlah porsi</p>
              </CardContent>
            </Card>

            <Card className="border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Rata-rata per Pesanan</CardTitle>
                <HugeiconsIcon icon={MoneyBag02Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Rp {parseFloat(salesData.avg_order_value || '0').toLocaleString('id-ID')}</div>
                <p className="text-xs text-muted-foreground">Average order value</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Description */}
      {menu.description && (
        <Card className="border">
          <CardHeader>
            <CardTitle>Deskripsi Menu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{menu.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Order History */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Riwayat Pesanan (20 Terakhir)</h2>
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-900">No. Pesanan</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center">Jumlah</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Harga</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Total</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center">Status</TableHead>
                <TableHead className="font-semibold text-gray-900">Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderHistory.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada riwayat pesanan
                  </TableCell>
                </TableRow>
              ) : (
                orderHistory.map((order) => (
                  <TableRow key={order.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{order.order_number}</TableCell>
                    <TableCell className="text-center">{order.quantity}</TableCell>
                    <TableCell className="text-right">Rp {parseFloat(order.price).toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-right font-semibold">Rp {parseFloat(order.total).toLocaleString('id-ID')}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={order.order_status === 'COMPLETED' ? 'default' : 'secondary'}>
                        {order.order_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleString('id-ID')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
