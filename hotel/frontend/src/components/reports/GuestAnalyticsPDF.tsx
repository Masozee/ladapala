import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { PDFTemplate, pdfStyles } from './PDFTemplate';

interface NationalityBreakdown {
  nationality: string;
  count: number;
  percentage: number;
}

interface BookingByDay {
  [key: string]: number;
}

interface DailyData {
  date: string;
  new_guests: number;
  new_reservations: number;
  check_ins: number;
  check_outs: number;
}

interface GuestAnalyticsData {
  period?: string;
  total_guests: number;
  repeat_guests: number;
  repeat_rate: number;
  average_stay: number;
  nationality_breakdown: NationalityBreakdown[];
  booking_by_day: BookingByDay;
  daily_data?: DailyData[];
}

interface GuestAnalyticsPDFProps {
  data: GuestAnalyticsData;
}

export const GuestAnalyticsPDF: React.FC<GuestAnalyticsPDFProps> = ({ data }) => {
  // Limit daily data to first 15 days to prevent rendering issues
  const limitedDailyData = data.daily_data ? data.daily_data.slice(0, 15) : [];
  const totalDailyDataDays = data.daily_data ? data.daily_data.length : 0;

  const getPeriodLabel = (period?: string) => {
    if (!period) return 'Bulan Ini';

    // If period is in YYYY-MM format, convert to readable format
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
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

  // Day name translation
  const dayNames: Record<string, string> = {
    Monday: 'Senin',
    Tuesday: 'Selasa',
    Wednesday: 'Rabu',
    Thursday: 'Kamis',
    Friday: 'Jumat',
    Saturday: 'Sabtu',
    Sunday: 'Minggu',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <PDFTemplate title="Laporan Analisis Tamu" period={getPeriodLabel(data.period)}>
      {/* Summary Metrics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Ringkasan</Text>
        <View style={pdfStyles.metricsGrid}>
          <View style={pdfStyles.metricCard}>
            <Text style={pdfStyles.metricLabel}>Total Tamu</Text>
            <Text style={pdfStyles.metricValue}>{data.total_guests.toLocaleString('id-ID')}</Text>
          </View>
          <View style={pdfStyles.metricCard}>
            <Text style={pdfStyles.metricLabel}>Tamu Berulang</Text>
            <Text style={pdfStyles.metricValue}>{data.repeat_guests.toLocaleString('id-ID')}</Text>
          </View>
          <View style={pdfStyles.metricCard}>
            <Text style={pdfStyles.metricLabel}>Tingkat Kunjungan Berulang</Text>
            <Text style={pdfStyles.metricValue}>{data.repeat_rate}%</Text>
          </View>
          <View style={pdfStyles.metricCard}>
            <Text style={pdfStyles.metricLabel}>Rata-rata Lama Menginap</Text>
            <Text style={pdfStyles.metricValue}>{data.average_stay} Malam</Text>
          </View>
        </View>
      </View>

      {/* Nationality Breakdown */}
      {data.nationality_breakdown && data.nationality_breakdown.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Breakdown Kewarganegaraan (Top 10)</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '50%', fontWeight: 'bold' }]}>Negara</Text>
              <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right', fontWeight: 'bold' }]}>Jumlah Tamu</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '25%', textAlign: 'right', fontWeight: 'bold' }]}>Persentase</Text>
            </View>
            {data.nationality_breakdown.map((item, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '50%' }]}>{item.nationality}</Text>
                <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'right' }]}>
                  {item.count.toLocaleString('id-ID')}
                </Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '25%', textAlign: 'right' }]}>
                  {item.percentage}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Booking by Day of Week */}
      {data.booking_by_day && Object.keys(data.booking_by_day).length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Pola Booking per Hari</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '60%', fontWeight: 'bold' }]}>Hari</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '40%', textAlign: 'right', fontWeight: 'bold' }]}>Jumlah Booking</Text>
            </View>
            {Object.entries(data.booking_by_day)
              .sort((a, b) => b[1] - a[1])
              .map(([day, count], index) => (
                <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                  <Text style={[pdfStyles.tableCell, { width: '60%' }]}>
                    {dayNames[day] || day}
                  </Text>
                  <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '40%', textAlign: 'right' }]}>
                    {count.toLocaleString('id-ID')}
                  </Text>
                </View>
              ))}
          </View>
        </View>
      )}

      {/* Daily Data Table */}
      {limitedDailyData.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Data Harian Aktivitas Tamu</Text>
          <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
            Menampilkan 15 hari pertama dari {totalDailyDataDays} hari
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '25%', fontWeight: 'bold' }]}>Tanggal</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontWeight: 'bold' }]}>Tamu Baru</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontWeight: 'bold' }]}>Reservasi</Text>
              <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'center', fontWeight: 'bold' }]}>Check-in</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '18%', textAlign: 'center', fontWeight: 'bold' }]}>Check-out</Text>
            </View>
            {limitedDailyData.map((day, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '25%', fontSize: 8 }]}>{formatDate(day.date)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontSize: 8 }]}>{day.new_guests}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%', textAlign: 'center', fontSize: 8 }]}>{day.new_reservations}</Text>
                <Text style={[pdfStyles.tableCell, { width: '17%', textAlign: 'center', fontSize: 8 }]}>{day.check_ins}</Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '18%', textAlign: 'center', fontSize: 8 }]}>{day.check_outs}</Text>
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
            • Total tamu baru pada periode ini: {data.total_guests - data.repeat_guests} tamu
          </Text>
          <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>
            • Tingkat loyalitas tamu: {data.repeat_rate}% tamu melakukan kunjungan berulang
          </Text>
          <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>
            • Rata-rata durasi menginap: {data.average_stay} malam per reservasi
          </Text>
          {data.nationality_breakdown && data.nationality_breakdown.length > 0 && (
            <Text style={{ fontSize: 9, color: '#6B7280' }}>
              • Mayoritas tamu berasal dari: {data.nationality_breakdown[0].nationality} ({data.nationality_breakdown[0].percentage}%)
            </Text>
          )}
        </View>
      </View>
    </PDFTemplate>
  );
};
