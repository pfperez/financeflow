import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  createAccountSchema,
  createTransactionSchema,
  createTransferSchema,
  createBudgetSchema,
  createBillSchema,
  createGoalSchema,
  validateBody,
} from "@/lib/validations";

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    const result = registerSchema.safeParse({
      name: "John Doe",
      email: "john@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing name", () => {
    const result = registerSchema.safeParse({
      name: "",
      email: "john@example.com",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      name: "John",
      email: "john@example.com",
      password: "123",
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid login", () => {
    const result = loginSchema.safeParse({
      email: "john@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "john@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("createAccountSchema", () => {
  it("accepts valid account with defaults", () => {
    const result = createAccountSchema.safeParse({
      name: "My Checking",
      type: "checking",
      balance: 1000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe("USD");
      expect(result.data.color).toBe("#3b82f6");
    }
  });

  it("coerces string balance to number", () => {
    const result = createAccountSchema.safeParse({
      name: "My Savings",
      type: "savings",
      balance: "5000.50",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.balance).toBe(5000.5);
    }
  });

  it("rejects invalid account type", () => {
    const result = createAccountSchema.safeParse({
      name: "My Account",
      type: "crypto",
      balance: 100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid color format", () => {
    const result = createAccountSchema.safeParse({
      name: "My Account",
      type: "checking",
      balance: 100,
      color: "red",
    });
    expect(result.success).toBe(false);
  });
});

describe("createTransactionSchema", () => {
  it("accepts valid transaction", () => {
    const result = createTransactionSchema.safeParse({
      accountId: "abc123",
      amount: 42.99,
      type: "debit",
      category: "Food & Dining",
      merchant: "Chipotle",
    });
    expect(result.success).toBe(true);
  });

  it("coerces string amount to number", () => {
    const result = createTransactionSchema.safeParse({
      accountId: "abc123",
      amount: "25.50",
      type: "credit",
      category: "Salary",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.amount).toBe(25.5);
    }
  });

  it("rejects zero amount", () => {
    const result = createTransactionSchema.safeParse({
      accountId: "abc123",
      amount: 0,
      type: "debit",
      category: "Other",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative amount", () => {
    const result = createTransactionSchema.safeParse({
      accountId: "abc123",
      amount: -10,
      type: "debit",
      category: "Other",
    });
    expect(result.success).toBe(false);
  });
});

describe("createTransferSchema", () => {
  it("accepts valid transfer", () => {
    const result = createTransferSchema.safeParse({
      fromAccountId: "acc1",
      toAccountId: "acc2",
      amount: 100,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing account IDs", () => {
    const result = createTransferSchema.safeParse({
      fromAccountId: "",
      toAccountId: "acc2",
      amount: 100,
    });
    expect(result.success).toBe(false);
  });
});

describe("createBudgetSchema", () => {
  it("accepts valid budget", () => {
    const result = createBudgetSchema.safeParse({
      category: "Food & Dining",
      monthlyLimit: 500,
      month: "2026-03",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid month format", () => {
    const result = createBudgetSchema.safeParse({
      category: "Food",
      monthlyLimit: 500,
      month: "March 2026",
    });
    expect(result.success).toBe(false);
  });
});

describe("createBillSchema", () => {
  it("accepts valid bill with default category", () => {
    const result = createBillSchema.safeParse({
      name: "Netflix",
      amount: 15.49,
      dueDate: "2026-03-08",
      frequency: "monthly",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe("Bills");
    }
  });

  it("rejects invalid frequency", () => {
    const result = createBillSchema.safeParse({
      name: "Netflix",
      amount: 15.49,
      dueDate: "2026-03-08",
      frequency: "daily",
    });
    expect(result.success).toBe(false);
  });
});

describe("createGoalSchema", () => {
  it("accepts valid goal with defaults", () => {
    const result = createGoalSchema.safeParse({
      name: "Emergency Fund",
      targetAmount: 20000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currentAmount).toBe(0);
    }
  });

  it("rejects negative target", () => {
    const result = createGoalSchema.safeParse({
      name: "Bad Goal",
      targetAmount: -100,
    });
    expect(result.success).toBe(false);
  });
});

describe("validateBody", () => {
  it("parses valid JSON body", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "John", email: "john@test.com", password: "password123" }),
      headers: { "Content-Type": "application/json" },
    });
    const result = await validateBody(req, registerSchema);
    expect(result.error).toBeNull();
    expect(result.data).toEqual({
      name: "John",
      email: "john@test.com",
      password: "password123",
    });
  });

  it("returns error for invalid data", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ name: "", email: "bad", password: "x" }),
      headers: { "Content-Type": "application/json" },
    });
    const result = await validateBody(req, registerSchema);
    expect(result.data).toBeNull();
    expect(result.error).toBeTruthy();
  });

  it("returns error for non-JSON body", async () => {
    const req = new Request("http://localhost", {
      method: "POST",
      body: "not json",
    });
    const result = await validateBody(req, registerSchema);
    expect(result.data).toBeNull();
    expect(result.error).toBe("Invalid request body");
  });
});
