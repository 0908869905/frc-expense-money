import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

const DEMO_USERS = [
    { email: "admin@demo.com", name: "Admin User", role: "ADMIN" as const },
    { email: "manager@demo.com", name: "Manager User", role: "LEADER" as const },
    { email: "finance@demo.com", name: "Finance User", role: "FINANCE" as const },
    { email: "user@demo.com", name: "Regular User", role: "USER" as const },
]

function isPrismaTableError(error: unknown): boolean {
    if (error instanceof Error) {
        return error.message.includes("does not exist")
    }
    return (error as { code?: string })?.code === "P2021"
}

function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error)
}

/**
 * Seed 端點 - 僅供開發環境使用
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
        return NextResponse.json({ error: "Unauthorized - ADMIN role required" }, { status: 401 })
    }

    try {
        const results = await Promise.all(
            DEMO_USERS.map(async (userData) => {
                try {
                    const user = await prisma.user.upsert({
                        where: { email: userData.email },
                        update: { name: userData.name, role: userData.role },
                        create: userData,
                    })
                    return { email: user.email, role: user.role, status: "created/updated" }
                } catch (userError: unknown) {
                    return { email: userData.email, status: "failed", error: getErrorMessage(userError) }
                }
            })
        )

        return NextResponse.json({
            success: true,
            message: "Demo users seeded!",
            users: results,
            loginInfo: {
                note: "Use any of these emails to login (password can be anything)",
                accounts: [
                    "admin@demo.com (Admin)",
                    "manager@demo.com (Leader)",
                    "finance@demo.com (Finance)",
                    "user@demo.com (User)",
                ],
            },
        })
    } catch (error: unknown) {
        console.error("Seed error:", error)

        if (isPrismaTableError(error)) {
            return NextResponse.json({
                success: false,
                error: "Database tables do not exist",
                solution: "You need to run: npx prisma db push",
                details: getErrorMessage(error),
                hint: "Go to Supabase SQL Editor and run the schema manually, or use Prisma CLI locally with your DATABASE_URL",
            }, { status: 500 })
        }

        return NextResponse.json({
            success: false,
            error: "Failed to seed database",
            details: getErrorMessage(error),
            code: (error as { code?: string })?.code,
        }, { status: 500 })
    }
}
