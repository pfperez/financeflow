"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { toast } from "sonner";

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  createdAt: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [addFundsId, setAddFundsId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");

  // Form
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [currentAmount, setCurrentAmount] = useState("");
  const [deadline, setDeadline] = useState("");

  const fetchGoals = useCallback(async () => {
    const res = await fetch("/api/goals");
    setGoals(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, targetAmount, currentAmount: currentAmount || "0", deadline: deadline || null }),
    });
    if (res.ok) {
      toast.success("Goal created!");
      setOpen(false);
      setName("");
      setTargetAmount("");
      setCurrentAmount("");
      setDeadline("");
      fetchGoals();
    }
  };

  const updateGoalAmount = async (id: string, newAmount: number) => {
    await fetch("/api/goals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, currentAmount: newAmount.toString() }),
    });
    setAddFundsId(null);
    setAddAmount("");
    fetchGoals();
    toast.success("Funds updated!");
  };

  const deleteGoal = async (id: string) => {
    if (!confirm("Delete this savings goal?")) return;
    await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
    toast.success("Goal deleted");
    fetchGoals();
  };

  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted animate-pulse rounded-xl" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Savings Goals</h1>
          <p className="text-sm text-muted-foreground mt-1">{goals.length} active goals</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-sm">
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Create Savings Goal</DialogTitle>
            </DialogHeader>
            <form onSubmit={createGoal} className="space-y-4">
              <div className="space-y-2">
                <Label>Goal Name</Label>
                <Input placeholder="e.g. Vacation Fund" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Target Amount</Label>
                  <Input type="number" step="0.01" placeholder="5000.00" value={targetAmount} onChange={(e) => setTargetAmount(e.target.value)} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Current Savings</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={currentAmount} onChange={(e) => setCurrentAmount(e.target.value)} className="rounded-xl" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Target Date (optional)</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white">Create Goal</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm font-medium text-muted-foreground">Total Saved</p>
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{formatCurrency(totalSaved)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
              <p className="text-sm font-medium text-muted-foreground">Total Target</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(totalTarget)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
              <p className="text-sm font-medium text-muted-foreground">Overall Progress</p>
            </div>
            <div className="flex items-end gap-3">
              <p className="text-2xl font-bold tracking-tight">{overallProgress}%</p>
              <div className="flex-1 pb-1.5">
                <Progress value={overallProgress} className="h-2 rounded-full" style={{
                  // @ts-expect-error CSS custom property
                  "--progress-color": "#8b5cf6",
                }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No savings goals yet. Create one to start tracking your progress.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const isComplete = pct >= 100;
            return (
              <Card key={goal.id} className="group rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-start justify-between mb-5">
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isComplete ? "bg-emerald-100 dark:bg-emerald-950" : "bg-gray-100"}`}>
                        {isComplete ? (
                          <svg className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="h-4.5 w-4.5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-[15px] leading-tight">{goal.name}</h3>
                        {goal.deadline && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Target: {formatDate(goal.deadline)}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-600 transition-all duration-200 h-7 w-7 p-0 rounded-lg"
                      onClick={() => deleteGoal(goal.id)}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-semibold tabular-nums">{pct}%</span>
                    </div>
                    <Progress value={pct} className="h-2.5 rounded-full" style={{
                      // @ts-expect-error CSS custom property
                      "--progress-color": isComplete ? "#22c55e" : "#8b5cf6",
                    }} />
                    <div className="flex justify-between text-sm">
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                        {formatCurrency(goal.currentAmount)}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        of {formatCurrency(goal.targetAmount)}
                      </span>
                    </div>

                    {/* Add funds */}
                    {addFundsId === goal.id ? (
                      <div className="flex gap-2 mt-1">
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Amount"
                          value={addAmount}
                          onChange={(e) => setAddAmount(e.target.value)}
                          className="flex-1 rounded-xl h-9 text-sm"
                        />
                        <Button
                          size="sm"
                          className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white h-9 px-4"
                          onClick={() =>
                            updateGoalAmount(
                              goal.id,
                              goal.currentAmount + parseFloat(addAmount || "0")
                            )
                          }
                        >
                          Add
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-xl h-9 px-3"
                          onClick={() => {
                            setAddFundsId(null);
                            setAddAmount("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-1 rounded-xl h-9 text-sm border-dashed hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-violet-950/30 transition-colors duration-200"
                        onClick={() => setAddFundsId(goal.id)}
                      >
                        Add Funds
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
