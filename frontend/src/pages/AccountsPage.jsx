import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { accountsApi } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Wallet, Building2, Smartphone, CreditCard, Trash } from "lucide-react";
import { useAuth } from "@/store/AuthContext";
import toast from "react-hot-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AccountsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { data: accountsRaw, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountsApi.getAccounts,
  });
  const accounts = accountsRaw?.data || [];

  const [formData, setFormData] = useState({ name: "", type: "bank", balance: "0", color: "#3B82F6", icon: "wallet" });

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? accountsApi.updateAccount(editingId, data) : accountsApi.createAccount(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success(`Account ${editingId ? 'updated' : 'created'}`);
      setIsSheetOpen(false);
    },
    onError: () => toast.error("Failed to save account")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => accountsApi.deleteAccount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account deleted');
    }
  });

  const openForm = (acc = null) => {
    if (acc) {
      setEditingId(acc.id);
      setFormData({ name: acc.name, type: acc.type, balance: acc.balance.toString(), color: acc.color, icon: acc.icon });
    } else {
      setEditingId(null);
      setFormData({ name: "", type: "bank", balance: "0", color: "#3B82F6", icon: "wallet" });
    }
    setIsSheetOpen(true);
  };

  const getIcon = (type) => {
    switch (type) {
      case 'bank': return <Building2 className="h-6 w-6" />;
      case 'wallet': return <Smartphone className="h-6 w-6" />;
      case 'credit': return <CreditCard className="h-6 w-6" />;
      default: return <Wallet className="h-6 w-6" />;
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Accounts</h1>
        <Button onClick={() => openForm()}><Plus className="mr-2 h-4 w-4" /> Add Account</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map(acc => (
          <Card key={acc.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openForm(acc)}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <div className="p-2 rounded-full" style={{ backgroundColor: `${acc.color}20`, color: acc.color }}>
                  {getIcon(acc.type)}
                </div>
                {acc.name}
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete account?")) deleteMutation.mutate(acc.id); }}>
                <Trash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${acc.balance < 0 ? 'text-destructive' : ''}`}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: user?.currency }).format(acc.balance)}
              </div>
              <p className="text-xs text-muted-foreground capitalize mt-1">{acc.type}</p>
            </CardContent>
          </Card>
        ))}
        {accounts.length === 0 && <p className="text-muted-foreground col-span-full">No accounts found.</p>}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Account' : 'New Account'}</SheetTitle>
          </SheetHeader>
          <form className="space-y-4 mt-6" onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate(formData);
          }}>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Main Bank" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="wallet">E-Wallet</SelectItem>
                  <SelectItem value="credit">Credit Card</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {!editingId && (
              <div className="space-y-2">
                <Label>Initial Balance</Label>
                <Input type="number" step="0.01" value={formData.balance} onChange={e => setFormData({...formData, balance: e.target.value})} />
              </div>
            )}
            <div className="space-y-2">
              <Label>Color (Hex)</Label>
              <div className="flex gap-2">
                <Input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-12 h-10 p-1" />
                <Input value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} />
              </div>
            </div>
            <Button type="submit" className="w-full mt-4" disabled={saveMutation.isPending}>Save</Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
