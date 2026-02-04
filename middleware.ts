import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

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

// 全局速率限制配置（使用簡易 IP 追蹤）
// 注意：生產環境中，IP 可能經過 proxy，需要檢查 X-Forwarded-For
const GLOBAL_RATE_LIMIT = 100 // 每分鐘最多 100 次請求
const RATE_LIMIT_WINDOW_MS = 60 * 1000 // 1 分鐘

// 簡易內存速率限制（僅適用於單實例部署）
// 生產環境建議使用 Redis
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>()

function getClientIp(request: NextRequest): string {
    // 優先檢查 X-Forwarded-For（通過 proxy 時）
    const forwarded = request.headers.get("x-forwarded-for")
    if (forwarded) {
        return forwarded.split(",")[0].trim()
    }
    // 備用：使用 X-Real-IP
    const realIp = request.headers.get("x-real-ip")
    if (realIp) {
        return realIp
    }
    // 預設
    return "unknown"
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
    const now = Date.now()
    const record = ipRequestCounts.get(ip)

    if (!record || now > record.resetTime) {
        // 新的時間窗口
        ipRequestCounts.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS })
        return { allowed: true, remaining: GLOBAL_RATE_LIMIT - 1 }
    }

    record.count++

    if (record.count > GLOBAL_RATE_LIMIT) {
        return { allowed: false, remaining: 0 }
    }

    return { allowed: true, remaining: GLOBAL_RATE_LIMIT - record.count }
}

// 定期清理過期的 IP 記錄（防止內存洩漏）
setInterval(() => {
    const now = Date.now()
    ipRequestCounts.forEach((record, ip) => {
        if (now > record.resetTime) {
            ipRequestCounts.delete(ip)
        }
    })
}, 60 * 1000) // 每分鐘清理一次

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // 跳過靜態資源（仍套用安全標頭）
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.includes(".")
    ) {
        return applySecurityHeaders(NextResponse.next())
    }

    // 全局速率限制
    const ip = getClientIp(request)
    const rateLimit = checkRateLimit(ip)

    if (!rateLimit.allowed) {
        return new NextResponse("Too Many Requests", {
            status: 429,
            headers: {
                "Retry-After": "60",
                "X-RateLimit-Limit": GLOBAL_RATE_LIMIT.toString(),
                "X-RateLimit-Remaining": "0",
            },
        })
    }

    // 添加安全標頭 + 速率限制資訊
    const response = applySecurityHeaders(NextResponse.next())
    response.headers.set("X-RateLimit-Limit", GLOBAL_RATE_LIMIT.toString())
    response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString())

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
