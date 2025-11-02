'use client';

import React from 'react';
import { PDFDownloadLink } from '@react-pdf/renderer';
import EventInvoicePDF from './EventInvoicePDF';
import { PrinterIcon } from '@/lib/icons';

interface InvoiceDownloadButtonProps {
  booking: any;
}

const InvoiceDownloadButton: React.FC<InvoiceDownloadButtonProps> = ({ booking }) => {
  return (
    <PDFDownloadLink
      document={<EventInvoicePDF booking={booking} />}
      fileName={`Invoice-${booking.booking_number}.pdf`}
      className="inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded hover:bg-gray-50 transition space-x-2"
    >
      {({ loading }) => (
        <>
          <PrinterIcon className="h-5 w-5" />
          <span>{loading ? 'Memuat...' : 'Cetak Invoice'}</span>
        </>
      )}
    </PDFDownloadLink>
  );
};

export default InvoiceDownloadButton;
