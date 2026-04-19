import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { parseISO, format } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { reportsApi, transactionsApi } from "@/api/endpoints";
import { ArrowDownRight, ArrowUpRight, DollarSign, Activity, Wallet } from "lucide-react";
import { useAuth } from "@/store/AuthContext";

const formatCurrency = (amount, currency = "NPR") => {
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency }).format(amount);
};

export default function DashboardPage() {
  const { user } = useAuth();
  
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['reports-summary'],
    queryFn: () => reportsApi.getSummary({}),
  });

  const { data: transactionsData, isLoading: txLoading } = useQuery({
    queryKey: ['transactions', { limit: 5 }],
    queryFn: () => transactionsApi.getTransactions({ limit: 5 }),
  });

  if (summaryLoading || txLoading) return <div>Loading dashboard...</div>;

  const summary = summaryData?.data;
  const recentTx = transactionsData?.data || [];

  const PIE_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance (Net)</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary?.net < 0 ? 'text-destructive' : ''}`}>
              {formatCurrency(summary?.net, user?.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-500">
              {formatCurrency(summary?.total_income, user?.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(summary?.total_expenses, user?.currency)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.transaction_count}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Income vs Expense</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary?.monthly_chart || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <RechartsTooltip formatter={(value) => formatCurrency(value, user?.currency)} />
                  <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Expense by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={summary?.category_breakdown?.slice(0, 5) || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="amount"
                    nameKey="category_name"
                  >
                    {(summary?.category_breakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.category_color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value, user?.currency)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            You made {summary?.transaction_count} transactions total.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {recentTx.map((tx) => (
              <div key={tx.id} className="flex items-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="ml-4 space-y-1 overflow-hidden">
                  <p className="text-sm font-medium leading-none truncate">{tx.note || "No description"}</p>
                  <p className="text-sm text-muted-foreground">
                    {tx.category_name} • {tx.account_name} 
                  </p>
                </div>
                <div className={`ml-auto font-medium ${tx.type === 'income' ? 'text-emerald-500' : ''}`}>
                  {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount, user?.currency)}
                </div>
              </div>
            ))}
            {recentTx.length === 0 && <p className="text-muted-foreground text-sm">No recent transactions.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
