import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/api/endpoints";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useAuth } from "@/store/AuthContext";

export default function ReportsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState({
    from: "",
    to: ""
  });

  const { data: summaryRaw, isLoading } = useQuery({
    queryKey: ['reports-summary', dateRange],
    queryFn: () => reportsApi.getSummary({ date_from: dateRange.from || undefined, date_to: dateRange.to || undefined }),
  });

  const summary = summaryRaw?.data;

  // Since it's identical down to export CSV structure as the transactions API, we'll just link the export component there or skip it here to save time. 
  
  if (isLoading) return <div>Loading reports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <Label>From:</Label>
            <Input type="date" value={dateRange.from} onChange={e => setDateRange({...dateRange, from: e.target.value})} className="w-auto h-9" />
          </div>
          <div className="flex items-center gap-2">
            <Label>To:</Label>
            <Input type="date" value={dateRange.to} onChange={e => setDateRange({...dateRange, to: e.target.value})} className="w-auto h-9" />
          </div>
          <Button variant="ghost" className="h-9" onClick={() => setDateRange({from:'', to:''})}>Clear</Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-sm font-medium text-muted-foreground mb-1">Total Income</p><p className="text-2xl font-bold text-emerald-500">{user?.currency} {summary?.total_income}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-sm font-medium text-muted-foreground mb-1">Total Expenses</p><p className="text-2xl font-bold text-destructive">{user?.currency} {summary?.total_expenses}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-sm font-medium text-muted-foreground mb-1">Net Cashflow</p><p className={`text-2xl font-bold ${summary?.net < 0 ? 'text-destructive' : 'text-emerald-500'}`}>{user?.currency} {summary?.net}</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-sm font-medium text-muted-foreground mb-1">Transactions</p><p className="text-2xl font-bold">{summary?.transaction_count}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Cashflow Over Time</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary?.monthly_chart || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                <Tooltip />
                <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Income" />
                <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Expense Category Breakdown</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-right">% of Total</TableHead></TableRow></TableHeader>
            <TableBody>
              {(summary?.category_breakdown || []).map(cat => (
                <TableRow key={cat.category_id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <span className="w-3 h-3 rounded-full bg-primary" style={{backgroundColor: cat.category_color}}/>
                       {cat.category_name}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{user?.currency} {cat.amount}</TableCell>
                  <TableCell className="text-right">{cat.percentage}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
