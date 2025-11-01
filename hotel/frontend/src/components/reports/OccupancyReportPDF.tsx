import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { PDFTemplate, pdfStyles } from './PDFTemplate';

interface OccupancyData {
  period: string;
  average_occupancy: number;
  total_rooms: number;
  daily_data: Array<{
    date: string;
    occupied_rooms: number;
    total_rooms: number;
    occupancy_rate: number;
  }>;
}

interface OccupancyReportPDFProps {
  data: OccupancyData;
}

const getPeriodLabel = (period: string) => {
  const labels: Record<string, string> = {
    thisMonth: 'Bulan Ini',
    lastMonth: 'Bulan Lalu',
    thisQuarter: 'Kuartal Ini',
    thisYear: 'Tahun Ini',
  };
  return labels[period] || period;
};

export const OccupancyReportPDF: React.FC<OccupancyReportPDFProps> = ({ data }) => {
  return (
    <PDFTemplate title="Laporan Okupansi Hotel" period={getPeriodLabel(data.period)}>
      {/* Key Metrics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Ringkasan Okupansi</Text>
        <View style={pdfStyles.metricsGrid}>
          <View style={pdfStyles.metricCard}>
            <Text style={pdfStyles.metricLabel}>Rata-rata Okupansi</Text>
            <Text style={pdfStyles.metricValue}>{data.average_occupancy.toFixed(1)}%</Text>
          </View>
          <View style={pdfStyles.metricCard}>
            <Text style={pdfStyles.metricLabel}>Total Kamar</Text>
            <Text style={pdfStyles.metricValue}>{data.total_rooms}</Text>
          </View>
        </View>
      </View>

      {/* Daily Data Table */}
      {data.daily_data && data.daily_data.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Data Harian</Text>
          <View style={pdfStyles.table}>
            {/* Table Header */}
            <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
              <Text style={[pdfStyles.tableCell, { width: '25%' }]}>Tanggal</Text>
              <Text style={[pdfStyles.tableCell, { width: '25%' }]}>Kamar Terisi</Text>
              <Text style={[pdfStyles.tableCell, { width: '25%' }]}>Total Kamar</Text>
              <Text style={[pdfStyles.tableCell, { width: '25%' }]}>Okupansi (%)</Text>
            </View>
            {/* Table Rows */}
            {data.daily_data.map((day, index) => (
              <View key={index} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '25%' }]}>
                  {new Date(day.date).toLocaleDateString('id-ID')}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '25%' }]}>{day.occupied_rooms}</Text>
                <Text style={[pdfStyles.tableCell, { width: '25%' }]}>{day.total_rooms}</Text>
                <Text style={[pdfStyles.tableCell, { width: '25%' }]}>{day.occupancy_rate.toFixed(1)}%</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </PDFTemplate>
  );
};
