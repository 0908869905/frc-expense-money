import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

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
  let reports: any[] = []
  let errorMessage = ""

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
  } catch (error: any) {
    console.error("Error fetching reports:", error)
    errorMessage = error.message || "Failed to fetch reports"
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

      {errorMessage && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
          Error: {errorMessage}
        </div>
      )}

      {/* Simple Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Reports</h3>
          <p className="text-2xl font-bold">{reports.length}</p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Items</h3>
          <p className="text-2xl font-bold">
            {reports.reduce((acc, r) => acc + (r.items?.length || 0), 0)}
          </p>
        </div>
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-medium text-muted-foreground">Total Amount</h3>
          <p className="text-2xl font-bold">
            ${reports.reduce((acc, r) => acc + (Number(r.totalAmount) || 0), 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Simple Reports List */}
      <div className="rounded-xl border bg-card">
        <div className="p-6">
          <h3 className="text-lg font-medium mb-4">Recent Reports</h3>
          {reports.length === 0 ? (
            <p className="text-muted-foreground">No expense reports yet. Create your first one!</p>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{report.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {report.submitter?.name || report.submitter?.email} • {report.status}
                    </p>
                  </div>
                  <p className="font-medium">${Number(report.totalAmount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}