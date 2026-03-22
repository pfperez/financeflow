import { z } from "zod";

// Auth
export const registerSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

// Accounts
export const createAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  type: z.enum(["checking", "savings", "credit", "investment"]),
  balance: z.coerce.number().finite(),
  currency: z.string().min(3).max(3).default("USD"),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3b82f6"),
});

// Transactions
export const createTransactionSchema = z.object({
  accountId: z.string().min(1, "Account is required"),
  amount: z.coerce.number().positive("Amount must be positive").finite(),
  type: z.enum(["credit", "debit"]),
  category: z.string().min(1, "Category is required").max(50),
  merchant: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  date: z.string().optional(),
});

// Transfers
export const createTransferSchema = z.object({
  fromAccountId: z.string().min(1),
  toAccountId: z.string().min(1),
  amount: z.coerce.number().positive("Amount must be positive").finite(),
  note: z.string().max(500).optional().nullable(),
});

// Budgets
export const createBudgetSchema = z.object({
  category: z.string().min(1).max(50),
  monthlyLimit: z.number().positive().finite(),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Month must be YYYY-MM format"),
});

// Bills
export const createBillSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  amount: z.number().positive("Amount must be positive").finite(),
  dueDate: z.string().min(1, "Due date is required"),
  frequency: z.enum(["weekly", "monthly", "yearly", "one-time"]),
  category: z.string().min(1).max(50).default("Bills"),
});

export const toggleBillSchema = z.object({
  id: z.string().min(1),
  isPaid: z.boolean(),
});

// Goals
export const createGoalSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  targetAmount: z.number().positive().finite(),
  currentAmount: z.number().min(0).finite().default(0),
  deadline: z.string().optional().nullable(),
});

export const updateGoalSchema = z.object({
  id: z.string().min(1),
  currentAmount: z.number().min(0).finite(),
});

// Recurring Transactions
export const createRecurringSchema = z.object({
  accountId: z.string().min(1),
  amount: z.number().positive().finite(),
  type: z.enum(["credit", "debit"]),
  category: z.string().min(1).max(50),
  merchant: z.string().max(100).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
  frequency: z.enum(["daily", "weekly", "biweekly", "monthly", "yearly"]),
  startDate: z.string().min(1),
});

// Settings
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(100).optional(),
});

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

// CSV Import
export const importSchema = z.object({
  csv: z.string().min(1, "CSV data is required"),
  accountId: z.string().min(1, "Account is required"),
  dateColumn: z.number().optional(),
  descriptionColumn: z.number().optional(),
  amountColumn: z.number().optional(),
  creditColumn: z.number().optional(),
  debitColumn: z.number().optional(),
});

// Helper to parse and validate request body
export async function validateBody<T>(
  req: Request,
  schema: z.ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    const body = await req.json();
    const result = schema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.issues[0];
      return { data: null, error: firstError.message };
    }
    return { data: result.data, error: null };
  } catch {
    return { data: null, error: "Invalid request body" };
  }
}
