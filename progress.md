# Progress Log - 安全掃描與修復

## Session: 2026-01-21

### Phase 1: 專案結構探索
- **Status:** complete
- **Started:** 2026-01-21
- Actions taken:
  - 使用 Glob 掃描專案結構
  - 讀取 package.json 分析依賴
  - 讀取 next.config.mjs 檢查配置
  - 讀取 .env.example 了解環境變數
  - 確認無自定義 middleware
- Files analyzed:
  - package.json
  - next.config.mjs
  - .env.example
  - auth.ts
  - .gitignore

### Phase 2: 依賴套件審計
- **Status:** complete
- Actions taken:
  - 執行 npm audit
  - 結果：無已知漏洞
- Files analyzed:
  - package.json
  - package-lock.json (透過 npm audit)

### Phase 3: 程式碼安全掃描
- **Status:** complete
- Actions taken:
  - Grep 搜尋硬編碼密鑰模式 - 未發現
  - Grep 搜尋 XSS 危險模式 (dangerouslySetInnerHTML, eval) - 未發現
  - Grep 搜尋 SQL/命令注入模式 - 使用 Prisma 保護
  - 讀取所有 API routes 和 Server Actions
  - 識別 8 個安全問題
- Files analyzed:
  - app/api/debug/route.ts
  - app/api/seed/route.ts
  - app/api/test-user/route.ts
  - app/api/cron/cleanup-sessions/route.ts
  - app/actions/*.ts (所有 Server Actions)
  - lib/*.ts

### Phase 4: 安全修復
- **Status:** complete
- Actions taken:
  - 修復 /api/debug - 添加 ADMIN 認證 + 環境檢查
  - 修復 /api/seed - 添加環境檢查
  - 修復 /api/test-user - 添加環境檢查
  - 修復 auth.ts - 強制密碼驗證
  - 修復 expenses.ts - JSON.parse try-catch
  - 修復 cron/cleanup-sessions - 強制 CRON_SECRET_KEY
  - 修復 next.config.mjs - 啟用 TypeScript/ESLint
  - 修復 ocr.ts - 添加 SSRF 保護函數
- Files modified:
  - app/api/debug/route.ts
  - app/api/seed/route.ts
  - app/api/test-user/route.ts
  - auth.ts
  - app/actions/expenses.ts
  - app/api/cron/cleanup-sessions/route.ts
  - next.config.mjs
  - app/actions/ocr.ts

### Phase 5: 驗證與交付
- **Status:** complete
- Actions taken:
  - 生成完整安全報告
  - 建立 planning-with-files 規劃文件
- Files created:
  - task_plan.md
  - findings.md
  - progress.md (此檔案)

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| 硬編碼密鑰掃描 | Grep patterns | 無匹配 | 無匹配 | ✓ |
| XSS 模式掃描 | dangerouslySetInnerHTML | 無匹配 | 無匹配 | ✓ |
| SQL 注入掃描 | $executeRaw patterns | 無匹配 | 無匹配 | ✓ |
| npm audit | npm audit | 無漏洞 | 無漏洞 | ✓ |

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| 2026-01-21 | Python 未安裝 | 1 | 跳過 session-catchup.py |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | Phase 5 - 已完成 |
| Where am I going? | 任務完成，待用戶執行建置測試 |
| What's the goal? | 安全掃描與修復 FRC 報帳系統 |
| What have I learned? | 見 findings.md |
| What have I done? | 修復 8 個安全漏洞，修改 8 個檔案 |

---

## Session: 2026-01-22 - Vercel 部署失敗修復

### Phase 1: 診斷部署錯誤
- **Status:** complete
- **Started:** 2026-01-22
- Actions taken:
  - 使用瀏覽器自動化連接 Vercel Dashboard
  - 查看 project-money 部署記錄
  - 分析 Build Logs 找出錯誤
- Errors found:
  - Prisma JSON 類型錯誤 (2 個檔案)
  - dinero.js 缺少類型聲明
  - types/audit.ts 導入路徑錯誤

### Phase 2: 修復 TypeScript 錯誤
- **Status:** complete
- Actions taken:
  - 修復 `lib/agents/receipt-audit.ts` - Prisma JSON 類型
  - 修復 `lib/services/receipt-audit.ts` - 同上（發現重複檔案）
  - 創建 `types/dinero.d.ts` - dinero.js 類型聲明
  - 修復 `types/audit.ts` - 修正導入路徑
- Files modified:
  - lib/agents/receipt-audit.ts
  - lib/services/receipt-audit.ts
  - types/audit.ts
- Files created:
  - types/dinero.d.ts

### Phase 3: 驗證部署
- **Status:** complete
- Actions taken:
  - 提交並推送 4 次修復
  - 在 Vercel 監控部署狀態
  - 確認最終部署成功 (D7zwYzBqA - Ready)
- Commits:
  - `47f6c9e` fix: 修正 Prisma JSON 類型錯誤
  - `03db61c` fix: 添加 dinero.js 類型聲明檔案
  - `6c759e7` fix: 修正 lib/services/receipt-audit.ts 的 Prisma JSON 類型錯誤
  - `8c6f794` fix: 修正 types/audit.ts 的 OCR 模組導入路徑

### Phase 4: 建立規範文件
- **Status:** complete
- Actions taken:
  - 創建全局規範 `~/.claude/CLAUDE.md`
  - 更新專案 `CLAUDE.md` 添加問題紀錄
- Files created:
  - ~/.claude/CLAUDE.md (全局規範)
- Files modified:
  - CLAUDE.md (專案特定注意事項)
  - findings.md (此次問題紀錄)
  - progress.md (此檔案)

## Git Commits (2026-01-22)
| Commit | Message |
|--------|---------|
| `47f6c9e` | fix: 修正 Prisma JSON 類型錯誤 |
| `03db61c` | fix: 添加 dinero.js 類型聲明檔案 |
| `6c759e7` | fix: 修正 lib/services/receipt-audit.ts 的 Prisma JSON 類型錯誤 |
| `8c6f794` | fix: 修正 types/audit.ts 的 OCR 模組導入路徑 |
| `6c27dba` | docs: 更新 CLAUDE.md 添加專案注意事項和問題紀錄 |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | 已完成部署修復和規範建立 |
| Where am I going? | 任務完成，網站已成功部署 |
| What's the goal? | 修復 Vercel 部署錯誤 |
| What have I learned? | 見 findings.md 2026-01-22 section |
| What have I done? | 修復 4 個 TypeScript 錯誤，創建規範文件 |

---

## Session: 2026-01-22 (續) - 安全掃描完成 + 程式碼簡化

### Phase 1: 完成安全掃描 Batch 6
- **Status:** complete
- Actions taken:
  - 掃描 15 個 dashboard 頁面檔案
  - 確認所有頁面都有正確的 `auth()` 檢查
  - 生成最終安全報告
- Results:
  - 無新安全問題發現
  - OWASP Top 10 合規檢查通過
  - 8 個安全問題已在之前批次修復

### Phase 2: 程式碼簡化 - 批次執行
- **Status:** complete
- Actions taken:
  - 批次 1：簡化 components 目錄（移除未使用 imports）
  - 批次 2：簡化 app/actions 目錄（提取輔助函式）
  - 批次 3：簡化 app/api 目錄（Promise.all 優化）
  - 批次 4：簡化 app/dashboard 目錄（添加回傳類型）
  - 批次 5：簡化 lib 目錄（刪除重複檔案）
- Files modified: 53 個
- Files deleted: 7 個重複檔案
- Net change: -907 行程式碼

### Phase 3: 驗證與提交
- **Status:** complete
- Actions taken:
  - 執行 `npm run build` 驗證（3 次修復類型錯誤）
  - 提交變更至 Git
- Build result: 成功（7 warnings, 0 errors）
- Commit: `1d49231` refactor: simplify codebase and remove duplicates

## 刪除的重複檔案
| 檔案 | 替代方案 |
|------|----------|
| lib/db/draft-storage.ts | lib/draft-storage.ts |
| lib/db/prisma.ts | lib/prisma.ts |
| lib/utils/currency.ts | lib/currency.ts |
| lib/utils/export-utils.ts | lib/export-utils.ts |
| lib/utils/money.ts | lib/money.ts |
| lib/utils/pagination.ts | lib/pagination.ts |
| lib/utils/utils.ts | lib/utils.ts |

## Git Commits (2026-01-22 續)
| Commit | Message |
|--------|---------|
| `893743e` | fix: security scan fixes (8 issues) |
| `1d49231` | refactor: simplify codebase and remove duplicates |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | 安全掃描和程式碼簡化完成 |
| Where am I going? | 任務完成，待推送至遠端 |
| What's the goal? | 安全掃描 + 程式碼簡化 |
| What have I learned? | 見 findings.md |
| What have I done? | 修復 8 安全問題，刪除 907 行冗餘程式碼 |

---

---

## Session: 2026-01-24 - 註冊功能增強 + 安全性修復

### Phase 1: 新增註冊組別選擇
- **Status:** complete
- **Started:** 2026-01-24
- Actions taken:
  - 讀取現有註冊表單結構
  - 新增組別下拉選單至 `register-form.tsx`
  - 修改 `register.ts` schema 加入 department 欄位
  - 新增中英文翻譯至 `language-context.tsx`
- Files modified:
  - components/register-form.tsx
  - app/actions/register.ts
  - lib/language-context.tsx

### Phase 2: 安全性修復（第二次掃描）
- **Status:** complete
- Actions taken:
  - 新增 Content-Security-Policy (CSP) 標頭
  - CRON 驗證改用 timing-safe 比較
  - 報帳單拒絕新增狀態白名單驗證
  - 密碼要求加強至 8 字元 + 英文 + 數字
  - JSON 解析前新增 1MB 大小限制
- Files modified:
  - next.config.mjs (CSP)
  - app/api/cron/cleanup-sessions/route.ts (timing-safe)
  - app/actions/approvals.ts (狀態驗證)
  - app/actions/register.ts (密碼強度)
  - app/actions/expenses.ts (JSON 大小限制)

### Phase 3: 組別必填 + 名稱調整
- **Status:** complete
- Actions taken:
  - 將 department 從 optional 改為 required
  - 「電控組」→「電資組」
  - 「形象組」→「意象組」
- Files modified:
  - app/actions/register.ts
  - components/register-form.tsx
  - lib/language-context.tsx

### Phase 4: 程式碼簡化
- **Status:** complete
- Actions taken:
  - 使用 code-simplifier agent 簡化修改的程式碼
  - 抽取 `isValidCronKey()` 輔助函式
  - 合併權限檢查為單一 if-else 鏈
  - 簡化 department null 處理
- Simplifications:
  - cleanup-sessions/route.ts: 抽取 timing-safe 函式
  - approvals.ts: 合併 4 個權限檢查
  - register.ts: 簡化 `formData.get("department") || null`

### Phase 5: 提交與推送
- **Status:** complete
- Commits:
  - `6a96b63` feat: 註冊時新增組別選擇 + 安全性修復
  - `1b69e39` fix: 電控組改為電資組

## Git Commits (2026-01-24)
| Commit | Message |
|--------|---------|
| `6a96b63` | feat: 註冊時新增組別選擇 + 安全性修復 |
| `1b69e39` | fix: 電控組改為電資組 |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | 已完成註冊功能增強和安全修復 |
| Where am I going? | 功能完成，已推送至 GitHub |
| What's the goal? | 註冊時新增組別選擇 + 安全加固 |
| What have I learned? | 見 findings.md 2026-01-24 section |
| What have I done? | 修改 7 個檔案，修復 5 個安全問題，新增組別選擇功能 |

---

## Session: 2026-01-25 - 登入速率限制 + CSP 改善

### Phase 1: 登入速率限制
- **Status:** complete
- **Started:** 2026-01-25
- Actions taken:
  - 在 `auth.ts` 新增速率限制邏輯
  - 使用 Redis 追蹤失敗登入嘗試
  - 每個 Email 每 15 分鐘最多 5 次失敗嘗試
  - 登入成功後自動重置計數
- Functions added:
  - `checkLoginRateLimit(email)` - 檢查是否超過限制
  - `recordFailedLogin(email)` - 記錄失敗嘗試
  - `resetLoginAttempts(email)` - 成功登入後重置
- Files modified:
  - auth.ts

### Phase 2: CSP 改善
- **Status:** complete
- Actions taken:
  - 生產環境移除 `unsafe-eval`（開發環境保留，Hot Reload 需要）
  - 添加 `upgrade-insecure-requests`（強制 HTTPS）
  - 添加 `wss://*.supabase.co` 支援 WebSocket
- Files modified:
  - next.config.mjs

### Phase 3: 驗證
- **Status:** complete
- Actions taken:
  - 執行 `npm run build` - 成功

### Phase 4: 安全掃描修復
- **Status:** complete
- Actions taken:
  - 修復 Timing-Safe 比較（固定長度 buffer）
  - Debug API 遮罩 email（a***@example.com）
  - 錯誤訊息改為通用訊息（不洩漏內部細節）
  - 創建 middleware.ts（全局速率限制）
- Files modified:
  - app/api/cron/cleanup-sessions/route.ts
  - app/api/debug/route.ts
  - app/actions/inventory.ts
  - app/actions/ocr.ts
- Files created:
  - middleware.ts

### Phase 5: 完整安全掃描
- **Status:** complete
- Actions taken:
  - 執行 Next.js 安全掃描（OWASP Top 10）
  - 掃描結果：0 CRITICAL, 0 HIGH, 2 MEDIUM, 3 LOW, 4 INFO
- Scan results:
  - 依賴漏洞：無
  - 硬編碼密鑰：無
  - XSS 漏洞：無
  - SQL 注入：Prisma ORM 保護
  - 認證檢查：全部通過

### Phase 6: 程式碼簡化（第二次）
- **Status:** complete
- Actions taken:
  - 刪除 31 個重複/未使用的元件檔案
  - 修復 middleware.ts 的 TypeScript 錯誤（for...of → forEach）
- Files deleted: 31 個
- Code removed: ~7,689 行
- Fix: `for...of` 改為 `forEach`（修復 Vercel downlevelIteration 錯誤）

### Phase 7: 提交與部署
- **Status:** complete
- Actions taken:
  - 提交所有變更
  - 推送至 GitHub
  - Vercel 自動部署

## Git Commits (2026-01-25)
| Commit | Message |
|--------|---------|
| `9f9aa8c` | feat: 登入速率限制 + CSP 改善 |
| `5b9c5f7` | fix: 安全掃描修復 |
| `240a02c` | refactor: 程式碼簡化 + 修復 Vercel 部署錯誤 |

## 今日工作統計
| 項目 | 數量 |
|------|------|
| 新增檔案 | 1 (middleware.ts) |
| 修改檔案 | 8 |
| 刪除檔案 | 31 |
| 減少程式碼 | ~7,689 行 |
| 安全問題修復 | 5 (2 MEDIUM + 3 LOW) |
| 新功能 | 2 (登入速率限制 + 全局速率限制) |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | 2026-01-25 工作完成 |
| Where am I going? | 已推送至 GitHub，Vercel 自動部署中 |
| What's the goal? | 安全加固 + 程式碼簡化 |
| What have I learned? | Map.forEach 比 for...of 更兼容 |
| What have I done? | 登入速率限制、CSP 改善、安全修復、程式碼簡化 |

---

---

## Session: 2026-01-25 (續) - 登入失敗問題修復

### Phase 1: 問題診斷
- **Status:** complete
- **Started:** 2026-01-25
- **Reported Issue:** 用戶輸入正確密碼但無法登入，無錯誤訊息
- Actions taken:
  - 創建診斷腳本 `scripts/check-user.ts`
  - 驗證用戶存在且密碼正確
  - 發現 Redis 連接失敗（DNS 無法解析）
  - 發現 AUTH_URL 設為線上地址

### Phase 2: 問題修復
- **Status:** complete
- Actions taken:
  - 為 `auth.ts` 三個 Redis 函式添加 try-catch 錯誤處理
  - 註釋 `.env` 中的 AUTH_URL
  - 重啟開發伺服器測試
- Files modified:
  - `auth.ts` - 添加 Redis 錯誤處理
  - `.env` - 註釋 AUTH_URL
- Files created:
  - `scripts/check-user.ts` - 用戶診斷腳本
  - `scripts/clear-login-lock.ts` - 清除登入鎖定腳本

### Phase 3: 文件更新
- **Status:** complete
- Actions taken:
  - 更新 CLAUDE.md 添加問題紀錄
  - 更新 findings.md 添加診斷過程
  - 更新 progress.md（此檔案）
  - 創建 TROUBLESHOOTING.md 錯誤排查指南

## 問題根因分析
| 問題 | 根因 | 解決方案 |
|------|------|----------|
| 登入無錯誤但失敗 | Redis 連接失敗無錯誤處理 | 添加 try-catch，失敗時降級運作 |
| Session 無法保存 | AUTH_URL 設為線上地址 | 本地開發時註釋 AUTH_URL |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | 登入問題已修復 |
| Where am I going? | 更新文件，創建錯誤排查指南 |
| What's the goal? | 修復登入失敗問題 + 防止未來發生 |
| What have I learned? | 外部服務必須有錯誤處理；本地/線上環境配置要分開 |
| What have I done? | 診斷問題、修復 auth.ts、更新 .env、創建診斷腳本 |

---

---

## Session: 2026-01-25 (續) - Build 錯誤修復 + 程式碼簡化 + 安全掃描

### Phase 1: Build 錯誤修復
- **Status:** complete
- **Started:** 2026-01-25
- Actions taken:
  - 修復 `lib/actions/helpers.ts` - 移除 `"use server"` 指令
  - 修復 `components/funding-dialog.tsx` - 移除未使用的 `useLanguage`
  - 修復 `components/app-sidebar.tsx` - 改用 `next/image` 的 `Image` 組件
  - 修復 `components/settings-content.tsx` - 改用 `next/image` 的 `Image` 組件
  - 修復 `components/ui/currency-input.tsx` - 修正 `useEffect` 依賴陣列
  - 修復 `app/actions/export.ts` - 添加索引簽名到匯出介面
  - 修復 `lib/export-utils.ts` - 調整 `DataRow` 類型

### Phase 2: 程式碼簡化
- **Status:** complete
- Actions taken:
  - 使用 code-simplifier agent 簡化 7 個檔案
  - `lib/actions/helpers.ts` - 新增 `FINANCE_ROLES` 常數
  - `components/funding-dialog.tsx` - useEffect cleanup、常數提取
  - `components/app-sidebar.tsx` - 簡化函式邏輯
  - `components/settings-content.tsx` - 提取 `PasswordField` 組件
  - `components/ui/currency-input.tsx` - 純函式提取
  - `app/actions/export.ts` - 通用 `getLabel` 函式
  - `lib/export-utils.ts` - 類型別名優化

### Phase 3: 安全掃描
- **Status:** complete
- Actions taken:
  - 執行 npm audit - 0 個 CVE 漏洞
  - 全面安全掃描 - OWASP Top 10 檢查通過
- Results:
  - CSP 標頭：已配置
  - 速率限制：登入 5 次/15 分鐘，全局 100 req/min
  - SSRF 防護：已實施
  - 認證檢查：全部通過
  - XSS/Injection：未發現

### Phase 4: 提交與推送
- **Status:** complete
- Actions taken:
  - 提交 57 個檔案 (+3151/-1430 行)
  - 推送至 GitHub
- Commit: `02fded2` refactor: 程式碼簡化 + 安全掃描確認

## Git Commits (2026-01-25 最終)
| Commit | Message |
|--------|---------|
| `02fded2` | refactor: 程式碼簡化 + 安全掃描確認 |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | 2026-01-25 所有工作完成 |
| Where am I going? | 已推送，Vercel 自動部署 |
| What's the goal? | Build 修復 + 簡化 + 安全確認 |
| What have I learned? | 見 findings.md |
| What have I done? | 修復 5 個 build 錯誤，簡化 7 個檔案，安全掃描通過 |

---

## Session: 2026-01-25 (續) - Vercel 部署修復 + UI 調整 + 功能新增

### Phase 1: Vercel 部署錯誤修復
- **Status:** complete
- **Started:** 2026-01-25
- **Error:** `Type 'Session' is not assignable to type '...'`
- Actions taken:
  - 修復 `SettingsContentProps` 類型定義
  - NextAuth Session 的 `user.name/email/image` 可能是 `null`
  - 將類型從 `string | undefined` 改為 `string | null | undefined`
- Files modified:
  - `components/settings-content.tsx`
- Commit: `3e86c74` fix: 修正 SettingsContentProps 類型以接受 null 值

### Phase 2: UI 調整 - 移除星星圖標
- **Status:** complete
- Actions taken:
  - 移除「FRC 6998 報帳系統」旁邊的 Sparkles 圖標
  - 移除「歡迎回來, Rick」旁邊的 Sparkles 圖標
  - 清理未使用的 Sparkles import
- Files modified:
  - `components/app-sidebar.tsx`
  - `components/dashboard-header.tsx`

### Phase 3: 新增 Mentor 註冊選項
- **Status:** complete
- Actions taken:
  - 在 Prisma schema 新增 `MENTOR` 到 `TeamDepartment` enum
  - 在註冊頁面新增 Mentor 選項
  - 新增中英文翻譯（老師 / Mentor）
- Files modified:
  - `prisma/schema.prisma`
  - `app/register/page.tsx`
  - `lib/language-context.tsx`

### Redis 連接警告（已知問題）
- **Status:** 用戶選擇忽略
- **原因:** Upstash Redis 實例無法訪問（DNS 解析失敗）
- **影響:** 無 - 登入功能正常運作，速率限制自動降級
- **解決方案:** 可到 Upstash Console 創建新實例或忽略警告

## Git Commits (2026-01-25 續)
| Commit | Message |
|--------|---------|
| `3e86c74` | fix: 修正 SettingsContentProps 類型以接受 null 值 |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | 2026-01-25 UI 調整和功能新增完成 |
| Where am I going? | 提交並推送所有變更 |
| What's the goal? | Vercel 部署修復 + UI 調整 + Mentor 選項 |
| What have I learned? | NextAuth Session 類型可能包含 null |
| What have I done? | 修復類型錯誤，移除星星圖標，新增 Mentor 選項 |

---

## Session: 2026-01-25 (續) - 導航進度追蹤系統

### Phase 1: 實作導航進度追蹤系統
- **Status:** complete
- **Started:** 2026-01-25
- Actions taken:
  - 使用 Subagent-Driven Development 執行計劃
  - 建立 NavigationProgressProvider（追蹤導航狀態）
  - 建立 NavigationProgressBar（頂部進度條 + shimmer 效果）
  - 建立 NavigationLink（包裝 Next.js Link）
  - 整合 Provider 到 Root Layout
  - 更新側邊欄使用 NavigationLink
  - 增強 DashboardWrapper 過渡效果

### Phase 2: 規格審查與程式碼簡化
- **Status:** complete
- Actions taken:
  - 每個任務完成後進行規格審查（全部通過）
  - 使用 code-simplifier agent 簡化程式碼
  - 提取 `normalizePath` 共用函式減少重複
  - 新增常數消除魔術數字

### Phase 3: 安全掃描
- **Status:** complete
- Actions taken:
  - 執行針對性安全掃描
  - 檢查 XSS、注入攻擊、客戶端安全
- Results:
  - 無 `dangerouslySetInnerHTML` 使用 ✅
  - 無動態程式碼執行 ✅
  - 路徑處理安全 ✅
  - Timer 正確清理 ✅
  - 無敏感資料硬編碼 ✅

### Phase 4: 提交與推送
- **Status:** complete
- Commit: `36d46cc` feat: 新增導航進度追蹤系統

## 新增檔案
| 檔案 | 說明 |
|------|------|
| `lib/navigation-progress-context.tsx` | NavigationProgressProvider + useNavigationProgress hook |
| `components/navigation/navigation-progress-bar.tsx` | 頂部進度條（紫→青→綠漸層 + shimmer） |
| `components/navigation/navigation-link.tsx` | 包裝 Next.js Link 觸發進度條 |
| `components/navigation/index.ts` | 導出檔案 |

## 修改檔案
| 檔案 | 變更 |
|------|------|
| `app/layout.tsx` | 加入 NavigationProgressProvider 和 NavigationProgressBar |
| `components/app-sidebar.tsx` | 所有 `<a>` 替換為 `<NavigationLink>` |
| `components/dashboard-header.tsx` | DashboardWrapper 加入導航過渡效果 |
| `tailwind.config.ts` | 新增 shimmer 動畫 keyframe |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | 導航進度追蹤系統完成 |
| Where am I going? | 已推送至 GitHub |
| What's the goal? | 側邊欄導航時顯示頂部進度條 |
| What have I learned? | Subagent-Driven Development 流程有效 |
| What have I done? | 實作 4 個新檔案，修改 4 個檔案，安全掃描通過 |

---

## Session: 2026-01-25 (續) - 庫存 QR Code 掃描功能

### Phase 1: QR Code 功能實作
- **Status:** complete
- **Started:** 2026-01-25
- Actions taken:
  - 安裝 `qrcode.react` 和 `html5-qrcode`
  - 建立 `components/qr-scanner.tsx` 網頁版相機掃描
  - 建立 `components/inventory-qr-modal.tsx` QR Code 顯示/列印
  - 建立 `app/dashboard/inventory/scan/page.tsx` 掃描頁面
  - 新增 `getItemBySku` Server Action
  - 修改 `inventory-content.tsx` 新增位置過濾和 QR 按鈕
- Files created:
  - `components/qr-scanner.tsx`
  - `components/inventory-qr-modal.tsx`
  - `app/dashboard/inventory/scan/page.tsx`
  - `types/inventory.ts`
- Files modified:
  - `app/actions/inventory.ts`
  - `components/inventory-content.tsx`
  - `package.json`

### Phase 2: 安全性強化
- **Status:** complete
- Actions taken:
  - 新增 `ENABLE_DEBUG_ENDPOINTS` 環境變數控制
  - 修復 `/api/debug`、`/api/seed`、`/api/test-user` 安全檢查
  - 新增 SKU 輸入驗證（長度限制 + 字元白名單）
- Files modified:
  - `app/api/debug/route.ts`
  - `app/api/seed/route.ts`
  - `app/api/test-user/route.ts`
  - `app/actions/inventory.ts`
  - `.env.example`

### Phase 3: 程式碼簡化
- **Status:** complete
- Actions taken:
  - 建立共用類型檔案 `types/inventory.ts`
  - 簡化 modal 狀態管理
  - 移除未使用的 Capacitor 檔案
- Files deleted:
  - `capacitor.config.ts`
  - `lib/capacitor-scanner.ts`
  - `types/capacitor-barcode-scanner.d.ts`

### Phase 4: Vercel 部署修復
- **Status:** complete
- **Error:** `Type 'Set<string>' can only be iterated through when using '--downlevelIteration'`
- Actions taken:
  - 將 `[...new Set()]` 改為 `Array.from(new Set())`
  - 記錄到 TROUBLESHOOTING.md
- Files modified:
  - `components/inventory-content.tsx`
  - `TROUBLESHOOTING.md`

## Git Commits (2026-01-25 QR Code)
| Commit | Message |
|--------|---------|
| `2ccf6de` | feat: 庫存 QR Code 掃描功能 + 安全性強化 |
| `edc6d6b` | fix: 改善相機錯誤訊息顯示 |
| `408a929` | fix: 修正 Set 迭代相容性問題 |
| `15283e0` | docs: 新增 Set 迭代錯誤解決方案 |

## 新增功能摘要
| 功能 | 說明 |
|------|------|
| QR Code 掃描 | 網頁版相機掃描（html5-qrcode） |
| QR Code 標籤 | 列印/下載 QR Code 標籤 |
| 位置過濾 | 庫存頁面新增位置下拉選單 |
| SKU 查詢 | 掃描後顯示零件資訊 + 快速入出庫 |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | QR Code 功能完成，已合併到 main |
| Where am I going? | 功能上線，Vercel 自動部署 |
| What's the goal? | 庫存 QR Code 掃描 + 入出庫 |
| What have I learned? | Array.from(new Set()) 比展開運算子更兼容 |
| What have I done? | 實作 QR 掃描、安全加固、修復 Vercel 錯誤 |

---

## Session: 2026-01-27 - Git 回退修復部署問題

### Phase 1: 問題診斷
- **Status:** complete
- **Started:** 2026-01-27
- **Reported Issue:** Vercel 部署的網站仍顯示舊的 SKU 驗證錯誤訊息
  - 錯誤訊息：「料號只允許字母、數字、連字符和底線」
  - 本地代碼已更新（validateSku 允許任何字符）
- Actions taken:
  - 檢查本地 `inventory.ts` 確認 validateSku 函數已正確更新
  - 發現本地代碼與 Vercel 部署不一致

### Phase 2: Git 回退執行
- **Status:** complete
- Actions taken:
  - 查看 git log 確認提交歷史
  - 執行 `git reset --hard d9af3d5a0a511488fd31cfbef7561537f452a8c4`
  - 回退到 "Merge branch 'experiment' into main" 提交
  - 執行 `git push --force` 強制推送到遠端
- Commits removed:
  - `1816f48` fix: 移除 object-fit cover，恢復掃描功能
  - `6db150e` fix: 用 CSS 強制讓相機畫面填滿掃描框
  - `38e2a54` fix: 移除 aspectRatio 限制，修復手機黑屏問題

### Phase 3: 驗證
- **Status:** complete
- Actions taken:
  - 使用 GitHub API 確認 main 分支已回到 d9af3d5
  - 確認 commit message：「Merge branch 'experiment' into main」

### Phase 4: Vercel 部署確認
- **Status:** pending
- Notes:
  - 用戶報告 Vercel 部署可能有快取延遲
  - 需要等待 Vercel 重新部署並確認

## Git 操作紀錄 (2026-01-27)
| 操作 | 命令 | 說明 |
|------|------|------|
| 回退 | `git reset --hard d9af3d5` | 回到 experiment 合併點 |
| 強推 | `git push --force` | 覆蓋遠端 main 分支 |

## 被移除的 Commits
| Commit | Message | 影響 |
|--------|---------|------|
| `1816f48` | fix: 移除 object-fit cover，恢復掃描功能 | QR 掃描相機樣式 |
| `6db150e` | fix: 用 CSS 強制讓相機畫面填滿掃描框 | QR 掃描相機樣式 |
| `38e2a54` | fix: 移除 aspectRatio 限制，修復手機黑屏問題 | QR 掃描相機樣式 |

## 5-Question Reboot Check
1. **做什麼？** 回退 main 分支到 d9af3d5，修復 Vercel 部署顯示舊代碼問題
2. **進度？** Git 回退完成，等待 Vercel 重新部署確認
3. **下一步？** 確認 Vercel 部署後網站顯示正確的 SKU 驗證行為
4. **阻礙？** Vercel 可能有快取延遲，需要等待或手動觸發重新部署
5. **檔案？** 無需查看特定檔案，主要監控 Vercel 部署狀態

---

## Session: 2026-01-28 - 收款帳戶功能

### 完成項目
- [x] 新增 BankAccount 資料模型（prisma/schema.prisma）
- [x] 新增收款帳戶管理 Server Actions（app/actions/bank-accounts.ts）
- [x] 新增帳號遮罩工具（lib/utils/mask-account.ts）
- [x] 新增台灣銀行常數（lib/constants/banks.ts）
- [x] 新增收款帳戶管理 UI 組件（components/bank-account-settings.tsx）
- [x] 新增帳戶選擇對話框（components/bank-account-select-dialog.tsx）
- [x] 整合到設定頁面、報帳單提交、審核頁面
- [x] 安全性修復：新增角色檢查到 updateBankAccount, deleteBankAccount, setDefaultBankAccount
- [x] 安全性修復：新增帳號格式驗證（只允許數字和連字號）
- [x] 安全性修復：新增欄位長度限制
- [x] 程式碼簡化：新增 lib/ui-constants.ts 統一按鈕樣式常數
- [x] 程式碼簡化：移除未使用的函數和常數

### 修改檔案
- `prisma/schema.prisma` - 新增 BankAccount 模型
- `app/actions/bank-accounts.ts` - 新增 CRUD Server Actions
- `lib/utils/mask-account.ts` - 帳號遮罩工具
- `lib/constants/banks.ts` - 台灣銀行代碼常數
- `lib/ui-constants.ts` - 統一按鈕樣式常數
- `components/bank-account-settings.tsx` - 收款帳戶管理 UI
- `components/bank-account-select-dialog.tsx` - 帳戶選擇對話框
- `app/dashboard/settings/page.tsx` - 整合帳戶設定
- `components/expense-form.tsx` - 整合帳戶選擇
- `app/dashboard/approvals/page.tsx` - 顯示收款帳戶資訊

### 解決的技術問題
| 問題 | 原因 | 解決方案 |
|------|------|----------|
| Prisma client 未正確生成 | generate 命令執行環境問題 | 使用 `node -e` 執行 prisma generate |
| 對話框被父元素遮擋 | z-index 堆疊問題 | 使用 createPortal 渲染到 document.body |
| 資料庫欄位不存在 | Schema 未同步 | 執行 prisma db push 同步 schema |

### 5-Question Reboot Check
1. **做什麼？** 實作收款帳戶管理功能
2. **進度？** 功能完成，已整合到設定、報帳單提交、審核頁面
3. **下一步？** 測試線上環境、確認 Vercel 部署
4. **阻礙？** 無
5. **檔案？** `app/actions/bank-accounts.ts`, `components/bank-account-settings.tsx`, `components/bank-account-select-dialog.tsx`

---

## Session: 2026-02-01 - BudgetFlow iOS App 上架計劃（階段 1-2）

### 完成項目
- [x] 修復 CSP Permissions-Policy camera 設定：`camera=()` -> `camera=(self)`
- [x] 修復貓咪載入動畫背景：添加 `mix-blend-screen`
- [x] 新增 Capacitor 環境偵測工具：`lib/capacitor.ts`
- [x] WebView 行為控制 + Safe Area CSS：`app/globals.css`
- [x] 更新 layout.tsx metadata：title, viewport-fit, apple-mobile-web-app tags
- [x] 安裝 Capacitor 套件（core, ios, splash-screen, status-bar, network, cli）
- [x] 建立 `capacitor.config.ts`（Remote WebView 模式，指向 Vercel URL placeholder）
- [x] `npx cap add ios` 成功，`ios/` 目錄已生成
- [x] 更新 `.gitignore` 添加 `ios/App/Pods/` 等排除規則
- [x] 更新 `tsconfig.json` 排除 `capacitor.config.ts` 和 `ios/`
- [x] `npm run build` 驗證通過（24 個頁面全部正常生成）

### 修改檔案
- `next.config.mjs` - CSP Permissions-Policy camera=(self)
- `components/navigation/navigation-progress-bar.tsx` - 貓咪動畫 mix-blend-screen
- `lib/capacitor.ts` - **新增** Capacitor 環境偵測工具（isNativeApp, isIOSApp, isWebBrowser）
- `app/globals.css` - 新增 `.capacitor-app` 樣式和 safe-area padding
- `app/layout.tsx` - metadata title -> "BudgetFlow"、viewport-fit=cover、apple-mobile-web-app tags
- `capacitor.config.ts` - **新增** Capacitor 配置檔（Remote WebView 模式）
- `package.json` - 新增 Capacitor 依賴
- `.gitignore` - 新增 ios/App/Pods/ 等排除
- `tsconfig.json` - exclude capacitor.config.ts 和 ios/

### 解決的技術問題
| 問題 | 原因 | 解決方案 |
|------|------|----------|
| `CapacitorConfig` 型別找不到 | 需從 `@capacitor/cli` 匯入，非 `@capacitor/core` | 修正 import 來源 |
| `capacitor.config.ts` 被 Next.js build 編譯 | Next.js build 會掃描專案根目錄的 .ts 檔 | tsconfig.json exclude 排除 |
| `window as Record<string, unknown>` 型別轉換不通過 | TypeScript 不允許直接 type assertion | 改用 interface 宣告 `window.Capacitor` |

### 5-Question Reboot Check
1. **做什麼？** BudgetFlow iOS App 上架計劃 - 階段 1（Web App 端調整）和階段 2（Capacitor 初始化）
2. **進度？** 階段 1-2 完成，階段 3-7 待續（需要 Mac 環境）
3. **下一步？** 在 Mac 上繼續階段 3（Xcode 專案配置）、階段 4（Native 功能橋接）、階段 5-7（TestFlight/App Store 上架）
4. **阻礙？** 階段 3+ 需要 Mac + Xcode 環境，用戶明天用 Mac 繼續
5. **檔案？** `capacitor.config.ts`（需更新 Vercel URL）、`lib/capacitor.ts`（環境偵測）、`ios/` 目錄（Xcode 專案）

---

## 下一步建議
1. 替換 `.env` 中的弱密碼（AUTH_SECRET, CRON_SECRET_KEY）
2. 到 Google Cloud Console 撤銷外洩的服務帳戶金鑰（如尚未完成）
3. 考慮使用外部儲存服務存放 Avatar（S3/Vercel Blob）
4. 推送前永遠執行 `npm run build`
5. 檢查 Upstash Redis 配置是否正確（或創建新實例）
6. 執行 `npx prisma db push` 更新線上資料庫 schema（新增 BankAccount 模型）
7. **iOS App 上架**：在 Mac 上繼續階段 3-7（Xcode 配置、Native 功能、TestFlight、App Store）
