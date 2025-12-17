"use client"

import { useLanguage } from "@/lib/language-context"
import Link from "next/link"
import { useState, useTransition } from "react"
import { submitReport, deleteReport } from "@/app/actions/expenses"
import { Send, Trash2, Clock, CheckCircle, XCircle, FileText } from "lucide-react"

interface ExpensesContentProps {
    reports: any[]
    totalReports: number
    totalItems: number
    totalAmount: number
}

export function ExpensesContent({ reports, totalReports, totalItems, totalAmount }: ExpensesContentProps) {
    const { t, language } = useLanguage()
    const [isPending, startTransition] = useTransition()
    const [localReports, setLocalReports] = useState(reports)
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US')
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "DRAFT": return "bg-gray-100 text-gray-700"
            case "PENDING_MANAGER": return "bg-yellow-100 text-yellow-700"
            case "PENDING_FINANCE": return "bg-blue-100 text-blue-700"
            case "PAID": return "bg-green-100 text-green-700"
            case "REJECTED": return "bg-red-100 text-red-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, Record<string, string>> = {
            DRAFT: { zh: "草稿", en: "Draft" },
            PENDING_MANAGER: { zh: "待主管審核", en: "Pending Manager" },
            PENDING_FINANCE: { zh: "待財務審核", en: "Pending Finance" },
            PAID: { zh: "已付款", en: "Paid" },
            REJECTED: { zh: "已拒絕", en: "Rejected" }
        }
        return labels[status]?.[language] || status
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "DRAFT": return <FileText className="h-4 w-4" />
            case "PENDING_MANAGER":
            case "PENDING_FINANCE": return <Clock className="h-4 w-4" />
            case "PAID": return <CheckCircle className="h-4 w-4" />
            case "REJECTED": return <XCircle className="h-4 w-4" />
            default: return <FileText className="h-4 w-4" />
        }
    }

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3000)
    }

    const handleSubmit = async (reportId: string) => {
        if (!confirm(language === "zh"
            ? "確定要提交此報帳單嗎？提交後將無法編輯。"
            : "Are you sure you want to submit this report? It cannot be edited after submission.")) {
            return
        }

        startTransition(async () => {
            const result = await submitReport(reportId)
            if (result.success) {
                setLocalReports(prev => prev.map(r =>
                    r.id === reportId ? { ...r, status: "PENDING_MANAGER" } : r
                ))
                showMessage("success", result.message || (language === "zh" ? "報帳單已提交" : "Report submitted"))
            } else {
                showMessage("error", result.message || (language === "zh" ? "提交失敗" : "Failed to submit"))
            }
        })
    }

    const handleDelete = async (reportId: string) => {
        if (!confirm(language === "zh"
            ? "確定要刪除此報帳單嗎？此操作無法復原。"
            : "Are you sure you want to delete this report? This action cannot be undone.")) {
            return
        }

        startTransition(async () => {
            const result = await deleteReport(reportId)
            if (result.success) {
                setLocalReports(prev => prev.filter(r => r.id !== reportId))
                showMessage("success", result.message || (language === "zh" ? "報帳單已刪除" : "Report deleted"))
            } else {
                showMessage("error", result.message || (language === "zh" ? "刪除失敗" : "Failed to delete"))
            }
        })
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

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">{t("total_reports")}</h3>
                    <p className="text-2xl font-bold">{localReports.length}</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">{t("total_items")}</h3>
                    <p className="text-2xl font-bold">{localReports.reduce((acc, r) => acc + r.items.length, 0)}</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <h3 className="text-sm font-medium text-muted-foreground">{t("total_amount")}</h3>
                    <p className="text-2xl font-bold">${localReports.reduce((acc, r) => acc + Number(r.totalAmount), 0).toFixed(2)}</p>
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
                                    <div className="flex gap-4 text-sm text-muted-foreground mt-1 items-center">
                                        <span>{t("created_on")}: {formatDate(report.createdAt)}</span>
                                        <span>•</span>
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                            {getStatusIcon(report.status)}
                                            {getStatusLabel(report.status)}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-4">
                                    <div>
                                        <p className="text-2xl font-bold">${Number(report.totalAmount).toFixed(2)}</p>
                                        <p className="text-sm text-muted-foreground">{report.items.length} {t("items_count")}</p>
                                    </div>
                                    {/* Action Buttons for Draft */}
                                    {report.status === "DRAFT" && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleSubmit(report.id)}
                                                disabled={isPending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-50"
                                                title={language === "zh" ? "提交審核" : "Submit for approval"}
                                            >
                                                <Send className="h-4 w-4" />
                                                {language === "zh" ? "提交" : "Submit"}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(report.id)}
                                                disabled={isPending}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-destructive text-destructive hover:bg-destructive/10 text-sm font-medium disabled:opacity-50"
                                                title={language === "zh" ? "刪除" : "Delete"}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expense Items */}
                            {report.items.length > 0 && (
                                <div className="divide-y">
                                    {report.items.map((item: any) => (
                                        <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/20">
                                            <div className="flex-1">
                                                <p className="font-medium">{item.description}</p>
                                                <div className="flex gap-3 text-sm text-muted-foreground mt-1">
                                                    <span className="px-2 py-0.5 bg-muted rounded-full text-xs">
                                                        {item.category}
                                                    </span>
                                                    <span>{formatDate(item.date)}</span>
                                                </div>
                                            </div>
                                            <p className="font-semibold text-lg">${Number(item.amount).toFixed(2)}</p>
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
