import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateBody, createAccountSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = await prisma.account.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await validateBody(req, createAccountSchema);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  const data = result.data!;

  const account = await prisma.account.create({
    data: {
      userId: session.user.id,
      name: data.name,
      type: data.type,
      balance: data.balance,
      currency: data.currency,
      color: data.color,
    },
  });

  return NextResponse.json(account);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Account ID required" }, { status: 400 });
  }

  await prisma.account.delete({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
