'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OfficeLayout from '@/components/OfficeLayout'
import { ChevronLeftIcon } from '@/lib/icons'
import { buildApiUrl } from '@/lib/config'

interface SupplierFormData {
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
}

export default function NewSupplierPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [csrfToken, setCsrfToken] = useState('')
  const [formData, setFormData] = useState<SupplierFormData>({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'Indonesia',
    tax_id: '',
    payment_terms: 'NET 30',
    status: 'ACTIVE',
    notes: ''
  })

  useEffect(() => {
    fetchCSRFToken()
  }, [])

  const fetchCSRFToken = async () => {
    try {
      const response = await fetch(buildApiUrl('user/csrf/'), {
        credentials: 'include',
      })
      if (response.ok) {
        const csrfCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
        if (csrfCookie) {
          setCsrfToken(csrfCookie.split('=')[1])
        }
      }
    } catch (error) {
      console.error('Error fetching CSRF token:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name) {
      alert('Nama supplier harus diisi')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(buildApiUrl('hotel/suppliers/'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/office/suppliers/${data.id}`)
      } else {
        const error = await response.json()
        alert(`Gagal menyimpan: ${JSON.stringify(error)}`)
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert('Gagal menyimpan supplier')
    } finally {
      setSaving(false)
    }
  }

  return (
    <OfficeLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/office/suppliers')}
            className="p-2 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tambah Supplier Baru</h1>
            <p className="text-gray-600 mt-2">Buat data supplier baru</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#4E61D3] text-white">
                <h3 className="text-xl font-bold">Informasi Dasar</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nama Supplier <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Person
                    </label>
                    <input
                      type="text"
                      value={formData.contact_person}
                      onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telepon
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#4E61D3] text-white">
                <h3 className="text-xl font-bold">Alamat</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alamat Lengkap
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kota
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Provinsi
                    </label>
                    <input
                      type="text"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      value={formData.postal_code}
                      onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Negara
                    </label>
                    <input
                      type="text"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#4E61D3] text-white">
                <h3 className="text-xl font-bold">Catatan</h3>
              </div>
              <div className="p-6">
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Catatan tambahan..."
                  className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Business Info */}
            <div className="bg-white border border-gray-200">
              <div className="p-6 bg-[#4E61D3] text-white">
                <h3 className="text-lg font-bold">Informasi Bisnis</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NPWP
                  </label>
                  <input
                    type="text"
                    value={formData.tax_id}
                    onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                    placeholder="XX.XXX.XXX.X-XXX.XXX"
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Terms
                  </label>
                  <input
                    type="text"
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    placeholder="NET 30"
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                    className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#4E61D3] focus:border-[#4E61D3]"
                  >
                    <option value="ACTIVE">Aktif</option>
                    <option value="INACTIVE">Tidak Aktif</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white border border-gray-200 p-6">
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-4 py-3 bg-[#4E61D3] text-white font-medium hover:bg-[#3d4fa8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Supplier'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/office/suppliers')}
                  className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </OfficeLayout>
  )
}
