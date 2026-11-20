"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency, formatDate } from "@/lib/format";
import { CATEGORY_NAMES, getCategoryColor, getCategoryIcon } from "@/lib/categories";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface RecurringTransaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  merchant: string | null;
  note: string | null;
  frequency: string;
  startDate: string;
  nextRunDate: string;
  isActive: boolean;
  account: { name: string; type: string; color: string };
}

const FREQUENCIES = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function RecurringPage() {
  const [recurring, setRecurring] = useState<RecurringTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  // Form
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("debit");
  const [category, setCategory] = useState("Bills & Utilities");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState("");

  const fetchData = useCallback(async () => {
    const [recRes, accRes] = await Promise.all([
      fetch("/api/recurring-transactions"),
      fetch("/api/accounts"),
    ]);
    setRecurring(await recRes.json());
    setAccounts(await accRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process due recurring transactions on page load
  useEffect(() => {
    fetch("/api/recurring-transactions", { method: "PATCH" }).then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.processed > 0) {
          toast.success(`Processed ${data.processed} recurring transaction(s)`);
          fetchData();
        }
      }
    }).catch(() => {});
  }, [fetchData]);

  const createRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/recurring-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, amount, type, category, merchant, note, frequency, startDate }),
    });
    if (res.ok) {
      toast.success("Recurring transaction created!");
      setOpen(false);
      setAmount("");
      setMerchant("");
      setNote("");
      setStartDate("");
      fetchData();
    }
  };

  const deleteRecurring = async (id: string) => {
    if (!confirm("Delete this recurring transaction?")) return;
    await fetch(`/api/recurring-transactions?id=${id}`, { method: "DELETE" });
    toast.success("Recurring transaction deleted");
    fetchData();
  };

  const activeCount = recurring.filter((r) => r.isActive).length;
  const monthlyTotal = recurring
    .filter((r) => r.isActive && r.type === "debit")
    .reduce((sum, r) => {
      let monthly = r.amount;
      if (r.frequency === "daily") monthly = r.amount * 30;
      if (r.frequency === "weekly") monthly = r.amount * 4.33;
      if (r.frequency === "biweekly") monthly = r.amount * 2.17;
      if (r.frequency === "yearly") monthly = r.amount / 12;
      return sum + monthly;
    }, 0);
  const monthlyIncome = recurring
    .filter((r) => r.isActive && r.type === "credit")
    .reduce((sum, r) => {
      let monthly = r.amount;
      if (r.frequency === "daily") monthly = r.amount * 30;
      if (r.frequency === "weekly") monthly = r.amount * 4.33;
      if (r.frequency === "biweekly") monthly = r.amount * 2.17;
      if (r.frequency === "yearly") monthly = r.amount / 12;
      return sum + monthly;
    }, 0);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-muted animate-pulse rounded-xl" />
          <div className="h-4 w-36 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recurring Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">Automate your regular income & expenses</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-sm">
              Add Recurring
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>New Recurring Transaction</DialogTitle>
            </DialogHeader>
            <form onSubmit={createRecurring} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="debit">Expense</SelectItem>
                      <SelectItem value="credit">Income</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select value={frequency} onValueChange={setFrequency}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORY_NAMES.map((c) => (
                      <SelectItem key={c} value={c}>{getCategoryIcon(c)} {c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Merchant / Description</Label>
                <Input placeholder="e.g. Netflix, Rent" value={merchant} onChange={(e) => setMerchant(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Input placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl" />
              </div>
              <Button type="submit" className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white">Create</Button>
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
              <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <p className="text-sm font-medium text-muted-foreground">Monthly Expenses</p>
            </div>
            <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatCurrency(monthlyTotal)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm font-medium text-muted-foreground">Monthly Income</p>
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(monthlyIncome)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {recurring.length === 0 ? (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No recurring transactions yet. Set up automated entries for regular income and expenses.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">All Recurring Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {recurring.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-accent/50 transition-all duration-200 group">
                <div className="flex items-center gap-3.5">
                  <div
                    className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                    style={{ backgroundColor: getCategoryColor(r.category) }}
                  >
                    {getCategoryIcon(r.category)}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{r.merchant || r.category}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-muted-foreground">{r.account.name}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-md font-medium">
                        {r.frequency}
                      </Badge>
                      {!r.isActive && (
                        <Badge className="text-[10px] px-1.5 py-0 h-4 rounded-md font-medium bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-0">
                          Paused
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        Next: {formatDate(r.nextRunDate)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <p className={`font-semibold text-sm tabular-nums ${r.type === "credit" ? "text-emerald-600 dark:text-emerald-400" : ""}`}>
                    {r.type === "credit" ? "+" : "-"}{formatCurrency(r.amount)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-600 transition-all duration-200 h-7 w-7 p-0 rounded-lg"
                    onClick={() => deleteRecurring(r.id)}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
