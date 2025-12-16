import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/Button"
import { Plus } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"

// Dynamic imports to avoid SSR issues with client-side hooks
const Dashboard = dynamic(() => import("@/components/Dashboard").then(mod => mod.Dashboard), {
  ssr: false,
  loading: () => <div className="h-[400px] flex items-center justify-center text-muted-foreground">Loading charts...</div>
})

const DashboardTable = dynamic(() => import("./dashboard-table").then(mod => mod.DashboardTable), {
  ssr: false,
  loading: () => <div className="h-[200px] flex items-center justify-center text-muted-foreground">Loading table...</div>
})

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  // Safe access to user properties
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

  // Fetch Reports with error handling
  let reports: any[] = []
  let tableData: any[] = []
  let transactions: any[] = []

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
    })

    // Normalize data for the table
    tableData = reports.map(r => ({
      id: r.id,
      title: r.title,
      totalAmount: r.totalAmount,
      status: r.status,
      createdAt: r.createdAt,
      submitter: r.submitter
    }))

    // Prepare data for Dashboard Charts (Flatten Items)
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
    // Continue with empty data rather than throwing
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage and track your expense reports.
          </p>
        </div>
        <Link href="/dashboard/expenses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Report
          </Button>
        </Link>
      </div>

      {/* Analytics Section */}
      <Dashboard transactions={transactions} />

      {/* Data Table Section */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium leading-6">Recent Reports</h3>
            <p className="text-sm text-muted-foreground">A list of all your submitted expense reports.</p>
          </div>
          <DashboardTable data={tableData} userRole={role} />
        </div>
      </div>
    </div>
  )
}