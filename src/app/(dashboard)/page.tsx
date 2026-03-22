"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, formatDate } from "@/lib/format";
import { getCategoryColor } from "@/lib/categories";
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
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  merchant: string | null;
  date: string;
  account: { name: string; color: string };
}

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
}

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [accRes, txRes, billRes, goalRes] = await Promise.all([
        fetch("/api/accounts"),
        fetch("/api/transactions?limit=5"),
        fetch("/api/bills"),
        fetch("/api/goals"),
      ]);
      setAccounts(await accRes.json());
      const txData = await txRes.json();
      setTransactions(txData.transactions ?? txData);
      setBills(await billRes.json());
      setGoals(await goalRes.json());
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const seedData = async () => {
    setSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      if (res.ok) {
        toast.success("Demo data loaded!");
        fetchData();
      }
    } catch {
      toast.error("Failed to seed data");
    } finally {
      setSeeding(false);
    }
  };

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalIncome = transactions
    .filter((t) => t.type === "credit")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "debit")
    .reduce((sum, t) => sum + t.amount, 0);
  const upcomingBills = bills.filter((b) => !b.isPaid);

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="h-24 w-64 bg-muted animate-pulse rounded-2xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="flex gap-4 overflow-hidden">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 w-64 flex-shrink-0 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const isEmpty = accounts.length === 0;

  return (
    <div className="space-y-8">
      {/* Hero / Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">
            Good morning, {firstName}
          </p>
          {!isEmpty && (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">
                Total Balance
              </p>
              <h1 className="text-2xl sm:text-4xl font-bold tracking-tight">
                {formatCurrency(totalBalance)}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Across {accounts.length} account{accounts.length !== 1 ? "s" : ""}
              </p>
            </>
          )}
          {isEmpty && (
            <h1 className="text-2xl font-bold tracking-tight mt-1">Dashboard</h1>
          )}
        </div>
        {isEmpty && (
          <Button
            onClick={seedData}
            disabled={seeding}
            className="bg-primary hover:bg-primary/90 rounded-2xl"
          >
            {seeding ? "Loading..." : "Load Demo Data"}
          </Button>
        )}
      </div>

      {isEmpty ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
              <svg
                className="h-8 w-8 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">No accounts yet</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md text-sm">
              Get started by creating your first bank account or load demo data to explore the app.
            </p>
            <div className="flex gap-3">
              <Button asChild className="rounded-2xl bg-primary hover:bg-primary/90">
                <Link href="/accounts">Create Account</Link>
              </Button>
              <Button
                variant="outline"
                className="rounded-2xl"
                onClick={seedData}
                disabled={seeding}
              >
                {seeding ? "Loading..." : "Load Demo Data"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Income */}
            <Card className="rounded-2xl border-none bg-green-500/5 hover:bg-green-500/10 transition-colors">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  <p className="text-sm font-medium text-muted-foreground">Income</p>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Recent credits</p>
              </CardContent>
            </Card>

            {/* Expenses */}
            <Card className="rounded-2xl border-none bg-red-500/5 hover:bg-red-500/10 transition-colors">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <p className="text-sm font-medium text-muted-foreground">Expenses</p>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Recent debits</p>
              </CardContent>
            </Card>

            {/* Bills */}
            <Card className="rounded-2xl border-none bg-orange-500/5 hover:bg-orange-500/10 transition-colors">
              <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                  <p className="text-sm font-medium text-muted-foreground">Upcoming Bills</p>
                </div>
                <p className="text-2xl font-bold">
                  {upcomingBills.length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatCurrency(upcomingBills.reduce((s, b) => s + b.amount, 0))} due
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Account Cards - Horizontal Scroll */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Accounts</h2>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                <Link href="/accounts">View all</Link>
              </Button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {accounts.map((account, index) => (
                <div
                  key={account.id}
                  className="min-w-[240px] flex-shrink-0 rounded-2xl p-5 text-white hover:scale-[1.02] transition-transform cursor-pointer"
                  style={{ background: GRADIENTS[index % GRADIENTS.length] }}
                >
                  <p className="text-sm font-medium text-white/80">{account.name}</p>
                  <Badge className="mt-1 bg-white/20 text-white border-none text-[10px] uppercase tracking-wider hover:bg-white/30">
                    {account.type}
                  </Badge>
                  <p className="text-2xl font-bold mt-4">
                    {formatCurrency(account.balance, account.currency)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <Card className="rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                <Link href="/transactions">View all</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {transactions.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-12">
                  No transactions yet
                </p>
              ) : (
                <div className="divide-y">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between py-3.5 hover:bg-accent/30 -mx-3 px-3 rounded-xl transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: `${getCategoryColor(tx.category)}20` }}
                        >
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: getCategoryColor(tx.category) }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{tx.merchant || tx.category}</p>
                          <p className="text-xs text-muted-foreground">{formatDate(tx.date)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold text-sm ${
                            tx.type === "credit" ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {tx.type === "credit" ? "+" : "-"}
                          {formatCurrency(tx.amount)}
                        </p>
                        <Badge
                          variant="secondary"
                          className="text-[10px] mt-0.5 font-normal"
                        >
                          {tx.category}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Goals */}
          {goals.length > 0 && (
            <Card className="rounded-2xl">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">Savings Goals</CardTitle>
                <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80">
                  <Link href="/goals">View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  {goals.slice(0, 4).map((goal) => {
                    const pct = Math.min(
                      100,
                      Math.round((goal.currentAmount / goal.targetAmount) * 100)
                    );
                    return (
                      <div
                        key={goal.id}
                        className="p-4 rounded-2xl bg-accent/30 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <p className="font-medium text-sm">{goal.name}</p>
                          <span className="text-xs font-semibold text-primary">
                            {pct}%
                          </span>
                        </div>
                        <Progress value={pct} className="h-2 bg-muted" />
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatCurrency(goal.currentAmount)} of{" "}
                          {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
