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
                <h1 className="text-2xl font-semibold tracking-tight">{t("profile")}</h1>
                <p className="text-sm text-muted-foreground">{t("account_info")}</p>
            </div>

            {/* Profile Card */}
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-secondary border border-border flex items-center justify-center">
                        <span className="text-2xl font-semibold text-foreground">
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
                        <span className={`px-1.5 py-0.5 rounded border font-mono text-[11px] font-medium ${user?.role === 'ADMIN' ? 'border-primary/40 bg-primary/10 text-primary' :
                                user?.role === 'FINANCE' ? 'border-ok/40 bg-ok/10 text-ok' :
                                    'border-border bg-muted text-muted-foreground'
                            }`}>
                            {user?.role || "USER"}
                        </span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">{t("created_at")}</span>
                        <span className="font-mono text-sm">{user?.createdAt ? formatDate(user.createdAt) : "N/A"}</span>
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">{t("expense_stats")}</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border border-border rounded-md">
                        <p className="ledger-label">{t("total_reports")}</p>
                        <p className="text-2xl font-semibold tech-number mt-2">{stats._count}</p>
                    </div>
                    <div className="p-4 border border-border rounded-md">
                        <p className="ledger-label">{t("total_expense_amount")}</p>
                        <p className="text-2xl font-semibold tech-number mt-2">${Number(stats._sum.totalAmount || 0).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Session Info - Only show in development */}
            {process.env.NODE_ENV === "development" && (
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="font-semibold mb-4">{t("session_info")} (Dev Only)</h3>
                    <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                        {JSON.stringify({
                            id: session.user?.id ? "[REDACTED]" : null,
                            role: session.user?.role,
                            // 只顯示非敏感資訊
                        }, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    )
}
