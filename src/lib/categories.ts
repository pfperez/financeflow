export const CATEGORIES = [
  { name: "Food & Dining", color: "#ef4444", icon: "🍔" },
  { name: "Transportation", color: "#f97316", icon: "🚗" },
  { name: "Shopping", color: "#eab308", icon: "🛍️" },
  { name: "Bills & Utilities", color: "#22c55e", icon: "💡" },
  { name: "Entertainment", color: "#3b82f6", icon: "🎬" },
  { name: "Healthcare", color: "#8b5cf6", icon: "🏥" },
  { name: "Education", color: "#ec4899", icon: "📚" },
  { name: "Travel", color: "#14b8a6", icon: "✈️" },
  { name: "Income", color: "#10b981", icon: "💰" },
  { name: "Salary", color: "#059669", icon: "💵" },
  { name: "Investment", color: "#6366f1", icon: "📈" },
  { name: "Rent", color: "#d946ef", icon: "🏠" },
  { name: "Groceries", color: "#84cc16", icon: "🛒" },
  { name: "Subscriptions", color: "#06b6d4", icon: "📱" },
  { name: "Other", color: "#6b7280", icon: "📋" },
] as const;

export const CATEGORY_NAMES = CATEGORIES.map((c) => c.name);

export function getCategoryColor(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.color ?? "#6b7280";
}

export function getCategoryIcon(name: string): string {
  return CATEGORIES.find((c) => c.name === name)?.icon ?? "📋";
}

export const ACCOUNT_TYPES = [
  { value: "checking", label: "Checking", icon: "🏦" },
  { value: "savings", label: "Savings", icon: "🐷" },
  { value: "credit", label: "Credit Card", icon: "💳" },
  { value: "investment", label: "Investment", icon: "📈" },
] as const;

export const ACCOUNT_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#22c55e",
  "#f97316",
  "#8b5cf6",
  "#ec4899",
  "#14b8a6",
  "#eab308",
];

export const BILL_FREQUENCIES = [
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
  { value: "one-time", label: "One-time" },
] as const;

export const CURRENCIES = [
  { value: "USD", label: "USD ($)", symbol: "$" },
  { value: "EUR", label: "EUR (€)", symbol: "€" },
  { value: "GBP", label: "GBP (£)", symbol: "£" },
  { value: "JPY", label: "JPY (¥)", symbol: "¥" },
  { value: "CAD", label: "CAD (C$)", symbol: "C$" },
  { value: "AUD", label: "AUD (A$)", symbol: "A$" },
  { value: "CHF", label: "CHF (Fr)", symbol: "Fr" },
  { value: "CNY", label: "CNY (¥)", symbol: "¥" },
  { value: "INR", label: "INR (₹)", symbol: "₹" },
  { value: "NGN", label: "NGN (₦)", symbol: "₦" },
  { value: "KRW", label: "KRW (₩)", symbol: "₩" },
  { value: "BRL", label: "BRL (R$)", symbol: "R$" },
] as const;
