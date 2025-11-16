import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 15,
    paddingBottom: 8,
    alignItems: 'center',
    borderBottom: '1 solid #ccc',
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  hotelName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#005357',
    marginBottom: 3,
  },
  hotelInfo: {
    fontSize: 8,
    color: '#666',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 15,
    textTransform: 'uppercase',
    color: '#005357',
  },
  twoColumnSection: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 20,
  },
  column: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
    borderBottom: '1 solid #ccc',
    paddingBottom: 2,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: '45%',
    fontSize: 9,
    color: '#555',
  },
  value: {
    width: '55%',
    fontSize: 9,
    fontWeight: 'bold',
    color: '#000',
  },
  table: {
    marginTop: 5,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#005357',
    color: 'white',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e7eb',
    padding: 8,
    fontSize: 9,
  },
  tableCol1: {
    width: '50%',
  },
  tableCol2: {
    width: '25%',
    textAlign: 'right',
  },
  tableCol3: {
    width: '25%',
    textAlign: 'right',
  },
  totalsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1 solid #005357',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  totalLabel: {
    width: 150,
    textAlign: 'right',
    marginRight: 20,
    fontSize: 9,
    color: '#555',
  },
  totalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 9,
    fontWeight: 'bold',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '2 solid #005357',
  },
  grandTotalLabel: {
    width: 150,
    textAlign: 'right',
    marginRight: 20,
    fontSize: 11,
    fontWeight: 'bold',
  },
  grandTotalValue: {
    width: 100,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: 'bold',
    color: '#005357',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    borderTop: '1 solid #e5e7eb',
    paddingTop: 10,
  },
  notes: {
    marginTop: 10,
    padding: 8,
    borderTop: '1 solid #ccc',
    paddingTop: 8,
    fontSize: 9,
    color: '#555',
  },
});

interface Payment {
  id: number;
  payment_number: string;
  payment_type: string;
  payment_method: string;
  amount: string;
  payment_date: string;
  status: string;
}

interface EventInvoicePDFProps {
  booking: {
    booking_number: string;
    event_name: string;
    event_type: string;
    guest_name: string;
    guest_email: string;
    guest_phone: string;
    venue_name: string;
    venue_type: string;
    package_name: string;
    food_package_name: string;
    event_date: string;
    event_start_time: string;
    event_end_time: string;
    expected_pax: number;
    confirmed_pax: number;
    venue_price: string;
    food_price: string;
    equipment_price: string;
    other_charges: string;
    subtotal: string;
    tax_amount: string;
    grand_total: string;
    down_payment_amount: string;
    remaining_amount: string;
    down_payment_paid: boolean;
    full_payment_paid: boolean;
    payments?: Payment[];
    setup_notes?: string;
    special_requests?: string;
  };
}

const formatCurrency = (value: string | number) => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num);
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const EventInvoicePDF: React.FC<EventInvoicePDFProps> = ({ booking }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header with Logo */}
      <View style={styles.header}>
        <Image
          src="/logo.png"
          style={styles.logo}
        />
        <View style={styles.headerText}>
          <Text style={styles.hotelName}>Hotel Kapulaga</Text>
          <Text style={styles.hotelInfo}>Jl. Contoh No. 123, Jakarta 12345</Text>
          <Text style={styles.hotelInfo}>Telp: (021) 1234-5678 | Email: info@hotelkapulaga.com</Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title}>Bukti Pembayaran</Text>

      {/* Two Column Layout: Booking Info & Guest Info */}
      <View style={styles.twoColumnSection}>
        {/* Left Column: Informasi Booking */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>Informasi Booking</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nomor Invoice:</Text>
            <Text style={styles.value}>{booking.booking_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal Cetak:</Text>
            <Text style={styles.value}>{formatDate(new Date().toISOString())}</Text>
          </View>
        </View>

        {/* Right Column: Informasi Pemesan */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>Informasi Pemesan</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nama:</Text>
            <Text style={styles.value}>{booking.guest_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{booking.guest_email}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Telepon:</Text>
            <Text style={styles.value}>{booking.guest_phone}</Text>
          </View>
        </View>
      </View>

      {/* Two Column Layout: Event Details */}
      <View style={styles.twoColumnSection}>
        {/* Left Column */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>Detail Event</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nama Event:</Text>
            <Text style={styles.value}>{booking.event_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Jenis Event:</Text>
            <Text style={styles.value}>{booking.event_type}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Tanggal Event:</Text>
            <Text style={styles.value}>{formatDate(booking.event_date)}</Text>
          </View>
        </View>

        {/* Right Column */}
        <View style={styles.column}>
          <Text style={styles.sectionTitle}>&nbsp;</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Waktu:</Text>
            <Text style={styles.value}>{booking.event_start_time} - {booking.event_end_time}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Venue:</Text>
            <Text style={styles.value}>{booking.venue_name} ({booking.venue_type})</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Jumlah Tamu:</Text>
            <Text style={styles.value}>{booking.confirmed_pax || booking.expected_pax} orang</Text>
          </View>
        </View>
      </View>

      {/* Price Breakdown Table */}
      <View style={styles.table}>
        <Text style={styles.sectionTitle}>Rincian Biaya</Text>

        <View style={styles.tableHeader}>
          <Text style={styles.tableCol1}>Keterangan</Text>
          <Text style={styles.tableCol2}>Qty</Text>
          <Text style={styles.tableCol3}>Jumlah</Text>
        </View>

        <View style={styles.tableRow}>
          <Text style={styles.tableCol1}>Sewa Venue ({booking.venue_type})</Text>
          <Text style={styles.tableCol2}>1</Text>
          <Text style={styles.tableCol3}>{formatCurrency(booking.venue_price)}</Text>
        </View>

        {booking.package_name && (
          <View style={styles.tableRow}>
            <Text style={styles.tableCol1}>Paket Venue - {booking.package_name}</Text>
            <Text style={styles.tableCol2}>1</Text>
            <Text style={styles.tableCol3}>Termasuk</Text>
          </View>
        )}

        {parseFloat(booking.food_price) > 0 && (
          <View style={styles.tableRow}>
            <Text style={styles.tableCol1}>
              {booking.food_package_name ? `Paket Makanan - ${booking.food_package_name}` : 'Paket Makanan'}
            </Text>
            <Text style={styles.tableCol2}>{booking.confirmed_pax || booking.expected_pax} pax</Text>
            <Text style={styles.tableCol3}>{formatCurrency(booking.food_price)}</Text>
          </View>
        )}

        {parseFloat(booking.equipment_price) > 0 && (
          <View style={styles.tableRow}>
            <Text style={styles.tableCol1}>Perlengkapan & Equipment</Text>
            <Text style={styles.tableCol2}>-</Text>
            <Text style={styles.tableCol3}>{formatCurrency(booking.equipment_price)}</Text>
          </View>
        )}

        {parseFloat(booking.other_charges) > 0 && (
          <View style={styles.tableRow}>
            <Text style={styles.tableCol1}>Biaya Lainnya</Text>
            <Text style={styles.tableCol2}>-</Text>
            <Text style={styles.tableCol3}>{formatCurrency(booking.other_charges)}</Text>
          </View>
        )}

        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal:</Text>
            <Text style={styles.totalValue}>{formatCurrency(booking.subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Pajak (11%):</Text>
            <Text style={styles.totalValue}>{formatCurrency(booking.tax_amount)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>TOTAL:</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(booking.grand_total)}</Text>
          </View>
        </View>
      </View>

      {/* Payment Status */}
      <View style={styles.table}>
        <Text style={styles.sectionTitle}>Riwayat Pembayaran</Text>

        {booking.payments && booking.payments.length > 0 ? (
          <>
            <View style={styles.tableHeader}>
              <Text style={styles.tableCol1}>Tanggal</Text>
              <Text style={styles.tableCol2}>Jenis</Text>
              <Text style={styles.tableCol3}>Jumlah</Text>
            </View>

            {booking.payments.map((payment) => (
              <View key={payment.id} style={styles.tableRow}>
                <Text style={styles.tableCol1}>
                  {formatDate(payment.payment_date)}
                </Text>
                <Text style={styles.tableCol2}>
                  {payment.payment_type === 'DOWN_PAYMENT' ? 'DP' :
                   payment.payment_type === 'FULL_PAYMENT' ? 'Pelunasan' :
                   payment.payment_type}
                </Text>
                <Text style={styles.tableCol3}>
                  {formatCurrency(payment.amount)} ✓
                </Text>
              </View>
            ))}

            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total Dibayar:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(
                    booking.payments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
                  )}
                </Text>
              </View>
              {!booking.full_payment_paid && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Sisa Pembayaran:</Text>
                  <Text style={styles.totalValue}>{formatCurrency(booking.remaining_amount)}</Text>
                </View>
              )}
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Status:</Text>
                <Text style={styles.grandTotalValue}>
                  {booking.full_payment_paid ? 'LUNAS ✓' : 'BELUM LUNAS'}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <Text style={styles.label}>DP (Down Payment):</Text>
              <Text style={styles.value}>
                {formatCurrency(booking.down_payment_amount)}
                {booking.down_payment_paid ? ' ✓' : ' ✗'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Sisa Pembayaran:</Text>
              <Text style={styles.value}>{formatCurrency(booking.remaining_amount)}</Text>
            </View>
          </>
        )}
      </View>

      {/* Notes */}
      {(booking.setup_notes || booking.special_requests) && (
        <View style={styles.notes}>
          {booking.setup_notes && (
            <>
              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Catatan Setup:</Text>
              <Text style={{ marginBottom: 10 }}>{booking.setup_notes}</Text>
            </>
          )}
          {booking.special_requests && (
            <>
              <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Permintaan Khusus:</Text>
              <Text>{booking.special_requests}</Text>
            </>
          )}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Terima kasih atas kepercayaan Anda menggunakan layanan Hotel Kapulaga</Text>
        <Text>Bukti pembayaran ini dicetak otomatis oleh sistem dan sah tanpa tanda tangan</Text>
      </View>
    </Page>
  </Document>
);

export default EventInvoicePDF;
