"use client"

import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { useMemo, useState } from "react"
import { Building2, FileText, Plus } from "lucide-react"
import { ReceiptAuditButton } from "@/components/receipt-audit-button"
import { ReceiptPreview } from "@/components/receipt-preview"
import { BatchAuditButton } from "@/components/batch-audit-button"
import { getStatusDotColor, getStatusTextColor, getStatusLabel, getDepartmentLabel, type Language } from "@/lib/constants/expense-status"
import { useMessage } from "@/hooks/useMessage"
import { formatDate } from "@/lib/utils"
import { maskAccountNumber } from "@/lib/utils/mask-account"
import type { AuditResult, BatchAuditResult } from "@/types/audit"
import type { ExpenseReportView, ExpenseItemView } from "@/types/expense"

interface ExpensesContentProps {
    reports: ExpenseReportView[]
}

export function ExpensesContent({ reports }: ExpensesContentProps): JSX.Element {
    const { t, language } = useLanguage()
    const [localReports, setLocalReports] = useState(reports)
    const { message, showMessage } = useMessage()

    const activeReports = useMemo(
        () => localReports.filter(r => r.status !== "REJECTED"),
        [localReports]
    )
    const activeItemCount = useMemo(
        () => activeReports.reduce((acc: number, r: ExpenseReportView) => acc + r.items.length, 0),
        [activeReports]
    )
    const activeTotal = useMemo(
        () => activeReports.reduce((acc: number, r: ExpenseReportView) => acc + Number(r.totalAmount), 0),
        [activeReports]
    )

    // 更新特定項目的審核狀態
    const handleAuditComplete = (reportId: string, itemId: string, result: AuditResult) => {
        setLocalReports(prev => prev.map(report => {
            if (report.id !== reportId) return report;
            const updatedItems = report.items.map((item: ExpenseItemView) => {
                if (item.id !== itemId) return item;
                return { ...item, audit: { ...result } };
            });
            return { ...report, items: updatedItems };
        }));
    };

    const handleBatchAuditComplete = (_reportId: string, result: BatchAuditResult) => {
        if (!result.success) return;

        const passRate = Math.round(result.passedItems / result.auditedItems * 100);
        const msg = language === "zh"
            ? `批次審核完成，通過率: ${passRate}%`
            : "Batch audit completed";
        showMessage("success", msg);
        window.location.reload();
    };

    return (
        <div className="flex flex-col gap-6">
            {/* ── 期別標頭 ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-5">
                <div className="space-y-1.5">
                    <p className="ledger-label text-primary">
                        {language === "zh" ? "個人分錄簿" : "Personal Journal"}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight">{t("my_expenses")}</h1>
                    <p className="text-sm text-muted-foreground">{t("view_manage_expenses")}</p>
                </div>
                <Link
                    href="/dashboard/expenses/new"
                    className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors shrink-0"
                >
                    <Plus className="h-4 w-4" />
                    {t("new_report")}
                </Link>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-md border text-sm ${message.type === "success" ? "bg-ok/10 text-ok border-ok/30" : "bg-danger/10 text-danger border-danger/30"}`}>
                    {message.text}
                </div>
            )}

            {/* ── 合計列 ──────────────────────────────── */}
            <div className="grid grid-cols-3 rounded-lg border border-border bg-card overflow-hidden">
                <div className="p-4 border-r border-border">
                    <p className="ledger-label">{t("total_reports")}</p>
                    <p className="mt-2 text-2xl font-semibold tech-number">{activeReports.length}</p>
                </div>
                <div className="p-4 border-r border-border">
                    <p className="ledger-label">{t("total_items")}</p>
                    <p className="mt-2 text-2xl font-semibold tech-number">{activeItemCount}</p>
                </div>
                <div className="p-4">
                    <p className="ledger-label">{t("total_amount")}</p>
                    <p className="mt-2 text-2xl font-semibold tech-number">${activeTotal.toFixed(2)}</p>
                </div>
            </div>

            {/* ── 分錄簿主體：連續帳冊，每份報帳單一節分錄 ── */}
            {localReports.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-14 text-center">
                    <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">{t("no_reports_yet")}</p>
                    <Link
                        href="/dashboard/expenses/new"
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                        {t("create_first")}
                    </Link>
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                    {localReports.map((report, reportIndex) => (
                        <section key={report.id} className="border-b-4 border-background last:border-b-0">
                            {/* 分錄標頭列 */}
                            <header className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 border-b border-border">
                                <span className="font-mono text-xs text-primary/70 font-medium">
                                    {String(reportIndex + 1).padStart(2, "0")}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-semibold truncate">{report.title}</h3>
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 text-xs text-muted-foreground">
                                        {report.department && (
                                            <>
                                                <span className="px-1.5 py-px rounded border border-border bg-card font-mono text-[11px]">
                                                    {getDepartmentLabel(report.department, language as Language)}
                                                </span>
                                                <span className="text-border">·</span>
                                            </>
                                        )}
                                        <span className="font-mono">{formatDate(report.createdAt, language as Language)}</span>
                                        <span className="text-border">·</span>
                                        <span className="font-mono">{report.items.length} {t("items_count")}</span>
                                        <span className="text-border">·</span>
                                        <span className={`inline-flex items-center gap-1.5 font-mono font-medium ${getStatusTextColor(report.status)}`}>
                                            <span className={`status-dot ${getStatusDotColor(report.status)}`} />
                                            {getStatusLabel(report.status, language as Language)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <p className="font-mono text-base font-semibold tabular-nums">
                                        ${Number(report.totalAmount).toFixed(2)}
                                    </p>
                                    <BatchAuditButton
                                        reportId={report.id}
                                        reportTitle={report.title}
                                        onAuditComplete={(res) => handleBatchAuditComplete(report.id, res)}
                                    />
                                </div>
                            </header>

                            {/* 明細子列 */}
                            {report.items.length > 0 && (
                                <div>
                                    {report.items.map((item: ExpenseItemView, itemIndex: number) => (
                                        <div
                                            key={item.id}
                                            className="flex items-center gap-3 pl-6 pr-4 py-2.5 border-b border-border last:border-b-0 hover:bg-accent/60 transition-colors"
                                        >
                                            <span className="font-mono text-[11px] text-muted-foreground/60 w-8 shrink-0">
                                                {String(reportIndex + 1).padStart(2, "0")}.{itemIndex + 1}
                                            </span>
                                            {item.receiptUrl && (
                                                <ReceiptPreview src={item.receiptUrl} alt={item.description} size="sm" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{item.description}</p>
                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                                                    <span className="px-1.5 py-px rounded border border-border bg-muted font-mono text-[11px]">
                                                        {item.category}
                                                    </span>
                                                    <span className="font-mono">{formatDate(item.date, language as Language)}</span>
                                                </div>
                                            </div>
                                            <ReceiptAuditButton
                                                itemId={item.id}
                                                itemDescription={item.description}
                                                receiptUrl={item.receiptUrl}
                                                existingAuditStatus={item.audit?.isValid}
                                                variant="compact"
                                                onAuditComplete={(res) => handleAuditComplete(report.id, item.id, res)}
                                            />
                                            <p className="font-mono text-sm font-medium tabular-nums w-24 text-right shrink-0">
                                                ${Number(item.amount).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 分錄尾註：收款帳戶 */}
                            {report.bankAccount && (
                                <div className="flex items-center gap-2 pl-6 pr-4 py-2 bg-muted/30 text-xs font-mono text-muted-foreground">
                                    <Building2 className="h-3.5 w-3.5 shrink-0" />
                                    <span>{language === "zh" ? "收款帳戶" : "Bank"}:</span>
                                    <span className="text-foreground">{report.bankAccount.bankName}</span>
                                    {report.bankAccount.branchName && <span>– {report.bankAccount.branchName}</span>}
                                    <span>({maskAccountNumber(report.bankAccount.accountNumber)})</span>
                                    {!report.bankAccount.isActive && (
                                        <span className="text-danger">({language === "zh" ? "已停用" : "Inactive"})</span>
                                    )}
                                </div>
                            )}
                        </section>
                    ))}
                </div>
            )}
        </div>
    )
}
