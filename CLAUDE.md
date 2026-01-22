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

- **`.env` 不可提交到 Git** - 只有 `.env.example` 可以追蹤（參見全域 CLAUDE.md）
- Debug/seed/test-user endpoints are disabled in production
- All Server Actions require `auth()` check
- OCR URL endpoint has SSRF protection (blocks internal IPs)
- Cron endpoint requires `CRON_SECRET_KEY` header

---

## 專案特定注意事項

### Prisma JSON 欄位處理

本專案使用 Prisma 的 `Json` 類型欄位（如 `ReceiptAudit.issues`）。
儲存資料時必須使用正確的類型轉換：

```typescript
import { Prisma } from "@prisma/client";

// 正確做法
const issuesJson = result.issues.length > 0
    ? (result.issues as unknown as Prisma.InputJsonValue)
    : Prisma.JsonNull;
```

### 類型聲明檔案

本專案需要的自定義類型聲明：
- `types/dinero.d.ts` - dinero.js 金額計算庫
- `types/next-auth.d.ts` - NextAuth 擴展

### 部署前必做

```bash
# 推送前務必執行
npm run build
```

---

## 問題紀錄

### 2026-01-22：Vercel 部署失敗

**問題**：連續多次部署失敗

**錯誤**：
1. `Type 'Record<string, unknown>[]' is not assignable to type 'NullableJsonNullValueInput'`
2. `Cannot find module 'dinero.js' type declarations`
3. `Cannot find module '@/lib/ocr'`

**原因**：
1. 程式碼重構時沒有同步更新所有引用
2. 存在重複檔案但沒有同步維護
3. 缺少第三方模組類型聲明

**修復**：
- 修正 Prisma JSON 類型轉換（2 個檔案）
- 添加 dinero.js 類型聲明
- 修正 types/audit.ts 的導入路徑

### 2026-01-22：完整安全掃描與程式碼簡化

**安全掃描**（6 批次完成）：
- 掃描範圍：components、app/actions、app/api、app/dashboard、lib、types
- 發現並修復 8 個安全問題
- 所有 dashboard 頁面已有正確的 `auth()` 檢查
- OWASP Top 10 合規檢查通過

**程式碼簡化**：
- 刪除 7 個重複檔案（lib/db/、lib/utils/ 目錄）
- 淨減少 907 行程式碼
- 提取輔助函式減少重複
- 添加明確回傳類型
- 使用 Promise.all 優化並行查詢

**已刪除的重複檔案**：
- `lib/db/draft-storage.ts` → 使用 `lib/draft-storage.ts`
- `lib/db/prisma.ts` → 使用 `lib/prisma.ts`
- `lib/utils/currency.ts` → 使用 `lib/currency.ts`
- `lib/utils/export-utils.ts` → 使用 `lib/export-utils.ts`
- `lib/utils/money.ts` → 使用 `lib/money.ts`
- `lib/utils/pagination.ts` → 使用 `lib/pagination.ts`
- `lib/utils/utils.ts` → 使用 `lib/utils.ts`

**待手動執行**：
- 替換 `.env` 中的 `AUTH_SECRET` 和 `CRON_SECRET_KEY` 為強密碼
