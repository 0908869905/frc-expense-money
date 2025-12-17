"use client"

import { useLanguage } from "@/lib/language-context"
import { Check, X, Eye, Clock } from "lucide-react"
import { useState, useTransition } from "react"
import { approveReport, rejectReport } from "@/app/actions/approvals"

interface ApprovalsContentProps {
    reports: any[]
    userRole: string
}

export function ApprovalsContent({ reports, userRole }: ApprovalsContentProps) {
    const { language } = useLanguage()
    const [isPending, startTransition] = useTransition()
    const [processingId, setProcessingId] = useState<string | null>(null)
    const [localReports, setLocalReports] = useState(reports)

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US')
    }

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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {language === "zh" ? "審核報帳單" : "Approvals"}
                </h1>
                <p className="text-muted-foreground">
                    {language === "zh"
                        ? `你有 ${localReports.length} 個待審核的報帳單`
                        : `You have ${localReports.length} pending expense report(s)`}
                </p>
            </div>

            {/* Pending Reports */}
            <div className="space-y-4">
                {localReports.length === 0 ? (
                    <div className="rounded-xl border bg-card p-8 text-center">
                        <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                            {language === "zh" ? "沒有待審核的報帳單" : "No pending expense reports"}
                        </p>
                    </div>
                ) : (
                    localReports.map((report) => (
                        <div key={report.id} className="rounded-xl border bg-card overflow-hidden">
                            <div className="p-4 border-b bg-muted/30 flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">{report.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {language === "zh" ? "提交者" : "Submitted by"}: {report.submitter?.name || report.submitter?.email}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {formatDate(report.createdAt)} • {report.items.length} {language === "zh" ? "筆項目" : "items"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">${Number(report.totalAmount).toFixed(2)}</p>
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                                        {report.status.replace("_", " ")}
                                    </span>
                                </div>
                            </div>

                            {/* Items Preview */}
                            <div className="p-4 border-b">
                                <p className="text-sm font-medium mb-2">
                                    {language === "zh" ? "費用明細" : "Expense Items"}:
                                </p>
                                <div className="space-y-1">
                                    {report.items.slice(0, 3).map((item: any) => (
                                        <div key={item.id} className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">{item.description}</span>
                                            <span>${Number(item.amount).toFixed(2)}</span>
                                        </div>
                                    ))}
                                    {report.items.length > 3 && (
                                        <p className="text-xs text-muted-foreground">
                                            +{report.items.length - 3} {language === "zh" ? "更多項目" : "more items"}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="p-4 flex gap-3 justify-end">
                                <button
                                    onClick={() => handleReject(report.id)}
                                    disabled={isPending && processingId === report.id}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-destructive text-destructive hover:bg-destructive/10 transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    <X className="h-4 w-4" />
                                    {language === "zh" ? "拒絕" : "Reject"}
                                </button>
                                <button
                                    onClick={() => handleApprove(report.id)}
                                    disabled={isPending && processingId === report.id}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium disabled:opacity-50"
                                >
                                    <Check className="h-4 w-4" />
                                    {language === "zh" ? "核准" : "Approve"}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
