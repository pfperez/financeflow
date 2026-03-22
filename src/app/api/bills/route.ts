import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBillSchema, toggleBillSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bills = await prisma.bill.findMany({
    where: { userId: session.user.id },
    orderBy: { dueDate: "asc" },
  });

  return NextResponse.json(bills);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (body.amount) body.amount = parseFloat(body.amount);

  const result = createBillSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { name, amount, dueDate, frequency, category } = result.data;

  const bill = await prisma.bill.create({
    data: {
      userId: session.user.id,
      name,
      amount,
      dueDate: new Date(dueDate),
      frequency,
      category,
    },
  });

  return NextResponse.json(bill);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const result = toggleBillSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { id, isPaid } = result.data;

  const bill = await prisma.bill.update({
    where: { id, userId: session.user.id },
    data: { isPaid },
  });

  return NextResponse.json(bill);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Bill ID required" }, { status: 400 });
  }

  await prisma.bill.delete({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
