import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Demo users to seed
const DEMO_USERS = [
    { email: 'admin@demo.com', name: 'Admin User', role: 'ADMIN' as const },
    { email: 'manager@demo.com', name: 'Manager User', role: 'MANAGER' as const },
    { email: 'finance@demo.com', name: 'Finance User', role: 'FINANCE' as const },
    { email: 'user@demo.com', name: 'Regular User', role: 'USER' as const },
]

export async function GET() {
    try {
        const results = []

        for (const userData of DEMO_USERS) {
            const user = await prisma.user.upsert({
                where: { email: userData.email },
                update: { name: userData.name, role: userData.role },
                create: userData,
            })
            results.push({ email: user.email, role: user.role, status: 'created/updated' })
        }

        return NextResponse.json({
            success: true,
            message: 'Demo users seeded successfully!',
            users: results,
            loginInfo: {
                note: 'Use any of these emails to login (password field is ignored in demo mode)',
                accounts: [
                    'admin@demo.com (Admin)',
                    'manager@demo.com (Manager)',
                    'finance@demo.com (Finance)',
                    'user@demo.com (User)',
                ]
            }
        })
    } catch (error) {
        console.error('Seed error:', error)
        return NextResponse.json(
            { success: false, error: 'Failed to seed database', details: String(error) },
            { status: 500 }
        )
    }
}
