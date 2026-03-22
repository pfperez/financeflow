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
import { CATEGORY_NAMES, getCategoryIcon, getCategoryColor } from "@/lib/categories";
import { toast } from "sonner";

interface Account {
  id: string;
  name: string;
  type: string;
  color: string;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  merchant: string | null;
  note: string | null;
  date: string;
  account: { name: string; type: string; color: string };
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Form state
  const [accountId, setAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("debit");
  const [category, setCategory] = useState("Other");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ limit: "20", page: String(page) });
    if (search) params.set("search", search);
    if (filterCategory !== "all") params.set("category", filterCategory);
    if (filterType !== "all") params.set("type", filterType);

    const [txRes, accRes] = await Promise.all([
      fetch(`/api/transactions?${params}`),
      fetch("/api/accounts"),
    ]);
    const txData = await txRes.json();
    setTransactions(txData.transactions);
    setTotalPages(txData.totalPages);
    setTotalCount(txData.total);
    setAccounts(await accRes.json());
    setLoading(false);
  }, [search, filterCategory, filterType, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, amount, type, category, merchant, note, date }),
    });
    if (res.ok) {
      toast.success("Transaction added!");
      setOpen(false);
      setAmount("");
      setMerchant("");
      setNote("");
      fetchData();
    } else {
      toast.error("Failed to add transaction");
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    const res = await fetch(`/api/transactions?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Transaction deleted");
      fetchData();
    }
  };

  const exportCSV = () => {
    const header = "Date,Merchant,Category,Type,Amount,Account,Note\n";
    const rows = transactions
      .map((t) => `${formatDate(t.date)},"${t.merchant || ""}","${t.category}",${t.type},${t.amount},"${t.account.name}","${t.note || ""}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted animate-pulse rounded-2xl" />
            <div className="h-4 w-32 bg-muted animate-pulse rounded-xl" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-muted animate-pulse rounded-xl" />
            <div className="h-10 w-36 bg-muted animate-pulse rounded-xl" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-xl" />
          <div className="h-10 w-40 bg-muted animate-pulse rounded-xl" />
          <div className="h-10 w-36 bg-muted animate-pulse rounded-xl" />
        </div>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-6 space-y-1">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4">
                <div className="h-11 w-11 bg-muted animate-pulse rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted animate-pulse rounded-lg" />
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
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {totalCount} transaction{totalCount !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            onClick={exportCSV}
            className="rounded-xl text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20 transition-all duration-200">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl sm:rounded-2xl p-0 overflow-hidden border-0 shadow-xl">
              <DialogHeader className="px-6 pt-6 pb-2">
                <DialogTitle className="text-lg font-semibold">Add Transaction</DialogTitle>
              </DialogHeader>
              <form onSubmit={addTransaction} className="px-6 pb-6 space-y-5">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account</Label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger className="rounded-xl bg-card border-border/50 h-11"><SelectValue placeholder="Select account" /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id} className="rounded-lg">{a.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</Label>
                    <Input type="number" step="0.01" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} required className="rounded-xl bg-card border-border/50 h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</Label>
                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="rounded-xl bg-card border-border/50 h-11"><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="debit" className="rounded-lg">Expense</SelectItem>
                        <SelectItem value="credit" className="rounded-lg">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="rounded-xl bg-card border-border/50 h-11"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {CATEGORY_NAMES.map((c) => (
                        <SelectItem key={c} value={c} className="rounded-lg">
                          <span className="flex items-center gap-2">
                            <span
                              className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: getCategoryColor(c) }}
                            />
                            {c}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Merchant</Label>
                  <Input placeholder="e.g. Walmart" value={merchant} onChange={(e) => setMerchant(e.target.value)} className="rounded-xl bg-card border-border/50 h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-xl bg-card border-border/50 h-11" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Note (optional)</Label>
                  <Input placeholder="Add a note..." value={note} onChange={(e) => setNote(e.target.value)} className="rounded-xl bg-card border-border/50 h-11" />
                </div>
                <Button type="submit" className="w-full rounded-xl h-11 bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-600/20 transition-all duration-200 font-medium">
                  Add Transaction
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="relative max-w-xs flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            placeholder="Search transactions..."
            className="rounded-xl bg-card border-border/50 pl-10 h-10"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <Select value={filterCategory} onValueChange={(v) => { setFilterCategory(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[180px] rounded-xl bg-card border-border/50 h-10"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">All Categories</SelectItem>
            {CATEGORY_NAMES.map((c) => (
              <SelectItem key={c} value={c} className="rounded-lg">{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => { setFilterType(v); setPage(1); }}>
          <SelectTrigger className="w-full sm:w-[140px] rounded-xl bg-card border-border/50 h-10"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all" className="rounded-lg">All Types</SelectItem>
            <SelectItem value="credit" className="rounded-lg">Income</SelectItem>
            <SelectItem value="debit" className="rounded-lg">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Transaction List */}
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6">
              <div className="h-14 w-14 rounded-2xl bg-muted/60 flex items-center justify-center mb-4">
                <svg className="h-7 w-7 text-muted-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-sm font-medium text-muted-foreground">No transactions found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Try adjusting your filters or add a new transaction</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 group transition-colors duration-150"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: getCategoryColor(tx.category) + "18",
                        color: getCategoryColor(tx.category),
                      }}
                    >
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="4" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{tx.merchant || tx.category}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{formatDate(tx.date)}</span>
                        <span className="text-muted-foreground/30">-</span>
                        <span className="text-xs text-muted-foreground">{tx.account.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className={`font-semibold text-sm tabular-nums ${tx.type === "credit" ? "text-emerald-500" : "text-red-400"}`}>
                        {tx.type === "credit" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{tx.category}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => deleteTransaction(tx.id)}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  className={`rounded-xl w-9 ${page === pageNum ? "bg-violet-600 hover:bg-violet-700 text-white" : ""}`}
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
