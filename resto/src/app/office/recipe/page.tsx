"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon, Edit01Icon, Delete02Icon, PackageSentIcon,
  Search01Icon, FilterIcon, ChefHatIcon, MoneyBag02Icon,
  Time01Icon, AnalyticsDownIcon
} from "@hugeicons/core-free-icons"
import { useAuth } from "@/contexts/auth-context"
import { api } from "@/lib/api"

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

interface Product {
  id: number
  name: string
  price: string
  category: number
  category_name: string
}

interface Inventory {
  id: number
  name: string
  unit: string
  location: string
  cost_per_unit: string
  quantity: number
}

export default function RecipePage() {
  const { staff } = useAuth()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [kitchenInventory, setKitchenInventory] = useState<Inventory[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMargin, setFilterMargin] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('name')

  const [recipeForm, setRecipeForm] = useState({
    product: '',
    serving_size: '1',
    preparation_time: '',
    cooking_time: '',
    instructions: '',
    notes: ''
  })

  const [ingredients, setIngredients] = useState<Array<{
    inventory_item: string
    quantity: string
    notes: string
  }>>([{ inventory_item: '', quantity: '', notes: '' }])

  useEffect(() => {
    if (staff?.branch) {
      fetchData()
    }
  }, [staff])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [recipesRes, productsRes, inventoryRes] = await Promise.all([
        api.getRecipes({ branch: staff?.branch?.id }),
        api.getProducts({ branch: staff?.branch?.id }),
        api.getInventory({ branch: staff?.branch?.id, location: 'KITCHEN' })
      ])

      setRecipes(Array.isArray(recipesRes) ? recipesRes : recipesRes.results || [])
      setProducts(productsRes.results || [])
      setKitchenInventory(inventoryRes.results || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addIngredientRow = () => {
    setIngredients([...ingredients, { inventory_item: '', quantity: '', notes: '' }])
  }

  const removeIngredientRow = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index))
  }

  const updateIngredient = (index: number, field: string, value: string) => {
    const updated = [...ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setIngredients(updated)
  }

  const getCsrfToken = () => {
    const name = 'csrftoken'
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
    return ''
  }

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const csrfToken = getCsrfToken()

      // Create recipe
      const recipeRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken || ''
        },
        credentials: 'include',
        body: JSON.stringify({
          ...recipeForm,
          branch: staff?.branch?.id,
          is_active: true
        })
      })

      if (!recipeRes.ok) {
        const error = await recipeRes.json()
        console.error('Recipe creation failed:', error)
        alert('Gagal membuat resep: ' + JSON.stringify(error))
        return
      }

      const recipe = await recipeRes.json()

      // Create ingredients
      for (const ing of ingredients) {
        if (ing.inventory_item && ing.quantity) {
          const invItem = kitchenInventory.find(i => i.id === parseInt(ing.inventory_item))
          const ingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipe-ingredients/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrfToken || ''
            },
            credentials: 'include',
            body: JSON.stringify({
              recipe: recipe.id,
              inventory_item: ing.inventory_item,
              quantity: ing.quantity,
              unit: invItem?.unit || 'g',
              notes: ing.notes
            })
          })

          if (!ingRes.ok) {
            console.error('Failed to create ingredient:', await ingRes.json())
          }
        }
      }

      alert('Resep berhasil dibuat!')
      setIsCreateOpen(false)
      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error creating recipe:', error)
      alert('Terjadi kesalahan: ' + error)
    }
  }

  const resetForm = () => {
    setRecipeForm({
      product: '',
      serving_size: '1',
      preparation_time: '',
      cooking_time: '',
      instructions: '',
      notes: ''
    })
    setIngredients([{ inventory_item: '', quantity: '', notes: '' }])
  }

  const viewRecipeDetail = (recipe: Recipe) => {
    // Navigate to detail page instead of opening popup
    window.location.href = `/office/recipe/${recipe.id}`
  }

  // Filtered and sorted recipes
  const filteredRecipes = useMemo(() => {
    let filtered = recipes.filter(recipe => {
      // Search filter
      const matchesSearch = recipe.product_name.toLowerCase().includes(searchQuery.toLowerCase())

      // Margin filter
      let matchesMargin = true
      if (filterMargin === 'high') matchesMargin = recipe.profit_margin >= 70
      else if (filterMargin === 'medium') matchesMargin = recipe.profit_margin >= 40 && recipe.profit_margin < 70
      else if (filterMargin === 'low') matchesMargin = recipe.profit_margin < 40

      // Status filter
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'active' && recipe.is_active) ||
        (filterStatus === 'inactive' && !recipe.is_active)

      return matchesSearch && matchesMargin && matchesStatus
    })

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.product_name.localeCompare(b.product_name)
        case 'margin-high':
          return b.profit_margin - a.profit_margin
        case 'margin-low':
          return a.profit_margin - b.profit_margin
        case 'cost-high':
          return parseFloat(b.cost_per_serving) - parseFloat(a.cost_per_serving)
        case 'cost-low':
          return parseFloat(a.cost_per_serving) - parseFloat(b.cost_per_serving)
        case 'price-high':
          return parseFloat(b.product_price) - parseFloat(a.product_price)
        case 'price-low':
          return parseFloat(a.product_price) - parseFloat(b.product_price)
        default:
          return 0
      }
    })

    return filtered
  }, [recipes, searchQuery, filterMargin, filterStatus, sortBy])

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRecipes = filteredRecipes.length
    const avgMargin = filteredRecipes.reduce((sum, r) => sum + r.profit_margin, 0) / (totalRecipes || 1)
    const avgCost = filteredRecipes.reduce((sum, r) => sum + parseFloat(r.cost_per_serving), 0) / (totalRecipes || 1)
    const highMarginCount = filteredRecipes.filter(r => r.profit_margin >= 70).length

    return { totalRecipes, avgMargin, avgCost, highMarginCount }
  }, [filteredRecipes])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Memuat data...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Resep (BOM)</h1>
          <p className="text-muted-foreground">Bill of Materials untuk setiap menu</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#58ff34] hover:bg-[#4de82a] text-black">
              <HugeiconsIcon icon={Add01Icon} size={16} strokeWidth={2} className="mr-2" />
              Buat Resep
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buat Resep Baru</DialogTitle>
              <DialogDescription>Definisikan bahan dan takaran untuk menu</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRecipe} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Menu *</Label>
                  <select
                    required
                    className="w-full border rounded px-3 py-2"
                    value={recipeForm.product}
                    onChange={(e) => setRecipeForm({ ...recipeForm, product: e.target.value })}
                  >
                    <option value="">Pilih Menu</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Porsi per Resep *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    required
                    value={recipeForm.serving_size}
                    onChange={(e) => setRecipeForm({ ...recipeForm, serving_size: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Waktu Persiapan (menit)</Label>
                  <Input
                    type="number"
                    value={recipeForm.preparation_time}
                    onChange={(e) => setRecipeForm({ ...recipeForm, preparation_time: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Waktu Memasak (menit)</Label>
                  <Input
                    type="number"
                    value={recipeForm.cooking_time}
                    onChange={(e) => setRecipeForm({ ...recipeForm, cooking_time: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Instruksi Memasak</Label>
                <Textarea
                  value={recipeForm.instructions}
                  onChange={(e) => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Catatan</Label>
                <Textarea
                  value={recipeForm.notes}
                  onChange={(e) => setRecipeForm({ ...recipeForm, notes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <Label className="text-lg font-semibold">Bahan-bahan *</Label>
                  <Button type="button" size="sm" onClick={addIngredientRow} className="bg-[#58ff34] hover:bg-[#4de82a] text-black">
                    <HugeiconsIcon icon={Add01Icon} size={14} strokeWidth={2} className="mr-1" />
                    Tambah Bahan
                  </Button>
                </div>

                <div className="space-y-3">
                  {ingredients.map((ing, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-end">
                      <div className="col-span-5">
                        <Label>Bahan dari Dapur</Label>
                        <select
                          required
                          className="w-full border rounded px-2 py-2 text-sm"
                          value={ing.inventory_item}
                          onChange={(e) => updateIngredient(index, 'inventory_item', e.target.value)}
                        >
                          <option value="">Pilih Bahan</option>
                          {kitchenInventory.map(inv => (
                            <option key={inv.id} value={inv.id}>
                              {inv.name} ({inv.unit})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <Label>Jumlah</Label>
                        <Input
                          type="number"
                          step="0.001"
                          required
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                        />
                      </div>
                      <div className="col-span-4">
                        <Label>Catatan</Label>
                        <Input
                          value={ing.notes}
                          onChange={(e) => updateIngredient(index, 'notes', e.target.value)}
                          placeholder="Opsional"
                        />
                      </div>
                      <div className="col-span-1">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => removeIngredientRow(index)}
                          disabled={ingredients.length === 1}
                        >
                          <HugeiconsIcon icon={Delete02Icon} size={14} strokeWidth={2} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" className="bg-[#58ff34] hover:bg-[#4de82a] text-black">
                  Simpan Resep
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resep</CardTitle>
            <HugeiconsIcon icon={ChefHatIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecipes}</div>
            <p className="text-xs text-muted-foreground">{stats.highMarginCount} margin tinggi (≥70%)</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata² Margin</CardTitle>
            <HugeiconsIcon icon={AnalyticsDownIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Profit margin</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata² Biaya</CardTitle>
            <HugeiconsIcon icon={MoneyBag02Icon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Rp {stats.avgCost.toLocaleString('id-ID', {maximumFractionDigits: 0})}</div>
            <p className="text-xs text-muted-foreground">Cost per serving</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bahan Dapur</CardTitle>
            <HugeiconsIcon icon={PackageSentIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kitchenInventory.length}</div>
            <p className="text-xs text-muted-foreground">Item tersedia</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex justify-end items-center gap-3">
        <div className="relative w-64">
          <HugeiconsIcon
            icon={Search01Icon}
            size={16}
            strokeWidth={2}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <Input
            placeholder="Cari nama menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <Select value={filterMargin} onValueChange={setFilterMargin}>
          <SelectTrigger className="w-40 h-9">
            <SelectValue placeholder="Margin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Margin</SelectItem>
            <SelectItem value="high">Tinggi (≥70%)</SelectItem>
            <SelectItem value="medium">Sedang (40-70%)</SelectItem>
            <SelectItem value="low">Rendah (&lt;40%)</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32 h-9">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Nonaktif</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue placeholder="Urutkan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Nama A-Z</SelectItem>
            <SelectItem value="margin-high">Margin Tertinggi</SelectItem>
            <SelectItem value="margin-low">Margin Terendah</SelectItem>
            <SelectItem value="cost-high">Biaya Tertinggi</SelectItem>
            <SelectItem value="cost-low">Biaya Terendah</SelectItem>
            <SelectItem value="price-high">Harga Tertinggi</SelectItem>
            <SelectItem value="price-low">Harga Terendah</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Recipe Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Resep ({filteredRecipes.length})</CardTitle>
          <CardDescription>Klik resep untuk melihat detail bahan dan biaya</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRecipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {recipes.length === 0
                  ? 'Belum ada resep. Klik "Buat Resep" untuk memulai.'
                  : 'Tidak ada resep yang cocok dengan filter.'}
              </p>
            </div>
          ) : (
            <div className="rounded-lg border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Menu</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Porsi</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Bahan</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Harga Jual</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Biaya Bahan</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Profit</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Margin</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Waktu</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecipes.map((r) => {
                    const profit = parseFloat(r.product_price) - parseFloat(r.cost_per_serving)
                    const totalTime = (r.preparation_time || 0) + (r.cooking_time || 0)

                    return (
                      <TableRow
                        key={r.id}
                        className="cursor-pointer hover:bg-gray-50 border-b"
                        onClick={() => viewRecipeDetail(r)}
                      >
                        <TableCell className="font-medium py-4 px-6">{r.product_name}</TableCell>
                        <TableCell className="text-center py-4 px-6">{r.serving_size}</TableCell>
                        <TableCell className="text-center py-4 px-6">
                          <Badge variant="outline">{r.ingredients?.length || 0} item</Badge>
                        </TableCell>
                        <TableCell className="text-right py-4 px-6 font-semibold">
                          Rp {parseFloat(r.product_price).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">
                          Rp {parseFloat(r.cost_per_serving).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right py-4 px-6 text-green-600 font-semibold">
                          Rp {profit.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="text-center py-4 px-6">
                          <Badge
                            className={
                              r.profit_margin >= 70
                                ? "bg-green-500 text-white"
                                : r.profit_margin >= 40
                                ? "bg-yellow-500 text-white"
                                : "bg-red-500 text-white"
                            }
                          >
                            {r.profit_margin.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6 text-sm text-muted-foreground">
                          {totalTime > 0 ? `${totalTime} menit` : '-'}
                        </TableCell>
                        <TableCell className="text-center py-4 px-6">
                          <Badge variant={r.is_active ? "default" : "secondary"}>
                            {r.is_active ? 'Aktif' : 'Nonaktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center py-4 px-6" onClick={(e) => e.stopPropagation()}>
                          <Button size="sm" variant="outline">
                            <HugeiconsIcon icon={Edit01Icon} size={14} strokeWidth={2} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
