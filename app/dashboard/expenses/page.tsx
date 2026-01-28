import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ExpensesContent } from "@/components/expenses-content"
import { getBankAccounts } from "@/app/actions/bank-accounts"

export default async function ExpensesPage(): Promise<React.JSX.Element> {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // 並行取得報帳單和收款帳戶
    const [reports, bankAccounts] = await Promise.all([
        prisma.expenseReport.findMany({
            where: { submitterId: session.user.id },
            include: {
                items: {
                    orderBy: { date: "desc" },
                    include: { audit: true }
                },
                bankAccount: true  // 包含收款帳戶資訊
            },
            orderBy: { createdAt: "desc" }
        }),
        getBankAccounts()
    ])

    const totalReports = reports.length
    const totalItems = reports.reduce((sum, report) => sum + report.items.length, 0)
    const totalAmount = reports.reduce((sum, report) => sum + Number(report.totalAmount), 0)

    return (
        <ExpensesContent
            reports={reports}
            totalReports={totalReports}
            totalItems={totalItems}
            totalAmount={totalAmount}
            bankAccounts={bankAccounts}
        />
    )
}
