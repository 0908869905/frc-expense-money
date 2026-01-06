import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Seeding database...')

    // Create demo users
    const users = [
        {
            email: 'admin@demo.com',
            name: 'Admin User',
            role: 'ADMIN' as const,
        },
        {
            email: 'leader@demo.com',
            name: 'Leader User',
            role: 'LEADER' as const,
        },
        {
            email: 'finance@demo.com',
            name: 'Finance User',
            role: 'FINANCE' as const,
        },
        {
            email: 'user@demo.com',
            name: 'Regular User',
            role: 'USER' as const,
        },
    ]

    for (const userData of users) {
        const user = await prisma.user.upsert({
            where: { email: userData.email },
            update: { name: userData.name, role: userData.role },
            create: userData,
        })
        console.log(`✅ Created/Updated user: ${user.email} (${user.role})`)
    }

    console.log('🎉 Seeding complete!')
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
