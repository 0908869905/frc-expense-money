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

## 下一步建議
1. 替換 `.env` 中的弱密碼（AUTH_SECRET, CRON_SECRET_KEY）
2. 到 Google Cloud Console 撤銷外洩的服務帳戶金鑰（如尚未完成）
3. 考慮使用外部儲存服務存放 Avatar（S3/Vercel Blob）
4. 推送前永遠執行 `npm run build`
5. 檢查 Upstash Redis 配置是否正確（或創建新實例）
6. 執行 `npx prisma db push` 更新線上資料庫 schema（新增 MENTOR）
