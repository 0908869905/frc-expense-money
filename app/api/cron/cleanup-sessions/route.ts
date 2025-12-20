import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 定期清理過期 Session 的 API Route
// 建議使用 Vercel Cron 或外部服務定時呼叫

export async function GET(request: Request) {
    // 驗證 API Key（防止未授權呼叫）
    const authHeader = request.headers.get("Authorization");
    const expectedKey = process.env.CRON_SECRET_KEY;

    if (expectedKey && authHeader !== `Bearer ${expectedKey}`) {
        return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const now = new Date();

        // 清理過期的 Session（超過 30 天）
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const deletedSessions = await prisma.session.deleteMany({
            where: {
                expires: {
                    lt: thirtyDaysAgo,
                },
            },
        });

        // 清理過期的驗證 Token（如有）
        // 可根據需要添加更多清理邏輯

        // 記錄審計日誌
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
        });

        return NextResponse.json({
            success: true,
            message: "Session cleanup completed",
            deletedSessions: deletedSessions.count,
            executedAt: now.toISOString(),
        });
    } catch (error) {
        console.error("Session cleanup failed:", error);
        return NextResponse.json(
            { error: "Cleanup failed" },
            { status: 500 }
        );
    }
}

// 也支援 POST 請求（Vercel Cron 使用）
export async function POST(request: Request) {
    return GET(request);
}
