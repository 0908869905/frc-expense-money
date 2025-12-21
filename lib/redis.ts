/**
 * Upstash Redis 配置
 * 用於 Session 管理和快取
 */

import { Redis } from "@upstash/redis";

// 建立 Redis 客戶端
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Session 相關常數
export const SESSION_PREFIX = "session:";
export const SESSION_TTL = 30 * 24 * 60 * 60; // 30 天（秒）

/**
 * 儲存 Session
 */
export async function setSession(sessionId: string, data: object): Promise<void> {
    await redis.set(
        `${SESSION_PREFIX}${sessionId}`,
        JSON.stringify(data),
        { ex: SESSION_TTL }
    );
}

/**
 * 取得 Session
 */
export async function getSession<T = object>(sessionId: string): Promise<T | null> {
    const data = await redis.get<string>(`${SESSION_PREFIX}${sessionId}`);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data as T;
}

/**
 * 刪除 Session
 */
export async function deleteSession(sessionId: string): Promise<void> {
    await redis.del(`${SESSION_PREFIX}${sessionId}`);
}

/**
 * 延長 Session 有效期
 */
export async function refreshSession(sessionId: string): Promise<void> {
    await redis.expire(`${SESSION_PREFIX}${sessionId}`, SESSION_TTL);
}

/**
 * 通用快取函數
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
    const data = await redis.get<string>(key);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data as T;
}

export async function cacheSet(key: string, data: object, ttlSeconds: number = 3600): Promise<void> {
    await redis.set(key, JSON.stringify(data), { ex: ttlSeconds });
}

export async function cacheDelete(key: string): Promise<void> {
    await redis.del(key);
}

/**
 * Rate Limiting
 */
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
