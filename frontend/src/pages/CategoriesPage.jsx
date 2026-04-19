import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { categoriesApi } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Tag, Trash } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import toast from "react-hot-toast";

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { data: categoriesRaw, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });
  const categories = categoriesRaw?.data || [];

  const [formData, setFormData] = useState({ name: "", type: "expense", color: "#6366F1", icon: "tag" });

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? categoriesApi.updateCategory(editingId, data) : categoriesApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(`Category ${editingId ? 'updated' : 'created'}`);
      setIsSheetOpen(false);
    },
    onError: () => toast.error("Failed to save category")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted');
    }
  });

  const openForm = (cat = null) => {
    if (cat) {
      setEditingId(cat.id);
      setFormData({ name: cat.name, type: cat.type, color: cat.color, icon: cat.icon });
    } else {
      setEditingId(null);
      setFormData({ name: "", type: "expense", color: "#6366F1", icon: "tag" });
    }
    setIsSheetOpen(true);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
        <Button onClick={() => openForm()}><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {categories.map(cat => (
          <Card key={cat.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => openForm(cat)}>
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }} />
                <div>
                  <h3 className="font-medium">{cat.name}</h3>
                  <span className={`text-xs ${cat.type === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>{cat.type}</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete category?")) deleteMutation.mutate(cat.id); }}>
                <Trash className="h-4 w-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Category' : 'New Category'}</SheetTitle>
          </SheetHeader>
          <form className="space-y-4 mt-6" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }}>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Groceries" />
            </div>
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
              <Label>Color</Label>
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
