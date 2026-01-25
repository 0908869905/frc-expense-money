/**
 * 清除登入速率限制鎖定
 * 使用方式：npx tsx scripts/clear-login-lock.ts <email>
 */

import { Redis } from "@upstash/redis";
import * as dotenv from "dotenv";

dotenv.config();

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!REDIS_URL || !REDIS_TOKEN) {
  console.error("❌ 缺少 Redis 配置，請確認 .env 中有設定：");
  console.error("   - UPSTASH_REDIS_REST_URL");
  console.error("   - UPSTASH_REDIS_REST_TOKEN");
  process.exit(1);
}

const redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });

async function clearLoginLock(email: string) {
  const key = `login_attempts:${email.toLowerCase()}`;

  // 檢查目前的失敗次數
  const current = await redis.get<number>(key);

  if (current === null || current === 0) {
    console.log(`✅ ${email} 沒有被鎖定（失敗次數：0）`);
    return;
  }

  console.log(`📊 ${email} 目前失敗次數：${current}`);

  // 清除鎖定
  await redis.del(key);
  console.log(`✅ 已清除 ${email} 的登入鎖定`);
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.log("使用方式：npx tsx scripts/clear-login-lock.ts <email>");
    console.log("範例：npx tsx scripts/clear-login-lock.ts user@example.com");
    process.exit(1);
  }

  await clearLoginLock(email);
}

main().catch(console.error);
