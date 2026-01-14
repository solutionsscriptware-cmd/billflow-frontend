import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL + '/api';

const Payments = () => {
  const { getAuthHeader } = useAuth();

  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
  try {
    const [paymentsRes, invoicesRes] = await Promise.all([
      axios.get(`${API_URL}/payments`, getAuthHeader()),
      axios.get(`${API_URL}/invoices`, getAuthHeader()),
    ]);

    const invoicesData = invoicesRes.data;

    // ✅ keep only payments whose invoice still exists
    const validInvoiceIds = new Set(invoicesData.map(inv => inv.id));

    const filteredPayments = paymentsRes.data.filter(p =>
      validInvoiceIds.has(p.invoice_id)
    );

    setInvoices(invoicesData);
    setPayments(filteredPayments);

  } catch (error) {
    toast.error("Failed to load payments");
  } finally {
    setLoading(false);
  }
};


  const filteredPayments = payments.filter(payment =>
    payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.payment_method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReceived = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

  const totalBalance = invoices.reduce(
    (sum, inv) => sum + (inv.balance_amount || 0),
    0
  );

  const methodStats = payments.reduce((acc, payment) => {
    acc[payment.payment_method] = (acc[payment.payment_method] || 0) + payment.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-6" data-testid="payments-page">
      <div>
        <h1 className="text-4xl font-bold mb-2">Payments</h1>
        <p className="text-muted-foreground">Track all payment transactions</p>
      </div>

      {/* DASHBOARD */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(methodStats).map(([method, amount]) => (
          <Card key={method}>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground mb-1 capitalize">
                {method.replace('_', ' ')}
              </p>
              <p className="text-2xl font-bold font-mono">
                ₹{amount.toLocaleString('en-IN')}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* PENDING BALANCE */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Pending Balance</p>
            <p className="text-2xl font-bold font-mono text-red-600">
              ₹{totalBalance.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
        
        {/* Total Recieved */}
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground mb-1">Total Recieved</p>
            <p className="text-2xl font-bold font-mono text-green-600">
              ₹{totalReceived.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TABLE */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="ml-4 text-right">
              <p className="text-sm text-muted-foreground">Total Received</p>
              <p className="text-2xl font-bold font-mono">
                ₹{totalReceived.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPayments.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        {new Date(payment.payment_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-mono font-semibold">
                        {payment.invoice_number}
                      </TableCell>
                      <TableCell>{payment.customer_name}</TableCell>
                      <TableCell>
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-primary/10 text-primary capitalize">
                          {payment.payment_method.replace('_', ' ')}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-green-600">
                        ₹{payment.amount.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No payments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Payments;
