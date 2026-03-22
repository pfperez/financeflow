import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST, DELETE } from "@/app/api/accounts/route";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    account: {
      findMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const mockAuth = vi.mocked(auth);
const mockPrisma = vi.mocked(prisma);

describe("GET /api/accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);
    const res = await GET();
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns accounts for authenticated user", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const mockAccounts = [
      { id: "acc1", name: "Checking", type: "checking", balance: 1000, color: "#3b82f6", currency: "USD" },
    ];
    mockPrisma.account.findMany.mockResolvedValue(mockAccounts as never);

    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(mockAccounts);
    expect(mockPrisma.account.findMany).toHaveBeenCalledWith({
      where: { userId: "user1" },
      orderBy: { createdAt: "desc" },
    });
  });
});

describe("POST /api/accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValue(null as never);
    const req = new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify({ name: "Test", type: "checking", balance: 100 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("creates account with valid data", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const created = { id: "new-acc", name: "Test Account", type: "checking", balance: 500 };
    mockPrisma.account.create.mockResolvedValue(created as never);

    const req = new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify({ name: "Test Account", type: "checking", balance: "500" }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.name).toBe("Test Account");
  });

  it("returns 400 for invalid account type", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const req = new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify({ name: "Bad", type: "crypto", balance: 100 }),
      headers: { "Content-Type": "application/json" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe("DELETE /api/accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when no ID provided", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const req = new Request("http://localhost/api/accounts", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toBe("Account ID required");
  });

  it("deletes account with valid ID", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockPrisma.account.delete.mockResolvedValue({} as never);

    const req = new Request("http://localhost/api/accounts?id=acc1", { method: "DELETE" });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(mockPrisma.account.delete).toHaveBeenCalledWith({
      where: { id: "acc1", userId: "user1" },
    });
  });
});
