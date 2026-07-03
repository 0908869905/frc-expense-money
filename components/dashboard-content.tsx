"use client"

import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { BalanceCard } from "@/components/balance-card"
import { FundingDialog } from "@/components/funding-dialog"
import { formatCurrency, type FundingRecord } from "@/lib/constants/funding"
import { getStatusLabel } from "@/lib/constants/expense-status"
import type { Language } from "@/lib/constants/expense-status"
import {
    FileText,
    Package,
    TrendingUp,
    ArrowRight,
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

// 狀態指示點顏色（工程帳冊：小圓點 + 文字，不用色塊藥丸）
const STATUS_DOT_COLORS: Record<string, string> = {
    PENDING_MANAGER: "bg-warn",
    PENDING_FINANCE: "bg-info",
    RETURNED: "bg-warn",
    PAID: "bg-ok",
    REJECTED: "bg-danger",
}

const STATUS_TEXT_COLORS: Record<string, string> = {
    PENDING_MANAGER: "text-warn",
    PENDING_FINANCE: "text-info",
    RETURNED: "text-warn",
    PAID: "text-ok",
    REJECTED: "text-danger",
}

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

    // 計算各狀態數量
    const pendingCount = reports.filter(r =>
        r.status === "PENDING_MANAGER" || r.status === "PENDING_FINANCE"
    ).length
    const paidCount = reports.filter(r => r.status === "PAID").length

    const dotColor = (status: string) => STATUS_DOT_COLORS[status] || STATUS_DOT_COLORS.PENDING_MANAGER
    const textColor = (status: string) => STATUS_TEXT_COLORS[status] || STATUS_TEXT_COLORS.PENDING_MANAGER

    return (
        <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold tracking-tight">{t("dashboard")}</h1>
                    <p className="text-sm text-muted-foreground">
                        {t("welcome_back")}, <span className="font-medium text-foreground">{userName}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    {canAddFunding && <FundingDialog />}
                    <Link
                        href="/dashboard/expenses/new"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                    >
                        {t("new_report")}
                        <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12 gap-4 auto-rows-[minmax(120px,auto)]">

                {/* 財務摘要卡片 - 大卡片 (4列高) - 只有 FINANCE/ADMIN 可見 */}
                {canAddFunding && (
                    <div className="md:col-span-6 lg:col-span-8 md:row-span-2">
                        <BalanceCard
                            totalIncome={financialSummary.totalIncome}
                            totalExpense={financialSummary.totalExpense}
                            currentBalance={financialSummary.currentBalance}
                            fundingRecords={fundingRecords}
                        />
                    </div>
                )}

                {/* Stats Cards */}
                {/* 報表數量 */}
                <div className={`${canAddFunding ? 'lg:col-span-4' : 'md:col-span-2 lg:col-span-4'} bento-card`}>
                    <div className="h-full flex flex-col justify-between p-5">
                        <div className="flex items-center justify-between">
                            <span className="ledger-label">
                                {language === "zh" ? "報表" : "Reports"}
                            </span>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-semibold tech-number">{totalReports}</p>
                            <p className="text-sm text-muted-foreground mt-1">{t("total_reports")}</p>
                        </div>
                    </div>
                </div>

                {/* 項目數量 */}
                <div className={`${canAddFunding ? 'lg:col-span-4' : 'md:col-span-2 lg:col-span-4'} bento-card`}>
                    <div className="h-full flex flex-col justify-between p-5">
                        <div className="flex items-center justify-between">
                            <span className="ledger-label">
                                {language === "zh" ? "項目" : "Items"}
                            </span>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-semibold tech-number">{totalItems}</p>
                            <p className="text-sm text-muted-foreground mt-1">{t("total_items")}</p>
                        </div>
                    </div>
                </div>

                {/* 總金額 - 橫跨 */}
                <div className={`${canAddFunding ? 'md:col-span-6 lg:col-span-8' : 'md:col-span-2 lg:col-span-4'} bento-card`}>
                    <div className="h-full flex flex-col justify-between p-5">
                        <div className="flex items-center justify-between">
                            <span className="ledger-label">
                                {language === "zh" ? "金額" : "Amount"}
                            </span>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="mt-4">
                            <p className="text-3xl font-semibold tech-number">
                                {formatCurrency(totalAmount)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">{t("total_amount")}</p>
                        </div>
                    </div>
                </div>

                {/* 狀態統計 - 迷你卡片 */}
                <div className="md:col-span-3 lg:col-span-2 bento-card-mini">
                    <div className="h-full flex flex-col justify-center items-center p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 mb-2">
                            <span className="status-dot bg-warn" />
                            <span className="ledger-label">
                                {language === "zh" ? "待審核" : "Pending"}
                            </span>
                        </span>
                        <p className="text-2xl font-semibold tech-number">{pendingCount}</p>
                    </div>
                </div>

                <div className="md:col-span-3 lg:col-span-2 bento-card-mini">
                    <div className="h-full flex flex-col justify-center items-center p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 mb-2">
                            <span className="status-dot bg-ok" />
                            <span className="ledger-label">
                                {language === "zh" ? "已完成" : "Completed"}
                            </span>
                        </span>
                        <p className="text-2xl font-semibold tech-number">{paidCount}</p>
                    </div>
                </div>

                {/* 近期報表 - 大卡片 */}
                <div className="md:col-span-6 lg:col-span-8 md:row-span-2 bento-card">
                    <div className="h-full flex flex-col p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-base font-semibold">
                                {t("recent_reports")}
                            </h3>
                            <Link
                                href="/dashboard/expenses"
                                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                            >
                                {language === "zh" ? "查看全部" : "View All"}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>

                        {reports.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
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
                            <div className="flex-1 overflow-auto">
                                {reports.slice(0, 5).map((report, index) => (
                                    <Link
                                        key={report.id}
                                        href="/dashboard/expenses"
                                        className="flex items-center justify-between gap-4 px-1 py-3 border-b border-border last:border-0 hover:bg-accent/60 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="font-mono text-xs text-muted-foreground w-6 shrink-0 text-right">
                                                {String(index + 1).padStart(2, "0")}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                                                    {report.title}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span className="truncate">
                                                        {report.submitter?.name || report.submitter?.email}
                                                    </span>
                                                    <span className="text-muted-foreground/50">•</span>
                                                    <span className={`inline-flex items-center gap-1.5 font-mono font-medium ${textColor(report.status)}`}>
                                                        <span className={`status-dot ${dotColor(report.status)}`} />
                                                        {getStatusLabel(report.status, language as Language)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="font-mono text-sm font-medium text-right shrink-0 tabular-nums">
                                            {formatCurrency(Number(report.totalAmount))}
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 快捷操作 */}
                <div className="md:col-span-6 lg:col-span-4 md:row-span-2 bento-card">
                    <div className="h-full flex flex-col p-5">
                        <h3 className="text-base font-semibold mb-3">
                            {language === "zh" ? "快捷操作" : "Quick Actions"}
                        </h3>
                        <div className="flex-1 grid grid-cols-1 gap-2 content-start">
                            <Link
                                href="/dashboard/expenses/new"
                                className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary/50 hover:bg-accent/60 transition-colors group"
                            >
                                <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                <div>
                                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                                        {t("new_report")}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {language === "zh" ? "建立新的報帳單" : "Create expense report"}
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/expenses"
                                className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary/50 hover:bg-accent/60 transition-colors group"
                            >
                                <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                <div>
                                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                                        {language === "zh" ? "我的報表" : "My Reports"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {language === "zh" ? "查看所有報帳記錄" : "View all expense records"}
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/profile"
                                className="flex items-center gap-3 p-3 rounded-md border border-border hover:border-primary/50 hover:bg-accent/60 transition-colors group"
                            >
                                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                                <div>
                                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                                        {language === "zh" ? "個人設定" : "Profile Settings"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {language === "zh" ? "更新個人資料" : "Update your profile"}
                                    </p>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
