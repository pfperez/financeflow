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
import { BILL_FREQUENCIES, CATEGORY_NAMES, getCategoryIcon } from "@/lib/categories";
import { toast } from "sonner";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: string;
  category: string;
  isPaid: boolean;
}

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [category, setCategory] = useState("Bills & Utilities");

  const fetchBills = useCallback(async () => {
    const res = await fetch("/api/bills");
    setBills(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const addBill = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, amount, dueDate, frequency, category }),
    });
    if (res.ok) {
      toast.success("Bill added!");
      setOpen(false);
      setName("");
      setAmount("");
      setDueDate("");
      fetchBills();
    }
  };

  const togglePaid = async (id: string, isPaid: boolean) => {
    await fetch("/api/bills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isPaid: !isPaid }),
    });
    fetchBills();
  };

  const deleteBill = async (id: string) => {
    if (!confirm("Delete this bill?")) return;
    await fetch(`/api/bills?id=${id}`, { method: "DELETE" });
    toast.success("Bill deleted");
    fetchBills();
  };

  const unpaidBills = bills.filter((b) => !b.isPaid);
  const paidBills = bills.filter((b) => b.isPaid);
  const totalUnpaid = unpaidBills.reduce((s, b) => s + b.amount, 0);
  const now = new Date();
  const overdueBills = unpaidBills.filter((b) => new Date(b.dueDate) < now);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-52 bg-muted animate-pulse rounded-xl" />
          <div className="h-4 w-36 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-muted animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Bills & Reminders</h1>
          <p className="text-sm text-muted-foreground mt-1">{bills.length} bills tracked</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-sm">
              Add Bill
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>Add Bill</DialogTitle>
            </DialogHeader>
            <form onSubmit={addBill} className="space-y-4">
              <div className="space-y-2">
                <Label>Bill Name</Label>
                <Input placeholder="e.g. Electric Bill" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
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
                      {BILL_FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="rounded-xl" />
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
              <Button type="submit" className="w-full rounded-xl bg-gray-900 hover:bg-gray-800 text-white">Add Bill</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
              <p className="text-sm font-medium text-muted-foreground">Unpaid Bills</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">{unpaidBills.length}</p>
            <p className="text-xs text-muted-foreground mt-1">{formatCurrency(totalUnpaid)} total</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm font-medium text-muted-foreground">Paid This Month</p>
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">{paidBills.length}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`h-2.5 w-2.5 rounded-full ${overdueBills.length > 0 ? "bg-rose-500" : "bg-emerald-500"}`} />
              <p className="text-sm font-medium text-muted-foreground">Overdue</p>
            </div>
            <p className={`text-2xl font-bold tracking-tight ${overdueBills.length > 0 ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
              {overdueBills.length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Unpaid Bills */}
      {unpaidBills.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Upcoming & Overdue</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {unpaidBills.map((bill) => {
              const isOverdue = new Date(bill.dueDate) < now;
              return (
                <div
                  key={bill.id}
                  className={`flex items-center justify-between p-3.5 rounded-xl hover:bg-accent/50 transition-all duration-200 group ${isOverdue ? "border-l-[3px] border-l-rose-500" : ""}`}
                >
                  <div className="flex items-center gap-3.5">
                    <button
                      onClick={() => togglePaid(bill.id, bill.isPaid)}
                      className="h-5 w-5 rounded-md border-2 border-muted-foreground/25 hover:border-gray-400 transition-colors duration-200 flex items-center justify-center flex-shrink-0"
                    />
                    <div>
                      <p className="font-medium text-sm">{bill.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-xs ${isOverdue ? "text-rose-600 dark:text-rose-400 font-semibold" : "text-muted-foreground"}`}>
                          Due {formatDate(bill.dueDate)}
                        </span>
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 rounded-md font-medium">{bill.frequency}</Badge>
                        {isOverdue && (
                          <Badge className="text-[10px] px-1.5 py-0 h-4 rounded-md font-medium bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-0">
                            Overdue
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <p className="font-semibold text-sm tabular-nums">{formatCurrency(bill.amount)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-600 transition-all duration-200 h-7 w-7 p-0 rounded-lg"
                      onClick={() => deleteBill(bill.id)}
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Paid Bills */}
      {paidBills.length > 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Paid</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {paidBills.map((bill) => (
              <div key={bill.id} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-accent/50 transition-all duration-200 group opacity-50">
                <div className="flex items-center gap-3.5">
                  <button
                    onClick={() => togglePaid(bill.id, bill.isPaid)}
                    className="h-5 w-5 rounded-md bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 transition-colors duration-200"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <div>
                    <p className="font-medium text-sm line-through text-muted-foreground">{bill.name}</p>
                    <span className="text-xs text-muted-foreground">{formatDate(bill.dueDate)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <p className="font-semibold text-sm tabular-nums">{formatCurrency(bill.amount)}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-rose-600 transition-all duration-200 h-7 w-7 p-0 rounded-lg"
                    onClick={() => deleteBill(bill.id)}
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

      {bills.length === 0 && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">No bills yet. Click &ldquo;Add Bill&rdquo; to track your recurring payments.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
