import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ProfileContent } from "@/components/profile-content"

export default async function ProfilePage(): Promise<React.JSX.Element> {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const userId = session.user.id

    const [user, stats] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            include: {
                _count: {
                    select: { expenseReports: true }
                }
            }
        }),
        prisma.expenseReport.aggregate({
            where: { submitterId: userId },
            _sum: { totalAmount: true },
            _count: true
        })
    ])

    return (
        <ProfileContent
            user={user}
            stats={stats}
            session={session}
        />
    )
}
