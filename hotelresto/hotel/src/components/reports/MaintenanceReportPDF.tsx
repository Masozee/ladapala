import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { PDFTemplate, pdfStyles } from './PDFTemplate';

interface PriorityBreakdown {
  priority: string;
  count: number;
}

interface CategoryBreakdown {
  category: string;
  count: number;
}

interface DailyData {
  date: string;
  total_requests: number;
  completed: number;
  in_progress: number;
  pending: number;
  cost: number;
}

interface MaintenanceData {
  period: string;
  total_requests: number;
  completed: number;
  in_progress: number;
  pending: number;
  total_cost: number;
  average_resolution_time: number;
  completion_rate: number;
  avg_cost_per_request: number;
  by_priority: PriorityBreakdown[];
  by_category: CategoryBreakdown[];
  daily_data: DailyData[];
}

interface MaintenanceReportPDFProps {
  data: MaintenanceData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

const getPriorityLabel = (priority: string) => {
  const labels: Record<string, string> = {
    'EMERGENCY': 'Darurat',
    'HIGH': 'Tinggi',
    'MEDIUM': 'Menengah',
    'LOW': 'Rendah'
  };
  return labels[priority] || priority;
};

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    'PLUMBING': 'Pipa & Air',
    'ELECTRICAL': 'Kelistrikan',
    'HVAC': 'AC & Ventilasi',
    'FURNITURE': 'Furnitur',
    'APPLIANCES': 'Peralatan',
    'STRUCTURE': 'Struktur Bangunan',
    'SAFETY': 'Keamanan',
    'OTHER': 'Lainnya'
  };
  return labels[category] || category;
};

export const MaintenanceReportPDF: React.FC<MaintenanceReportPDFProps> = ({ data }) => {
  // Limit daily data to first 15 days to prevent rendering issues
  const limitedDailyData = data.daily_data ? data.daily_data.slice(0, 15) : [];
  const totalDays = data.daily_data ? data.daily_data.length : 0;

  return (
    <PDFTemplate title="Laporan Pemeliharaan Hotel" period={getPeriodLabel(data.period)}>
      {/* Summary Statistics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Ringkasan Pemeliharaan</Text>
        <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 4 }}>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#374151' }}>
            <Text style={{ fontWeight: 'bold' }}>Periode:</Text> {getPeriodLabel(data.period)}{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Total Permintaan:</Text> {data.total_requests} permintaan{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Tingkat Penyelesaian:</Text> {data.completion_rate}%{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Total Biaya:</Text> {formatCurrency(data.total_cost)}{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Waktu Resolusi Rata-rata:</Text> {data.average_resolution_time} jam
          </Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Metrik Kinerja</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Total Permintaan</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{data.total_requests}</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>{data.completed} selesai</Text>
          </View>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Tingkat Selesai</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{data.completion_rate}%</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>{data.completed}/{data.total_requests}</Text>
          </View>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Waktu Resolusi</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{data.average_resolution_time}h</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>rata-rata jam</Text>
          </View>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Biaya Per Permintaan</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{formatCurrency(data.avg_cost_per_request)}</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>rata-rata</Text>
          </View>
        </View>
      </View>

      {/* Status Breakdown */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Status Permintaan</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '50%', fontWeight: 'bold' }]}>Status</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '50%', textAlign: 'right', fontWeight: 'bold' }]}>Jumlah</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '50%' }]}>Selesai</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '50%', textAlign: 'right' }]}>{data.completed}</Text>
          </View>
          <View style={[pdfStyles.tableRow, pdfStyles.tableRowAlt]}>
            <Text style={[pdfStyles.tableCell, { width: '50%' }]}>Dalam Proses</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '50%', textAlign: 'right' }]}>{data.in_progress}</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '50%' }]}>Pending</Text>
            <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '50%', textAlign: 'right' }]}>{data.pending}</Text>
          </View>
        </View>
      </View>

      {/* By Priority */}
      {data.by_priority && data.by_priority.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Permintaan per Prioritas</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '50%', fontWeight: 'bold' }]}>Prioritas</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '50%', textAlign: 'right', fontWeight: 'bold' }]}>Jumlah</Text>
            </View>
            {data.by_priority.map((item, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '50%' }]}>{getPriorityLabel(item.priority)}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '50%', textAlign: 'right' }]}>
                  {item.count}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* By Category */}
      {data.by_category && data.by_category.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Permintaan per Kategori</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '50%', fontWeight: 'bold' }]}>Kategori</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '50%', textAlign: 'right', fontWeight: 'bold' }]}>Jumlah</Text>
            </View>
            {data.by_category.map((item, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '50%' }]}>{getCategoryLabel(item.category)}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '50%', textAlign: 'right' }]}>
                  {item.count}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Daily Data Table */}
      {limitedDailyData.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Data Harian Pemeliharaan</Text>
          <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
            Menampilkan 15 hari pertama dari {totalDays} hari
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '25%', fontWeight: 'bold', fontSize: 8 }]}>Tanggal</Text>
              <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontWeight: 'bold', fontSize: 8 }]}>Total</Text>
              <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontWeight: 'bold', fontSize: 8 }]}>Selesai</Text>
              <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontWeight: 'bold', fontSize: 8 }]}>Proses</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '30%', textAlign: 'right', fontWeight: 'bold', fontSize: 8 }]}>Biaya</Text>
            </View>
            {limitedDailyData.map((day, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '25%', fontSize: 8 }]}>{formatDate(day.date)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontSize: 8 }]}>{day.total_requests}</Text>
                <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontSize: 8 }]}>{day.completed}</Text>
                <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontSize: 8 }]}>{day.in_progress}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '30%', textAlign: 'right', fontSize: 8 }]}>
                  {formatCurrency(day.cost)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Insights Section */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Insight</Text>
        <View style={{ padding: 10, backgroundColor: '#F9FAFB' }}>
          <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>
            • Total permintaan pemeliharaan: {data.total_requests} ({data.completion_rate}% selesai)
          </Text>
          <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>
            • Waktu rata-rata penyelesaian: {data.average_resolution_time} jam
          </Text>
          <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>
            • Total biaya pemeliharaan: {formatCurrency(data.total_cost)}
          </Text>
          <Text style={{ fontSize: 9, color: '#6B7280' }}>
            • Biaya rata-rata per permintaan: {formatCurrency(data.avg_cost_per_request)}
          </Text>
        </View>
      </View>
    </PDFTemplate>
  );
};
