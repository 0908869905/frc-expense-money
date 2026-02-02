# Findings & Decisions - 安全掃描結果

## Requirements
- 執行 Next.js 專案完整安全掃描
- 識別 OWASP Top 10 相關漏洞
- 修復所有發現的安全問題

## Research Findings

### 專案技術棧
- **Framework:** Next.js 14.2.35 (App Router)
- **Auth:** next-auth 5.0.0-beta.30
- **ORM:** Prisma 5.10.2
- **Database:** PostgreSQL
- **Cache:** Upstash Redis

### 安全配置分析
- 安全標頭已正確配置 (X-Frame-Options, HSTS, etc.)
- 使用 bcryptjs 進行密碼雜湊
- 使用 Zod 進行輸入驗證
- 使用 Prisma ORM 防止 SQL 注入

### 發現的漏洞

#### 嚴重 (CRITICAL)
| 漏洞 | 檔案 | 風險 |
|------|------|------|
| 未保護的調試端點 | app/api/debug/route.ts | 暴露用戶資料和錯誤堆疊 |
| 未保護的種子端點 | app/api/seed/route.ts | 任何人可建立預設帳號 |
| 未保護的測試端點 | app/api/test-user/route.ts | 可查詢任意用戶資訊 |

#### 高風險 (HIGH)
| 漏洞 | 檔案 | 風險 |
|------|------|------|
| 空密碼登入 | auth.ts | 無密碼用戶可繞過驗證 |
| TypeScript 檢查停用 | next.config.mjs | 型別錯誤可能導致安全問題 |

#### 中風險 (MEDIUM)
| 漏洞 | 檔案 | 風險 |
|------|------|------|
| JSON.parse 無錯誤處理 | app/actions/expenses.ts | 伺服器錯誤 |
| Cron 授權可選 | app/api/cron/cleanup-sessions/route.ts | 未授權呼叫 |
| SSRF 風險 | app/actions/ocr.ts | 內部網路掃描 |

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| 使用環境變數判斷生產環境 | process.env.NODE_ENV === 'production' 是標準做法 |
| SSRF 保護使用 hostname 解析 | 直接解析 URL 比 DNS 查詢更安全 |
| 強制 HTTPS for 外部 URL | 確保傳輸層安全 |
| 阻止雲端 metadata endpoints | 防止 SSRF 攻擊取得雲端憑證 |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| Python 未安裝導致 catchup 腳本失敗 | 手動建立規劃文件 |

## Resources
- OWASP Top 10: https://owasp.org/Top10/
- Next.js Security: https://nextjs.org/docs/app/building-your-application/configuring/security-headers
- Prisma Security: https://www.prisma.io/docs/concepts/components/prisma-client/raw-database-access

## 正面發現
- 無依賴套件已知漏洞 (npm audit clean)
- 無硬編碼密鑰
- 無 XSS 危險模式 (無 dangerouslySetInnerHTML)
- 無 SQL 注入風險 (Prisma ORM)
- 安全標頭配置良好
- .gitignore 正確排除敏感檔案

---

## Session: 2026-01-22 - Vercel 部署失敗修復

### 問題描述
Vercel 部署連續失敗，Build 無法通過。

### 發現的問題

#### TypeScript 類型錯誤
| 問題 | 檔案 | 原因 |
|------|------|------|
| Prisma JSON 類型不匹配 | `lib/agents/receipt-audit.ts:198` | `Record<string, unknown>[]` 無法賦值給 `NullableJsonNullValueInput` |
| Prisma JSON 類型不匹配 | `lib/services/receipt-audit.ts:198` | 同上（重複檔案） |
| 缺少模組類型聲明 | `lib/money.ts:10` | `dinero.js` 沒有 TypeScript 類型定義 |
| 模組路徑錯誤 | `types/audit.ts:6` | 導入 `@/lib/ocr` 但路徑已改為 `@/lib/agents/ocr` |

### 根本原因分析
1. **程式碼重構不完整** - 檔案移動後引用路徑沒有同步更新
2. **重複程式碼** - 存在兩個幾乎相同的 `receipt-audit.ts`
3. **缺少類型聲明** - 第三方模組沒有官方類型支援
4. **推送前未執行 build** - 沒有在本地驗證編譯

### 修復方案
| 修復 | 檔案 | 說明 |
|------|------|------|
| 使用 Prisma 類型 | `lib/agents/receipt-audit.ts` | `Prisma.InputJsonValue` + `Prisma.JsonNull` |
| 同步修復 | `lib/services/receipt-audit.ts` | 同上 |
| 創建類型聲明 | `types/dinero.d.ts` | 為 dinero.js 定義類型 |
| 修正導入路徑 | `types/audit.ts` | `@/lib/ocr` → `@/lib/agents/ocr` |

### 預防措施
- 推送前必須執行 `npm run build`
- 重構時使用 IDE 重構功能自動更新引用
- 定期清理重複程式碼
- 已創建全局規範 `~/.claude/CLAUDE.md`

---

## Session: 2026-01-22 (續) - 完整安全掃描 + 程式碼簡化

### 安全掃描最終報告

#### 掃描範圍
- 6 個批次完成掃描
- 涵蓋：components、app/actions、app/api、app/dashboard、lib、types

#### 修復的安全問題（共 8 項）

| # | 嚴重程度 | 問題 | 修復方案 |
|---|----------|------|----------|
| 1 | Critical | /api/debug 暴露敏感資訊 | 添加 ADMIN 認證 + 環境檢查 |
| 2 | Critical | /api/seed 可被任意調用 | 添加環境檢查 |
| 3 | Critical | /api/test-user 可查詢用戶 | 添加環境檢查 |
| 4 | High | auth.ts 允許空密碼登入 | 強制密碼驗證 |
| 5 | High | next.config.mjs 停用類型檢查 | 啟用 TypeScript/ESLint |
| 6 | Medium | expenses.ts JSON.parse 無錯誤處理 | 添加 try-catch |
| 7 | Medium | cron 端點授權可選 | 強制 CRON_SECRET_KEY |
| 8 | Medium | OCR SSRF 風險 | 添加 URL 驗證（禁止內部 IP） |

#### OWASP Top 10 合規狀態
| 類別 | 狀態 | 說明 |
|------|------|------|
| A01 存取控制失效 | ✅ 通過 | 所有端點有認證檢查 |
| A02 加密失敗 | ✅ 通過 | bcryptjs 密碼雜湊 |
| A03 注入攻擊 | ✅ 通過 | Prisma ORM 防護 |
| A04 不安全設計 | ✅ 通過 | 認證流程安全 |
| A05 安全配置錯誤 | ✅ 通過 | 安全標頭已配置 |
| A06 易受攻擊組件 | ✅ 通過 | npm audit 無漏洞 |
| A07 身份驗證失敗 | ✅ 通過 | NextAuth v5 |
| A08 資料完整性失敗 | ✅ 通過 | 無不安全反序列化 |
| A09 日誌監控失敗 | ⚠️ 建議 | 可增加安全日誌 |
| A10 SSRF | ✅ 通過 | OCR 已添加保護 |

#### 待手動執行
- 替換 `.env` 中的 `AUTH_SECRET`（使用 `openssl rand -base64 32`）
- 替換 `.env` 中的 `CRON_SECRET_KEY`（使用 `openssl rand -hex 32`）

---

### 程式碼簡化報告

#### 統計
- **修改檔案**：53 個
- **刪除檔案**：7 個重複檔案
- **淨減少程式碼**：907 行 (+943/-1850)

#### 刪除的重複檔案
| 刪除的檔案 | 保留的版本 |
|------------|------------|
| lib/db/draft-storage.ts | lib/draft-storage.ts |
| lib/db/prisma.ts | lib/prisma.ts |
| lib/utils/currency.ts | lib/currency.ts |
| lib/utils/export-utils.ts | lib/export-utils.ts |
| lib/utils/money.ts | lib/money.ts |
| lib/utils/pagination.ts | lib/pagination.ts |
| lib/utils/utils.ts | lib/utils.ts |

#### 主要改進類型
| 改進 | 說明 |
|------|------|
| 移除未使用 imports | 減少打包大小 |
| 提取輔助函式 | 減少重複的認證檢查 |
| 添加明確回傳類型 | 提升類型安全 |
| 巢狀三元改 switch | 提升可讀性 |
| Promise.all 並行查詢 | 提升效能 |
| any → unknown | 更安全的類型 |
| 提取常數 | 消除魔術數字 |

#### Build 過程修復的類型錯誤
| 錯誤 | 檔案 | 修復 |
|------|------|------|
| DataRow 類型不相容 | lib/export-utils.ts | 改回 `Record<string, any>` |
| vision namespace 不存在 | lib/agents/ocr.ts | 移除回傳類型標註 |
| discriminated union narrowing | lib/agents/receipt-audit.ts | 調整條件判斷 |
| Dinero.Dinero 不存在 | lib/money.ts | 移除回傳類型標註 |

---

### 經驗教訓
1. **簡化時要小心類型**：過度添加類型標註可能引入新錯誤
2. **重複檔案要徹底清理**：不只刪除檔案，還要更新所有導入路徑
3. **Build 驗證是必要的**：每次簡化後都要跑 build 確認

---

## Session: 2026-01-24 - 註冊功能增強 + 安全性修復

### 功能需求
- 使用者在註冊時能選擇所屬組別
- 組別為必填欄位

### 安全掃描發現（第二次掃描）

#### 高風險
| 問題 | 檔案 | 修復 |
|------|------|------|
| 缺少 CSP 標頭 | next.config.mjs | 新增 Content-Security-Policy |
| CRON 時序攻擊 | cleanup-sessions/route.ts | `crypto.timingSafeEqual()` |
| 報帳單拒絕無狀態驗證 | approvals.ts | 新增可拒絕狀態白名單 |

#### 中風險
| 問題 | 檔案 | 修復 |
|------|------|------|
| 密碼僅 6 字元 | register.ts | 改為 8 字元 + 英文 + 數字 |
| JSON 無大小限制 | expenses.ts | 新增 1MB 限制 |

### 實作決策
| 決策 | 理由 |
|------|------|
| 組別必填 | 確保隊員歸屬明確，便於報帳單分組 |
| 密碼 8 字元 + 英數 | 平衡安全性與用戶體驗 |
| CSP 允許 unsafe-inline | Next.js App Router 需要內聯腳本 |
| 使用 `z.nativeEnum()` | 自動與 Prisma enum 同步，減少維護成本 |

### 組別清單
| 值 | 中文 | 英文 |
|----|------|------|
| ELECTRICAL | 電資組 | Electrical |
| MECHANICAL | 機構組 | Mechanical |
| DOCUMENTATION | 文書組 | Documentation |
| PR | 公關組 | PR |
| FINANCE | 財管組 | Finance |
| DESIGN | 意象組 | Design |

---

## Session: 2026-01-25 - 安全加固 + 程式碼簡化

### 新增功能

#### 登入速率限制
- 每個 Email 每 15 分鐘最多 5 次失敗嘗試
- 使用 Redis 追蹤（key: `login_attempts:{email}`）
- 登入成功後自動重置

#### 全局速率限制（Middleware）
- 每個 IP 每分鐘最多 100 次請求
- 返回 429 Too Many Requests
- 內存追蹤（單實例適用）

### 安全掃描結果

#### 掃描結果統計
| 嚴重度 | 數量 |
|--------|------|
| CRITICAL | 0 |
| HIGH | 0 |
| MEDIUM | 2 |
| LOW | 3 |
| INFO | 4 |

#### 修復的問題
| 嚴重度 | 問題 | 修復 |
|--------|------|------|
| MEDIUM | Timing-Safe 長度洩漏 | 固定長度 256 bytes buffer |
| MEDIUM | Debug API 洩漏 email | 遮罩為 `a***@domain.com` |
| LOW | 錯誤訊息洩漏內部細節 | 改為通用錯誤訊息 |
| INFO | 缺少 Middleware | 新增全局速率限制 |

### 程式碼簡化

#### 刪除的檔案（31 個，~7,689 行）
| 目錄 | 數量 | 原因 |
|------|------|------|
| lib/context/ | 2 | 與 lib/ 下檔案重複 |
| components/dashboard/ | 5 | 未使用 |
| components/admin/ | 5 | 未使用 |
| components/audit/ | 3 | 未使用 |
| components/expense/ | 3 | 未使用 |
| components/funding/ | 2 | 未使用 |
| components/inventory/ | 1 | 未使用 |
| components/layout/ | 2 | 未使用 |
| components/shared/ | 3 | 未使用 |
| components/ | 4 | 未使用 |
| types.ts | 1 | 與 types/index.ts 重複 |

### Vercel 部署錯誤修復

#### 問題
```
Type error: Type 'MapIterator<[string, {...}]>' can only be iterated
through when using the '--downlevelIteration' flag or with a '--target'
of 'es2015' or higher.
```

#### 原因
`for...of` 遍歷 Map 需要較高的 ES 版本或 `downlevelIteration` 編譯選項。

#### 解決方案
```typescript
// 修復前
for (const [ip, record] of ipRequestCounts.entries()) { ... }

// 修復後
ipRequestCounts.forEach((record, ip) => { ... })
```

### 經驗教訓
1. **Map 遍歷兼容性**：`forEach` 比 `for...of` 更兼容舊版 TypeScript 配置
2. **Vercel vs 本地環境**：Vercel 的 TypeScript 配置可能與本地不同
3. **推送前測試**：永遠執行 `npm run build` 確認無錯誤

---

## Session: 2026-01-25 (續) - 登入失敗問題診斷與修復

### 問題描述
用戶輸入正確的帳號密碼，但無法登入。本地和線上環境都有同樣問題。
更奇怪的是，沒有顯示任何錯誤訊息。

### 診斷過程

#### 步驟 1：驗證用戶資料
創建診斷腳本 `scripts/check-user.ts`：
```
📋 資料庫用戶資訊：
   - Email: user@example.com
   - 密碼欄位: ✅ 已設定
   - 密碼格式: ✅ bcrypt 雜湊

🔐 密碼驗證測試：
   - 結果: ✅ 密碼正確
```
結論：用戶存在，密碼正確。

#### 步驟 2：檢查 Redis 連接
```
TypeError: fetch failed
Error: getaddrinfo ENOTFOUND clever-fawn-40577.upstash.io
```
結論：**Redis DNS 解析失敗**，這是導致登入失敗的直接原因。

#### 步驟 3：分析認證流程
`auth.ts` 中的 `authorize()` 函式：
1. 檢查速率限制 → **呼叫 Redis（失敗）**
2. 查詢用戶 → 使用 Prisma
3. 驗證密碼 → bcrypt.compare

問題：Redis 操作沒有錯誤處理，一旦 Redis 連接失敗，整個 `authorize()` 函式就會拋出異常。

#### 步驟 4：發現第二個問題
用戶表示「沒有顯示密碼錯誤」，表示登入「看似成功」但實際上沒有。
檢查 `.env` 發現：
```
AUTH_URL="https://two-chi-74.vercel.app/login"
```
這是 Vercel 線上地址，但用戶在本地測試（localhost:3000）。
NextAuth cookie 的 domain 不匹配，導致 session 無法保存。

### 根本原因

| 問題 | 類別 | 影響 |
|------|------|------|
| Redis 連接失敗無錯誤處理 | 程式碼健壯性 | 登入流程中斷，無明確錯誤 |
| AUTH_URL 設為線上地址 | 環境配置 | 本地開發 session 無法保存 |

### 修復方案

#### 1. Redis 錯誤處理（`auth.ts`）
為三個 Redis 函式添加 try-catch：
- `checkLoginRateLimit()` - 失敗時返回 `{ allowed: true }`（允許登入繼續）
- `recordFailedLogin()` - 失敗時靜默忽略
- `resetLoginAttempts()` - 失敗時靜默忽略

```typescript
async function checkLoginRateLimit(email: string) {
  try {
    const key = `${RATE_LIMIT_PREFIX}${email.toLowerCase()}`
    const current = await redis.get<number>(key) || 0
    return {
      allowed: current < RATE_LIMIT_MAX_ATTEMPTS,
      remaining: Math.max(0, RATE_LIMIT_MAX_ATTEMPTS - current),
    }
  } catch (error) {
    // Redis 連接失敗時，允許登入繼續（速率限制降級）
    console.warn("Redis connection failed for rate limit check:", error)
    return { allowed: true, remaining: RATE_LIMIT_MAX_ATTEMPTS }
  }
}
```

#### 2. AUTH_URL 配置（`.env`）
```bash
# 本地開發時註釋掉，讓 NextAuth 自動偵測
# AUTH_URL="https://two-chi-74.vercel.app/login"
```

### 技術決策
| 決策 | 理由 |
|------|------|
| Redis 失敗時允許登入 | 速率限制是增強功能，不應阻止核心登入流程 |
| 使用 console.warn 記錄 | 方便除錯，但不影響用戶體驗 |
| 註釋而非刪除 AUTH_URL | 方便切換環境，保留參考 |

### 預防措施
1. **所有外部服務呼叫都要有錯誤處理** - Redis、第三方 API 等
2. **本地開發使用 `.env.local`** - 覆蓋線上配置
3. **創建診斷工具** - 方便快速排查問題

### 新增的診斷腳本
| 腳本 | 用途 |
|------|------|
| `scripts/check-user.ts` | 檢查用戶是否存在、密碼是否正確 |
| `scripts/clear-login-lock.ts` | 清除速率限制鎖定 |

---

## Session: 2026-01-25 (續) - Build 錯誤修復 + 程式碼簡化

### Build 錯誤分析

| 錯誤 | 原因 | 修復 |
|------|------|------|
| `Server actions must be async functions` | `lib/actions/helpers.ts` 有 `"use server"` 但含同步函式 | 移除 `"use server"` 指令 |
| `Cannot find name 'useLanguage'` | `funding-dialog.tsx` 使用未導入的 hook | 移除未使用的行 |
| `Using <img> could result in slower LCP` | 使用原生 `<img>` 而非 `next/image` | 改用 `<Image>` 組件 |
| `React Hook has missing dependency` | `useEffect` 依賴陣列不完整 | 加入 `value` 到依賴陣列 |
| `Type 'X' is not assignable to type 'DataRow'` | 介面缺少索引簽名 | 添加 `[key: string]: T` |

### 技術決策

| 決策 | 理由 |
|------|------|
| `"use server"` 僅用於 Server Actions | 輔助函式庫不需要此指令，避免同步函式被誤判 |
| 使用 `next/image` 的 `<Image>` | 提供自動優化、更好的 LCP、響應式圖片 |
| useEffect 依賴必須完整 | 遵守 ESLint `exhaustive-deps` 規則，避免 stale closure |
| 介面添加索引簽名 | 與 `Record<string, T>` 類型兼容 |

### 程式碼簡化改進

| 檔案 | 改進 |
|------|------|
| `lib/actions/helpers.ts` | 新增 `FINANCE_ROLES` 常數消除重複 |
| `components/settings-content.tsx` | 提取 `PasswordField` 組件減少 ~60 行重複 |
| `components/settings-content.tsx` | 新增 `getText(zh, en)` 輔助函式 |
| `app/actions/export.ts` | 合併 `getStatusLabel`/`getCategoryLabel` 為通用 `getLabel` |
| `lib/export-utils.ts` | 重命名 `hasNoData` → `validateData`（語義更清晰）|

### 安全掃描最終結果

| 類別 | 狀態 |
|------|------|
| npm audit | 0 個 CVE |
| CSP 標頭 | ✅ 已配置 |
| 登入速率限制 | ✅ 5 次/15 分鐘 |
| 全局速率限制 | ✅ 100 req/min per IP |
| SSRF 防護 | ✅ 阻擋內部 IP |
| Server Actions 權限 | ✅ 全部檢查 |
| XSS 漏洞 | ✅ 未發現 |
| SQL Injection | ✅ Prisma ORM 防護 |
| 硬編碼密鑰 | ✅ 未發現 |

### 經驗教訓

1. **`"use server"` 指令範圍** - 只用於實際的 Server Actions 檔案，輔助函式庫不需要
2. **Next.js Image 組件** - 優先使用，提供自動優化
3. **React Hooks 依賴** - 必須完整，避免 stale closure 問題
4. **TypeScript 索引簽名** - 用於泛型類型兼容性時需要添加

---

## Session: 2026-01-25 (續) - Vercel 部署修復 + 功能新增

### Vercel 部署錯誤：Session 類型不匹配

**問題**
```
Type 'Session' is not assignable to type '{ user?: { name?: string; ... } }'.
Type 'string | null | undefined' is not assignable to type 'string | undefined'.
Type 'null' is not assignable to type 'string | undefined'.
```

**原因**
NextAuth v5 的 `Session` 類型中，`user.name/email/image` 是 `string | null | undefined`，但 `SettingsContentProps` 只接受 `string | undefined`。

**解決方案**
```typescript
// 修復前
interface SettingsContentProps {
    session: { user?: { name?: string; email?: string; image?: string } }
}

// 修復後
interface SettingsContentProps {
    session: { user?: { name?: string | null; email?: string | null; image?: string | null } }
}
```

### 新增 Prisma Enum 值

**步驟**
1. 修改 `prisma/schema.prisma` 新增 enum 值
2. 執行 `npx prisma generate` 更新 client
3. 執行 `npx prisma db push` 更新資料庫（線上環境）

**注意**：新增 enum 值是安全的（不會破壞現有資料），但刪除或重命名 enum 值需要資料遷移。

### 經驗教訓（續）

5. **NextAuth Session 類型** - `user` 屬性可能包含 `null`，定義 props 類型時要考慮
6. **Prisma enum 變更** - 新增值後需要 `prisma generate` + `prisma db push`

---

## Session: 2026-01-25 (續) - 庫存 QR Code 掃描功能

### 功能需求
- 文字查詢庫存位置
- QR Code 掃描查看庫存數量（網頁版 + 未來 iOS App）
- 出入庫登記數量

### 技術決策

| 決策 | 理由 |
|------|------|
| 使用 `html5-qrcode` | 純網頁版相機掃描，不需要 Capacitor 原生套件 |
| QR Code 內容只存 SKU | 簡單易讀，相容性最好 |
| 共用類型放 `types/inventory.ts` | 避免重複定義，統一管理 |
| `ENABLE_DEBUG_ENDPOINTS` 環境變數 | 額外安全層，即使非生產環境也需明確啟用 |
| SKU 驗證使用正則 | 防止注入攻擊，限制字元集和長度 |

### 安全加固

#### Debug 端點三層檢查
```typescript
// 1. 生產環境禁用
if (process.env.NODE_ENV === "production") return 404

// 2. 必須明確啟用
if (process.env.ENABLE_DEBUG_ENDPOINTS !== "true") return 403

// 3. ADMIN 認證
if (session.user.role !== "ADMIN") return 401
```

#### SKU 輸入驗證
```typescript
const SKU_PATTERN = /^[A-Za-z0-9\-_]{1,50}$/;

function validateSku(sku: string) {
  if (!sku?.trim()) return { valid: false, error: "請提供料號" };
  if (sku.length > 50) return { valid: false, error: "料號過長" };
  if (!SKU_PATTERN.test(sku)) return { valid: false, error: "料號格式錯誤" };
  return { valid: true };
}
```

### Vercel 部署錯誤

#### 問題
```
Type error: Type 'Set<string>' can only be iterated through when using
the '--downlevelIteration' flag or with a '--target' of 'es2015' or higher.
```

#### 原因
TypeScript 預設配置不支援對 `Set` 使用展開運算子 `[...set]`。

#### 解決方案
```typescript
// ❌ 錯誤
const uniqueLocations = [...new Set(items.map(i => i.location))]

// ✅ 正確
const uniqueLocations = Array.from(new Set(items.map(i => i.location)))
```

### 經驗教訓

1. **Set 迭代兼容性** - 永遠使用 `Array.from(new Set())` 而非 `[...new Set()]`
2. **Web 相機 API 限制** - 需要 HTTPS 或 localhost，桌機可能沒有攝像頭
3. **分層安全** - Debug 端點應有多層檢查（環境 + 明確啟用 + 認證）
4. **輸入驗證** - 所有用戶輸入都應驗證格式，防止注入攻擊

---

## Session: 2026-01-27 - Git 回退處理

### 問題描述
Vercel 部署的網站仍顯示舊的 SKU 驗證錯誤訊息（「料號只允許字母、數字、連字符和底線」），即使本地代碼已更新為允許任何字符。

### 技術決策

| 決策 | 理由 |
|------|------|
| 使用 `git reset --hard` | 需要完全回到特定 commit，包括工作目錄 |
| 使用 `git push --force` | 遠端有更新的 commits 需要覆蓋 |
| 回退到 merge commit | 該 commit 包含 experiment 分支的所有功能 |

### Git 回退操作

#### 操作步驟
```bash
# 1. 確認目標 commit
git log --oneline -10

# 2. 執行硬回退
git reset --hard d9af3d5a0a511488fd31cfbef7561537f452a8c4

# 3. 強制推送到遠端
git push --force
```

#### 注意事項
1. **`--hard` 會丟失本地未提交的變更** - 確保沒有重要的未提交工作
2. **`--force` 會覆蓋遠端歷史** - 其他協作者需要 `git pull --rebase`
3. **被移除的 commits 可以用 `git reflog` 恢復** - 在 GC 之前仍可恢復

### Vercel 部署同步問題

#### 可能原因
1. **Vercel 快取** - 靜態資源可能被快取
2. **部署延遲** - Git push 後 Vercel webhook 觸發需要時間
3. **分支設定** - 確認 Vercel 監聽的是正確的分支

#### 解決方案
1. 等待 Vercel 自動重新部署（通常 1-2 分鐘）
2. 到 Vercel Dashboard 手動觸發 Redeploy
3. 使用 Vercel CLI：`vercel --prod` 強制部署

### 經驗教訓

5. **Git 回退前確認影響** - 使用 `git log` 列出會被移除的 commits
6. **強制推送要謹慎** - 通知團隊成員同步更新
7. **Vercel 部署有延遲** - 不要假設 push 後立即生效

---

## Session: 2026-01-28 - 收款帳戶功能

### 功能需求
- 用戶可以管理多個收款帳戶（銀行帳戶）
- 提交報帳單時可選擇收款帳戶
- 審核者可看到申請人的收款帳戶資訊

### 技術決策

| 決策 | 理由 |
|------|------|
| 使用獨立 BankAccount 模型 | 一個用戶可有多個帳戶，支援設定預設帳戶 |
| 帳號遮罩顯示 | 保護敏感資訊，只顯示後 4 碼 |
| 使用 createPortal 渲染對話框 | 避免 z-index 堆疊問題，確保對話框在最上層 |
| 統一按鈕樣式常數 | 減少重複代碼，確保 UI 一致性 |
| 帳號格式驗證 | 只允許數字和連字號，防止注入攻擊 |

### 安全性修復

| 問題 | 修復 |
|------|------|
| updateBankAccount 缺少角色檢查 | 新增檢查：只能更新自己的帳戶 |
| deleteBankAccount 缺少角色檢查 | 新增檢查：只能刪除自己的帳戶 |
| setDefaultBankAccount 缺少角色檢查 | 新增檢查：只能設定自己的預設帳戶 |
| 帳號格式無驗證 | 新增正則驗證：只允許數字和連字號 |
| 欄位長度無限制 | 新增長度限制：銀行代碼 3-10 碼、帳號 10-20 碼、戶名最多 50 字 |

### 解決的技術問題

#### 1. Prisma Client 未正確生成

**問題**：執行 `npx prisma generate` 後，TypeScript 仍找不到新模型

**原因**：在某些 Windows 環境下，prisma generate 可能未正確執行

**解決方案**：
```bash
# 使用 node -e 執行
node -e "require('child_process').execSync('npx prisma generate', {stdio: 'inherit'})"
```

#### 2. 對話框被父元素遮擋

**問題**：Modal 對話框被其他 UI 元素遮擋，即使設定 z-index

**原因**：CSS stacking context 問題，父元素的 z-index 影響子元素

**解決方案**：
```typescript
import { createPortal } from "react-dom";

// 使用 createPortal 渲染到 document.body
return createPortal(
  <div className="fixed inset-0 z-50">
    {/* Modal 內容 */}
  </div>,
  document.body
);
```

#### 3. 資料庫欄位不存在

**問題**：查詢時報錯 column "bankAccountId" does not exist

**原因**：Schema 修改後未同步到資料庫

**解決方案**：
```bash
npx prisma db push
```

### 新增的 API 模式

#### 收款帳戶 Server Actions
```typescript
// app/actions/bank-accounts.ts
export async function createBankAccount(formData: FormData)
export async function getBankAccounts()
export async function updateBankAccount(id: string, formData: FormData)
export async function deleteBankAccount(id: string)
export async function setDefaultBankAccount(id: string)
```

### 程式碼簡化

#### 統一按鈕樣式常數
```typescript
// lib/ui-constants.ts
export const BUTTON_STYLES = {
  primary: "bg-indigo-600 hover:bg-indigo-700 text-white ...",
  secondary: "border border-gray-300 hover:bg-gray-50 ...",
  danger: "bg-red-600 hover:bg-red-700 text-white ...",
}
```

### 經驗教訓

8. **createPortal 解決 z-index 問題** - Modal 組件應使用 Portal 渲染到 body
9. **敏感資料遮罩** - 顯示銀行帳號時只顯示後 4 碼
10. **Server Actions 必須檢查擁有權** - 不只檢查登入狀態，還要檢查資源屬於當前用戶

---

## Session: 2026-02-02 - 庫存批量輸入 + 移除 DRAFT 階段

### 功能需求
1. 庫存管理支援批量新增零件和批量調整庫存
2. 移除報帳單 DRAFT 階段，建立即提交

### 技術決策

| 決策 | 理由 |
|------|------|
| 批量操作使用 `Promise.allSettled` | 部分失敗不影響其他項目，逐筆返回成功/失敗結果 |
| 提取 `handleBatchResult` 泛型函式 | 批量新增和批量調整共用相同的結果處理邏輯，減少重複 |
| 新增 `ItemNotFoundError` 自定義錯誤類別 | 區分「零件不存在」和其他未預期錯誤，提供更精確的錯誤訊息 |
| 移除 DRAFT enum 而非保留但不使用 | 減少概念複雜度，避免未來維護混淆 |
| `createExpense` 使用 `determineSubmitStatus()` | 根據用戶角色自動決定提交狀態（PENDING_MANAGER 或 PENDING_FINANCE），統一邏輯 |
| 銀行帳戶選擇移到建立表單 | 移除 DRAFT 後不再有「提交」步驟，帳戶選擇必須在建立時完成 |
| Modal size 擴展支援 "2xl" | 批量操作表格需要更大空間顯示多行輸入 |
| 移除 `submitReport()` 函式 | DRAFT 階段移除後不再需要獨立的提交動作 |
| 移除 `canAccessReport` 死碼 | 該函式未被任何地方調用，屬於未使用的死碼 |

### 架構變更：報帳單流程

#### 變更前
```
DRAFT → PENDING_MANAGER → PENDING_FINANCE → PAID / REJECTED / RETURNED
```

#### 變更後
```
PENDING_MANAGER → PENDING_FINANCE → PAID / REJECTED / RETURNED
```

- 建立報帳單時直接使用 `determineSubmitStatus()` 計算初始狀態
- LEADER 角色自動跳過 PENDING_MANAGER 進入 PENDING_FINANCE
- 其他角色預設為 PENDING_MANAGER

### 安全掃描結果（第三次完整掃描）

#### 掃描結果統計
| 嚴重度 | 數量 |
|--------|------|
| CRITICAL | 0 |
| HIGH | 3 |
| MEDIUM | 5 |
| LOW | 3 |
| INFO | 5 |

#### HIGH 風險項目
| 問題 | 檔案 | 建議修復 |
|------|------|----------|
| 批量操作缺 Zod 驗證 | `app/actions/inventory.ts` | 新增 Zod schema 驗證 batchCreateItems/batchAdjustStock 輸入 |
| 單筆 CRUD 缺 Zod 驗證 | `app/actions/inventory.ts` | 新增 Zod schema 驗證 createItem/updateItem 輸入 |
| npm 依賴漏洞 | package.json | `next` DoS 漏洞、`xlsx` Prototype Pollution |

#### MEDIUM 風險項目
| 問題 | 檔案 | 建議修復 |
|------|------|----------|
| vendorLink URL 協議未驗證 | `app/actions/expenses.ts` | 限制 http/https 協議 |
| USER 角色可寫入庫存 | `app/actions/inventory.ts` | 新增角色檢查 |
| data 直傳 Prisma | `app/actions/inventory.ts` | 明確提取欄位而非整個物件傳入 |
| any 型別 | 多個檔案 | 替換為具體類型 |
| Race Condition | `app/actions/inventory.ts` | 使用 Prisma transaction |

### 程式碼簡化改進

| 檔案 | 改進 |
|------|------|
| `app/actions/inventory.ts` | 新增 `ItemNotFoundError` 類別；提取 `processBatchItem`, `processBatchAdjust`, `formatBatchResults` 輔助函式；簡化巢狀三元運算 |
| `components/batch-inventory-modal.tsx` | 提取 `handleBatchResult<T>` 泛型函式處理共用結果邏輯；移除空白分支 |
| `app/actions/expenses.ts` | 移除未使用的 `canAccessReport` 死碼 |
| `components/expenses-content.tsx` | 移除未使用的 `useTransition`；冗餘 props 改用 `useMemo` |
| `app/dashboard/expenses/page.tsx` | 移除不再需要的伺服器端 DRAFT 統計計算 |

### 資料庫遷移注意事項

#### 移除 DRAFT enum 的遷移步驟（尚未執行）
```sql
-- 步驟 1：將現有 DRAFT 記錄更新為 PENDING_MANAGER
UPDATE "ExpenseReport" SET status = 'PENDING_MANAGER' WHERE status = 'DRAFT';

-- 步驟 2：確認無剩餘 DRAFT 記錄
SELECT COUNT(*) FROM "ExpenseReport" WHERE status = 'DRAFT';

-- 步驟 3：執行 prisma db push 移除 DRAFT enum 值
```

### 經驗教訓

15. **移除 enum 值需要先遷移資料** - 不能直接 db push，需先用 SQL 更新現有記錄
16. **批量操作用 `Promise.allSettled`** - 比 `Promise.all` 更適合部分失敗場景
17. **自定義 Error 類別** - 比字串錯誤更容易區分和處理不同類型的失敗
18. **死碼要及時清理** - 未使用的函式增加維護負擔和理解成本
19. **移除功能要全面搜尋** - 12+ 個檔案涉及 DRAFT 相關程式碼，需要逐一清理

---

## Session: 2026-02-01 - BudgetFlow iOS App（Capacitor 整合）

### 功能需求
- 將現有 Next.js Web App 包裝為 iOS App 上架 App Store
- 使用 Capacitor Remote WebView 模式（指向 Vercel 部署的 URL）
- 支援 iOS Safe Area、相機權限、Native 狀態列等

### 技術決策

| 決策 | 理由 |
|------|------|
| 使用 Capacitor Remote WebView 模式 | 不需 SSG/export，直接載入 Vercel URL，維護成本最低 |
| `CapacitorConfig` 從 `@capacitor/cli` 匯入 | `@capacitor/core` 不包含此型別，CLI 才有完整配置定義 |
| 使用 interface 宣告 `window.Capacitor` | 比 `as Record<string, unknown>` 更型別安全 |
| tsconfig.json 排除 `capacitor.config.ts` | 防止 Next.js build 編譯 Capacitor 配置檔（使用不同的 module 系統） |
| CSP `camera=(self)` 而非 `camera=()` | WebView 內需要相機權限（QR Code 掃描功能） |
| `mix-blend-screen` 解決貓咪動畫背景 | 讓 GIF 的黑色背景變透明，適配深色/淺色主題 |
| Safe Area CSS 使用 `env()` 函數 | iOS WebView 標準方式處理劉海/Home Indicator 區域 |

### Capacitor 架構設計

#### Remote WebView 模式
```
iOS App (Capacitor Shell)
    └── WKWebView
         └── 載入 https://your-app.vercel.app
              └── lib/capacitor.ts 偵測環境
                   ├── Native → 使用 Capacitor API
                   └── Web → 使用標準 Web API
```

#### 環境偵測模式
```typescript
// lib/capacitor.ts
export function isNativeApp(): boolean    // 是否在 Capacitor 容器內
export function isIOSApp(): boolean       // 是否在 iOS 原生 App
export function isWebBrowser(): boolean   // 是否在一般瀏覽器
```

### 問題與解決

#### 1. CapacitorConfig 型別來源
- **問題**：從 `@capacitor/core` 匯入 `CapacitorConfig` 找不到
- **原因**：Capacitor 將配置型別放在 CLI 套件中
- **解決**：`import type { CapacitorConfig } from '@capacitor/cli'`

#### 2. capacitor.config.ts 與 Next.js build 衝突
- **問題**：`npm run build` 嘗試編譯 `capacitor.config.ts`，但它使用不同的 module 格式
- **原因**：Next.js build 掃描專案根目錄所有 .ts 檔
- **解決**：在 `tsconfig.json` 的 `exclude` 中加入 `"capacitor.config.ts"`

#### 3. window 型別擴展
- **問題**：`(window as Record<string, unknown>).Capacitor` 無法通過 TypeScript strict 模式
- **原因**：TypeScript 不允許直接將 `Window` 斷言為 `Record<string, unknown>`
- **解決**：使用 interface 宣告擴展 window
```typescript
declare global {
  interface Window {
    Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string }
  }
}
```

### 經驗教訓

11. **Capacitor 型別在 CLI 套件** - 配置相關型別在 `@capacitor/cli`，運行時 API 在 `@capacitor/core`
12. **Next.js build 掃描根目錄** - 非 Next.js 的 .ts 配置檔需要在 tsconfig exclude 排除
13. **window 擴展用 interface** - 比 type assertion 更安全，且支援 TypeScript 聲明合併
14. **Remote WebView 需要 CSP 配合** - 相機等權限需要在 Permissions-Policy 中允許 self

---

## Session: 2026-02-02 (續) - 附件存儲修復 + 收據預覽 + Stats 修正

### 問題 1：Blob URL 不適合持久化存儲

**問題**：上傳收據圖片時使用 `URL.createObjectURL()` 產生 blob URL 存入 DB，但 blob URL 只在當前瀏覽器 session 有效，重新載入或其他用戶無法存取。

**原因**：blob URL（`blob:http://localhost:3000/...`）是瀏覽器內存中的臨時引用，不是可持久化的資源位址。

**解決方案**：改用客戶端壓縮後的 base64 data URL 存入 DB。

| 方案 | 優點 | 缺點 | 選擇 |
|------|------|------|------|
| Blob URL | 快速、不佔記憶體 | 臨時、跨 session 無效 | ❌ |
| 原始 base64 | 持久化、無需額外服務 | 檔案過大（原圖可能 5-10MB） | ❌ |
| 壓縮 base64 | 持久化、大小可控（~100-300KB） | 需客戶端壓縮邏輯 | **✅ 選用** |
| 外部存儲（S3/Vercel Blob） | 最佳效能、無 DB 負擔 | 需額外服務和成本 | 未來考慮 |

### 問題 2：客戶端圖片壓縮策略

**方案**：使用 Canvas API 在客戶端壓縮圖片再轉為 base64。

```
原始圖片 → Canvas resize (max 1200px) → JPEG 70% quality → base64 data URL → 存入 DB
```

**參數選擇理由**：
- **max 1200px**：收據圖片不需要超高解析度，1200px 足以閱讀文字
- **JPEG 70%**：壓縮比好，視覺品質可接受，收據不需要 PNG 無損
- **結果大小**：壓縮後通常 100-300KB，適合存入 DB

### 問題 3：REJECTED 報帳單不應計入總金額

**問題**：Dashboard Stats Cards 的「總金額」包含已被拒絕的報帳單。

**原因**：`activeReports` 查詢沒有排除 `REJECTED` 狀態。

**解決方案**：在 `app/dashboard/expenses/page.tsx` 的 `activeReports` 查詢加入 `NOT: { status: "REJECTED" }` 過濾。

### 問題 4：Server Action Payload 過大

**問題**：上傳含 base64 圖片的報帳單時，server action body 超過預設限制。

**解決方案**：
- `next.config.mjs` 的 `serverActions.bodySizeLimit` 設為 `"10mb"`
- `app/actions/expenses.ts` 的 `MAX_JSON_SIZE` 設為 10MB

### 問題 5：DB 中殘留的無效 Blob URL

**問題**：資料庫中有 11 筆 `receiptUrl` 欄位存的是 `blob:` 開頭的 URL，永遠無法顯示。

**解決方案**：直接用 SQL 清除為 null：
```sql
UPDATE "ExpenseItem" SET "receiptUrl" = NULL WHERE "receiptUrl" LIKE 'blob:%';
```

### 安全掃描結果

| 嚴重度 | 數量 | 說明 |
|--------|------|------|
| HIGH | 1 | deleteReport 缺 audit log |
| MEDIUM | 4 | receiptUrl 格式驗證、CSP unsafe-inline、檔案大小限制、MIME type 驗證 |
| LOW | 6 | 各項小改善 |

### 程式碼簡化改進

| 檔案 | 改進 |
|------|------|
| `components/receipt-preview.tsx` | 提取 `THUMBNAIL_SIZE`, `MODAL_MAX_SIZE` 常數；提取 `getImageStyle()` helper |
| `components/expenses-content.tsx` | 統計計算改用 `useMemo`，避免每次 render 重算 |
| `next.config.mjs` | CSP 指令從單行字串重構為結構化物件，提升可讀性和維護性 |

### 技術決策

| 決策 | 理由 |
|------|------|
| base64 存 DB 而非外部存儲 | 目前規模小（FRC 團隊），避免額外服務成本和複雜度 |
| 客戶端壓縮而非伺服器端 | 減少上傳流量和 server 負載，圖片不需到達 server 再處理 |
| createPortal 用於收據放大 | 避免 stacking context 問題，確保 modal 在最上層 |
| useMemo 優化統計計算 | reports 資料不變時不需重算，改善 render 效能 |
| CSP 結構化重構 | 原本一長串 CSP 字串難以維護，改為物件逐項合成更清晰 |

### 經驗教訓

20. **Blob URL 不可持久化** - `URL.createObjectURL()` 只在當前 session 有效，不適合存入 DB
21. **Canvas API 壓縮圖片** - 客戶端壓縮比上傳原圖再伺服器端處理更高效
22. **Stats 查詢要排除無效狀態** - 被拒絕的報帳單不應計入統計
23. **Server Action body 有預設限制** - 上傳大檔案需調整 `bodySizeLimit`
24. **定期清理 DB 髒資料** - 無效的 blob URL 應該被清除，避免 UI 顯示錯誤
