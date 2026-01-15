import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { X, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const API_URL = import.meta.env.VITE_BACKEND_URL + '/api';


const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const InvoicePreview = ({ invoice, onClose }) => {
  const { getAuthHeader } = useAuth();
  const [companySettings, setCompanySettings] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    fetchCompanySettings();
  }, []);

  const fetchCompanySettings = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/settings/company`,
        getAuthHeader()
      );
      setCompanySettings(res.data);
    } catch (err) {
      console.error('Failed to load company settings');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    let position = 0;
    let heightLeft = pdfHeight;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(`${invoice.invoice_number}.pdf`);
  };

  if (!companySettings) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* ACTION BAR */}
          <div className="flex items-center justify-between print:hidden">
            <h2 className="text-2xl font-bold">Invoice Preview</h2>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="mr-2 h-4 w-4" />
                Print
              </Button>
              <Button onClick={handleDownloadPDF}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <Button onClick={onClose} variant="ghost" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* INVOICE CONTENT */}
          <div
            ref={printRef}
            className="print-content bg-white p-8 rounded-lg border text-black"
          >
           {/* HEADER */}
<div className="flex justify-between items-start border-b pb-4 mb-4">
  <div>
    <h1 className="text-2xl font-bold text-primary mb-1">
      {companySettings.company_name}
    </h1>

    <div className="text-sm leading-tight text-gray-700">
      {companySettings.address && (
        <p className="whitespace-pre-line">
          {companySettings.address}
        </p>
      )}

      {companySettings.phone && (
        <p className="mt-1">
          Phone: {companySettings.phone}
        </p>
      )}

      {companySettings.email && (
        <p>
          Email: {companySettings.email}
        </p>
      )}

      {companySettings.gst_number && (
        <p className="font-mono text-xs mt-1">
          GST: {companySettings.gst_number}
        </p>
      )}
    </div>
  </div>


              <div className="text-right">
                <h2 className="text-l font-bold">INVOICE</h2>
                <p className="font-mono font-semibold text-medium">
                  {invoice.invoice_number}
                </p>
                <p>
                  Date: {formatDateDDMMYYYY(invoice.created_at)}
                </p>

                </div>
            </div>

            {/* BILL TO */}
            <div className="mb-6">
              <h3 className="font-semibold mb-1 ">Bill To:</h3>
              <p className="text-sm">{invoice.customer_name}</p>
            </div>

            {/* ITEMS */}
            <table className="w-full mb-8 border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Product</th>
                  <th className="text-right py-2">Qty</th>
                  <th className="text-right py-2">Price</th>
                  <th className="text-right py-2">GST</th>
                  <th className="text-right py-2">Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.items.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="py-3">{item.product_name}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">₹{item.price.toFixed(2)}</td>
                    <td className="text-right">{item.gst_rate}%</td>
                    <td className="text-right">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* TOTALS */}
            <div className="flex justify-end mt-4">
              <div className="w-60 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">GST</span>
                  <span>₹{invoice.gst_amount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between font-semibold text-base border-t pt-1">
                  <span>Total</span>
                  <span>₹{invoice.total_amount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-green-600 text-sm">
                  <span>Paid</span>
                  <span>₹{invoice.paid_amount.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-red-600 text-sm">
                  <span>Balance</span>
                  <span>₹{invoice.balance_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* NOTES */}
            {invoice.notes && (
              <div className="mt-6 border-t pt-4 text-sm">
                <strong>Notes:</strong> {invoice.notes}
              </div>
            )}

            {/* FOOTER */}
            <div className="mt-10 text-center text-sm text-muted-foreground">
              Thank you for your business!
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoicePreview;
