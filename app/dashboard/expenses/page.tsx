import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ExpensesContent } from "@/components/expenses-content"

export default async function ExpensesPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const userId = session.user.id

    // Fetch user's expense reports with items
    const reports = await prisma.expenseReport.findMany({
        where: { submitterId: userId },
        include: {
            items: {
                orderBy: { date: "desc" },
                include: { audit: true }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    // Calculate totals
    const totalReports = reports.length
    const totalItems = reports.reduce((acc, r) => acc + r.items.length, 0)
    const totalAmount = reports.reduce((acc, r) => acc + Number(r.totalAmount), 0)

    return (
        <ExpensesContent
            reports={reports}
            totalReports={totalReports}
            totalItems={totalItems}
            totalAmount={totalAmount}
        />
    )
}
