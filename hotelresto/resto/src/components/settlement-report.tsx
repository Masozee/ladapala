"use client"

import { useEffect, useRef } from "react"
import { type SessionReport } from "@/lib/api"

interface SettlementReportProps {
  data: SessionReport
  autoPrint?: boolean
  onPrintComplete?: () => void
}

export function SettlementReport({ data, autoPrint = false, onPrintComplete }: SettlementReportProps) {
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoPrint && printRef.current) {
      setTimeout(() => {
        window.print()
        if (onPrintComplete) {
          onPrintComplete()
        }
      }, 500)
    }
  }, [autoPrint, onPrintComplete])

  const formatCurrency = (value: number) => {
    return `Rp ${value.toLocaleString('id-ID')}`
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

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateDuration = () => {
    if (!data.session.closed_at) return '-'
    const opened = new Date(data.session.opened_at)
    const closed = new Date(data.session.closed_at)
    const diffMs = closed.getTime() - opened.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours} jam ${minutes} menit`
  }

  const cashDiff = parseFloat(data.session.cash_difference || '0')

  return (
    <div ref={printRef} className="settlement-report">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .settlement-report,
          .settlement-report * {
            visibility: visible;
          }
          .settlement-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      `}</style>

      <div className="max-w-4xl mx-auto p-8 bg-white text-black font-mono text-sm">
        {/* Header */}
        <div className="text-center mb-6 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold">LAPORAN PENUTUPAN SHIFT</h1>
          <p className="text-lg mt-2">{data.session.branch_name}</p>
        </div>

        {/* Session Info */}
        <div className="mb-6">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 w-1/3">Kasir</td>
                <td className="py-1">: {data.session.cashier_name} ({data.session.cashier_id})</td>
              </tr>
              <tr>
                <td className="py-1">Shift</td>
                <td className="py-1">: {getShiftLabel(data.session.shift_type)}</td>
              </tr>
              <tr>
                <td className="py-1">Tanggal</td>
                <td className="py-1">: {new Date(data.session.opened_at).toLocaleDateString('id-ID')}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Session Time */}
        <div className="mb-6 border-t border-b border-black py-3">
          <h2 className="font-bold mb-2">WAKTU SESI</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 w-1/3">Dibuka</td>
                <td className="py-1">: {formatDateTime(data.session.opened_at)}</td>
              </tr>
              {data.session.closed_at && (
                <>
                  <tr>
                    <td className="py-1">Ditutup</td>
                    <td className="py-1">: {formatDateTime(data.session.closed_at)}</td>
                  </tr>
                  <tr>
                    <td className="py-1">Durasi</td>
                    <td className="py-1">: {calculateDuration()}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>

        {/* Transaction Summary */}
        <div className="mb-6 border-b border-black pb-3">
          <h2 className="font-bold mb-2">RINGKASAN TRANSAKSI</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 w-2/3">Total Transaksi</td>
                <td className="py-1 text-right">: {data.summary?.total_transactions || 0}</td>
              </tr>
              <tr>
                <td className="py-1 pl-4">- Selesai</td>
                <td className="py-1 text-right">: {data.summary?.completed_transactions || 0}</td>
              </tr>
              <tr>
                <td className="py-1 pl-4">- Dibatalkan</td>
                <td className="py-1 text-right">: {data.summary?.cancelled_transactions || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Revenue Breakdown */}
        <div className="mb-6 border-b border-black pb-3">
          <h2 className="font-bold mb-2">RINCIAN PENDAPATAN</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 w-2/3">Pembayaran Tunai</td>
                <td className="py-1 text-right">{formatCurrency(data.summary?.cash_payments.total || 0)}</td>
              </tr>
              <tr className="text-xs text-gray-600">
                <td className="py-1 pl-4">({data.summary?.cash_payments.count || 0} transaksi)</td>
                <td></td>
              </tr>
              <tr>
                <td className="py-1">Pembayaran Kartu</td>
                <td className="py-1 text-right">{formatCurrency(data.summary?.card_payments.total || 0)}</td>
              </tr>
              <tr className="text-xs text-gray-600">
                <td className="py-1 pl-4">({data.summary?.card_payments.count || 0} transaksi)</td>
                <td></td>
              </tr>
              <tr>
                <td className="py-1">Pembayaran QRIS</td>
                <td className="py-1 text-right">{formatCurrency(data.summary?.mobile_payments.total || 0)}</td>
              </tr>
              <tr className="text-xs text-gray-600">
                <td className="py-1 pl-4">({data.summary?.mobile_payments.count || 0} transaksi)</td>
                <td></td>
              </tr>
              <tr className="border-t border-black">
                <td className="py-2 font-bold">TOTAL PENDAPATAN</td>
                <td className="py-2 text-right font-bold">{formatCurrency(data.summary?.total_revenue || 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Cash Reconciliation */}
        <div className="mb-6 border-b-2 border-black pb-3">
          <h2 className="font-bold mb-2">REKONSILIASI KAS</h2>
          <table className="w-full">
            <tbody>
              <tr>
                <td className="py-1 w-2/3">Uang Pembuka</td>
                <td className="py-1 text-right">{formatCurrency(parseFloat(data.session.opening_cash))}</td>
              </tr>
              <tr>
                <td className="py-1">Penjualan Tunai</td>
                <td className="py-1 text-right">+ {formatCurrency(data.summary?.cash_payments.total || 0)}</td>
              </tr>
              <tr className="border-t border-gray-400">
                <td className="py-2 font-bold">Uang yang Diharapkan</td>
                <td className="py-2 text-right font-bold">{formatCurrency(parseFloat(data.session.expected_cash || '0'))}</td>
              </tr>
              <tr>
                <td className="py-1 font-bold">Uang Aktual</td>
                <td className="py-1 text-right font-bold">{formatCurrency(parseFloat(data.session.actual_cash || '0'))}</td>
              </tr>
              <tr className="border-t border-black">
                <td className="py-2 font-bold">Selisih</td>
                <td className={`py-2 text-right font-bold ${cashDiff === 0 ? 'text-green-600' : cashDiff > 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {cashDiff >= 0 ? '+' : ''}{formatCurrency(cashDiff)}
                  {cashDiff === 0 ? ' (PAS)' : cashDiff > 0 ? ' (LEBIH)' : ' (KURANG)'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Transactions Detail */}
        {data.transactions.length > 0 && (
          <div className="mb-6">
            <h2 className="font-bold mb-3">DETAIL TRANSAKSI</h2>
            <div className="space-y-3">
              {data.transactions.slice(0, 20).map((transaction, idx) => (
                <div key={idx} className="border border-gray-300 p-3">
                  <div className="flex justify-between mb-2">
                    <div>
                      <div className="font-bold">{transaction.order_number}</div>
                      <div className="text-xs text-gray-600">
                        {transaction.table_number ? `Meja ${transaction.table_number}` : 'Takeaway'} •
                        {transaction.customer_name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(transaction.total_amount)}</div>
                      <div className="text-xs text-gray-600">{transaction.payment_method}</div>
                    </div>
                  </div>
                  <div className="text-xs space-y-1">
                    {transaction.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="flex justify-between">
                        <span>{item.product_name} x{item.quantity}</span>
                        <span>{formatCurrency(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {data.transactions.length > 20 && (
                <p className="text-xs text-gray-600 text-center">
                  ... dan {data.transactions.length - 20} transaksi lainnya
                </p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        {data.session.notes && (
          <div className="mb-6">
            <h2 className="font-bold mb-2">CATATAN</h2>
            <p className="whitespace-pre-wrap">{data.session.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-black">
          <div className="flex justify-between">
            <div>
              <p className="mb-1">Ditutup oleh:</p>
              <p className="font-bold">{data.session.closed_by_name || data.session.cashier_name}</p>
            </div>
            <div className="text-right">
              <p className="mb-1">Dicetak:</p>
              <p className="font-bold">{new Date().toLocaleString('id-ID')}</p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-8">
            <div>
              <p className="mb-12">Tanda Tangan Kasir:</p>
              <div className="border-t border-black pt-1 text-center">
                <p className="text-xs">{data.session.cashier_name}</p>
              </div>
            </div>
            <div>
              <p className="mb-12">Tanda Tangan Manager:</p>
              <div className="border-t border-black pt-1 text-center">
                <p className="text-xs">Manager</p>
              </div>
            </div>
          </div>
        </div>

        {/* Print Footer */}
        <div className="mt-6 text-center text-xs text-gray-500 border-t border-gray-300 pt-2">
          <p>Dokumen ini dicetak secara otomatis oleh sistem POS</p>
          <p>Simpan sebagai arsip untuk keperluan audit</p>
        </div>
      </div>
    </div>
  )
}
