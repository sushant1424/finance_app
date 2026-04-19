import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { goalsApi } from "@/api/endpoints";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Trash, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import toast from "react-hot-toast";

export default function GoalsPage() {
  const queryClient = useQueryClient();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const { data: goalsRaw, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalsApi.getGoals,
  });
  const goals = goalsRaw?.data || [];

  const [formData, setFormData] = useState({ name: "", target_amount: "", current_amount: "0", deadline: "" });

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? goalsApi.updateGoal(editingId, data) : goalsApi.createGoal(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success(`Goal saved`);
      setIsSheetOpen(false);
    },
    onError: () => toast.error("Failed to save goal")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => goalsApi.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted');
    }
  });

  const openForm = (g = null) => {
    if (g) {
      setEditingId(g.id);
      setFormData({ name: g.name, target_amount: g.target_amount.toString(), current_amount: g.current_amount.toString(), deadline: g.deadline || "" });
    } else {
      setEditingId(null);
      setFormData({ name: "", target_amount: "", current_amount: "0", deadline: "" });
    }
    setIsSheetOpen(true);
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Financial Goals</h1>
        <Button onClick={() => openForm()}><Plus className="mr-2 h-4 w-4" /> Add Goal</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {goals.map(g => {
          const progress = Math.min((g.current_amount / g.target_amount) * 100, 100);
          return (
            <Card key={g.id} className="cursor-pointer hover:border-primary/50" onClick={() => openForm(g)}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                      {g.name} {g.is_complete && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </CardTitle>
                    <CardDescription>{g.deadline ? `Deadline: ${g.deadline}` : 'No deadline'}</CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); if (window.confirm("Delete?")) deleteMutation.mutate(g.id); }}>
                    <Trash className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between font-medium">
                  <span className="text-2xl">{g.current_amount}</span>
                  <span className="text-muted-foreground self-end mb-1">Target: {g.target_amount}</span>
                </div>
                <Progress value={progress} className={g.is_complete ? "[&>div]:bg-emerald-500" : "[&>div]:bg-primary"} />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{progress.toFixed(1)}% Completed</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editingId ? 'Edit Goal' : 'New Goal'}</SheetTitle>
          </SheetHeader>
          <form className="space-y-4 mt-6" onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(formData); }}>
            <div className="space-y-2">
              <Label>Goal Name</Label>
              <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="New Car" />
            </div>
            <div className="space-y-2">
              <Label>Target Amount</Label>
              <Input required type="number" step="0.01" value={formData.target_amount} onChange={e => setFormData({...formData, target_amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Current Saved</Label>
              <Input required type="number" step="0.01" value={formData.current_amount} onChange={e => setFormData({...formData, current_amount: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input type="date" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={saveMutation.isPending}>Save</Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
