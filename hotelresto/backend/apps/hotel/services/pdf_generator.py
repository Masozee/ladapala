"""
PDF Generator for Event Invoices using ReportLab
"""
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT
from decimal import Decimal


def generate_event_invoice_pdf(event_booking):
    """
    Generate PDF invoice for event booking

    Args:
        event_booking: EventBooking instance

    Returns:
        BytesIO: PDF file buffer
    """
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []

    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#005357'),
        alignment=TA_CENTER,
        spaceAfter=30,
    )

    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#005357'),
        spaceAfter=12,
    )

    normal_style = styles['Normal']

    # Title
    title = Paragraph("BUKTI PEMBAYARAN", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.5*cm))

    # Event Information Section
    event_info_title = Paragraph("Informasi Booking", heading_style)
    elements.append(event_info_title)

    event_info_data = [
        ['No. Booking:', event_booking.booking_number],
        ['Nama Event:', event_booking.event_name],
        ['Jenis Event:', event_booking.get_event_type_display()],
        ['Tanggal Event:', event_booking.event_date.strftime('%d %B %Y')],
        ['Waktu:', f"{event_booking.start_time.strftime('%H:%M')} - {event_booking.end_time.strftime('%H:%M')}"],
        ['Venue:', event_booking.venue.number if hasattr(event_booking.venue, 'number') else str(event_booking.venue)],
    ]

    event_info_table = Table(event_info_data, colWidths=[5*cm, 12*cm])
    event_info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    elements.append(event_info_table)
    elements.append(Spacer(1, 0.8*cm))

    # Guest Information
    guest_info_title = Paragraph("Informasi Pemesan", heading_style)
    elements.append(guest_info_title)

    guest_info_data = [
        ['Nama:', event_booking.guest.full_name],
        ['Email:', event_booking.guest.email],
        ['Telepon:', event_booking.guest.phone],
    ]

    if event_booking.organization:
        guest_info_data.append(['Organisasi:', event_booking.organization])

    guest_info_table = Table(guest_info_data, colWidths=[5*cm, 12*cm])
    guest_info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.grey),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    elements.append(guest_info_table)
    elements.append(Spacer(1, 0.8*cm))

    # Package and Services Details
    package_title = Paragraph("Paket dan Layanan", heading_style)
    elements.append(package_title)

    package_data = [
        ['Keterangan', 'Qty', 'Harga', 'Jumlah'],
    ]

    # Venue package
    package_data.append([
        event_booking.venue_package.name,
        '1',
        f"Rp {event_booking.venue_price:,.0f}",
        f"Rp {event_booking.venue_price:,.0f}",
    ])

    # Food package
    if event_booking.food_package:
        pax = event_booking.confirmed_pax or event_booking.expected_pax
        package_data.append([
            f"{event_booking.food_package.name}",
            f"{pax} pax",
            f"Rp {event_booking.food_package.price_per_pax:,.0f}",
            f"Rp {event_booking.food_price:,.0f}",
        ])

    # Additional charges
    if event_booking.equipment_price > 0:
        package_data.append([
            'Peralatan Tambahan',
            '1',
            f"Rp {event_booking.equipment_price:,.0f}",
            f"Rp {event_booking.equipment_price:,.0f}",
        ])

    if event_booking.other_charges > 0:
        package_data.append([
            'Biaya Lainnya',
            '1',
            f"Rp {event_booking.other_charges:,.0f}",
            f"Rp {event_booking.other_charges:,.0f}",
        ])

    package_table = Table(package_data, colWidths=[8*cm, 3*cm, 3*cm, 3*cm])
    package_table.setStyle(TableStyle([
        # Header row
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#005357')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (1, 0), (-1, 0), 'CENTER'),

        # Data rows
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
        ('ALIGN', (2, 1), (-1, -1), 'RIGHT'),
        ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),

        # All cells
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
    ]))

    elements.append(package_table)
    elements.append(Spacer(1, 0.5*cm))

    # Totals
    totals_data = [
        ['Subtotal', f"Rp {event_booking.subtotal:,.0f}"],
        ['Pajak (11%)', f"Rp {event_booking.tax_amount:,.0f}"],
        ['', ''],
        ['TOTAL', f"Rp {event_booking.grand_total:,.0f}"],
    ]

    totals_table = Table(totals_data, colWidths=[14*cm, 3*cm])
    totals_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, 2), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, 2), 10),
        ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (-1, -1), 'RIGHT'),

        # Total row
        ('FONTNAME', (0, 3), (-1, 3), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 3), (-1, 3), 12),
        ('TEXTCOLOR', (0, 3), (-1, 3), colors.HexColor('#005357')),
        ('LINEABOVE', (0, 3), (-1, 3), 1, colors.HexColor('#005357')),

        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))

    elements.append(totals_table)
    elements.append(Spacer(1, 0.8*cm))

    # Payment History
    payments = event_booking.payments.filter(status='COMPLETED').order_by('payment_date')

    if payments.exists():
        payment_title = Paragraph("Riwayat Pembayaran", heading_style)
        elements.append(payment_title)

        payment_data = [['Tanggal', 'Jenis', 'Metode', 'Jumlah']]

        for payment in payments:
            payment_data.append([
                payment.payment_date.strftime('%d/%m/%Y %H:%M'),
                payment.get_payment_type_display(),
                payment.get_payment_method_display(),
                f"Rp {payment.amount:,.0f}",
            ])

        # Total paid row
        total_paid = sum(p.amount for p in payments)
        payment_data.append(['', '', 'TOTAL DIBAYAR', f"Rp {total_paid:,.0f}"])

        payment_table = Table(payment_data, colWidths=[4*cm, 5*cm, 4*cm, 4*cm])
        payment_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#005357')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),

            # Data rows
            ('FONTNAME', (0, 1), (-1, -2), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -2), 9),
            ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),

            # Total row
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),

            # All cells
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))

        elements.append(payment_table)
        elements.append(Spacer(1, 1*cm))

    # Footer note
    footer_text = """
    <para align=center>
    <font size=8 color="#666666">
    Terima kasih atas kepercayaan Anda. Untuk informasi lebih lanjut, silakan hubungi kami.<br/>
    Hotel Kapulaga | Email: info@kapulaga.net | Telepon: (021) 1234-5678
    </font>
    </para>
    """
    footer = Paragraph(footer_text, normal_style)
    elements.append(footer)

    # Build PDF
    doc.build(elements)
    buffer.seek(0)

    return buffer
