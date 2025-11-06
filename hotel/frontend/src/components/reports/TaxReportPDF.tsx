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
  // Limit daily breakdown to first 15 days to prevent rendering issues
  const limitedDailyBreakdown = data.daily_breakdown.slice(0, 15);
  const totalDays = data.daily_breakdown.length;

  // Debug logging
  console.log('TaxReportPDF rendering with data:', {
    total_days: totalDays,
    limited_days: limitedDailyBreakdown.length,
    first_day: limitedDailyBreakdown[0],
    has_revenue: limitedDailyBreakdown.filter(d => d.total_revenue > 0).length
  });

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
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%', fontWeight: 'bold' }]}>Jenis Pajak</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '40%', textAlign: 'right', fontWeight: 'bold' }]}>Tarif</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>PPN (Pajak Pertambahan Nilai)</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '40%', textAlign: 'right' }]}>{data.tax_rates.ppn}%</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>Pajak Hotel (Provincial)</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '40%', textAlign: 'right' }]}>{data.tax_rates.hotel_tax}%</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>Service Charge</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '40%', textAlign: 'right' }]}>{data.tax_rates.service_charge}%</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>PPh Final (Pajak Penghasilan Final)</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '40%', textAlign: 'right' }]}>{data.tax_rates.pph_final}%</Text>
          </View>
        </View>
      </View>

      {/* Revenue Breakdown */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Rincian Pendapatan Kena Pajak</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '30%', fontWeight: 'bold' }]}>Kategori</Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'right', fontWeight: 'bold' }]}>Subtotal</Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'right', fontWeight: 'bold' }]}>Pajak</Text>
            <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>Service</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>Total</Text>
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
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '15%', textAlign: 'right', fontSize: 8 }]}>
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
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '15%', textAlign: 'right', fontSize: 8 }]}>
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
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '15%', textAlign: 'right', fontSize: 8, fontWeight: 'bold' }]}>
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
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '40%', fontWeight: 'bold' }]}>Metode</Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontWeight: 'bold' }]}>Jumlah Trx</Text>
            <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right', fontWeight: 'bold' }]}>Total</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>%</Text>
          </View>
          {data.payment_methods.map((method, index) => (
            <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '40%' }]}>{method.method}</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center' }]}>{method.count}</Text>
              <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right', fontSize: 8 }]}>
                {formatCurrency(method.total)}
              </Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '15%', textAlign: 'right' }]}>{method.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Daily Breakdown - Paginated */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Rincian Harian</Text>
        <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
          Breakdown pendapatan dan pajak per hari untuk rekonsiliasi (Menampilkan 15 hari pertama dari {totalDays} hari)
        </Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '15%', fontWeight: 'bold' }]}>Tanggal</Text>
            <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right', fontWeight: 'bold' }]}>Kamar</Text>
            <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right', fontWeight: 'bold' }]}>Event</Text>
            <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right', fontWeight: 'bold' }]}>Total Rev</Text>
            <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'right', fontWeight: 'bold' }]}>Pajak</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '17%', textAlign: 'right', fontWeight: 'bold' }]}>Grand Total</Text>
          </View>
          {limitedDailyBreakdown.map((day, index) => (
            <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
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
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '17%', textAlign: 'right', fontSize: 7 }]}>
                {formatCurrency(day.grand_total).replace('Rp', '').trim()}
              </Text>
            </View>
          ))}
        </View>
      </View>


      {/* Footer Notes */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Catatan</Text>
        <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#6B7280' }}>
          1. Laporan ini mencakup semua transaksi dalam periode {formatDate(data.start_date)} - {formatDate(data.end_date)} ({data.statistics.total_transactions} transaksi, {data.statistics.total_guests} tamu).{'\n'}
          2. Rincian harian berdasarkan tanggal check-in untuk kamar dan tanggal event untuk acara (mencerminkan tanggal penyediaan layanan).{'\n'}
          3. PPN ({data.tax_rates.ppn}%) dan Pajak Hotel ({data.tax_rates.hotel_tax}%) telah dikumpulkan dari pelanggan dan wajib disetor ke pemerintah.{'\n'}
          4. PPh Final ({data.tax_rates.pph_final}%) merupakan pajak penghasilan yang wajib disetor ke pemerintah pusat.{'\n'}
          5. Service charge ({data.tax_rates.service_charge}%) merupakan biaya layanan untuk karyawan (bukan pajak).{'\n'}
          6. Total kewajiban pajak: {formatCurrency(data.tax_obligations.total_payable)} harus disetor sesuai peraturan perpajakan yang berlaku.{'\n'}
          7. Metode pembayaran menunjukkan distribusi pembayaran yang diterima (persentase dari total pembayaran).{'\n'}
          8. Laporan ini siap untuk diserahkan kepada instansi pajak sebagai bukti pelaporan kewajiban pajak hotel.
        </Text>
      </View>
    </PDFTemplate>
  );
};
