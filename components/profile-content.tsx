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

    const roleChip =
        user?.role === 'ADMIN' ? 'border-primary/40 bg-primary/10 text-primary' :
            user?.role === 'FINANCE' ? 'border-ok/40 bg-ok/10 text-ok' :
                'border-border bg-muted text-muted-foreground'

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            {/* ── 期別標頭 ─────────────────────────────── */}
            <div className="space-y-1.5 border-b border-border pb-5">
                <p className="ledger-label text-primary">Member File</p>
                <h1 className="text-2xl font-semibold tracking-tight">{t("profile")}</h1>
                <p className="text-sm text-muted-foreground">{t("account_info")}</p>
            </div>

            {/* ── 隊員檔案卡：識別列 + 定義表 ─────────────── */}
            <div className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-4 border-b border-border">
                    <div className="h-14 w-14 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                        <span className="text-xl font-semibold text-foreground">
                            {(user?.name || user?.email || "U")[0].toUpperCase()}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-lg font-semibold truncate">{user?.name || t("name_not_set")}</h2>
                            <span className={`px-1.5 py-0.5 rounded border font-mono text-[11px] font-medium ${roleChip}`}>
                                {user?.role || "USER"}
                            </span>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono truncate">{user?.email}</p>
                    </div>
                </div>

                {/* 定義表：mono 欄位對照 */}
                <dl className="grid grid-cols-[auto_1fr] text-sm">
                    <dt className="ledger-label px-4 py-3 border-b border-r border-border flex items-center">
                        {t("user_id")}
                    </dt>
                    <dd className="px-4 py-3 border-b border-border font-mono text-xs flex items-center break-all">
                        {user?.id}
                    </dd>
                    <dt className="ledger-label px-4 py-3 border-r border-border flex items-center">
                        {t("created_at")}
                    </dt>
                    <dd className="px-4 py-3 font-mono text-xs flex items-center">
                        {user?.createdAt ? formatDate(user.createdAt) : "N/A"}
                    </dd>
                </dl>
            </div>

            {/* ── 報帳統計帶 ───────────────────────────── */}
            <div className="rounded-lg border bg-card overflow-hidden">
                <div className="flex items-baseline gap-2 px-4 py-3 border-b border-border">
                    <span className="seal-index">01</span>
                    <h3 className="text-sm font-semibold">{t("expense_stats")}</h3>
                    <span className="ledger-label ml-auto">Stats</span>
                </div>
                <div className="grid grid-cols-2">
                    <div className="p-4 border-r border-border">
                        <p className="ledger-label">{t("total_reports")}</p>
                        <p className="text-2xl font-semibold tech-number mt-2">{stats._count}</p>
                    </div>
                    <div className="p-4">
                        <p className="ledger-label">{t("total_expense_amount")}</p>
                        <p className="text-2xl font-semibold tech-number mt-2">${Number(stats._sum.totalAmount || 0).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Session Info - Only show in development */}
            {process.env.NODE_ENV === "development" && (
                <div className="rounded-lg border bg-card overflow-hidden">
                    <div className="flex items-baseline gap-2 px-4 py-3 border-b border-border">
                        <span className="seal-index">02</span>
                        <h3 className="text-sm font-semibold">{t("session_info")}</h3>
                        <span className="ledger-label ml-auto">Dev Only</span>
                    </div>
                    <pre className="text-xs p-4 overflow-auto font-mono">
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
