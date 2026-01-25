import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function isValidCronKey(providedKey: string, expectedKey: string): boolean {
    // 使用固定長度 buffer 進行 timing-safe 比較，避免長度洩漏
    const FIXED_LENGTH = 256
    const expectedBuffer = Buffer.alloc(FIXED_LENGTH)
    const providedBuffer = Buffer.alloc(FIXED_LENGTH)

    Buffer.from(expectedKey, "utf8").copy(expectedBuffer)
    Buffer.from(providedKey, "utf8").copy(providedBuffer)

    // 同時比較長度和內容，避免時序攻擊
    const lengthMatch = expectedKey.length === providedKey.length
    const contentMatch = crypto.timingSafeEqual(expectedBuffer, providedBuffer)

    return lengthMatch && contentMatch
}

function validateCronAuth(request: Request): NextResponse | null {
    const expectedKey = process.env.CRON_SECRET_KEY
    if (!expectedKey) {
        console.error("CRON_SECRET_KEY is not configured")
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }

    const authHeader = request.headers.get("Authorization")
    const providedKey = authHeader?.replace(/^Bearer\s+/, "") ?? ""

    if (!isValidCronKey(providedKey, expectedKey)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return null
}

export async function GET(request: Request): Promise<NextResponse> {
    const authError = validateCronAuth(request)
    if (authError) return authError

    try {
        const now = new Date()
        const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS)

        const deletedSessions = await prisma.session.deleteMany({
            where: { expires: { lt: thirtyDaysAgo } },
        })

        await prisma.auditLog.create({
            data: {
                entityType: "System",
                entityId: "cleanup",
                action: "SESSION_CLEANUP",
                actorId: "system",
                newData: {
                    deletedSessions: deletedSessions.count,
                    executedAt: now.toISOString(),
                },
            },
        })

        return NextResponse.json({
            success: true,
            message: "Session cleanup completed",
            deletedSessions: deletedSessions.count,
            executedAt: now.toISOString(),
        })
    } catch (error) {
        console.error("Session cleanup failed:", error)
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
    }
}

export const POST = GET
