import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ExpensesContent } from "@/components/expenses-content"

export default async function ExpensesPage(): Promise<React.JSX.Element> {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const reports = await prisma.expenseReport.findMany({
        where: { submitterId: session.user.id },
        include: {
            items: {
                orderBy: { date: "desc" },
                include: { audit: true }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    const totalReports = reports.length
    const totalItems = reports.reduce((sum, report) => sum + report.items.length, 0)
    const totalAmount = reports.reduce((sum, report) => sum + Number(report.totalAmount), 0)

    return (
        <ExpensesContent
            reports={reports}
            totalReports={totalReports}
            totalItems={totalItems}
            totalAmount={totalAmount}
        />
    )
}
