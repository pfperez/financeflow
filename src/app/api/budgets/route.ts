import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentMonth } from "@/lib/format";
import { createBudgetSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month") || getCurrentMonth();

  const budgets = await prisma.budget.findMany({
    where: { userId: session.user.id, month },
    orderBy: { category: "asc" },
  });

  // Get spending per category for this month
  const startDate = new Date(month + "-01");
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);

  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session.user.id,
      type: "debit",
      date: { gte: startDate, lt: endDate },
    },
  });

  const spendingByCategory: Record<string, number> = {};
  for (const t of transactions) {
    spendingByCategory[t.category] =
      (spendingByCategory[t.category] || 0) + t.amount;
  }

  const budgetsWithSpending = budgets.map((b) => ({
    ...b,
    spent: spendingByCategory[b.category] || 0,
    percentage: Math.min(
      100,
      Math.round(
        ((spendingByCategory[b.category] || 0) / b.monthlyLimit) * 100
      )
    ),
  }));

  return NextResponse.json(budgetsWithSpending);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (body.monthlyLimit) body.monthlyLimit = parseFloat(body.monthlyLimit);

  const result = createBudgetSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { category, monthlyLimit, month } = result.data;

  const budget = await prisma.budget.upsert({
    where: {
      userId_category_month: {
        userId: session.user.id,
        category,
        month: month || getCurrentMonth(),
      },
    },
    update: { monthlyLimit },
    create: {
      userId: session.user.id,
      category,
      monthlyLimit,
      month: month || getCurrentMonth(),
    },
  });

  return NextResponse.json(budget);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Budget ID required" }, { status: 400 });
  }

  await prisma.budget.delete({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
