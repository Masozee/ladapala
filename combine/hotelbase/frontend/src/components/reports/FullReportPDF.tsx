import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

interface ReportData {
  reportId: string;
  data: any;
}

interface FullReportData {
  period?: string;
  generated_at: string;
  reports: ReportData[];
}

interface FullReportPDFProps {
  data: FullReportData;
}

const COLORS = {
  primary: '#1e40af',  // Blue - only for cover page
  secondary: '#3b82f6',
  text: '#374151',  // Charcoal/dark gray for body text
  textDark: '#1f2937',  // Darker for headings
  textLight: '#6b7280',
  border: '#e5e7eb',
  bg: '#f9fafb',
  white: '#ffffff',
};

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: COLORS.text,
    lineHeight: 1.6,
  },
  coverPage: {
    padding: 0,
    backgroundColor: COLORS.primary,
  },
  coverContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 80,
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  coverSubtitle: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: 20,
  },
  h1: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 15,
    borderBottom: `2 solid ${COLORS.textDark}`,
    paddingBottom: 10,
  },
  h2: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 10,
  },
  h3: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginTop: 15,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 10,
    textAlign: 'justify',
    lineHeight: 1.6,
  },
  bulletPoint: {
    fontSize: 10,
    marginBottom: 6,
    marginLeft: 15,
    lineHeight: 1.5,
  },
  table: {
    marginTop: 10,
    marginBottom: 15,
    border: `1 solid ${COLORS.border}`,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `1 solid ${COLORS.border}`,
    paddingVertical: 8,
  },
  tableRowAlt: {
    backgroundColor: COLORS.bg,
  },
  tableHeader: {
    backgroundColor: COLORS.textDark,
    color: COLORS.white,
    fontWeight: 'bold',
    paddingVertical: 10,
  },
  tableCell: {
    flex: 1,
    fontSize: 9,
    paddingHorizontal: 5,
    borderRight: `1 solid ${COLORS.border}`,
  },
  tableCellLast: {
    borderRight: 'none',
  },
  summaryBox: {
    backgroundColor: COLORS.bg,
    padding: 15,
    marginVertical: 10,
    borderLeft: `4 solid ${COLORS.textDark}`,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  metricBox: {
    flex: 1,
    marginHorizontal: 5,
    padding: 12,
    backgroundColor: COLORS.bg,
    border: `1 solid ${COLORS.border}`,
  },
  metricLabel: {
    fontSize: 9,
    color: COLORS.textLight,
    marginBottom: 5,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    fontSize: 8,
    color: COLORS.textLight,
    textAlign: 'center',
    borderTop: `1 solid ${COLORS.border}`,
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 30,
    right: 50,
    fontSize: 8,
    color: COLORS.textLight,
  },
});

export const FullReportPDF: React.FC<FullReportPDFProps> = ({ data }) => {
  const getPeriodLabel = (period?: string) => {
    if (!period) return 'Bulan Ini';
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
      return `${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return period;
  };

  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR', minimumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => num.toLocaleString('id-ID');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  // Generate daily data structure from monthly data
  const generateDailyBreakdown = (reportId: string, reportData: any) => {
    // This would ideally come from backend, but we'll show what's available
    const insights: string[] = [];

    switch (reportId) {
      case 'occupancy':
        const occupancyRate = reportData.average_occupancy || 0;
        insights.push(`Tingkat okupansi rata-rata ${occupancyRate}% ${occupancyRate >= 70 ? 'melampaui target minimum 70%' : 'masih di bawah target 70%'}.`);
        insights.push(`Dari ${reportData.total_rooms || 0} kamar yang tersedia, terdapat data okupansi harian yang detail.`);
        if (reportData.daily_data && reportData.daily_data.length > 0) {
          const highestDay = reportData.daily_data.reduce((max: any, day: any) =>
            day.occupancy_rate > (max?.occupancy_rate || 0) ? day : max, reportData.daily_data[0]);
          insights.push(`Okupansi tertinggi mencapai ${highestDay.occupancy_rate}% pada tanggal ${formatDate(highestDay.date)}.`);
        }
        break;

      case 'revenue':
        const totalRevenue = reportData.total_revenue || 0;
        const dailyAvg = reportData.daily_average || 0;
        insights.push(`Total pendapatan periode ini mencapai ${formatCurrency(totalRevenue)}.`);
        insights.push(`Rata-rata pendapatan harian sebesar ${formatCurrency(dailyAvg)}.`);
        if (reportData.room_revenue) {
          const roomPercent = ((reportData.room_revenue / totalRevenue) * 100).toFixed(1);
          insights.push(`Pendapatan kamar berkontribusi ${roomPercent}% dari total pendapatan.`);
        }
        break;

      case 'guest-analytics':
        const totalGuests = reportData.total_guests || 0;
        const repeatRate = reportData.repeat_rate || 0;
        insights.push(`Total ${totalGuests} tamu menginap selama periode ini.`);
        insights.push(`Tingkat tamu berulang ${repeatRate}% menunjukkan ${repeatRate >= 30 ? 'loyalitas yang baik' : 'potensi peningkatan loyalitas'}.`);
        insights.push(`Rata-rata durasi menginap ${reportData.average_stay || 0} malam per reservasi.`);
        break;

      case 'maintenance':
        const totalRequests = reportData.total_requests || 0;
        const completed = reportData.completed || 0;
        const completionRate = totalRequests > 0 ? ((completed / totalRequests) * 100).toFixed(1) : 0;
        insights.push(`Total ${totalRequests} permintaan maintenance selama periode ini dengan tingkat penyelesaian ${completionRate}%.`);
        insights.push(`Waktu resolusi rata-rata ${reportData.average_resolution_time || 0} jam menunjukkan ${(reportData.average_resolution_time || 0) <= 24 ? 'response time yang baik' : 'perlu peningkatan efisiensi'}.`);
        if (reportData.by_category && reportData.by_category.length > 0) {
          const topCategory = reportData.by_category[0];
          insights.push(`Kategori ${topCategory.category} memiliki volume tertinggi dengan ${topCategory.count} permintaan.`);
        }
        insights.push(`Total biaya maintenance mencapai ${formatCurrency(reportData.total_cost || 0)} untuk periode ini.`);
        break;

      case 'satisfaction':
        const totalComplaints = reportData.total_complaints || 0;
        const resolutionRate = reportData.resolution_rate || 0;
        const satisfactionScore = reportData.satisfaction_score || 0;
        insights.push(`Total ${totalComplaints} keluhan diterima dengan tingkat resolusi ${resolutionRate}%.`);
        insights.push(`Skor kepuasan pelanggan mencapai ${satisfactionScore}/5.0 yang ${satisfactionScore >= 4.0 ? 'menunjukkan kepuasan yang baik' : 'perlu peningkatan kualitas layanan'}.`);
        if (reportData.total_reservations) {
          const complaintRatio = ((totalComplaints / reportData.total_reservations) * 100).toFixed(1);
          insights.push(`Rasio keluhan terhadap total reservasi sebesar ${complaintRatio}%.`);
        }
        break;

      case 'inventory':
        const totalItems = reportData.total_items || 0;
        const lowStock = reportData.low_stock_items || 0;
        const outOfStock = reportData.out_of_stock || 0;
        insights.push(`Total ${totalItems} item inventory dengan nilai ${formatCurrency(reportData.total_value || 0)}.`);
        insights.push(`Terdapat ${lowStock} item low stock dan ${outOfStock} item out of stock yang memerlukan restock segera.`);
        if (reportData.critical_items && reportData.critical_items.length > 0) {
          insights.push(`${reportData.critical_items.length} item kritis memerlukan perhatian immediate untuk operasional hotel.`);
        }
        break;

      case 'tax':
        const taxableRevenue = reportData.revenue_breakdown?.total?.subtotal || 0;
        const taxCollected = reportData.revenue_breakdown?.total?.tax_collected || 0;
        const taxPercentage = reportData.statistics?.tax_percentage_of_revenue || 0;
        insights.push(`Total pendapatan kena pajak ${formatCurrency(taxableRevenue)} dengan pajak terkumpul ${formatCurrency(taxCollected)} (${taxPercentage}%).`);
        insights.push(`Kewajiban pajak total kepada pemerintah sebesar ${formatCurrency(reportData.tax_obligations?.total_payable || 0)}.`);
        if (reportData.revenue_breakdown) {
          const roomPct = ((reportData.revenue_breakdown.room_revenue.subtotal / taxableRevenue) * 100).toFixed(1);
          insights.push(`Pendapatan kamar berkontribusi ${roomPct}% dari total pendapatan kena pajak.`);
        }
        break;
    }

    return insights;
  };

  const renderReportContent = (reportId: string, reportData: any) => {
    const insights = generateDailyBreakdown(reportId, reportData);

    switch (reportId) {
      case 'occupancy':
        return (
          <>
            <Text style={styles.h2}>Ringkasan Eksekutif</Text>
            {insights.map((insight, idx) => (
              <Text key={idx} style={styles.paragraph}>{insight}</Text>
            ))}

            <Text style={styles.h2}>Metrik Kunci</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Okupansi Rata-rata</Text>
                <Text style={styles.metricValue}>{reportData.average_occupancy || 0}%</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Total Kamar</Text>
                <Text style={styles.metricValue}>{reportData.total_rooms || 0}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Hari Periode</Text>
                <Text style={styles.metricValue}>{reportData.daily_data?.length || 0}</Text>
              </View>
            </View>

            {reportData.daily_data && reportData.daily_data.length > 0 && (
              <>
                <Text style={styles.h2}>Data Harian Okupansi</Text>
                <Text style={styles.paragraph}>
                  Berikut adalah data okupansi harian selama periode laporan yang menunjukkan tren dan pola penggunaan kamar:
                </Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Tanggal</Text>
                    <Text style={styles.tableCell}>Terisi</Text>
                    <Text style={styles.tableCell}>Total</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>Rate (%)</Text>
                  </View>
                  {reportData.daily_data.map((item: any, idx: number) => (
                    <View key={idx} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(item.date)}</Text>
                      <Text style={styles.tableCell}>{item.occupied_rooms}</Text>
                      <Text style={styles.tableCell}>{item.total_rooms}</Text>
                      <Text style={[styles.tableCell, styles.tableCellLast, { fontWeight: 'bold' }]}>{item.occupancy_rate}%</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        );

      case 'revenue':
        return (
          <>
            <Text style={styles.h2}>Ringkasan Eksekutif</Text>
            {insights.map((insight, idx) => (
              <Text key={idx} style={styles.paragraph}>{insight}</Text>
            ))}

            <Text style={styles.h2}>Metrik Kunci</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Total Pendapatan</Text>
                <Text style={[styles.metricValue, { fontSize: 14 }]}>
                  {formatCurrency(reportData.total_revenue || 0)}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Pendapatan Kamar</Text>
                <Text style={[styles.metricValue, { fontSize: 14 }]}>
                  {formatCurrency(reportData.room_revenue || 0)}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Rata-rata Harian</Text>
                <Text style={[styles.metricValue, { fontSize: 14 }]}>
                  {formatCurrency(reportData.daily_average || 0)}
                </Text>
              </View>
            </View>

            {reportData.revenue_breakdown && (
              <>
                <Text style={styles.h2}>Breakdown Sumber Pendapatan</Text>
                <Text style={styles.paragraph}>
                  Distribusi pendapatan dari berbagai sumber memberikan insight tentang revenue stream yang paling berkontribusi:
                </Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Kategori</Text>
                    <Text style={styles.tableCell}>Jumlah</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>Persentase</Text>
                  </View>
                  {Object.entries(reportData.revenue_breakdown).map(([key, value]: [string, any], idx) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{key}</Text>
                      <Text style={styles.tableCell}>{formatCurrency(value)}</Text>
                      <Text style={[styles.tableCell, styles.tableCellLast, { fontWeight: 'bold' }]}>
                        {((value / (reportData.total_revenue || 1)) * 100).toFixed(1)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {reportData.daily_revenue && reportData.daily_revenue.length > 0 && (
              <>
                <Text style={styles.h2}>Data Harian Pendapatan</Text>
                <Text style={styles.paragraph}>
                  Berikut adalah breakdown pendapatan harian yang memberikan gambaran detail pola revenue per hari:
                </Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Tanggal</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast, { flex: 2 }]}>Pendapatan</Text>
                  </View>
                  {reportData.daily_revenue.map((item: any, idx: number) => (
                    <View key={idx} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(item.date)}</Text>
                      <Text style={[styles.tableCell, styles.tableCellLast, { flex: 2, fontWeight: 'bold' }]}>
                        {formatCurrency(item.revenue)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.h2}>Analisis & Tren</Text>
            <Text style={styles.paragraph}>
              Pendapatan menunjukkan tren yang {reportData.daily_average > 0 ? 'positif' : 'memerlukan perhatian'}.
              Fokus utama revenue berasal dari kamar hotel, yang merupakan core business.
              Diversifikasi revenue stream melalui layanan tambahan dapat meningkatkan total pendapatan.
            </Text>

          </>
        );

      case 'guest-analytics':
        return (
          <>
            <Text style={styles.h2}>Ringkasan Eksekutif</Text>
            {insights.map((insight, idx) => (
              <Text key={idx} style={styles.paragraph}>{insight}</Text>
            ))}

            <Text style={styles.h2}>Metrik Kunci</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Total Tamu</Text>
                <Text style={styles.metricValue}>{reportData.total_guests || 0}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Tamu Berulang</Text>
                <Text style={styles.metricValue}>{reportData.repeat_guests || 0}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Loyalitas</Text>
                <Text style={styles.metricValue}>{reportData.repeat_rate || 0}%</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Rata-rata Menginap</Text>
                <Text style={styles.metricValue}>{reportData.average_stay || 0} malam</Text>
              </View>
            </View>

            {reportData.nationality_breakdown && reportData.nationality_breakdown.length > 0 && (
              <>
                <Text style={styles.h2}>Demografi Tamu - Asal Negara</Text>
                <Text style={styles.paragraph}>
                  Mayoritas tamu berasal dari {reportData.nationality_breakdown[0].nationality} ({reportData.nationality_breakdown[0].percentage}%).
                  Distribusi geografis tamu membantu strategi marketing targeted dan penyesuaian layanan.
                </Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Negara</Text>
                    <Text style={styles.tableCell}>Jumlah</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>Persentase</Text>
                  </View>
                  {reportData.nationality_breakdown.slice(0, 10).map((item: any, idx: number) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{item.nationality}</Text>
                      <Text style={styles.tableCell}>{item.count}</Text>
                      <Text style={[styles.tableCell, styles.tableCellLast, { fontWeight: 'bold' }]}>{item.percentage}%</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {reportData.booking_by_day && Object.keys(reportData.booking_by_day).length > 0 && (
              <>
                <Text style={styles.h2}>Pola Booking Mingguan</Text>
                <Text style={styles.paragraph}>
                  Analisis pola booking per hari membantu optimasi staffing dan inventory management:
                </Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Hari</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>Jumlah Booking</Text>
                  </View>
                  {Object.entries(reportData.booking_by_day)
                    .sort((a, b) => (b[1] as number) - (a[1] as number))
                    .map(([day, count]: [string, any], idx) => {
                      const dayNames: Record<string, string> = {
                        Monday: 'Senin', Tuesday: 'Selasa', Wednesday: 'Rabu',
                        Thursday: 'Kamis', Friday: 'Jumat', Saturday: 'Sabtu', Sunday: 'Minggu'
                      };
                      return (
                        <View key={idx} style={styles.tableRow}>
                          <Text style={[styles.tableCell, { flex: 2 }]}>{dayNames[day] || day}</Text>
                          <Text style={[styles.tableCell, styles.tableCellLast, { fontWeight: 'bold' }]}>{count}</Text>
                        </View>
                      );
                    })}
                </View>
              </>
            )}

            {reportData.daily_data && reportData.daily_data.length > 0 && (
              <>
                <Text style={styles.h2}>Data Harian Aktivitas Tamu</Text>
                <Text style={styles.paragraph}>
                  Berikut adalah data harian yang menunjukkan aktivitas tamu, termasuk registrasi tamu baru, reservasi, check-in, dan check-out:
                </Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Tanggal</Text>
                    <Text style={styles.tableCell}>Tamu Baru</Text>
                    <Text style={styles.tableCell}>Reservasi</Text>
                    <Text style={styles.tableCell}>Check-in</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>Check-out</Text>
                  </View>
                  {reportData.daily_data.map((item: any, idx: number) => (
                    <View key={idx} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(item.date)}</Text>
                      <Text style={styles.tableCell}>{item.new_guests}</Text>
                      <Text style={styles.tableCell}>{item.new_reservations}</Text>
                      <Text style={styles.tableCell}>{item.check_ins}</Text>
                      <Text style={[styles.tableCell, styles.tableCellLast]}>{item.check_outs}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        );

      case 'maintenance':
        return (
          <>
            <Text style={styles.h2}>Ringkasan Eksekutif</Text>
            {insights.map((insight, idx) => (
              <Text key={idx} style={styles.paragraph}>{insight}</Text>
            ))}

            <Text style={styles.h2}>Metrik Kunci</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Total Request</Text>
                <Text style={styles.metricValue}>{reportData.total_requests || 0}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Selesai</Text>
                <Text style={styles.metricValue}>{reportData.completed || 0}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Dalam Proses</Text>
                <Text style={styles.metricValue}>{reportData.in_progress || 0}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Pending</Text>
                <Text style={styles.metricValue}>{reportData.pending || 0}</Text>
              </View>
            </View>

            {reportData.by_category && reportData.by_category.length > 0 && (
              <>
                <Text style={styles.h2}>Breakdown per Kategori</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Kategori</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>Jumlah</Text>
                  </View>
                  {reportData.by_category.map((item: any, idx: number) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{item.category}</Text>
                      <Text style={[styles.tableCell, styles.tableCellLast, { fontWeight: 'bold' }]}>{item.count}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {reportData.daily_data && reportData.daily_data.length > 0 && (
              <>
                <Text style={styles.h2}>Data Harian Maintenance</Text>
                <Text style={styles.paragraph}>
                  Berikut adalah data harian maintenance yang menunjukkan volume pekerjaan, penyelesaian, dan biaya per hari:
                </Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Tanggal</Text>
                    <Text style={styles.tableCell}>Total</Text>
                    <Text style={styles.tableCell}>Selesai</Text>
                    <Text style={styles.tableCell}>Proses</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast, { flex: 1.5 }]}>Biaya</Text>
                  </View>
                  {reportData.daily_data.map((item: any, idx: number) => (
                    <View key={idx} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(item.date)}</Text>
                      <Text style={styles.tableCell}>{item.total_requests}</Text>
                      <Text style={styles.tableCell}>{item.completed}</Text>
                      <Text style={styles.tableCell}>{item.in_progress}</Text>
                      <Text style={[styles.tableCell, styles.tableCellLast, { flex: 1.5 }]}>{formatCurrency(item.cost)}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        );

      case 'satisfaction':
        return (
          <>
            <Text style={styles.h2}>Ringkasan Eksekutif</Text>
            {insights.map((insight, idx) => (
              <Text key={idx} style={styles.paragraph}>{insight}</Text>
            ))}

            <Text style={styles.h2}>Metrik Kunci</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Total Keluhan</Text>
                <Text style={styles.metricValue}>{reportData.total_complaints || 0}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Terselesaikan</Text>
                <Text style={styles.metricValue}>{reportData.resolved_complaints || 0}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Tingkat Resolusi</Text>
                <Text style={styles.metricValue}>{reportData.resolution_rate || 0}%</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Skor Kepuasan</Text>
                <Text style={styles.metricValue}>{reportData.satisfaction_score || 0}/5.0</Text>
              </View>
            </View>

            {reportData.complaints_by_category && reportData.complaints_by_category.length > 0 && (
              <>
                <Text style={styles.h2}>Keluhan per Kategori</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Kategori</Text>
                    <Text style={styles.tableCell}>Jumlah</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>Persentase</Text>
                  </View>
                  {reportData.complaints_by_category.map((item: any, idx: number) => (
                    <View key={idx} style={styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{item.category}</Text>
                      <Text style={styles.tableCell}>{item.count}</Text>
                      <Text style={[styles.tableCell, styles.tableCellLast, { fontWeight: 'bold' }]}>{item.percentage}%</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {reportData.daily_data && reportData.daily_data.length > 0 && (
              <>
                <Text style={styles.h2}>Data Harian Keluhan</Text>
                <Text style={styles.paragraph}>
                  Tracking harian keluhan dan resolusi untuk monitoring kualitas layanan:
                </Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Tanggal</Text>
                    <Text style={styles.tableCell}>Total</Text>
                    <Text style={styles.tableCell}>Selesai</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>Pending</Text>
                  </View>
                  {reportData.daily_data.map((item: any, idx: number) => (
                    <View key={idx} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2 }]}>{formatDate(item.date)}</Text>
                      <Text style={styles.tableCell}>{item.total_complaints}</Text>
                      <Text style={styles.tableCell}>{item.resolved}</Text>
                      <Text style={[styles.tableCell, styles.tableCellLast]}>{item.pending}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        );

      case 'inventory':
        return (
          <>
            <Text style={styles.h2}>Ringkasan Eksekutif</Text>
            {insights.map((insight, idx) => (
              <Text key={idx} style={styles.paragraph}>{insight}</Text>
            ))}

            <Text style={styles.h2}>Metrik Kunci</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Total Item</Text>
                <Text style={styles.metricValue}>{reportData.total_items || 0}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Low Stock</Text>
                <Text style={styles.metricValue}>{reportData.low_stock_items || 0}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Out of Stock</Text>
                <Text style={styles.metricValue}>{reportData.out_of_stock || 0}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Total Nilai</Text>
                <Text style={[styles.metricValue, { fontSize: 12 }]}>
                  {formatCurrency(reportData.total_value || 0)}
                </Text>
              </View>
            </View>

            {reportData.critical_items && reportData.critical_items.length > 0 && (
              <>
                <Text style={styles.h2}>Item Kritis (Low Stock & Out of Stock)</Text>
                <Text style={styles.paragraph}>
                  Item berikut memerlukan restock segera untuk kelancaran operasional:
                </Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Item</Text>
                    <Text style={styles.tableCell}>Stock</Text>
                    <Text style={styles.tableCell}>Min</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>Status</Text>
                  </View>
                  {reportData.critical_items.slice(0, 30).map((item: any, idx: number) => (
                    <View key={idx} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 2, fontSize: 8 }]}>{item.name}</Text>
                      <Text style={styles.tableCell}>{item.current_stock}</Text>
                      <Text style={styles.tableCell}>{item.minimum_stock}</Text>
                      <Text style={[styles.tableCell, styles.tableCellLast, { fontSize: 8 }]}>
                        {item.status === 'OUT_OF_STOCK' ? 'Habis' : 'Rendah'}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        );

      case 'tax':
        return (
          <>
            <Text style={styles.h2}>Ringkasan Eksekutif</Text>
            {insights.map((insight, idx) => (
              <Text key={idx} style={styles.paragraph}>{insight}</Text>
            ))}

            <Text style={styles.h2}>Metrik Kunci</Text>
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Total Pendapatan</Text>
                <Text style={[styles.metricValue, { fontSize: 12 }]}>
                  {formatCurrency(reportData.revenue_breakdown?.total?.subtotal || 0)}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Pajak Terkumpul</Text>
                <Text style={[styles.metricValue, { fontSize: 12 }]}>
                  {formatCurrency(reportData.revenue_breakdown?.total?.tax_collected || 0)}
                </Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Kewajiban Pajak</Text>
                <Text style={[styles.metricValue, { fontSize: 12 }]}>
                  {formatCurrency(reportData.tax_obligations?.total_payable || 0)}
                </Text>
              </View>
            </View>

            {reportData.tax_rates && (
              <>
                <Text style={styles.h2}>Tarif Pajak</Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Jenis Pajak</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>Tarif</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>PPN (Pajak Pertambahan Nilai)</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>{reportData.tax_rates.ppn}%</Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowAlt]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Pajak Hotel (Provinsi)</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>{reportData.tax_rates.hotel_tax}%</Text>
                  </View>
                  <View style={styles.tableRow}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>Service Charge</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>{reportData.tax_rates.service_charge}%</Text>
                  </View>
                  <View style={[styles.tableRow, styles.tableRowAlt]}>
                    <Text style={[styles.tableCell, { flex: 2 }]}>PPh Final</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast]}>{reportData.tax_rates.pph_final}%</Text>
                  </View>
                </View>
              </>
            )}

            {reportData.daily_breakdown && reportData.daily_breakdown.length > 0 && (
              <>
                <Text style={styles.h2}>Data Harian Pendapatan & Pajak</Text>
                <Text style={styles.paragraph}>
                  Breakdown harian pendapatan dan pajak terkumpul untuk pelaporan:
                </Text>
                <View style={styles.table}>
                  <View style={[styles.tableRow, styles.tableHeader]}>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>Tanggal</Text>
                    <Text style={[styles.tableCell, { flex: 1.5 }]}>Pendapatan</Text>
                    <Text style={[styles.tableCell, styles.tableCellLast, { flex: 1.5 }]}>Pajak</Text>
                  </View>
                  {reportData.daily_breakdown.map((item: any, idx: number) => (
                    <View key={idx} style={idx % 2 === 1 ? [styles.tableRow, styles.tableRowAlt] : styles.tableRow}>
                      <Text style={[styles.tableCell, { flex: 1.5 }]}>{formatDate(item.date)}</Text>
                      <Text style={[styles.tableCell, { flex: 1.5, fontSize: 8 }]}>
                        {formatCurrency(item.total_revenue)}
                      </Text>
                      <Text style={[styles.tableCell, styles.tableCellLast, { flex: 1.5, fontSize: 8 }]}>
                        {formatCurrency(item.tax_collected)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        );

      default:
        return (
          <Text style={styles.paragraph}>
            Data detail untuk laporan ini tersedia. Silakan akses laporan individual untuk informasi lengkap.
          </Text>
        );
    }
  };

  const reportTitles: Record<string, string> = {
    'occupancy': 'Laporan Okupansi Kamar',
    'revenue': 'Laporan Pendapatan & Keuangan',
    'guest-analytics': 'Analisis Data Tamu',
    'satisfaction': 'Survei Kepuasan Pelanggan',
    'maintenance': 'Laporan Pemeliharaan',
    'inventory': 'Laporan Inventaris',
    'tax': 'Laporan Pajak',
  };

  return (
    <Document>
      {/* Cover Page */}
      <Page size="A4" style={styles.coverPage}>
        <View style={styles.coverContent}>
          <Text style={styles.coverTitle}>LAPORAN MANAJEMEN</Text>
          <Text style={styles.coverTitle}>HOTEL LADAPALA</Text>
          <Text style={styles.coverSubtitle}>Periode: {getPeriodLabel(data.period)}</Text>
          <Text style={styles.coverSubtitle}>{currentDate}</Text>
        </View>
      </Page>

      {/* Executive Summary */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Ringkasan Eksekutif</Text>

        <Text style={styles.paragraph}>
          Laporan ini menyajikan analisis komprehensif performa Hotel Ladapala untuk periode {getPeriodLabel(data.period)}.
          Dokumen ini mencakup {data.reports.length} area analisis utama yang memberikan insight mendalam tentang operasional,
          keuangan, dan customer experience hotel.
        </Text>

        <Text style={styles.h3}>Cakupan Laporan:</Text>
        {data.reports.map((report, idx) => (
          <Text key={idx} style={styles.bulletPoint}>
            • {reportTitles[report.reportId] || report.reportId}
          </Text>
        ))}

        <View style={styles.summaryBox}>
          <Text style={[styles.paragraph, { marginBottom: 5, fontWeight: 'bold' }]}>
            Tujuan Laporan
          </Text>
          <Text style={styles.paragraph}>
            Memberikan data-driven insights untuk mendukung pengambilan keputusan strategis management,
            mengidentifikasi area perbaikan, dan merekomendasikan action items untuk meningkatkan performa hotel.
          </Text>
        </View>

        <Text style={styles.pageNumber}>Halaman 1</Text>
      </Page>

      {/* Individual Report Pages */}
      {data.reports.map((report, index) => (
        <Page key={index} size="A4" style={styles.page}>
          <Text style={styles.h1}>{reportTitles[report.reportId] || report.reportId}</Text>

          {renderReportContent(report.reportId, report.data)}

          <Text style={styles.footer}>
            Hotel Ladapala - {getPeriodLabel(data.period)} - {currentDate}
          </Text>
          <Text style={styles.pageNumber}>Halaman {index + 2}</Text>
        </Page>
      ))}

    </Document>
  );
};
