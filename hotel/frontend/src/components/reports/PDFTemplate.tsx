import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Define colors matching office theme
const COLORS = {
  primary: '#4E61D3',
  secondary: '#3D4EA8',
  gray: '#6B7280',
  lightGray: '#F9FAFB',
  border: '#E5E7EB',
  white: '#FFFFFF',
};

// Create styles
export const pdfStyles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: COLORS.white,
    padding: 30,
  },
  header: {
    marginBottom: 20,
    borderBottom: `2 solid ${COLORS.primary}`,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 10,
    color: COLORS.gray,
    textAlign: 'center',
    marginTop: 5,
  },
  section: {
    marginTop: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    borderBottom: `1 solid ${COLORS.border}`,
    paddingBottom: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  metricCard: {
    width: '48%',
    backgroundColor: COLORS.lightGray,
    padding: 10,
    marginBottom: 8,
    marginRight: '2%',
    borderRadius: 4,
  },
  metricLabel: {
    fontSize: 9,
    color: COLORS.gray,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  table: {
    display: 'flex',
    width: 'auto',
    marginTop: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: `1 solid ${COLORS.border}`,
    minHeight: 25,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: COLORS.lightGray,
    color: COLORS.primary,
    fontWeight: 'bold',
    fontSize: 9,
    borderBottom: `2 solid ${COLORS.primary}`,
  },
  tableCell: {
    padding: 6,
    fontSize: 9,
    color: COLORS.gray,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 8,
    color: COLORS.gray,
    borderTop: `1 solid ${COLORS.border}`,
    paddingTop: 10,
  },
});

interface PDFTemplateProps {
  title: string;
  period?: string;
  children: React.ReactNode;
}

export const PDFTemplate: React.FC<PDFTemplateProps> = ({ title, period, children }) => {
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <Text style={pdfStyles.title}>{title}</Text>
          {period && (
            <Text style={pdfStyles.subtitle}>Periode: {period}</Text>
          )}
          <Text style={pdfStyles.subtitle}>Dibuat: {currentDate}</Text>
        </View>

        {children}

        <View style={pdfStyles.footer}>
          <Text>
            Laporan ini dibuat secara otomatis oleh Sistem Manajemen Hotel Ladapala
          </Text>
          <Text>{currentDate}</Text>
        </View>
      </Page>
    </Document>
  );
};
