import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { PDFTemplate, pdfStyles } from './PDFTemplate';

interface TaxData {
  period: string;
  start_date: string;
  end_date: string;
  generated_at: string;
  tax_rates: {
    ppn: number;
    hotel_tax: number;
    service_charge: number;
    pph_final: number;
  };
  revenue_breakdown: {
    room_revenue: {
      subtotal: number;
      tax_amount: number;
      service_charge: number;
      grand_total: number;
      transaction_count: number;
    };
    event_revenue: {
      subtotal: number;
      tax_amount: number;
      service_charge: number;
      grand_total: number;
      transaction_count: number;
    };
    total: {
      subtotal: number;
      tax_collected: number;
      service_charge: number;
      grand_total: number;
      transaction_count: number;
    };
  };
  tax_obligations: {
    ppn_collected: number;
    hotel_tax_payable: number;
    pph_final_payable: number;
    total_payable: number;
  };
  payment_methods: Array<{
    method: string;
    total: number;
    count: number;
    percentage: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    room_revenue: number;
    event_revenue: number;
    total_revenue: number;
    tax_collected: number;
    service_charge: number;
    grand_total: number;
  }>;
  room_transactions: Array<{
    transaction_id: string;
    transaction_date: string;
    guest_name: string;
    guest_id: string;
    room_number: string;
    check_in: string;
    check_out: string;
    nights: number;
    subtotal: number;
    tax_amount: number;
    service_charge: number;
    grand_total: number;
  }>;
  event_transactions: Array<{
    transaction_id: string;
    transaction_date: string;
    organizer_name: string;
    organization: string;
    event_name: string;
    event_type: string;
    event_date: string;
    pax: number;
    venue: string;
    subtotal: number;
    tax_amount: number;
    grand_total: number;
  }>;
  statistics: {
    total_transactions: number;
    total_guests: number;
    average_transaction_value: number;
    tax_percentage_of_revenue: number;
  };
}

interface TaxReportPDFProps {
  data: TaxData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getPeriodLabel = (period: string) => {
  const labels: Record<string, string> = {
    thisMonth: 'Bulan Ini',
    lastMonth: 'Bulan Lalu',
    thisQuarter: 'Kuartal Ini',
    thisYear: 'Tahun Ini',
  };
  return labels[period] || period;
};

export const TaxReportPDF: React.FC<TaxReportPDFProps> = ({ data }) => {
  return (
    <PDFTemplate title="Laporan Pajak Hotel - Untuk Pelaporan Pemerintah" period={getPeriodLabel(data.period)}>
      {/* Header Information */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Informasi Laporan</Text>
        <View style={{ backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
          <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#374151' }}>
            Periode Laporan: {formatDate(data.start_date)} - {formatDate(data.end_date)}{'\n'}
            Tanggal Dibuat: {data.generated_at}{'\n'}
            Total Transaksi: {data.statistics.total_transactions} transaksi{'\n'}
            Total Tamu: {data.statistics.total_guests} tamu
          </Text>
        </View>
      </View>

      {/* Tax Rates Reference */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Tarif Pajak yang Berlaku</Text>
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>Jenis Pajak</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>Tarif</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>PPN (Pajak Pertambahan Nilai)</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>{data.tax_rates.ppn}%</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>Pajak Hotel (Provincial)</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>{data.tax_rates.hotel_tax}%</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>Service Charge</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>{data.tax_rates.service_charge}%</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>PPh Final (Pajak Penghasilan Final)</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>{data.tax_rates.pph_final}%</Text>
          </View>
        </View>
      </View>

      {/* Revenue Breakdown */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Rincian Pendapatan Kena Pajak</Text>
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={[pdfStyles.tableCell, { width: '30%' }]}>Kategori</Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'right' }]}>Subtotal</Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'right' }]}>Pajak</Text>
            <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'right' }]}>Service</Text>
            <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'right' }]}>Total</Text>
          </View>

          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '30%' }]}>Kamar ({data.revenue_breakdown.room_revenue.transaction_count} trx)</Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'right', fontSize: 8 }]}>
              {formatCurrency(data.revenue_breakdown.room_revenue.subtotal)}
            </Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'right', fontSize: 8 }]}>
              {formatCurrency(data.revenue_breakdown.room_revenue.tax_amount)}
            </Text>
            <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'right', fontSize: 8 }]}>
              {formatCurrency(data.revenue_breakdown.room_revenue.service_charge)}
            </Text>
            <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'right', fontSize: 8 }]}>
              {formatCurrency(data.revenue_breakdown.room_revenue.grand_total)}
            </Text>
          </View>

          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '30%' }]}>Event ({data.revenue_breakdown.event_revenue.transaction_count} trx)</Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'right', fontSize: 8 }]}>
              {formatCurrency(data.revenue_breakdown.event_revenue.subtotal)}
            </Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'right', fontSize: 8 }]}>
              {formatCurrency(data.revenue_breakdown.event_revenue.tax_amount)}
            </Text>
            <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'right', fontSize: 8 }]}>
              {formatCurrency(data.revenue_breakdown.event_revenue.service_charge)}
            </Text>
            <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'right', fontSize: 8 }]}>
              {formatCurrency(data.revenue_breakdown.event_revenue.grand_total)}
            </Text>
          </View>

          <View style={[pdfStyles.tableRow, { backgroundColor: '#F3F4F6', fontWeight: 'bold' }]}>
            <Text style={[pdfStyles.tableCell, { width: '30%', fontWeight: 'bold' }]}>TOTAL ({data.revenue_breakdown.total.transaction_count} trx)</Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'right', fontSize: 8, fontWeight: 'bold' }]}>
              {formatCurrency(data.revenue_breakdown.total.subtotal)}
            </Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'right', fontSize: 8, fontWeight: 'bold' }]}>
              {formatCurrency(data.revenue_breakdown.total.tax_collected)}
            </Text>
            <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'right', fontSize: 8, fontWeight: 'bold' }]}>
              {formatCurrency(data.revenue_breakdown.total.service_charge)}
            </Text>
            <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'right', fontSize: 8, fontWeight: 'bold' }]}>
              {formatCurrency(data.revenue_breakdown.total.grand_total)}
            </Text>
          </View>
        </View>
      </View>

      {/* Tax Obligations */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Kewajiban Pajak kepada Pemerintah</Text>
        <View style={{ backgroundColor: '#FEF3C7', padding: 12, borderRadius: 4, border: '1 solid #F59E0B' }}>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#92400E' }}>
            <Text style={{ fontWeight: 'bold' }}>PPN yang Dikumpulkan:</Text> {formatCurrency(data.tax_obligations.ppn_collected)}{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Pajak Hotel (Prov):</Text> {formatCurrency(data.tax_obligations.hotel_tax_payable)}{'\n'}
            <Text style={{ fontWeight: 'bold' }}>PPh Final (Pusat):</Text> {formatCurrency(data.tax_obligations.pph_final_payable)}{'\n'}
            {'\n'}
            <Text style={{ fontWeight: 'bold', fontSize: 12 }}>TOTAL KEWAJIBAN: {formatCurrency(data.tax_obligations.total_payable)}</Text>
          </Text>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Metode Pembayaran</Text>
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={[pdfStyles.tableCell, { width: '40%' }]}>Metode</Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center' }]}>Jumlah Trx</Text>
            <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right' }]}>Total</Text>
            <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'right' }]}>%</Text>
          </View>
          {data.payment_methods.map((method, index) => (
            <View key={index} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '40%' }]}>{method.method}</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center' }]}>{method.count}</Text>
              <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right', fontSize: 8 }]}>
                {formatCurrency(method.total)}
              </Text>
              <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'right' }]}>{method.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Daily Breakdown - Paginated */}
      <View style={pdfStyles.section} break>
        <Text style={pdfStyles.sectionTitle}>Rincian Harian</Text>
        <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
          Breakdown pendapatan dan pajak per hari untuk rekonsiliasi
        </Text>
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={[pdfStyles.tableCell, { width: '15%' }]}>Tanggal</Text>
            <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right' }]}>Kamar</Text>
            <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right' }]}>Event</Text>
            <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right' }]}>Total Rev</Text>
            <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right' }]}>Pajak</Text>
            <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right' }]}>Grand Total</Text>
          </View>
          {data.daily_breakdown.slice(0, 20).map((day, index) => (
            <View key={index} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '15%', fontSize: 7 }]}>
                {new Date(day.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
              </Text>
              <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right', fontSize: 7 }]}>
                {day.room_revenue > 0 ? formatCurrency(day.room_revenue).replace('Rp', '').trim() : '-'}
              </Text>
              <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right', fontSize: 7 }]}>
                {day.event_revenue > 0 ? formatCurrency(day.event_revenue).replace('Rp', '').trim() : '-'}
              </Text>
              <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right', fontSize: 7 }]}>
                {formatCurrency(day.total_revenue).replace('Rp', '').trim()}
              </Text>
              <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right', fontSize: 7 }]}>
                {formatCurrency(day.tax_collected).replace('Rp', '').trim()}
              </Text>
              <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right', fontSize: 7 }]}>
                {formatCurrency(day.grand_total).replace('Rp', '').trim()}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Room Transactions Detail */}
      {data.room_transactions.length > 0 && (
        <View style={pdfStyles.section} break>
          <Text style={pdfStyles.sectionTitle}>Lampiran A: Detail Transaksi Kamar</Text>
          <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
            Menampilkan {Math.min(data.room_transactions.length, 50)} dari {data.room_transactions.length} transaksi kamar
          </Text>
          <View style={pdfStyles.table}>
            <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
              <Text style={[pdfStyles.tableCell, { width: '15%' }]}>No. Reservasi</Text>
              <Text style={[pdfStyles.tableCell, { width: '10%' }]}>Kamar</Text>
              <Text style={[pdfStyles.tableCell, { width: '12%' }]}>Check-in</Text>
              <Text style={[pdfStyles.tableCell, { width: '8%', textAlign: 'center' }]}>Malam</Text>
              <Text style={[pdfStyles.tableCell, { width: '13%', textAlign: 'right' }]}>Subtotal</Text>
              <Text style={[pdfStyles.tableCell, { width: '13%', textAlign: 'right' }]}>Pajak</Text>
              <Text style={[pdfStyles.tableCell, { width: '13%', textAlign: 'right' }]}>Service</Text>
              <Text style={[pdfStyles.tableCell, { width: '14%', textAlign: 'right' }]}>Total</Text>
            </View>
            {data.room_transactions.slice(0, 50).map((trx, index) => (
              <View key={index} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '15%', fontSize: 6 }]}>{trx.transaction_id}</Text>
                <Text style={[pdfStyles.tableCell, { width: '10%', fontSize: 6 }]}>{trx.room_number}</Text>
                <Text style={[pdfStyles.tableCell, { width: '12%', fontSize: 6 }]}>
                  {new Date(trx.check_in).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '8%', textAlign: 'center', fontSize: 6 }]}>
                  {trx.nights}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '13%', textAlign: 'right', fontSize: 6 }]}>
                  {formatCurrency(trx.subtotal).replace('Rp', '').replace(/\s/g, '').slice(0, 10)}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '13%', textAlign: 'right', fontSize: 6 }]}>
                  {formatCurrency(trx.tax_amount).replace('Rp', '').replace(/\s/g, '').slice(0, 10)}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '13%', textAlign: 'right', fontSize: 6 }]}>
                  {formatCurrency(trx.service_charge).replace('Rp', '').replace(/\s/g, '').slice(0, 10)}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '14%', textAlign: 'right', fontSize: 6 }]}>
                  {formatCurrency(trx.grand_total).replace('Rp', '').replace(/\s/g, '').slice(0, 11)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Event Transactions Detail */}
      {data.event_transactions.length > 0 && (
        <View style={pdfStyles.section} break>
          <Text style={pdfStyles.sectionTitle}>Lampiran B: Detail Transaksi Event</Text>
          <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
            Menampilkan {Math.min(data.event_transactions.length, 50)} dari {data.event_transactions.length} transaksi event
          </Text>
          <View style={pdfStyles.table}>
            <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
              <Text style={[pdfStyles.tableCell, { width: '12%' }]}>No. Booking</Text>
              <Text style={[pdfStyles.tableCell, { width: '18%' }]}>Organizer</Text>
              <Text style={[pdfStyles.tableCell, { width: '18%' }]}>Event</Text>
              <Text style={[pdfStyles.tableCell, { width: '10%' }]}>Tanggal</Text>
              <Text style={[pdfStyles.tableCell, { width: '12%', textAlign: 'right' }]}>Subtotal</Text>
              <Text style={[pdfStyles.tableCell, { width: '12%', textAlign: 'right' }]}>Pajak</Text>
              <Text style={[pdfStyles.tableCell, { width: '12%', textAlign: 'right' }]}>Total</Text>
            </View>
            {data.event_transactions.slice(0, 50).map((trx, index) => (
              <View key={index} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '12%', fontSize: 6 }]}>{trx.transaction_id}</Text>
                <Text style={[pdfStyles.tableCell, { width: '18%', fontSize: 6 }]}>{trx.organizer_name}</Text>
                <Text style={[pdfStyles.tableCell, { width: '18%', fontSize: 6 }]}>{trx.event_name}</Text>
                <Text style={[pdfStyles.tableCell, { width: '10%', fontSize: 6 }]}>
                  {new Date(trx.event_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '12%', textAlign: 'right', fontSize: 6 }]}>
                  {formatCurrency(trx.subtotal).replace('Rp', '').replace(/\s/g, '').slice(0, 10)}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '12%', textAlign: 'right', fontSize: 6 }]}>
                  {formatCurrency(trx.tax_amount).replace('Rp', '').replace(/\s/g, '').slice(0, 10)}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '12%', textAlign: 'right', fontSize: 6 }]}>
                  {formatCurrency(trx.grand_total).replace('Rp', '').replace(/\s/g, '').slice(0, 10)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Footer Notes */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Catatan</Text>
        <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#6B7280' }}>
          1. Laporan ini mencakup semua transaksi yang telah dikonfirmasi dalam periode {formatDate(data.start_date)} - {formatDate(data.end_date)}.{'\n'}
          2. Pajak yang dikumpulkan (PPN {data.tax_rates.ppn}%) telah dipungut dari pelanggan dan wajib disetor ke negara.{'\n'}
          3. Pajak Hotel ({data.tax_rates.hotel_tax}%) merupakan pajak daerah (provincial) yang wajib disetor ke pemerintah provinsi.{'\n'}
          4. PPh Final ({data.tax_rates.pph_final}%) merupakan pajak penghasilan final yang wajib disetor ke pemerintah pusat.{'\n'}
          5. Service charge ({data.tax_rates.service_charge}%) merupakan biaya layanan untuk karyawan dan bukan merupakan pajak.{'\n'}
          6. Total kewajiban pajak sebesar {formatCurrency(data.tax_obligations.total_payable)} harus disetor sesuai peraturan perpajakan yang berlaku.{'\n'}
          7. Detail transaksi lengkap tersedia untuk keperluan audit dan verifikasi pajak.
        </Text>
      </View>
    </PDFTemplate>
  );
};
