-- User Isolation Migration
-- 為 User 表添加 organizationId 欄位

-- 1. 添加 organizationId 欄位（如果不存在）
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "organizationId" TEXT DEFAULT 'frc-6998';

-- 2. 將所有現有用戶歸屬到 FRC 組織
UPDATE "User"
SET "organizationId" = 'frc-6998'
WHERE "organizationId" IS NULL;

-- 3. 創建索引以加速組織查詢
CREATE INDEX IF NOT EXISTS "User_organizationId_idx" ON "User"("organizationId");

-- 4. 確認結果
SELECT "organizationId", COUNT(*) as count FROM "User" GROUP BY "organizationId";
