import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { PDFTemplate, pdfStyles } from './PDFTemplate';

interface RevenueData {
  period: string;
  total_revenue: number;
  room_revenue: number;
  other_revenue: number;
  revenue_by_method: Array<{
    method: string;
    total: number;
    count: number;
  }>;
}

interface RevenueReportPDFProps {
  data: RevenueData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
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

export const RevenueReportPDF: React.FC<RevenueReportPDFProps> = ({ data }) => {
  // Calculate insights for narrative
  const roomRevenuePercentage = data.total_revenue > 0
    ? ((data.room_revenue / data.total_revenue) * 100).toFixed(1)
    : 0;

  const otherRevenuePercentage = data.total_revenue > 0
    ? ((data.other_revenue / data.total_revenue) * 100).toFixed(1)
    : 0;

  const topPaymentMethod = data.revenue_by_method && data.revenue_by_method.length > 0
    ? data.revenue_by_method.reduce((prev, current) =>
        (prev.total > current.total) ? prev : current
      )
    : null;

  const totalTransactions = data.revenue_by_method
    ? data.revenue_by_method.reduce((sum, method) => sum + method.count, 0)
    : 0;

  const averageTransactionValue = totalTransactions > 0
    ? data.total_revenue / totalTransactions
    : 0;

  return (
    <PDFTemplate title="Laporan Pendapatan Hotel" period={getPeriodLabel(data.period)}>
      {/* Executive Summary */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Ringkasan Eksekutif</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.6, textAlign: 'justify', color: '#374151' }}>
          Total pendapatan periode {getPeriodLabel(data.period).toLowerCase()}: <Text style={{ fontWeight: 'bold' }}>{formatCurrency(data.total_revenue)}</Text> dari {totalTransactions} transaksi (avg {formatCurrency(averageTransactionValue)}/transaksi).
          Komposisi: Kamar {roomRevenuePercentage}%, Lainnya {otherRevenuePercentage}%.
          {topPaymentMethod && ` Metode dominan: ${topPaymentMethod.method} (${topPaymentMethod.count} transaksi).`}
        </Text>
      </View>

      {/* Key Indicators */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Indikator Kinerja</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#374151' }}>
          Total Revenue: <Text style={{ fontWeight: 'bold', color: '#4E61D3' }}>{formatCurrency(data.total_revenue)}</Text>
          {data.total_revenue > 50000000 && ' (Kuat)'}
          {data.total_revenue > 20000000 && data.total_revenue <= 50000000 && ' (Solid)'}
          {data.total_revenue <= 20000000 && ' (Ruang Tumbuh)'}
          {'\n'}
          Room Revenue: {formatCurrency(data.room_revenue)} ({roomRevenuePercentage}%)
          {'\n'}
          Ancillary Revenue: {formatCurrency(data.other_revenue)} ({otherRevenuePercentage}%)
          {'\n'}
          Avg Transaction: {formatCurrency(averageTransactionValue)} ({totalTransactions} transaksi)
          {topPaymentMethod && `\nTop Payment: ${topPaymentMethod.method} (${topPaymentMethod.count}x)`}
        </Text>
      </View>

      {/* Visual Revenue Breakdown */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Komposisi Revenue</Text>
        <View style={{ backgroundColor: '#F9FAFB', padding: 10, marginTop: 8, borderRadius: 4, border: '1 solid #E5E7EB' }}>
          <Text style={{ fontSize: 9, fontFamily: 'Courier', lineHeight: 1.4, color: '#1F2937' }}>
            Kamar   {'▓'.repeat(Math.round(Number(roomRevenuePercentage) / 2.5))} {roomRevenuePercentage}%{'\n'}
            Lainnya {'▓'.repeat(Math.round(Number(otherRevenuePercentage) / 2.5))} {otherRevenuePercentage}%
          </Text>
        </View>
      </View>

      {/* Analysis */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Analisis</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#374151' }}>
          <Text style={{ fontWeight: 'bold' }}>Revenue Mix:{' '}</Text>
          {Number(roomRevenuePercentage) >= 80 ? `Ketergantungan tinggi pada kamar (${roomRevenuePercentage}%). Perlu diversifikasi via F&B, spa, events.` : Number(roomRevenuePercentage) >= 60 ? `Balanced mix (kamar ${roomRevenuePercentage}%, lainnya ${otherRevenuePercentage}%). Pertahankan dan kembangkan.` : `Diversifikasi baik (lainnya ${otherRevenuePercentage}%). Revenue mix mature dan stabil.`}
          {'\n\n'}
          <Text style={{ fontWeight: 'bold' }}>Transaction Value:{' '}</Text>
          {averageTransactionValue > 1500000 ? `Premium (${formatCurrency(averageTransactionValue)}). Segmen high-end, fokus experience excellence.` : averageTransactionValue > 800000 ? `Mid-tier (${formatCurrency(averageTransactionValue)}). Tingkatkan frequency & basket size via packages.` : `Modest (${formatCurrency(averageTransactionValue)}). Opportunity untuk upselling dan bundling services.`}
          {'\n\n'}
          <Text style={{ fontWeight: 'bold' }}>Payment Pattern:{' '}</Text>
          {topPaymentMethod && (
            <>
              Dominasi {topPaymentMethod.method}.
              {topPaymentMethod.method.toLowerCase().includes('tunai') && ' Karakteristik lokal/walk-in. Push digital payment untuk efisiensi.'}
              {topPaymentMethod.method.toLowerCase().includes('kartu') && ' Modern travelers, bagus untuk analytics dan loyalty program.'}
              {topPaymentMethod.method.toLowerCase().includes('transfer') && ' Advance bookings/corporate. High-value predictable segment.'}
            </>
          )}
        </Text>
      </View>

      {/* Recommendations */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Rekomendasi</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#374151' }}>
          {Number(roomRevenuePercentage) >= 80 && (
            <>
              <Text style={{ fontWeight: 'bold' }}>• Diversifikasi:{' '}</Text>
              Develop ancillary revenue via F&B strategy, spa/wellness, event spaces, tour partnerships. Target 30% ancillary dalam 12-18 bulan.{'\n'}
            </>
          )}
          {Number(otherRevenuePercentage) < 20 && (
            <>
              <Text style={{ fontWeight: 'bold' }}>• Upselling:{' '}</Text>
              Systematic upsell (booking, check-in, in-stay). Bundled packages, staff training, in-room marketing. Target 50% increase 6 bulan.{'\n'}
            </>
          )}
          {averageTransactionValue < 1000000 && (
            <>
              <Text style={{ fontWeight: 'bold' }}>• Transaction Value:{' '}</Text>
              Tiered categories, Good-Better-Best packages, stay-longer incentives, loyalty tiers. Target 20-30% uplift.{'\n'}
            </>
          )}
          <Text style={{ fontWeight: 'bold' }}>• Revenue Management:{' '}</Text>
          Dynamic pricing, demand forecasting, competitor intelligence, rate fences. Monitor RevPAR, ADR, GOPPAR.{'\n'}
          <Text style={{ fontWeight: 'bold' }}>• Guest Experience:{' '}</Text>
          Staff training, feedback loop, personalization, loyalty program, direct bookings. Target 30% repeat guests.
        </Text>
      </View>

      {/* Revenue by Payment Method - Data Table */}
      {data.revenue_by_method && data.revenue_by_method.length > 0 && (
        <View style={pdfStyles.section} break>
          <Text style={pdfStyles.sectionTitle}>Lampiran: Breakdown Pendapatan per Metode Pembayaran</Text>
          <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
            Tabel detail menampilkan distribusi pendapatan berdasarkan payment method yang digunakan tamu.
          </Text>
          <View style={pdfStyles.table}>
            {/* Table Header */}
            <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
              <Text style={[pdfStyles.tableCell, { width: '40%' }]}>Metode Pembayaran</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%' }]}>Jumlah Transaksi</Text>
              <Text style={[pdfStyles.tableCell, { width: '40%' }]}>Total Pendapatan</Text>
            </View>
            {/* Table Rows */}
            {data.revenue_by_method.map((method, index) => (
              <View key={index} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '40%' }]}>{method.method}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center' }]}>{method.count}</Text>
                <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>
                  {formatCurrency(method.total)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </PDFTemplate>
  );
};
