import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

/**
 * Test User 端點 - 僅供開發環境使用
 * 安全檢查：
 * 1. 必須是非生產環境
 * 2. 必須明確啟用 ENABLE_DEBUG_ENDPOINTS=true
 * 3. 必須是已認證的 ADMIN 用戶
 */
export async function GET(request: Request): Promise<NextResponse> {
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
        return NextResponse.json({ error: "Unauthorized - ADMIN role required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email") ?? "user@demo.com"

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, role: true },
        })

        if (!user) {
            return NextResponse.json({ success: false, error: `User ${email} not found` }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: "User found! Login via /login page",
            user,
            loginUrl: "/login",
            instructions: [
                "Go to /login",
                `Enter email: ${email}`,
                "Enter any password",
                "Click Sign In",
            ],
        })
    } catch (error: unknown) {
        console.error("Test-user endpoint error:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
