"""
Email Service using MailerSend
"""
import os
import base64
from mailersend import emails
from django.conf import settings
from .pdf_generator import generate_event_invoice_pdf


def send_event_invoice_email(event_booking):
    """
    Send invoice email with PDF attachment when event is fully paid

    Args:
        event_booking: EventBooking instance with full_payment_paid=True

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Get MailerSend API key from settings
        api_key = getattr(settings, 'MAILERSEND_API_KEY', None)
        if not api_key:
            print("Warning: MAILERSEND_API_KEY not found in settings")
            return False

        # Initialize MailerSend
        mailer = emails.NewEmail(api_key)

        # Generate PDF invoice
        pdf_buffer = generate_event_invoice_pdf(event_booking)
        pdf_content = pdf_buffer.getvalue()
        pdf_base64 = base64.b64encode(pdf_content).decode('utf-8')

        # Email configuration
        from_email = {
            "name": "Hotel Kapulaga",
            "email": "noreply@kapulaga.net"  # Use your verified domain
        }

        # FOR TESTING: Send to test email instead of guest email
        # TODO: Change back to guest email in production
        to_email = [{
            "name": event_booking.guest.full_name,
            "email": "nurojilukmansyah@gmail.com"  # Test email
            # "email": event_booking.guest.email  # Uncomment for production
        }]

        # Email subject
        subject = f"Invoice Pembayaran Event - {event_booking.event_name}"

        # Email body (HTML)
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }}
                .header {{
                    background-color: #005357;
                    color: white;
                    padding: 20px;
                    text-align: center;
                }}
                .content {{
                    padding: 30px 20px;
                    background-color: #f9f9f9;
                }}
                .details {{
                    background-color: white;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 5px;
                }}
                .details-row {{
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }}
                .details-row:last-child {{
                    border-bottom: none;
                }}
                .label {{
                    font-weight: bold;
                    color: #005357;
                }}
                .footer {{
                    text-align: center;
                    padding: 20px;
                    color: #666;
                    font-size: 12px;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 30px;
                    background-color: #005357;
                    color: white;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Hotel Kapulaga</h1>
                    <p>Terima Kasih atas Pembayaran Anda</p>
                </div>

                <div class="content">
                    <h2>Dear {event_booking.guest.full_name},</h2>

                    <p>Terima kasih atas pembayaran penuh untuk booking event Anda. Kami dengan senang hati mengkonfirmasi bahwa pembayaran telah kami terima dengan lengkap.</p>

                    <div class="details">
                        <div class="details-row">
                            <span class="label">No. Booking:</span>
                            <span>{event_booking.booking_number}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Nama Event:</span>
                            <span>{event_booking.event_name}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Jenis Event:</span>
                            <span>{event_booking.get_event_type_display()}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Tanggal Event:</span>
                            <span>{event_booking.event_date.strftime('%d %B %Y')}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Waktu:</span>
                            <span>{event_booking.start_time.strftime('%H:%M')} - {event_booking.end_time.strftime('%H:%M')}</span>
                        </div>
                        <div class="details-row">
                            <span class="label">Total Pembayaran:</span>
                            <span><strong>Rp {event_booking.grand_total:,.0f}</strong></span>
                        </div>
                    </div>

                    <p>
                        Bukti pembayaran terlampir dalam file PDF. Silakan simpan email ini sebagai referensi Anda.
                    </p>

                    <p>
                        Jika Anda memiliki pertanyaan atau memerlukan bantuan lebih lanjut, jangan ragu untuk menghubungi kami.
                    </p>

                    <p>Kami menantikan acara Anda di Hotel Kapulaga!</p>

                    <p>
                        <strong>Best regards,<br/>
                        Hotel Kapulaga Team</strong>
                    </p>
                </div>

                <div class="footer">
                    <p>
                        Hotel Kapulaga<br/>
                        Email: info@kapulaga.net | Telepon: (021) 1234-5678<br/>
                        Jl. Hotel Kapulaga No. 123, Jakarta
                    </p>
                    <p style="font-size: 10px; color: #999;">
                        Email ini dikirim secara otomatis. Mohon tidak membalas email ini.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """

        # Plain text version
        text_content = f"""
        Dear {event_booking.guest.full_name},

        Terima kasih atas pembayaran penuh untuk booking event Anda.

        Detail Booking:
        - No. Booking: {event_booking.booking_number}
        - Nama Event: {event_booking.event_name}
        - Jenis Event: {event_booking.get_event_type_display()}
        - Tanggal Event: {event_booking.event_date.strftime('%d %B %Y')}
        - Waktu: {event_booking.start_time.strftime('%H:%M')} - {event_booking.end_time.strftime('%H:%M')}
        - Total Pembayaran: Rp {event_booking.grand_total:,.0f}

        Bukti pembayaran terlampir dalam file PDF.

        Terima kasih,
        Hotel Kapulaga Team
        Email: info@kapulaga.net | Telepon: (021) 1234-5678
        """

        # Build email with attachment
        mailer.set_mail_from(from_email, mail_to=to_email)
        mailer.set_subject(subject)
        mailer.set_html_content(html_content)
        mailer.set_plaintext_content(text_content)

        # Add PDF attachment
        attachment = {
            "content": pdf_base64,
            "filename": f"Invoice_{event_booking.booking_number}.pdf",
            "disposition": "attachment"
        }
        mailer.set_attachments([attachment])

        # Send email
        response = mailer.send()

        # Check if successful (MailerSend returns 202 for accepted)
        if hasattr(response, 'status_code') and response.status_code == 202:
            print(f"Invoice email sent successfully to {event_booking.guest.email}")
            return True
        else:
            print(f"Failed to send email. Response: {response}")
            return False

    except Exception as e:
        print(f"Error sending invoice email: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
