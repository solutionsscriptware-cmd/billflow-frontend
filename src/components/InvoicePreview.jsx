import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { X, Printer, Download } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const API_URL = import.meta.env.VITE_BACKEND_URL + "/api";

/* -------------------- HELPERS -------------------- */
const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/* -------------------- COMPONENT -------------------- */
const InvoicePreview = ({ invoice, onClose }) => {
  const { user } = useAuth();
  const [companySettings, setCompanySettings] = useState(null);
  const [customer, setCustomer] = useState(null);

  const printRef = useRef(null);

  useEffect(() => {
    if (invoice) {
      fetchCompanySettings();
      fetchCustomer();
    }
  }, [invoice]);

  /* -------------------- API CALLS -------------------- */
  const fetchCompanySettings = async () => {
    try {
      const res = await axios.get(`${API_URL}/settings/company`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setCompanySettings(res.data);
    } catch {
      console.error("Failed to load company settings");
    }
  };

  const fetchCustomer = async () => {
    try {
      const res = await axios.get(
        `${API_URL}/customers/${invoice.customer_id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setCustomer(res.data);
    } catch {
      console.error("Failed to load customer");
    }
  };

  /* -------------------- ACTIONS -------------------- */
  const handlePrint = () => window.print();

  const handleDownloadPDF = async () => {
    if (!printRef.current) return;

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${invoice.invoice_number}.pdf`);
  };

  if (!invoice || !companySettings || !customer) return null;

  /* -------------------- UI -------------------- */
  return (
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
      <div ref={printRef} className="bg-white p-8 rounded-lg text-black">
        {/* HEADER */}
        <div className="flex justify-between items-start pb-4 mb-4 border-b">
          <div>
            <h1 className="text-2xl font-bold">
              {companySettings.company_name}
            </h1>
            <div className="text-sm text-gray-700 mt-1">
              {companySettings.address && (
                <p className="whitespace-pre-line">
                  {companySettings.address}
                </p>
              )}
              {companySettings.phone && <p>Phone: {companySettings.phone}</p>}
              {companySettings.email && <p>Email: {companySettings.email}</p>}
              {companySettings.gst_number && (
                <p>GST: {companySettings.gst_number}</p>
              )}
            </div>
          </div>

          <div className="text-right text-sm">
            <h2 className="font-bold">INVOICE</h2>
            <p className="font-mono font-semibold">
              {invoice.invoice_number}
            </p>
            <p>Date: {formatDateDDMMYYYY(invoice.created_at)}</p>
          </div>
        </div>

        {/* BILL TO */}
        <div className="mb-4">
          <h3 className="font-semibold mb-1">Bill To:</h3>
          <p className="font-medium">{invoice.customer_name}</p>
          {customer.address && (
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {customer.address}
            </p>
          )}
          {customer.phone && (
            <p className="text-sm text-gray-700">
              Phone: {customer.phone}
            </p>
          )}
          {customer.gst_number && (
            <p className="text-sm text-gray-700">
              GST: {customer.gst_number}
            </p>
          )}
        </div>

        {/* ITEMS TABLE */}
        <table className="w-full mb-6 text-sm border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left px-2 py-2">#</th>
              <th className="text-left px-2 py-2">Product</th>
              <th className="text-right px-2 py-2">Qty</th>
              <th className="text-right px-2 py-2">Price</th>
              <th className="text-right px-2 py-2">GST</th>
              <th className="text-right px-2 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, i) => (
              <tr key={i}>
                <td className="px-2 py-1">{i + 1}</td>
                <td className="px-2 py-1">{item.product_name}</td>
                <td className="text-right px-2 py-1">{item.quantity}</td>
                <td className="text-right px-2 py-1">
                  ₹{item.price.toFixed(2)}
                </td>
                <td className="text-right px-2 py-1">
                  {item.gst_rate}%
                </td>
                <td className="text-right px-2 py-1">
                  ₹{item.total.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <div className="flex justify-end">
          <div className="w-64 text-sm space-y-1">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{invoice.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST</span>
              <span>₹{invoice.gst_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold border-t pt-1">
              <span>Total</span>
              <span>₹{invoice.total_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Paid</span>
              <span>₹{invoice.paid_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Balance</span>
              <span>₹{invoice.balance_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* NOTES */}
        {invoice.notes && (
          <div className="mt-6 text-sm">
            <strong>Notes:</strong> {invoice.notes}
          </div>
        )}

        {/* FOOTER */}
        <div className="mt-10 text-center text-sm text-gray-500">
          Thank you for your business!
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
