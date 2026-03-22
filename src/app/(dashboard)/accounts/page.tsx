"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/format";
import { ACCOUNT_TYPES, ACCOUNT_COLORS, CURRENCIES } from "@/lib/categories";
import { toast } from "sonner";

const GRADIENTS = [
  "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
  "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
  "linear-gradient(135deg, #fccb90 0%, #d57eeb 100%)",
  "linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)",
];

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  currency: string;
  createdAt: string;
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("checking");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState(ACCOUNT_COLORS[0]);
  const [currency, setCurrency] = useState("USD");

  const fetchAccounts = useCallback(async () => {
    const res = await fetch("/api/accounts");
    setAccounts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type, balance: parseFloat(balance) || 0, color, currency }),
    });
    if (res.ok) {
      toast.success("Account created!");
      setOpen(false);
      setName("");
      setBalance("");
      fetchAccounts();
    } else {
      toast.error("Failed to create account");
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm("Delete this account? All related transactions will also be deleted.")) return;
    const res = await fetch(`/api/accounts?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Account deleted");
      fetchAccounts();
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-20 w-72 bg-muted animate-pulse rounded-2xl" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-48 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Accounts</h1>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2 mb-1">
            Total Balance
          </p>
          <p className="text-2xl sm:text-4xl font-bold tracking-tight">
            {formatCurrency(totalBalance)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {accounts.length} account{accounts.length !== 1 ? "s" : ""}
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-2xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 px-6">
              + New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={createAccount} className="space-y-5 mt-2">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account Name</Label>
                <Input
                  placeholder="e.g. Main Checking"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Account Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {ACCOUNT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value} className="rounded-lg">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Starting Balance</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={balance}
                  onChange={(e) => setBalance(e.target.value)}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Color</Label>
                <div className="flex gap-2.5">
                  {ACCOUNT_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-9 w-9 rounded-full border-2 transition-all hover:scale-110 ${
                        color === c
                          ? "border-foreground scale-110 ring-2 ring-offset-2 ring-foreground/20"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="rounded-xl h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value} className="rounded-lg">
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full rounded-xl h-11 bg-primary hover:bg-primary/90 font-semibold"
              >
                Create Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Account Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {accounts.map((account, index) => (
          <div
            key={account.id}
            className="group relative h-48 rounded-2xl p-6 text-white overflow-hidden hover:scale-[1.02] transition-all duration-200 shadow-lg"
            style={{ background: GRADIENTS[index % GRADIENTS.length] }}
          >
            {/* Card content */}
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-base font-semibold text-white">{account.name}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full text-[10px] uppercase tracking-wider font-medium">
                    {account.type}
                  </span>
                </div>
              </div>

              <div>
                <p className={`text-3xl font-bold ${account.balance < 0 ? "text-red-200" : "text-white"}`}>
                  {formatCurrency(account.balance, account.currency)}
                </p>
                <p className="text-xs text-white/60 mt-1.5 font-mono tracking-[0.25em]">
                  **** **** **** {(index + 1).toString().padStart(4, "0")}
                </p>
              </div>
            </div>

            {/* Delete overlay */}
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-sm rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-white border border-white/30 rounded-xl hover:bg-red-500/80 hover:border-red-500 hover:text-white transition-colors"
                onClick={() => deleteAccount(account.id)}
              >
                <svg
                  className="h-4 w-4 mr-1.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                  />
                </svg>
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
