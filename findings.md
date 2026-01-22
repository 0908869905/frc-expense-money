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
