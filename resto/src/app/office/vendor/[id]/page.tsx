'use client'

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft01Icon,
  UserGroupIcon,
  Mail01Icon,
  CallIcon,
} from "@hugeicons/core-free-icons"
import { useAuth } from "@/contexts/auth-context"
import { RoleGuard } from "@/components/role-guard"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { api, type VendorDetail } from "@/lib/api"

export default function VendorDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { staff } = useAuth()

  const [vendor, setVendor] = useState<VendorDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const vendorId = params.id as string

  useEffect(() => {
    fetchVendorDetail()
  }, [staff, vendorId])

  const fetchVendorDetail = async () => {
    if (!staff?.branch?.id) return

    setLoading(true)
    try {
      const data = await api.getVendorDetail(vendorId, staff.branch.id)
      setVendor(data)
    } catch (error) {
      console.error('Error fetching vendor detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      DRAFT: { label: 'DRAFT', className: 'bg-gray-500 text-white' },
      PENDING: { label: 'PENDING', className: 'bg-yellow-500 text-white' },
      APPROVED: { label: 'APPROVED', className: 'bg-green-500 text-white' },
      RECEIVED: { label: 'RECEIVED', className: 'bg-blue-500 text-white' },
      CANCELLED: { label: 'CANCELLED', className: 'bg-red-500 text-white' },
    }

    const config = statusConfig[status] || { label: status, className: 'bg-gray-500 text-white' }
    return <Badge className={config.className}>{config.label}</Badge>
  }

  if (loading) {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center py-12 text-muted-foreground">Memuat data vendor...</p>
        </div>
      </RoleGuard>
    )
  }

  if (!vendor) {
    return (
      <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center py-12 text-muted-foreground">Vendor tidak ditemukan</p>
        </div>
      </RoleGuard>
    )
  }

  return (
    <RoleGuard allowedRoles={['ADMIN', 'MANAGER', 'WAREHOUSE']}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            className="rounded"
            onClick={() => router.back()}
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} strokeWidth={2} className="mr-1" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="font-semibold text-blue-600 text-lg">
                  {vendor.name.substring(0, 2).toUpperCase()}
                </span>
              </div>
              {vendor.name}
            </h1>
            <p className="text-muted-foreground">Detail informasi vendor dan riwayat pembelian</p>
          </div>
        </div>

        {/* Vendor Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Purchase Orders</CardDescription>
              <CardTitle className="text-3xl text-blue-600">{vendor.total_purchase_orders}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Nilai Pembelian</CardDescription>
              <CardTitle className="text-2xl text-green-600">
                Rp {parseFloat(vendor.total_amount).toLocaleString('id-ID')}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>PO Terakhir</CardDescription>
              <CardTitle className="text-lg">
                {new Date(vendor.last_order_date).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Rata-rata per PO</CardDescription>
              <CardTitle className="text-2xl text-purple-600">
                Rp {(parseFloat(vendor.total_amount) / vendor.total_purchase_orders).toLocaleString('id-ID', {
                  maximumFractionDigits: 0
                })}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Vendor Details */}
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Informasi Vendor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Contact Info */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">Kontak</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Nama Kontak</p>
                  <p className="font-medium">{vendor.contact || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{vendor.email || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Telepon</p>
                  <p className="font-medium">{vendor.phone || '-'}</p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="font-semibold mb-2 text-gray-700">Alamat</h3>
              <p className="text-gray-600">{vendor.address || '-'}</p>
            </div>

            {/* Business Info */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">Informasi Bisnis</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">NPWP / Tax ID</p>
                  <p className="font-medium font-mono">{vendor.tax_id || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Termin Pembayaran</p>
                  <p className="font-medium">Net {vendor.payment_terms_days} hari</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Purchase Order History */}
        <Card className="bg-white rounded-lg border-0 shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Riwayat Purchase Order</CardTitle>
                <CardDescription>
                  {vendor.purchase_orders.length} purchase order dari vendor ini
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {vendor.purchase_orders.length === 0 ? (
              <div className="text-center py-12 px-6">
                <p className="text-muted-foreground">Belum ada riwayat purchase order</p>
              </div>
            ) : (
              <div className="rounded-lg border-0 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">No. PO</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Tanggal Order</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Tgl. Kirim</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total Item</TableHead>
                      <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total Nilai</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Status</TableHead>
                      <TableHead className="font-semibold text-gray-900 py-4 px-6">Dibuat Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.purchase_orders.map((po) => (
                      <TableRow key={po.id} className="hover:bg-gray-50 border-b">
                        <TableCell className="font-medium py-4 px-6">
                          <Badge variant="outline" className="font-mono">{po.po_number}</Badge>
                        </TableCell>
                        <TableCell className="py-4 px-6 whitespace-nowrap">
                          {new Date(po.order_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="py-4 px-6 whitespace-nowrap">
                          {po.expected_delivery_date ? new Date(po.expected_delivery_date).toLocaleDateString('id-ID', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          }) : '-'}
                        </TableCell>
                        <TableCell className="text-right py-4 px-6">{po.total_items} item</TableCell>
                        <TableCell className="text-right font-semibold py-4 px-6">
                          Rp {parseFloat(po.total_amount).toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell className="py-4 px-6">
                          {getStatusBadge(po.status)}
                        </TableCell>
                        <TableCell className="py-4 px-6 text-muted-foreground">
                          {po.created_by_name || '-'}
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
