import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ApprovalsContent } from "@/components/approvals-content"

export default async function ApprovalsPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const role = session.user.role || "USER"

    // Redirect if user doesn't have permission
    if (role !== "LEADER" && role !== "FINANCE" && role !== "ADMIN") {
        redirect("/dashboard")
    }

    // Fetch pending reports based on role
    let whereClause: any = {}

    if (role === "LEADER") {
        whereClause = { status: "PENDING_MANAGER" }
    } else if (role === "FINANCE") {
        whereClause = { status: "PENDING_FINANCE" }
    } else if (role === "ADMIN") {
        whereClause = {
            OR: [
                { status: "PENDING_MANAGER" },
                { status: "PENDING_FINANCE" }
            ]
        }
    }

    const reports = await prisma.expenseReport.findMany({
        where: whereClause,
        include: {
            submitter: {
                select: { name: true, email: true }
            },
            items: true
        },
        orderBy: { createdAt: "desc" }
    })

    return (
        <ApprovalsContent
            reports={reports}
            userRole={role}
        />
    )
}
