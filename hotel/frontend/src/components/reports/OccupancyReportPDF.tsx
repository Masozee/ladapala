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
  // Calculate insights
  const highestOccupancy = data.daily_data.length > 0
    ? Math.max(...data.daily_data.map(d => d.occupancy_rate))
    : 0;
  const lowestOccupancy = data.daily_data.length > 0
    ? Math.min(...data.daily_data.map(d => d.occupancy_rate))
    : 0;
  const daysFullyBooked = data.daily_data.filter(d => d.occupancy_rate >= 100).length;
  const averageOccupiedRooms = data.daily_data.length > 0
    ? Math.round(data.daily_data.reduce((sum, d) => sum + d.occupied_rooms, 0) / data.daily_data.length)
    : 0;

  // Generate simple bar chart
  const generateBarChart = () => {
    const sortedData = [...data.daily_data].slice(0, 10);
    return sortedData.map((day) => {
      const barLength = Math.round(day.occupancy_rate / 2.5); // Scale to max 40 chars for 100%
      const bar = '▓'.repeat(barLength);
      const date = new Date(day.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
      const paddedDate = date.length < 8 ? date + ' '.repeat(8 - date.length) : date;
      return `${paddedDate} ${bar} ${day.occupancy_rate.toFixed(1)}%`;
    }).join('\n');
  };

  return (
    <PDFTemplate title="Laporan Okupansi Hotel" period={getPeriodLabel(data.period)}>
      {/* Executive Summary */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Ringkasan Eksekutif</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.6, textAlign: 'justify', color: '#374151' }}>
          Okupansi rata-rata periode {getPeriodLabel(data.period).toLowerCase()} mencapai <Text style={{ fontWeight: 'bold' }}>{data.average_occupancy.toFixed(1)}%</Text> dengan {data.total_rooms} kamar tersedia.
          {daysFullyBooked > 0 && ` Terdapat ${daysFullyBooked} hari fully booked.`}
          {' '}Range okupansi: {lowestOccupancy.toFixed(1)}% - {highestOccupancy.toFixed(1)}%.
          Rata-rata {averageOccupiedRooms} kamar terisi per hari.
        </Text>
      </View>

      {/* Performance Indicators */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Indikator Kinerja</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#374151' }}>
          Okupansi Rata-rata: <Text style={{ fontWeight: 'bold', color: '#4E61D3' }}>{data.average_occupancy.toFixed(1)}%</Text>
          {data.average_occupancy >= 80 && ' (Sangat Baik)'}
          {data.average_occupancy >= 60 && data.average_occupancy < 80 && ' (Baik)'}
          {data.average_occupancy < 60 && ' (Perlu Ditingkatkan)'}
          {'\n'}
          Range: {lowestOccupancy.toFixed(1)}% - {highestOccupancy.toFixed(1)}% (Variasi: {(highestOccupancy - lowestOccupancy).toFixed(1)} poin)
          {'\n'}
          Hari Fully Booked: {daysFullyBooked} dari {data.daily_data.length} hari
          {'\n'}
          Rata-rata Kamar Terisi: {averageOccupiedRooms} / {data.total_rooms} kamar
        </Text>
      </View>

      {/* Visualisasi Trend */}
      {data.daily_data.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Trend Okupansi (10 Hari Pertama)</Text>
          <View style={{ backgroundColor: '#F9FAFB', padding: 10, marginTop: 8, borderRadius: 4, border: '1 solid #E5E7EB' }}>
            <Text style={{ fontSize: 8, fontFamily: 'Courier', lineHeight: 1.4, color: '#1F2937' }}>
              {generateBarChart()}
            </Text>
          </View>
        </View>
      )}

      {/* Analysis */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Analisis</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#374151' }}>
          <Text style={{ fontWeight: 'bold' }}>Performa:{' '}</Text>
          Okupansi {data.average_occupancy.toFixed(1)}%
          {data.average_occupancy >= 75 ? ' termasuk sangat baik (≥75%). Strategi marketing efektif.' : data.average_occupancy >= 60 ? ' termasuk baik (60-74%). Ada ruang untuk optimalisasi.' : ' perlu ditingkatkan (<60%). Evaluasi strategi pemasaran dan pricing.'}
          {' '}Benchmark industri: 60-70% (normal), 70-85% (peak season).
          {'\n\n'}
          <Text style={{ fontWeight: 'bold' }}>Variasi:{' '}</Text>
          Range {(highestOccupancy - lowestOccupancy).toFixed(1)} poin
          {(highestOccupancy - lowestOccupancy) > 50 ? ' (tinggi - seasonal/event-driven, perlu dynamic pricing)' : (highestOccupancy - lowestOccupancy) > 30 ? ' (moderat - normal, manfaatkan untuk peak/off-peak pricing)' : ' (rendah - demand stabil dan konsisten)'}.
          {'\n\n'}
          <Text style={{ fontWeight: 'bold' }}>Full Capacity:{' '}</Text>
          {daysFullyBooked > 0 ? (
            `${daysFullyBooked} hari fully booked. ${daysFullyBooked > data.daily_data.length * 0.5 ? 'Demand sangat tinggi, pertimbangkan rate optimization.' : daysFullyBooked > data.daily_data.length * 0.2 ? 'Fokus maksimalkan RevPAR pada periode peak.' : 'Identifikasi faktor pendorong untuk direplikasi.'}`
          ) : (
            'Tidak ada fully booked. Fokus pada akuisisi tamu baru.'
          )}
        </Text>
      </View>

      {/* Recommendations */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Rekomendasi</Text>
        <Text style={{ fontSize: 10, lineHeight: 1.5, color: '#374151' }}>
          {data.average_occupancy < 60 && (
            <>
              <Text style={{ fontWeight: 'bold' }}>• Marketing:{' '}</Text>
              Tingkatkan digital marketing via OTA, SEO, dan media sosial. Partnership dengan travel agents dan corporate accounts.{'\n'}
              <Text style={{ fontWeight: 'bold' }}>• Pricing:{' '}</Text>
              Analisis kompetitor, tawarkan promotional rates, paket long-stay, early-bird incentives. Terapkan dynamic pricing.{'\n'}
            </>
          )}
          {data.average_occupancy >= 60 && data.average_occupancy < 80 && (
            <>
              <Text style={{ fontWeight: 'bold' }}>• Revenue Management:{' '}</Text>
              Fokus maksimalkan RevPAR. Upselling/cross-selling untuk room upgrades, F&B, spa. Training staff.{'\n'}
              <Text style={{ fontWeight: 'bold' }}>• Segmentasi:{' '}</Text>
              Identifikasi segmen profitable, develop targeted packages, loyalty program untuk repeat business.{'\n'}
            </>
          )}
          {data.average_occupancy >= 80 && (
            <>
              <Text style={{ fontWeight: 'bold' }}>• Premium Strategy:{' '}</Text>
              Leverage okupansi tinggi untuk premium pricing. Tingkatkan ADR, kurangi OTA, prioritaskan direct bookings.{'\n'}
              <Text style={{ fontWeight: 'bold' }}>• Service Quality:{' '}</Text>
              Invest staff training, facility maintenance, guest satisfaction. Proactive feedback system.{'\n'}
            </>
          )}
          <Text style={{ fontWeight: 'bold' }}>• Forecasting:{' '}</Text>
          Regular tracking okupansi trends, revenue metrics, competitor performance. Quarterly strategy review.
        </Text>
      </View>

      {/* Daily Data Table - Compact */}
      {data.daily_data && data.daily_data.length > 0 && (
        <View style={pdfStyles.section} break>
          <Text style={pdfStyles.sectionTitle}>Lampiran: Rincian Data Harian</Text>
          <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
            Tabel berikut menampilkan data okupansi detail untuk setiap hari dalam periode pelaporan.
          </Text>
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
