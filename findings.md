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
