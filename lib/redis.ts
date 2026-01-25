/**
 * Upstash Redis 配置
 * 用於 Session 管理和快取
 *
 * 注意：Redis 在開發環境中是可選的。
 * 如果 Redis 不可用，速率限制等功能會降級運作。
 */

import { Redis } from "@upstash/redis";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// 檢查 Redis 配置
const isRedisConfigured = !!(REDIS_URL && REDIS_TOKEN);

// 開發環境中警告而非拋出錯誤
if (!isRedisConfigured) {
    if (process.env.NODE_ENV === "production") {
        throw new Error(
            "Missing Redis configuration. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables."
        );
    } else {
        console.warn(
            "⚠️ Redis not configured. Rate limiting and session caching will be disabled.\n" +
            "   Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env to enable."
        );
    }
}

// 創建 Redis 實例（如果配置存在）
export const redis = isRedisConfigured
    ? new Redis({ url: REDIS_URL!, token: REDIS_TOKEN! })
    : null as unknown as Redis;  // 類型欺騙，實際使用時會在 auth.ts 中處理 null

// 標記 Redis 是否可用（供其他模組檢查）
export const isRedisAvailable = isRedisConfigured;

export const SESSION_PREFIX = "session:";
export const SESSION_TTL = 30 * 24 * 60 * 60; // 30 天

function sessionKey(sessionId: string): string {
    return `${SESSION_PREFIX}${sessionId}`;
}

function parseJson<T>(data: unknown): T | null {
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : (data as T);
}

export async function setSession(sessionId: string, data: object): Promise<void> {
    await redis.set(sessionKey(sessionId), JSON.stringify(data), { ex: SESSION_TTL });
}

export async function getSession<T = object>(sessionId: string): Promise<T | null> {
    const data = await redis.get<string>(sessionKey(sessionId));
    return parseJson<T>(data);
}

export async function deleteSession(sessionId: string): Promise<void> {
    await redis.del(sessionKey(sessionId));
}

export async function refreshSession(sessionId: string): Promise<void> {
    await redis.expire(sessionKey(sessionId), SESSION_TTL);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
    const data = await redis.get<string>(key);
    return parseJson<T>(data);
}

export async function cacheSet(key: string, data: object, ttlSeconds = 3600): Promise<void> {
    await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
}

export async function cacheDelete(key: string): Promise<void> {
    await redis.del(key);
}

export async function rateLimit(
    key: string,
    limit: number,
    windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
    const current = await redis.incr(key);

    if (current === 1) {
        await redis.expire(key, windowSeconds);
    }

    return {
        allowed: current <= limit,
        remaining: Math.max(0, limit - current),
    };
}
