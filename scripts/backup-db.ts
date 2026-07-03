/**
 * 資料庫完整備份腳本
 * 使用方式：npx tsx scripts/backup-db.ts
 *
 * 透過 Prisma DMMF 自動列舉 schema 中「所有」model，逐一 findMany 匯出為 JSON，
 * 確保不會遺漏任何資料表。輸出至 backups/YYYY-MM-DD_HHmmss/（已加入 .gitignore）。
 *
 * 還原方式見 scripts/restore-db.ts
 */

import { PrismaClient, Prisma } from "@prisma/client";
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function main() {
  const models = Prisma.dmmf.datamodel.models.map((m) => m.name);
  console.log(`發現 ${models.length} 個 model：${models.join(", ")}\n`);

  const outDir = path.join(process.cwd(), "backups", timestamp());
  fs.mkdirSync(outDir, { recursive: true });

  const manifest: Record<string, number> = {};
  const errors: string[] = [];

  for (const modelName of models) {
    const delegate = (prisma as unknown as Record<string, { findMany: () => Promise<unknown[]> }>)[
      lowerFirst(modelName)
    ];
    if (!delegate?.findMany) {
      errors.push(`${modelName}: 找不到 Prisma delegate`);
      continue;
    }
    try {
      const rows = await delegate.findMany();
      const file = path.join(outDir, `${modelName}.json`);
      fs.writeFileSync(file, JSON.stringify(rows, null, 2), "utf-8");
      manifest[modelName] = rows.length;
      console.log(`  ✅ ${modelName}: ${rows.length} 筆 → ${path.basename(file)}`);
    } catch (e) {
      errors.push(`${modelName}: ${e instanceof Error ? e.message : String(e)}`);
      console.error(`  ❌ ${modelName} 備份失敗:`, e);
    }
  }

  fs.writeFileSync(
    path.join(outDir, "_manifest.json"),
    JSON.stringify(
      {
        createdAt: new Date().toISOString(),
        models: manifest,
        totalRows: Object.values(manifest).reduce((a, b) => a + b, 0),
        errors,
      },
      null,
      2
    ),
    "utf-8"
  );

  console.log(`\n備份目錄：${outDir}`);
  console.log(`總筆數：${Object.values(manifest).reduce((a, b) => a + b, 0)}`);

  if (errors.length > 0) {
    console.error(`\n⚠️ ${errors.length} 個 model 備份失敗：\n${errors.join("\n")}`);
    process.exitCode = 1;
  } else {
    console.log(`\n✅ 全部 ${models.length} 個 model 備份成功`);
  }

  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("備份失敗：", e);
  await prisma.$disconnect();
  process.exit(1);
});
