import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, Package, FileText, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_BACKEND_URL + '/api';


const Dashboard = () => {
  const { getAuthHeader } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/stats`, getAuthHeader());
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${stats?.total_revenue?.toLocaleString('en-IN') || 0}`,
      icon: IndianRupee,
      color: 'from-green-500 to-emerald-500',
      testId: 'total-revenue'
    },
    {
      title: 'Customers',
      value: stats?.total_customers || 0,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      testId: 'total-customers'
    },
    {
      title: 'Products',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'from-purple-500 to-pink-500',
      testId: 'total-products'
    },
    {
      title: 'Invoices',
      value: stats?.total_invoices || 0,
      icon: FileText,
      color: 'from-orange-500 to-red-500',
      testId: 'total-invoices'
    },
  ];

  return (
    <div className="space-y-8" data-testid="dashboard">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your business overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden" data-testid={stat.testId}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold font-mono">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Revenue
            </CardTitle>
            <CardDescription>Revenue trends over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.monthly_revenue || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => `₹${value.toLocaleString('en-IN')}`}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Overview</CardTitle>
            <CardDescription>Revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Paid</span>
                <span className="font-mono font-semibold text-green-600 dark:text-green-400">
                  ₹{stats?.paid_revenue?.toLocaleString('en-IN') || 0}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${(stats?.paid_revenue / stats?.total_revenue * 100) || 0}%` }}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pending</span>
                <span className="font-mono font-semibold text-orange-600 dark:text-orange-400">
                  ₹{stats?.pending_revenue?.toLocaleString('en-IN') || 0}
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div 
                  className="bg-orange-500 h-2 rounded-full transition-all"
                  style={{ width: `${(stats?.pending_revenue / stats?.total_revenue * 100) || 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
          <CardDescription>Latest billing activity</CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.recent_invoices?.length > 0 ? (
            <div className="space-y-4">
              {stats.recent_invoices.map((invoice) => (
                <div 
                  key={invoice.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  data-testid="recent-invoice"
                >
                  <div>
                    <p className="font-semibold">{invoice.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">{invoice.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-semibold">₹{invoice.total_amount.toLocaleString('en-IN')}</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      invoice.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : invoice.payment_status === 'partial'
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {invoice.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No invoices yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;