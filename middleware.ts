import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { redis, isRedisAvailable, rateLimit } from "@/lib/redis"

// 安全標頭（與 next.config.mjs 同步，確保 middleware 回應也帶上）
const isProduction = process.env.NODE_ENV === "production"
const scriptSrc = isProduction
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'"

const cspValue = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://*.upstash.io https://*.sentry.io https://*.googleapis.com wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    ...(isProduction ? ["upgrade-insecure-requests"] : []),
].join("; ")

const SECURITY_HEADERS: Record<string, string> = {
    "Content-Security-Policy": cspValue,
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-XSS-Protection": "1; mode=block",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Permissions-Policy": "camera=(self), microphone=(), geolocation=()",
}

function applySecurityHeaders(response: NextResponse): NextResponse {
    for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
        response.headers.set(key, value)
    }
    return response
}

// 全局速率限制配置
const GLOBAL_RATE_LIMIT = 100 // 每分鐘最多 100 次請求
const RATE_LIMIT_WINDOW_SECONDS = 60 // 1 分鐘

// 開發環境 fallback：in-memory（Redis 不可用時）
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>()

function getClientIp(request: NextRequest): string {
    const forwarded = request.headers.get("x-forwarded-for")
    if (forwarded) {
        return forwarded.split(",")[0].trim()
    }
    const realIp = request.headers.get("x-real-ip")
    if (realIp) {
        return realIp
    }
    return "unknown"
}

function fallbackRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const record = ipRequestCounts.get(ip)

    if (!record || now > record.resetTime) {
        ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_SECONDS * 1000 })
        return { allowed: true, remaining: GLOBAL_RATE_LIMIT - 1 }
    }

    record.count++
    if (record.count > GLOBAL_RATE_LIMIT) {
        return { allowed: false, remaining: 0 }
    }
    return { allowed: true, remaining: GLOBAL_RATE_LIMIT - record.count }
}

async function checkRateLimit(ip: string): Promise<{ allowed: boolean; remaining: number }> {
    if (isRedisAvailable) {
        try {
            return await rateLimit(`middleware:${ip}`, GLOBAL_RATE_LIMIT, RATE_LIMIT_WINDOW_SECONDS)
        } catch {
            // Redis 故障時降級到 in-memory
            return fallbackRateLimit(ip)
        }
    }
    return fallbackRateLimit(ip)
}

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 跳過靜態資源（仍套用安全標頭）
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return applySecurityHeaders(NextResponse.next())
    }

    // 全局速率限制（Upstash Redis，跨 instance 共享）
    const ip = getClientIp(request)
    const rateLimitResult = await checkRateLimit(ip)

    if (!rateLimitResult.allowed) {
        return new NextResponse("Too Many Requests", {
            status: 429,
            headers: {
                "Retry-After": RATE_LIMIT_WINDOW_SECONDS.toString(),
                "X-RateLimit-Limit": GLOBAL_RATE_LIMIT.toString(),
                "X-RateLimit-Remaining": "0",
            },
        })
    }

    // 添加安全標頭 + 速率限制資訊
    const response = applySecurityHeaders(NextResponse.next())
    response.headers.set("X-RateLimit-Limit", GLOBAL_RATE_LIMIT.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimitResult.remaining.toString())

    return response
}

export const config = {
    matcher: [
        /*
         * 匹配所有路徑，除了：
         * - _next/static（靜態檔案）
         * - _next/image（圖片優化）
         * - favicon.ico（網站圖示）
         */
        "/((?!_next/static|_next/image|favicon.ico).*)",
    ],
}
