import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, unknown> = {};

  // Check env vars are present
  checks.DATABASE_URL_set = !!process.env.DATABASE_URL;
  checks.DATABASE_URL_prefix = process.env.DATABASE_URL?.substring(0, 30) + "...";
  checks.DATABASE_AUTH_TOKEN_set = !!process.env.DATABASE_AUTH_TOKEN;
  checks.AUTH_SECRET_set = !!process.env.AUTH_SECRET;

  // Test database connection
  try {
    const count = await prisma.user.count();
    checks.db_connected = true;
    checks.user_count = count;
  } catch (err: unknown) {
    checks.db_connected = false;
    checks.db_error = err instanceof Error ? err.message : String(err);
  }

  // Test creating a user
  try {
    const testUser = await prisma.user.create({
      data: {
        email: `debug-${Date.now()}@test.com`,
        name: "Debug Test",
        hashedPassword: "test",
      },
    });
    checks.create_works = true;

    // Clean up
    await prisma.user.delete({ where: { id: testUser.id } });
    checks.delete_works = true;
  } catch (err: unknown) {
    checks.create_works = false;
    checks.create_error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(checks, { status: 200 });
}
