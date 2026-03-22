"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { getCategoryColor } from "@/lib/categories";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  date: string;
}

export default function AnalyticsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const res = await fetch("/api/transactions?limit=500");
    const data = await res.json();
    setTransactions(data.transactions ?? data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Spending by category (pie chart)
  const spendingByCategory: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "debit")
    .forEach((t) => {
      spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount;
    });
  const pieData = Object.entries(spendingByCategory)
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value);

  // Monthly income vs expenses (bar chart)
  const monthlyData: Record<string, { income: number; expenses: number }> = {};
  transactions.forEach((t) => {
    const month = new Date(t.date).toLocaleString("en-US", { month: "short", year: "2-digit" });
    if (!monthlyData[month]) monthlyData[month] = { income: 0, expenses: 0 };
    if (t.type === "credit") monthlyData[month].income += t.amount;
    else monthlyData[month].expenses += t.amount;
  });
  const barData = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      income: Math.round(data.income),
      expenses: Math.round(data.expenses),
    }))
    .reverse()
    .slice(-6);

  // Spending trend (line chart)
  const dailySpending: Record<string, number> = {};
  transactions
    .filter((t) => t.type === "debit")
    .forEach((t) => {
      const day = new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      dailySpending[day] = (dailySpending[day] || 0) + t.amount;
    });
  const lineData = Object.entries(dailySpending)
    .map(([date, amount]) => ({ date, amount: Math.round(amount) }))
    .reverse()
    .slice(-30);

  const totalIncome = transactions.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = transactions.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const netFlow = totalIncome - totalExpenses;

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-8 w-52 bg-muted animate-pulse rounded-xl" />
          <div className="h-4 w-72 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-80 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Your financial insights at a glance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-5 md:grid-cols-3">
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-card to-card hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <p className="text-sm font-medium text-muted-foreground">Total Income</p>
            </div>
            <p className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalIncome)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              <p className="text-sm font-medium text-muted-foreground">Total Expenses</p>
            </div>
            <p className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
              {formatCurrency(totalExpenses)}
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardContent className="pt-6 pb-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className={`h-2.5 w-2.5 rounded-full ${netFlow >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
              <p className="text-sm font-medium text-muted-foreground">Net Cash Flow</p>
            </div>
            <p className={`text-2xl font-bold tracking-tight ${netFlow >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {formatCurrency(netFlow)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Spending by Category */}
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <p className="text-center text-muted-foreground py-16 text-sm">No spending data</p>
            ) : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={105}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={getCategoryColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                        fontSize: "13px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center mt-2">
                  {pieData.slice(0, 6).map((entry) => (
                    <div key={entry.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(entry.name) }} />
                      <span>{entry.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income vs Expenses */}
        <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Income vs Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="text-center text-muted-foreground py-16 text-sm">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "13px",
                    }}
                  />
                  <Legend iconType="circle" iconSize={8} />
                  <Bar dataKey="income" fill="#8b5cf6" name="Income" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" fill="#f43f5e" name="Expenses" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Spending Trend */}
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Daily Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {lineData.length === 0 ? (
              <p className="text-center text-muted-foreground py-16 text-sm">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-20" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      fontSize: "13px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#8b5cf6"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, fill: "#8b5cf6", strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Spending Categories */}
        <Card className="lg:col-span-2 rounded-2xl border-0 shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Top Spending Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pieData.slice(0, 8).map((entry) => {
                const max = pieData[0]?.value || 1;
                const pct = Math.round((entry.value / max) * 100);
                return (
                  <div key={entry.name} className="flex items-center gap-3 sm:gap-4 group">
                    <div className="flex items-center gap-2 sm:gap-2.5 w-24 sm:w-36">
                      <div
                        className="h-3 w-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getCategoryColor(entry.name) }}
                      />
                      <span className="text-xs sm:text-sm font-medium truncate">{entry.name}</span>
                    </div>
                    <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${pct}%`, backgroundColor: getCategoryColor(entry.name) }}
                      />
                    </div>
                    <span className="w-20 sm:w-24 text-xs sm:text-sm text-right font-semibold tabular-nums">
                      {formatCurrency(entry.value)}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
