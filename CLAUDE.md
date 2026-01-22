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
├── agents/           # OCR and receipt audit logic
└── services/         # Business logic services
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

## Security Notes

- Debug/seed/test-user endpoints are disabled in production
- All Server Actions require `auth()` check
- OCR URL endpoint has SSRF protection (blocks internal IPs)
- Cron endpoint requires `CRON_SECRET_KEY` header
#