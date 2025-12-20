import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

// 金融敏感頁面強制動態渲染，確保數據即時性
// 參考企業架構規範：不使用 ISR 於餘額等敏感數據
export const dynamic = "force-dynamic";
export const revalidate = 0;


// 取得統計資料（這會在構建時和每 60 秒後更新）
async function getPublicStats() {
    const [totalReports, totalPaid, recentActivity] = await Promise.all([
        prisma.expenseReport.count(),
        prisma.expenseReport.count({
            where: { status: "PAID" },
        }),
        prisma.expenseReport.count({
            where: {
                createdAt: {
                    gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 過去 7 天
                },
            },
        }),
    ]);

    return { totalReports, totalPaid, recentActivity };
}

export default async function StatsPage() {
    const session = await auth();

    if (!session?.user) {
        redirect("/login");
    }

    // 只有 Admin 和 Finance 可以看這個頁面
    if (session.user.role !== "ADMIN" && session.user.role !== "FINANCE") {
        redirect("/dashboard");
    }

    const stats = await getPublicStats();

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">系統統計</h1>
                <p className="text-muted-foreground">
                    使用 ISR 快取，每 60 秒更新一次
                </p>
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

            <div className="text-xs text-muted-foreground">
                * 資料每 60 秒自動更新（ISR）
            </div>
        </div>
    );
}
