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
            },
            bankAccount: true
        },
        orderBy: { createdAt: "desc" }
    })

    return (
        <ExpensesContent reports={reports} />
    )
}
