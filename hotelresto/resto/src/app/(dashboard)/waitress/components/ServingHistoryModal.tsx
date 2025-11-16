'use client'

import { useState, useEffect } from 'react'
import { HugeiconsIcon } from '@hugeicons/react'
import { Cancel01Icon, Loading03Icon, ClockIcon } from '@hugeicons/core-free-icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api, ServingHistoryEntry } from '@/lib/api'

interface ServingHistoryModalProps {
  orderId: number
  orderNumber: string
  isOpen: boolean
  onClose: () => void
}

export default function ServingHistoryModal({ orderId, orderNumber, isOpen, onClose }: ServingHistoryModalProps) {
  const [history, setHistory] = useState<ServingHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchHistory()
    }
  }, [isOpen, orderId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const data = await api.getServingHistory(orderId)
      setHistory(data)
    } catch (error) {
      console.error('Error fetching serving history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Riwayat Pengantaran</h2>
            <p className="text-sm text-muted-foreground">Pesanan {orderNumber}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="h-5 w-5" strokeWidth={2} />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <HugeiconsIcon icon={Loading03Icon} className="h-10 w-10 text-gray-400 mx-auto animate-spin" strokeWidth={2} />
                <p className="text-muted-foreground">Memuat riwayat...</p>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <HugeiconsIcon icon={ClockIcon} className="h-12 w-12 text-gray-300 mx-auto" strokeWidth={2} />
                <p className="text-muted-foreground">Belum ada riwayat pengantaran</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div key={entry.id} className="relative">
                  {/* Timeline line */}
                  {index !== history.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gray-200" />
                  )}

                  <div className="flex gap-4">
                    {/* Timeline dot */}
                    <div className="relative z-10 flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-[#58ff34] border-4 border-white shadow-sm flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-black" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6">
                      <div className="bg-gray-50 rounded-lg p-4 border">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="font-medium text-sm mb-1">
                              {entry.product_name}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatDate(entry.served_at)}</span>
                              <span>•</span>
                              <span>oleh {entry.served_by_name || 'Unknown'}</span>
                            </div>
                          </div>
                          <Badge className="bg-[#58ff34]/20 text-black border-[#58ff34]/30 text-xs">
                            {entry.quantity_served}x diantar
                          </Badge>
                        </div>

                        {entry.notes && (
                          <div className="mt-2 text-xs text-muted-foreground italic">
                            Catatan: {entry.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Total {history.length} pengantaran
            </span>
            <Button onClick={onClose} variant="outline">
              Tutup
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
