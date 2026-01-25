/**
 * 檢查用戶帳號狀態
 * 使用方式：npx tsx scripts/check-user.ts <email> [password]
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

async function checkUser(email: string, testPassword?: string) {
  console.log(`\n🔍 檢查用戶：${email}\n`);

  // 查詢資料庫用戶
  console.log(`📋 資料庫用戶資訊：`);
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      department: true,
      password: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.log(`   ❌ 用戶不存在！`);
    console.log(`\n💡 建議：請先註冊帳號`);
    await prisma.$disconnect();
    return;
  }

  console.log(`   - ID: ${user.id}`);
  console.log(`   - Email: ${user.email}`);
  console.log(`   - 姓名: ${user.name ?? "(未設定)"}`);
  console.log(`   - 角色: ${user.role}`);
  console.log(`   - 部門: ${user.department ?? "(未設定)"}`);
  console.log(`   - 建立時間: ${user.createdAt}`);
  console.log(`   - 密碼欄位: ${user.password ? "✅ 已設定" : "❌ 未設定（NULL）"}`);

  if (user.password) {
    console.log(`   - 密碼格式: ${user.password.startsWith("$2") ? "✅ bcrypt 雜湊" : "⚠️ 非標準格式"}`);
    console.log(`   - 密碼長度: ${user.password.length} 字元`);
  }

  // 測試密碼（如果提供）
  if (testPassword && user.password) {
    console.log(`\n🔐 密碼驗證測試：`);
    const isValid = await bcrypt.compare(testPassword, user.password);
    console.log(`   - 測試密碼: ${testPassword}`);
    console.log(`   - 結果: ${isValid ? "✅ 密碼正確" : "❌ 密碼錯誤"}`);

    if (!isValid) {
      console.log(`\n💡 可能原因：`);
      console.log(`   1. 密碼輸入錯誤（注意大小寫）`);
      console.log(`   2. 密碼在註冊後被修改過`);
      console.log(`   3. 使用了舊密碼`);
    }
  }

  await prisma.$disconnect();
}

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email) {
    console.log("使用方式：npx tsx scripts/check-user.ts <email> [password]");
    console.log("範例：npx tsx scripts/check-user.ts user@example.com MyPassword123");
    process.exit(1);
  }

  await checkUser(email, password);
}

main().catch(console.error);
