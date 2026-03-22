import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateBody, createTransferSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const transfers = await prisma.transfer.findMany({
    where: { userId: session.user.id },
    include: {
      fromAccount: { select: { name: true, type: true, color: true } },
      toAccount: { select: { name: true, type: true, color: true } },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(transfers);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(req, createTransferSchema);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const data = result.data!;

  if (data.fromAccountId === data.toAccountId) {
    return NextResponse.json(
      { error: "Cannot transfer to the same account" },
      { status: 400 }
    );
  }

  const fromAccount = await prisma.account.findFirst({
    where: { id: data.fromAccountId, userId: session.user.id },
  });

  const toAccount = await prisma.account.findFirst({
    where: { id: data.toAccountId, userId: session.user.id },
  });

  if (!fromAccount || !toAccount) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Create transfer and update both account balances
  const transfer = await prisma.transfer.create({
    data: {
      userId: session.user.id,
      fromAccountId: data.fromAccountId,
      toAccountId: data.toAccountId,
      amount: data.amount,
      status: "completed",
      note: data.note || null,
    },
  });

  await prisma.account.update({
    where: { id: data.fromAccountId },
    data: { balance: { decrement: data.amount } },
  });

  await prisma.account.update({
    where: { id: data.toAccountId },
    data: { balance: { increment: data.amount } },
  });

  return NextResponse.json(transfer);
}
