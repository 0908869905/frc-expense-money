-- ============================================
-- 多租戶 Row Level Security (RLS) 遷移
-- ============================================

-- 1. 為主要資料表添加 organization_id 欄位
ALTER TABLE "ExpenseReport" 
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

ALTER TABLE "Budget"
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- 2. 建立 ExpenseReport 的 RLS 策略
ALTER TABLE "ExpenseReport" ENABLE ROW LEVEL SECURITY;

-- 讀取策略：只能看到自己組織的資料
CREATE POLICY "expense_report_tenant_read" ON "ExpenseReport"
  FOR SELECT
  USING (
    "organizationId" IS NULL OR 
    "organizationId" = current_setting('app.current_org', true)
  );

-- 寫入策略：只能操作自己組織的資料
CREATE POLICY "expense_report_tenant_write" ON "ExpenseReport"
  FOR ALL
  USING (
    "organizationId" IS NULL OR 
    "organizationId" = current_setting('app.current_org', true)
  )
  WITH CHECK (
    "organizationId" IS NULL OR 
    "organizationId" = current_setting('app.current_org', true)
  );

-- 3. 建立 Budget 的 RLS 策略
ALTER TABLE "Budget" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budget_tenant_isolation" ON "Budget"
  FOR ALL
  USING (
    "organizationId" IS NULL OR 
    "organizationId" = current_setting('app.current_org', true)
  )
  WITH CHECK (
    "organizationId" IS NULL OR 
    "organizationId" = current_setting('app.current_org', true)
  );

-- 4. 建立 InventoryItem 的 RLS 策略 (如有需要)
-- ALTER TABLE "InventoryItem" ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY ... 

-- ============================================
-- 使用說明
-- ============================================
-- 在每個 API 請求開始時，需執行：
-- SET app.current_org = 'organization-id-here';
-- 
-- 這樣 RLS 策略會自動過濾資料
-- ============================================
