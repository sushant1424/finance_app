import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { transactionsApi, accountsApi, categoriesApi } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Download, AlertCircle, Trash } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import toast from "react-hot-toast";

export default function TransactionsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  
  const { data: transactionsRaw, isLoading } = useQuery({
    queryKey: ['transactions', filterType],
    queryFn: () => transactionsApi.getTransactions({ type: filterType === 'all' ? undefined : filterType, limit: 100 }),
  });
  const transactions = transactionsRaw?.data || [];

  const { data: accs } = useQuery({ queryKey:['accounts'], queryFn: accountsApi.getAccounts });
  const { data: cats } = useQuery({ queryKey:['categories'], queryFn: categoriesApi.getCategories });
  
  const [formData, setFormData] = useState({ amount: "", type: "expense", category_id: "", account_id: "", date: new Date().toISOString().split('T')[0], note: "" });

  const saveMutation = useMutation({
    mutationFn: (data) => transactionsApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(`Transaction added`);
      setIsSheetOpen(false);
    },
    onError: () => toast.error("Failed to add transaction")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => transactionsApi.deleteTransaction(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Transaction deleted');
    }
  });

  const handleExport = async () => {
    try {
      const data = await transactionsApi.exportCsv();
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transactions.csv');
      document.body.appendChild(link);
      link.click();
    } catch {
      toast.error("Export failed");
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export</Button>
          <Button onClick={() => { setFormData({ amount: "", type: "expense", category_id: "", account_id: "", date: new Date().toISOString().split('T')[0], note: "" }); setIsSheetOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Add Transaction
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Account</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map(tx => (
              <TableRow key={tx.id}>
                <TableCell>{tx.date}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {tx.note || '-'}
                    {tx.is_anomaly && <Badge variant="destructive" className="ml-2"><AlertCircle className="w-3 h-3 mr-1"/> Anomaly</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  {tx.category_name && <Badge variant="outline" style={{ borderColor: tx.category_color, color: tx.category_color }}>{tx.category_name}</Badge>}
                </TableCell>
                <TableCell>{tx.account_name}</TableCell>
                <TableCell className={`text-right font-medium ${tx.type === 'income' ? 'text-emerald-500' : 'text-slate-900 dark:text-slate-100'}`}>
                  {tx.type === 'income' ? '+' : '-'}{new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.currency }).format(tx.amount)}
                </TableCell>
                <TableCell className="text-right">
                   <Button variant="ghost" size="icon" onClick={() => { if (window.confirm("Delete transaction?")) deleteMutation.mutate(tx.id); }}>
                    <Trash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">No transactions found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>New Transaction</SheetTitle>
          </SheetHeader>
          <form className="space-y-4 mt-6" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }}>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input required type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Account</Label>
              <Select required value={formData.account_id} onValueChange={(v) => setFormData({...formData, account_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                <SelectContent>
                  {(accs?.data || []).map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select required value={formData.category_id} onValueChange={(v) => setFormData({...formData, category_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(cats?.data || []).filter(c => c.type === formData.type).map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Date</Label>
              <Input required type="date" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Note (Optional)</Label>
              <Input value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={saveMutation.isPending}>Save</Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
