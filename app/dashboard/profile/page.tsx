import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileContent } from "@/components/profile-content"

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Fetch user details from database
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            _count: {
                select: {
                    expenseReports: true,
                }
            }
        }
    })

    // Calculate user stats
    const stats = await prisma.expenseReport.aggregate({
        where: { submitterId: session.user.id },
        _sum: { totalAmount: true },
        _count: true
    })

    return (
        <ProfileContent
            user={user}
            stats={stats}
            session={session}
        />
    )
}
