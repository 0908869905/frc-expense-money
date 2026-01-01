/**
 * Upstash Redis ?çÁΩÆ
 * ?®Êñº Session ÁÆ°Á??åÂø´??
 */

import { Redis } from "@upstash/redis";

// Âª∫Á? Redis ÂÆ¢Êà∂Á´?
export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Session ?∏È?Â∏∏Êï∏
export const SESSION_PREFIX = "session:";
export const SESSION_TTL = 30 * 24 * 60 * 60; // 30 Â§©Ô?ÁßíÔ?

/**
 * ?≤Â? Session
 */
export async function setSession(sessionId: string, data: object): Promise<void> {
    await redis.set(
        `${SESSION_PREFIX}${sessionId}`,
        JSON.stringify(data),
        { ex: SESSION_TTL }
    );
}

/**
 * ?ñÂ? Session
 */
export async function getSession<T = object>(sessionId: string): Promise<T | null> {
    const data = await redis.get<string>(`${SESSION_PREFIX}${sessionId}`);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data as T;
}

/**
 * ?™Èô§ Session
 */
export async function deleteSession(sessionId: string): Promise<void> {
    await redis.del(`${SESSION_PREFIX}${sessionId}`);
}

/**
 * Âª∂Èï∑ Session ?âÊ???
 */
export async function refreshSession(sessionId: string): Promise<void> {
    await redis.expire(`${SESSION_PREFIX}${sessionId}`, SESSION_TTL);
}

/**
 * ?öÁî®Âø´Â??ΩÊï∏
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

