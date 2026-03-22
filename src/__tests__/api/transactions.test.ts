import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/transactions/route";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(),
    },
    account: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe("GET /api/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);
    const req = new Request("http://localhost/api/transactions");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns paginated transactions", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const mockTxs = [
      { id: "tx1", amount: 25, type: "debit", category: "Food", date: new Date() },
    ];
    mockPrisma.transaction.findMany.mockResolvedValue(mockTxs as never);
    mockPrisma.transaction.count.mockResolvedValue(1 as never);

    const req = new Request("http://localhost/api/transactions?limit=20&page=1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.transactions).toHaveLength(1);
    expect(data.transactions[0].id).toBe("tx1");
    expect(data.total).toBe(1);
    expect(data.page).toBe(1);
    expect(data.totalPages).toBe(1);
  });

  it("applies filters correctly", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockPrisma.transaction.findMany.mockResolvedValue([] as never);
    mockPrisma.transaction.count.mockResolvedValue(0 as never);

    const req = new Request("http://localhost/api/transactions?category=Food&type=debit&page=2&limit=10");
    await GET(req);

    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user1",
          category: "Food",
          type: "debit",
        }),
        take: 10,
        skip: 10,
      })
    );
  });
});

describe("POST /api/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates transaction and updates balance for debit", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockPrisma.account.findFirst.mockResolvedValue({ id: "acc1", userId: "user1" } as never);
    mockPrisma.transaction.create.mockResolvedValue({ id: "tx1", amount: 50, type: "debit" } as never);
    mockPrisma.account.update.mockResolvedValue({} as never);

    const req = new Request("http://localhost/api/transactions", {
      method: "POST",
      body: JSON.stringify({
        accountId: "acc1",
        amount: "50",
        type: "debit",
        category: "Food & Dining",
        merchant: "Chipotle",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockPrisma.account.update).toHaveBeenCalledWith({
      where: { id: "acc1" },
      data: { balance: { increment: -50 } },
    });
  });

  it("creates transaction and updates balance for credit", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockPrisma.account.findFirst.mockResolvedValue({ id: "acc1", userId: "user1" } as never);
    mockPrisma.transaction.create.mockResolvedValue({ id: "tx2", amount: 3000, type: "credit" } as never);
    mockPrisma.account.update.mockResolvedValue({} as never);

    const req = new Request("http://localhost/api/transactions", {
      method: "POST",
      body: JSON.stringify({
        accountId: "acc1",
        amount: "3000",
        type: "credit",
        category: "Salary",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(mockPrisma.account.update).toHaveBeenCalledWith({
      where: { id: "acc1" },
      data: { balance: { increment: 3000 } },
    });
  });

  it("returns 404 when account not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockPrisma.account.findFirst.mockResolvedValue(null as never);

    const req = new Request("http://localhost/api/transactions", {
      method: "POST",
      body: JSON.stringify({
        accountId: "nonexistent",
        amount: "50",
        type: "debit",
        category: "Food",
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reverses balance change on delete", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockPrisma.transaction.findFirst.mockResolvedValue({
      id: "tx1",
      accountId: "acc1",
      amount: 100,
      type: "debit",
      userId: "user1",
    } as never);
    mockPrisma.account.update.mockResolvedValue({} as never);
    mockPrisma.transaction.delete.mockResolvedValue({} as never);

    const req = new Request("http://localhost/api/transactions?id=tx1", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(200);

    // Debit deletion should add money back (positive increment)
    expect(mockPrisma.account.update).toHaveBeenCalledWith({
      where: { id: "acc1" },
      data: { balance: { increment: 100 } },
    });
  });

  it("returns 404 when transaction not found", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockPrisma.transaction.findFirst.mockResolvedValue(null as never);

    const req = new Request("http://localhost/api/transactions?id=nonexistent", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });
});
