'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import OfficeLayout from '@/components/OfficeLayout'
import {
  ChevronLeftIcon,
  PencilEdit02Icon,
  Building03Icon,
  Call02Icon,
  Mail01Icon,
  Location01Icon,
  File01Icon,
  CreditCardIcon,
  Clock01Icon
} from '@/lib/icons'
import { buildApiUrl } from '@/lib/config'

interface Supplier {
  id: number
  name: string
  contact_person: string
  email: string
  phone: string
  address: string
  city: string
  province: string
  postal_code: string
  country: string
  tax_id: string
  payment_terms: string
  status: 'ACTIVE' | 'INACTIVE'
  notes: string
  created_at: string
  updated_at: string
}

export default function SupplierDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      fetchSupplier()
    }
  }, [params.id])

  const fetchSupplier = async () => {
    try {
      setLoading(true)
      const response = await fetch(buildApiUrl(`hotel/suppliers/${params.id}/`), {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setSupplier(data)
      } else {
        router.push('/office/suppliers')
      }
    } catch (error) {
      console.error('Error fetching supplier:', error)
      router.push('/office/suppliers')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <OfficeLayout>
        <div className="flex items-center justify-center h-96">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E61D3]"></div>
        </div>
      </OfficeLayout>
    )
  }

  if (!supplier) {
    return null
  }

  return (
    <OfficeLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/office/suppliers')}
              className="p-2 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detail Supplier</h1>
              <p className="text-gray-600 mt-2">Informasi lengkap supplier</p>
            </div>
          </div>
          <button
            onClick={() => router.push(`/office/suppliers/${supplier.id}/edit`)}
            className="bg-[#4E61D3] text-white px-6 py-3 font-medium hover:bg-[#3d4fa8] transition-colors flex items-center space-x-2"
          >
            <PencilEdit02Icon className="h-5 w-5" />
            <span>Edit Supplier</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#4E61D3] text-white">
              <h3 className="text-xl font-bold">Informasi Dasar</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Nama Supplier</label>
                  <div className="flex items-center gap-2">
                    <Building03Icon className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900 font-medium">{supplier.name}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Contact Person</label>
                  <p className="text-gray-900">{supplier.contact_person || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail01Icon className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{supplier.email || '-'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Telepon</label>
                  <div className="flex items-center gap-2">
                    <Call02Icon className="h-4 w-4 text-gray-400" />
                    <p className="text-gray-900">{supplier.phone || '-'}</p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className={`inline-flex px-3 py-1 text-sm font-medium ${getStatusColor(supplier.status)}`}>
                    {supplier.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#4E61D3] text-white">
              <h3 className="text-xl font-bold">Alamat</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Alamat Lengkap</label>
                  <div className="flex items-start gap-2">
                    <Location01Icon className="h-4 w-4 text-gray-400 mt-1" />
                    <p className="text-gray-900">{supplier.address || '-'}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Kota</label>
                  <p className="text-gray-900">{supplier.city || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Provinsi</label>
                  <p className="text-gray-900">{supplier.province || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Kode Pos</label>
                  <p className="text-gray-900">{supplier.postal_code || '-'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Negara</label>
                  <p className="text-gray-900">{supplier.country || 'Indonesia'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {supplier.notes && (
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#4E61D3] text-white">
                <h3 className="text-xl font-bold">Catatan</h3>
              </div>
              <div className="p-6">
                <p className="text-gray-900 whitespace-pre-wrap">{supplier.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Business Information */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#4E61D3] text-white">
              <h3 className="text-lg font-bold">Informasi Bisnis</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">NPWP</label>
                <div className="flex items-center gap-2">
                  <File01Icon className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900 text-sm">{supplier.tax_id || '-'}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Payment Terms</label>
                <div className="flex items-center gap-2">
                  <CreditCardIcon className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900 text-sm">{supplier.payment_terms || '-'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="bg-white border border-gray-200">
            <div className="p-6 bg-[#4E61D3] text-white">
              <h3 className="text-lg font-bold">Informasi Sistem</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Dibuat</label>
                <div className="flex items-center gap-2">
                  <Clock01Icon className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900 text-sm">{formatDate(supplier.created_at)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Terakhir Diubah</label>
                <div className="flex items-center gap-2">
                  <Clock01Icon className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900 text-sm">{formatDate(supplier.updated_at)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </OfficeLayout>
  )
}
