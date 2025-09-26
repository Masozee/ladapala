"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Clock,
  Users,
  ChefHat,
  BookOpen,
  DollarSign,
  Info
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Recipe {
  id: string
  name: string
  category: string
  prepTime: number
  cookTime: number
  servings: number
  cost: number
  price: number
  margin: number
  ingredients: Ingredient[]
  instructions: string[]
  popularity: "high" | "medium" | "low"
}

interface Ingredient {
  name: string
  quantity: number
  unit: string
  cost: number
}

const mockRecipes: Recipe[] = [
  {
    id: "1",
    name: "Nasi Goreng Spesial",
    category: "Makanan Utama",
    prepTime: 10,
    cookTime: 15,
    servings: 1,
    cost: 12000,
    price: 25000,
    margin: 52,
    popularity: "high",
    ingredients: [
      { name: "Beras", quantity: 200, unit: "gram", cost: 3000 },
      { name: "Telur", quantity: 2, unit: "butir", cost: 4000 },
      { name: "Ayam", quantity: 100, unit: "gram", cost: 3500 },
      { name: "Bumbu", quantity: 50, unit: "gram", cost: 1500 }
    ],
    instructions: [
      "Panaskan minyak dalam wajan",
      "Tumis bumbu hingga harum",
      "Masukkan ayam, masak hingga matang",
      "Tambahkan nasi dan aduk rata",
      "Buat telur mata sapi di wajan terpisah",
      "Sajikan dengan telur di atas nasi goreng"
    ]
  },
  {
    id: "2",
    name: "Ayam Bakar Madu",
    category: "Makanan Utama",
    prepTime: 30,
    cookTime: 45,
    servings: 1,
    cost: 18000,
    price: 35000,
    margin: 49,
    popularity: "high",
    ingredients: [
      { name: "Ayam", quantity: 250, unit: "gram", cost: 10000 },
      { name: "Madu", quantity: 50, unit: "ml", cost: 3000 },
      { name: "Kecap Manis", quantity: 30, unit: "ml", cost: 1500 },
      { name: "Bumbu Marinasi", quantity: 40, unit: "gram", cost: 3500 }
    ],
    instructions: [
      "Marinasi ayam dengan bumbu selama 30 menit",
      "Campur madu dan kecap untuk glazing",
      "Bakar ayam di atas api sedang",
      "Olesi dengan campuran madu berkala",
      "Bakar hingga matang dan berwarna kecoklatan"
    ]
  },
  {
    id: "3",
    name: "Es Teh Manis",
    category: "Minuman",
    prepTime: 5,
    cookTime: 0,
    servings: 1,
    cost: 2000,
    price: 8000,
    margin: 75,
    popularity: "medium",
    ingredients: [
      { name: "Teh Celup", quantity: 1, unit: "kantong", cost: 500 },
      { name: "Gula", quantity: 20, unit: "gram", cost: 500 },
      { name: "Es Batu", quantity: 200, unit: "gram", cost: 500 },
      { name: "Air", quantity: 250, unit: "ml", cost: 500 }
    ],
    instructions: [
      "Seduh teh dengan air panas",
      "Tambahkan gula dan aduk hingga larut",
      "Dinginkan sebentar",
      "Tambahkan es batu",
      "Sajikan dingin"
    ]
  }
]

const categories = ["Semua", "Makanan Utama", "Makanan Pembuka", "Makanan Penutup", "Minuman", "Snack"]

export default function RecipePage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Semua")
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)

  const filteredRecipes = mockRecipes.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "Semua" || recipe.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getPopularityBadge = (popularity: Recipe["popularity"]) => {
    switch (popularity) {
      case "high":
        return <Badge className="bg-green-500 text-white">Populer</Badge>
      case "medium":
        return <Badge className="bg-yellow-500 text-white">Sedang</Badge>
      case "low":
        return <Badge className="bg-gray-500 text-white">Rendah</Badge>
    }
  }

  const getMarginColor = (margin: number) => {
    if (margin >= 50) return "text-green-600"
    if (margin >= 30) return "text-yellow-600"
    return "text-red-600"
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8 flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Resep & Menu</h1>
          <p className="text-muted-foreground">Kelola resep masakan dan kalkulasi biaya</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded">
            <BookOpen className="mr-2 h-4 w-4" />
            Import Resep
          </Button>
          <Button className="rounded bg-blue-600 hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Tambah Resep
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-lg border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Resep</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockRecipes.length}</div>
            <p className="text-xs text-muted-foreground">Resep aktif</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Rata-rata</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(mockRecipes.reduce((acc, r) => acc + r.margin, 0) / mockRecipes.length)}%
            </div>
            <p className="text-xs text-muted-foreground">Keuntungan</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Menu Populer</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {mockRecipes.filter(r => r.popularity === "high").length}
            </div>
            <p className="text-xs text-muted-foreground">Menu favorit</p>
          </CardContent>
        </Card>
        <Card className="rounded-lg border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waktu Rata-rata</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(mockRecipes.reduce((acc, r) => acc + r.prepTime + r.cookTime, 0) / mockRecipes.length)} menit
            </div>
            <p className="text-xs text-muted-foreground">Persiapan + masak</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recipes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="recipes">Daftar Resep</TabsTrigger>
          <TabsTrigger value="categories">Kategori</TabsTrigger>
          <TabsTrigger value="costs">Analisis Biaya</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="space-y-4">
          <Card className="rounded-lg border-gray-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resep Masakan</CardTitle>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Cari resep..."
                      className="pl-8 w-[200px]"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRecipes.map((recipe) => (
                  <Card key={recipe.id} className="cursor-pointer hover:shadow-lg transition-shadow rounded-lg border-gray-200"
                    onClick={() => setSelectedRecipe(recipe)}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{recipe.name}</CardTitle>
                          <CardDescription>{recipe.category}</CardDescription>
                        </div>
                        {getPopularityBadge(recipe.popularity)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Waktu:</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {recipe.prepTime + recipe.cookTime} menit
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Porsi:</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {recipe.servings} porsi
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Biaya:</span>
                          <span>Rp {recipe.cost.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Harga Jual:</span>
                          <span>Rp {recipe.price.toLocaleString("id-ID")}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Margin:</span>
                          <span className={getMarginColor(recipe.margin)}>{recipe.margin}%</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button size="sm" variant="outline" className="flex-1 rounded">
                          <Edit className="mr-1 h-3 w-3" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 rounded">
                          <Info className="mr-1 h-3 w-3" />
                          Detail
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedRecipe && (
            <Card className="rounded-lg border-gray-200">
              <CardHeader>
                <CardTitle>{selectedRecipe.name} - Detail Resep</CardTitle>
                <CardDescription>Bahan dan cara pembuatan</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <h3 className="font-semibold mb-2">Bahan-bahan:</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Bahan</TableHead>
                          <TableHead>Jumlah</TableHead>
                          <TableHead>Biaya</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedRecipe.ingredients.map((ing, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{ing.name}</TableCell>
                            <TableCell>{ing.quantity} {ing.unit}</TableCell>
                            <TableCell>Rp {ing.cost.toLocaleString("id-ID")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Cara Pembuatan:</h3>
                    <ol className="space-y-2">
                      {selectedRecipe.instructions.map((instruction, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="font-semibold text-muted-foreground">{idx + 1}.</span>
                          <span className="text-sm">{instruction}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card className="rounded-lg border-gray-200">
            <CardHeader>
              <CardTitle>Kategori Menu</CardTitle>
              <CardDescription>Distribusi resep berdasarkan kategori</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {categories.slice(1).map(category => {
                  const count = mockRecipes.filter(r => r.category === category).length
                  return (
                    <Card key={category} className="rounded-lg border-gray-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{category}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">{count}</div>
                        <p className="text-xs text-muted-foreground">resep</p>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="costs" className="space-y-4">
          <Card className="rounded-lg border-gray-200">
            <CardHeader>
              <CardTitle>Analisis Biaya & Keuntungan</CardTitle>
              <CardDescription>Perbandingan biaya produksi dan harga jual</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Menu</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Biaya</TableHead>
                    <TableHead className="text-right">Harga Jual</TableHead>
                    <TableHead className="text-right">Keuntungan</TableHead>
                    <TableHead className="text-right">Margin</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRecipes.map((recipe) => (
                    <TableRow key={recipe.id}>
                      <TableCell className="font-medium">{recipe.name}</TableCell>
                      <TableCell>{recipe.category}</TableCell>
                      <TableCell className="text-right">
                        Rp {recipe.cost.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {recipe.price.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        Rp {(recipe.price - recipe.cost).toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className={`text-right font-semibold ${getMarginColor(recipe.margin)}`}>
                        {recipe.margin}%
                      </TableCell>
                      <TableCell>{getPopularityBadge(recipe.popularity)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  )
}