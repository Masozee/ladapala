"use client"

import { useEffect, useRef } from "react"

export interface ReceiptData {
  order_number: string
  table_number?: string
  customer_name: string
  items: Array<{
    product_name?: string
    name?: string
    quantity: number
    unit_price: string
    notes?: string
  }>
  subtotal: number
  tax: number
  total: number
  payment_method: string
  cash_received?: number
  change?: number
  timestamp?: string
}

interface ReceiptProps {
  data: ReceiptData
  autoPrint?: boolean
  onPrintComplete?: () => void
}

export function Receipt({ data, autoPrint = false, onPrintComplete }: ReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoPrint) {
      // Small delay to ensure content is rendered
      const timer = setTimeout(() => {
        handlePrint()
      }, 500)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint])

  const handlePrint = () => {
    if (!printRef.current) return

    const printWindow = window.open('', '', 'width=300,height=600')
    if (!printWindow) {
      console.error('Failed to open print window. Please check popup blocker.')
      return
    }

    const receiptDate = new Date()
    const receiptTime = data.timestamp || receiptDate.toLocaleString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Receipt - ${data.order_number}</title>
        <style>
          @media print {
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
            }
          }

          * {
            box-sizing: border-box;
          }

          body {
            font-family: 'Courier New', 'Courier', monospace;
            font-size: 12px;
            line-height: 1.4;
            padding: 8px;
            margin: 0;
            width: 80mm;
            max-width: 80mm;
            color: #000;
            background: #fff;
          }

          .receipt {
            width: 100%;
          }

          .header {
            text-align: center;
            border-bottom: 2px dashed #000;
            padding-bottom: 8px;
            margin-bottom: 8px;
          }

          .header h1 {
            margin: 0 0 4px 0;
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 2px;
          }

          .header p {
            margin: 2px 0;
            font-size: 10px;
          }

          .info {
            margin-bottom: 8px;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
          }

          .info p {
            margin: 2px 0;
            font-size: 11px;
            display: flex;
            justify-content: space-between;
          }

          .info .label {
            font-weight: bold;
          }

          .items {
            margin-bottom: 8px;
            border-bottom: 2px dashed #000;
            padding-bottom: 8px;
          }

          .item {
            margin-bottom: 8px;
          }

          .item-header {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 2px;
          }

          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 11px;
            padding-left: 8px;
          }

          .item-notes {
            font-size: 10px;
            padding-left: 8px;
            font-style: italic;
            color: #333;
            margin-top: 2px;
          }

          .totals {
            margin-bottom: 8px;
            border-bottom: 2px dashed #000;
            padding-bottom: 8px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
            font-size: 11px;
          }

          .total-row.grand-total {
            font-weight: bold;
            font-size: 14px;
            margin-top: 6px;
            padding-top: 4px;
            border-top: 1px solid #000;
          }

          .payment {
            margin-bottom: 8px;
            border-bottom: 1px dashed #000;
            padding-bottom: 8px;
          }

          .payment p {
            margin: 3px 0;
            font-size: 11px;
            display: flex;
            justify-content: space-between;
          }

          .payment .change {
            font-weight: bold;
            font-size: 13px;
            margin-top: 4px;
          }

          .footer {
            text-align: center;
            margin-top: 8px;
          }

          .footer .line {
            margin: 6px 0;
            border-bottom: 1px dashed #000;
          }

          .footer p {
            margin: 3px 0;
            font-size: 11px;
          }

          .footer .thanks {
            font-weight: bold;
            font-size: 12px;
            margin: 6px 0;
          }

          @media screen {
            body {
              background: #f5f5f5;
              padding: 20px;
            }
            .receipt {
              background: white;
              box-shadow: 0 0 10px rgba(0,0,0,0.1);
              padding: 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <h1>LADAPALA</h1>
            <p>Restaurant POS System</p>
            <p>Jl. Raya No. 123, Jakarta</p>
            <p>Tel: (021) 12345678</p>
          </div>

          <div class="info">
            <p><span class="label">No Order:</span> <span>${data.order_number}</span></p>
            <p><span class="label">Tanggal:</span> <span>${receiptTime}</span></p>
            <p><span class="label">Meja:</span> <span>${data.table_number || '-'}</span></p>
            <p><span class="label">Pelanggan:</span> <span>${data.customer_name}</span></p>
            <p><span class="label">Kasir:</span> <span>Admin</span></p>
          </div>

          <div class="items">
            ${data.items.map(item => `
              <div class="item">
                <div class="item-header">${item.product_name || item.name}</div>
                <div class="item-details">
                  <span>${item.quantity} x Rp ${parseFloat(item.unit_price).toLocaleString('id-ID')}</span>
                  <span>Rp ${(item.quantity * parseFloat(item.unit_price)).toLocaleString('id-ID')}</span>
                </div>
                ${item.notes ? `<div class="item-notes">* ${item.notes}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>Rp ${data.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="total-row">
              <span>Pajak (10%):</span>
              <span>Rp ${data.tax.toLocaleString('id-ID')}</span>
            </div>
            <div class="total-row grand-total">
              <span>TOTAL:</span>
              <span>Rp ${data.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div class="payment">
            <p><span>Metode:</span> <span>${data.payment_method.toUpperCase()}</span></p>
            ${data.cash_received ? `
              <p><span>Bayar:</span> <span>Rp ${data.cash_received.toLocaleString('id-ID')}</span></p>
              <p class="change"><span>Kembali:</span> <span>Rp ${(data.change || 0).toLocaleString('id-ID')}</span></p>
            ` : ''}
          </div>

          <div class="footer">
            <div class="line"></div>
            <p class="thanks">Terima Kasih</p>
            <p>Atas Kunjungan Anda</p>
            <div class="line"></div>
            <p style="font-size: 10px; margin-top: 6px;">Powered by Ladapala POS</p>
          </div>
        </div>

        <script>
          // Auto-print after content loads
          window.onload = function() {
            window.print();

            // Close window after printing or canceling
            window.onafterprint = function() {
              window.close();
            };

            // Fallback: close after 3 seconds if print dialog is canceled
            setTimeout(function() {
              window.close();
            }, 3000);
          };
        </script>
      </body>
      </html>
    `

    printWindow.document.write(receiptHTML)
    printWindow.document.close()

    if (onPrintComplete) {
      // Call callback after a short delay to ensure print dialog opened
      setTimeout(onPrintComplete, 1000)
    }
  }

  return (
    <div ref={printRef} style={{ display: 'none' }}>
      {/* Hidden content for reference, actual printing uses the HTML template above */}
    </div>
  )
}
