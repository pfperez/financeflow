import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRecurringSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recurring = await prisma.recurringTransaction.findMany({
    where: { userId: session.user.id },
    include: { account: { select: { name: true, type: true, color: true } } },
    orderBy: { nextRunDate: "asc" },
  });

  return NextResponse.json(recurring);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (body.amount) body.amount = parseFloat(body.amount);

  const result = createRecurringSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { accountId, amount, type, category, merchant, note, frequency, startDate } = result.data;

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const start = new Date(startDate);

  const recurring = await prisma.recurringTransaction.create({
    data: {
      userId: session.user.id,
      accountId,
      amount,
      type,
      category,
      merchant: merchant || null,
      note: note || null,
      frequency,
      startDate: start,
      nextRunDate: start,
    },
  });

  return NextResponse.json(recurring);
}

function getNextDate(current: Date, frequency: string): Date {
  const next = new Date(current);
  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
}

// PATCH - process due recurring transactions (creates actual transactions)
export async function PATCH() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const dueRecurring = await prisma.recurringTransaction.findMany({
    where: {
      userId: session.user.id,
      isActive: true,
      nextRunDate: { lte: now },
    },
  });

  let created = 0;
  for (const rec of dueRecurring) {
    // Create the transaction
    await prisma.transaction.create({
      data: {
        userId: rec.userId,
        accountId: rec.accountId,
        amount: rec.amount,
        type: rec.type,
        category: rec.category,
        merchant: rec.merchant,
        note: rec.note ? `[Auto] ${rec.note}` : "[Auto] Recurring transaction",
        date: rec.nextRunDate,
      },
    });

    // Update account balance
    const balanceChange = rec.type === "credit" ? rec.amount : -rec.amount;
    await prisma.account.update({
      where: { id: rec.accountId },
      data: { balance: { increment: balanceChange } },
    });

    // Advance nextRunDate
    await prisma.recurringTransaction.update({
      where: { id: rec.id },
      data: { nextRunDate: getNextDate(rec.nextRunDate, rec.frequency) },
    });

    created++;
  }

  return NextResponse.json({ processed: created });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }

  const rec = await prisma.recurringTransaction.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!rec) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.recurringTransaction.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
