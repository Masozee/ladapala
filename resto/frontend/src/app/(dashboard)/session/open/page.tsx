"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DollarCircleIcon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
  AlertCircleIcon
} from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { api, type CashierSession, type ScheduleCheck } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"

const SHIFT_TYPES = [
  { value: 'MORNING', label: 'Pagi (06:00 - 14:00)' },
  { value: 'AFTERNOON', label: 'Siang (14:00 - 22:00)' },
  { value: 'EVENING', label: 'Sore (16:00 - 00:00)' },
  { value: 'NIGHT', label: 'Malam (22:00 - 06:00)' }
] as const

export default function OpenSessionPage() {
  const router = useRouter()
  const { staff, isLoading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [hasActiveSession, setHasActiveSession] = useState(false)
  const [activeSession, setActiveSession] = useState<CashierSession | null>(null)
  const [shiftType, setShiftType] = useState<'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT'>('MORNING')
  const [openingCash, setOpeningCash] = useState("")
  const [notes, setNotes] = useState("")
  const [processing, setProcessing] = useState(false)
  const [scheduleCheck, setScheduleCheck] = useState<ScheduleCheck | null>(null)
  const [checkingSchedule, setCheckingSchedule] = useState(false)
  const [showOverrideDialog, setShowOverrideDialog] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")

  useEffect(() => {
    checkActiveSession()
  }, [])

  // Check schedule when shift type changes
  useEffect(() => {
    if (staff && !hasActiveSession) {
      checkScheduleForShift()
    }
  }, [shiftType, staff, hasActiveSession])

  const checkScheduleForShift = async () => {
    if (!staff) return

    try {
      setCheckingSchedule(true)
      const result = await api.checkSchedule(staff.id, shiftType)
      setScheduleCheck(result)
    } catch (error) {
      console.error('Error checking schedule:', error)
      setScheduleCheck(null)
    } finally {
      setCheckingSchedule(false)
    }
  }

  const checkActiveSession = async () => {
    try {
      setLoading(true)
      const sessions = await api.getActiveCashierSession()

      if (sessions.length > 0) {
        setHasActiveSession(true)
        setActiveSession(sessions[0])
      } else {
        setHasActiveSession(false)
        // Auto-select shift based on current time
        const hour = new Date().getHours()
        if (hour >= 6 && hour < 14) {
          setShiftType('MORNING')
        } else if (hour >= 14 && hour < 22) {
          setShiftType('AFTERNOON')
        } else if (hour >= 16 && hour < 24) {
          setShiftType('EVENING')
        } else {
          setShiftType('NIGHT')
        }
      }
    } catch (error) {
      console.error('Error checking session:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenSession = async (withOverride = false) => {
    if (!openingCash || parseFloat(openingCash) < 0) {
      alert('Masukkan jumlah uang pembuka yang valid')
      return
    }

    // Validate user has staff info
    if (!staff) {
      alert('Anda tidak memiliki akses sebagai staff. Silakan login dengan akun staff.')
      return
    }

    // Validate user is a cashier
    if (staff.role !== 'CASHIER') {
      alert('Hanya kasir yang dapat membuka sesi kasir.')
      return
    }

    // Check if schedule warning exists and user hasn't chosen to override
    if (scheduleCheck && !scheduleCheck.has_schedule && !withOverride) {
      setShowOverrideDialog(true)
      return
    }

    try {
      setProcessing(true)

      const sessionData: any = {
        cashier: staff.id,
        branch: staff.branch.id,
        shift_type: shiftType,
        opening_cash: openingCash,
        notes: notes
      }

      // Add override data if opening without schedule
      if (withOverride && scheduleCheck && !scheduleCheck.has_schedule) {
        // For now, cashiers can open without schedule (logged as warning)
        // In production, this would require actual manager approval
        sessionData.notes = `${notes}\n\nDibuka tanpa jadwal terdaftar.`
      }

      await api.openCashierSession(sessionData)

      alert('Sesi kasir berhasil dibuka!')
      router.push('/')
    } catch (error) {
      console.error('Error opening session:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('Gagal membuka sesi kasir: ' + errorMessage)
    } finally {
      setProcessing(false)
      setShowOverrideDialog(false)
    }
  }

  const formatCurrency = (value: string | number) => {
    return `Rp ${parseFloat(value.toString()).toLocaleString('id-ID')}`
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

  if (loading || authLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-gray-500">Memuat...</p>
        </div>
      </div>
    )
  }

  // Show error if user is not a staff member
  if (!staff) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Card className="rounded-lg border-red-300 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={24} strokeWidth={2} />
              Akses Ditolak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Anda tidak memiliki akses sebagai staff untuk membuka sesi kasir.</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show error if user is not a cashier
  if (staff.role !== 'CASHIER') {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Card className="rounded-lg border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={24} strokeWidth={2} />
              Akses Terbatas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Hanya kasir yang dapat membuka sesi kasir. Role Anda: {staff.role}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (hasActiveSession && activeSession) {
    return (
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} className="mr-2" />
          Kembali
        </Button>

        <Card className="rounded-lg border-orange-300 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={24} strokeWidth={2} />
              Sesi Kasir Sudah Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">Anda sudah memiliki sesi kasir yang aktif:</p>

            <div className="p-4 bg-white border border-orange-200 rounded mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Kasir</div>
                  <div className="font-medium">{activeSession.cashier_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Shift</div>
                  <div className="font-medium">{getShiftLabel(activeSession.shift_type)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Dibuka</div>
                  <div className="font-medium">
                    {new Date(activeSession.opened_at).toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Uang Pembuka</div>
                  <div className="font-medium">{formatCurrency(activeSession.opening_cash)}</div>
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Silakan tutup sesi yang aktif terlebih dahulu sebelum membuka sesi baru.
            </p>

            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/shift-closing')}
                className="flex-1 bg-orange-600 hover:bg-orange-700"
              >
                Tutup Sesi Aktif
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex-1"
              >
                Ke Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="outline"
        onClick={() => router.push('/')}
        className="mb-4"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} className="mr-2" />
        Kembali
      </Button>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <HugeiconsIcon icon={DollarCircleIcon} size={28} strokeWidth={2} />
            Buka Sesi Kasir
          </CardTitle>
          <p className="text-sm text-gray-600 mt-2">
            Isi informasi di bawah untuk memulai shift Anda
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Shift Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Pilih Shift
            </label>
            <div className="grid grid-cols-2 gap-3">
              {SHIFT_TYPES.map((shift) => (
                <button
                  key={shift.value}
                  onClick={() => setShiftType(shift.value)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    shiftType === shift.value
                      ? 'border-[#58ff34] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{shift.value}</div>
                  <div className="text-sm text-gray-500 mt-1">{shift.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Status */}
          {checkingSchedule && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">Memeriksa jadwal...</p>
            </div>
          )}

          {scheduleCheck && !checkingSchedule && (
            <div className={`p-4 border-2 rounded-lg ${
              scheduleCheck.has_schedule && scheduleCheck.is_confirmed
                ? 'bg-green-50 border-green-300'
                : scheduleCheck.has_schedule
                ? 'bg-blue-50 border-blue-300'
                : 'bg-orange-50 border-orange-300'
            }`}>
              <div className="flex items-start gap-3">
                <HugeiconsIcon
                  icon={scheduleCheck.has_schedule && scheduleCheck.is_confirmed ? CheckmarkCircle01Icon : AlertCircleIcon}
                  size={20}
                  strokeWidth={2}
                  className={scheduleCheck.has_schedule && scheduleCheck.is_confirmed ? 'text-green-600' : 'text-orange-600'}
                />
                <div className="flex-1">
                  <h4 className={`font-semibold text-sm mb-1 ${
                    scheduleCheck.has_schedule && scheduleCheck.is_confirmed
                      ? 'text-green-800'
                      : 'text-orange-800'
                  }`}>
                    {scheduleCheck.message}
                  </h4>
                  {scheduleCheck.schedule && (
                    <div className="text-xs text-gray-700 mt-2 space-y-1">
                      <p>Jam: {scheduleCheck.schedule.start_time} - {scheduleCheck.schedule.end_time}</p>
                      {scheduleCheck.schedule.notes && <p>Catatan: {scheduleCheck.schedule.notes}</p>}
                    </div>
                  )}
                  {scheduleCheck.warning && (
                    <p className="text-xs text-orange-700 mt-2">{scheduleCheck.warning}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Opening Cash */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Uang Pembuka (Rp) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="Contoh: 500000"
              className="text-lg"
              min="0"
              step="1000"
            />
            {openingCash && (
              <p className="text-sm text-gray-500 mt-2">
                {formatCurrency(openingCash)}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Hitung uang tunai di laci kasir sebelum memulai
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nominal Cepat
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[100000, 200000, 500000, 1000000].map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setOpeningCash(amount.toString())}
                  className="text-xs"
                >
                  {amount / 1000}k
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Catatan (Opsional)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Tambahkan catatan jika diperlukan"
              rows={3}
            />
          </div>

          {/* Summary */}
          {openingCash && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Ringkasan</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shift:</span>
                  <span className="font-medium">{getShiftLabel(shiftType)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Uang Pembuka:</span>
                  <span className="font-medium">{formatCurrency(openingCash)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Waktu Buka:</span>
                  <span className="font-medium">{new Date().toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleOpenSession}
            disabled={!openingCash || parseFloat(openingCash) < 0 || processing}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} strokeWidth={2} className="mr-2" />
            {processing ? 'Membuka Sesi...' : 'Buka Sesi Kasir'}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            Pastikan uang pembuka sudah dihitung dengan benar sebelum membuka sesi
          </p>
        </CardContent>
      </Card>

      {/* Override Dialog */}
      {showOverrideDialog && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowOverrideDialog(false)} />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <HugeiconsIcon icon={AlertCircleIcon} size={24} strokeWidth={2} />
                  Peringatan: Tidak Ada Jadwal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-700">
                  Anda tidak memiliki jadwal terdaftar untuk shift <strong>{getShiftLabel(shiftType)}</strong> hari ini.
                </p>
                <p className="text-sm text-gray-700">
                  Membuka sesi tanpa jadwal akan dicatat dalam sistem sebagai peringatan.
                </p>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-xs text-orange-800">
                    💡 <strong>Catatan:</strong> Dalam sistem produksi, ini memerlukan persetujuan manager.
                    Untuk demo, Anda dapat melanjutkan dan akan dicatat sebagai peringatan.
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowOverrideDialog(false)}
                    className="flex-1"
                  >
                    Batal
                  </Button>
                  <Button
                    onClick={() => handleOpenSession(true)}
                    disabled={processing}
                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                  >
                    {processing ? 'Membuka...' : 'Lanjutkan'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
