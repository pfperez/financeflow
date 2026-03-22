import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { importSchema } from "@/lib/validations";

interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function guessCategory(description: string): string {
  const desc = description.toLowerCase();
  if (/salary|payroll|wage|direct deposit/i.test(desc)) return "Salary";
  if (/uber|lyft|taxi|bus|train|fuel|gas|petrol|parking/i.test(desc)) return "Transportation";
  if (/amazon|ebay|shop|store|mall|purchase/i.test(desc)) return "Shopping";
  if (/restaurant|cafe|coffee|mcdonalds|starbucks|food|eat|dining|pizza|burger/i.test(desc)) return "Food & Dining";
  if (/netflix|spotify|hulu|disney|cinema|movie|game|steam/i.test(desc)) return "Entertainment";
  if (/electric|water|gas|internet|phone|mobile|utility|bill/i.test(desc)) return "Bills & Utilities";
  if (/rent|mortgage|property/i.test(desc)) return "Rent";
  if (/doctor|hospital|pharmacy|medical|health|dental/i.test(desc)) return "Healthcare";
  if (/school|university|course|tuition|book/i.test(desc)) return "Education";
  if (/hotel|flight|airbnb|booking|travel|vacation/i.test(desc)) return "Travel";
  if (/grocery|supermarket|walmart|tesco|aldi|lidl|costco|whole foods/i.test(desc)) return "Groceries";
  if (/subscription|membership|premium/i.test(desc)) return "Subscriptions";
  if (/interest|dividend|investment|stock|crypto/i.test(desc)) return "Investment";
  if (/transfer|sent|received/i.test(desc)) return "Other";
  return "Other";
}

function parseDate(dateStr: string): Date | null {
  // Try common date formats
  const formats = [
    // ISO
    /^(\d{4})-(\d{2})-(\d{2})/,
    // DD/MM/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})/,
    // MM/DD/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})/,
    // DD-MM-YYYY
    /^(\d{2})-(\d{2})-(\d{4})/,
  ];

  // Try native Date parsing first
  const native = new Date(dateStr);
  if (!isNaN(native.getTime())) return native;

  // Try DD/MM/YYYY
  const ddmmyyyy = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (ddmmyyyy) {
    const d = new Date(`${ddmmyyyy[3]}-${ddmmyyyy[2]}-${ddmmyyyy[1]}`);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const result = importSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
  }

  const { csv, accountId, dateColumn, descriptionColumn, amountColumn, creditColumn, debitColumn } = result.data;

  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: session.user.id },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const lines = csv.split("\n").filter((l: string) => l.trim());
  if (lines.length < 2) {
    return NextResponse.json({ error: "CSV must have a header row and at least one data row" }, { status: 400 });
  }

  const headers = parseCSVLine(lines[0]).map((h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  // Auto-detect or use provided column indices
  const dateIdx = dateColumn !== undefined ? dateColumn : headers.findIndex((h: string) => /date/.test(h));
  const descIdx = descriptionColumn !== undefined ? descriptionColumn : headers.findIndex((h: string) => /desc|narration|particular|memo|reference|payee/.test(h));
  const amtIdx = amountColumn !== undefined ? amountColumn : headers.findIndex((h: string) => /^amount$/.test(h));
  const creditIdx = creditColumn !== undefined ? creditColumn : headers.findIndex((h: string) => /credit|deposit|in/.test(h));
  const debitIdx = debitColumn !== undefined ? debitColumn : headers.findIndex((h: string) => /debit|withdrawal|out/.test(h));

  if (dateIdx === -1) {
    return NextResponse.json({ error: "Could not detect date column" }, { status: 400 });
  }

  const hasSeparateColumns = creditIdx !== -1 && debitIdx !== -1;
  const hasSingleAmount = amtIdx !== -1;

  if (!hasSeparateColumns && !hasSingleAmount) {
    return NextResponse.json({ error: "Could not detect amount column(s)" }, { status: 400 });
  }

  const parsed: ParsedRow[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length < 2) continue;

    const dateStr = cols[dateIdx];
    const date = parseDate(dateStr);
    if (!date) {
      errors.push(`Row ${i + 1}: Invalid date "${dateStr}"`);
      continue;
    }

    const description = descIdx !== -1 ? cols[descIdx] || "" : "";
    let amount = 0;
    let type: "credit" | "debit" = "debit";

    if (hasSeparateColumns) {
      const creditVal = parseFloat((cols[creditIdx] || "0").replace(/[^0-9.-]/g, "")) || 0;
      const debitVal = parseFloat((cols[debitIdx] || "0").replace(/[^0-9.-]/g, "")) || 0;
      if (creditVal > 0) {
        amount = creditVal;
        type = "credit";
      } else {
        amount = Math.abs(debitVal);
        type = "debit";
      }
    } else {
      const rawAmount = parseFloat((cols[amtIdx] || "0").replace(/[^0-9.-]/g, ""));
      amount = Math.abs(rawAmount);
      type = rawAmount >= 0 ? "credit" : "debit";
    }

    if (amount === 0) continue;

    parsed.push({
      date: date.toISOString(),
      description,
      amount: Math.round(amount * 100) / 100,
      type,
    });
  }

  // Create transactions
  let imported = 0;
  let totalBalanceChange = 0;

  for (const row of parsed) {
    await prisma.transaction.create({
      data: {
        userId: session.user.id,
        accountId,
        amount: row.amount,
        type: row.type,
        category: guessCategory(row.description),
        merchant: row.description || null,
        note: "[Imported] CSV import",
        date: new Date(row.date),
      },
    });

    totalBalanceChange += row.type === "credit" ? row.amount : -row.amount;
    imported++;
  }

  // Update account balance
  if (totalBalanceChange !== 0) {
    await prisma.account.update({
      where: { id: accountId },
      data: { balance: { increment: totalBalanceChange } },
    });
  }

  return NextResponse.json({
    imported,
    errors: errors.slice(0, 10),
    totalErrors: errors.length,
  });
}
