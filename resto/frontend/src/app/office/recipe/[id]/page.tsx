"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  PackageSentIcon, ChefHatIcon, Time01Icon,
  ArrowLeft01Icon, Edit01Icon, Delete02Icon, MoneyBag02Icon
} from "@hugeicons/core-free-icons"

interface RecipeIngredient {
  id: number
  recipe: number
  inventory_item: number
  inventory_item_name: string
  inventory_item_unit: string
  inventory_item_location: string
  quantity: string
  unit: string
  notes: string
  total_cost: string
}

interface Recipe {
  id: number
  product: number
  product_name: string
  product_price: string
  branch: number
  branch_name: string
  serving_size: string
  preparation_time: number | null
  cooking_time: number | null
  instructions: string
  notes: string
  is_active: boolean
  ingredients: RecipeIngredient[]
  total_cost: string
  cost_per_serving: string
  profit_margin: number
  created_at: string
  updated_at: string
}

export default function RecipeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    serving_size: '',
    preparation_time: '',
    cooking_time: '',
    instructions: '',
    notes: '',
    is_active: true
  })

  useEffect(() => {
    if (params.id) {
      fetchRecipe()
    }
  }, [params.id])

  const fetchRecipe = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/${params.id}/`, {
        credentials: 'include'
      })
      if (res.ok) {
        const data = await res.json()
        setRecipe(data)
      } else {
        router.push('/office/recipe')
      }
    } catch (error) {
      console.error('Error fetching recipe:', error)
      router.push('/office/recipe')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = () => {
    if (recipe) {
      setEditForm({
        serving_size: recipe.serving_size,
        preparation_time: recipe.preparation_time?.toString() || '',
        cooking_time: recipe.cooking_time?.toString() || '',
        instructions: recipe.instructions,
        notes: recipe.notes,
        is_active: recipe.is_active
      })
      setIsEditDialogOpen(true)
    }
  }

  const handleSaveEdit = async () => {
    try {
      const csrfToken = getCsrfToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/${params.id}/`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || ''
        },
        body: JSON.stringify({
          serving_size: editForm.serving_size,
          preparation_time: editForm.preparation_time ? parseInt(editForm.preparation_time) : null,
          cooking_time: editForm.cooking_time ? parseInt(editForm.cooking_time) : null,
          instructions: editForm.instructions,
          notes: editForm.notes,
          is_active: editForm.is_active
        })
      })

      if (res.ok) {
        alert('Resep berhasil diupdate')
        setIsEditDialogOpen(false)
        fetchRecipe() // Reload recipe data
      } else {
        const error = await res.json().catch(() => ({}))
        alert('Gagal update resep: ' + (error.detail || error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error updating recipe:', error)
      alert('Terjadi kesalahan saat update resep')
    }
  }

  const handleDelete = async () => {
    if (!confirm('Yakin ingin menghapus resep ini? Data tidak dapat dikembalikan.')) {
      return
    }

    try {
      const csrfToken = getCsrfToken()
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/${params.id}/`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'X-CSRFToken': csrfToken || ''
        }
      })

      if (res.ok || res.status === 204) {
        alert('Resep berhasil dihapus')
        router.push('/office/recipe')
      } else {
        const error = await res.json().catch(() => ({}))
        alert('Gagal menghapus resep: ' + (error.detail || error.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error deleting recipe:', error)
      alert('Terjadi kesalahan saat menghapus resep')
    }
  }

  const getCsrfToken = (): string | null => {
    if (typeof document === 'undefined') return null
    const name = 'csrftoken'
    const cookies = document.cookie.split(';')
    for (let cookie of cookies) {
      cookie = cookie.trim()
      if (cookie.startsWith(name + '=')) {
        return decodeURIComponent(cookie.substring(name.length + 1))
      }
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Memuat data...</p>
      </div>
    )
  }

  if (!recipe) {
    return null
  }

  const profit = parseFloat(recipe.product_price) - parseFloat(recipe.cost_per_serving)
  const totalTime = (recipe.preparation_time || 0) + (recipe.cooking_time || 0)

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header with Back Button */}
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
            <h1 className="text-2xl font-bold">{recipe.product_name}</h1>
            <p className="text-sm text-muted-foreground">Detail Resep & Bill of Materials</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded" onClick={handleEdit}>
            <HugeiconsIcon icon={Edit01Icon} size={16} strokeWidth={2} className="mr-2" />
            Edit Resep
          </Button>
          <Button
            variant="outline"
            className="rounded text-red-600 border-red-600 hover:bg-red-50"
            onClick={handleDelete}
          >
            <HugeiconsIcon icon={Delete02Icon} size={16} strokeWidth={2} className="mr-2" />
            Hapus
          </Button>
        </div>
      </div>

      {/* Cost Analysis Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Harga Jual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">
              Rp {parseFloat(recipe.product_price).toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Per porsi</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Biaya Bahan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">
              Rp {parseFloat(recipe.cost_per_serving).toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Cost per serving</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              Rp {profit.toLocaleString('id-ID')}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Per porsi</p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Margin Profit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${recipe.profit_margin >= 70 ? 'text-green-600' : recipe.profit_margin >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
              {recipe.profit_margin.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {recipe.profit_margin >= 70 ? 'Margin Tinggi' : recipe.profit_margin >= 40 ? 'Margin Sedang' : 'Margin Rendah'}
            </p>
          </CardContent>
        </Card>

        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={recipe.is_active ? "default" : "secondary"}>
              {recipe.is_active ? 'Aktif' : 'Nonaktif'}
            </Badge>
            <p className="text-xs text-muted-foreground mt-2">{recipe.serving_size} porsi</p>
          </CardContent>
        </Card>
      </div>

      {/* Production Info */}
      <Card className="border">
        <CardContent className="pt-6">
          <div className="grid grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded">
                <HugeiconsIcon icon={PackageSentIcon} size={20} strokeWidth={2} className="text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Porsi per Resep</p>
                <p className="text-xl font-semibold">{recipe.serving_size}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded">
                <HugeiconsIcon icon={Time01Icon} size={20} strokeWidth={2} className="text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waktu Persiapan</p>
                <p className="text-xl font-semibold">{recipe.preparation_time || 0} menit</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded">
                <HugeiconsIcon icon={ChefHatIcon} size={20} strokeWidth={2} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waktu Memasak</p>
                <p className="text-xl font-semibold">{recipe.cooking_time || 0} menit</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-gray-100 p-3 rounded">
                <HugeiconsIcon icon={MoneyBag02Icon} size={20} strokeWidth={2} className="text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Waktu</p>
                <p className="text-xl font-semibold">{totalTime} menit</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ingredients Table */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <HugeiconsIcon icon={PackageSentIcon} size={20} strokeWidth={2} />
          <h2 className="text-xl font-semibold">Daftar Bahan ({recipe.ingredients.length} item)</h2>
        </div>
        <div className="rounded-lg border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-900 w-12">#</TableHead>
                <TableHead className="font-semibold text-gray-900">Nama Bahan</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Jumlah</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center">Satuan</TableHead>
                <TableHead className="font-semibold text-gray-900 text-center">Lokasi</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Biaya per Unit</TableHead>
                <TableHead className="font-semibold text-gray-900 text-right">Total Biaya</TableHead>
                <TableHead className="font-semibold text-gray-900">Catatan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recipe.ingredients.map((ing, idx) => (
                <TableRow key={ing.id} className="hover:bg-gray-50">
                  <TableCell className="text-center text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="font-medium">{ing.inventory_item_name}</TableCell>
                  <TableCell className="text-right font-semibold">{parseFloat(ing.quantity).toLocaleString('id-ID')}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{ing.unit}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={ing.inventory_item_location === 'KITCHEN' ? "default" : "secondary"}>
                      {ing.inventory_item_location === 'KITCHEN' ? 'Dapur' : 'Gudang'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    Rp {(parseFloat(ing.total_cost) / parseFloat(ing.quantity)).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    Rp {parseFloat(ing.total_cost).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground italic">{ing.notes || '-'}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-orange-50 font-semibold">
                <TableCell colSpan={6} className="text-right">Total Biaya Bahan:</TableCell>
                <TableCell className="text-right text-orange-600">
                  Rp {parseFloat(recipe.total_cost).toLocaleString('id-ID')}
                </TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Instructions */}
      {recipe.instructions && (
        <Card className="border">
          <CardHeader>
            <CardTitle>Instruksi Memasak</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="whitespace-pre-line">{recipe.instructions}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {recipe.notes && (
        <Card className="border">
          <CardHeader>
            <CardTitle>Catatan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
              <p className="whitespace-pre-line">{recipe.notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Resep</DialogTitle>
            <DialogDescription>
              Ubah detail resep untuk {recipe?.product_name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ukuran Porsi</Label>
                <Input
                  value={editForm.serving_size}
                  onChange={(e) => setEditForm({ ...editForm, serving_size: e.target.value })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={editForm.is_active.toString()}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Waktu Persiapan (menit)</Label>
                <Input
                  type="number"
                  value={editForm.preparation_time}
                  onChange={(e) => setEditForm({ ...editForm, preparation_time: e.target.value })}
                  placeholder="15"
                />
              </div>
              <div className="space-y-2">
                <Label>Waktu Memasak (menit)</Label>
                <Input
                  type="number"
                  value={editForm.cooking_time}
                  onChange={(e) => setEditForm({ ...editForm, cooking_time: e.target.value })}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Instruksi Memasak</Label>
              <Textarea
                value={editForm.instructions}
                onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                rows={5}
                placeholder="Masukkan langkah-langkah memasak..."
              />
            </div>

            <div className="space-y-2">
              <Label>Catatan</Label>
              <Textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
                placeholder="Catatan tambahan (opsional)"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSaveEdit} className="bg-[#58ff34] hover:bg-[#4de82a] text-black">
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
