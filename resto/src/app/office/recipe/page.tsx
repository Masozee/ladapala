"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { HugeiconsIcon } from "@hugeicons/react"
import { Add01Icon, Edit01Icon, Delete02Icon, PackageSentIcon } from "@hugeicons/core-free-icons"
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
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

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
        api.getRecipes({ branch: staff?.branch }),
        api.getProducts({ branch: staff?.branch }),
        api.getInventory({ branch: staff?.branch, location: 'KITCHEN' })
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
          branch: staff?.branch,
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

  const viewRecipeDetail = async (recipe: Recipe) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/recipes/${recipe.id}/`, {
        credentials: 'include'
      })
      const data = await res.json()
      setSelectedRecipe(data)
      setIsDetailOpen(true)
    } catch (error) {
      console.error('Error fetching recipe detail:', error)
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
    <div className="container mx-auto max-w-7xl px-4 py-8 space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Daftar Resep</CardTitle>
          <CardDescription>Klik resep untuk melihat detail bahan dan biaya</CardDescription>
        </CardHeader>
        <CardContent>
          {recipes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Belum ada resep. Klik "Buat Resep" untuk memulai.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Menu</TableHead>
                  <TableHead>Porsi</TableHead>
                  <TableHead>Harga Jual</TableHead>
                  <TableHead>Biaya per Porsi</TableHead>
                  <TableHead>Margin</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer hover:bg-gray-50" onClick={() => viewRecipeDetail(r)}>
                    <TableCell className="font-medium">{r.product_name}</TableCell>
                    <TableCell>{r.serving_size} porsi</TableCell>
                    <TableCell>Rp {parseFloat(r.product_price).toLocaleString('id-ID')}</TableCell>
                    <TableCell>Rp {parseFloat(r.cost_per_serving).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      <Badge className={r.profit_margin > 50 ? "bg-green-500" : r.profit_margin > 30 ? "bg-yellow-500" : "bg-red-500"}>
                        {r.profit_margin}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.is_active ? "default" : "secondary"}>
                        {r.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline">
                        <HugeiconsIcon icon={Edit01Icon} size={14} strokeWidth={2} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recipe Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Resep: {selectedRecipe?.product_name}</DialogTitle>
            <DialogDescription>
              Porsi: {selectedRecipe?.serving_size} | Total Biaya: Rp {parseFloat(selectedRecipe?.total_cost || '0').toLocaleString('id-ID')}
            </DialogDescription>
          </DialogHeader>

          {selectedRecipe && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Harga Jual</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">Rp {parseFloat(selectedRecipe.product_price).toLocaleString('id-ID')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Biaya per Porsi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">Rp {parseFloat(selectedRecipe.cost_per_serving).toLocaleString('id-ID')}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Margin Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">{selectedRecipe.profit_margin}%</p>
                  </CardContent>
                </Card>
              </div>

              {selectedRecipe.preparation_time && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">Waktu Persiapan:</span> {selectedRecipe.preparation_time} menit
                  </div>
                  <div>
                    <span className="font-semibold">Waktu Memasak:</span> {selectedRecipe.cooking_time} menit
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <HugeiconsIcon icon={PackageSentIcon} size={16} strokeWidth={2} />
                  Bahan-bahan ({selectedRecipe.ingredients.length} item)
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bahan</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Lokasi</TableHead>
                      <TableHead>Biaya</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedRecipe.ingredients.map((ing) => (
                      <TableRow key={ing.id}>
                        <TableCell className="font-medium">{ing.inventory_item_name}</TableCell>
                        <TableCell>{parseFloat(ing.quantity).toLocaleString('id-ID')} {ing.unit}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{ing.inventory_item_location === 'KITCHEN' ? 'Dapur' : 'Gudang'}</Badge>
                        </TableCell>
                        <TableCell>Rp {parseFloat(ing.total_cost).toLocaleString('id-ID')}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{ing.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {selectedRecipe.instructions && (
                <div>
                  <h3 className="font-semibold mb-2">Instruksi Memasak</h3>
                  <p className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded">{selectedRecipe.instructions}</p>
                </div>
              )}

              {selectedRecipe.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Catatan</h3>
                  <p className="text-sm whitespace-pre-line bg-gray-50 p-3 rounded">{selectedRecipe.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
