'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HugeiconsIcon } from '@hugeicons/react'
import { UserAdd01Icon, Search01Icon, UserCircleIcon, Award01Icon, Cancel01Icon, ArrowLeft01Icon } from '@hugeicons/core-free-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { api, Customer } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'

export default function MembershipPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [tierFilter, setTierFilter] = useState<string>('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  // Registration form state
  const [phoneNumber, setPhoneNumber] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  useEffect(() => {
    fetchCustomers()
  }, [tierFilter, currentPage, searchQuery])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params: any = {
        is_active: true,
        page: currentPage,
        page_size: pageSize
      }
      if (tierFilter) params.membership_tier = tierFilter
      if (searchQuery) params.search = searchQuery

      const response = await api.getCustomers(params)
      setCustomers(response.results)
      setTotalCount(response.count)
    } catch (error) {
      console.error('Error fetching customers:', error)
      toast({
        title: 'Error',
        description: 'Gagal memuat data member',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!phoneNumber || !name) {
      toast({
        title: 'Error',
        description: 'Nomor telepon dan nama wajib diisi',
        variant: 'destructive',
      })
      return
    }

    try {
      const newCustomer = await api.createCustomer({
        phone_number: phoneNumber,
        name,
        email: email || undefined,
      })

      toast({
        title: 'Berhasil',
        description: `Member baru terdaftar dengan nomor ${newCustomer.membership_number}`,
      })

      setPhoneNumber('')
      setName('')
      setEmail('')
      setShowRegister(false)
      fetchCustomers()
    } catch (error: any) {
      console.error('Error registering customer:', error)
      toast({
        title: 'Error',
        description: error.message || 'Gagal mendaftarkan member baru',
        variant: 'destructive',
      })
    }
  }

  const handleViewDetail = async (customer: Customer) => {
    try {
      const refreshed = await api.getCustomer(customer.id)
      setSelectedCustomer(refreshed)
      setShowDetail(true)
    } catch (error) {
      console.error('Error fetching customer detail:', error)
      setSelectedCustomer(customer)
      setShowDetail(true)
    }
  }

  const getTierBadgeColor = (tier: string) => {
    switch (tier) {
      case 'BRONZE': return 'bg-orange-100 text-orange-800'
      case 'SILVER': return 'bg-gray-100 text-gray-800'
      case 'GOLD': return 'bg-yellow-100 text-yellow-800'
      case 'PLATINUM': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone_number.includes(searchQuery) ||
    customer.membership_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Memuat data...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push('/office/customer')}
        className="mb-2"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} className="mr-2" />
        Kembali
      </Button>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Data Member</h1>
          <p className="text-muted-foreground">Kelola data member dan tingkat keanggotaan</p>
        </div>
        <Button onClick={() => setShowRegister(true)}>
          <HugeiconsIcon icon={UserAdd01Icon} size={20} strokeWidth={2} className="mr-2" />
          Daftar Member Baru
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Member</CardTitle>
            <HugeiconsIcon icon={UserCircleIcon} size={16} strokeWidth={2} className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
            <p className="text-xs text-muted-foreground">Member aktif</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bronze</CardTitle>
            <HugeiconsIcon icon={Award01Icon} size={16} strokeWidth={2} className="text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter(c => c.membership_tier === 'BRONZE').length}</div>
            <p className="text-xs text-muted-foreground">Member tier bronze</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Silver</CardTitle>
            <HugeiconsIcon icon={Award01Icon} size={16} strokeWidth={2} className="text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.filter(c => c.membership_tier === 'SILVER').length}</div>
            <p className="text-xs text-muted-foreground">Member tier silver</p>
          </CardContent>
        </Card>

        <Card className="bg-white rounded-lg border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gold & Platinum</CardTitle>
            <HugeiconsIcon icon={Award01Icon} size={16} strokeWidth={2} className="text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.filter(c => c.membership_tier === 'GOLD' || c.membership_tier === 'PLATINUM').length}
            </div>
            <p className="text-xs text-muted-foreground">Member tier premium</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter - Outside wrapper on the left */}
      <div className="flex items-center gap-3">
        <div className="relative w-64">
          <HugeiconsIcon
            icon={Search01Icon}
            size={18}
            strokeWidth={2}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Cari nama, telepon, nomor member..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value)}
          className="h-10 px-3 py-2 border border-gray-200 rounded-md text-sm w-40"
        >
          <option value="">Semua Tier</option>
          <option value="BRONZE">Bronze</option>
          <option value="SILVER">Silver</option>
          <option value="GOLD">Gold</option>
          <option value="PLATINUM">Platinum</option>
        </select>
      </div>

      {/* Member List Table */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Daftar Member</h2>
          <p className="text-muted-foreground">Klik baris untuk melihat detail member</p>
        </div>

        {filteredCustomers.length === 0 ? (
          <Card className="bg-white rounded-lg border">
            <CardContent className="py-12">
              <div className="text-center">
                <p className="text-muted-foreground">
                  {searchQuery || tierFilter ? 'Tidak ada member yang cocok dengan filter' : 'Belum ada data member'}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="rounded-lg border bg-white overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Nomor Member</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Nama</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Telepon</TableHead>
                    <TableHead className="font-semibold text-gray-900 py-4 px-6">Tier</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Poin</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total Kunjungan</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-right py-4 px-6">Total Belanja</TableHead>
                    <TableHead className="font-semibold text-gray-900 text-center py-4 px-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCustomers.map((customer) => (
                    <TableRow key={customer.id} className="hover:bg-gray-50 border-b">
                      <TableCell className="font-mono py-4 px-6">{customer.membership_number}</TableCell>
                      <TableCell className="font-medium py-4 px-6">{customer.name}</TableCell>
                      <TableCell className="py-4 px-6">{customer.phone_number}</TableCell>
                      <TableCell className="py-4 px-6">
                        <Badge className={getTierBadgeColor(customer.membership_tier)}>
                          {customer.membership_tier}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold py-4 px-6">
                        {customer.points_balance.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right py-4 px-6">{customer.total_visits}</TableCell>
                      <TableCell className="text-right py-4 px-6">
                        Rp {parseFloat(customer.total_spent).toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-center py-4 px-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(customer)}
                        >
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {!loading && totalCount > pageSize && (
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-gray-600">
                  Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalCount)} dari {totalCount} member
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Sebelumnya
                  </Button>
                  <div className="text-sm text-gray-600">
                    Halaman {currentPage} dari {Math.ceil(totalCount / pageSize)}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalCount / pageSize), prev + 1))}
                    disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Register Sheet */}
      <Sheet open={showRegister} onOpenChange={setShowRegister}>
        <SheetContent className="w-1/3 overflow-y-auto p-0">
          <div className="sticky top-0 bg-white border-b p-6 z-10">
            <div className="flex items-center justify-between mb-2">
              <SheetTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={UserAdd01Icon} size={24} strokeWidth={2} className="text-blue-600" />
                Daftar Member Baru
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowRegister(false)}
                className="h-8 w-8"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2} />
              </Button>
            </div>
            <SheetDescription>Isi form untuk mendaftarkan member baru</SheetDescription>
          </div>

          <div className="space-y-4 p-6">
            <div>
              <Label htmlFor="phone">Nomor Telepon *</Label>
              <Input
                id="phone"
                placeholder="081234567890"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="name">Nama Lengkap *</Label>
              <Input
                id="name"
                placeholder="Nama member"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="email">Email (opsional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button onClick={handleRegister} className="w-full">
              Daftar Member
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Sheet */}
      <Sheet open={showDetail} onOpenChange={setShowDetail}>
        <SheetContent className="w-7/12 overflow-y-auto p-0">
          <div className="sticky top-0 bg-white border-b p-6 z-10">
            <div className="flex items-center justify-between mb-2">
              <SheetTitle className="flex items-center gap-2">
                <HugeiconsIcon icon={UserCircleIcon} size={24} strokeWidth={2} className="text-blue-600" />
                Detail Member
              </SheetTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowDetail(false)}
                className="h-8 w-8"
              >
                <HugeiconsIcon icon={Cancel01Icon} size={20} strokeWidth={2} />
              </Button>
            </div>
            <SheetDescription>Informasi lengkap member dan riwayat aktivitas</SheetDescription>
          </div>

          {selectedCustomer && (
            <div className="space-y-6 p-6">
              {/* Summary Info Card */}
              <div className="rounded-lg bg-gray-50 p-4 space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nomor Member:</span>
                  <span className="font-mono font-semibold">{selectedCustomer.membership_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Nama:</span>
                  <span className="font-semibold">{selectedCustomer.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Telepon:</span>
                  <span className="font-semibold">{selectedCustomer.phone_number}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Tier:</span>
                  <Badge className={getTierBadgeColor(selectedCustomer.membership_tier)}>
                    {selectedCustomer.membership_tier}
                  </Badge>
                </div>
                {selectedCustomer.email && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Email:</span>
                    <span className="font-semibold">{selectedCustomer.email}</span>
                  </div>
                )}
              </div>

              {/* Points & Stats */}
              <div>
                <h4 className="font-semibold mb-3">Poin & Statistik</h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Poin Tersedia</p>
                      <p className="text-2xl font-bold text-green-600">
                        {selectedCustomer.points_balance.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Poin (Lifetime)</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {selectedCustomer.lifetime_points.toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Kunjungan</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {selectedCustomer.total_visits}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Belanja</p>
                      <p className="text-2xl font-bold text-orange-600">
                        Rp {parseFloat(selectedCustomer.total_spent).toLocaleString('id-ID')}
                      </p>
                    </div>
                </div>

                {selectedCustomer.date_of_birth && (
                  <div className="mt-4 pt-4 border-t text-sm">
                    <span className="text-muted-foreground">Tanggal Lahir: </span>
                    <span className="font-medium">
                      {new Date(selectedCustomer.date_of_birth).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t text-sm">
                  <span className="text-muted-foreground">Bergabung Sejak: </span>
                  <span className="font-medium">
                    {new Date(selectedCustomer.join_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
