"use client"

import { useLanguage } from "@/lib/language-context"
import { Check, X, Inbox, Building2, Paperclip } from "lucide-react"
import { ReceiptPreview } from "@/components/receipt-preview"
import { useState, useTransition } from "react"
import { approveReport, rejectReport } from "@/app/actions/approvals"
import { formatDate } from "@/lib/utils"
import { maskAccountNumber } from "@/lib/utils/mask-account"
import { getStatusDotColor, getStatusTextColor, getStatusLabel, type Language } from "@/lib/constants/expense-status"

interface ApprovalsContentProps {
    reports: any[]
    userRole: string
    canViewFullBankAccount?: boolean
}

export function ApprovalsContent({ reports, userRole, canViewFullBankAccount = false }: ApprovalsContentProps): JSX.Element {
    const { language } = useLanguage()
    const [isPending, startTransition] = useTransition()
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [localReports, setLocalReports] = useState(reports)

    const handleApprove = async (reportId: string) => {
        setProcessingId(reportId)
        startTransition(async () => {
            try {
                await approveReport(reportId)
                setLocalReports(prev => prev.filter(r => r.id !== reportId))
            } catch (error) {
                console.error("Failed to approve:", error)
            } finally {
                setProcessingId(null)
            }
        })
    }

    const handleReject = async (reportId: string) => {
        const reason = prompt(language === "zh" ? "請輸入拒絕原因：" : "Please enter rejection reason:")
        if (!reason) return

        setProcessingId(reportId)
        startTransition(async () => {
            try {
                await rejectReport(reportId, reason)
                setLocalReports(prev => prev.filter(r => r.id !== reportId))
            } catch (error) {
                console.error("Failed to reject:", error)
            } finally {
                setProcessingId(null)
            }
        })
    }

    return (
        <div className="flex flex-col gap-6">
            {/* ── 期別標頭 ─────────────────────────────── */}
            <div className="space-y-1.5 border-b border-border pb-5">
                <p className="ledger-label text-primary">Review Queue</p>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {language === "zh" ? "審核報帳單" : "Approvals"}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {language === "zh"
                        ? `你有 ${localReports.length} 個待審核的報帳單`
                        : `You have ${localReports.length} pending expense report(s)`}
                </p>
            </div>

            {/* ── 審核收件匣 ───────────────────────────── */}
            {localReports.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-14 text-center">
                    <Inbox className="h-6 w-6 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                        {language === "zh" ? "沒有待審核的報帳單" : "No pending expense reports"}
                    </p>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground/60">
                        {"// QUEUE EMPTY"}
                    </p>
                </div>
            ) : (
                <div className="rounded-lg border border-border bg-card overflow-hidden divide-y divide-border">
                    {localReports.map((report, index) => (
                        <article key={report.id} className="grid md:grid-cols-[1fr_auto]">
                            {/* 左：案件內容 */}
                            <div className="px-4 py-3 min-w-0">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <span className="font-mono text-xs text-primary/70 font-medium">
                                        {String(index + 1).padStart(2, "0")}
                                    </span>
                                    <h3 className="text-sm font-semibold truncate">{report.title}</h3>
                                    <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-medium ${getStatusTextColor(report.status)}`}>
                                        <span className={`status-dot ${getStatusDotColor(report.status)}`} />
                                        {getStatusLabel(report.status, language as Language)}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-muted-foreground font-mono">
                                    {report.submitter?.name || report.submitter?.email}
                                    <span className="mx-2 text-border">·</span>
                                    {formatDate(report.createdAt, language as Language)}
                                    <span className="mx-2 text-border">·</span>
                                    {report.items.length} {language === "zh" ? "筆項目" : "items"}
                                </p>

                                {/* 明細縮排預覽（前 3 筆） */}
                                <div className="mt-2.5 border-l-2 border-border pl-3 space-y-1.5">
                                    {report.items.slice(0, 3).map((item: any) => (
                                        <div key={item.id} className="flex items-center gap-2 text-sm min-w-0">
                                            {item.receiptUrl && (
                                                <ReceiptPreview src={item.receiptUrl} alt={item.description} size="sm" />
                                            )}
                                            <span className="text-muted-foreground truncate flex-1">{item.description}</span>
                                            {item.receiptUrl && (
                                                <Paperclip className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                                            )}
                                            <span className="font-mono text-xs tabular-nums shrink-0">${Number(item.amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {report.items.length > 3 && (
                                        <p className="font-mono text-[11px] text-muted-foreground/60">
                                            +{report.items.length - 3} {language === "zh" ? "更多項目" : "more items"}
                                        </p>
                                    )}
                                </div>

                                {/* 收款帳戶尾註 */}
                                {report.bankAccount && (
                                    <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-mono text-xs text-muted-foreground">
                                        <Building2 className="h-3.5 w-3.5 text-info shrink-0" />
                                        <span className="text-info">{language === "zh" ? "收款帳戶" : "Bank"}:</span>
                                        <span className="text-foreground">{report.bankAccount.bankName}</span>
                                        {report.bankAccount.branchName && <span>– {report.bankAccount.branchName}</span>}
                                        <span>
                                            {canViewFullBankAccount
                                                ? report.bankAccount.accountNumber
                                                : maskAccountNumber(report.bankAccount.accountNumber)}
                                        </span>
                                        <span className="text-border">·</span>
                                        <span>{report.bankAccount.accountHolder}</span>
                                    </div>
                                )}
                            </div>

                            {/* 右：操作艙 */}
                            <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 px-4 py-3 md:py-4 md:w-48 border-t md:border-t-0 md:border-l border-border bg-muted/30">
                                <p className="font-mono text-lg font-semibold tabular-nums">
                                    ${Number(report.totalAmount).toFixed(2)}
                                </p>
                                <div className="flex md:flex-col gap-2 md:w-full">
                                    <button
                                        onClick={() => handleApprove(report.id)}
                                        disabled={isPending && processingId === report.id}
                                        className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 md:w-full"
                                    >
                                        <Check className="h-4 w-4" />
                                        {language === "zh" ? "核准" : "Approve"}
                                    </button>
                                    <button
                                        onClick={() => handleReject(report.id)}
                                        disabled={isPending && processingId === report.id}
                                        className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md border border-danger/50 text-danger hover:bg-danger/10 transition-colors text-sm font-medium disabled:opacity-50 md:w-full"
                                    >
                                        <X className="h-4 w-4" />
                                        {language === "zh" ? "拒絕" : "Reject"}
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}
