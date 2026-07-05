# 錯誤排查指南 (Troubleshooting Guide)

此文件記錄常見問題和解決方案，幫助快速診斷和修復問題。

---

## 目錄

1. [登入問題](#登入問題)
2. [部署問題](#部署問題)
3. [資料庫問題](#資料庫問題)
4. [環境配置問題](#環境配置問題)
5. [診斷工具](#診斷工具)

---

## 登入問題

### 問題：輸入正確密碼但無法登入（無錯誤訊息）

**症狀**：
- 輸入正確的帳號密碼
- 點擊登入後沒有錯誤訊息
- 頁面重定向回登入頁或停留在原地

**可能原因**：

| 原因 | 機率 | 檢查方式 |
|------|------|----------|
| AUTH_URL 配置錯誤 | 高 | 檢查 `.env` 中的 AUTH_URL |
| Redis 連接失敗 | 中 | 查看伺服器 console 日誌 |
| 速率限制鎖定 | 中 | 執行 `check-user.ts` 腳本 |
| 用戶不存在 | 低 | 執行 `check-user.ts` 腳本 |
| 密碼確實錯誤 | 低 | 執行 `check-user.ts` 腳本 |

**解決方案**：

#### 1. 檢查 AUTH_URL（最常見）

```bash
# 查看 .env 中的 AUTH_URL
cat .env | grep AUTH_URL
```

**本地開發時**：AUTH_URL 應該被註釋掉
```bash
# AUTH_URL="https://your-domain.vercel.app/login"
```

**線上環境**：Vercel 會自動設置，不需要手動配置

#### 2. 檢查 Redis 連接

查看伺服器日誌是否有以下錯誤：
```
Redis connection failed for rate limit check: Error: getaddrinfo ENOTFOUND ...
```

如果有，檢查 `.env` 中的 Redis 配置：
```bash
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

#### 3. 使用診斷腳本

```bash
# 檢查用戶帳號和密碼
npx tsx scripts/check-user.ts user@example.com YourPassword

# 清除速率限制鎖定
npx tsx scripts/clear-login-lock.ts user@example.com
```

---

### 問題：顯示「電子郵件或密碼錯誤」

**可能原因**：

1. **密碼真的錯了** - 注意大小寫
2. **帳號不存在** - 需要先註冊
3. **速率限制觸發** - 15 分鐘內失敗超過 5 次
4. **密碼欄位為 NULL** - 資料庫問題

**診斷步驟**：

```bash
# 1. 檢查用戶是否存在和密碼是否正確
npx tsx scripts/check-user.ts your@email.com YourPassword

# 輸出範例（用戶存在，密碼正確）：
# 📋 資料庫用戶資訊：
#    - Email: your@email.com
#    - 密碼欄位: ✅ 已設定
# 🔐 密碼驗證測試：
#    - 結果: ✅ 密碼正確

# 輸出範例（密碼錯誤）：
# 🔐 密碼驗證測試：
#    - 結果: ❌ 密碼錯誤
```

---

### 問題：被速率限制鎖定

**症狀**：即使輸入正確密碼，也顯示「電子郵件或密碼錯誤」

**解決方案**：

```bash
# 方法 1：等待 15 分鐘

# 方法 2：手動清除鎖定
npx tsx scripts/clear-login-lock.ts your@email.com
```

---

## 部署問題

### 問題：Vercel 部署失敗 - TypeScript 錯誤

**症狀**：Build Logs 顯示 TypeScript 類型錯誤

**預防措施**：
```bash
# 推送前務必執行
npm run build
```

**常見錯誤和解決方案**：

| 錯誤 | 解決方案 |
|------|----------|
| `Cannot find module` | 檢查導入路徑是否正確 |
| `Type 'X' is not assignable to type 'Y'` | 使用正確的類型轉換 |
| `downlevelIteration` 錯誤 | 使用 `Array.from()` 代替展開運算子 |
| `Server actions must be async functions` | 移除輔助函式檔案的 `"use server"` |

### 問題：Set 迭代錯誤 (downlevelIteration)

**症狀**：Build 時出現類似以下錯誤：
```
Type error: Type 'Set<string>' can only be iterated through when using the
'--downlevelIteration' flag or with a '--target' of 'es2015' or higher.
```

**原因**：
TypeScript 預設的編譯目標不支援直接對 `Set` 使用展開運算子 `[...set]`。

**錯誤範例**：
```typescript
// ❌ 這會造成編譯錯誤
const uniqueValues = [...new Set(items.map(item => item.value))]
```

**正確做法**：
```typescript
// ✅ 使用 Array.from() 替代展開運算子
const uniqueValues = Array.from(new Set(items.map(item => item.value)))
```

**其他替代方案**：
```typescript
// 方案 1：使用 Array.from()（推薦）
const unique = Array.from(new Set(array))

// 方案 2：使用 filter + indexOf（較慢但相容性最好）
const unique = array.filter((item, index) => array.indexOf(item) === index)

// 方案 3：修改 tsconfig.json（不推薦，可能影響其他設定）
// "compilerOptions": { "downlevelIteration": true }
```

**記住**：優先使用 `Array.from()` 來解決此問題，這是最簡單且不需要修改配置的方法。

### 問題：第三方函式庫類型不匹配

**症狀**：Build 時出現類似以下錯誤：
```
Type error: Type 'SomeClass' is not assignable to type 'MyInterface'.
  The types returned by 'someMethod(...)' are incompatible between these types.
    Type 'Promise<null>' is not assignable to type 'Promise<void>'.
```

**原因**：
自定義的介面類型與實際函式庫的回傳類型不一致。常見於動態導入的函式庫。

**範例**：html5-qrcode 的 `start()` 方法
```typescript
// ❌ 錯誤 - 假設回傳 void
interface Html5QrCodeInstance {
    start: (...) => Promise<void>
}

// ✅ 正確 - 實際回傳 null
interface Html5QrCodeInstance {
    start: (...) => Promise<null>
}
```

**解決方法**：
1. 查看函式庫的實際類型定義（node_modules 或官方文檔）
2. 或使用 `any` 類型暫時繞過（不推薦）
3. 或安裝官方 `@types/xxx` 套件（如果有的話）

**診斷技巧**：
```bash
# 查看函式庫的類型定義
cat node_modules/html5-qrcode/esm/html5-qrcode.d.ts | grep "start"
```

### 問題：Server actions must be async functions

**症狀**：Build 時出現類似以下錯誤：
```
Error: Server actions must be async functions
  ,-[lib/actions/helpers.ts:88:1]
88 | export function revalidateDashboard(): void {
   :                 ^^^^^^^^^^^^^^^^^^^
```

**原因**：
輔助函式檔案頂部有 `"use server"` 指令，導致 Next.js 將所有匯出函式視為 Server Actions。但 Server Actions **必須**是 `async` 函式。

**錯誤範例**：
```typescript
// lib/actions/helpers.ts
"use server";  // ❌ 這會讓所有函式變成 Server Actions

export function revalidateDashboard(): void {  // ❌ 同步函式不能是 Server Action
    revalidatePath("/dashboard");
}
```

**正確做法**：
```typescript
// lib/actions/helpers.ts
// 移除 "use server" — 這是輔助函式庫，不是 Server Actions 檔案

export function revalidateDashboard(): void {  // ✅ 普通輔助函式
    revalidatePath("/dashboard");
}
```

**關鍵原則**：
- `"use server"` 只用於 `app/actions/*.ts` 等實際的 Server Actions 檔案
- 輔助函式庫（如 `lib/actions/helpers.ts`）**不需要** `"use server"`
- Server Actions 會調用這些輔助函式，由 Server Actions 提供伺服器端執行環境

### 問題：Type 'X' is not assignable to type 'Record<string, Y>'

**症狀**：Build 時出現類似以下錯誤：
```
Type error: Argument of type 'MyInterface[]' is not assignable to parameter of type 'DataRow[]'.
  Type 'MyInterface' is not assignable to type 'DataRow'.
    Index signature for type 'string' is missing in type 'MyInterface'.
```

**原因**：
TypeScript 介面預設沒有索引簽名，但 `Record<string, T>` 或類似的泛型類型需要索引簽名。

**解決方案**：
為介面添加索引簽名：

```typescript
// 錯誤做法
interface MyRow {
    name: string;
    value: number;
}

// 正確做法
interface MyRow {
    [key: string]: string | number;  // 添加索引簽名
    name: string;
    value: number;
}
```

**注意**：索引簽名的值類型必須涵蓋所有屬性的類型

### 問題：Type 'Session' is not assignable to type '...'

**症狀**：Build 時出現類似以下錯誤：
```
Type 'Session' is not assignable to type '{ user?: { name?: string; ... } }'.
Type 'string | null | undefined' is not assignable to type 'string | undefined'.
Type 'null' is not assignable to type 'string | undefined'.
```

**原因**：
NextAuth v5 的 `Session` 類型中，`user.name/email/image` 是 `string | null | undefined`，但你的 props 類型只接受 `string | undefined`。

**解決方案**：
在定義 props 類型時，允許 `null` 值：

```typescript
// 錯誤做法
interface MyProps {
    session: { user?: { name?: string; email?: string } }
}

// 正確做法
interface MyProps {
    session: { user?: { name?: string | null; email?: string | null } }
}
```

### 問題：Vercel 部署成功但網站無法運作

**檢查清單**：

1. **環境變數** - 確認 Vercel 上的環境變數設置正確
2. **資料庫連接** - 確認 DATABASE_URL 可訪問
3. **Redis 連接** - 確認 Upstash Redis 配置正確

---

## 資料庫問題

### 問題：Prisma 連接失敗

**症狀**：伺服器日誌顯示資料庫連接錯誤

**檢查步驟**：

```bash
# 1. 測試資料庫連接
npx prisma db pull

# 2. 重新生成 Prisma Client
npx prisma generate

# 3. 檢查 DATABASE_URL 格式
# 應該是：postgresql://user:password@host:port/database?pgbouncer=true
```

---

## 環境配置問題

### 本地開發 vs 線上環境

| 配置項 | 本地開發 | 線上（Vercel） |
|--------|----------|----------------|
| AUTH_URL | 註釋掉 | 自動設置 |
| NODE_ENV | development | production |
| Redis | 可選 | 必需 |

### .env 配置檢查清單

```bash
# 必需配置
DATABASE_URL=          # ✓ PostgreSQL 連接字串
DIRECT_URL=            # ✓ 直連（Prisma migrations 用）
AUTH_SECRET=           # ✓ NextAuth 密鑰（至少 32 字元）

# 可選但建議
UPSTASH_REDIS_REST_URL=    # Redis（速率限制用）
UPSTASH_REDIS_REST_TOKEN=  # Redis Token
CRON_SECRET_KEY=           # Cron 任務授權

# 本地開發時應註釋
# AUTH_URL=              # 讓 NextAuth 自動偵測
```

---

## 診斷工具

### check-user.ts

檢查用戶帳號狀態和密碼驗證：

```bash
npx tsx scripts/check-user.ts <email> [password]

# 範例
npx tsx scripts/check-user.ts admin@example.com MyPassword123
```

**輸出資訊**：
- 用戶是否存在
- 密碼欄位是否設定
- 密碼格式是否正確（bcrypt）
- 密碼驗證結果

### clear-login-lock.ts

清除登入速率限制鎖定：

```bash
npx tsx scripts/clear-login-lock.ts <email>

# 範例
npx tsx scripts/clear-login-lock.ts admin@example.com
```

---

## 快速診斷流程

遇到問題時，按以下順序檢查：

```
1. 查看伺服器 console 日誌
   ↓
2. 執行 npm run build 確認無編譯錯誤
   ↓
3. 檢查 .env 配置是否正確
   ↓
4. 使用診斷腳本檢查具體問題
   ↓
5. 查看本文件對應的問題和解決方案
```

---

## 問題回報

如果遇到本文件未涵蓋的問題，請：

1. 記錄完整的錯誤訊息
2. 記錄重現步驟
3. 將問題添加到本文件
4. 更新 CLAUDE.md 的問題紀錄

---

---

## 屬性重命名後遺漏更新

### 問題：2026-01-27 Vercel 部署失敗

**症狀**：
```
Type error: Property 'label' does not exist on type 'FundingTypeOption'. Did you mean 'labelZh'?
```

**原因**：
程式碼簡化時將 `FundingTypeOption` 的 `label` 屬性改為 `labelZh`/`labelEn`，但有些檔案沒有同步更新。

**遺漏的檔案**：
- `components/funding-content.tsx` - `type.labelZhZh`（typo）、`type.labelZhEn`
- `components/balance-card.tsx` - `type.label`
- `components/funding-dialog.tsx` - `type.label`

**解決方案**：
將所有 `type.label` 改為 `type.labelZh`（或根據語言使用 `type.labelEn`）

**預防措施**：
1. 重命名屬性時，使用 IDE 的「重構/重新命名」功能
2. 或執行全域搜尋確認所有引用都已更新：
   ```bash
   grep -r "\.label" --include="*.tsx" | grep -v "labelZh\|labelEn"
   ```
3. 推送前執行 `npm run build` 驗證

---

## Re-export 類型未能內部使用

### 問題：2026-01-27 Vercel 部署失敗

**症狀**：
```
Type error: Cannot find name 'Language'.
  46 | export function getLocalizedLabel(..., language: Language): string {
```

**原因**：
使用 `export type { Language } from "..."` 只會 re-export 類型給外部使用，但不會在當前檔案中導入該類型。

**錯誤範例**：
```typescript
// ❌ 只 re-export，無法在本檔案使用
export type { Language } from "@/lib/language-context";

function foo(language: Language) { ... }  // Error: Cannot find name 'Language'
```

**正確做法**：
```typescript
// ✅ 先導入再 re-export
import type { Language } from "@/lib/language-context";
export type { Language };

function foo(language: Language) { ... }  // OK
```

**預防措施**：
如果需要在當前檔案使用類型，必須先 `import`，再 `export`。

---

---

## Prisma Client 未正確生成

### 問題：2026-01-28

**症狀**：
```
Type error: Property 'bankAccount' does not exist on type 'PrismaClient<...>'
```

**原因**：
修改 `prisma/schema.prisma` 後，`prisma generate` 未正確執行或未重新載入。

**解決方案**：
```bash
# 方法 1：強制重新生成
npx prisma generate --force

# 方法 2：使用 node -e 執行（Windows 環境）
node -e "require('child_process').execSync('npx prisma generate', {stdio: 'inherit'})"

# 方法 3：刪除 node_modules/.prisma 後重新生成
rm -rf node_modules/.prisma
npx prisma generate
```

**預防措施**：
修改 schema 後，確認執行 `prisma generate` 且無錯誤訊息。

---

## Modal 對話框被父元素遮擋

### 問題：2026-01-28

**症狀**：
Modal 對話框出現後被其他 UI 元素遮住，即使設定了 `z-index: 9999`。

**原因**：
CSS stacking context 問題。當父元素設定了 `position`, `transform`, `opacity` 等屬性時，會創建新的 stacking context，導致子元素的 z-index 只在該 context 內有效。

**錯誤範例**：
```tsx
// ❌ Modal 在父元素內，受 stacking context 影響
function ParentComponent() {
  return (
    <div className="relative">
      <Modal isOpen={true}>...</Modal>
    </div>
  )
}
```

**正確做法**：
```tsx
import { createPortal } from "react-dom";

// ✅ 使用 createPortal 渲染到 document.body
function Modal({ isOpen, children }) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/50">
      <div className="fixed inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>,
    document.body
  );
}
```

**預防措施**：
所有 Modal/Dialog 組件都應使用 `createPortal` 渲染到 `document.body`。

---

## 資料庫欄位不存在

### 問題：2026-01-28

**症狀**：
```
PrismaClientKnownRequestError:
Invalid `prisma.expenseReport.findMany()` invocation:
The column `ExpenseReport.bankAccountId` does not exist in the current database.
```

**原因**：
修改了 `prisma/schema.prisma` 但未執行 `prisma db push` 同步到資料庫。

**解決方案**：
```bash
# 開發環境：直接推送 schema
npx prisma db push

# 生產環境：使用 migration
npx prisma migrate dev --name add_bank_account
npx prisma migrate deploy
```

**預防措施**：
1. 修改 schema 後立即執行 `prisma db push`（開發環境）
2. 部署前確認 migration 已執行

---

---

## CapacitorConfig 型別匯入錯誤

### 問題：2026-02-01

**症狀**：
```
Cannot find name 'CapacitorConfig'.
```

**原因**：
`CapacitorConfig` 型別定義在 `@capacitor/cli` 而非 `@capacitor/core`。Core 套件只包含運行時 API。

**解決方案**：
```typescript
// ❌ 錯誤
import type { CapacitorConfig } from '@capacitor/core';

// ✅ 正確
import type { CapacitorConfig } from '@capacitor/cli';
```

**預防措施**：
Capacitor 套件職責分離：`@capacitor/cli` 負責配置和建構，`@capacitor/core` 負責運行時 API。

---

## capacitor.config.ts 被 Next.js Build 編譯

### 問題：2026-02-01

**症狀**：
```
npm run build 失敗，錯誤指向 capacitor.config.ts
```

**原因**：
Next.js build 會掃描專案根目錄的所有 .ts 檔案進行編譯。`capacitor.config.ts` 使用不同的 module 格式（Capacitor CLI 自行處理），與 Next.js 的 tsconfig 不相容。

**解決方案**：
在 `tsconfig.json` 的 `exclude` 陣列中添加：
```json
{
  "exclude": ["capacitor.config.ts", "ios/"]
}
```

**預防措施**：
專案根目錄新增非 Next.js 的 .ts 配置檔時，都應加入 tsconfig exclude。

---

## window 型別斷言失敗

### 問題：2026-02-01

**症狀**：
```
Conversion of type 'Window & typeof globalThis' to type 'Record<string, unknown>'
may be a mistake because neither type sufficiently overlaps with the other.
```

**原因**：
TypeScript strict 模式下，`window as Record<string, unknown>` 被視為不安全的型別斷言。

**解決方案**：
使用 TypeScript 聲明合併擴展 Window interface：
```typescript
// ❌ 錯誤
const cap = (window as Record<string, unknown>).Capacitor;

// ✅ 正確
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
    }
  }
}
const cap = window.Capacitor;
```

**預防措施**：
需要存取 `window` 上的自訂屬性時，永遠使用 `declare global { interface Window }` 擴展，不要使用型別斷言。

---

---

## 收據附件顯示為空白/損壞圖片

### 問題：2026-02-02

**症狀**：
收據附件在審核頁面和報帳頁面顯示為空白或損壞的圖片，圖片無法載入。

**原因**：
`receiptUrl` 欄位存的是 `blob:http://localhost:3000/...` 格式的 URL。Blob URL 是瀏覽器內存中的臨時引用，只在建立它的 session 內有效。頁面重新載入或其他用戶存取時，該 URL 已失效。

**解決方案**：
1. 上傳時改用客戶端壓縮 base64 data URL 存入 DB：
```typescript
// components/expense-form.tsx
async function compressImage(file: File): Promise<string> {
  // Canvas resize → max 1200px → JPEG 70% → base64
}
```
2. 清除 DB 中已有的無效 blob URL：
```sql
UPDATE "ExpenseItem" SET "receiptUrl" = NULL WHERE "receiptUrl" LIKE 'blob:%';
```

**預防措施**：
- 永遠不要將 `URL.createObjectURL()` 的結果存入資料庫
- 需要持久化的檔案使用 base64 data URL 或外部存儲服務（S3/Vercel Blob）

---

## 已拒絕報帳單計入統計總金額

### 問題：2026-02-02

**症狀**：
Dashboard 的 Stats Cards 顯示的「總金額」包含已被拒絕（REJECTED）的報帳單金額，導致數字不準確。

**原因**：
`app/dashboard/expenses/page.tsx` 中的 `activeReports` 查詢沒有排除 `REJECTED` 狀態的報帳單。

**解決方案**：
在查詢中加入狀態過濾：
```typescript
const activeReports = await prisma.expenseReport.findMany({
  where: {
    userId: session.user.id,
    NOT: { status: "REJECTED" },
  },
});
```

**預防措施**：
統計查詢應明確定義「有效」資料的範圍，排除已取消/拒絕/刪除等終態記錄。

---

## Server Action Payload Too Large

### 問題：2026-02-02

**症狀**：
```
Error: Body exceeded 1mb limit
```
或提交含有收據圖片的報帳單時靜默失敗。

**原因**：
Next.js server actions 預設 body 大小限制為 1MB。壓縮後的 base64 圖片加上其他表單資料可能超過此限制。

**解決方案**：
1. 調整 `next.config.mjs` 的 server actions body 限制：
```javascript
experimental: {
  serverActions: {
    bodySizeLimit: "10mb",
  },
},
```
2. 調整 `app/actions/expenses.ts` 的 JSON 大小限制常數為 10MB。

**預防措施**：
- 上傳含大檔案的 server action 需要確認 body 限制足夠
- 客戶端壓縮可有效減小上傳大小（1200px/JPEG 70% 通常 100-300KB）

---

---

## Prisma Enum 值已從 Schema 移除但資料庫仍有記錄

### 問題：2026-02-02

**症狀**：
```
PrismaClientKnownRequestError:
Value 'DRAFT' not found in enum 'ReportStatus'
```
Vercel 部署後，任何涉及 ExpenseReport 查詢的頁面都會報錯。

**原因**：
1. Prisma schema 已移除 `DRAFT` enum 值（在先前 session 中）
2. `prisma db push` 同步了 schema，但資料庫中仍有 1 筆 `status = 'DRAFT'` 的記錄
3. Prisma 查詢在反序列化結果時，遇到不在 enum 定義中的值，拋出錯誤

**解決方案**：

```bash
# 步驟 1：用 SQL 將 DRAFT 記錄更新為有效的 enum 值
# 可透過 Supabase SQL Editor 或 psql 執行
UPDATE "ExpenseReport" SET status = 'PENDING_MANAGER' WHERE status = 'DRAFT';

# 步驟 2：確認無剩餘 DRAFT 記錄
SELECT COUNT(*) FROM "ExpenseReport" WHERE status = 'DRAFT';

# 步驟 3：同步 schema 移除 DRAFT enum（如果尚未執行）
npx prisma db push --accept-data-loss
```

也可使用遷移腳本：
```bash
npx tsx scripts/migrate-draft.ts
```

**預防措施**：
1. **移除 enum 值前必須先遷移資料** - 順序：SQL 更新記錄 -> prisma db push
2. **建立遷移腳本** - 不要手動執行 SQL，建立可重複執行的腳本
3. **在 staging 環境測試** - 先在測試環境確認遷移成功再推到生產
4. **`--accept-data-loss` 旗標** - 移除 enum 值會被 Prisma 視為破壞性變更，需要此旗標確認

**相關檔案**：
- `prisma/schema.prisma` - ReportStatus enum 定義
- `scripts/migrate-draft.ts` - DRAFT 遷移腳本
- `app/actions/expenses.ts` - createExpense() 已改為直接使用 PENDING_MANAGER

---

---

## Dashboard 近期報表連結 404

### 問題：2026-02-03

**症狀**：
儀表板（Dashboard）的「近期報表」卡片點擊後顯示 404 Not Found 頁面。

**原因**：
`components/dashboard-content.tsx` 中近期報表卡片的連結指向 `/dashboard/expenses/${report.id}`，但 `app/dashboard/expenses/[id]/page.tsx` 動態路由從未建立過，該路徑不存在於專案中。

**解決方案**：
將連結目標改為已存在的列表頁：
```typescript
// 修復前
href={`/dashboard/expenses/${report.id}`}

// 修復後
href="/dashboard/expenses"
```

**預防措施**：
1. 建立導航連結時，確認目標路由頁面已存在
2. 測試所有可點擊的連結，特別是 Dashboard 等入口頁面
3. 如果需要動態路由，先建立對應的 `[id]/page.tsx` 再連結

---

## CSS 樣式完全消失（.next 快取損壞）

### 問題：2026-02-03

**症狀**：
本地 dev server 運行中，所有 CSS 樣式突然完全消失，頁面顯示為純 HTML 無任何樣式。重新整理頁面問題依舊。

**原因**：
`.next` 快取目錄損壞。Next.js dev server 的增量編譯快取可能在 Git 操作、檔案系統變更或磁碟寫入中斷後進入不一致狀態，導致 CSS 模組無法正確載入。

**解決方案**：
```bash
# 1. 停止 dev server (Ctrl+C)
# 2. 刪除 .next 快取目錄
rm -rf .next
# (Windows: rmdir /s /q .next)
# 3. 重新啟動 dev server
npm run dev
```

**預防措施**：
1. 遇到 CSS 全部消失時，第一步就是清除 `.next` 目錄
2. `.next` 是完全可重建的編譯快取，刪除不會丟失原始碼
3. 在 Git 大量操作（reset, merge, rebase）後，建議清除 `.next` 再重啟 dev server

---

*最後更新：2026-02-03*
*新增：Dashboard 連結 404、CSS 快取損壞問題*
