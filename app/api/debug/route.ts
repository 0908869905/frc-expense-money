import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function GET() {
    try {
        // Test 1: Database connection
        const userCount = await prisma.user.count()

        // Test 2: Auth session
        const session = await auth()

        // Test 3: Fetch a user
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
            session: session ? {
                hasSession: true,
                user: session.user
            } : {
                hasSession: false
            }
        })
    } catch (error: any) {
        console.error('Debug error:', error)
        return NextResponse.json({
            success: false,
            error: error.message,
            stack: error.stack?.split('\n').slice(0, 5)
        }, { status: 500 })
    }
}
