"use client"

import { useLanguage } from "@/lib/language-context"
import { FileText, DollarSign, Clock, CheckCircle, XCircle } from "lucide-react"
import { useState } from "react"

interface ReportsContentProps {
    reports: any[]
    stats: {
        total: number
        pending: number
        approved: number
        rejected: number
        totalAmount: number
    }
}

export function ReportsContent({ reports, stats }: ReportsContentProps) {
    const { language } = useLanguage()
    const [filter, setFilter] = useState<string>("all")

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(language === 'zh' ? 'zh-TW' : 'en-US')
    }

    const getStatusColor = (status: string) => {
        if (status === "PAID" || status === "APPROVED") return "text-green-600 bg-green-100"
        if (status === "REJECTED") return "text-red-600 bg-red-100"
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

    const filteredReports = reports.filter(r => {
        if (filter === "all") return true
        if (filter === "pending") return r.status.includes("PENDING")
        if (filter === "approved") return r.status === "PAID" || r.status === "APPROVED"
        if (filter === "rejected") return r.status === "REJECTED"
        return true
    })

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {language === "zh" ? "所有報表" : "All Reports"}
                </h1>
                <p className="text-muted-foreground">
                    {language === "zh" ? "查看和管理所有報帳單" : "View and manage all expense reports"}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-5">
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {language === "zh" ? "總計" : "Total"}
                        </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.total}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm text-muted-foreground">
                            {language === "zh" ? "待審核" : "Pending"}
                        </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.pending}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-muted-foreground">
                            {language === "zh" ? "已核准" : "Approved"}
                        </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.approved}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-muted-foreground">
                            {language === "zh" ? "已拒絕" : "Rejected"}
                        </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">{stats.rejected}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                            {language === "zh" ? "總金額" : "Total"}
                        </span>
                    </div>
                    <p className="text-2xl font-bold mt-1">${stats.totalAmount.toFixed(2)}</p>
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
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredReports.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                                    {language === "zh" ? "沒有報帳單" : "No expense reports"}
                                </td>
                            </tr>
                        ) : (
                            filteredReports.map((report) => (
                                <tr key={report.id} className="hover:bg-muted/20">
                                    <td className="p-4">
                                        <p className="font-medium">{report.title}</p>
                                        <p className="text-sm text-muted-foreground">{report.items.length} {language === "zh" ? "筆項目" : "items"}</p>
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
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(report.status)}`}>
                                            {getStatusLabel(report.status)}
                                        </span>
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
