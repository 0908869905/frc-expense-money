import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ReportsContent } from "@/components/reports-content"

interface ReportStats {
    total: number
    pending: number
    approved: number
    rejected: number
    totalAmount: number
}

function calculateStats(reports: { status: string; totalAmount: unknown }[]): ReportStats {
    const stats = { pending: 0, approved: 0, rejected: 0, totalAmount: 0 }

    for (const report of reports) {
        if (report.status.includes("PENDING")) stats.pending++
        else if (report.status === "PAID") stats.approved++
        else if (report.status === "REJECTED") stats.rejected++
        stats.totalAmount += Number(report.totalAmount)
    }

    return { total: reports.length, ...stats }
}

export default async function ReportsPage(): Promise<React.JSX.Element> {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const role = session.user.role || "USER"

    if (role !== "FINANCE" && role !== "ADMIN") {
        redirect("/dashboard")
    }

    const reports = await prisma.expenseReport.findMany({
        include: {
            submitter: {
                select: { name: true, email: true }
            },
            items: true
        },
        orderBy: { createdAt: "desc" }
    })

    const stats = calculateStats(reports)

    return (
        <ReportsContent
            reports={reports}
            stats={stats}
            userRole={role}
        />
    )
}
