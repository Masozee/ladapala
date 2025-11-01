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
  return (
    <PDFTemplate title="Laporan Pendapatan Hotel" period={getPeriodLabel(data.period)}>
      {/* Key Metrics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Ringkasan Pendapatan</Text>
        <View style={pdfStyles.metricsGrid}>
          <View style={pdfStyles.metricCard}>
            <Text style={pdfStyles.metricLabel}>Total Pendapatan</Text>
            <Text style={[pdfStyles.metricValue, { fontSize: 12 }]}>
              {formatCurrency(data.total_revenue)}
            </Text>
          </View>
          <View style={pdfStyles.metricCard}>
            <Text style={pdfStyles.metricLabel}>Pendapatan Kamar</Text>
            <Text style={[pdfStyles.metricValue, { fontSize: 12 }]}>
              {formatCurrency(data.room_revenue)}
            </Text>
          </View>
          <View style={pdfStyles.metricCard}>
            <Text style={pdfStyles.metricLabel}>Pendapatan Lainnya</Text>
            <Text style={[pdfStyles.metricValue, { fontSize: 12 }]}>
              {formatCurrency(data.other_revenue)}
            </Text>
          </View>
        </View>
      </View>

      {/* Revenue by Payment Method */}
      {data.revenue_by_method && data.revenue_by_method.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Pendapatan per Metode Pembayaran</Text>
          <View style={pdfStyles.table}>
            {/* Table Header */}
            <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
              <Text style={[pdfStyles.tableCell, { width: '40%' }]}>Metode Pembayaran</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%' }]}>Transaksi</Text>
              <Text style={[pdfStyles.tableCell, { width: '40%' }]}>Total</Text>
            </View>
            {/* Table Rows */}
            {data.revenue_by_method.map((method, index) => (
              <View key={index} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '40%' }]}>{method.method}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%' }]}>{method.count}</Text>
                <Text style={[pdfStyles.tableCell, { width: '40%' }]}>
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
