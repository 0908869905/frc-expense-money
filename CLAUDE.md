# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FRC 報帳系統 (FRC Expense Reimbursement System) - A Next.js application for managing expense reports, inventory, and funding for FRC (FIRST Robotics Competition) teams.

## Commands

```bash
# Development
npm run dev          # Start development server

# Build & Production
npm run build        # Generate Prisma client + build Next.js
npm run start        # Start production server

# Linting
npm run lint         # Run ESLint

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Push schema to database
npm run db:seed      # Seed database (npx tsx prisma/seed.ts)

# Diagnostic Scripts
npx tsx scripts/check-user.ts <email> [password]    # Check user account
npx tsx scripts/clear-login-lock.ts <email>         # Clear login rate limit
```

## Architecture

### Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Auth:** NextAuth v5 (beta) with credentials provider
- **ORM:** Prisma with PostgreSQL
- **Cache:** Upstash Redis (session management, rate limiting)
- **Styling:** Tailwind CSS
- **OCR:** Google Cloud Vision API

### Directory Structure

```
app/
├── actions/          # Server Actions (業務邏輯)
├── api/              # API Routes (NextAuth, cron jobs)
├── dashboard/        # Protected pages (requires auth)
└── (public pages)    # login, register, terms, privacy

components/
├── ui/               # Reusable UI components
├── admin/            # Admin-specific components
├── expense/          # Expense form components
├── inventory/        # Inventory management
└── funding/          # Funding management

lib/
├── prisma.ts         # Prisma client singleton
├── redis.ts          # Upstash Redis client
├── schemas.ts        # Zod validation schemas
├── actions/          # Auth helper functions
├── agents/           # OCR and receipt audit logic
└── services/         # Business logic services

scripts/
├── check-user.ts     # User account diagnostic
└── clear-login-lock.ts # Clear rate limit lock
```

### Authentication & Authorization

Auth is handled in `auth.ts` using NextAuth v5. Roles hierarchy:
- `USER` - View only
- `VICE_LEADER` - Create expense reports, view team funds
- `LEADER` - Approve team expense reports
- `FINANCE` - Financial review and approval
- `ADMIN` - Full system access

Dashboard layout (`app/dashboard/layout.tsx`) protects all `/dashboard/*` routes.

### Expense Report Flow

1. **DRAFT** → User creates report
2. **PENDING_MANAGER** → Awaiting team leader approval
3. **PENDING_FINANCE** → Awaiting finance review
4. **PAID** / **REJECTED** / **RETURNED** → Final states

### Server Actions Pattern

All mutations use Server Actions in `app/actions/`. Pattern:
```typescript
"use server"
import { auth } from "@/auth"

export async function actionName() {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" }
  }
  // ... business logic with Prisma
}
```

**Note:** Helper libraries (e.g., `lib/actions/helpers.ts`) should NOT have `"use server"` - only actual Server Action files need it.

### Data Models

Key Prisma models (see `prisma/schema.prisma`):
- `User` - Users with roles and departments
- `ExpenseReport` / `ExpenseItem` - Expense tracking
- `InventoryItem` / `InventoryTransaction` - Parts inventory
- `FundingRecord` - Sponsorship and funding tracking
- `DepartmentBudget` - Team budget allocation

### Money Handling

Uses integer cents (`amountCents`) for precision. Convert with `lib/money.ts`:
- `toStorageUnit(amount)` - Float to cents
- `fromStorageUnit(cents)` - Cents to float

## Environment Variables

Required in `.env`:
```
DATABASE_URL          # PostgreSQL connection
DIRECT_URL            # Direct PostgreSQL (for Prisma)
AUTH_SECRET           # NextAuth secret
CRON_SECRET_KEY       # Cron job authorization
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
GOOGLE_APPLICATION_CREDENTIALS_JSON  # For OCR
```

**Local development:** Comment out `AUTH_URL` to let NextAuth auto-detect.

## Security Notes

- **`.env` 不可提交到 Git** - 只有 `.env.example` 可以追蹤
- Debug/seed/test-user endpoints are disabled in production
- All Server Actions require `auth()` check
- OCR URL endpoint has SSRF protection (blocks internal IPs)
- Cron endpoint requires `CRON_SECRET_KEY` header
- Login rate limiting: 5 attempts per 15 minutes per email
- Global rate limiting: 100 requests per minute per IP

## Common Patterns

### Prisma JSON Fields

When saving JSON data to Prisma:
```typescript
import { Prisma } from "@prisma/client";

const issuesJson = result.issues.length > 0
    ? (result.issues as unknown as Prisma.InputJsonValue)
    : Prisma.JsonNull;
```

### TypeScript Interface for Record<string, T>

Add index signature for compatibility:
```typescript
interface MyRow {
    [key: string]: string | number;  // Required for Record<string, T>
    name: string;
    value: number;
}
```

### External Service Error Handling

Always wrap external service calls with try-catch:
```typescript
try {
  await redis.get(key)
} catch (error) {
  console.warn("Redis failed:", error)
  return fallbackValue  // Graceful degradation
}
```

## Pre-deployment Checklist

```bash
npm run build  # Always run before pushing
```

## Documentation Files

- `TROUBLESHOOTING.md` - Error diagnosis and solutions
- `progress.md` - Development session logs
- `findings.md` - Technical discoveries and decisions
