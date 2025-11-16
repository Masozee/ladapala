"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  DollarCircleIcon,
  Invoice01Icon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  PrinterIcon,
  ArrowLeft01Icon
} from "@hugeicons/core-free-icons"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { api, type CashierSession, type SessionValidation, type SessionReport } from "@/lib/api"
import { SettlementReport } from "@/components/settlement-report"

export default function ShiftClosingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<CashierSession | null>(null)
  const [validation, setValidation] = useState<SessionValidation | null>(null)
  const [actualCash, setActualCash] = useState("")
  const [notes, setNotes] = useState("")
  const [step, setStep] = useState<'validate' | 'cash-count' | 'summary' | 'success'>('validate')
  const [processing, setProcessing] = useState(false)
  const [sessionReport, setSessionReport] = useState<SessionReport | null>(null)
  const [showPrintReport, setShowPrintReport] = useState(false)

  useEffect(() => {
    fetchActiveSession()
  }, [])

  const fetchActiveSession = async () => {
    try {
      setLoading(true)
      const sessions = await api.getActiveCashierSession()

      if (sessions.length === 0) {
        alert('Tidak ada sesi kasir aktif. Silakan buka sesi terlebih dahulu.')
        router.push('/')
        return
      }

      const session = sessions[0]
      setActiveSession(session)

      // Validate settlement
      const validationResult = await api.validateSessionSettlement(session.id)
      setValidation(validationResult)

      if (validationResult.can_close) {
        setStep('cash-count')
      } else {
        setStep('validate')
      }
    } catch (error) {
      console.error('Error fetching session:', error)
      alert('Gagal memuat sesi kasir')
    } finally {
      setLoading(false)
    }
  }

  const handleCashCountNext = () => {
    if (!actualCash) {
      alert('Masukkan jumlah uang tunai aktual')
      return
    }
    setStep('summary')
  }

  const handleCloseSession = async () => {
    if (!activeSession || !actualCash) return

    try {
      setProcessing(true)
      const closedSession = await api.closeCashierSession(activeSession.id, {
        actual_cash: actualCash,
        notes: notes
      })

      // Fetch settlement report
      const report = await api.getSessionReport(closedSession.id)
      setSessionReport(report)

      setStep('success')
    } catch (error) {
      console.error('Error closing session:', error)
      alert('Gagal menutup sesi kasir')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (value: string | number) => {
    return `Rp ${parseFloat(value.toString()).toLocaleString('id-ID')}`
  }

  const getShiftTypeLabel = (shiftType: string) => {
    switch (shiftType) {
      case 'MORNING': return 'Pagi'
      case 'AFTERNOON': return 'Siang'
      case 'EVENING': return 'Sore'
      case 'NIGHT': return 'Malam'
      default: return shiftType
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center h-96">
          <p className="text-lg text-gray-500">Memuat...</p>
        </div>
      </div>
    )
  }

  if (!activeSession) {
    return null
  }

  const expectedCash = parseFloat(activeSession.opening_cash || '0') +
    (activeSession.settlement_data?.cash_payments.total || 0)
  const cashDiff = parseFloat(actualCash || '0') - expectedCash

  return (
    <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/')}
          className="mb-4"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={20} strokeWidth={2} className="mr-2" />
          Kembali
        </Button>
        <h1 className="text-3xl font-bold text-gray-900">Tutup Kasir</h1>
        <p className="text-gray-600 mt-2">
          {activeSession.cashier_name} • Shift {getShiftTypeLabel(activeSession.shift_type)}
        </p>
      </div>

      {/* Step 1: Validation */}
      {step === 'validate' && validation && !validation.can_close && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <HugeiconsIcon icon={AlertCircleIcon} size={24} strokeWidth={2} />
              Pesanan Belum Diselesaikan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-gray-700">
              Anda harus menyelesaikan semua pesanan sebelum menutup kasir.
              Terdapat <strong>{validation.count}</strong> pesanan yang belum diselesaikan:
            </p>

            <div className="space-y-2 mb-6">
              {validation.unsettled_orders?.map((order) => (
                <div key={order.id} className="p-3 bg-orange-50 border border-orange-200 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{order.order_number}</div>
                      <div className="text-sm text-gray-600">
                        {order.table_number ? `Meja ${order.table_number}` : 'Takeaway'} •
                        Status: {order.status}
                      </div>
                    </div>
                    <div className="font-bold text-orange-600">
                      {formatCurrency(order.total_amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/transaction')}
                className="flex-1"
              >
                Ke Halaman Transaksi
              </Button>
              <Button
                onClick={fetchActiveSession}
                className="flex-1"
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Cash Count */}
      {step === 'cash-count' && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HugeiconsIcon icon={DollarCircleIcon} size={24} strokeWidth={2} />
              Hitung Uang Tunai
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uang Tunai di Laci
              </label>
              <Input
                type="number"
                value={actualCash}
                onChange={(e) => setActualCash(e.target.value)}
                placeholder="Masukkan jumlah uang tunai"
                className="text-lg"
              />
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Uang Pembuka:</span>
                  <span className="font-medium">{formatCurrency(activeSession.opening_cash)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Penjualan Tunai:</span>
                  <span className="font-medium">
                    {formatCurrency(activeSession.settlement_data?.cash_payments.total || 0)}
                  </span>
                </div>
                <div className="border-t border-blue-200 pt-2 flex justify-between font-bold">
                  <span>Uang yang Diharapkan:</span>
                  <span>{formatCurrency(expectedCash)}</span>
                </div>
              </div>
            </div>

            {actualCash && (
              <div className={`p-4 rounded-lg ${
                Math.abs(cashDiff) < 1000 ? 'bg-green-50 border border-green-200' :
                Math.abs(cashDiff) < 50000 ? 'bg-yellow-50 border border-yellow-200' :
                'bg-red-50 border border-red-200'
              }`}>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Selisih:</span>
                  <span className={`text-xl font-bold ${
                    Math.abs(cashDiff) < 1000 ? 'text-green-600' :
                    Math.abs(cashDiff) < 50000 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {cashDiff >= 0 ? '+' : ''}{formatCurrency(cashDiff)}
                    {Math.abs(cashDiff) < 1000 ? ' ✓' : cashDiff > 0 ? ' (LEBIH)' : ' (KURANG)'}
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleCashCountNext}
              disabled={!actualCash}
              className="w-full"
              size="lg"
            >
              Lanjutkan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Summary */}
      {step === 'summary' && (
        <div className="space-y-6">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>Ringkasan Shift</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Session Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                <div>
                  <div className="text-sm text-gray-500">Kasir</div>
                  <div className="font-medium">{activeSession.cashier_name}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Shift</div>
                  <div className="font-medium">{getShiftTypeLabel(activeSession.shift_type)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Waktu Buka</div>
                  <div className="font-medium">
                    {new Date(activeSession.opened_at).toLocaleString('id-ID')}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Total Transaksi</div>
                  <div className="font-medium">
                    {activeSession.settlement_data?.total_transactions || 0}
                  </div>
                </div>
              </div>

              {/* Revenue Summary */}
              <div>
                <h3 className="font-semibold mb-3">Pendapatan</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Tunai ({activeSession.settlement_data?.cash_payments.count || 0} transaksi)</span>
                    <span className="font-medium">
                      {formatCurrency(activeSession.settlement_data?.cash_payments.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>Kartu ({activeSession.settlement_data?.card_payments.count || 0} transaksi)</span>
                    <span className="font-medium">
                      {formatCurrency(activeSession.settlement_data?.card_payments.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between p-2 bg-gray-50 rounded">
                    <span>QRIS ({activeSession.settlement_data?.mobile_payments.count || 0} transaksi)</span>
                    <span className="font-medium">
                      {formatCurrency(activeSession.settlement_data?.mobile_payments.total || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between p-3 bg-blue-100 rounded font-bold text-lg">
                    <span>Total Pendapatan</span>
                    <span className="text-blue-600">
                      {formatCurrency(activeSession.settlement_data?.total_revenue || 0)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cash Reconciliation */}
              <div>
                <h3 className="font-semibold mb-3">Rekonsiliasi Kas</h3>
                <div className="space-y-2">
                  <div className="flex justify-between p-2">
                    <span>Uang Pembuka</span>
                    <span className="font-medium">{formatCurrency(activeSession.opening_cash)}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span>Penjualan Tunai</span>
                    <span className="font-medium">
                      {formatCurrency(activeSession.settlement_data?.cash_payments.total || 0)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between p-2">
                    <span className="font-semibold">Uang yang Diharapkan</span>
                    <span className="font-semibold">{formatCurrency(expectedCash)}</span>
                  </div>
                  <div className="flex justify-between p-2">
                    <span className="font-semibold">Uang Aktual</span>
                    <span className="font-semibold">{formatCurrency(actualCash)}</span>
                  </div>
                  <div className={`flex justify-between p-3 rounded font-bold ${
                    Math.abs(cashDiff) < 1000 ? 'bg-green-100 text-green-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    <span>Selisih</span>
                    <span>{cashDiff >= 0 ? '+' : ''}{formatCurrency(cashDiff)}</span>
                  </div>
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
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStep('cash-count')}
              className="flex-1"
            >
              Kembali
            </Button>
            <Button
              onClick={handleCloseSession}
              disabled={processing}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} strokeWidth={2} className="mr-2" />
              {processing ? 'Memproses...' : 'Tutup Kasir'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Success */}
      {step === 'success' && (
        <Card className="rounded-lg">
          <CardContent className="py-12 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HugeiconsIcon icon={CheckmarkCircle01Icon} size={48} strokeWidth={2} className="text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Kasir Berhasil Ditutup!</h2>
            <p className="text-gray-600 mb-6">
              Terima kasih atas kerja keras Anda hari ini.
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => {
                  setShowPrintReport(true)
                  setTimeout(() => window.print(), 100)
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <HugeiconsIcon icon={PrinterIcon} size={20} strokeWidth={2} className="mr-2" />
                Cetak Laporan
              </Button>
              <Button
                onClick={() => router.push('/')}
                variant="outline"
              >
                Ke Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden Print Report */}
      {showPrintReport && sessionReport && (
        <div className="hidden print:block">
          <SettlementReport
            data={sessionReport}
            autoPrint={false}
            onPrintComplete={() => setShowPrintReport(false)}
          />
        </div>
      )}
    </div>
  )
}
