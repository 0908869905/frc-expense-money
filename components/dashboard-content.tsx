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
    DollarSign,
    TrendingUp,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    Sparkles
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

// Dashboard 專用的狀態樣式（包含圖示和深色模式支援）
const DASHBOARD_STATUS_STYLES: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
    PENDING_MANAGER: {
        bg: "bg-amber-500/20 dark:bg-amber-500/10",
        text: "text-amber-600 dark:text-amber-400",
        icon: <AlertCircle className="h-3 w-3" />
    },
    PENDING_FINANCE: {
        bg: "bg-blue-500/20 dark:bg-blue-500/10",
        text: "text-blue-600 dark:text-blue-400",
        icon: <Clock className="h-3 w-3" />
    },
    PAID: {
        bg: "bg-emerald-500/20 dark:bg-emerald-500/10",
        text: "text-emerald-600 dark:text-emerald-400",
        icon: <CheckCircle2 className="h-3 w-3" />
    },
    REJECTED: {
        bg: "bg-red-500/20 dark:bg-red-500/10",
        text: "text-red-600 dark:text-red-400",
        icon: <AlertCircle className="h-3 w-3" />
    },
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

    const getStatusStyle = (status: string) => DASHBOARD_STATUS_STYLES[status] || DASHBOARD_STATUS_STYLES.PENDING_MANAGER

    return (
        <div className="flex flex-col gap-6">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
                        <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <p className="text-muted-foreground">
                        {t("welcome_back")}, <span className="font-medium text-foreground">{userName}</span>
                    </p>
                </div>
                <div className="flex gap-2">
                    {canAddFunding && <FundingDialog />}
                    <Link
                        href="/dashboard/expenses/new"
                        className="group inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/25"
                    >
                        {t("new_report")}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
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

                {/* Stats Cards - Bento Style */}
                {/* 報表數量 */}
                <div className={`${canAddFunding ? 'lg:col-span-4' : 'md:col-span-2 lg:col-span-4'} bento-card group`}>
                    <div className="h-full flex flex-col justify-between p-6">
                        <div className="flex items-start justify-between">
                            <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {language === "zh" ? "報表" : "Reports"}
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-4xl font-bold tracking-tight tech-number">{totalReports}</p>
                            <p className="text-sm text-muted-foreground mt-1">{t("total_reports")}</p>
                        </div>
                    </div>
                </div>

                {/* 項目數量 */}
                <div className={`${canAddFunding ? 'lg:col-span-4' : 'md:col-span-2 lg:col-span-4'} bento-card group`}>
                    <div className="h-full flex flex-col justify-between p-6">
                        <div className="flex items-start justify-between">
                            <div className="p-2.5 rounded-xl bg-accent/10 ring-1 ring-accent/20 group-hover:ring-accent/40 transition-all">
                                <Package className="h-5 w-5 text-accent" />
                            </div>
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                {language === "zh" ? "項目" : "Items"}
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-4xl font-bold tracking-tight tech-number">{totalItems}</p>
                            <p className="text-sm text-muted-foreground mt-1">{t("total_items")}</p>
                        </div>
                    </div>
                </div>

                {/* 總金額 - 橫跨 */}
                <div className={`${canAddFunding ? 'md:col-span-6 lg:col-span-8' : 'md:col-span-2 lg:col-span-4'} bento-card group`}>
                    <div className="h-full flex flex-col justify-between p-6">
                        <div className="flex items-start justify-between">
                            <div className="p-2.5 rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 group-hover:ring-emerald-500/40 transition-all">
                                <DollarSign className="h-5 w-5 text-emerald-500" />
                            </div>
                            <div className="flex items-center gap-1.5 text-emerald-500">
                                <TrendingUp className="h-4 w-4" />
                                <span className="text-xs font-medium uppercase tracking-wider">
                                    {language === "zh" ? "金額" : "Amount"}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <p className="text-4xl font-bold tracking-tight tech-number text-emerald-500">
                                {formatCurrency(totalAmount)}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">{t("total_amount")}</p>
                        </div>
                    </div>
                </div>

                {/* 狀態統計 - 迷你卡片 */}
                <div className="md:col-span-3 lg:col-span-2 bento-card-mini">
                    <div className="h-full flex flex-col justify-center items-center p-4 text-center">
                        <div className="p-2 rounded-lg bg-amber-500/10 mb-2">
                            <Clock className="h-4 w-4 text-amber-500" />
                        </div>
                        <p className="text-2xl font-bold">{pendingCount}</p>
                        <p className="text-xs text-muted-foreground">
                            {language === "zh" ? "待審核" : "Pending"}
                        </p>
                    </div>
                </div>

                <div className="md:col-span-3 lg:col-span-2 bento-card-mini">
                    <div className="h-full flex flex-col justify-center items-center p-4 text-center">
                        <div className="p-2 rounded-lg bg-emerald-500/10 mb-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        </div>
                        <p className="text-2xl font-bold">{paidCount}</p>
                        <p className="text-xs text-muted-foreground">
                            {language === "zh" ? "已完成" : "Completed"}
                        </p>
                    </div>
                </div>

                {/* 近期報表 - 大卡片 */}
                <div className="md:col-span-6 lg:col-span-8 md:row-span-2 bento-card">
                    <div className="h-full flex flex-col p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
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
                                <div className="p-4 rounded-full bg-muted/50 mb-4">
                                    <FileText className="h-8 w-8 text-muted-foreground" />
                                </div>
                                <p className="text-muted-foreground">{t("no_reports")}</p>
                                <Link
                                    href="/dashboard/expenses/new"
                                    className="mt-4 text-sm text-primary hover:underline"
                                >
                                    {language === "zh" ? "建立第一份報表" : "Create your first report"}
                                </Link>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-auto space-y-2">
                                {reports.slice(0, 5).map((report, index) => {
                                    const statusStyle = getStatusStyle(report.status)
                                    return (
                                        <Link
                                            key={report.id}
                                            href="/dashboard/expenses"
                                            className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all group"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="text-sm font-bold text-primary">
                                                        #{index + 1}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium truncate group-hover:text-primary transition-colors">
                                                        {report.title}
                                                    </p>
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <span className="truncate">
                                                            {report.submitter?.name || report.submitter?.email}
                                                        </span>
                                                        <span className="text-muted-foreground/50">•</span>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                                                            {statusStyle.icon}
                                                            {getStatusLabel(report.status, language as Language)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 shrink-0">
                                                <p className="font-semibold text-right">
                                                    {formatCurrency(Number(report.totalAmount))}
                                                </p>
                                                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </Link>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* 快捷操作 */}
                <div className="md:col-span-6 lg:col-span-4 md:row-span-2 bento-card">
                    <div className="h-full flex flex-col p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            {language === "zh" ? "快捷操作" : "Quick Actions"}
                        </h3>
                        <div className="flex-1 grid grid-cols-1 gap-3">
                            <Link
                                href="/dashboard/expenses/new"
                                className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/10 hover:border-primary/20 transition-all group"
                            >
                                <div className="p-2.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-medium group-hover:text-primary transition-colors">
                                        {t("new_report")}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {language === "zh" ? "建立新的報帳單" : "Create expense report"}
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/expenses"
                                className="flex items-center gap-3 p-4 rounded-xl bg-accent/5 hover:bg-accent/10 border border-accent/10 hover:border-accent/20 transition-all group"
                            >
                                <div className="p-2.5 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                                    <Package className="h-5 w-5 text-accent" />
                                </div>
                                <div>
                                    <p className="font-medium group-hover:text-accent transition-colors">
                                        {language === "zh" ? "我的報表" : "My Reports"}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {language === "zh" ? "查看所有報帳記錄" : "View all expense records"}
                                    </p>
                                </div>
                            </Link>

                            <Link
                                href="/dashboard/profile"
                                className="flex items-center gap-3 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 border border-border/50 hover:border-border transition-all group"
                            >
                                <div className="p-2.5 rounded-lg bg-muted group-hover:bg-muted/80 transition-colors">
                                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="font-medium">
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
