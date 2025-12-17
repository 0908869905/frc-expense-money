"use client"

import { useLanguage } from "@/lib/language-context"

interface ProfileContentProps {
    user: any
    stats: {
        _count: number
        _sum: { totalAmount: number | null }
    }
    session: any
}

export function ProfileContent({ user, stats, session }: ProfileContentProps) {
    const { t, language } = useLanguage()

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US')
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("profile")}</h1>
                <p className="text-muted-foreground">{t("account_info")}</p>
            </div>

            {/* Profile Card */}
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                            {(user?.name || user?.email || "U")[0].toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{user?.name || t("name_not_set")}</h2>
                        <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">{t("user_id")}</span>
                        <span className="font-mono text-sm">{user?.id}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">{t("role")}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                user?.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                                    user?.role === 'FINANCE' ? 'bg-green-100 text-green-700' :
                                        'bg-gray-100 text-gray-700'
                            }`}>
                            {user?.role || "USER"}
                        </span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">{t("created_at")}</span>
                        <span>{user?.createdAt ? formatDate(user.createdAt) : "N/A"}</span>
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">{t("expense_stats")}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t("total_reports")}</p>
                        <p className="text-2xl font-bold">{stats._count}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">{t("total_expense_amount")}</p>
                        <p className="text-2xl font-bold">${Number(stats._sum.totalAmount || 0).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Session Info (Debug) */}
            <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">{t("session_info")}</h3>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(session.user, null, 2)}
                </pre>
            </div>
        </div>
    )
}
