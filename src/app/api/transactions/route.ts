import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateBody, createTransactionSchema } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get("accountId");
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const limit = parseInt(searchParams.get("limit") || "20");
  const page = parseInt(searchParams.get("page") || "1");

  const where: Record<string, unknown> = { userId: session.user.id };
  if (accountId) where.accountId = accountId;
  if (category) where.category = category;
  if (type) where.type = type;
  if (search) {
    where.OR = [
      { merchant: { contains: search } },
      { note: { contains: search } },
      { category: { contains: search } },
    ];
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { account: { select: { name: true, type: true, color: true } } },
      orderBy: { date: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(req, createTransactionSchema);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const data = result.data!;

  const account = await prisma.account.findFirst({
    where: { id: data.accountId, userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: session.user.id,
      accountId: data.accountId,
      amount: data.amount,
      type: data.type,
      category: data.category,
      merchant: data.merchant || null,
      note: data.note || null,
      date: data.date ? new Date(data.date) : new Date(),
    },
  });

  // Update account balance
  const balanceChange = data.type === "credit" ? data.amount : -data.amount;
  await prisma.account.update({
    where: { id: data.accountId },
    data: { balance: { increment: balanceChange } },
  });

  return NextResponse.json(transaction);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Reverse the balance change
  const reverseChange = transaction.type === "credit" ? -transaction.amount : transaction.amount;
  await prisma.account.update({
    where: { id: transaction.accountId },
    data: { balance: { increment: reverseChange } },
  });

  await prisma.transaction.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
