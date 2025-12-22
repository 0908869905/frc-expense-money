import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { UsersContent } from "@/components/users-content"

export default async function UsersPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Only ADMIN can access this page
    if (session.user.role !== "ADMIN") {
        redirect("/dashboard")
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            _count: {
                select: { expenseReports: true }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    return <UsersContent users={users} currentUserId={session.user.id} />
}
