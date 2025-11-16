import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { PDFTemplate, pdfStyles } from './PDFTemplate';

interface ComplaintCategory {
  category: string;
  count: number;
  percentage: number;
}

interface DailyData {
  date: string;
  total_complaints: number;
  resolved: number;
  pending: number;
}

interface SatisfactionData {
  period: string;
  total_complaints: number;
  resolved_complaints: number;
  pending_complaints: number;
  resolution_rate: number;
  satisfaction_score: number;
  total_reservations: number;
  average_resolution_time: number;
  complaint_rate_per_100: number;
  complaints_by_category: ComplaintCategory[];
  daily_data: DailyData[];
}

interface SatisfactionReportPDFProps {
  data: SatisfactionData;
}

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

const getCategoryLabel = (category: string) => {
  const labels: Record<string, string> = {
    'ROOM_CONDITION': 'Kondisi Kamar',
    'SERVICE_QUALITY': 'Kualitas Layanan',
    'CLEANLINESS': 'Kebersihan',
    'NOISE': 'Kebisingan',
    'AMENITIES': 'Fasilitas',
    'BILLING': 'Tagihan',
    'STAFF_BEHAVIOR': 'Perilaku Staff',
    'OTHER': 'Lainnya'
  };
  return labels[category] || category;
};

export const SatisfactionReportPDF: React.FC<SatisfactionReportPDFProps> = ({ data }) => {
  // Limit daily data to first 15 days to prevent rendering issues
  const limitedDailyData = data.daily_data ? data.daily_data.slice(0, 15) : [];
  const totalDays = data.daily_data ? data.daily_data.length : 0;

  return (
    <PDFTemplate title="Laporan Survei Kepuasan Tamu" period={getPeriodLabel(data.period)}>
      {/* Summary Statistics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Ringkasan Kepuasan</Text>
        <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 4 }}>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#374151' }}>
            <Text style={{ fontWeight: 'bold' }}>Periode:</Text> {getPeriodLabel(data.period)}{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Total Reservasi:</Text> {data.total_reservations} reservasi{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Skor Kepuasan:</Text> {data.satisfaction_score}/5.0{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Total Keluhan:</Text> {data.total_complaints} keluhan{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Tingkat Resolusi:</Text> {data.resolution_rate}%
          </Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Metrik Kinerja</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Skor Kepuasan</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{data.satisfaction_score}/5.0</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>rating rata-rata</Text>
          </View>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Tingkat Resolusi</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{data.resolution_rate}%</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>{data.resolved_complaints} dari {data.total_complaints}</Text>
          </View>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Waktu Resolusi</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{data.average_resolution_time}h</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>rata-rata jam</Text>
          </View>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Tingkat Keluhan</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{data.complaint_rate_per_100}</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>per 100 reservasi</Text>
          </View>
        </View>
      </View>

      {/* Complaints by Category */}
      {data.complaints_by_category && data.complaints_by_category.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Keluhan per Kategori</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '50%', fontWeight: 'bold' }]}>Kategori</Text>
              <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right', fontWeight: 'bold' }]}>Jumlah</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '25%', textAlign: 'right', fontWeight: 'bold' }]}>Persentase</Text>
            </View>
            {data.complaints_by_category.map((item, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '50%' }]}>{getCategoryLabel(item.category)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right' }]}>
                  {item.count}
                </Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '25%', textAlign: 'right' }]}>
                  {item.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Daily Data Table */}
      {limitedDailyData.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Data Harian Keluhan</Text>
          <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
            Menampilkan 15 hari pertama dari {totalDays} hari
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '40%', fontWeight: 'bold' }]}>Tanggal</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontWeight: 'bold' }]}>Total</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontWeight: 'bold' }]}>Selesai</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '20%', textAlign: 'center', fontWeight: 'bold' }]}>Pending</Text>
            </View>
            {limitedDailyData.map((day, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '40%', fontSize: 8 }]}>{formatDate(day.date)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontSize: 8 }]}>{day.total_complaints}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontSize: 8 }]}>{day.resolved}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '20%', textAlign: 'center', fontSize: 8 }]}>{day.pending}</Text>
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
            • Skor kepuasan tamu: {data.satisfaction_score}/5.0 ({data.satisfaction_score >= 4.5 ? 'Sangat Baik' : data.satisfaction_score >= 4.0 ? 'Baik' : data.satisfaction_score >= 3.5 ? 'Cukup' : 'Perlu Perbaikan'})
          </Text>
          <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>
            • Tingkat resolusi keluhan: {data.resolution_rate}% ({data.resolved_complaints} dari {data.total_complaints} keluhan diselesaikan)
          </Text>
          <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>
            • Waktu rata-rata penyelesaian: {data.average_resolution_time} jam
          </Text>
          <Text style={{ fontSize: 9, color: '#6B7280' }}>
            • Tingkat keluhan: {data.complaint_rate_per_100} keluhan per 100 reservasi
          </Text>
        </View>
      </View>
    </PDFTemplate>
  );
};
