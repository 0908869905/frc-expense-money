"use client"

import { useLanguage } from "@/lib/language-context"
import { FileText, DollarSign, Clock, CheckCircle, XCircle, Edit2, Check, X, Trash2, Download, FileSpreadsheet, RotateCcw } from "lucide-react"
import { useState, useTransition } from "react"
import { approveReport, rejectReport, returnForRevision } from "@/app/actions/approvals"
import { updateReport, deleteReport } from "@/app/actions/expenses"
import { getReportsForExport, getItemsForExport } from "@/app/actions/export"
import { exportToCSV, exportToExcel, exportToExcelMultiSheet } from "@/lib/export-utils"
import { getStatusDotColor, getStatusTextColor, getDepartmentLabel as getDeptLabel } from "@/lib/constants/expense-status"

interface ReportsContentProps {
    reports: any[]
    stats: {
        total: number
        pending: number
        approved: number
        rejected: number
        totalAmount: number
    }
    userRole: string
}

export function ReportsContent({ reports, stats, userRole }: ReportsContentProps) {
    const { language } = useLanguage()
    const [filter, setFilter] = useState<string>("all")
    const [isPending, startTransition] = useTransition()
    const [localReports, setLocalReports] = useState(reports)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editData, setEditData] = useState<{ title: string; status: string }>({ title: "", status: "" })
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)
    const [isExporting, setIsExporting] = useState(false)

    const isAdmin = userRole === "ADMIN"
    const canExport = userRole === "FINANCE" || userRole === "ADMIN"

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US')
    }

    // 狀態指示點（APPROVED 為舊資料相容值）
    const statusDot = (status: string) =>
        status === "APPROVED" ? "bg-ok" : getStatusDotColor(status)
    const statusText = (status: string) =>
        status === "APPROVED" ? "text-ok" : getStatusTextColor(status)

    const getStatusLabel = (status: string) => {
        const labels: Record<string, Record<string, string>> = {
            PENDING_MANAGER: { zh: "待主管審核", en: "Pending Manager" },
            PENDING_FINANCE: { zh: "待財務審核", en: "Pending Finance" },
            RETURNED: { zh: "已退回", en: "Returned" },
            APPROVED: { zh: "已核准", en: "Approved" },
            REJECTED: { zh: "已拒絕", en: "Rejected" },
            PAID: { zh: "已付款", en: "Paid" }
        }
        return labels[status]?.[language] || status
    }

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3000)
    }

    const getDepartmentLabel = (dept: string) => getDeptLabel(dept, language as "zh" | "en")

    // 匯出為 CSV
    const handleExportCSV = async () => {
        setIsExporting(true)
        try {
            const data = await getReportsForExport()
            if (data.length === 0) {
                showMessage("error", language === "zh" ? "沒有資料可匯出" : "No data to export")
                return
            }
            const filename = `expense_reports_${new Date().toISOString().split("T")[0]}`
            exportToCSV(data, filename)
            showMessage("success", language === "zh" ? "CSV 匯出成功" : "CSV exported")
        } catch (error) {
            showMessage("error", language === "zh" ? "匯出失敗" : "Export failed")
        } finally {
            setIsExporting(false)
        }
    }

    // 匯出為 Excel
    const handleExportExcel = async () => {
        setIsExporting(true)
        try {
            const [reports, items] = await Promise.all([
                getReportsForExport(),
                getItemsForExport()
            ])
            if (reports.length === 0) {
                showMessage("error", language === "zh" ? "沒有資料可匯出" : "No data to export")
                return
            }
            const filename = `expense_reports_${new Date().toISOString().split("T")[0]}`
            exportToExcelMultiSheet([
                { name: language === "zh" ? "報帳單" : "Reports", data: reports },
                { name: language === "zh" ? "費用明細" : "Items", data: items }
            ], filename)
            showMessage("success", language === "zh" ? "Excel 匯出成功" : "Excel exported")
        } catch (error) {
            showMessage("error", language === "zh" ? "匯出失敗" : "Export failed")
        } finally {
            setIsExporting(false)
        }
    }

    const handleApprove = async (reportId: string) => {
        startTransition(async () => {
            try {
                await approveReport(reportId)
                // Update local state
                setLocalReports(prev => prev.map(r => {
                    if (r.id === reportId) {
                        const newStatus = r.status === "PENDING_MANAGER" ? "PENDING_FINANCE" : "PAID"
                        return { ...r, status: newStatus }
                    }
                    return r
                }))
                showMessage("success", language === "zh" ? "已批准" : "Approved")
            } catch (error: any) {
                showMessage("error", error.message)
            }
        })
    }

    const handleReject = async (reportId: string) => {
        const reason = prompt(language === "zh" ? "請輸入拒絕原因：" : "Please enter rejection reason:")
        if (!reason) return

        startTransition(async () => {
            try {
                await rejectReport(reportId, reason)
                setLocalReports(prev => prev.map(r =>
                    r.id === reportId ? { ...r, status: "REJECTED" } : r
                ))
                showMessage("success", language === "zh" ? "已拒絕" : "Rejected")
            } catch (error: any) {
                showMessage("error", error.message)
            }
        })
    }

    const handleEdit = (report: any) => {
        setEditingId(report.id)
        setEditData({ title: report.title, status: report.status })
    }

    const handleSaveEdit = async (reportId: string) => {
        startTransition(async () => {
            const result = await updateReport(reportId, editData)
            if (result.success) {
                setLocalReports(prev => prev.map(r =>
                    r.id === reportId ? { ...r, ...editData } : r
                ))
                setEditingId(null)
                showMessage("success", language === "zh" ? "已更新" : "Updated")
            } else {
                showMessage("error", result.message || "Failed")
            }
        })
    }

    const handleDelete = async (reportId: string) => {
        if (!confirm(language === "zh" ? "確定要刪除此報帳單嗎？" : "Are you sure you want to delete this report?")) {
            return
        }
        startTransition(async () => {
            const result = await deleteReport(reportId)
            if (result.success) {
                setLocalReports(prev => prev.filter(r => r.id !== reportId))
                showMessage("success", language === "zh" ? "已刪除" : "Deleted")
            } else {
                showMessage("error", result.message || "Failed")
            }
        })
    }

    const filteredReports = localReports.filter(r => {
        if (filter === "all") return true
        if (filter === "pending") return r.status.includes("PENDING")
        if (filter === "approved") return r.status === "PAID" || r.status === "APPROVED"
        if (filter === "rejected") return r.status === "REJECTED"
        return true
    })

    const statusOptions = [
        { value: "PENDING_MANAGER", label: language === "zh" ? "待主管審核" : "Pending Manager" },
        { value: "PENDING_FINANCE", label: language === "zh" ? "待財務審核" : "Pending Finance" },
        { value: "RETURNED", label: language === "zh" ? "已退回" : "Returned" },
        { value: "PAID", label: language === "zh" ? "已付款" : "Paid" },
        { value: "REJECTED", label: language === "zh" ? "已拒絕" : "Rejected" }
    ]

    const handleReturn = async (reportId: string) => {
        const reason = prompt(language === "zh" ? "請輸入退回原因：" : "Please enter return reason:")
        if (!reason) return

        startTransition(async () => {
            try {
                await returnForRevision(reportId, reason)
                setLocalReports(prev => prev.map(r =>
                    r.id === reportId ? { ...r, status: "RETURNED" } : r
                ))
                showMessage("success", language === "zh" ? "已退回修改" : "Returned for revision")
            } catch (error: any) {
                showMessage("error", error.message)
            }
        })
    }

    return (
        <div className="flex flex-col gap-6">
            {/* ── 期別標頭 ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-5">
                <div className="space-y-1.5">
                    <p className="ledger-label text-primary">Register</p>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {language === "zh" ? "所有報表" : "All Reports"}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {language === "zh" ? "查看和管理所有報帳單" : "View and manage all expense reports"}
                    </p>
                </div>
                {canExport && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCSV}
                            disabled={isExporting}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />
                            CSV
                        </button>
                        <button
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border bg-card hover:bg-accent transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel
                        </button>
                    </div>
                )}
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-md border text-sm ${message.type === "success" ? "bg-ok/10 text-ok border-ok/30" : "bg-danger/10 text-danger border-danger/30"}`}>
                    {message.text}
                </div>
            )}

            {/* ── 合計帶：hairline 分欄 ─────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 rounded-lg border border-border bg-card overflow-hidden">
                <div className="p-4 border-b md:border-b-0 border-r border-border">
                    <span className="ledger-label flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5" />
                        {language === "zh" ? "總計" : "Total"}
                    </span>
                    <p className="text-2xl font-semibold tech-number mt-2">{localReports.length}</p>
                </div>
                <div className="p-4 border-b md:border-b-0 md:border-r border-border">
                    <span className="ledger-label flex items-center gap-2">
                        <span className="status-dot bg-warn" />
                        {language === "zh" ? "待審核" : "Pending"}
                    </span>
                    <p className="text-2xl font-semibold tech-number mt-2">{localReports.filter(r => r.status.includes("PENDING")).length}</p>
                </div>
                <div className="p-4 border-b md:border-b-0 border-r border-border">
                    <span className="ledger-label flex items-center gap-2">
                        <span className="status-dot bg-ok" />
                        {language === "zh" ? "已核准" : "Approved"}
                    </span>
                    <p className="text-2xl font-semibold tech-number mt-2">{localReports.filter(r => r.status === "PAID").length}</p>
                </div>
                <div className="p-4 border-b md:border-b-0 md:border-r border-border">
                    <span className="ledger-label flex items-center gap-2">
                        <span className="status-dot bg-danger" />
                        {language === "zh" ? "已拒絕" : "Rejected"}
                    </span>
                    <p className="text-2xl font-semibold tech-number mt-2">{localReports.filter(r => r.status === "REJECTED").length}</p>
                </div>
                <div className="p-4 col-span-2 md:col-span-1">
                    <span className="ledger-label flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5" />
                        {language === "zh" ? "總金額" : "Total"}
                    </span>
                    <p className="text-2xl font-semibold tech-number mt-2">${localReports.reduce((acc, r) => acc + Number(r.totalAmount), 0).toFixed(2)}</p>
                </div>
            </div>

            {/* ── 登記簿：工具列 + 表格一體 ─────────────── */}
            <div className="rounded-lg border bg-card overflow-hidden">
                {/* 工具列：分段篩選器 */}
                <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border">
                    <div className="inline-flex rounded-md border border-border bg-card p-0.5">
                        {[
                            { key: "all", zh: "全部", en: "All" },
                            { key: "pending", zh: "待審核", en: "Pending" },
                            { key: "approved", zh: "已核准", en: "Approved" },
                            { key: "rejected", zh: "已拒絕", en: "Rejected" }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${filter === tab.key
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                {tab[language as "zh" | "en"]}
                            </button>
                        ))}
                    </div>
                    <span className="ledger-label hidden sm:inline">
                        {filteredReports.length} {language === "zh" ? "筆" : "entries"}
                    </span>
                </div>
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-4 py-2.5 ledger-label">{language === "zh" ? "標題" : "Title"}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{language === "zh" ? "組別" : "Dept"}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{language === "zh" ? "提交者" : "Submitter"}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{language === "zh" ? "日期" : "Date"}</th>
                            <th className="text-right px-4 py-2.5 ledger-label">{language === "zh" ? "金額" : "Amount"}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{language === "zh" ? "狀態" : "Status"}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{language === "zh" ? "操作" : "Actions"}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredReports.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                    {language === "zh" ? "沒有報帳單" : "No expense reports"}
                                </td>
                            </tr>
                        ) : (
                            filteredReports.map((report) => (
                                <tr key={report.id} className="hover:bg-accent/60 transition-colors">
                                    <td className="p-4">
                                        {editingId === report.id ? (
                                            <input
                                                type="text"
                                                value={editData.title}
                                                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                                                className="px-2 py-1 border rounded w-full"
                                            />
                                        ) : (
                                            <>
                                                <p className="font-medium">{report.title}</p>
                                                <p className="text-sm text-muted-foreground">{report.items.length} {language === "zh" ? "筆項目" : "items"}</p>
                                            </>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        {report.department && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[11px] text-muted-foreground">
                                                {getDepartmentLabel(report.department)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {report.submitter?.name || report.submitter?.email}
                                    </td>
                                    <td className="p-4 text-muted-foreground font-mono text-xs">
                                        {formatDate(report.createdAt)}
                                    </td>
                                    <td className="p-4 font-medium font-mono tabular-nums text-right">
                                        ${Number(report.totalAmount).toFixed(2)}
                                    </td>
                                    <td className="p-4">
                                        {editingId === report.id ? (
                                            <select
                                                value={editData.status}
                                                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                                className="px-2 py-1 border rounded text-sm"
                                            >
                                                {statusOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`inline-flex items-center gap-1.5 font-mono text-xs font-medium ${statusText(report.status)}`}>
                                                <span className={`status-dot ${statusDot(report.status)}`} />
                                                {getStatusLabel(report.status)}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-2">
                                            {editingId === report.id ? (
                                                <>
                                                    <button
                                                        onClick={() => handleSaveEdit(report.id)}
                                                        disabled={isPending}
                                                        className="p-1.5 rounded text-ok hover:bg-ok/10 transition-colors"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Approve/Reject/Return for pending reports */}
                                                    {report.status.includes("PENDING") && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(report.id)}
                                                                disabled={isPending}
                                                                className="p-1.5 rounded text-ok hover:bg-ok/10 transition-colors"
                                                                title={language === "zh" ? "批准" : "Approve"}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(report.id)}
                                                                disabled={isPending}
                                                                className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors"
                                                                title={language === "zh" ? "拒絕" : "Reject"}
                                                            >
                                                                <XCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReturn(report.id)}
                                                                disabled={isPending}
                                                                className="p-1.5 rounded text-warn hover:bg-warn/10 transition-colors"
                                                                title={language === "zh" ? "退回修改" : "Return for Revision"}
                                                            >
                                                                <RotateCcw className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                    {/* Edit for Admin */}
                                                    {isAdmin && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(report)}
                                                                className="p-1.5 rounded hover:bg-muted"
                                                                title={language === "zh" ? "編輯" : "Edit"}
                                                            >
                                                                <Edit2 className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(report.id)}
                                                                disabled={isPending}
                                                                className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors"
                                                                title={language === "zh" ? "刪除" : "Delete"}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
