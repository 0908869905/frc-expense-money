import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const revalidate = 0

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

interface Stats {
    totalReports: number
    totalPaid: number
    recentActivity: number
}

async function getStats(): Promise<Stats> {
    const [totalReports, totalPaid, recentActivity] = await Promise.all([
        prisma.expenseReport.count(),
        prisma.expenseReport.count({
            where: { status: "PAID" },
        }),
        prisma.expenseReport.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - SEVEN_DAYS_MS),
                },
            },
        }),
    ])

    return { totalReports, totalPaid, recentActivity }
}

export default async function StatsPage(): Promise<React.JSX.Element> {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "FINANCE") {
        redirect("/dashboard")
    }

    const stats = await getStats()

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">系統統計</h1>
                <p className="text-muted-foreground">即時數據</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-6">
                    <div className="text-sm text-muted-foreground">總報帳單</div>
                    <div className="text-3xl font-bold mt-2">{stats.totalReports}</div>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <div className="text-sm text-muted-foreground">已完成付款</div>
                    <div className="text-3xl font-bold mt-2 text-green-600">{stats.totalPaid}</div>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <div className="text-sm text-muted-foreground">近 7 天活動</div>
                    <div className="text-3xl font-bold mt-2 text-blue-600">{stats.recentActivity}</div>
                </div>
            </div>
        </div>
    )
}
