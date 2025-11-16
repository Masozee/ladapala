import React from 'react';
import { Text, View } from '@react-pdf/renderer';
import { PDFTemplate, pdfStyles } from './PDFTemplate';

interface CategoryBreakdown {
  category: string;
  count: number;
  total_quantity: number;
}

interface CriticalItem {
  name: string;
  category: string;
  current_stock: number;
  minimum_stock: number;
  unit: string;
  unit_price: number;
  status: string;
}

interface TopValueItem {
  name: string;
  category: string;
  current_stock: number;
  unit_price: number;
  total_value: number;
}

interface InventoryData {
  total_items: number;
  low_stock_items: number;
  out_of_stock: number;
  total_value: number;
  stock_availability_rate: number;
  avg_item_value: number;
  items_by_category: CategoryBreakdown[];
  critical_items: CriticalItem[];
  top_value_items: TopValueItem[];
}

interface InventoryReportPDFProps {
  data: InventoryData;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const InventoryReportPDF: React.FC<InventoryReportPDFProps> = ({ data }) => {
  // Limit critical items to first 15 to prevent rendering issues
  const limitedCriticalItems = data.critical_items ? data.critical_items.slice(0, 15) : [];
  const totalCriticalItems = data.critical_items ? data.critical_items.length : 0;

  // Show all top value items
  const topValueItems = data.top_value_items || [];

  return (
    <PDFTemplate title="Laporan Inventaris Hotel" period={undefined}>
      {/* Summary Statistics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Ringkasan Inventaris</Text>
        <View style={{ backgroundColor: '#F3F4F6', padding: 12, borderRadius: 4 }}>
          <Text style={{ fontSize: 10, lineHeight: 1.6, color: '#374151' }}>
            <Text style={{ fontWeight: 'bold' }}>Total Item:</Text> {data.total_items} item{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Total Nilai Inventaris:</Text> {formatCurrency(data.total_value)}{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Ketersediaan Stok:</Text> {data.stock_availability_rate}%{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Item Stok Rendah:</Text> {data.low_stock_items} item{'\n'}
            <Text style={{ fontWeight: 'bold' }}>Item Habis:</Text> {data.out_of_stock} item
          </Text>
        </View>
      </View>

      {/* Key Metrics */}
      <View style={pdfStyles.section}>
        <Text style={pdfStyles.sectionTitle}>Metrik Kinerja</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Total Item</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{data.total_items}</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>jenis item</Text>
          </View>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Total Nilai</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{formatCurrency(data.total_value)}</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>nilai inventaris</Text>
          </View>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Ketersediaan</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{data.stock_availability_rate}%</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>item tersedia</Text>
          </View>
          <View style={{ width: '23%', backgroundColor: '#F3F4F6', padding: 10, borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>Stok Rendah</Text>
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#1f2937', marginBottom: 2 }}>{data.low_stock_items}</Text>
            <Text style={{ fontSize: 8, color: '#6B7280' }}>item kritis</Text>
          </View>
        </View>
      </View>

      {/* Items by Category */}
      {data.items_by_category && data.items_by_category.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Item per Kategori</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '50%', fontWeight: 'bold' }]}>Kategori</Text>
              <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'center', fontWeight: 'bold' }]}>Jumlah Item</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '25%', textAlign: 'right', fontWeight: 'bold' }]}>Total Qty</Text>
            </View>
            {data.items_by_category.map((item, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '50%' }]}>{item.category}</Text>
                <Text style={[pdfStyles.tableCell, { width: '25%', textAlign: 'center' }]}>
                  {item.count}
                </Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '25%', textAlign: 'right' }]}>
                  {item.total_quantity}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Critical Items */}
      {limitedCriticalItems.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Item Kritis (Stok Rendah/Habis)</Text>
          <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 8, fontStyle: 'italic' }}>
            Menampilkan 15 item pertama dari {totalCriticalItems} item kritis
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '35%', fontWeight: 'bold', fontSize: 8 }]}>Nama Item</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', fontWeight: 'bold', fontSize: 8 }]}>Kategori</Text>
              <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontWeight: 'bold', fontSize: 8 }]}>Stok</Text>
              <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontWeight: 'bold', fontSize: 8 }]}>Min</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '15%', textAlign: 'center', fontWeight: 'bold', fontSize: 8 }]}>Status</Text>
            </View>
            {limitedCriticalItems.map((item, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '35%', fontSize: 8 }]}>{item.name}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%', fontSize: 8 }]}>{item.category}</Text>
                <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontSize: 8 }]}>
                  {item.current_stock}
                </Text>
                <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontSize: 8 }]}>
                  {item.minimum_stock}
                </Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '15%', textAlign: 'center', fontSize: 7, color: item.status === 'OUT_OF_STOCK' ? '#DC2626' : '#F59E0B' }]}>
                  {item.status === 'OUT_OF_STOCK' ? 'HABIS' : 'RENDAH'}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Top Value Items */}
      {topValueItems.length > 0 && (
        <View style={pdfStyles.section}>
          <Text style={pdfStyles.sectionTitle}>Item dengan Nilai Tertinggi</Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { width: '35%', fontWeight: 'bold', fontSize: 8 }]}>Nama Item</Text>
              <Text style={[pdfStyles.tableCell, { width: '20%', fontWeight: 'bold', fontSize: 8 }]}>Kategori</Text>
              <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontWeight: 'bold', fontSize: 8 }]}>Stok</Text>
              <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '30%', textAlign: 'right', fontWeight: 'bold', fontSize: 8 }]}>Total Nilai</Text>
            </View>
            {topValueItems.map((item, index) => (
              <View key={index} style={index % 2 === 1 ? [pdfStyles.tableRow, pdfStyles.tableRowAlt] : pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '35%', fontSize: 8 }]}>{item.name}</Text>
                <Text style={[pdfStyles.tableCell, { width: '20%', fontSize: 8 }]}>{item.category}</Text>
                <Text style={[pdfStyles.tableCell, { width: '15%', textAlign: 'center', fontSize: 8 }]}>
                  {item.current_stock}
                </Text>
                <Text style={[pdfStyles.tableCell, pdfStyles.tableCellLast, { width: '30%', textAlign: 'right', fontSize: 8 }]}>
                  {formatCurrency(item.total_value)}
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
            • Total {data.total_items} jenis item dengan nilai inventaris {formatCurrency(data.total_value)}
          </Text>
          <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>
            • Tingkat ketersediaan stok: {data.stock_availability_rate}%
          </Text>
          <Text style={{ fontSize: 9, color: '#6B7280', marginBottom: 4 }}>
            • {data.low_stock_items} item memerlukan restocking segera
          </Text>
          <Text style={{ fontSize: 9, color: '#6B7280' }}>
            • {data.out_of_stock} item dalam status habis stok
          </Text>
        </View>
      </View>
    </PDFTemplate>
  );
};
