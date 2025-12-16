import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome, {session.user.name || session.user.email}!
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Your role: {session.user.role || "USER"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-medium">Session Info</h3>
          <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
            {JSON.stringify(session.user, null, 2)}
          </pre>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h3 className="font-medium">Quick Actions</h3>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/dashboard/expenses/new" className="text-primary hover:underline">
              → New Expense Report
            </Link>
            <Link href="/api/debug" className="text-primary hover:underline">
              → Debug API
            </Link>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Dashboard is working! The charts and data table have been temporarily disabled for debugging.
      </p>
    </div>
  )
}