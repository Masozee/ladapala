// Report PDF Components Registry
export { OccupancyReportPDF } from './OccupancyReportPDF';
export { RevenueReportPDF } from './RevenueReportPDF';
export { TaxReportPDF } from './TaxReportPDF';
export { GuestAnalyticsPDF } from './GuestAnalyticsPDF';
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

  // Extract metrics (top-level properties that are numbers)
  const metrics = Object.entries(data)
    .filter(([key, value]) => typeof value === 'number' && key !== 'period')
    .slice(0, 6); // Show max 6 metrics

  return (
    <PDFTemplate title={title} period={getPeriodLabel(data.period)}>
      {metrics.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Ringkasan</Text>
          <View style={pdfStyles.metricsGrid}>
            {metrics.map(([key, value]) => (
              <View key={key} style={pdfStyles.metricCard}>
                <Text style={pdfStyles.metricLabel}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </Text>
                <Text style={pdfStyles.metricValue}>
                  {typeof value === 'number' ? value.toLocaleString('id-ID') : value}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Raw data for debugging/development */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Data Lengkap</Text>
        <Text style={[pdfStyles.tableCell, { fontSize: 8 }]}>
          {JSON.stringify(data, null, 2)}
        </Text>
      </View>
    </PDFTemplate>
  );
};
