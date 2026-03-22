// Shared types used across the application

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
  currency: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  merchant: string | null;
  note: string | null;
  date: string;
  account: { name: string; type: string; color: string };
}

export interface Transfer {
  id: string;
  amount: number;
  status: string;
  note: string | null;
  date: string;
  fromAccount: { id: string; name: string; type: string; color: string };
  toAccount: { id: string; name: string; type: string; color: string };
}

export interface Budget {
  id: string;
  category: string;
  monthlyLimit: number;
  month: string;
  spent: number;
  percentage: number;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: string;
  category: string;
  isPaid: boolean;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string | null;
  createdAt: string;
}

export interface RecurringTransaction {
  id: string;
  amount: number;
  type: string;
  category: string;
  merchant: string | null;
  note: string | null;
  frequency: string;
  startDate: string;
  nextRunDate: string;
  isActive: boolean;
  account: { name: string; type: string; color: string };
}

export interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
}
