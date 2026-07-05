"use client"

import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { FundingDialog } from "@/components/funding-dialog"
import { formatCurrency, type FundingRecord } from "@/lib/constants/funding"
import { getStatusLabel, getStatusDotColor, getStatusTextColor } from "@/lib/constants/expense-status"
import type { Language } from "@/lib/constants/expense-status"
import {
    ArrowRight,
    ArrowUpRight,
    CheckSquare,
    FileText,
    Plus,
    User,
} from "lucide-react"

interface DashboardContentProps {
    userName: string
    role: string
    reports: any[]
    totalAmount: number
    financialSummary: {
        totalIncome: number
        totalExpense: number
        currentBalance: number
    }
    fundingRecords: FundingRecord[]
    canAddFunding: boolean
}

const CAN_APPROVE_ROLES = ["LEADER", "FINANCE", "ADMIN"]

export function DashboardContent({
    userName,
    role,
    reports,
    totalAmount,
    financialSummary,
    fundingRecords,
    canAddFunding
}: DashboardContentProps) {
    const { t, language } = useLanguage()

    const totalReports = reports.length
    const totalItems = reports.reduce((acc, r) => acc + (r.items?.length || 0), 0)
    const pendingCount = reports.filter(r =>
        r.status === "PENDING_MANAGER" || r.status === "PENDING_FINANCE"
    ).length
    const paidCount = reports.filter(r => r.status === "PAID").length

    const canApprove = CAN_APPROVE_ROLES.includes(role)
    const isBalanceNegative = financialSummary.currentBalance < 0

    const now = new Date()
    const seasonLabel = `${now.getFullYear()} SEASON`
    const dateLabel = now.toLocaleDateString(language === "zh" ? "zh-TW" : "en-US", {
        year: "numeric", month: "2-digit", day: "2-digit",
    })

    return (
        <div className="flex flex-col gap-6">
            {/* ── 期別標頭 ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-5">
                <div className="space-y-1.5">
                    <p className="ledger-label">
                        <span className="text-primary">{seasonLabel}</span>
                        <span className="mx-2 text-border">·</span>
                        {dateLabel}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard")}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t("welcome_back")}, <span className="font-medium text-foreground">{userName}</span>
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    {canAddFunding && <FundingDialog />}
                    <Link
                        href="/dashboard/expenses/new"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        <Plus className="h-4 w-4" />
                        {t("new_report")}
                    </Link>
                </div>
            </div>

            {/* ── 帳冊合計列：hairline 分欄，非卡片海 ───────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 rounded-lg border border-border bg-card overflow-hidden">
                {canAddFunding ? (
                    <>
                        <SummaryCell
                            label="目前餘額"
                            labelEn="Balance"
                            value={formatCurrency(financialSummary.currentBalance)}
                            tone={isBalanceNegative ? "danger" : "default"}
                            language={language}
                        />
                        <SummaryCell
                            label="總收入"
                            labelEn="Income"
                            value={formatCurrency(financialSummary.totalIncome)}
                            tone="ok"
                            language={language}
                        />
                        <SummaryCell
                            label="總支出"
                            labelEn="Expense"
                            value={formatCurrency(financialSummary.totalExpense)}
                            tone="danger"
                            language={language}
                        />
                        <SummaryCell
                            label="報帳總額"
                            labelEn="Reported"
                            value={formatCurrency(totalAmount)}
                            language={language}
                        />
                    </>
                ) : (
                    <>
                        <SummaryCell
                            label="報帳單數量"
                            labelEn="Reports"
                            value={String(totalReports)}
                            language={language}
                        />
                        <SummaryCell
                            label="花費項目數"
                            labelEn="Items"
                            value={String(totalItems)}
                            language={language}
                        />
                        <SummaryCell
                            label="待審核"
                            labelEn="Pending"
                            value={String(pendingCount)}
                            tone={pendingCount > 0 ? "warn" : "default"}
                            language={language}
                        />
                        <SummaryCell
                            label="報帳總額"
                            labelEn="Total"
                            value={formatCurrency(totalAmount)}
                            language={language}
                        />
                    </>
                )}
            </div>

            {/* ── 主體：左帳目 journal ＋ 右行動欄 ─────────── */}
            <div className="grid lg:grid-cols-3 gap-6 items-start">

                {/* 01 · 近期帳目 */}
                <section className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
                    <header className="flex items-center justify-between px-4 py-3 border-b border-border">
                        <div className="flex items-baseline gap-2">
                            <span className="seal-index">01</span>
                            <h2 className="text-sm font-semibold">{t("recent_reports")}</h2>
                        </div>
                        <Link
                            href="/dashboard/expenses"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors font-mono"
                        >
                            {language === "zh" ? "查看全部" : "View All"}
                            <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </header>

                    {reports.length === 0 ? (
                        <div className="flex flex-col items-center justify-center text-center py-14 px-4">
                            <FileText className="h-6 w-6 text-muted-foreground mb-3" />
                            <p className="text-sm text-muted-foreground">{t("no_reports")}</p>
                            <Link
                                href="/dashboard/expenses/new"
                                className="mt-3 text-sm text-primary hover:underline"
                            >
                                {language === "zh" ? "建立第一份報表" : "Create your first report"}
                            </Link>
                        </div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead className="bg-transparent">
                                <tr className="border-b border-border">
                                    <th className="ledger-label text-left px-4 py-2 w-10">#</th>
                                    <th className="ledger-label text-left px-2 py-2">{language === "zh" ? "帳目" : "Entry"}</th>
                                    <th className="ledger-label text-left px-2 py-2 w-32">{language === "zh" ? "狀態" : "Status"}</th>
                                    <th className="ledger-label text-right px-4 py-2 w-28">{language === "zh" ? "金額" : "Amount"}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.slice(0, 6).map((report, index) => (
                                    <tr key={report.id} className="border-b border-border last:border-0 hover:bg-accent/60 transition-colors">
                                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                                            {String(index + 1).padStart(2, "0")}
                                        </td>
                                        <td className="px-2 py-2.5 min-w-0">
                                            <Link href="/dashboard/expenses" className="block min-w-0 group">
                                                <p className="font-medium truncate group-hover:text-primary transition-colors">
                                                    {report.title}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {report.submitter?.name || report.submitter?.email}
                                                </p>
                                            </Link>
                                        </td>
                                        <td className="px-2 py-2.5">
                                            <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-medium ${getStatusTextColor(report.status)}`}>
                                                <span className={`status-dot ${getStatusDotColor(report.status)}`} />
                                                {getStatusLabel(report.status, language as Language)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-right font-mono font-medium tabular-nums">
                                            {formatCurrency(Number(report.totalAmount))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </section>

                {/* 右行動欄 */}
                <aside className="flex flex-col gap-6">

                    {/* 02 · 待辦 */}
                    <section className="rounded-lg border border-border bg-card overflow-hidden">
                        <header className="flex items-baseline gap-2 px-4 py-3 border-b border-border">
                            <span className="seal-index">02</span>
                            <h2 className="text-sm font-semibold">{language === "zh" ? "待辦" : "To-Do"}</h2>
                        </header>
                        <div>
                            {canApprove ? (
                                <Link
                                    href="/dashboard/approvals"
                                    className="flex items-center justify-between px-4 py-3 border-b border-border hover:bg-accent/60 transition-colors group"
                                >
                                    <span className="inline-flex items-center gap-2 text-sm">
                                        <span className={`status-dot ${pendingCount > 0 ? "bg-warn" : "bg-muted-foreground/40"}`} />
                                        {language === "zh" ? "待審核" : "Pending Review"}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className={`font-mono text-lg font-semibold tabular-nums ${pendingCount > 0 ? "text-warn" : "text-muted-foreground"}`}>
                                            {pendingCount}
                                        </span>
                                        <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </span>
                                </Link>
                            ) : (
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                    <span className="inline-flex items-center gap-2 text-sm">
                                        <span className={`status-dot ${pendingCount > 0 ? "bg-warn" : "bg-muted-foreground/40"}`} />
                                        {language === "zh" ? "審核中" : "In Review"}
                                    </span>
                                    <span className={`font-mono text-lg font-semibold tabular-nums ${pendingCount > 0 ? "text-warn" : "text-muted-foreground"}`}>
                                        {pendingCount}
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center justify-between px-4 py-3">
                                <span className="inline-flex items-center gap-2 text-sm">
                                    <span className="status-dot bg-ok" />
                                    {language === "zh" ? "已完成" : "Completed"}
                                </span>
                                <span className="font-mono text-lg font-semibold tabular-nums text-muted-foreground">
                                    {paidCount}
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* 03 · 快速動作 */}
                    <section className="rounded-lg border border-border bg-card overflow-hidden">
                        <header className="flex items-baseline gap-2 px-4 py-3 border-b border-border">
                            <span className="seal-index">03</span>
                            <h2 className="text-sm font-semibold">{language === "zh" ? "快速動作" : "Quick Actions"}</h2>
                        </header>
                        <nav className="divide-y divide-border">
                            <QuickAction
                                href="/dashboard/expenses/new"
                                icon={<Plus className="h-4 w-4" />}
                                label={t("new_report")}
                                sub={language === "zh" ? "建立新的報帳單" : "Create expense report"}
                            />
                            <QuickAction
                                href="/dashboard/expenses"
                                icon={<FileText className="h-4 w-4" />}
                                label={language === "zh" ? "我的報表" : "My Reports"}
                                sub={language === "zh" ? "查看所有報帳記錄" : "View all expense records"}
                            />
                            {canApprove && (
                                <QuickAction
                                    href="/dashboard/approvals"
                                    icon={<CheckSquare className="h-4 w-4" />}
                                    label={language === "zh" ? "審核報帳單" : "Approvals"}
                                    sub={language === "zh" ? "處理待審核項目" : "Process pending reviews"}
                                />
                            )}
                            <QuickAction
                                href="/dashboard/profile"
                                icon={<User className="h-4 w-4" />}
                                label={language === "zh" ? "個人設定" : "Profile Settings"}
                                sub={language === "zh" ? "更新個人資料" : "Update your profile"}
                            />
                        </nav>
                    </section>
                </aside>
            </div>
        </div>
    )
}

/* ── 局部元件 ─────────────────────────────────────── */

function SummaryCell({
    label,
    labelEn,
    value,
    tone = "default",
    language,
}: {
    label: string
    labelEn: string
    value: string
    tone?: "default" | "ok" | "danger" | "warn"
    language: string
}) {
    const toneClass =
        tone === "ok" ? "text-ok"
            : tone === "danger" ? "text-danger"
                : tone === "warn" ? "text-warn"
                    : "text-foreground"

    return (
        <div className="p-4 border-b lg:border-b-0 [&:nth-child(odd)]:border-r lg:[&:not(:last-child)]:border-r border-border">
            <p className="ledger-label">{language === "zh" ? label : labelEn}</p>
            <p className={`mt-2 text-2xl font-semibold tech-number ${toneClass}`}>{value}</p>
        </div>
    )
}

function QuickAction({
    href,
    icon,
    label,
    sub,
}: {
    href: string
    icon: React.ReactNode
    label: string
    sub: string
}) {
    return (
        <Link
            href={href}
            className="flex items-center gap-3 px-4 py-3 hover:bg-accent/60 transition-colors group"
        >
            <span className="text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                {icon}
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium group-hover:text-primary transition-colors truncate">
                    {label}
                </span>
                <span className="block text-xs text-muted-foreground truncate">{sub}</span>
            </span>
            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
        </Link>
    )
}
