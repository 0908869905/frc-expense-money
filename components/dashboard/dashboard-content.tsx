"use client"

import { useLanguage } from "@/lib/context/language-context"
import Link from "next/link"
import { BalanceCard } from "@/components/dashboard/balance-card"
import { FundingDialog } from "@/components/funding/funding-dialog"

interface FundingRecord {
    id: string
    title: string
    amount: number
    type: string
    source: string | null
    description: string | null
    date: Date | string
    recordedBy: string
}

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

export function DashboardContent({
    userName,
    role,
    reports,
    totalAmount,
    financialSummary,
    fundingRecords,
    canAddFunding
}: DashboardContentProps) {
    const { t } = useLanguage()

    const totalReports = reports.length
    const totalItems = reports.reduce((acc, r) => acc + (r.items?.length || 0), 0)

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("dashboard")}</h1>
                    <p className="text-muted-foreground">
                        {t("welcome_back")}, {userName}! ({role})
                    </p>
                </div>
                <div className="flex gap-2">
                    {canAddFunding && <FundingDialog />}
                    <Link
                        href="/dashboard/expenses/new"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                    >
                        {t("new_report")}
                    </Link>
                </div>
            </div>

            {/* 財務總覽卡片 - 僅限 FINANCE/ADMIN 可見 */}
            {canAddFunding && (
                <BalanceCard
                    totalIncome={financialSummary.totalIncome}
                    totalExpense={financialSummary.totalExpense}
                    currentBalance={financialSummary.currentBalance}
                    fundingRecords={fundingRecords}
                />
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">{t("total_reports")}</h3>
                    <p className="text-2xl font-bold">{totalReports}</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">{t("total_items")}</h3>
                    <p className="text-2xl font-bold">{totalItems}</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">{t("total_amount")}</h3>
                    <p className="text-2xl font-bold">${totalAmount.toFixed(2)}</p>
                </div>
            </div>

            {/* Reports List */}
            <div className="rounded-xl border bg-card">
                <div className="p-6">
                    <h3 className="text-lg font-medium mb-4">{t("recent_reports")}</h3>
                    {reports.length === 0 ? (
                        <p className="text-muted-foreground">{t("no_reports")}</p>
                    ) : (
                        <div className="space-y-2">
                            {reports.map((report) => (
                                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{report.title}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {report.submitter?.name || report.submitter?.email} · {report.status}
                                        </p>
                                    </div>
                                    <p className="font-medium">${Number(report.totalAmount).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
