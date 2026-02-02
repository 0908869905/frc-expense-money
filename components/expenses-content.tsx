"use client"

import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { useState, useTransition } from "react"
import { Clock, CheckCircle, XCircle, FileText, Building2 } from "lucide-react"
import { ReceiptAuditButton } from "@/components/receipt-audit-button"
import { ReceiptPreview } from "@/components/receipt-preview"
import { BatchAuditButton } from "@/components/batch-audit-button"
import { getStatusColor, getStatusLabel, getDepartmentLabel, type Language } from "@/lib/constants/expense-status"
import { useMessage } from "@/hooks/useMessage"
import { formatDate } from "@/lib/utils"
import { maskAccountNumber } from "@/lib/utils/mask-account"
import type { AuditResult } from "@/types/audit"
interface ExpensesContentProps {
    reports: any[]
    totalReports: number
    totalItems: number
    totalAmount: number
}

export function ExpensesContent({ reports, totalReports, totalItems, totalAmount }: ExpensesContentProps) {
    const { t, language } = useLanguage()
    const [localReports, setLocalReports] = useState(reports)
    const { message, showMessage } = useMessage()

    // 更新特定項目的審核狀態
    const handleAuditComplete = (reportId: string, itemId: string, result: AuditResult) => {
        setLocalReports(prev => prev.map(report => {
            if (report.id !== reportId) return report;
            const updatedItems = report.items.map((item: any) => {
                if (item.id !== itemId) return item;
                return { ...item, audit: { ...result } };
            });
            return { ...report, items: updatedItems };
        }));
    };

    // 更新整張報表的批次審核結果
    const handleBatchAuditComplete = (reportId: string, result: any) => {
        // 重新整理頁面以獲取最新資料，或者只顯示通知
        // 這裡選擇簡單刷新頁面或通知
        if (result.success) {
            showMessage("success", language === 'zh' ? `批次審核完成，通過率: ${Math.round(result.passedItems / result.auditedItems * 100)}%` : "Batch audit completed");
            // 實際上也可以更新 local state，但需要處理較多資料，簡單起見可不更新或 reload
            window.location.reload();
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "PENDING_MANAGER":
            case "PENDING_FINANCE": return <Clock className="h-4 w-4" />
            case "PAID": return <CheckCircle className="h-4 w-4" />
            case "REJECTED": return <XCircle className="h-4 w-4" />
            default: return <FileText className="h-4 w-4" />
        }
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("my_expenses")}</h1>
                    <p className="text-muted-foreground">
                        {t("view_manage_expenses")}
                    </p>
                </div>
                <Link
                    href="/dashboard/expenses/new"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    {t("new_report")}
                </Link>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            {/* Stats Cards — 排除已拒絕的報帳單 */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">{t("total_reports")}</h3>
                    <p className="text-2xl font-bold">{localReports.filter(r => r.status !== "REJECTED").length}</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">{t("total_items")}</h3>
                    <p className="text-2xl font-bold">{localReports.filter(r => r.status !== "REJECTED").reduce((acc, r) => acc + r.items.length, 0)}</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">{t("total_amount")}</h3>
                    <p className="text-2xl font-bold">${localReports.filter(r => r.status !== "REJECTED").reduce((acc, r) => acc + Number(r.totalAmount), 0).toFixed(2)}</p>
                </div>
            </div>

            {/* Reports List */}
            <div className="space-y-6">
                {localReports.length === 0 ? (
                    <div className="rounded-xl border bg-card p-8 text-center">
                        <p className="text-muted-foreground mb-4">{t("no_reports_yet")}</p>
                        <Link
                            href="/dashboard/expenses/new"
                            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            {t("create_first")}
                        </Link>
                    </div>
                ) : (
                    localReports.map((report) => (
                        <div key={report.id} className="rounded-xl border bg-card overflow-hidden">
                            {/* Report Header */}
                            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{report.title}</h3>
                                    <div className="flex flex-wrap gap-2 text-sm text-muted-foreground mt-1 items-center">
                                        {report.department && (
                                            <>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                    {getDepartmentLabel(report.department, language as Language)}
                                                </span>
                                                <span>•</span>
                                            </>
                                        )}
                                        <span>{t("created_on")}: {formatDate(report.createdAt, language as Language)}</span>
                                        <span>•</span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                            {getStatusIcon(report.status)}
                                            {getStatusLabel(report.status, language as Language)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <p className="text-2xl font-bold">${Number(report.totalAmount).toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">{report.items.length} {t("items_count")}</p>
                                    </div>
                                    <BatchAuditButton
                                        reportId={report.id}
                                        reportTitle={report.title}
                                        onAuditComplete={(res) => handleBatchAuditComplete(report.id, res)}
                                    />
                                </div>
                            </div>

                            {/* Bank Account Info */}
                            {report.bankAccount && (
                                <div className="px-4 py-2 bg-muted/30 border-b flex items-center gap-2 text-sm">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">{language === "zh" ? "收款帳戶" : "Bank Account"}:</span>
                                    <span className="font-medium">{report.bankAccount.bankName}</span>
                                    {report.bankAccount.branchName && (
                                        <span className="text-muted-foreground">- {report.bankAccount.branchName}</span>
                                    )}
                                    <span className="text-muted-foreground">
                                        ({maskAccountNumber(report.bankAccount.accountNumber)})
                                    </span>
                                    {!report.bankAccount.isActive && (
                                        <span className="text-xs text-destructive">
                                            ({language === "zh" ? "已停用" : "Inactive"})
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Expense Items */}
                            {report.items.length > 0 && (
                                <div className="divide-y">
                                    {report.items.map((item: any) => (
                                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/20">
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {item.receiptUrl && (
                                                    <ReceiptPreview src={item.receiptUrl} alt={item.description} size="sm" />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="font-medium">{item.description}</p>
                                                    <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                                                        <span className="px-2 py-0.5 bg-muted rounded-full text-xs">
                                                            {item.category}
                                                        </span>
                                                        <span>{formatDate(item.date, language as Language)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="font-semibold text-lg">${Number(item.amount).toFixed(2)}</p>
                                                <ReceiptAuditButton
                                                    itemId={item.id}
                                                    itemDescription={item.description}
                                                    receiptUrl={item.receiptUrl}
                                                    existingAuditStatus={item.audit?.isValid}
                                                    variant="compact"
                                                    onAuditComplete={(res) => handleAuditComplete(report.id, item.id, res)}
                                                />
                                            </div>
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
