import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

export async function GET(request: Request): Promise<NextResponse> {
    if (process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Test endpoint is disabled in production" }, { status: 404 })
    }

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
