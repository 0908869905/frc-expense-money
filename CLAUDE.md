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

### 2026-01-24：註冊功能增強 + 安全性修復

**功能新增**：
- 註冊介面新增組別下拉選單（**必填**）
- 支援六個組別：電資、機構、文書、公關、財管、意象
- 組別資料儲存至 User 模型的 `department` 欄位

**安全修復**：
| 嚴重度 | 問題 | 修復 |
|--------|------|------|
| HIGH | 缺少 CSP 標頭 | 新增 Content-Security-Policy |
| HIGH | CRON 時序攻擊 | 使用 `crypto.timingSafeEqual()` |
| HIGH | 報帳單拒絕缺少狀態驗證 | 新增可拒絕狀態檢查 |
| MEDIUM | 弱密碼要求 | 加強至 8 字元，含英文和數字 |
| MEDIUM | JSON 大小未限制 | 新增 1MB 大小限制 |

**修改的檔案**：
- `app/actions/register.ts` - 組別必填 + 密碼強度
- `app/actions/approvals.ts` - 狀態驗證
- `app/actions/expenses.ts` - JSON 大小限制
- `app/api/cron/cleanup-sessions/route.ts` - Timing-safe 比較
- `components/register-form.tsx` - 組別下拉選單
- `lib/language-context.tsx` - 組別翻譯
- `next.config.mjs` - CSP 標頭

**Git Commits**：
- `6a96b63` feat: 註冊時新增組別選擇 + 安全性修復
- `1b69e39` fix: 電控組改為電資組

### 2026-01-24（續）：註冊頁面藝術風格設計 + 程式碼簡化

**註冊頁面全面改造**：
- 與登入頁風格一致：黑色背景 + 紫藍漸層光暈
- 左側視覺區塊（FRC 6998 UNIPARDS 大標題）
- 玻璃質感輸入框 + 聚焦時圖示變色效果
- 自訂組別選擇器（向上展開避免遮擋問題）
- 浮動幾何圖形動畫
- 完整響應式設計（桌面/手機）

**安全性修復**：
| 問題 | 修復 |
|------|------|
| Google Cloud 憑證外洩（已提交到 Git） | 已從追蹤移除，更新 .gitignore |
| 密碼政策不一致 | 統一至 8 字元 + 英文 + 數字 |

**程式碼簡化**：
- 新增共用 `passwordSchema` 和 `validatePassword()` 於 `lib/schemas.ts`
- `validatePassword` 改用 `passwordSchema.safeParse()` 消除重複邏輯
- 提取 `FormField` 組件減少註冊頁面約 50 行重複程式碼
- 新增 `INPUT_CLASS` 常數和 `getIconColor` 輔助函式
- 刪除舊的 `components/register-form.tsx` 和 `components/shared/register-form.tsx`

**修改的檔案**：
- `app/register/page.tsx` - 新藝術風格設計（與登入頁一致）
- `lib/schemas.ts` - 新增 passwordSchema + 簡化 validatePassword
- `app/actions/password.ts` - 使用共用密碼 schema
- `app/actions/users.ts` - 使用共用密碼驗證
- `.gitignore` - 增加憑證檔案排除規則

**Git Commits**：
- `579d84e` chore: remove exposed credentials
- `f977e0c` feat: 註冊頁面藝術風格設計 + 安全性修復

**待辦事項**：
- [ ] **重要**：到 Google Cloud Console 撤銷並更換外洩的服務帳戶金鑰

### 2026-01-25：登入速率限制 + CSP 改善

**登入速率限制**：
- 每個 Email 每 15 分鐘最多 5 次失敗嘗試
- 使用 Redis 追蹤失敗次數（key: `login_attempts:{email}`）
- 登入成功後自動重置計數
- 不透露具體錯誤原因（防止帳號枚舉）

**CSP 改善**：
| 變更 | 說明 |
|------|------|
| 移除 `unsafe-eval` | 僅生產環境，開發環境保留（Hot Reload 需要）|
| 添加 `upgrade-insecure-requests` | 強制 HTTPS |
| 添加 `wss://*.supabase.co` | 支援 WebSocket 連線 |

**修改的檔案**：
- `auth.ts` - 新增速率限制函式和邏輯
- `next.config.mjs` - 改善 CSP 標頭

### 2026-01-25（續）：安全掃描修復

**修復的問題**：

| 嚴重度 | 問題 | 修復 |
|--------|------|------|
| MEDIUM | Timing-Safe 長度洩漏 | 使用固定長度 256 bytes buffer |
| MEDIUM | Debug API 洩漏 email | 遮罩為 `a***@domain.com` |
| LOW | 錯誤訊息洩漏內部細節 | 改為通用錯誤訊息 |
| INFO | 缺少 Middleware | 新增全局速率限制 |

**新增檔案**：
- `middleware.ts` - 全局速率限制（100 req/min per IP）

**修改的檔案**：
- `app/api/cron/cleanup-sessions/route.ts` - 固定長度 timing-safe
- `app/api/debug/route.ts` - email 遮罩
- `app/actions/inventory.ts` - 通用錯誤訊息
- `app/actions/ocr.ts` - 通用錯誤訊息

### 2026-01-25（續）：程式碼簡化

**刪除的重複/未使用檔案（31 個，~7,689 行）**：
- `lib/context/` - 2 個檔案（與 `lib/` 下重複）
- `components/dashboard/` - 5 個檔案
- `components/admin/` - 5 個檔案
- `components/audit/` - 3 個檔案
- `components/expense/` - 3 個檔案
- `components/funding/` - 2 個檔案
- `components/inventory/` - 1 個檔案
- `components/layout/` - 2 個檔案
- `components/shared/` - 3 個檔案
- `components/` 根目錄 - 4 個檔案
- `types.ts` - 與 `types/index.ts` 重複

**修復 Vercel 部署錯誤**：
```typescript
// 修復前（Vercel 報錯：downlevelIteration）
for (const [ip, record] of ipRequestCounts.entries()) { ... }

// 修復後
ipRequestCounts.forEach((record, ip) => { ... })
```

**Git Commits**：
- `9f9aa8c` feat: 登入速率限制 + CSP 改善
- `5b9c5f7` fix: 安全掃描修復
- `240a02c` refactor: 程式碼簡化 + 修復 Vercel 部署錯誤

**待辦事項**：
- [ ] 替換 `.env` 中的 `AUTH_SECRET` 和 `CRON_SECRET_KEY` 為強密碼
- [ ] 到 Google Cloud Console 撤銷外洩的服務帳戶金鑰（如尚未完成）

### 2026-01-25（續）：登入失敗問題修復

**問題描述**：
用戶輸入正確密碼，但無法登入且沒有錯誤訊息。

**根本原因分析**：
| 問題 | 原因 | 影響 |
|------|------|------|
| Redis 連接失敗 | Upstash Redis DNS 無法解析 | 速率限制檢查拋出異常，登入流程中斷 |
| AUTH_URL 錯誤 | `.env` 中設為 Vercel 線上地址 | 本地開發時 cookie 域名不匹配，session 無法保存 |

**修復方案**：

1. **Redis 錯誤處理**（`auth.ts`）：
```typescript
// 修復前：Redis 失敗會中斷登入
const rateLimit = await checkLoginRateLimit(email)

// 修復後：Redis 失敗時降級運作（跳過速率限制）
async function checkLoginRateLimit(email: string) {
  try {
    // ... Redis 操作
  } catch (error) {
    console.warn("Redis connection failed:", error)
    return { allowed: true, remaining: 5 }  // 允許登入繼續
  }
}
```

2. **AUTH_URL 配置**（`.env`）：
```bash
# 本地開發時應註釋掉，讓 NextAuth 自動偵測
# AUTH_URL="https://two-chi-74.vercel.app/login"
```

**修改的檔案**：
- `auth.ts` - 三個 Redis 函式都添加 try-catch 錯誤處理
- `.env` - 註釋掉 AUTH_URL

**經驗教訓**：
1. **外部服務依賴要有降級機制** - Redis 等服務不可用時，核心功能（登入）應該繼續運作
2. **本地開發環境變數要與線上分開** - 使用 `.env.local` 覆蓋或註釋線上配置
3. **錯誤處理要完整** - 所有外部 API 呼叫都應該有 try-catch

**新增腳本**：
- `scripts/check-user.ts` - 檢查用戶帳號狀態和密碼驗證
- `scripts/clear-login-lock.ts` - 清除登入速率限制鎖定

**使用方式**：
```bash
# 檢查用戶帳號
npx tsx scripts/check-user.ts user@example.com [password]

# 清除登入鎖定
npx tsx scripts/clear-login-lock.ts user@example.com
```

### 2026-01-25（續）：Build 錯誤修復

**修復的問題**：

| 錯誤 | 原因 | 修復 |
|------|------|------|
| `Server actions must be async functions` | `lib/actions/helpers.ts` 有 `"use server"` 但含同步函式 | 移除 `"use server"` 指令 |
| `Cannot find name 'useLanguage'` | `funding-dialog.tsx` 使用未導入的 hook | 移除未使用的 `useLanguage` 行 |
| `Using <img> could result in slower LCP` | 使用原生 `<img>` 而非 `next/image` | 改用 `<Image>` 組件 |
| `React Hook has missing dependency` | `useEffect` 依賴陣列不完整 | 加入 `value` 到依賴陣列 |
| `Type 'X' is not assignable to type 'DataRow'` | 介面缺少索引簽名 | 添加 `[key: string]: T` 索引簽名 |

**修改的檔案**：
- `lib/actions/helpers.ts` - 移除 `"use server"` 指令
- `components/funding-dialog.tsx` - 移除未使用的 `useLanguage`
- `components/app-sidebar.tsx` - 改用 `next/image` 的 `Image` 組件
- `components/settings-content.tsx` - 改用 `next/image` 的 `Image` 組件
- `components/ui/currency-input.tsx` - 修正 `useEffect` 依賴陣列
- `app/actions/export.ts` - 添加索引簽名到匯出介面
- `lib/export-utils.ts` - 調整 `DataRow` 類型

**經驗教訓**：
1. **`"use server"` 僅用於 Server Actions 檔案** - 輔助函式庫不需要此指令
2. **Next.js 建議使用 `<Image>` 組件** - 提供自動優化和更好的 LCP
3. **React Hooks 依賴必須完整** - ESLint 的 `exhaustive-deps` 規則要遵守
4. **TypeScript 介面需索引簽名** - 用於 `Record<string, T>` 類型時需加 `[key: string]: T`

### 2026-01-25（續）：程式碼簡化與安全掃描

**程式碼簡化**（7 個檔案）：

| 檔案 | 簡化內容 |
|------|----------|
| `lib/actions/helpers.ts` | 新增 `FINANCE_ROLES` 常數，消除重複角色檢查 |
| `components/funding-dialog.tsx` | 提取常數，useEffect 加入 cleanup，明確回傳類型 |
| `components/app-sidebar.tsx` | 簡化 `isMenuItemVisible` 和 `isActive` 函式 |
| `components/settings-content.tsx` | 提取類型別名、按鈕 className 常數、`getText()` 輔助函式、`PasswordField` 組件 |
| `components/ui/currency-input.tsx` | 提取 `formatNumber`/`parseNumber` 到元件外部 |
| `app/actions/export.ts` | 新增 `ExportValue` 類型，合併 label 函式為通用 `getLabel` |
| `lib/export-utils.ts` | 新增 `CellValue` 類型，重命名 `hasNoData` → `validateData` |

**安全掃描結果**：
- **npm audit**: 0 個已知 CVE 漏洞
- **整體狀態**: 良好

**已實施的安全措施**：
| 類別 | 狀態 |
|------|------|
| CSP 標頭 | ✅ 已配置（含 HSTS） |
| 登入速率限制 | ✅ 5 次/15 分鐘 |
| 全局速率限制 | ✅ 100 req/min per IP |
| SSRF 防護 | ✅ 阻擋內部 IP、metadata endpoints |
| Server Actions 權限檢查 | ✅ 全部通過 |
| 開發端點保護 | ✅ 生產環境禁用 |
| Timing-safe 比較 | ✅ 固定長度 buffer |
| 密碼強度 | ✅ 8 字元 + 英數 |

**未發現的漏洞類別**：
- XSS (dangerouslySetInnerHTML, eval)
- SQL/NoSQL/Command Injection
- 硬編碼密鑰

**建議事項**（優先級低）：
1. 可選擇性增加特殊字元密碼要求
2. 多實例部署時確保使用 Redis 進行分佈式速率限制
3. 如架構允許，可升級為 nonce-based CSP
