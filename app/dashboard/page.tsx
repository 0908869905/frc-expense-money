import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import dynamic from "next/dynamic"

// Dynamic imports with ssr: false to avoid server-side rendering issues
const DashboardCharts = dynamic(
  () => import("@/components/Dashboard").then(mod => mod.Dashboard),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground border rounded-xl">
        Loading charts...
      </div>
    )
  }
)

const DashboardTable = dynamic(
  () => import("./dashboard-table").then(mod => mod.DashboardTable),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] flex items-center justify-center text-muted-foreground">
        Loading table...
      </div>
    )
  }
)

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const userId = session.user.id
  const role = session.user.role || "USER"

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

  // Fetch data with error handling
  let tableData: any[] = []
  let transactions: any[] = []

  try {
    const reports = await prisma.expenseReport.findMany({
      where: whereClause,
      include: {
        submitter: {
          select: { name: true, email: true },
        },
        items: true,
      },
      orderBy: { createdAt: "desc" },
    })

    tableData = reports.map(r => ({
      id: r.id,
      title: r.title,
      totalAmount: r.totalAmount,
      status: r.status,
      createdAt: r.createdAt,
      submitter: r.submitter
    }))

    reports.forEach(report => {
      report.items.forEach((item: any) => {
        transactions.push({
          id: item.id,
          date: item.date,
          amount: item.amount,
          category: item.category,
          description: item.description,
          type: 'EXPENSE'
        })
      })
    })
  } catch (error) {
    console.error("Error fetching reports:", error)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {session.user.name || session.user.email}! ({role})
          </p>
        </div>
        <Link
          href="/dashboard/expenses/new"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New Report
        </Link>
      </div>

      {/* Analytics Section */}
      <DashboardCharts transactions={transactions} />

      {/* Data Table Section */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium leading-6">Recent Reports</h3>
            <p className="text-sm text-muted-foreground">
              {tableData.length > 0
                ? `You have ${tableData.length} expense report(s).`
                : "No expense reports yet. Create your first one!"}
            </p>
          </div>
          {tableData.length > 0 && (
            <DashboardTable data={tableData} userRole={role} />
          )}
        </div>
      </div>
    </div>
  )
}