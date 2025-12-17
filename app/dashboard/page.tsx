import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { DashboardContent } from "@/components/dashboard-content"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const userId = session.user.id
  const role = session.user.role || "USER"
  const userName = session.user.name || session.user.email || "User"

  // Build where clause based on role
  let whereClause: any = {}

  if (role === "USER") {
    whereClause = { submitterId: userId }
  } else if (role === "MANAGER") {
    whereClause = {
      OR: [
        { submitterId: userId },
        { status: "PENDING_MANAGER" }
      ]
    }
  } else if (role === "FINANCE") {
    whereClause = {
      OR: [
        { submitterId: userId },
        { status: "PENDING_FINANCE" },
        { status: "PAID" }
      ]
    }
  } else if (role === "ADMIN") {
    whereClause = {}
  }

  // Fetch data
  let reports: any[] = []
  let totalAmount = 0

  try {
    reports = await prisma.expenseReport.findMany({
      where: whereClause,
      include: {
        submitter: {
          select: { name: true, email: true },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    })
    totalAmount = reports.reduce((acc, r) => acc + Number(r.totalAmount), 0)
  } catch (error) {
    console.error("Error fetching reports:", error)
  }

  return (
    <DashboardContent
      userName={userName}
      role={role}
      reports={reports}
      totalAmount={totalAmount}
    />
  )
}