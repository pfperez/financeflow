"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, getCurrentMonth, formatMonth } from "@/lib/format";
import { CATEGORY_NAMES, getCategoryIcon, getCategoryColor } from "@/lib/categories";
import { toast } from "sonner";

interface BudgetWithSpending {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string;
  spent: number;
  percentage: number;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithSpending[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("");
  const [monthlyLimit, setMonthlyLimit] = useState("");
  const [month] = useState(getCurrentMonth());

  const fetchBudgets = useCallback(async () => {
    const res = await fetch(`/api/budgets?month=${month}`);
    setBudgets(await res.json());
    setLoading(false);
  }, [month]);

  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  const createBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, monthlyLimit, month }),
    });
    if (res.ok) {
      toast.success("Budget set!");
      setOpen(false);
      setCategory("");
      setMonthlyLimit("");
      fetchBudgets();
    }
  };

  const deleteBudget = async (id: string) => {
    const res = await fetch(`/api/budgets?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Budget deleted");
      fetchBudgets();
    }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const overBudget = budgets.filter((b) => b.percentage >= 100);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-muted animate-pulse rounded-xl" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-1">{formatMonth(month)}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-sm">
              Set Budget
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Set Monthly Budget</DialogTitle>
            </DialogHeader>
            <form onSubmit={createBudget} className="space-y-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_NAMES.filter((c) => !budgets.find((b) => b.category === c)).map((c) => (
                      <SelectItem key={c} value={c}>{getCategoryIcon(c)} {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monthly Limit</Label>
                <Input type="number" step="0.01" placeholder="500.00" value={monthlyLimit} onChange={(e) => setMonthlyLimit(e.target.value)} required className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white">Set Budget</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(totalBudget)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`h-2.5 w-2.5 rounded-full ${totalBudget - totalSpent >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
              <p className="text-sm font-medium text-muted-foreground">Remaining</p>
            </div>
            <p className={`text-2xl font-bold tracking-tight ${totalBudget - totalSpent >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {formatCurrency(totalBudget - totalSpent)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Over-budget Alert */}
      {overBudget.length > 0 && (
        <Card className="rounded-2xl border-0 border-l-4 border-l-rose-500 shadow-sm bg-rose-50/50 dark:bg-rose-950/20">
          <CardContent className="py-4 px-5">
            <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">
              Over budget in {overBudget.length} {overBudget.length === 1 ? "category" : "categories"}:{" "}
              {overBudget.map((b) => b.category).join(", ")}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Budget Cards */}
      {budgets.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No budgets set for this month. Click &ldquo;Set Budget&rdquo; to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {budgets.map((budget) => {
            const progressColor = budget.percentage >= 100 ? "#ef4444" : budget.percentage >= 75 ? "#eab308" : "#22c55e";
            return (
              <Card key={budget.id} className="group rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
                <CardContent className="pt-6 pb-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(budget.category) + "18" }}
                      >
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: getCategoryColor(budget.category) }}
                        />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{budget.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(budget.spent)} of {formatCurrency(budget.monthlyLimit)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-bold tabular-nums"
                        style={{ color: progressColor }}
                      >
                        {budget.percentage}%
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-600 transition-all duration-200 h-7 w-7 p-0 rounded-lg"
                        onClick={() => deleteBudget(budget.id)}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </Button>
                    </div>
                  </div>
                  <Progress
                    value={budget.percentage}
                    className="h-2.5 rounded-full"
                    style={{
                      // @ts-expect-error CSS custom property
                      "--progress-color": progressColor,
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-3">
                    {formatCurrency(Math.max(0, budget.monthlyLimit - budget.spent))} remaining
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
