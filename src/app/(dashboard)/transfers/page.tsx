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
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
}

interface Transfer {
  id: string;
  amount: number;
  status: string;
  note: string | null;
  date: string;
  fromAccount: { name: string; color: string };
  toAccount: { name: string; color: string };
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");

  const fetchData = useCallback(async () => {
    const [tRes, aRes] = await Promise.all([
      fetch("/api/transfers"),
      fetch("/api/accounts"),
    ]);
    setTransfers(await tRes.json());
    setAccounts(await aRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromAccountId: fromId, toAccountId: toId, amount, note }),
    });
    if (res.ok) {
      toast.success("Transfer completed!");
      setOpen(false);
      setAmount("");
      setNote("");
      fetchData();
    } else {
      const data = await res.json();
      toast.error(data.error || "Transfer failed");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-40 bg-muted animate-pulse rounded-2xl" />
            <div className="h-4 w-56 bg-muted animate-pulse rounded-xl" />
          </div>
          <div className="h-10 w-36 bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 w-56 bg-muted animate-pulse rounded-2xl shrink-0" />
          ))}
        </div>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6 space-y-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <div className="h-11 w-11 bg-muted animate-pulse rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-muted animate-pulse rounded-lg" />
                  <div className="h-3 w-24 bg-muted animate-pulse rounded-lg" />
                </div>
                <div className="h-5 w-20 bg-muted animate-pulse rounded-lg" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Transfers</h1>
          <p className="text-sm text-muted-foreground mt-1">Move money between your accounts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xl bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200">
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              New Transfer
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl sm:rounded-2xl p-0 overflow-hidden border-0 shadow-xl">
            <DialogHeader className="px-6 pt-6 pb-2">
              <DialogTitle className="text-lg font-semibold">Transfer Money</DialogTitle>
            </DialogHeader>
            <form onSubmit={createTransfer} className="px-6 pb-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">From Account</Label>
                <Select value={fromId} onValueChange={setFromId}>
                  <SelectTrigger className="rounded-xl bg-card border-border/50 h-11"><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id} className="rounded-lg">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                          {a.name} ({formatCurrency(a.balance)})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visual Arrow Indicator */}
              <div className="flex justify-center py-1">
                <div className="h-10 w-10 rounded-xl bg-gray-900 flex items-center justify-center shadow-sm">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">To Account</Label>
                <Select value={toId} onValueChange={setToId}>
                  <SelectTrigger className="rounded-xl bg-card border-border/50 h-11"><SelectValue placeholder="Select destination" /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {accounts.filter((a) => a.id !== fromId).map((a) => (
                      <SelectItem key={a.id} value={a.id} className="rounded-lg">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                          {a.name} ({formatCurrency(a.balance)})
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</Label>
                <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="rounded-xl bg-card border-border/50 h-11" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Note (optional)</Label>
                <Input placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl bg-card border-border/50 h-11" />
              </div>
              <Button type="submit" className="w-full rounded-xl h-11 bg-gray-900 hover:bg-gray-800 text-white shadow-sm transition-all duration-200 font-medium">
                Transfer
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Account Cards */}
      {accounts.length >= 2 && (
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className="rounded-2xl border-0 shadow-sm shrink-0 min-w-[200px] overflow-hidden transition-shadow duration-200 hover:shadow-md"
            >
              <CardContent className="p-0">
                <div className="flex">
                  <div className="w-1.5 shrink-0" style={{ backgroundColor: account.color }} />
                  <div className="px-4 py-3.5">
                    <p className="text-xs font-medium text-muted-foreground">{account.name}</p>
                    <p className={`text-lg font-bold tabular-nums mt-0.5 ${account.balance >= 0 ? "text-foreground" : "text-red-400"}`}>
                      {formatCurrency(account.balance)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Transfer History */}
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        <CardHeader className="pb-2 px-5 pt-5">
          <CardTitle className="text-base font-semibold">Transfer History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transfers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <svg className="h-7 w-7 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">No transfers yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Move money between your accounts to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {transfers.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 transition-colors duration-150">
                  <div className="flex items-center gap-4">
                    <div className="h-11 w-11 rounded-xl bg-gray-900 flex items-center justify-center shrink-0 shadow-sm">
                      <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">
                        {t.fromAccount.name}
                        <span className="text-muted-foreground font-normal mx-1.5">to</span>
                        {t.toAccount.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatDate(t.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-sm tabular-nums">{formatCurrency(t.amount)}</p>
                    <Badge
                      variant={t.status === "completed" ? "default" : "secondary"}
                      className={`rounded-lg text-[11px] font-medium ${
                        t.status === "completed"
                          ? "bg-gray-100 text-gray-800 hover:bg-gray-100 dark:bg-gray-500/15 dark:text-gray-600"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {t.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
