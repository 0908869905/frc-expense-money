import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function ExpensesPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const userId = session.user.id

    // Fetch user's expense reports with items
    const reports = await prisma.expenseReport.findMany({
        where: { submitterId: userId },
        include: {
            items: {
                orderBy: { date: "desc" }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    // Calculate totals
    const totalReports = reports.length
    const totalItems = reports.reduce((acc, r) => acc + r.items.length, 0)
    const totalAmount = reports.reduce((acc, r) => acc + Number(r.totalAmount), 0)

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">我的花費</h1>
                    <p className="text-muted-foreground">
                        查看和管理你的所有報帳單
                    </p>
                </div>
                <Link
                    href="/dashboard/expenses/new"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    + 新增報帳單
                </Link>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">報帳單數量</h3>
                    <p className="text-2xl font-bold">{totalReports}</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">花費項目數</h3>
                    <p className="text-2xl font-bold">{totalItems}</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">總金額</h3>
                    <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
                </div>
            </div>

            {/* Reports List */}
            <div className="space-y-6">
                {reports.length === 0 ? (
                    <div className="rounded-xl border bg-card p-8 text-center">
                        <p className="text-muted-foreground mb-4">你還沒有任何報帳單</p>
                        <Link
                            href="/dashboard/expenses/new"
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            建立第一筆報帳單
                        </Link>
                    </div>
                ) : (
                    reports.map((report) => (
                        <div key={report.id} className="rounded-xl border bg-card overflow-hidden">
                            {/* Report Header */}
                            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{report.title}</h3>
                                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                        <span>建立於: {new Date(report.createdAt).toLocaleDateString('zh-TW')}</span>
                                        <span>•</span>
                                        <span className={`font-medium ${report.status === 'PAID' ? 'text-green-600' :
                                                report.status === 'REJECTED' ? 'text-red-600' :
                                                    'text-yellow-600'
                                            }`}>
                                            {report.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">${Number(report.totalAmount).toFixed(2)}</p>
                                    <p className="text-sm text-muted-foreground">{report.items.length} 筆花費</p>
                                </div>
                            </div>

                            {/* Expense Items */}
                            {report.items.length > 0 && (
                                <div className="divide-y">
                                    {report.items.map((item) => (
                                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/20">
                                            <div className="flex-1">
                                                <p className="font-medium">{item.description}</p>
                                                <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                                                    <span className="px-2 py-0.5 bg-muted rounded-full text-xs">
                                                        {item.category}
                                                    </span>
                                                    <span>{new Date(item.date).toLocaleDateString('zh-TW')}</span>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-lg">${Number(item.amount).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
