-- ============================================
-- 金額欄位遷移：Float → Int (最小貨幣單位)
-- ============================================
-- ⚠️ 此遷移需要短暫停機（維護窗口）
-- 預估時間：5-10 分鐘（視資料量而定）
-- ============================================

-- Step 1: 新增整數欄位
ALTER TABLE "ExpenseReport" 
  ADD COLUMN IF NOT EXISTS "totalAmountCents" INTEGER;

ALTER TABLE "ExpenseItem"
  ADD COLUMN IF NOT EXISTS "amountCents" INTEGER;

ALTER TABLE "Budget"
  ADD COLUMN IF NOT EXISTS "amountCents" INTEGER,
  ADD COLUMN IF NOT EXISTS "spentCents" INTEGER;

-- Step 2: 資料轉換（使用 ROUND 確保精確）
-- 假設 TWD 無小數，直接轉換為整數
UPDATE "ExpenseReport"
SET "totalAmountCents" = ROUND("totalAmount")::INTEGER
WHERE "totalAmountCents" IS NULL;

UPDATE "ExpenseItem"
SET "amountCents" = ROUND("amount")::INTEGER
WHERE "amountCents" IS NULL;

UPDATE "Budget"
SET 
  "amountCents" = ROUND("amount")::INTEGER,
  "spentCents" = ROUND("spent")::INTEGER
WHERE "amountCents" IS NULL;

-- Step 3: 驗證資料（執行前請確認結果正確）
-- SELECT id, "totalAmount", "totalAmountCents" FROM "ExpenseReport" LIMIT 10;
-- SELECT id, "amount", "amountCents" FROM "ExpenseItem" LIMIT 10;

-- Step 4: 設定 NOT NULL 約束
ALTER TABLE "ExpenseReport"
  ALTER COLUMN "totalAmountCents" SET NOT NULL,
  ALTER COLUMN "totalAmountCents" SET DEFAULT 0;

ALTER TABLE "ExpenseItem"
  ALTER COLUMN "amountCents" SET NOT NULL;

ALTER TABLE "Budget"
  ALTER COLUMN "amountCents" SET NOT NULL,
  ALTER COLUMN "spentCents" SET NOT NULL,
  ALTER COLUMN "spentCents" SET DEFAULT 0;

-- Step 5: （可選）刪除舊欄位（建議保留一段時間作為備份）
-- ALTER TABLE "ExpenseReport" DROP COLUMN "totalAmount";
-- ALTER TABLE "ExpenseItem" DROP COLUMN "amount";
-- ALTER TABLE "Budget" DROP COLUMN "amount", DROP COLUMN "spent";

-- ============================================
-- 回滾腳本（如需還原）
-- ============================================
-- UPDATE "ExpenseReport" SET "totalAmount" = "totalAmountCents"::FLOAT;
-- ALTER TABLE "ExpenseReport" DROP COLUMN "totalAmountCents";
