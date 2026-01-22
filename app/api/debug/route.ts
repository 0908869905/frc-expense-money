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

    try {
        const [userCount, users] = await Promise.all([
            prisma.user.count(),
            prisma.user.findMany({
                take: 5,
                select: { id: true, email: true, role: true, name: true },
            }),
        ])

        return NextResponse.json({
            success: true,
            database: { connected: true, userCount, users },
            session: { hasSession: true, user: session.user },
        })
    } catch (error: unknown) {
        console.error("Debug error:", error)
        return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
    }
}
