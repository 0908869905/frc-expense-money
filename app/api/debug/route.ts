import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not available in production" }, { status: 404 })
    }

    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 遮罩 email 函式：a]test@example.com → a***@example.com
    const maskEmail = (email: string): string => {
        const [local, domain] = email.split("@")
        if (!domain) return "***"
        const maskedLocal = local.length > 1 ? local[0] + "***" : "***"
        return `${maskedLocal}@${domain}`
    }

    try {
        const [userCount, users] = await Promise.all([
            prisma.user.count(),
            prisma.user.findMany({
                take: 5,
                select: { id: true, email: true, role: true, name: true },
            }),
        ])

        // 遮罩敏感資訊
        const maskedUsers = users.map((u) => ({
            ...u,
            email: u.email ? maskEmail(u.email) : null,
        }))

        return NextResponse.json({
            success: true,
            database: { connected: true, userCount, users: maskedUsers },
            session: { hasSession: true, user: { ...session.user, email: session.user.email ? maskEmail(session.user.email) : null } },
        })
    } catch (error: unknown) {
        console.error("Debug error:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
