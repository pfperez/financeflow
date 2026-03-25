# FinanceFlow

Personal finance management web app. Live at https://financeflow-gklkydnwo-pfperezs-projects.vercel.app

## Quick Reference

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # prisma generate && next build
npm test             # vitest run (58 tests)
npm run test:watch   # vitest in watch mode
npm run lint         # eslint
```

## Tech Stack

- **Framework**: Next.js 16.1.6 (App Router, React 19, TypeScript 5)
- **Database**: SQLite via LibSQL + Prisma 7.4.2 (Turso in production)
- **Auth**: NextAuth.js v5-beta.30 — Credentials + GitHub + Google OAuth, JWT sessions
- **Styling**: Tailwind CSS 4, shadcn/ui, Radix UI
- **Validation**: Zod 4 (uses `.issues` not `.errors` on ZodError)
- **Charts**: Recharts
- **Testing**: Vitest 4 + @testing-library/react + jsdom
- **Notifications**: Sonner (toast)

## Architecture

### Route Groups
- `src/app/(auth)/` — Login & register (public)
- `src/app/(dashboard)/` — All protected pages (12 pages), guarded by `layout.tsx` session check
- `src/app/api/` — 12 REST API routes, all use Zod validation via `validateBody()`

### Key Patterns
- **Prisma singleton**: `src/lib/prisma.ts` — uses PrismaLibSql adapter, reads `DATABASE_URL` + `DATABASE_AUTH_TOKEN` from env
- **Auth helper**: `src/lib/auth.ts` — `auth()` returns session, used in API routes and layouts
- **Validation**: `src/lib/validations.ts` — `validateBody(req, schema)` returns `{ data, error }` discriminated union. After checking `if (result.error)`, use `result.data!` (non-null assertion) because TS can't narrow through the check
- **Categories**: `src/lib/categories.ts` — colors, icons, account types, currencies
- **Formatting**: `src/lib/format.ts` — `formatCurrency()`, `formatDate()`, etc.

### Database
- Schema at `prisma/schema.prisma` — 10 models (User, AuthAccount, Session, Account, Transaction, Transfer, Budget, SavingsGoal, Bill, RecurringTransaction)
- Prisma config at `prisma.config.ts` — reads DATABASE_URL from env, falls back to `file:./dev.db`
- Production: Turso (LibSQL) on `libsql://financeflow-pfperez.aws-eu-west-1.turso.io`
- Local: `dev.db` (SQLite file, gitignored)

### API Route Conventions
- All routes check `auth()` first, return 401 if unauthenticated
- POST/PATCH use `validateBody(req, schema)` for Zod validation
- GET supports query params for filtering/pagination
- Transactions GET returns `{ transactions, total, page, totalPages }`
- All other GETs return arrays directly

### Testing
- Tests in `src/__tests__/` (5 files, 58 tests)
- API tests mock `@/lib/auth` and `@/lib/prisma` with `vi.mock()`
- Setup file: `src/__tests__/setup.ts`

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | LibSQL/SQLite connection URL |
| `DATABASE_AUTH_TOKEN` | Production | Turso auth token |
| `AUTH_SECRET` | Yes | NextAuth JWT signing secret |
| `NEXTAUTH_URL` | Dev only | Base URL (http://localhost:3000) |
| `GITHUB_ID` | No | GitHub OAuth client ID |
| `GITHUB_SECRET` | No | GitHub OAuth client secret |
| `GOOGLE_ID` | No | Google OAuth client ID |
| `GOOGLE_SECRET` | No | Google OAuth client secret |

## Common Pitfalls

- Zod 4 uses `.issues` not `.errors` on ZodError objects
- After `validateBody()` check, use `result.data!` — TypeScript can't narrow the discriminated union through the `if` guard
- `npx` requires nvm to be loaded first on this machine: `export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"`
- Prisma `db push` does NOT support `libsql://` URLs — use Turso web UI "Edit Data" tab to run raw SQL
- The user (sherman) does not have admin/sudo access on this Mac — cannot install Homebrew or system packages
