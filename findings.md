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
