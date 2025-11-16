"""
Format report data for PDF and Excel output
"""
from .report_generators import PDFReportGenerator, ExcelReportGenerator, format_currency, format_percentage


def format_occupancy_report_pdf(data):
    """Format occupancy report as PDF"""
    pdf = PDFReportGenerator("Laporan Okupansi Hotel", data.get('period', ''))
    pdf.add_header()

    # Key metrics
    pdf.add_section("Ringkasan Okupansi")
    metrics = {
        'Rata-rata Okupansi': f"{data.get('average_occupancy', 0)}%",
        'Total Kamar': data.get('total_rooms', 0),
    }
    pdf.add_key_metrics(metrics)

    # Daily data table
    if data.get('daily_data'):
        pdf.add_section("Data Harian")
        headers = ['Tanggal', 'Kamar Terisi', 'Total Kamar', 'Tingkat Okupansi']
        table_data = [
            [
                item['date'],
                str(item['occupied_rooms']),
                str(item['total_rooms']),
                f"{item['occupancy_rate']}%"
            ]
            for item in data['daily_data']
        ]
        pdf.add_table(headers, table_data)

    return pdf.generate()


def format_occupancy_report_excel(data):
    """Format occupancy report as Excel"""
    excel = ExcelReportGenerator("Laporan Okupansi Hotel", data.get('period', ''))
    excel.add_sheet("Okupansi")
    excel.add_header()

    # Key metrics
    excel.add_section("Ringkasan Okupansi")
    metrics = {
        'Rata-rata Okupansi': f"{data.get('average_occupancy', 0)}%",
        'Total Kamar': data.get('total_rooms', 0),
    }
    excel.add_key_metrics(metrics)

    # Daily data
    if data.get('daily_data'):
        excel.add_section("Data Harian")
        headers = ['Tanggal', 'Kamar Terisi', 'Total Kamar', 'Tingkat Okupansi (%)']
        table_data = [
            [
                item['date'],
                item['occupied_rooms'],
                item['total_rooms'],
                item['occupancy_rate']
            ]
            for item in data['daily_data']
        ]
        excel.add_table(headers, table_data)

    return excel.generate()


def format_revenue_report_pdf(data):
    """Format revenue report as PDF"""
    pdf = PDFReportGenerator("Laporan Pendapatan Hotel", data.get('period', ''))
    pdf.add_header()

    # Key metrics
    pdf.add_section("Ringkasan Pendapatan")
    metrics = {
        'Total Pendapatan': format_currency(data.get('total_revenue', 0)),
        'Pendapatan Kamar': format_currency(data.get('room_revenue', 0)),
        'Pendapatan Lainnya': format_currency(data.get('other_revenue', 0)),
    }
    pdf.add_key_metrics(metrics)

    # Revenue by payment method
    if data.get('revenue_by_method'):
        pdf.add_section("Pendapatan per Metode Pembayaran")
        headers = ['Metode Pembayaran', 'Jumlah Transaksi', 'Total']
        table_data = [
            [
                item['method'],
                str(item['count']),
                format_currency(item['total'])
            ]
            for item in data['revenue_by_method']
        ]
        pdf.add_table(headers, table_data)

    return pdf.generate()


def format_revenue_report_excel(data):
    """Format revenue report as Excel"""
    excel = ExcelReportGenerator("Laporan Pendapatan Hotel", data.get('period', ''))
    excel.add_sheet("Pendapatan")
    excel.add_header()

    # Key metrics
    excel.add_section("Ringkasan Pendapatan")
    metrics = {
        'Total Pendapatan': format_currency(data.get('total_revenue', 0)),
        'Pendapatan Kamar': format_currency(data.get('room_revenue', 0)),
        'Pendapatan Lainnya': format_currency(data.get('other_revenue', 0)),
    }
    excel.add_key_metrics(metrics)

    # Revenue by method
    if data.get('revenue_by_method'):
        excel.add_section("Pendapatan per Metode Pembayaran")
        headers = ['Metode Pembayaran', 'Jumlah Transaksi', 'Total']
        table_data = [
            [item['method'], item['count'], format_currency(item['total'])]
            for item in data['revenue_by_method']
        ]
        excel.add_table(headers, table_data)

    # Daily revenue
    if data.get('daily_revenue'):
        excel.add_section("Pendapatan Harian")
        headers = ['Tanggal', 'Pendapatan']
        table_data = [
            [item['date'], format_currency(item['revenue'])]
            for item in data['daily_revenue']
        ]
        excel.add_table(headers, table_data)

    return excel.generate()


def format_guest_analytics_pdf(data):
    """Format guest analytics as PDF"""
    pdf = PDFReportGenerator("Analisis Tamu Hotel", data.get('period', ''))
    pdf.add_header()

    # Key metrics
    pdf.add_section("Ringkasan Tamu")
    metrics = {
        'Total Tamu': data.get('total_guests', 0),
        'Tamu Berulang': data.get('repeat_guests', 0),
        'Tingkat Tamu Berulang': f"{data.get('repeat_rate', 0)}%",
        'Rata-rata Lama Menginap': f"{data.get('average_stay', 0)} malam",
    }
    pdf.add_key_metrics(metrics)

    # Nationality breakdown
    if data.get('nationality_breakdown'):
        pdf.add_section("Distribusi Kewarganegaraan")
        headers = ['Kewarganegaraan', 'Jumlah', 'Persentase']
        table_data = [
            [
                item['nationality'],
                str(item['count']),
                f"{item['percentage']}%"
            ]
            for item in data['nationality_breakdown']
        ]
        pdf.add_table(headers, table_data)

    return pdf.generate()


def format_guest_analytics_excel(data):
    """Format guest analytics as Excel"""
    excel = ExcelReportGenerator("Analisis Tamu Hotel", data.get('period', ''))
    excel.add_sheet("Analisis Tamu")
    excel.add_header()

    # Key metrics
    excel.add_section("Ringkasan Tamu")
    metrics = {
        'Total Tamu': data.get('total_guests', 0),
        'Tamu Berulang': data.get('repeat_guests', 0),
        'Tingkat Tamu Berulang': f"{data.get('repeat_rate', 0)}%",
        'Rata-rata Lama Menginap': f"{data.get('average_stay', 0)} malam",
    }
    excel.add_key_metrics(metrics)

    # Nationality breakdown
    if data.get('nationality_breakdown'):
        excel.add_section("Distribusi Kewarganegaraan")
        headers = ['Kewarganegaraan', 'Jumlah', 'Persentase (%)']
        table_data = [
            [item['nationality'], item['count'], item['percentage']]
            for item in data['nationality_breakdown']
        ]
        excel.add_table(headers, table_data)

    return excel.generate()


def format_staff_performance_pdf(data):
    """Format staff performance as PDF"""
    pdf = PDFReportGenerator("Laporan Performa Karyawan", data.get('period', ''))
    pdf.add_header()

    # Key metrics
    pdf.add_section("Ringkasan Performa")
    metrics = {
        'Total Karyawan': data.get('total_staff', 0),
    }
    pdf.add_key_metrics(metrics)

    # Staff performance table
    if data.get('staff'):
        pdf.add_section("Performa Individu")
        headers = ['Nama', 'Spesialisasi', 'Tugas Selesai', 'Rata-rata Waktu (jam)']
        table_data = [
            [
                item['name'],
                item.get('specialization', '-'),
                str(item['requests_completed']),
                str(item.get('average_time', 0))
            ]
            for item in data['staff']
        ]
        pdf.add_table(headers, table_data, col_widths=[2*inch, 1.5*inch, 1*inch, 1.5*inch])

    return pdf.generate()


def format_staff_performance_excel(data):
    """Format staff performance as Excel"""
    from reportlab.lib.units import inch

    excel = ExcelReportGenerator("Laporan Performa Karyawan", data.get('period', ''))
    excel.add_sheet("Performa Karyawan")
    excel.add_header()

    # Key metrics
    excel.add_section("Ringkasan Performa")
    metrics = {
        'Total Karyawan': data.get('total_staff', 0),
    }
    excel.add_key_metrics(metrics)

    # Staff performance
    if data.get('staff'):
        excel.add_section("Performa Individu")
        headers = ['Nama', 'Spesialisasi', 'Kontak', 'Tugas Selesai', 'Rata-rata Waktu (jam)']
        table_data = [
            [
                item['name'],
                item.get('specialization', '-'),
                item.get('phone', '-'),
                item['requests_completed'],
                item.get('average_time', 0)
            ]
            for item in data['staff']
        ]
        excel.add_table(headers, table_data)

    return excel.generate()


def format_maintenance_report_pdf(data):
    """Format maintenance report as PDF"""
    from reportlab.lib.units import inch

    pdf = PDFReportGenerator("Laporan Maintenance", data.get('period', ''))
    pdf.add_header()

    # Key metrics
    pdf.add_section("Ringkasan Maintenance")
    metrics = {
        'Total Request': data.get('total_requests', 0),
        'Selesai': data.get('completed', 0),
        'Dalam Proses': data.get('in_progress', 0),
        'Pending': data.get('pending', 0),
        'Total Biaya': format_currency(data.get('total_cost', 0)),
        'Rata-rata Waktu Penyelesaian': f"{data.get('average_resolution_time', 0)} jam",
    }
    pdf.add_key_metrics(metrics)

    # By priority
    if data.get('by_priority'):
        pdf.add_section("Berdasarkan Prioritas")
        headers = ['Prioritas', 'Jumlah']
        table_data = [[item['priority'], str(item['count'])] for item in data['by_priority']]
        pdf.add_table(headers, table_data, col_widths=[3*inch, 2*inch])

    # By category
    if data.get('by_category'):
        pdf.add_section("Berdasarkan Kategori")
        headers = ['Kategori', 'Jumlah']
        table_data = [[item['category'], str(item['count'])] for item in data['by_category']]
        pdf.add_table(headers, table_data, col_widths=[3*inch, 2*inch])

    return pdf.generate()


def format_maintenance_report_excel(data):
    """Format maintenance report as Excel"""
    excel = ExcelReportGenerator("Laporan Maintenance", data.get('period', ''))
    excel.add_sheet("Maintenance")
    excel.add_header()

    # Key metrics
    excel.add_section("Ringkasan Maintenance")
    metrics = {
        'Total Request': data.get('total_requests', 0),
        'Selesai': data.get('completed', 0),
        'Dalam Proses': data.get('in_progress', 0),
        'Pending': data.get('pending', 0),
        'Total Biaya': format_currency(data.get('total_cost', 0)),
        'Rata-rata Waktu Penyelesaian': f"{data.get('average_resolution_time', 0)} jam",
    }
    excel.add_key_metrics(metrics)

    # By priority
    if data.get('by_priority'):
        excel.add_section("Berdasarkan Prioritas")
        headers = ['Prioritas', 'Jumlah']
        table_data = [[item['priority'], item['count']] for item in data['by_priority']]
        excel.add_table(headers, table_data)

    # By category
    if data.get('by_category'):
        excel.add_section("Berdasarkan Kategori")
        headers = ['Kategori', 'Jumlah']
        table_data = [[item['category'], item['count']] for item in data['by_category']]
        excel.add_table(headers, table_data)

    return excel.generate()


def format_inventory_report_pdf(data):
    """Format inventory report as PDF"""
    from reportlab.lib.units import inch

    pdf = PDFReportGenerator("Laporan Inventaris", "")
    pdf.add_header()

    # Key metrics
    pdf.add_section("Ringkasan Inventaris")
    metrics = {
        'Total Item': data.get('total_items', 0),
        'Stok Rendah': data.get('low_stock_items', 0),
        'Stok Habis': data.get('out_of_stock', 0),
        'Total Nilai Inventaris': format_currency(data.get('total_value', 0)),
    }
    pdf.add_key_metrics(metrics)

    # By category
    if data.get('items_by_category'):
        pdf.add_section("Berdasarkan Kategori")
        headers = ['Kategori', 'Jumlah Item', 'Total Kuantitas']
        table_data = [
            [item['category'], str(item['count']), str(item['total_quantity'])]
            for item in data['items_by_category']
        ]
        pdf.add_table(headers, table_data, col_widths=[2*inch, 1.5*inch, 1.5*inch])

    return pdf.generate()


def format_inventory_report_excel(data):
    """Format inventory report as Excel"""
    excel = ExcelReportGenerator("Laporan Inventaris", "")
    excel.add_sheet("Inventaris")
    excel.add_header()

    # Key metrics
    excel.add_section("Ringkasan Inventaris")
    metrics = {
        'Total Item': data.get('total_items', 0),
        'Stok Rendah': data.get('low_stock_items', 0),
        'Stok Habis': data.get('out_of_stock', 0),
        'Total Nilai Inventaris': format_currency(data.get('total_value', 0)),
    }
    excel.add_key_metrics(metrics)

    # By category
    if data.get('items_by_category'):
        excel.add_section("Berdasarkan Kategori")
        headers = ['Kategori', 'Jumlah Item', 'Total Kuantitas']
        table_data = [
            [item['category'], item['count'], item['total_quantity']]
            for item in data['items_by_category']
        ]
        excel.add_table(headers, table_data)

    return excel.generate()


def format_satisfaction_report_pdf(data):
    """Format satisfaction report as PDF"""
    from reportlab.lib.units import inch

    pdf = PDFReportGenerator("Laporan Kepuasan Tamu", data.get('period', ''))
    pdf.add_header()

    # Key metrics
    pdf.add_section("Ringkasan Kepuasan")
    metrics = {
        'Skor Kepuasan': f"{data.get('satisfaction_score', 0)}/5",
        'Total Komplain': data.get('total_complaints', 0),
        'Komplain Terselesaikan': data.get('resolved_complaints', 0),
        'Komplain Pending': data.get('pending_complaints', 0),
        'Tingkat Penyelesaian': f"{data.get('resolution_rate', 0)}%",
    }
    pdf.add_key_metrics(metrics)

    # Complaints by category
    if data.get('complaints_by_category'):
        pdf.add_section("Komplain Berdasarkan Kategori")
        headers = ['Kategori', 'Jumlah', 'Persentase']
        table_data = [
            [item['category'], str(item['count']), f"{item['percentage']}%"]
            for item in data['complaints_by_category']
        ]
        pdf.add_table(headers, table_data, col_widths=[2*inch, 1.5*inch, 1.5*inch])

    return pdf.generate()


def format_satisfaction_report_excel(data):
    """Format satisfaction report as Excel"""
    excel = ExcelReportGenerator("Laporan Kepuasan Tamu", data.get('period', ''))
    excel.add_sheet("Kepuasan Tamu")
    excel.add_header()

    # Key metrics
    excel.add_section("Ringkasan Kepuasan")
    metrics = {
        'Skor Kepuasan': f"{data.get('satisfaction_score', 0)}/5",
        'Total Komplain': data.get('total_complaints', 0),
        'Komplain Terselesaikan': data.get('resolved_complaints', 0),
        'Komplain Pending': data.get('pending_complaints', 0),
        'Tingkat Penyelesaian': f"{data.get('resolution_rate', 0)}%",
    }
    excel.add_key_metrics(metrics)

    # Complaints by category
    if data.get('complaints_by_category'):
        excel.add_section("Komplain Berdasarkan Kategori")
        headers = ['Kategori', 'Jumlah', 'Persentase (%)']
        table_data = [
            [item['category'], item['count'], item['percentage']]
            for item in data['complaints_by_category']
        ]
        excel.add_table(headers, table_data)

    return excel.generate()


def format_tax_report_pdf(data):
    """Format tax report as PDF"""
    pdf = PDFReportGenerator("Laporan Pajak Hotel", data.get('period', ''))
    pdf.add_header()

    # Key metrics
    pdf.add_section("Ringkasan Pajak")
    metrics = {
        'Total Pendapatan': format_currency(data.get('total_revenue', 0)),
        'PPN': format_currency(data.get('vat_amount', 0)),
        'Pajak Hotel': format_currency(data.get('hotel_tax', 0)),
        'Total Pajak': format_currency(data.get('total_tax', 0)),
    }
    pdf.add_key_metrics(metrics)

    return pdf.generate()


def format_tax_report_excel(data):
    """Format comprehensive tax report as Excel"""
    excel = ExcelReportGenerator("Laporan Pajak Hotel", data.get('period', ''))
    excel.add_sheet("Ringkasan Pajak")
    excel.add_header()

    # Report Information
    excel.add_section("Informasi Laporan")
    info_metrics = {
        'Periode': f"{data.get('start_date', '')} s/d {data.get('end_date', '')}",
        'Total Transaksi': data.get('statistics', {}).get('total_transactions', 0),
        'Total Tamu': data.get('statistics', {}).get('total_guests', 0),
        'Dibuat': data.get('generated_at', ''),
    }
    excel.add_key_metrics(info_metrics)

    # Tax Rates
    excel.add_section("Tarif Pajak")
    tax_rates = data.get('tax_rates', {})
    rates_data = {
        'PPN (Pajak Pertambahan Nilai)': f"{tax_rates.get('ppn', 0)}%",
        'Pajak Hotel (Provincial)': f"{tax_rates.get('hotel_tax', 0)}%",
        'Service Charge': f"{tax_rates.get('service_charge', 0)}%",
        'PPh Final': f"{tax_rates.get('pph_final', 0)}%",
    }
    excel.add_key_metrics(rates_data)

    # Revenue Breakdown
    excel.add_section("Rincian Pendapatan Kena Pajak")
    rev_breakdown = data.get('revenue_breakdown', {})
    room_rev = rev_breakdown.get('room_revenue', {})
    event_rev = rev_breakdown.get('event_revenue', {})
    total_rev = rev_breakdown.get('total', {})

    headers = ['Kategori', 'Subtotal', 'Pajak', 'Service', 'Grand Total', 'Jumlah Trx']
    table_data = [
        [
            f"Kamar",
            format_currency(room_rev.get('subtotal', 0)),
            format_currency(room_rev.get('tax_amount', 0)),
            format_currency(room_rev.get('service_charge', 0)),
            format_currency(room_rev.get('grand_total', 0)),
            room_rev.get('transaction_count', 0)
        ],
        [
            f"Event",
            format_currency(event_rev.get('subtotal', 0)),
            format_currency(event_rev.get('tax_amount', 0)),
            format_currency(event_rev.get('service_charge', 0)),
            format_currency(event_rev.get('grand_total', 0)),
            event_rev.get('transaction_count', 0)
        ],
        [
            f"TOTAL",
            format_currency(total_rev.get('subtotal', 0)),
            format_currency(total_rev.get('tax_collected', 0)),
            format_currency(total_rev.get('service_charge', 0)),
            format_currency(total_rev.get('grand_total', 0)),
            total_rev.get('transaction_count', 0)
        ]
    ]
    excel.add_table(headers, table_data)

    # Tax Obligations
    excel.add_section("Kewajiban Pajak kepada Pemerintah")
    tax_oblig = data.get('tax_obligations', {})
    oblig_metrics = {
        'PPN yang Dikumpulkan': format_currency(tax_oblig.get('ppn_collected', 0)),
        'Pajak Hotel (Prov)': format_currency(tax_oblig.get('hotel_tax_payable', 0)),
        'PPh Final (Pusat)': format_currency(tax_oblig.get('pph_final_payable', 0)),
        'TOTAL KEWAJIBAN': format_currency(tax_oblig.get('total_payable', 0)),
    }
    excel.add_key_metrics(oblig_metrics)

    # Payment Methods Sheet
    excel.add_sheet("Metode Pembayaran")
    excel.add_section("Distribusi Metode Pembayaran")
    if data.get('payment_methods'):
        headers = ['Metode', 'Jumlah Transaksi', 'Total', 'Persentase']
        table_data = [
            [
                item['method'],
                item['count'],
                format_currency(item['total']),
                f"{item['percentage']}%"
            ]
            for item in data['payment_methods']
        ]
        excel.add_table(headers, table_data)

    # Daily Breakdown Sheet
    excel.add_sheet("Rincian Harian")
    excel.add_section("Breakdown Harian Pendapatan dan Pajak")
    if data.get('daily_breakdown'):
        headers = ['Tanggal', 'Pendapatan Kamar', 'Pendapatan Event', 'Total Pendapatan', 'Pajak Dikumpulkan', 'Service Charge', 'Grand Total']
        table_data = [
            [
                item['date'],
                format_currency(item['room_revenue']),
                format_currency(item['event_revenue']),
                format_currency(item['total_revenue']),
                format_currency(item['tax_collected']),
                format_currency(item['service_charge']),
                format_currency(item['grand_total'])
            ]
            for item in data['daily_breakdown'] if item['total_revenue'] > 0
        ]
        excel.add_table(headers, table_data)

    return excel.generate()


# Formatter registry
FORMATTERS = {
    'occupancy': {
        'pdf': format_occupancy_report_pdf,
        'xlsx': format_occupancy_report_excel,
    },
    'revenue': {
        'pdf': format_revenue_report_pdf,
        'xlsx': format_revenue_report_excel,
    },
    'guest-analytics': {
        'pdf': format_guest_analytics_pdf,
        'xlsx': format_guest_analytics_excel,
    },
    'staff-performance': {
        'pdf': format_staff_performance_pdf,
        'xlsx': format_staff_performance_excel,
    },
    'maintenance': {
        'pdf': format_maintenance_report_pdf,
        'xlsx': format_maintenance_report_excel,
    },
    'inventory': {
        'pdf': format_inventory_report_pdf,
        'xlsx': format_inventory_report_excel,
    },
    'satisfaction': {
        'pdf': format_satisfaction_report_pdf,
        'xlsx': format_satisfaction_report_excel,
    },
    'tax': {
        'pdf': format_tax_report_pdf,
        'xlsx': format_tax_report_excel,
    },
}


def get_formatter(report_type, format_type):
    """Get the appropriate formatter for report and format type"""
    if report_type in FORMATTERS and format_type in FORMATTERS[report_type]:
        return FORMATTERS[report_type][format_type]
    return None
