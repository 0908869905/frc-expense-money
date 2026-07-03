/**
 * 資料庫還原腳本（搭配 scripts/backup-db.ts 的輸出使用）
 * 使用方式：npx tsx scripts/restore-db.ts <備份目錄> --confirm
 * 範例：    npx tsx scripts/restore-db.ts backups/2026-07-03_020000 --confirm
 *
 * 行為：依照外鍵依賴順序，將 JSON 資料以 createMany + skipDuplicates 寫回。
 * - 不會先清空資料表（既有同 id 資料會被跳過）
 * - 如需完整還原到備份時間點，請先透過 Supabase Dashboard 或手動清空資料表
 */

import { PrismaClient, Prisma } from "@prisma/client";
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

// 依外鍵依賴排序（父表在前）
const RESTORE_ORDER = [
  "User",
  "VerificationToken",
  "DepartmentBudget",
  "InventoryItem",
  "FundingRecord",
  "Account",
  "Session",
  "BankAccount",
  "ExpenseReport",
  "ExpenseItem",
  "ReceiptAudit",
  "ApprovalAction",
  "AuditLog",
  "InventoryTransaction",
];

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

/** 將 JSON 匯出的 null Json 欄位轉為 Prisma.DbNull，避免 createMany 驗證錯誤 */
function fixJsonFields(modelName: string, rows: Record<string, unknown>[]): Record<string, unknown>[] {
  const model = Prisma.dmmf.datamodel.models.find((m) => m.name === modelName);
  if (!model) return rows;
  const jsonFields = model.fields.filter((f) => f.type === "Json").map((f) => f.name);
  if (jsonFields.length === 0) return rows;

  return rows.map((row) => {
    const fixed = { ...row };
    for (const field of jsonFields) {
      if (fixed[field] === null) {
        fixed[field] = Prisma.DbNull;
      }
    }
    return fixed;
  });
}

async function main() {
  const dir = process.argv[2];
  const confirmed = process.argv.includes("--confirm");

  if (!dir) {
    console.log("使用方式：npx tsx scripts/restore-db.ts <備份目錄> --confirm");
    process.exit(1);
  }
  if (!confirmed) {
    console.log("⚠️ 此操作會將備份資料寫入資料庫。確定要執行請加上 --confirm");
    process.exit(1);
  }

  const backupDir = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir);
  if (!fs.existsSync(backupDir)) {
    console.error(`備份目錄不存在：${backupDir}`);
    process.exit(1);
  }

  console.log(`從 ${backupDir} 還原...\n`);

  for (const modelName of RESTORE_ORDER) {
    const file = path.join(backupDir, `${modelName}.json`);
    if (!fs.existsSync(file)) {
      console.log(`  ⏭️ ${modelName}: 無備份檔，跳過`);
      continue;
    }
    const rows = JSON.parse(fs.readFileSync(file, "utf-8")) as Record<string, unknown>[];
    if (rows.length === 0) {
      console.log(`  ⏭️ ${modelName}: 0 筆，跳過`);
      continue;
    }

    const delegate = (
      prisma as unknown as Record<string, { createMany: (args: { data: unknown[]; skipDuplicates: boolean }) => Promise<{ count: number }> }>
    )[lowerFirst(modelName)];

    try {
      const result = await delegate.createMany({
        data: fixJsonFields(modelName, rows),
        skipDuplicates: true,
      });
      console.log(`  ✅ ${modelName}: 寫入 ${result.count}/${rows.length} 筆（重複已跳過）`);
    } catch (e) {
      console.error(`  ❌ ${modelName} 還原失敗:`, e instanceof Error ? e.message : e);
    }
  }

  console.log("\n還原完成");
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("還原失敗：", e);
  await prisma.$disconnect();
  process.exit(1);
});
