-- ============================================
-- 組織資料歸戶 (Organization Backfill)
-- ============================================
-- 目的：為既有資料填入 organization_id
-- 策略：建立一個 "Legacy Org" 作為預設組織
-- ============================================

-- Step 0: 先為 ExpenseReport 新增 organizationId 欄位（如不存在）
ALTER TABLE "ExpenseReport" 
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Step 1: 建立 Legacy 組織（如尚未存在）
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

-- Step 2: 將所有既有 ExpenseReport 歸入 Legacy Org
UPDATE "ExpenseReport"
SET "organizationId" = 'legacy-org-001'
WHERE "organizationId" IS NULL;

-- Step 3: 將所有既有 Budget 歸入 Legacy Org（如果 Budget 表存在）
-- UPDATE "Budget"
-- SET "organizationId" = 'legacy-org-001'
-- WHERE "organizationId" IS NULL;

-- Step 4: 驗證資料
-- SELECT COUNT(*) FROM "ExpenseReport" WHERE "organizationId" IS NULL;
-- 應該回傳 0

-- Step 5: 設定 NOT NULL 約束（確認上述查詢都為 0 後再執行）
-- ALTER TABLE "ExpenseReport" ALTER COLUMN "organizationId" SET NOT NULL;

