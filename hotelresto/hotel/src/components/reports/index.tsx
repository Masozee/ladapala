// Report PDF Components Registry
export { OccupancyReportPDF } from './OccupancyReportPDF';
export { RevenueReportPDF } from './RevenueReportPDF';
export { TaxReportPDF } from './TaxReportPDF';
export { GuestAnalyticsPDF } from './GuestAnalyticsPDF';
export { SatisfactionReportPDF } from './SatisfactionReportPDF';
export { MaintenanceReportPDF } from './MaintenanceReportPDF';
export { InventoryReportPDF } from './InventoryReportPDF';
export { FullReportPDF } from './FullReportPDF';
export { PDFTemplate, pdfStyles } from './PDFTemplate';

// Generic report PDF component for reports without custom components
import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { PDFTemplate, pdfStyles } from './PDFTemplate';

interface GenericReportData {
  period?: string;
  [key: string]: any;
}

interface GenericReportPDFProps {
  data: GenericReportData;
  title: string;
}

export const GenericReportPDF: React.FC<GenericReportPDFProps> = ({ data, title }) => {
  const getPeriodLabel = (period?: string) => {
    if (!period) return undefined;
    const labels: Record<string, string> = {
      thisMonth: 'Bulan Ini',
      lastMonth: 'Bulan Lalu',
      thisQuarter: 'Kuartal Ini',
      thisYear: 'Tahun Ini',
    };
    return labels[period] || period;
  };

  // Indonesian labels for common metrics
  const metricLabels: Record<string, string> = {
    total_bookings: 'Total Booking',
    occupancy_rate: 'Tingkat Okupansi (%)',
    average_revenue: 'Rata-rata Pendapatan (Rp)',
    guest_satisfaction: 'Kepuasan Tamu',
    check_ins: 'Check In',
    check_outs: 'Check Out',
    pending_reservations: 'Reservasi Pending',
    total_revenue: 'Total Pendapatan (Rp)',
    room_revenue: 'Pendapatan Kamar (Rp)',
  };

  // Extract metrics (top-level properties that are numbers)
  const metrics = Object.entries(data)
    .filter(([key, value]) => typeof value === 'number' && key !== 'period')
    .slice(0, 8); // Show max 8 metrics

  const formatValue = (key: string, value: number) => {
    if (key.includes('revenue') || key.includes('amount')) {
      return `Rp ${value.toLocaleString('id-ID')}`;
    }
    if (key.includes('rate') && value < 100) {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString('id-ID');
  };

  return (
    <PDFTemplate title={title} period={getPeriodLabel(data.period) || data.report_date}>
      {metrics.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Ringkasan Operasional</Text>
          <View style={pdfStyles.metricsGrid}>
            {metrics.map(([key, value]) => (
              <View key={key} style={pdfStyles.metricCard}>
                <Text style={pdfStyles.metricLabel}>
                  {metricLabels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
                <Text style={pdfStyles.metricValue}>
                  {formatValue(key, value as number)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Additional info */}
      {data.report_date && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Informasi Laporan</Text>
          <Text style={[pdfStyles.tableCell, { fontSize: 10, marginBottom: 5, borderRight: 'none' }]}>
            Tanggal: {new Date(data.report_date).toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={[pdfStyles.tableCell, { fontSize: 10, borderRight: 'none' }]}>
            Dibuat: {new Date(data.generated_at || new Date()).toLocaleString('id-ID')}
          </Text>
        </View>
      )}
    </PDFTemplate>
  );
};
