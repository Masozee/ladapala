'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  UserGroupIcon,
  DeliveryTruck01Icon,
  Mail01Icon,
  CallIcon,
  Add01Icon,
} from "@hugeicons/core-free-icons"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { api, type Vendor, type VendorCreate } from "@/lib/api"

export default function VendorPage() {
  const router = useRouter()
  const { staff } = useAuth()

  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState<VendorCreate>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    payment_terms_days: 30,
    tax_id: '',
    notes: '',
    branch: 0,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchVendors()
  }, [staff])

  const fetchVendors = async () => {
    if (!staff?.branch?.id) return

    setLoading(true)
    try {
      const data = await api.getVendors(staff.branch.id)
      setVendors(data)
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetail = (vendorId: string) => {
    router.push(`/office/vendor/${vendorId}`)
  }

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staff?.branch?.id) return

    setSubmitting(true)
    try {
      const vendorData = {
        ...formData,
        branch: staff.branch.id,
      }

      await api.createVendor(vendorData)

      // Reset form and close dialog
      setFormData({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        payment_terms_days: 30,
        tax_id: '',
        notes: '',
        branch: 0,
      })
      setIsDialogOpen(false)

      // Refresh vendor list
      fetchVendors()
    } catch (error) {
      console.error('Error creating vendor:', error)
      alert('Gagal membuat vendor. ' + (error instanceof Error ? error.message : 'Silakan coba lagi.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} size={32} strokeWidth={2} className="text-blue-600" />
              Daftar Vendor
            </h1>
            <p className="text-muted-foreground">Kelola informasi vendor dan supplier</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#58ff34] hover:bg-[#4de82a] text-black">
                <HugeiconsIcon icon={Add01Icon} size={20} strokeWidth={2} className="mr-2" />
                Vendor Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Tambah Vendor Baru</DialogTitle>
                <DialogDescription>
                  Isi informasi vendor baru di bawah ini
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateVendor} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Nama Vendor */}
                  <div className="col-span-2">
                    <Label htmlFor="name">Nama Vendor *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="PT Sumber Rejeki Makmur"
                      required
                    />
                  </div>

                  {/* Contact Person */}
                  <div>
                    <Label htmlFor="contact_person">Nama Kontak</Label>
                    <Input
                      id="contact_person"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      placeholder="Budi Santoso"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <Label htmlFor="phone">Telepon</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="021-5551234"
                    />
                  </div>

                  {/* Email */}
                  <div className="col-span-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="vendor@example.com"
                    />
                  </div>

                  {/* Address */}
                  <div className="col-span-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Jl. Raya Pasar Minggu No. 123, Jakarta Selatan"
                      rows={2}
                    />
                  </div>

                  {/* Tax ID */}
                  <div>
                    <Label htmlFor="tax_id">NPWP / Tax ID</Label>
                    <Input
                      id="tax_id"
                      value={formData.tax_id}
                      onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                      placeholder="01.234.567.8-901.000"
                    />
                  </div>

                  {/* Payment Terms */}
                  <div>
                    <Label htmlFor="payment_terms_days">Termin Pembayaran (hari)</Label>
                    <Input
                      id="payment_terms_days"
                      type="number"
                      value={formData.payment_terms_days}
                      onChange={(e) => setFormData({ ...formData, payment_terms_days: parseInt(e.target.value) || 30 })}
                      placeholder="30"
                      min="0"
                    />
                  </div>

                  {/* Notes */}
                  <div className="col-span-2">
                    <Label htmlFor="notes">Catatan</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Catatan tambahan tentang vendor..."
                      rows={2}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    disabled={submitting}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#58ff34] hover:bg-[#4de82a] text-black"
                    disabled={submitting}
                  >
                    {submitting ? 'Menyimpan...' : 'Simpan Vendor'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Vendor Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Vendor</CardDescription>
              <CardTitle className="text-3xl">{vendors.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Purchase Orders</CardDescription>
              <CardTitle className="text-3xl">
                {vendors.reduce((sum, v) => sum + v.total_purchase_orders, 0)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Nilai Pembelian</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                Rp {vendors.reduce((sum, v) => sum + parseFloat(v.total_amount), 0).toLocaleString('id-ID')}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Vendor List */}
        <Card className="bg-white rounded-lg border">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <HugeiconsIcon icon={DeliveryTruck01Icon} size={24} strokeWidth={2} className="text-green-600" />
                  Daftar Vendor
                </CardTitle>
                <CardDescription>
                  {vendors.length} vendor terdaftar
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="text-center py-12 px-6">
                <p className="text-muted-foreground">Memuat data vendor...</p>
              </div>
            ) : vendors.length === 0 ? (
              <div className="text-center py-12 px-6">
                <HugeiconsIcon icon={UserGroupIcon} size={48} strokeWidth={1.5} className="mx-auto mb-2 opacity-30" />
                <p className="text-muted-foreground">Belum ada vendor terdaftar</p>
                <p className="text-sm text-muted-foreground mt-1">Vendor akan muncul setelah Anda membuat Purchase Order</p>
              </div>
            ) : (
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Nama Vendor</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Kontak</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Telepon</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total PO</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total Nilai</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">PO Terakhir</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-gray-50 border-b cursor-pointer"
                        onClick={() => handleViewDetail(vendor.id)}
                      >
                        <TableCell className="font-medium py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="font-semibold text-blue-600">
                                {vendor.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <div className="font-semibold text-blue-600 hover:text-blue-700">
                                {vendor.name}
                              </div>
                              {vendor.email && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                  <HugeiconsIcon icon={Mail01Icon} size={12} strokeWidth={2} />
                                  {vendor.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 px-6">{vendor.contact || '-'}</TableCell>
                        <TableCell className="py-4 px-6">
                          {vendor.phone ? (
                            <div className="flex items-center gap-1 text-sm">
                              <HugeiconsIcon icon={CallIcon} size={14} strokeWidth={2} />
                              {vendor.phone}
                            </div>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">
                          <Badge variant="outline">{vendor.total_purchase_orders} PO</Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold py-4 px-6 text-blue-600">
                          Rp {parseFloat(vendor.total_amount).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="py-4 px-6 whitespace-nowrap">
                          {new Date(vendor.last_order_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  )
}
