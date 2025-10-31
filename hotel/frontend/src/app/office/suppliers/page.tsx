'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OfficeLayout from '@/components/OfficeLayout'
import {
  Add01Icon,
  Search02Icon,
  FilterIcon,
  EyeIcon,
  PencilEdit02Icon,
  MoreHorizontalIcon,
  Building03Icon,
  Call02Icon,
  Mail01Icon,
  Cancel01Icon
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

interface PaginatedResponse {
  count: number
  next: string | null
  previous: string | null
  results: Supplier[]
}

export default function SuppliersPage() {
  const router = useRouter()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [openMenuId, setOpenMenuId] = useState<number | null>(null)

  useEffect(() => {
    fetchSuppliers()
  }, [statusFilter])

  useEffect(() => {
    const handleClickOutside = () => {
      if (openMenuId !== null) {
        setOpenMenuId(null)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [openMenuId])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      params.append('ordering', '-created_at')

      const response = await fetch(buildApiUrl(`hotel/suppliers/?${params.toString()}`), {
        credentials: 'include',
      })

      if (response.ok) {
        const data: PaginatedResponse = await response.json()
        setSuppliers(data.results || data)
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.phone.includes(searchTerm)

    return matchesSearch
  })

  const getStatusColor = (status: string) => {
    return status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
  }

  const activeFilters = []
  if (statusFilter) {
    activeFilters.push({ type: 'status', value: statusFilter === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif' })
  }

  const removeFilter = (type: string) => {
    if (type === 'status') setStatusFilter('')
  }

  const activeCount = suppliers.filter(s => s.status === 'ACTIVE').length
  const inactiveCount = suppliers.filter(s => s.status === 'INACTIVE').length

  return (
    <OfficeLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Suppliers</h1>
            <p className="text-gray-600 mt-2">Manajemen data supplier dan vendor</p>
          </div>
          <button
            onClick={() => router.push('/office/suppliers/new')}
            className="bg-[#4E61D3] text-white px-6 py-3 font-medium hover:bg-[#3d4fa8] transition-colors flex items-center space-x-2"
          >
            <Add01Icon className="h-5 w-5" />
            <span>Tambah Supplier</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Suppliers</p>
              <p className="text-3xl font-bold text-[#4E61D3] mt-2">{suppliers.length}</p>
            </div>
            <Building03Icon className="h-8 w-8 text-[#4E61D3]" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Aktif</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{activeCount}</p>
            </div>
            <Building03Icon className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Tidak Aktif</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">{inactiveCount}</p>
            </div>
            <Building03Icon className="h-8 w-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Search and Filters Row */}
      <div className="mb-4 flex items-center justify-end gap-3">
        {/* Search */}
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search02Icon className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Cari supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-full"
          />
        </div>

        {/* Status Filter */}
        <div className="relative w-40">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FilterIcon className="h-4 w-4 text-gray-400" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E61D3] focus:border-[#4E61D3] w-full appearance-none bg-white"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Tidak Aktif</option>
          </select>
        </div>
      </div>

      {/* Active Filters Pills */}
      {activeFilters.length > 0 && (
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Filter Aktif:</span>
          {activeFilters.map((filter, index) => (
            <div
              key={index}
              className="inline-flex items-center gap-1 bg-[#4E61D3] text-white px-3 py-1 text-sm rounded-full"
            >
              <span>{filter.value}</span>
              <button
                onClick={() => removeFilter(filter.type)}
                className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
              >
                <Cancel01Icon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-gray-200 text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4E61D3]"></div>
          <p className="text-gray-600 mt-4">Memuat data supplier...</p>
        </div>
      )}

      {/* Suppliers Table */}
      {!loading && (
        <div className="bg-white border border-gray-200">
          <div className="p-6 bg-[#4E61D3] text-white">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Daftar Supplier</h3>
                <p className="text-sm text-gray-100 mt-1">Data supplier dan vendor hotel</p>
              </div>
            </div>
          </div>

          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 bg-gray-50">
              <Building03Icon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada supplier</h3>
              <p className="text-gray-600">Belum ada data supplier yang tercatat.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-[#4E61D3]">
                  <tr>
                    <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Nama Supplier
                    </th>
                    <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Contact Person
                    </th>
                    <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Kontak
                    </th>
                    <th className="border border-gray-300 text-left py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Lokasi
                    </th>
                    <th className="border border-gray-300 text-center py-3 px-4 text-xs font-bold text-white uppercase tracking-wider">
                      Status
                    </th>
                    <th className="border border-gray-300 text-center py-3 px-4 text-xs font-bold text-white uppercase tracking-wider w-[70px]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white">
                  {filteredSuppliers.map(supplier => (
                    <tr key={supplier.id} className="hover:bg-gray-100 transition-colors">
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="font-medium text-gray-900">{supplier.name}</div>
                        {supplier.tax_id && (
                          <div className="text-xs text-gray-500 mt-0.5">NPWP: {supplier.tax_id}</div>
                        )}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-900">
                        {supplier.contact_person || '-'}
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {supplier.phone && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Call02Icon className="h-3 w-3" />
                              {supplier.phone}
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Mail01Icon className="h-3 w-3" />
                              {supplier.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-sm text-gray-600">
                        <div>{supplier.city || '-'}</div>
                        {supplier.province && (
                          <div className="text-xs text-gray-500">{supplier.province}</div>
                        )}
                      </td>
                      <td className="border border-gray-200 px-4 py-3 text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium ${getStatusColor(supplier.status)}`}>
                          {supplier.status === 'ACTIVE' ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td className="border border-gray-200 px-4 py-3">
                        <div className="flex items-center justify-center relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuId(openMenuId === supplier.id ? null : supplier.id)
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors border border-gray-300"
                          >
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </button>

                          {openMenuId === supplier.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 shadow-lg z-10">
                              <button
                                onClick={() => router.push(`/office/suppliers/${supplier.id}`)}
                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <EyeIcon className="h-4 w-4 mr-2 text-gray-400" />
                                Lihat Detail
                              </button>
                              <button
                                onClick={() => router.push(`/office/suppliers/${supplier.id}/edit`)}
                                className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              >
                                <PencilEdit02Icon className="h-4 w-4 mr-2 text-gray-400" />
                                Edit Supplier
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </OfficeLayout>
  )
}
