"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Clock01Icon,
  DollarCircleIcon,
  Invoice01Icon,
  LogoutCircle01Icon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { api, type CashierSession } from "@/lib/api"

export function SessionStatusWidget() {
  const router = useRouter()
  const [session, setSession] = useState<CashierSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveSession()

    // Refresh every 30 seconds
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

  if (loading) {
    return (
      <Card className="rounded-lg border border-gray-200 shadow-none">
        <CardContent className="p-6">
          <p className="text-sm text-gray-500">Memuat...</p>
        </CardContent>
      </Card>
    )
  }

  if (!session) {
    return (
      <Card className="rounded-lg border border-gray-200 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <HugeiconsIcon icon={AlertCircleIcon} size={20} strokeWidth={2} className="text-gray-400" />
            Status Sesi Kasir
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">Tidak ada sesi aktif</p>
            <Button
              onClick={() => router.push('/session/open')}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              Buka Sesi Baru
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`rounded-lg border shadow-none ${
      isLongSession() ? 'border-orange-300 bg-orange-50' : 'border-green-300 bg-green-50'
    }`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isLongSession() ? 'bg-orange-500' : 'bg-green-500'} animate-pulse`}></div>
            Sesi Kasir Aktif
          </span>
          <Button
            onClick={() => router.push('/shift-closing')}
            size="sm"
            variant="outline"
            className="text-xs"
          >
            <HugeiconsIcon icon={LogoutCircle01Icon} size={16} strokeWidth={2} className="mr-1" />
            Tutup Kasir
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-xs text-gray-600">Kasir</div>
            <div className="font-semibold text-gray-900">{session.cashier_name}</div>
          </div>
          <div>
            <div className="text-xs text-gray-600">Shift</div>
            <div className="font-semibold text-gray-900">{getShiftLabel(session.shift_type)}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <HugeiconsIcon icon={Clock01Icon} size={16} strokeWidth={2} className="text-gray-500" />
          <span className="text-gray-600">Durasi:</span>
          <span className="font-semibold text-gray-900">{getSessionDuration()}</span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <HugeiconsIcon icon={DollarCircleIcon} size={16} strokeWidth={2} className="text-gray-500" />
          <span className="text-gray-600">Uang Pembuka:</span>
          <span className="font-semibold text-gray-900">{formatCurrency(session.opening_cash)}</span>
        </div>

        {session.settlement_data && (
          <div className="pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <HugeiconsIcon icon={Invoice01Icon} size={16} strokeWidth={2} className="text-gray-500" />
                <span className="text-gray-600">Transaksi Hari Ini:</span>
              </div>
              <span className="font-bold text-gray-900">
                {session.settlement_data.total_transactions || 0}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Pendapatan:</span>
              <span className="font-bold text-green-600">
                {formatCurrency(session.settlement_data.total_revenue || 0)}
              </span>
            </div>
          </div>
        )}

        {isLongSession() && (
          <div className="p-2 bg-orange-100 border border-orange-300 rounded text-xs text-orange-800">
            <strong>⚠️ Perhatian:</strong> Sesi sudah berjalan lebih dari 10 jam
          </div>
        )}
      </CardContent>
    </Card>
  )
}
