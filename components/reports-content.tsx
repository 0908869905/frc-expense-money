"use client"

import { useLanguage } from "@/lib/language-context"
import { FileText, DollarSign, Clock, CheckCircle, XCircle, Edit2, Check, X, Trash2, Download, FileSpreadsheet } from "lucide-react"
import { useState, useTransition } from "react"
import { approveReport, rejectReport } from "@/app/actions/approvals"
import { updateReport, deleteReport } from "@/app/actions/expenses"
import { getReportsForExport, getItemsForExport } from "@/app/actions/export"
import { exportToCSV, exportToExcel, exportToExcelMultiSheet } from "@/lib/export-utils"

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

    const getStatusColor = (status: string) => {
        if (status === "PAID" || status === "APPROVED") return "text-green-600 bg-green-100"
        if (status === "REJECTED") return "text-red-600 bg-red-100"
        if (status === "DRAFT") return "text-gray-600 bg-gray-100"
        return "text-yellow-600 bg-yellow-100"
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, Record<string, string>> = {
            DRAFT: { zh: "草稿", en: "Draft" },
            PENDING_MANAGER: { zh: "待主管審核", en: "Pending Manager" },
            PENDING_FINANCE: { zh: "待財務審核", en: "Pending Finance" },
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
        { value: "DRAFT", label: language === "zh" ? "草稿" : "Draft" },
        { value: "PENDING_MANAGER", label: language === "zh" ? "待主管審核" : "Pending Manager" },
        { value: "PENDING_FINANCE", label: language === "zh" ? "待財務審核" : "Pending Finance" },
        { value: "PAID", label: language === "zh" ? "已付款" : "Paid" },
        { value: "REJECTED", label: language === "zh" ? "已拒絕" : "Rejected" }
    ]

    return (
        <div className="flex flex-col gap-6">
            {/* Header with Export Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {language === "zh" ? "所有報表" : "All Reports"}
                    </h1>
                    <p className="text-muted-foreground">
                        {language === "zh" ? "查看和管理所有報帳單" : "View and manage all expense reports"}
                    </p>
                </div>
                {canExport && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCSV}
                            disabled={isExporting}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md border bg-background hover:bg-muted transition-colors disabled:opacity-50"
                        >
                            <Download className="h-4 w-4" />
                            CSV
                        </button>
                        <button
                            onClick={handleExportExcel}
                            disabled={isExporting}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                            <FileSpreadsheet className="h-4 w-4" />
                            Excel
                        </button>
                    </div>
                )}
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {language === "zh" ? "總計" : "Total"}
                        </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{localReports.length}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">
                            {language === "zh" ? "待審核" : "Pending"}
                        </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{localReports.filter(r => r.status.includes("PENDING")).length}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">
                            {language === "zh" ? "已核准" : "Approved"}
                        </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{localReports.filter(r => r.status === "PAID").length}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-muted-foreground">
                            {language === "zh" ? "已拒絕" : "Rejected"}
                        </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{localReports.filter(r => r.status === "REJECTED").length}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {language === "zh" ? "總金額" : "Total"}
                        </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">${localReports.reduce((acc, r) => acc + Number(r.totalAmount), 0).toFixed(2)}</p>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b">
                {[
                    { key: "all", zh: "全部", en: "All" },
                    { key: "pending", zh: "待審核", en: "Pending" },
                    { key: "approved", zh: "已核准", en: "Approved" },
                    { key: "rejected", zh: "已拒絕", en: "Rejected" }
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setFilter(tab.key)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${filter === tab.key
                            ? "border-primary text-primary"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {tab[language as "zh" | "en"]}
                    </button>
                ))}
            </div>

            {/* Reports Table */}
            <div className="rounded-xl border bg-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "標題" : "Title"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "提交者" : "Submitter"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "日期" : "Date"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "金額" : "Amount"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "狀態" : "Status"}</th>
                            <th className="text-left p-4 font-medium">{language === "zh" ? "操作" : "Actions"}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredReports.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                    {language === "zh" ? "沒有報帳單" : "No expense reports"}
                                </td>
                            </tr>
                        ) : (
                            filteredReports.map((report) => (
                                <tr key={report.id} className="hover:bg-muted/20">
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
                                    <td className="p-4 text-muted-foreground">
                                        {report.submitter?.name || report.submitter?.email}
                                    </td>
                                    <td className="p-4 text-muted-foreground">
                                        {formatDate(report.createdAt)}
                                    </td>
                                    <td className="p-4 font-medium">
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
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
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
                                                        className="p-1.5 rounded text-green-600 hover:bg-green-50"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setEditingId(null)}
                                                        className="p-1.5 rounded text-red-600 hover:bg-red-50"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {/* Approve/Reject for pending reports */}
                                                    {report.status.includes("PENDING") && (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(report.id)}
                                                                disabled={isPending}
                                                                className="p-1.5 rounded text-green-600 hover:bg-green-50"
                                                                title={language === "zh" ? "批准" : "Approve"}
                                                            >
                                                                <CheckCircle className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(report.id)}
                                                                disabled={isPending}
                                                                className="p-1.5 rounded text-red-600 hover:bg-red-50"
                                                                title={language === "zh" ? "拒絕" : "Reject"}
                                                            >
                                                                <XCircle className="h-4 w-4" />
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
                                                                className="p-1.5 rounded text-red-600 hover:bg-red-50"
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
