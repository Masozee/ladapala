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
  daily_revenue: Array<{
    date: string;
    revenue: number;
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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const getPeriodLabel = (period: string) => {
  if (period && period.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = period.split('-');
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
  const labels: Record<string, string> = {
    thisMonth: 'Bulan Ini',
    lastMonth: 'Bulan Lalu',
    thisQuarter: 'Kuartal Ini',
    thisYear: 'Tahun Ini',
  };
  return labels[period] || period;
};

export const RevenueReportPDF: React.FC<RevenueReportPDFProps> = ({ data }) => {
  // Limit daily revenue to first 15 days to prevent rendering issues
  const limitedDailyRevenue = data.daily_revenue ? data.daily_revenue.slice(0, 15) : [];
  const totalDays = data.daily_revenue ? data.daily_revenue.length : 0;

  // Calculate statistics
  const averageDailyRevenue = totalDays > 0 ? data.total_revenue / totalDays : 0;
  const highestDailyRevenue = data.daily_revenue && data.daily_revenue.length > 0
    ? Math.max(...data.daily_revenue.map(d => d.revenue))
    : 0;
  const lowestDailyRevenue = data.daily_revenue && data.daily_revenue.length > 0
    ? Math.min(...data.daily_revenue.map(d => d.revenue))
    : 0;
  const roomRevenuePercentage = data.total_revenue > 0
    ? (data.room_revenue / data.total_revenue) * 100
    : 0;
  const otherRevenuePercentage = data.total_revenue > 0
    ? (data.other_revenue / data.total_revenue) * 100
    : 0;

  return (
    <PDFTemplate title="Laporan Pendapatan Hotel" period={getPeriodLabel(data.period)}>
      {/* Summary Statistics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Ringkasan Pendapatan</Text>
        <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 4 }}>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#374151' }}>
            <Text style={{ fontWeight: 'bold' }}>Periode:</Text> {getPeriodLabel(data.period)} ({totalDays} hari){'\n'}
            <Text style={{ fontWeight: 'bold' }}>Total Pendapatan:</Text> {formatCurrency(data.total_revenue)}{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Rata-rata Harian:</Text> {formatCurrency(averageDailyRevenue)}{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Pendapatan Tertinggi:</Text> {formatCurrency(highestDailyRevenue)}{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Pendapatan Terendah:</Text> {formatCurrency(lowestDailyRevenue)}
          </Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Metrik Kinerja</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '32%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Pendapatan Kamar</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{formatCurrency(data.room_revenue)}</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>{roomRevenuePercentage.toFixed(1)}% dari total</Text>
          </View>
          <View style={{ width: '32%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Pendapatan Lainnya</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{formatCurrency(data.other_revenue)}</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>{otherRevenuePercentage.toFixed(1)}% dari total</Text>
          </View>
          <View style={{ width: '32%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Rata-rata Harian</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{formatCurrency(averageDailyRevenue)}</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>per hari</Text>
          </View>
        </View>
      </View>

      {/* Revenue by Payment Method */}
      {data.revenue_by_method && data.revenue_by_method.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Pendapatan per Metode Pembayaran</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '40%', fontWeight: 'bold' }]}>Metode</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontWeight: 'bold' }]}>Transaksi</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '40%', textAlign: 'right', fontWeight: 'bold' }]}>Total</Text>
            </View>
            {data.revenue_by_method.map((method, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '40%' }]}>{method.method}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center' }]}>{method.count}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '40%', textAlign: 'right' }]}>
                  {formatCurrency(method.total)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Daily Revenue */}
      {limitedDailyRevenue.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Data Harian Pendapatan</Text>
          <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
            Menampilkan 15 hari pertama dari {totalDays} hari
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '50%', fontWeight: 'bold' }]}>Tanggal</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '50%', textAlign: 'right', fontWeight: 'bold' }]}>Pendapatan</Text>
            </View>
            {limitedDailyRevenue.map((day, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '50%' }]}>{formatDate(day.date)}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '50%', textAlign: 'right' }]}>
                  {formatCurrency(day.revenue)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </PDFTemplate>
  );
};
