"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon, Clock01Icon, Search01Icon, DollarCircleIcon, LogoutCircle01Icon, UserIcon, ArrowDown01Icon, Login01Icon } from "@hugeicons/core-free-icons"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { api, type CashierSession } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

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
  const router = useRouter()
  const { user, staff, logout } = useAuth()
  const title = getPageTitle(pathname)
  const [session, setSession] = useState<CashierSession | null>(null)
  const [loading, setLoading] = useState(true)

  const today = new Date().toLocaleDateString("id-ID", {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  useEffect(() => {
    fetchActiveSession()
    const interval = setInterval(fetchActiveSession, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchActiveSession = async () => {
    try {
      const sessions = await api.getActiveCashierSession()
      if (sessions.length > 0) {
        setSession(sessions[0])
      } else {
        setSession(null)
      }
    } catch (error) {
      console.error('Error fetching session:', error)
    } finally {
      setLoading(false)
    }
  }

  const getShiftLabel = (shift: string) => {
    switch (shift) {
      case 'MORNING': return 'Pagi'
      case 'AFTERNOON': return 'Siang'
      case 'EVENING': return 'Sore'
      case 'NIGHT': return 'Malam'
      default: return shift
    }
  }

  const getSessionDuration = () => {
    if (!session) return '-'
    const opened = new Date(session.opened_at)
    const now = new Date()
    const diffMs = now.getTime() - opened.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}j ${minutes}m`
  }

  const formatCurrency = (value: string | number) => {
    return `Rp ${parseFloat(value.toString()).toLocaleString('id-ID')}`
  }

  const isLongSession = () => {
    if (!session) return false
    const opened = new Date(session.opened_at)
    const now = new Date()
    const hours = (now.getTime() - opened.getTime()) / (1000 * 60 * 60)
    return hours > 10
  }

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
            {!loading && session ? (
              <>
                <span className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isLongSession() ? 'bg-orange-500' : 'bg-green-500'} animate-pulse`}></div>
                  <strong className={isLongSession() ? 'text-orange-600' : 'text-green-600'}>
                    Shift {getShiftLabel(session.shift_type)}
                  </strong>
                </span>
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={2} />
                  Durasi: {getSessionDuration()}
                </span>
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={DollarCircleIcon} size={16} strokeWidth={2} />
                  {session.cashier_name}
                </span>
                {session.settlement_data && (
                  <span className="flex items-center gap-1 font-medium text-gray-700">
                    {session.settlement_data.total_transactions || 0} transaksi • {formatCurrency(session.settlement_data.total_revenue || 0)}
                  </span>
                )}
              </>
            ) : !loading ? (
              <span className="flex items-center gap-1 text-orange-600">
                <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={2} />
                Tidak ada sesi aktif
              </span>
            ) : null}
          </div>
        </div>

        {/* User Info & Action Menu */}
        <div className="flex items-center gap-3">
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="flex items-center gap-2 px-3 py-2 h-auto bg-white border-gray-200 hover:bg-gray-50"
                >
                  <HugeiconsIcon icon={UserIcon} size={18} strokeWidth={2} className="text-gray-600" />
                  <div className="text-sm text-left">
                    <div className="font-medium text-gray-900">{user.full_name}</div>
                    {staff && (
                      <div className="text-xs text-gray-500">
                        {staff.role} • {staff.branch.name}
                      </div>
                    )}
                  </div>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={16} strokeWidth={2} className="text-gray-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {/* Session Controls */}
                {staff?.role === 'CASHIER' && (
                  <>
                    {session ? (
                      <DropdownMenuItem
                        onClick={() => router.push('/shift-closing')}
                        className="text-orange-600 focus:text-orange-600"
                      >
                        <HugeiconsIcon icon={LogoutCircle01Icon} size={16} strokeWidth={2} />
                        Tutup Sesi
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => router.push('/session/open')}
                        className="text-green-600 focus:text-green-600"
                      >
                        <HugeiconsIcon icon={Login01Icon} size={16} strokeWidth={2} />
                        Buka Sesi
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}

                {/* Logout */}
                <DropdownMenuItem
                  onClick={logout}
                  variant="destructive"
                >
                  <HugeiconsIcon icon={LogoutCircle01Icon} size={16} strokeWidth={2} />
                  Keluar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  )
}
