import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ReportsContent } from "@/components/reports-content"

export default async function ReportsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const role = session.user.role || "USER"

    // Redirect if user doesn't have permission
    if (role !== "FINANCE" && role !== "ADMIN") {
        redirect("/dashboard")
    }

    // Fetch all reports
    const reports = await prisma.expenseReport.findMany({
        include: {
            submitter: {
                select: { name: true, email: true }
            },
            items: true
        },
        orderBy: { createdAt: "desc" }
    })

    // Calculate stats
    const stats = {
        total: reports.length,
        pending: reports.filter(r => r.status.includes("PENDING")).length,
        approved: reports.filter(r => r.status === "PAID").length,
        rejected: reports.filter(r => r.status === "REJECTED").length,
        totalAmount: reports.reduce((acc, r) => acc + Number(r.totalAmount), 0)
    }

    return (
        <ReportsContent
            reports={reports}
            stats={stats}
        />
    )
}
