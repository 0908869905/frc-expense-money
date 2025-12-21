# Supabase SQL 遷移完整清單

請在 Supabase SQL Editor 中**依序**執行以下 SQL。

---

## ✅ 執行順序

### 1️⃣ 建立新資料表（Phase 5 功能）

```sql
-- 組織表 (多租戶基礎)
CREATE TABLE IF NOT EXISTS "Organization" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "logoUrl" TEXT,
  "currency" TEXT DEFAULT 'TWD',
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3)
);

-- 組織成員表
CREATE TABLE IF NOT EXISTS "OrganizationMember" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "organizationId" TEXT NOT NULL REFERENCES "Organization"("id") ON DELETE CASCADE,
  "userId" TEXT NOT NULL,
  "role" TEXT DEFAULT 'MEMBER',
  "joinedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("organizationId", "userId")
);

-- 預算表
CREATE TABLE IF NOT EXISTS "Budget" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "category" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "spent" DOUBLE PRECISION DEFAULT 0,
  "currency" TEXT DEFAULT 'TWD',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "alertThreshold" DOUBLE PRECISION DEFAULT 0.8,
  "organizationId" TEXT REFERENCES "Organization"("id"),
  "createdBy" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3)
);

-- 匯率快取表
CREATE TABLE IF NOT EXISTS "ExchangeRate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "baseCurrency" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "rate" DOUBLE PRECISION NOT NULL,
  "updatedAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("baseCurrency", "currency")
);

-- 通知表 (如不存在)
CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" TEXT DEFAULT 'INFO',
  "link" TEXT,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
);
```

---

### 2️⃣ 新增 RETURNED 狀態（審核流程）

```sql
-- 新增 RETURNED 狀態到 ReportStatus enum
ALTER TYPE "ReportStatus" ADD VALUE IF NOT EXISTS 'RETURNED';
```

---

### 3️⃣ 組織資料歸戶

```sql
-- 為 ExpenseReport 新增 organizationId 欄位
ALTER TABLE "ExpenseReport" 
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- 建立 Legacy 組織
INSERT INTO "Organization" ("id", "name", "slug", "description", "currency", "createdAt", "updatedAt")
VALUES (
  'legacy-org-001',
  '預設組織',
  'legacy-default',
  '系統升級前的既有資料',
  'TWD',
  NOW(),
  NOW()
)
ON CONFLICT ("slug") DO NOTHING;

-- 將既有資料歸入 Legacy Org
UPDATE "ExpenseReport"
SET "organizationId" = 'legacy-org-001'
WHERE "organizationId" IS NULL;
```

---

### 4️⃣ 資料庫索引（效能優化）

```sql
-- ExpenseReport 索引
CREATE INDEX IF NOT EXISTS "ExpenseReport_submitterId_idx" ON "ExpenseReport"("submitterId");
CREATE INDEX IF NOT EXISTS "ExpenseReport_status_idx" ON "ExpenseReport"("status");
CREATE INDEX IF NOT EXISTS "ExpenseReport_createdAt_idx" ON "ExpenseReport"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS "ExpenseReport_organizationId_idx" ON "ExpenseReport"("organizationId");

-- ExpenseItem 索引
CREATE INDEX IF NOT EXISTS "ExpenseItem_reportId_idx" ON "ExpenseItem"("reportId");
CREATE INDEX IF NOT EXISTS "ExpenseItem_category_idx" ON "ExpenseItem"("category");
CREATE INDEX IF NOT EXISTS "ExpenseItem_date_idx" ON "ExpenseItem"("date");
```

---

## ⏳ 可選/未來執行

### 金額欄位遷移（需維護窗口）
> 此遷移會將 Float 轉為 Int，建議等系統穩定後再執行

檔案：`prisma/migrations/amount_float_to_int.sql`

### RLS 策略（需確認多租戶需求）
> 啟用後會強制資料隔離，確認準備好再執行

檔案：`prisma/migrations/rls_tenant_isolation.sql`

---

## ✅ 驗證執行結果

執行完上述 SQL 後，請執行以下驗證：

```sql
-- 確認 Organization 表存在
SELECT COUNT(*) FROM "Organization";

-- 確認 RETURNED 狀態可用
SELECT unnest(enum_range(NULL::"ReportStatus"));

-- 確認索引已建立
SELECT indexname FROM pg_indexes WHERE tablename = 'ExpenseReport';
```
