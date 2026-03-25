# FinanceFlow — Product Requirements Document

## Overview

FinanceFlow is a full-stack personal finance management web application designed as a portfolio project. It allows users to track bank accounts, log transactions, set budgets, manage bills, plan savings goals, and visualize spending patterns through an analytics dashboard.

**Live URL**: https://financeflow-gklkydnwo-pfperezs-projects.vercel.app
**Repository**: https://github.com/pfperez/financeflow

---

## Target Users

- Individuals who want a centralized view of their finances
- Users who track spending across multiple bank accounts and credit cards
- People who set monthly budgets and savings goals

---

## Core Features

### 1. Authentication
- **Email/password registration and login** with bcrypt password hashing
- **GitHub OAuth** login
- **Google OAuth** login
- JWT-based sessions (no database sessions)
- Protected routes — unauthenticated users redirected to `/login`

### 2. Dashboard (Home)
- Greeting with user's first name
- Total balance across all accounts
- Summary cards: recent income, recent expenses, upcoming bills count
- Horizontal-scrolling account cards with gradient backgrounds
- Recent transactions list (last 5)
- Savings goals progress bars
- "Load Demo Data" button for empty accounts (seeds realistic sample data)

### 3. Accounts
- Create financial accounts: **checking, savings, credit card, investment**
- Set starting balance, color, and currency (12 currencies supported: USD, EUR, GBP, etc.)
- View total balance across all accounts
- Delete accounts (cascades to related transactions)
- Gradient card UI with fake card number display

### 4. Transactions
- Log income (credit) and expenses (debit) with:
  - Account selection
  - Amount, type, category (15 categories), merchant, note, date
- **Search** by merchant name
- **Filter** by category and type (income/expense)
- **Paginated** list (20 per page) with page navigation
- **Export to CSV** (downloads all visible transactions)
- Delete transactions (reverses account balance)
- Auto-updates account balance on create/delete

### 5. Transfers
- Move money between accounts
- Tracks: from account, to account, amount, note, date
- Auto-adjusts both account balances
- Transfer history list

### 6. Analytics
- **Spending by Category** — interactive donut/pie chart
- **Income vs Expenses** — monthly bar chart (last 6 months)
- **Daily Spending Trend** — line chart (last 30 days)
- **Top Spending Categories** — horizontal bar list with percentages
- Summary cards: total income, total expenses, net cash flow

### 7. Budgets
- Set monthly spending limits per category
- Progress bar showing spent vs limit
- Color-coded: green (under), yellow (approaching), red (over budget)
- Unique per user/category/month

### 8. Bills & Reminders
- Track recurring bills with due dates
- Frequencies: weekly, monthly, yearly, one-time
- Mark as paid/unpaid (toggle)
- Summary cards: unpaid count, paid this month, overdue count
- Overdue bills highlighted with red indicator
- Separate sections for upcoming/overdue and paid bills

### 9. Savings Goals
- Set financial targets with optional deadlines
- Track current progress vs target amount
- Add/withdraw funds toward goals
- Visual progress bar with percentage

### 10. Recurring Transactions
- Automate repeating income/expenses
- Frequencies: daily, weekly, biweekly, monthly, yearly
- Toggle active/inactive
- Tracks next run date
- Linked to specific account

### 11. CSV Import
- Upload bank statement CSV files
- Automatic column detection (date, amount, description, category)
- Smart category guessing based on merchant names
- Preview before importing
- Links imported transactions to selected account

### 12. Settings
- Update profile (name, email)
- Change password (requires current password)
- Delete account permanently (requires password confirmation)
- Shows member-since date and user avatar (initials)

### 13. Dark Mode
- Full light/dark theme toggle
- Persisted via next-themes
- Available in sidebar and mobile nav

### 14. Landing Page
- Marketing page for unauthenticated visitors
- Hero section with CTA buttons
- Dashboard preview mockup
- 8 feature cards
- Tech stack badges
- Redirects authenticated users to dashboard

### 15. Demo Data
- One-click seed with realistic financial data
- 25+ merchants with category-specific price ranges and frequencies
- Biweekly salary deposits ($3,250 each)
- 6 months of transaction history
- Pre-configured budgets, bills, goals, and recurring transactions

---

## Data Model

| Model | Key Fields | Relations |
|-------|-----------|-----------|
| **User** | email, hashedPassword, name, image | Has many: accounts, transactions, transfers, budgets, bills, goals, recurring |
| **Account** | name, type, balance, currency, color | Belongs to user; has many transactions |
| **Transaction** | amount, type, category, merchant, date | Belongs to user + account |
| **Transfer** | amount, status, note, date | Belongs to user + fromAccount + toAccount |
| **Budget** | category, monthlyLimit, month | Belongs to user; unique per user/category/month |
| **Bill** | name, amount, dueDate, frequency, isPaid | Belongs to user |
| **SavingsGoal** | name, targetAmount, currentAmount, deadline | Belongs to user |
| **RecurringTransaction** | amount, frequency, nextRunDate, isActive | Belongs to user + account |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| GET/POST/DELETE | `/api/accounts` | List, create, delete accounts |
| GET/POST/DELETE | `/api/transactions` | List (paginated), create, delete transactions |
| GET/POST | `/api/transfers` | List and create transfers |
| GET/POST/PATCH/DELETE | `/api/budgets` | CRUD budgets |
| GET/POST/PATCH/DELETE | `/api/bills` | CRUD bills + toggle paid |
| GET/POST/PATCH | `/api/goals` | CRUD savings goals |
| GET/POST/PATCH/DELETE | `/api/recurring-transactions` | CRUD recurring transactions |
| POST | `/api/import` | Import CSV bank statements |
| GET/PATCH/DELETE | `/api/settings` | Profile, password, account deletion |
| POST | `/api/seed` | Load demo data |

All endpoints require authentication (except register). All POST/PATCH bodies validated with Zod schemas.

---

## Non-Functional Requirements

| Requirement | Implementation |
|------------|---------------|
| **Authentication** | NextAuth.js v5, JWT sessions, bcrypt passwords |
| **Validation** | Zod 4 on all API inputs |
| **Responsive** | Mobile-first with Tailwind breakpoints (sm/md/lg) |
| **Performance** | Pagination on transactions, lazy data fetching |
| **Testing** | 58 tests across 5 test files (Vitest + RTL) |
| **Error Handling** | ErrorBoundary component, toast notifications |
| **Deployment** | Vercel (serverless), Turso (hosted SQLite) |
| **Type Safety** | Full TypeScript, Prisma generated types |

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| Language | TypeScript | 5 |
| UI Library | React | 19.2.3 |
| Styling | Tailwind CSS | 4 |
| Components | shadcn/ui + Radix UI | — |
| Charts | Recharts | 2.15.4 |
| Database | SQLite / Turso (LibSQL) | — |
| ORM | Prisma | 7.4.2 |
| Auth | NextAuth.js | 5.0.0-beta.30 |
| Validation | Zod | 4.3.6 |
| Testing | Vitest + React Testing Library | 4.0.18 |
| Notifications | Sonner | 2.0.7 |
| Hosting | Vercel | — |

---

## Pages

| Route | Description | Auth Required |
|-------|-------------|---------------|
| `/` | Landing page (redirects to dashboard if logged in) | No |
| `/login` | Login form + OAuth buttons | No |
| `/register` | Registration form + OAuth buttons | No |
| `/` (dashboard) | Dashboard home with overview | Yes |
| `/accounts` | Account management | Yes |
| `/transactions` | Transaction list with filters | Yes |
| `/transfers` | Transfer history and creation | Yes |
| `/analytics` | Charts and spending insights | Yes |
| `/budgets` | Monthly budget tracking | Yes |
| `/bills` | Bill reminders and tracking | Yes |
| `/goals` | Savings goal progress | Yes |
| `/recurring` | Recurring transaction management | Yes |
| `/import` | CSV file import | Yes |
| `/settings` | Profile and account settings | Yes |
