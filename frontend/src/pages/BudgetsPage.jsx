import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { budgetsApi, categoriesApi } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Trash, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import toast from "react-hot-toast";
import { useAuth } from "@/store/AuthContext";

export default function BudgetsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { data: budgetsRaw, isLoading } = useQuery({
    queryKey: ['budgets', { month: currentMonth, year: currentYear }],
    queryFn: () => budgetsApi.getBudgets({ month: currentMonth, year: currentYear }),
  });
  const budgets = budgetsRaw?.data || [];

  const { data: cats } = useQuery({ queryKey:['categories'], queryFn: categoriesApi.getCategories });

  const [formData, setFormData] = useState({ category_id: "", month: currentMonth, year: currentYear, amount_limit: "" });

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? budgetsApi.updateBudget(editingId, data) : budgetsApi.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success(`Budget saved`);
      setIsSheetOpen(false);
    },
    onError: () => toast.error("Failed to save budget")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => budgetsApi.deleteBudget(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success('Budget deleted');
    }
  });

  const openForm = (b = null) => {
    if (b) {
      setEditingId(b.id);
      setFormData({ category_id: b.category_id.toString(), month: b.month, year: b.year, amount_limit: b.amount_limit.toString() });
    } else {
      setEditingId(null);
      setFormData({ category_id: "", month: currentMonth, year: currentYear, amount_limit: "" });
    }
    setIsSheetOpen(true);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Budgets ({currentMonth}/{currentYear})</h1>
        <Button onClick={() => openForm()}><Plus className="mr-2 h-4 w-4" /> Add Budget</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map(b => {
          const progress = Math.min((b.spent / b.amount_limit) * 100, 100);
          const isOver = b.spent > b.amount_limit;
          return (
            <Card key={b.id} className="cursor-pointer hover:border-primary/50" onClick={() => openForm(b)}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium flex-1">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: b.category_color }} />
                    {b.category_name}
                  </div>
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete?")) deleteMutation.mutate(b.id); }}>
                  <Trash className="h-4 w-4 text-muted-foreground" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className={`text-2xl font-bold ${isOver ? 'text-destructive' : ''}`}>{b.spent}</span>
                    <span className="text-muted-foreground text-sm"> / {b.amount_limit}</span>
                  </div>
                  {isOver && <AlertCircle className="w-5 h-5 text-destructive" />}
                </div>
                <Progress value={progress} className={isOver ? "bg-destructive/20 [&>div]:bg-destructive" : (progress > 80 ? "[&>div]:bg-amber-500" : "[&>div]:bg-emerald-500")} />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Budget' : 'New Budget'}</SheetTitle>
          </SheetHeader>
          <form className="space-y-4 mt-6" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }}>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select required value={formData.category_id} onValueChange={(v) => setFormData({...formData, category_id: v})}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {(cats?.data || []).filter(c => c.type === 'expense').map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount Limit</Label>
              <Input required type="number" step="0.01" value={formData.amount_limit} onChange={e => setFormData({...formData, amount_limit: e.target.value})} />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={saveMutation.isPending}>Save</Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
