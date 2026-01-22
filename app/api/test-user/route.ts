import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signIn } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
    // 僅在開發環境啟用
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Test endpoint is disabled in production' },
            { status: 404 }
        )
    }

    const url = new URL(request.url)
    const email = url.searchParams.get('email') || 'user@demo.com'

    try {
        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, name: true, role: true }
        })

        if (!user) {
            return NextResponse.json({
                success: false,
                error: `User ${email} not found`
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            message: 'User found! Login via /login page',
            user: user,
            loginUrl: '/login',
            instructions: [
                'Go to /login',
                `Enter email: ${email}`,
                'Enter any password',
                'Click Sign In'
            ]
        })
    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 })
    }
}
