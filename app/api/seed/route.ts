import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

// Demo users to seed
const DEMO_USERS = [
    { email: 'admin@demo.com', name: 'Admin User', role: 'ADMIN' as const },
    { email: 'manager@demo.com', name: 'Manager User', role: 'LEADER' as const },
    { email: 'finance@demo.com', name: 'Finance User', role: 'FINANCE' as const },
    { email: 'user@demo.com', name: 'Regular User', role: 'USER' as const },
]

export async function GET() {
    // 僅在開發環境啟用
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
            { error: 'Seed endpoint is disabled in production' },
            { status: 404 }
        )
    }

    // 需要 ADMIN 權限（首次設置時可能需要暫時移除此檢查）
    const session = await auth()
    if (!session?.user || session.user.role !== 'ADMIN') {
        return NextResponse.json(
            { error: 'Unauthorized - ADMIN role required' },
            { status: 401 }
        )
    }
    try {
        // First, check if we can connect to the database
        await prisma.$connect()

        const results = []

        for (const userData of DEMO_USERS) {
            try {
                const user = await prisma.user.upsert({
                    where: { email: userData.email },
                    update: { name: userData.name, role: userData.role },
                    create: {
                        email: userData.email,
                        name: userData.name,
                        role: userData.role,
                    },
                })
                results.push({ email: user.email, role: user.role, status: 'created/updated' })
            } catch (userError: any) {
                results.push({
                    email: userData.email,
                    status: 'failed',
                    error: userError.message
                })
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Demo users seeded!',
            users: results,
            loginInfo: {
                note: 'Use any of these emails to login (password can be anything)',
                accounts: [
                    'admin@demo.com (Admin)',
                    'manager@demo.com (Leader)',
                    'finance@demo.com (Finance)',
                    'user@demo.com (User)',
                ]
            }
        })
    } catch (error: any) {
        console.error('Seed error:', error)

        // Check if it's a table doesn't exist error
        if (error.message?.includes('does not exist') || error.code === 'P2021') {
            return NextResponse.json({
                success: false,
                error: 'Database tables do not exist',
                solution: 'You need to run: npx prisma db push',
                details: error.message,
                hint: 'Go to Supabase SQL Editor and run the schema manually, or use Prisma CLI locally with your DATABASE_URL'
            }, { status: 500 })
        }

        return NextResponse.json(
            {
                success: false,
                error: 'Failed to seed database',
                details: error.message,
                code: error.code
            },
            { status: 500 }
        )
    } finally {
        await prisma.$disconnect()
    }
}
