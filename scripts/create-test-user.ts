/**
 * 建立/更新設計驗證用測試帳號（ADMIN 角色，可看到所有頁面）
 * 使用方式：npx tsx scripts/create-test-user.ts
 *
 * - Email: design-review@unipards.test（明顯的測試命名，不會與真實用戶混淆）
 * - 密碼: 隨機強密碼，只輸出到 stdout 與 backups/test-user-credentials.txt（gitignored）
 * - 驗證完成後可執行: npx tsx scripts/create-test-user.ts --delete 刪除此帳號
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();
const TEST_EMAIL = "design-review@unipards.test";

async function main() {
  if (process.argv.includes("--delete")) {
    const deleted = await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    console.log(`已刪除測試帳號 ${TEST_EMAIL}（${deleted.count} 筆）`);
    await prisma.$disconnect();
    return;
  }

  const password = crypto.randomBytes(18).toString("base64url");
  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email: TEST_EMAIL },
    update: { password: hashed, role: "ADMIN", name: "設計驗證帳號" },
    create: {
      email: TEST_EMAIL,
      name: "設計驗證帳號",
      password: hashed,
      role: "ADMIN",
      department: "FINANCE",
      emailVerified: new Date(),
    },
  });

  const credFile = path.join(process.cwd(), "backups", "test-user-credentials.txt");
  fs.mkdirSync(path.dirname(credFile), { recursive: true });
  fs.writeFileSync(credFile, `email=${TEST_EMAIL}\npassword=${password}\ncreatedAt=${new Date().toISOString()}\n`, "utf-8");

  console.log(`✅ 測試帳號就緒：${user.email}（role=${user.role}）`);
  console.log(`密碼已寫入 backups/test-user-credentials.txt`);
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("失敗：", e);
  await prisma.$disconnect();
  process.exit(1);
});
