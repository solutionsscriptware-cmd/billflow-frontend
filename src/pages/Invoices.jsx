import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Eye,
  Trash2,
  Search,
  BadgeIndianRupee,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import InvoicePreview from "@/components/InvoicePreview";

const API_URL = import.meta.env.VITE_BACKEND_URL + "/api";

const Invoices = () => {
  const { getAuthHeader } = useAuth();

  /* ================= STATE ================= */
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");

  /* Create Invoice */
  const [createOpen, setCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    customer_id: "",
    invoice_date: new Date().toISOString().slice(0, 10),
    items: [],
    payment_method: "",
    notes: "",
  });

  const [currentItem, setCurrentItem] = useState({
    product_id: "",
    quantity: 1,
  });

  /* Preview */
  const [previewInvoice, setPreviewInvoice] = useState(null);

  /* Payment */
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  /* Edit Invoice */
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState(null);

  /* ================= EFFECT ================= */
  useEffect(() => {
    fetchAll();
  }, []);

  /* ================= API ================= */
  const fetchAll = async () => {
    try {
      const [inv, cust, prod] = await Promise.all([
        axios.get(`${API_URL}/invoices`, getAuthHeader()),
        axios.get(`${API_URL}/customers`, getAuthHeader()),
        axios.get(`${API_URL}/products`, getAuthHeader()),
      ]);
      setInvoices(inv.data);
      setCustomers(cust.data);
      setProducts(prod.data);
    } catch {
      toast.error("Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  /* ================= CREATE INVOICE ================= */
  const addItem = () => {
    if (!currentItem.product_id) {
      toast.error("Select product");
      return;
    }

    const product = products.find(p => p.id === currentItem.product_id);
    const qty = Number(currentItem.quantity);

    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: qty,
          price: product.price,
          gst_rate: product.gst_rate,
          total: product.price * qty,
        },
      ],
    }));

    setCurrentItem({ product_id: "", quantity: 1 });
  };

  const removeItem = index => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const createInvoice = async e => {
    e.preventDefault();

    if (!formData.customer_id) {
      toast.error("Select customer");
      return;
    }
    if (!formData.items.length) {
      toast.error("Add at least one product");
      return;
    }

    try {
      await axios.post(`${API_URL}/invoices`, formData, getAuthHeader());
      toast.success("Invoice created");
      setCreateOpen(false);
      setFormData({
        customer_id: "",
        invoice_date: new Date().toISOString().slice(0, 10),
        items: [],
        payment_method: "",
        notes: "",
      });
      fetchAll();
    } catch {
      toast.error("Failed to create invoice");
    }
  };

  /* ================= DELETE ================= */
  const deleteInvoice = async id => {
    if (!confirm("Delete invoice?")) return;
    await axios.delete(`${API_URL}/invoices/${id}`, getAuthHeader());
    toast.success("Invoice deleted");
    fetchAll();
  };

  /* ================= TOTALS ================= */
  const subtotal = formData.items.reduce((s, i) => s + i.total, 0);
  const gst = formData.items.reduce(
    (s, i) => s + (i.total * i.gst_rate) / 100,
    0
  );
  const total = subtotal + gst;

  /* ================= FILTER ================= */
  const filteredInvoices = invoices.filter(
    i =>
      i.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.customer_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ================= RENDER ================= */
  return (
    <div className="space-y-6">

      {/* ================= ADD PAYMENT ================= */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-4">
              <p>Total: ₹{selectedInvoice.total_amount}</p>
              <p>Paid: ₹{selectedInvoice.paid_amount}</p>
              <p className="text-red-600">
                Balance: ₹{selectedInvoice.balance_amount}
              </p>

              <Input
                type="number"
                placeholder="Payment amount"
                value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)}
              />

              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>

              <Button
                className="w-full"
                onClick={async () => {
                  try {
                    await axios.post(
                      `${API_URL}/payments`,
                      {
                        invoice_id: selectedInvoice.id,
                        amount: Number(paymentAmount),
                        payment_method: paymentMethod,
                      },
                      getAuthHeader()
                    );
                    toast.success("Payment added");
                    setPaymentDialogOpen(false);
                    fetchAll();
                  } catch {
                    toast.error("Payment failed");
                  }
                }}
              >
                Save Payment
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= EDIT INVOICE ================= */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
          </DialogHeader>

          {editInvoice && (
            <form
              className="space-y-6"
              onSubmit={async e => {
                e.preventDefault();
                try {
                  await axios.put(
                  `${API_URL}/invoices/${editInvoice.id}`,
                  {
                    invoice_date: editInvoice.created_at?.slice(0, 10),
                    notes: editInvoice.notes || "",
                    items: editInvoice.items.map(i => ({
                      product_id: i.product_id,
                      product_name: i.product_name,
                      quantity: Number(i.quantity),
                      price: Number(i.price),
                      gst_rate: Number(i.gst_rate),
                      total: Number(i.total),
                    }))
                  },
                  getAuthHeader()
                );

                  toast.success("Invoice updated");
                  setEditDialogOpen(false);
                  fetchAll();
                } catch (err) {
                  toast.error(err.response?.data?.detail || "Update failed");
                }
              }}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editInvoice.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.product_name}</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={e => {
                            const qty = Number(e.target.value);
                            const updated = [...editInvoice.items];
                            updated[idx] = {
                              ...updated[idx],
                              quantity: qty,
                              total: qty * updated[idx].price,
                            };
                            setEditInvoice({ ...editInvoice, items: updated });
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={e => {
                            const price = Number(e.target.value);
                            const updated = [...editInvoice.items];
                            updated[idx] = {
                              ...updated[idx],
                              price,
                              total: price * updated[idx].quantity,
                            };
                            setEditInvoice({ ...editInvoice, items: updated });
                          }}
                        />
                      </TableCell>
                      <TableCell>₹{item.total.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button type="submit" className="w-full">
                Update Invoice
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= CREATE INVOICE ================= */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" /> Create Invoice
          </Button>
        </DialogTrigger>

        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Invoice</DialogTitle>
          </DialogHeader>

          <form onSubmit={createInvoice} className="space-y-6">
            {/* customer */}
            <div>
              <Label>Customer *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={v =>
                  setFormData({ ...formData, customer_id: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* date */}
            <div>
              <Label>Invoice Date</Label>
              <Input
                type="date"
                value={formData.invoice_date}
                onChange={e =>
                  setFormData({ ...formData, invoice_date: e.target.value })
                }
              />
            </div>

            {/* items */}
            <div className="border p-4 rounded-lg space-y-4">
              <h3 className="font-semibold">Add Items</h3>

              <div className="grid grid-cols-3 gap-4">
                <Select
                  value={currentItem.product_id}
                  onValueChange={v =>
                    setCurrentItem({ ...currentItem, product_id: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} – ₹{p.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  min="1"
                  value={currentItem.quantity}
                  onChange={e =>
                    setCurrentItem({
                      ...currentItem,
                      quantity: e.target.value,
                    })
                  }
                />

                <Button type="button" onClick={addItem}>
                  Add
                </Button>
              </div>

              {formData.items.length > 0 && (
                <Table>
                  <TableBody>
                    {formData.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.product_name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>₹{item.price}</TableCell>
                        <TableCell>₹{item.total}</TableCell>
                        <TableCell>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => removeItem(i)}
                          >
                            ✕
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST</span>
                  <span>₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">
              Create Invoice
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= SEARCH ================= */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search invoices..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ================= TABLE ================= */}
      <Card>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map(inv => (
                  <TableRow key={inv.id}>
                    <TableCell>{inv.invoice_number}</TableCell>
                    <TableCell>{inv.customer_name}</TableCell>
                    <TableCell>₹{inv.total_amount}</TableCell>
                    <TableCell>₹{inv.paid_amount}</TableCell>
                    <TableCell>₹{inv.balance_amount}</TableCell>
                    <TableCell>{inv.payment_status}</TableCell>
                    <TableCell className="space-x-2">
                      <Button size="icon" variant="ghost" onClick={() => setPreviewInvoice(inv)}>
                        <Eye className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setEditInvoice(JSON.parse(JSON.stringify(inv)));
                          setEditDialogOpen(true);
                        }}
                      >
                        ✏️
                      </Button>

                      {inv.payment_status !== "paid" && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setPaymentDialogOpen(true);
                          }}
                        >
                          <BadgeIndianRupee className="h-5 w-5" />
                        </Button>
                      )}

                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => deleteInvoice(inv.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {previewInvoice && (
        <InvoicePreview
          invoice={previewInvoice}
          onClose={() => setPreviewInvoice(null)}
        />
      )}
    </div>
  );
};

export default Invoices;
