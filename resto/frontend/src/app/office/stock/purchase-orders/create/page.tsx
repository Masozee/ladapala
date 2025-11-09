'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Delete01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons"
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
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { api, Inventory, PurchaseOrderCreate, Vendor } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface POItem {
  inventory_item: number
  inventory_item_name?: string
  inventory_item_unit?: string
  quantity: string
  unit_price: string
  total_price: number
  notes?: string
}

export default function CreatePurchaseOrderPage() {
  const router = useRouter()
  const { staff, user } = useAuth()
  const { toast } = useToast()

  const [inventory, setInventory] = useState<Inventory[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // PO Header Form
  const [selectedVendorId, setSelectedVendorId] = useState('')
  const [supplierName, setSupplierName] = useState('')
  const [supplierContact, setSupplierContact] = useState('')
  const [supplierEmail, setSupplierEmail] = useState('')
  const [supplierPhone, setSupplierPhone] = useState('')
  const [supplierAddress, setSupplierAddress] = useState('')
  const [paymentTermsDays, setPaymentTermsDays] = useState(30)
  const [taxId, setTaxId] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [termsAndConditions, setTermsAndConditions] = useState('')

  // PO Items
  const [items, setItems] = useState<POItem[]>([])
  const [selectedItemId, setSelectedItemId] = useState<string>('')

  useEffect(() => {
    fetchInventory()
    fetchVendors()
  }, [staff])

  const fetchInventory = async () => {
    if (!staff?.branch?.id) return

    try {
      setIsLoading(true)
      const data = await api.getAllInventory({
        branch: staff.branch.id,
        location: 'WAREHOUSE'
      })
      // Filter to show only WAREHOUSE items with base units
      const warehouseItems = data.filter(item => item.location === 'WAREHOUSE')
      setInventory(warehouseItems)
    } catch (error) {
      console.error('Error fetching inventory:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data item",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVendors = async () => {
    if (!staff?.branch?.id) return

    try {
      const data = await api.getVendors(staff.branch.id)
      setVendors(data)
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast({
        title: "Error",
        description: "Gagal memuat data vendor",
        variant: "destructive"
      })
    }
  }

  const handleVendorChange = (vendorId: string) => {
    setSelectedVendorId(vendorId)

    const vendor = vendors.find(v => v.id === vendorId)
    if (vendor) {
      setSupplierName(vendor.name)
      setSupplierContact(vendor.contact)
      setSupplierEmail(vendor.email)
      setSupplierPhone(vendor.phone)
      setSupplierAddress(vendor.address)
      setPaymentTermsDays(vendor.payment_terms_days)
      setTaxId(vendor.tax_id)
    }
  }

  const handleAddItem = () => {
    if (!selectedItemId) {
      toast({
        title: "Error",
        description: "Pilih item terlebih dahulu",
        variant: "destructive"
      })
      return
    }

    const item = inventory.find(i => i.id === parseInt(selectedItemId))
    if (!item) return

    // Check if item already exists in PO
    if (items.find(i => i.inventory_item === item.id)) {
      toast({
        title: "Error",
        description: "Item sudah ditambahkan ke PO",
        variant: "destructive"
      })
      return
    }

    const newItem: POItem = {
      inventory_item: item.id,
      inventory_item_name: item.name,
      inventory_item_unit: item.unit,
      quantity: '1',
      unit_price: '0',
      total_price: 0,
      notes: ''
    }

    setItems([...items, newItem])
    setSelectedItemId('')
  }

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const handleItemChange = (index: number, field: keyof POItem, value: string) => {
    const updatedItems = [...items]
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    }

    // Calculate total price
    if (field === 'quantity' || field === 'unit_price') {
      const qty = parseFloat(updatedItems[index].quantity) || 0
      const price = parseFloat(updatedItems[index].unit_price) || 0
      updatedItems[index].total_price = qty * price
    }

    setItems(updatedItems)
  }

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.total_price, 0)
  }

  const handleSubmit = async (status: 'DRAFT' | 'SUBMITTED') => {
    // Validation
    if (!selectedVendorId || !supplierName.trim()) {
      toast({
        title: "Error",
        description: "Pilih vendor terlebih dahulu",
        variant: "destructive"
      })
      return
    }

    if (items.length === 0) {
      toast({
        title: "Error",
        description: "Tambahkan minimal 1 item ke PO",
        variant: "destructive"
      })
      return
    }

    // Check if all items have quantity and unit price
    const invalidItems = items.filter(item =>
      parseFloat(item.quantity) <= 0 || parseFloat(item.unit_price) <= 0
    )

    if (invalidItems.length > 0) {
      toast({
        title: "Error",
        description: "Semua item harus memiliki quantity dan harga yang valid",
        variant: "destructive"
      })
      return
    }

    if (!staff?.branch?.id || !user?.id) {
      toast({
        title: "Error",
        description: "Data branch atau user tidak ditemukan",
        variant: "destructive"
      })
      return
    }

    try {
      setIsSubmitting(true)

      const poData: PurchaseOrderCreate = {
        branch: staff.branch.id,
        supplier_name: supplierName,
        supplier_contact: supplierContact || undefined,
        supplier_email: supplierEmail || undefined,
        supplier_phone: supplierPhone || undefined,
        supplier_address: supplierAddress || undefined,
        payment_terms_days: paymentTermsDays,
        tax_id: taxId || undefined,
        order_date: orderDate,
        expected_delivery_date: expectedDeliveryDate || undefined,
        created_by: staff.id,
        notes: notes || undefined,
        terms_and_conditions: termsAndConditions || undefined,
        items: items.map(item => ({
          inventory_item: item.inventory_item,
          quantity: item.quantity,
          unit_price: item.unit_price,
          notes: item.notes || undefined
        }))
      }

      const createdPO = await api.createPurchaseOrder(poData)

      // If submitted, update status
      if (status === 'SUBMITTED' && createdPO.id) {
        await api.updatePurchaseOrder(createdPO.id, { status: 'SUBMITTED' })
      }

      toast({
        title: "Berhasil",
        description: `PO berhasil ${status === 'DRAFT' ? 'disimpan sebagai draft' : 'diajukan'}`,
      })

      router.push('/office/stock/purchase-orders')
    } catch (error) {
      console.error('Error creating PO:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error) || "Gagal membuat PO",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Buat Purchase Order Baru</h1>
              <p className="text-muted-foreground">Buat PO untuk pembelian barang dari supplier</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="rounded"
              onClick={() => handleSubmit('DRAFT')}
              disabled={isSubmitting || !selectedVendorId}
            >
              Simpan Draft
            </Button>
            <Button
              className="rounded bg-[#58ff34] hover:bg-[#4de82a] text-black"
              onClick={() => handleSubmit('SUBMITTED')}
              disabled={isSubmitting || !selectedVendorId}
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={18} strokeWidth={2} className="mr-2" />
              Ajukan PO
            </Button>
          </div>
        </div>

        {/* Two Column Layout */}
        <div>
          <div className="grid grid-cols-12 gap-6">
            {/* Left Column - Form (1/4) */}
            <div className="col-span-3 space-y-4">
              {/* Vendor Selection */}
              <Card className="bg-white rounded-lg border">
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Pilih Vendor *</Label>
                      <Select value={selectedVendorId} onValueChange={handleVendorChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih vendor..." />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map(vendor => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedVendorId && (
                      <>
                        <div className="space-y-2">
                          <Label>Tanggal Order</Label>
                          <Input
                            type="date"
                            value={orderDate}
                            onChange={(e) => setOrderDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Tanggal Pengiriman</Label>
                          <Input
                            type="date"
                            value={expectedDeliveryDate}
                            onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Catatan</Label>
                          <Textarea
                            placeholder="Catatan tambahan"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Syarat & Ketentuan</Label>
                          <Textarea
                            placeholder="Syarat pembayaran, dll"
                            value={termsAndConditions}
                            onChange={(e) => setTermsAndConditions(e.target.value)}
                            rows={2}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Item Selection */}
              {selectedVendorId && (
                <Card className="bg-white rounded-lg border">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold">Tambah Item</h3>
                      <div className="space-y-2">
                        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih item..." />
                          </SelectTrigger>
                          <SelectContent>
                            {inventory.map(item => (
                              <SelectItem key={item.id} value={item.id.toString()}>
                                {item.name} ({item.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          className="w-full bg-[#58ff34] hover:bg-[#4de82a] text-black"
                          onClick={handleAddItem}
                          disabled={!selectedItemId}
                        >
                          <HugeiconsIcon icon={Add01Icon} size={18} strokeWidth={2} className="mr-2" />
                          Tambah Item
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - PO Preview (3/4) */}
            <div className="col-span-9">
              <Card className="bg-white rounded-lg border">
                <CardContent className="pt-8 px-12 pb-12">
                  {!selectedVendorId ? (
                    <div className="text-center py-24 text-muted-foreground">
                      <p className="text-lg">Pilih vendor untuk memulai membuat Purchase Order</p>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {/* PO Header */}
                      <div className="border-b pb-6">
                        <h2 className="text-3xl font-bold text-center mb-2">PURCHASE ORDER</h2>
                        <p className="text-center text-sm text-gray-500 mb-6">
                          PO # {new Date().getFullYear()}{(new Date().getMonth() + 1).toString().padStart(2, '0')}{new Date().getDate().toString().padStart(2, '0')}-{Math.floor(Math.random() * 10000).toString().padStart(4, '0')}
                        </p>
                        <div className="grid grid-cols-2 gap-8">
                          {/* From */}
                          <div>
                            <h3 className="font-semibold text-sm text-gray-500 mb-2">DARI:</h3>
                            <p className="font-bold text-lg">{staff?.branch?.name || 'Restaurant Name'}</p>
                          </div>
                          {/* To */}
                          <div>
                            <h3 className="font-semibold text-sm text-gray-500 mb-2">KEPADA:</h3>
                            <p className="font-bold text-lg">{supplierName}</p>
                            <p className="text-sm text-gray-600">{supplierContact}</p>
                            <p className="text-sm text-gray-600">{supplierPhone}</p>
                            <p className="text-sm text-gray-600">{supplierEmail}</p>
                            <p className="text-sm text-gray-600 mt-1">{supplierAddress}</p>
                          </div>
                        </div>
                      </div>

                      {/* PO Info */}
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tanggal Order:</span>
                          <span className="font-medium">
                            {new Date(orderDate).toLocaleDateString('id-ID', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        {expectedDeliveryDate && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Tanggal Pengiriman:</span>
                            <span className="font-medium">
                              {new Date(expectedDeliveryDate).toLocaleDateString('id-ID', {
                                day: '2-digit',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">Termin Pembayaran:</span>
                          <span className="font-medium">Net {paymentTermsDays} hari</span>
                        </div>
                        {taxId && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">NPWP:</span>
                            <span className="font-medium font-mono">{taxId}</span>
                          </div>
                        )}
                      </div>

                      {/* Items Table */}
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="font-semibold text-gray-900">No</TableHead>
                              <TableHead className="font-semibold text-gray-900">Nama Item</TableHead>
                              <TableHead className="font-semibold text-gray-900 text-center">Satuan</TableHead>
                              <TableHead className="font-semibold text-gray-900 text-right">Quantity</TableHead>
                              <TableHead className="font-semibold text-gray-900 text-center">Harga Satuan</TableHead>
                              <TableHead className="font-semibold text-gray-900 text-center w-20">Aksi</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {items.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                  Belum ada item. Tambah item dari form di sebelah kiri.
                                </TableCell>
                              </TableRow>
                            ) : (
                              items.map((item, index) => (
                                <TableRow key={index}>
                                  <TableCell className="font-medium">{index + 1}</TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{item.inventory_item_name}</p>
                                      {item.notes && (
                                        <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline">{item.inventory_item_unit}</Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-end">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        className="text-right w-24"
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-center">
                                      <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={item.unit_price}
                                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                                        className="text-center w-32"
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveItem(index)}
                                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <HugeiconsIcon icon={Delete01Icon} size={16} strokeWidth={2} />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Notes & Terms */}
                      {(notes || termsAndConditions) && (
                        <div className="border-t pt-6 space-y-4">
                          {notes && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Catatan:</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{notes}</p>
                            </div>
                          )}
                          {termsAndConditions && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2">Syarat dan Ketentuan:</h4>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">{termsAndConditions}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </RoleGuard>
  )
}
