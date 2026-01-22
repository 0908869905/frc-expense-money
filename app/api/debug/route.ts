import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
    // 僅在開發環境啟用
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Not available in production' },
            { status: 404 }
        )
    }

    // 需要 ADMIN 權限
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        )
    }

    try {
        // Test 1: Database connection
        const userCount = await prisma.user.count()

        // Test 2: Fetch users (僅限開發環境的 ADMIN)
        const users = await prisma.user.findMany({
            take: 5,
            select: { id: true, email: true, role: true, name: true }
        })

        return NextResponse.json({
            success: true,
            database: {
                connected: true,
                userCount,
                users
            },
            session: {
                hasSession: true,
                user: session.user
            }
        })
    } catch (error: any) {
        console.error('Debug error:', error)
        // 不暴露錯誤堆疊
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 })
    }
}
