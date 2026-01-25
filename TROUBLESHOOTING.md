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

*最後更新：2026-01-25*
*新增：Set 迭代錯誤 (downlevelIteration) 解決方案*
