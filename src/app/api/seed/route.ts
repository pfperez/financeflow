import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Realistic merchant data with price ranges and monthly frequency
const merchantData = [
  // Groceries (weekly-ish)
  { name: "Walmart", category: "Groceries", min: 45, max: 120, perMonth: 3 },
  { name: "Costco", category: "Groceries", min: 80, max: 200, perMonth: 1 },
  { name: "Trader Joe's", category: "Groceries", min: 30, max: 75, perMonth: 2 },

  // Food & Dining
  { name: "Starbucks", category: "Food & Dining", min: 4.5, max: 8.5, perMonth: 6 },
  { name: "Chipotle", category: "Food & Dining", min: 10, max: 16, perMonth: 3 },
  { name: "McDonald's", category: "Food & Dining", min: 7, max: 14, perMonth: 2 },
  { name: "DoorDash", category: "Food & Dining", min: 18, max: 45, perMonth: 2 },

  // Subscriptions (fixed monthly)
  { name: "Netflix", category: "Subscriptions", min: 15.49, max: 15.49, perMonth: 1 },
  { name: "Spotify", category: "Subscriptions", min: 11.99, max: 11.99, perMonth: 1 },
  { name: "iCloud Storage", category: "Subscriptions", min: 2.99, max: 2.99, perMonth: 1 },
  { name: "YouTube Premium", category: "Subscriptions", min: 13.99, max: 13.99, perMonth: 1 },

  // Transportation
  { name: "Uber", category: "Transportation", min: 8, max: 28, perMonth: 3 },
  { name: "Shell Gas", category: "Transportation", min: 35, max: 65, perMonth: 2 },
  { name: "EZ Pass Toll", category: "Transportation", min: 3.5, max: 12, perMonth: 2 },

  // Shopping
  { name: "Amazon", category: "Shopping", min: 12, max: 85, perMonth: 3 },
  { name: "Target", category: "Shopping", min: 15, max: 60, perMonth: 1 },
  { name: "Apple Store", category: "Shopping", min: 29, max: 199, perMonth: 0.3 },
  { name: "Home Depot", category: "Shopping", min: 20, max: 90, perMonth: 0.5 },

  // Bills & Utilities (fixed monthly)
  { name: "Electric Company", category: "Bills & Utilities", min: 85, max: 145, perMonth: 1 },
  { name: "Water Utility", category: "Bills & Utilities", min: 35, max: 55, perMonth: 1 },
  { name: "Xfinity Internet", category: "Bills & Utilities", min: 79.99, max: 79.99, perMonth: 1 },
  { name: "T-Mobile", category: "Bills & Utilities", min: 70, max: 70, perMonth: 1 },

  // Healthcare
  { name: "CVS Pharmacy", category: "Healthcare", min: 8, max: 45, perMonth: 1 },
  { name: "Planet Fitness", category: "Healthcare", min: 24.99, max: 24.99, perMonth: 1 },

  // Entertainment
  { name: "AMC Theaters", category: "Entertainment", min: 14, max: 32, perMonth: 0.5 },
  { name: "Steam", category: "Entertainment", min: 10, max: 60, perMonth: 0.3 },

  // Education
  { name: "Udemy", category: "Education", min: 12.99, max: 14.99, perMonth: 0.3 },
  { name: "Barnes & Noble", category: "Education", min: 12, max: 30, perMonth: 0.5 },
];

// Salary entries
const salaryData = [
  { name: "Direct Deposit - Employer", amount: 3250, dayOfMonth: 1 },
  { name: "Direct Deposit - Employer", amount: 3250, dayOfMonth: 15 },
];

function randomAmount(min: number, max: number): number {
  if (min === max) return min;
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomDay(year: number, month: number): Date {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const day = Math.floor(Math.random() * daysInMonth) + 1;
  const hour = Math.floor(Math.random() * 14) + 8;
  const minute = Math.floor(Math.random() * 60);
  return new Date(year, month, day, hour, minute);
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Delete existing data for this user
    await prisma.transaction.deleteMany({ where: { userId } });
    await prisma.recurringTransaction.deleteMany({ where: { userId } });
    await prisma.transfer.deleteMany({ where: { userId } });
    await prisma.budget.deleteMany({ where: { userId } });
    await prisma.bill.deleteMany({ where: { userId } });
    await prisma.savingsGoal.deleteMany({ where: { userId } });
    await prisma.account.deleteMany({ where: { userId } });

    // Create accounts
    const checking = await prisma.account.create({
      data: { userId, name: "Main Checking", type: "checking", balance: 4827.63, color: "#3b82f6" },
    });

    const savings = await prisma.account.create({
      data: { userId, name: "Emergency Savings", type: "savings", balance: 12750.0, color: "#22c55e" },
    });

    const credit = await prisma.account.create({
      data: { userId, name: "Chase Credit Card", type: "credit", balance: -1243.17, color: "#ef4444" },
    });

    const investment = await prisma.account.create({
      data: { userId, name: "Vanguard Portfolio", type: "investment", balance: 34200.0, color: "#8b5cf6" },
    });

    // Generate realistic transactions over the last 6 months
    const now = new Date();
    const transactions = [];

    for (let monthOffset = 0; monthOffset < 6; monthOffset++) {
      const year = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1).getFullYear();
      const month = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1).getMonth();

      // Skip future dates in current month
      const isCurrentMonth = monthOffset === 0;

      // Add salary deposits (to checking)
      for (const salary of salaryData) {
        const salaryDate = new Date(year, month, salary.dayOfMonth, 9, 0);
        if (isCurrentMonth && salaryDate > now) continue;

        transactions.push({
          userId,
          accountId: checking.id,
          amount: salary.amount,
          type: "credit",
          category: "Salary",
          merchant: salary.name,
          note: null,
          date: salaryDate,
        });
      }

      // Add expense transactions per merchant
      for (const m of merchantData) {
        // Determine how many times this merchant appears this month
        let count: number;
        if (m.perMonth >= 1) {
          count = Math.round(m.perMonth);
          // Add slight randomness: sometimes +/- 1
          if (m.perMonth >= 3 && Math.random() > 0.7) count += Math.random() > 0.5 ? 1 : -1;
        } else {
          // Fractional: probability of appearing this month
          count = Math.random() < m.perMonth ? 1 : 0;
        }

        for (let i = 0; i < count; i++) {
          const txDate = randomDay(year, month);
          if (isCurrentMonth && txDate > now) continue;

          // Credit card for shopping/dining/entertainment, checking for bills/groceries
          const useCredit =
            ["Shopping", "Food & Dining", "Entertainment", "Subscriptions"].includes(m.category) &&
            Math.random() > 0.3;

          transactions.push({
            userId,
            accountId: useCredit ? credit.id : checking.id,
            amount: randomAmount(m.min, m.max),
            type: "debit",
            category: m.category,
            merchant: m.name,
            note: null,
            date: txDate,
          });
        }
      }
    }

    await prisma.transaction.createMany({ data: transactions });

    // Create transfers
    const transferData = [
      {
        userId,
        fromAccountId: checking.id,
        toAccountId: savings.id,
        amount: 500,
        status: "completed",
        date: new Date(now.getFullYear(), now.getMonth(), 2, 10, 30),
      },
      {
        userId,
        fromAccountId: checking.id,
        toAccountId: savings.id,
        amount: 500,
        status: "completed",
        date: new Date(now.getFullYear(), now.getMonth() - 1, 2, 10, 30),
      },
      {
        userId,
        fromAccountId: savings.id,
        toAccountId: checking.id,
        amount: 200,
        status: "completed",
        date: new Date(now.getFullYear(), now.getMonth(), 18, 14, 15),
      },
      {
        userId,
        fromAccountId: checking.id,
        toAccountId: investment.id,
        amount: 1000,
        status: "completed",
        date: new Date(now.getFullYear(), now.getMonth() - 1, 15, 9, 0),
      },
    ];
    await prisma.transfer.createMany({ data: transferData });

    // Create budgets
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const budgetData = [
      { userId, category: "Food & Dining", monthlyLimit: 400, month: currentMonth },
      { userId, category: "Shopping", monthlyLimit: 300, month: currentMonth },
      { userId, category: "Transportation", monthlyLimit: 200, month: currentMonth },
      { userId, category: "Entertainment", monthlyLimit: 100, month: currentMonth },
      { userId, category: "Groceries", monthlyLimit: 500, month: currentMonth },
      { userId, category: "Subscriptions", monthlyLimit: 60, month: currentMonth },
    ];
    await prisma.budget.createMany({ data: budgetData });

    // Create bills
    const billData = [
      { userId, name: "Rent", amount: 1650, dueDate: new Date(now.getFullYear(), now.getMonth(), 1), frequency: "monthly", category: "Rent", isPaid: now.getDate() > 1 },
      { userId, name: "Electric Bill", amount: 110, dueDate: new Date(now.getFullYear(), now.getMonth(), 15), frequency: "monthly", category: "Bills & Utilities", isPaid: now.getDate() > 15 },
      { userId, name: "Xfinity Internet", amount: 79.99, dueDate: new Date(now.getFullYear(), now.getMonth(), 20), frequency: "monthly", category: "Bills & Utilities", isPaid: now.getDate() > 20 },
      { userId, name: "Netflix", amount: 15.49, dueDate: new Date(now.getFullYear(), now.getMonth(), 8), frequency: "monthly", category: "Subscriptions", isPaid: now.getDate() > 8 },
      { userId, name: "Planet Fitness", amount: 24.99, dueDate: new Date(now.getFullYear(), now.getMonth(), 5), frequency: "monthly", category: "Healthcare", isPaid: now.getDate() > 5 },
      { userId, name: "Car Insurance", amount: 165, dueDate: new Date(now.getFullYear(), now.getMonth() + 1, 1), frequency: "monthly", category: "Transportation", isPaid: false },
      { userId, name: "T-Mobile", amount: 70, dueDate: new Date(now.getFullYear(), now.getMonth(), 12), frequency: "monthly", category: "Bills & Utilities", isPaid: now.getDate() > 12 },
    ];
    await prisma.bill.createMany({ data: billData });

    // Create savings goals
    const goalData = [
      { userId, name: "Emergency Fund", targetAmount: 20000, currentAmount: 12750 },
      { userId, name: "Vacation to Japan", targetAmount: 5000, currentAmount: 2300, deadline: new Date(now.getFullYear(), 11, 31) },
      { userId, name: "New MacBook Pro", targetAmount: 2500, currentAmount: 850, deadline: new Date(now.getFullYear(), now.getMonth() + 3, 1) },
      { userId, name: "Down Payment", targetAmount: 50000, currentAmount: 15400 },
    ];
    await prisma.savingsGoal.createMany({ data: goalData });

    // Create recurring transactions
    const recurringData = [
      {
        userId,
        accountId: checking.id,
        amount: 3250,
        type: "credit",
        category: "Salary",
        merchant: "Direct Deposit - Employer",
        frequency: "biweekly",
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
        isActive: true,
      },
      {
        userId,
        accountId: credit.id,
        amount: 15.49,
        type: "debit",
        category: "Subscriptions",
        merchant: "Netflix",
        frequency: "monthly",
        startDate: new Date(now.getFullYear(), now.getMonth(), 8),
        nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, 8),
        isActive: true,
      },
      {
        userId,
        accountId: credit.id,
        amount: 11.99,
        type: "debit",
        category: "Subscriptions",
        merchant: "Spotify",
        frequency: "monthly",
        startDate: new Date(now.getFullYear(), now.getMonth(), 15),
        nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, 15),
        isActive: true,
      },
      {
        userId,
        accountId: checking.id,
        amount: 24.99,
        type: "debit",
        category: "Healthcare",
        merchant: "Planet Fitness",
        frequency: "monthly",
        startDate: new Date(now.getFullYear(), now.getMonth(), 5),
        nextRunDate: new Date(now.getFullYear(), now.getMonth() + 1, 5),
        isActive: true,
      },
    ];
    await prisma.recurringTransaction.createMany({ data: recurringData });

    return NextResponse.json({ success: true, message: "Demo data created!" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Failed to seed data" }, { status: 500 });
  }
}
