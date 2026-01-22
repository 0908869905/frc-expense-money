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
    return {
        total: reports.length,
        pending: reports.filter(r => r.status.includes("PENDING")).length,
        approved: reports.filter(r => r.status === "PAID").length,
        rejected: reports.filter(r => r.status === "REJECTED").length,
        totalAmount: reports.reduce((sum, r) => sum + Number(r.totalAmount), 0)
    }
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
