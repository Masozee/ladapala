"use client"

import { usePathname } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, Clock01Icon, Search01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const getPageTitle = (pathname: string): string => {
  const titles: { [key: string]: string } = {
    '/': 'Dashboard Kasir',
    '/menu': 'Menu Restaurant',
    '/table': 'Manajemen Meja',
    '/transaction': 'Transaksi',
    '/settings': 'Pengaturan',
    '/profile': 'Profil Pengguna',
    '/office/stock': 'Manajemen Stok',
    '/office/schedule': 'Jadwal Karyawan',
    '/office/recipe': 'Resep & Menu',
    '/office/report': 'Laporan'
  }
  return titles[pathname] || 'Dashboard Kasir'
}

export function TopNavbar() {
  const pathname = usePathname()
  const title = getPageTitle(pathname)
  const today = new Date().toLocaleDateString("id-ID", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="bg-gray-50 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={Calendar01Icon} size={16} strokeWidth={2} />
              {today}
            </span>
            <span className="flex items-center gap-1">
              <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={2} />
              Shift Pagi (07:00 - 15:00)
            </span>
          </div>
        </div>

        {/* Search Form */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <HugeiconsIcon icon={Search01Icon} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} strokeWidth={2} />
            <Input
              type="text"
              placeholder="Cari pesanan, menu, meja..."
              className="w-80 pl-10 pr-4"
            />
          </div>
          <Button variant="outline" size="icon">
            <HugeiconsIcon icon={Search01Icon} size={16} strokeWidth={2} />
          </Button>
        </div>
      </div>
    </div>
  )
}
