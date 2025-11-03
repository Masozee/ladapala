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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getPeriodLabel = (period: string) => {
  // Handle YYYY-MM format
  if (period && period.match(/^\d{4}-\d{2}$/)) {
    const [year, month] = period.split('-');
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                       'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  }
  return period;
};

export const OccupancyReportPDF: React.FC<OccupancyReportPDFProps> = ({ data }) => {
  // Calculate statistics
  const totalDays = data.daily_data.length;
  const highestOccupancy = data.daily_data.length > 0
    ? Math.max(...data.daily_data.map(d => d.occupancy_rate))
    : 0;
  const lowestOccupancy = data.daily_data.length > 0
    ? Math.min(...data.daily_data.map(d => d.occupancy_rate))
    : 0;
  const daysFullyBooked = data.daily_data.filter(d => d.occupancy_rate >= 100).length;
  const daysAbove80 = data.daily_data.filter(d => d.occupancy_rate >= 80).length;
  const daysBelow50 = data.daily_data.filter(d => d.occupancy_rate < 50).length;

  const totalRoomNights = data.daily_data.reduce((sum, d) => sum + d.occupied_rooms, 0);
  const availableRoomNights = totalDays * data.total_rooms;

  return (
    <PDFTemplate title="Laporan Okupansi Hotel" period={getPeriodLabel(data.period)}>
      {/* Summary Statistics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Ringkasan Okupansi</Text>
        <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 4 }}>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#374151' }}>
            <Text style={{ fontWeight: 'bold' }}>Periode:</Text> {getPeriodLabel(data.period)} ({totalDays} hari){'\n'}
            <Text style={{ fontWeight: 'bold' }}>Total Kamar:</Text> {data.total_rooms} kamar{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Okupansi Rata-rata:</Text> {data.average_occupancy.toFixed(1)}%{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Okupansi Tertinggi:</Text> {highestOccupancy.toFixed(1)}%{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Okupansi Terendah:</Text> {lowestOccupancy.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Metrik Kinerja</Text>
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>Indikator</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>Nilai</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>Total Room Nights Terjual</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>{totalRoomNights} malam</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>Available Room Nights</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>{availableRoomNights} malam</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>Hari dengan Okupansi ≥ 80%</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>{daysAbove80} hari ({((daysAbove80 / totalDays) * 100).toFixed(1)}%)</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>Hari dengan Okupansi &lt; 50%</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>{daysBelow50} hari ({((daysBelow50 / totalDays) * 100).toFixed(1)}%)</Text>
          </View>
          <View style={pdfStyles.tableRow}>
            <Text style={[pdfStyles.tableCell, { width: '60%' }]}>Hari Fully Booked (100%)</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right' }]}>{daysFullyBooked} hari</Text>
          </View>
          <View style={[pdfStyles.tableRow, { backgroundColor: '#F3F4F6', fontWeight: 'bold' }]}>
            <Text style={[pdfStyles.tableCell, { width: '60%', fontWeight: 'bold' }]}>Okupansi Rata-rata</Text>
            <Text style={[pdfStyles.tableCell, { width: '40%', textAlign: 'right', fontWeight: 'bold' }]}>{data.average_occupancy.toFixed(1)}%</Text>
          </View>
        </View>
      </View>

      {/* Weekly Summary (if enough data) */}
      {totalDays >= 7 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Ringkasan Mingguan</Text>
          <View style={pdfStyles.table}>
            <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
              <Text style={[pdfStyles.tableCell, { width: '30%' }]}>Minggu</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center' }]}>Rata-rata Terisi</Text>
              <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right' }]}>Okupansi</Text>
              <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right' }]}>Status</Text>
            </View>
            {Array.from({ length: Math.ceil(totalDays / 7) }, (_, weekIndex) => {
              const weekStart = weekIndex * 7;
              const weekEnd = Math.min(weekStart + 7, totalDays);
              const weekData = data.daily_data.slice(weekStart, weekEnd);
              const weekOccupancy = weekData.reduce((sum, d) => sum + d.occupancy_rate, 0) / weekData.length;
              const avgOccupied = Math.round(weekData.reduce((sum, d) => sum + d.occupied_rooms, 0) / weekData.length);

              return (
                <View key={weekIndex} style={pdfStyles.tableRow}>
                  <Text style={[pdfStyles.tableCell, { width: '30%', fontSize: 8 }]}>
                    Minggu {weekIndex + 1} ({weekData.length} hari)
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontSize: 8 }]}>
                    {avgOccupied}/{data.total_rooms}
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right', fontSize: 8 }]}>
                    {weekOccupancy.toFixed(1)}%
                  </Text>
                  <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right', fontSize: 8 }]}>
                    {weekOccupancy >= 80 ? 'Tinggi' : weekOccupancy >= 60 ? 'Baik' : 'Rendah'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Daily Data Table */}
      <View style={pdfStyles.section} break>
        <Text style={pdfStyles.sectionTitle}>Rincian Harian</Text>
        <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
          Data okupansi per hari selama periode {getPeriodLabel(data.period)}
        </Text>
        <View style={pdfStyles.table}>
          <View style={[pdfStyles.tableRow, pdfStyles.tableHeader]}>
            <Text style={[pdfStyles.tableCell, { width: '35%' }]}>Tanggal</Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center' }]}>Terisi</Text>
            <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center' }]}>Total</Text>
            <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right' }]}>Okupansi</Text>
          </View>
          {data.daily_data.map((day, index) => (
            <View key={index} style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '35%', fontSize: 8 }]}>
                {new Date(day.date).toLocaleDateString('id-ID', {
                  weekday: 'short',
                  day: '2-digit',
                  month: 'short'
                })}
              </Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontSize: 8 }]}>
                {day.occupied_rooms}
              </Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontSize: 8 }]}>
                {day.total_rooms}
              </Text>
              <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right', fontSize: 8 }]}>
                {day.occupancy_rate.toFixed(1)}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Footer Notes */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Catatan</Text>
        <Text style={{ fontSize: 9, lineHeight: 1.5, color: '#6B7280' }}>
          1. Okupansi dihitung berdasarkan jumlah kamar terisi dibagi total kamar tersedia.{'\n'}
          2. Data mencakup periode {getPeriodLabel(data.period)} ({totalDays} hari).{'\n'}
          3. Okupansi rata-rata {data.average_occupancy.toFixed(1)}% {data.average_occupancy >= 70 ? 'menunjukkan performa baik.' : 'memerlukan peningkatan strategi marketing.'}{'\n'}
          4. Laporan ini dapat digunakan untuk analisis revenue management dan perencanaan kapasitas.
        </Text>
      </View>
    </PDFTemplate>
  );
};
