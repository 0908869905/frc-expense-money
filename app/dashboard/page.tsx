import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/Button"
import { Plus } from "lucide-react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Transaction, ExpenseCategory } from "../../types"

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

  // Fetch Logic based on Role
  const role = session.user.role || "USER"
  let whereClause: any = {}

  if (role === "USER") {
    whereClause = { submitterId: session.user.id }
  } else if (role === "MANAGER") {
    whereClause = {
      OR: [
        { submitterId: session.user.id },
        { status: "PENDING_MANAGER" }
      ]
    }
  } else if (role === "FINANCE") {
    whereClause = {
      OR: [
        { submitterId: session.user.id },
        { status: "PENDING_FINANCE" },
        { status: "PAID" }
      ]
    }
  } else if (role === "ADMIN") {
    whereClause = {}
  }

  // Fetch Reports AND Items for charts
  const reports = await prisma.expenseReport.findMany({
    where: whereClause,
    include: {
      submitter: {
        select: { name: true, email: true },
      },
      items: true, // Needed for charts
    },
    orderBy: { createdAt: "desc" },
  })

  // Normalize data for the table
  const tableData = reports.map(r => ({
    id: r.id,
    title: r.title,
    totalAmount: r.totalAmount,
    status: r.status,
    createdAt: r.createdAt,
    submitter: r.submitter
  }))

  // Prepare data for Dashboard Charts (Flatten Items)
  const transactions: Transaction[] = [];
  reports.forEach(report => {
    // Only include valid/approved expenses in stats if we wanted to be strict,
    // but usually users want to see what they submitted.
    // Let's include everything for now.
    report.items.forEach(item => {
      transactions.push({
        id: item.id,
        date: item.date,
        amount: item.amount,
        category: item.category as ExpenseCategory, // Ensure enum match
        description: item.description,
        type: 'EXPENSE'
      });
    });
  });

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