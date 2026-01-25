import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

/**
 * Debug 端點 - 僅供開發環境使用
 * 安全檢查：
 * 1. 必須是非生產環境
 * 2. 必須明確啟用 ENABLE_DEBUG_ENDPOINTS=true
 * 3. 必須是已認證的 ADMIN 用戶
 */
export async function GET(): Promise<NextResponse> {
    // 安全檢查 1：生產環境完全禁用
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // 安全檢查 2：必須明確啟用
    if (process.env.ENABLE_DEBUG_ENDPOINTS !== "true") {
        return NextResponse.json({ error: "Debug endpoints are disabled" }, { status: 403 })
    }

    // 安全檢查 3：ADMIN 認證
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 遮罩 email 函式：test@example.com → t***@example.com
    const maskEmail = (email: string): string => {
        const [local, domain] = email.split("@")
        if (!domain) return "***"
        const maskedLocal = local.length > 1 ? local[0] + "***" : "***"
        return `${maskedLocal}@${domain}`
    }

    try {
        const userCount = await prisma.user.count()

        return NextResponse.json({
            success: true,
            database: { connected: true, userCount },
            session: {
                hasSession: true,
                userRole: session.user.role,
                // 不返回任何用戶詳細資訊
            },
        })
    } catch (error: unknown) {
        console.error("Debug error:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
