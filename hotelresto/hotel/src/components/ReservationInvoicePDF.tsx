import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica' },
  header: { flexDirection: 'row', marginBottom: 15, paddingBottom: 8, borderBottom: '1 solid #ccc' },
  hotelName: { fontSize: 20, fontWeight: 'bold', color: '#005357', marginBottom: 3 },
  title: { fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 15, color: '#005357' },
  section: { marginBottom: 10 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: '40%', fontSize: 9, color: '#555' },
  value: { width: '60%', fontSize: 9, fontWeight: 'bold', color: '#000' },
  table: { marginTop: 10, marginBottom: 10 },
  tableRow: { flexDirection: 'row', borderBottom: '1 solid #e5e7eb', padding: 8 },
  tableHeader: { backgroundColor: '#005357', color: 'white', fontWeight: 'bold' },
  col1: { width: '50%' },
  col2: { width: '25%', textAlign: 'right' },
  col3: { width: '25%', textAlign: 'right' },
  total: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10, paddingTop: 8, borderTop: '2 solid #005357' },
  totalLabel: { fontSize: 12, fontWeight: 'bold', marginRight: 20 },
  totalValue: { fontSize: 12, fontWeight: 'bold', color: '#005357' },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, textAlign: 'center', fontSize: 8, color: '#666' }
});

interface ReservationInvoicePDFProps {
  booking: {
    reservation_number: string;
    guest_name: string;
    guest_details: {
      email: string;
      phone: string;
    };
    check_in_date: string;
    check_out_date: string;
    nights: number;
    adults: number;
    total_amount: number;
    status: string;
    created_at: string;
    rooms?: any[];
  };
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

const ReservationInvoicePDF: React.FC<ReservationInvoicePDFProps> = ({ booking }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <View>
          <Text style={styles.hotelName}>Hotel Kapulaga</Text>
          <Text style={{ fontSize: 8, color: '#666' }}>Jl. Example No. 123, Jakarta</Text>
          <Text style={{ fontSize: 8, color: '#666' }}>Tel: +62 812 3456 7890</Text>
        </View>
      </View>

      <Text style={styles.title}>BOOKING CONFIRMATION</Text>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Booking Number:</Text>
          <Text style={styles.value}>{booking.reservation_number}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date Issued:</Text>
          <Text style={styles.value}>{formatDate(booking.created_at)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{booking.status}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>Guest Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Name:</Text>
          <Text style={styles.value}>{booking.guest_name}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{booking.guest_details.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Phone:</Text>
          <Text style={styles.value}>{booking.guest_details.phone}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 5 }}>Reservation Details</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Check-in:</Text>
          <Text style={styles.value}>{formatDate(booking.check_in_date)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Check-out:</Text>
          <Text style={styles.value}>{formatDate(booking.check_out_date)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Nights:</Text>
          <Text style={styles.value}>{booking.nights}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Guests:</Text>
          <Text style={styles.value}>{booking.adults} Adult(s)</Text>
        </View>
      </View>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={styles.col1}>Description</Text>
          <Text style={styles.col2}>Nights</Text>
          <Text style={styles.col3}>Amount</Text>
        </View>
        <View style={styles.tableRow}>
          <Text style={styles.col1}>Room Accommodation</Text>
          <Text style={styles.col2}>{booking.nights}</Text>
          <Text style={styles.col3}>{formatCurrency(booking.total_amount)}</Text>
        </View>
      </View>

      <View style={styles.total}>
        <Text style={styles.totalLabel}>TOTAL:</Text>
        <Text style={styles.totalValue}>{formatCurrency(booking.total_amount)}</Text>
      </View>

      <View style={{ marginTop: 20, padding: 10, backgroundColor: '#f9f9f9' }}>
        <Text style={{ fontSize: 8, marginBottom: 5, fontWeight: 'bold' }}>Important Information:</Text>
        <Text style={{ fontSize: 8, marginBottom: 2 }}>• Check-in time: 2:00 PM</Text>
        <Text style={{ fontSize: 8, marginBottom: 2 }}>• Check-out time: 12:00 PM</Text>
        <Text style={{ fontSize: 8, marginBottom: 2 }}>• Please bring a valid ID for check-in</Text>
        <Text style={{ fontSize: 8 }}>• For inquiries: info@kapulaga.net or +62 812 3456 7890</Text>
      </View>

      <Text style={styles.footer}>
        Thank you for choosing Hotel Kapulaga. We look forward to welcoming you!
      </Text>
    </Page>
  </Document>
);

export default ReservationInvoicePDF;
