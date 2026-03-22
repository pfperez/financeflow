import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createGoalSchema, updateGoalSchema } from "@/lib/validations";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await prisma.savingsGoal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (body.targetAmount) body.targetAmount = parseFloat(body.targetAmount);
  if (body.currentAmount) body.currentAmount = parseFloat(body.currentAmount);

  const result = createGoalSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { name, targetAmount, currentAmount, deadline } = result.data;

  const goal = await prisma.savingsGoal.create({
    data: {
      userId: session.user.id,
      name,
      targetAmount,
      currentAmount,
      deadline: deadline ? new Date(deadline) : null,
    },
  });

  return NextResponse.json(goal);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  if (body.currentAmount) body.currentAmount = parseFloat(body.currentAmount);

  const result = updateGoalSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { id, currentAmount } = result.data;

  const goal = await prisma.savingsGoal.update({
    where: { id, userId: session.user.id },
    data: { currentAmount },
  });

  return NextResponse.json(goal);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Goal ID required" }, { status: 400 });
  }

  await prisma.savingsGoal.delete({
    where: { id, userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
