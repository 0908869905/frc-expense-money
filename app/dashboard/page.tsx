import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { DashboardContent } from "@/components/dashboard-content"
import { getFinancialSummary, getFundingRecords } from "@/app/actions/funding"

function buildWhereClause(role: string, userId: string | undefined): Prisma.ExpenseReportWhereInput {
  switch (role) {
    case "ADMIN":
      return {}
    case "FINANCE":
      return {
        OR: [
          { submitterId: userId },
          { status: "PENDING_FINANCE" },
          { status: "PAID" }
        ]
      }
    case "MANAGER":
      return {
        OR: [
          { submitterId: userId },
          { status: "PENDING_MANAGER" }
        ]
      }
    default:
      return { submitterId: userId }
  }
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const userId = session.user.id
  const role = session.user.role || "USER"
  const userName = session.user.name || session.user.email || "User"

  const whereClause = buildWhereClause(role, userId)

  const [reports, financialSummary, fundingRecords] = await Promise.all([
    prisma.expenseReport.findMany({
      where: whereClause,
      include: {
        submitter: {
          select: { name: true, email: true },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    getFinancialSummary(),
    getFundingRecords()
  ])

  const totalAmount = reports.reduce((sum, report) => sum + Number(report.totalAmount), 0)
  const canAddFunding = role === "FINANCE" || role === "ADMIN"

  return (
    <DashboardContent
      userName={userName}
      role={role}
      reports={reports}
      totalAmount={totalAmount}
      financialSummary={financialSummary}
      fundingRecords={fundingRecords}
      canAddFunding={canAddFunding}
    />
  )
}