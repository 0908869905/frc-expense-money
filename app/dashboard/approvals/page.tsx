import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { ApprovalsContent } from "@/components/approvals-content"

function getWhereClauseByRole(role: string): Prisma.ExpenseReportWhereInput {
    switch (role) {
        case "LEADER":
            return { status: "PENDING_MANAGER" }
        case "FINANCE":
            return { status: "PENDING_FINANCE" }
        case "ADMIN":
            return {
                OR: [
                    { status: "PENDING_MANAGER" },
                    { status: "PENDING_FINANCE" }
                ]
            }
        default:
            return {}
    }
}

export default async function ApprovalsPage(): Promise<React.JSX.Element> {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const role = session.user.role || "USER"

    if (!["LEADER", "FINANCE", "ADMIN"].includes(role)) {
        redirect("/dashboard")
    }

    const whereClause = getWhereClauseByRole(role)

    const reports = await prisma.expenseReport.findMany({
        where: whereClause,
        include: {
            submitter: {
                select: { name: true, email: true }
            },
            items: true,
            bankAccount: true  // 包含收款帳戶資訊
        },
        orderBy: { createdAt: "desc" }
    })

    // FINANCE 和 ADMIN 可以查看完整帳號
    const canViewFullBankAccount = role === "FINANCE" || role === "ADMIN"

    return (
        <ApprovalsContent
            reports={reports}
            userRole={role}
            canViewFullBankAccount={canViewFullBankAccount}
        />
    )
}
