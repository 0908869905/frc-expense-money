import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

function validateCronAuth(request: Request): NextResponse | null {
    const authHeader = request.headers.get("Authorization")
    const expectedKey = process.env.CRON_SECRET_KEY

    if (!expectedKey) {
        console.error("CRON_SECRET_KEY is not configured")
        return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }

    if (authHeader !== `Bearer ${expectedKey}`) {
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
