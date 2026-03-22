# FinanceFlow

A full-stack personal finance management application built with Next.js, featuring real-time dashboards, transaction tracking, budgeting, and financial goal planning.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Prisma](https://img.shields.io/badge/Prisma-7-teal)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8)

## Features

- **Dashboard** — At-a-glance overview with account balances, spending charts, and recent activity
- **Accounts** — Create and manage checking, savings, credit, and investment accounts with multi-currency support
- **Transactions** — Log income and expenses with categories, merchants, and notes
- **Transfers** — Move money between accounts with full transfer history
- **Budgets** — Set monthly spending limits per category with progress tracking
- **Bills** — Track upcoming bills with due dates and payment status
- **Savings Goals** — Set financial targets with deadlines and monitor progress
- **Recurring Transactions** — Automate repeating income/expenses (daily, weekly, biweekly, monthly, yearly)
- **CSV Import** — Import bank statements with automatic column detection and category guessing
- **Settings** — Update profile, change password, manage account
- **Dark Mode** — Full light/dark theme support
- **Auth** — Secure email/password authentication with JWT sessions
- **Demo Data** — One-click seed with realistic sample data

## Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Transactions
![Transactions](screenshots/transactions.png)

### Analytics
![Analytics](screenshots/analytics.png)

### Accounts
![Accounts](screenshots/accounts.png)

### Dark Mode
![Dark Mode](screenshots/dark-mode.png)

> To add your own screenshots, take screenshots of the app and save them in the `screenshots/` folder.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19, Tailwind CSS 4, shadcn/ui, Radix UI |
| Charts | Recharts |
| Database | SQLite via LibSQL + Prisma ORM |
| Auth | NextAuth.js v5 (Credentials + GitHub + Google OAuth) |
| Testing | Vitest + React Testing Library |
| Validation | Zod |
| Notifications | Sonner |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/financeflow.git
cd financeflow

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and set AUTH_SECRET (generate with: npx auth secret)

# Generate Prisma client and create database
npx prisma generate
npx prisma db push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | SQLite database path (default: `file:./dev.db`) |
| `AUTH_SECRET` | NextAuth.js secret for JWT signing |
| `GITHUB_ID` | GitHub OAuth App Client ID (optional) |
| `GITHUB_SECRET` | GitHub OAuth App Client Secret (optional) |
| `GOOGLE_ID` | Google OAuth Client ID (optional) |
| `GOOGLE_SECRET` | Google OAuth Client Secret (optional) |

### Seed Demo Data

After creating an account, click **"Load Demo Data"** on the dashboard to populate the app with realistic sample transactions, budgets, bills, and goals.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & register pages
│   ├── (dashboard)/     # Protected dashboard pages
│   │   ├── accounts/    # Account management
│   │   ├── bills/       # Bill tracking
│   │   ├── budgets/     # Budget management
│   │   ├── goals/       # Savings goals
│   │   ├── import/      # CSV import
│   │   ├── recurring/   # Recurring transactions
│   │   ├── settings/    # Profile & settings
│   │   └── transfers/   # Account transfers
│   └── api/             # REST API routes
├── components/
│   ├── dashboard/       # Dashboard-specific components
│   └── ui/              # shadcn/ui components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities (auth, prisma, validation)
└── types/               # Shared TypeScript interfaces
```

## API Routes

All API routes include Zod request validation and return structured JSON responses.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/accounts` | List & create accounts |
| GET/POST | `/api/transactions` | List & create transactions |
| GET/POST | `/api/transfers` | List & create transfers |
| GET/POST | `/api/budgets` | List & create budgets |
| GET/POST/PATCH | `/api/bills` | List, create & toggle bills |
| GET/POST/PATCH | `/api/goals` | List, create & update goals |
| GET/POST/PATCH/DELETE | `/api/recurring-transactions` | Manage recurring transactions |
| POST | `/api/import` | Import CSV bank statements |
| GET/PATCH/DELETE | `/api/settings` | Profile & account management |
| POST | `/api/auth/register` | User registration |
| POST | `/api/seed` | Load demo data |
