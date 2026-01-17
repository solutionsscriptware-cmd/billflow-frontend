import React, { useState, useEffect } from 'react';
import api from '@/api';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Package,
  FileText,
  IndianRupee,
} from 'lucide-react';
import { toast } from 'sonner';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/dashboard/stats');
      setStats(res.data);
    } catch (error) {
      console.error(error);
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
      testId: 'total-revenue',
    },
    {
      title: 'Customers',
      value: stats?.total_customers || 0,
      icon: Users,
      color: 'from-blue-500 to-cyan-500',
      testId: 'total-customers',
    },
    {
      title: 'Products',
      value: stats?.total_products || 0,
      icon: Package,
      color: 'from-purple-500 to-pink-500',
      testId: 'total-products',
    },
    {
      title: 'Invoices',
      value: stats?.total_invoices || 0,
      icon: FileText,
      color: 'from-orange-500 to-red-500',
      testId: 'total-invoices',
    },
  ];

  const totalRevenue = stats?.total_revenue || 0;
  const paidRevenue = stats?.paid_revenue || 0;
  const pendingRevenue = stats?.pending_revenue || 0;

  const paidPercent =
    totalRevenue > 0 ? (paidRevenue / totalRevenue) * 100 : 0;
  const pendingPercent =
    totalRevenue > 0 ? (pendingRevenue / totalRevenue) * 100 : 0;

  return (
    <div className="space-y-8" data-testid="dashboard">
      <div>
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your business overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} data-testid={stat.testId}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-3xl font-bold font-mono">{stat.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Revenue
            </CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats?.monthly_revenue || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value) =>
                    `₹${Number(value).toLocaleString('en-IN')}`
                  }
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Payment Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Overview</CardTitle>
            <CardDescription>Revenue breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm">
                <span>Paid</span>
                <span className="font-mono text-green-600">
                  ₹{paidRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full mt-1">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm">
                <span>Pending</span>
                <span className="font-mono text-orange-600">
                  ₹{pendingRevenue.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="w-full bg-secondary h-2 rounded-full mt-1">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${pendingPercent}%` }}
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
          {stats?.recent_invoices?.length ? (
            <div className="space-y-4">
              {stats.recent_invoices.map((inv) => (
                <div
                  key={inv.id}
                  className="flex justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-semibold">{inv.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {inv.customer_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono">
                      ₹{inv.total_amount.toLocaleString('en-IN')}
                    </p>
                    <span className="text-xs capitalize">
                      {inv.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-6">
              No invoices yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
