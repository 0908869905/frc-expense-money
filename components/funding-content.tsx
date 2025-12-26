"use client"

import { useState, useTransition } from "react"
import { useLanguage } from "@/lib/language-context"
import { Wallet, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Loader2, X, Search } from "lucide-react"
import { deleteFundingRecord, updateFundingRecord, createFundingRecord, FundingState } from "@/app/actions/funding"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormState } from "react-dom"

interface FundingRecord {
    id: string
    title: string
    amount: number
    type: string
    source: string | null
    description: string | null
    date: Date | string
    recordedBy: string
    createdAt: Date | string
}

interface FundingContentProps {
    fundingRecords: FundingRecord[]
    financialSummary: {
        totalIncome: number
        totalExpense: number
        currentBalance: number
    }
}

const FUNDING_TYPES = [
    { value: "SPONSORSHIP", label: "贊助", labelEn: "Sponsorship" },
    { value: "DONATION", label: "捐款", labelEn: "Donation" },
    { value: "GRANT", label: "補助金", labelEn: "Grant" },
    { value: "FUNDRAISING", label: "募款活動", labelEn: "Fundraising" },
    { value: "OTHER", label: "其他", labelEn: "Other" },
]

export function FundingContent({ fundingRecords, financialSummary }: FundingContentProps) {
    const { language } = useLanguage()
    const [isPending, startTransition] = useTransition()
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingRecord, setEditingRecord] = useState<FundingRecord | null>(null)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    // Add form state
    const [addState, addFormAction] = useFormState<FundingState, FormData>(
        createFundingRecord,
        { success: false, message: null }
    )

    // Edit form state
    const [editForm, setEditForm] = useState({
        title: "",
        amount: 0,
        type: "SPONSORSHIP",
        source: "",
        description: "",
        date: "",
    })

    const t = (zh: string, en: string) => language === "zh" ? zh : en

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("zh-TW", {
            style: "currency",
            currency: "TWD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const formatDate = (date: Date | string) => {
        return new Date(date).toLocaleDateString("zh-TW")
    }

    const getTypeLabel = (type: string) => {
        const found = FUNDING_TYPES.find(t => t.value === type)
        return found ? (language === "zh" ? found.label : found.labelEn) : type
    }

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3000)
    }

    // Filter records
    const filteredRecords = fundingRecords.filter((record) => {
        const matchesSearch =
            record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (record.source?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
        const matchesType = typeFilter === "all" || record.type === typeFilter
        return matchesSearch && matchesType
    })

    const handleDelete = (id: string) => {
        if (!confirm(t("確定要刪除此資金記錄嗎？", "Delete this funding record?"))) return
        startTransition(async () => {
            const result = await deleteFundingRecord(id)
            if (result.success) {
                showMessage("success", result.message || t("已刪除", "Deleted"))
                window.location.reload()
            } else {
                showMessage("error", result.message || t("刪除失敗", "Delete failed"))
            }
        })
    }

    const openEditModal = (record: FundingRecord) => {
        setEditingRecord(record)
        setEditForm({
            title: record.title,
            amount: record.amount,
            type: record.type,
            source: record.source || "",
            description: record.description || "",
            date: new Date(record.date).toISOString().split("T")[0],
        })
    }

    const handleUpdate = () => {
        if (!editingRecord) return
        startTransition(async () => {
            const result = await updateFundingRecord(editingRecord.id, {
                title: editForm.title,
                amount: editForm.amount,
                type: editForm.type,
                source: editForm.source || undefined,
                description: editForm.description || undefined,
                date: new Date(editForm.date),
            })
            if (result.success) {
                showMessage("success", result.message || t("已更新", "Updated"))
                setEditingRecord(null)
                window.location.reload()
            } else {
                showMessage("error", result.message || t("更新失敗", "Update failed"))
            }
        })
    }

    const handleAddSubmit = (formData: FormData) => {
        startTransition(() => {
            addFormAction(formData)
        })
    }

    // Check add success
    if (addState.success && showAddModal) {
        setTimeout(() => {
            setShowAddModal(false)
            window.location.reload()
        }, 500)
    }

    const isPositive = financialSummary.currentBalance >= 0

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Wallet className="h-8 w-8" />
                        {t("資金記錄", "Funding Records")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("管理贊助、捐款和其他收入來源", "Manage sponsorships, donations, and other income sources")}
                    </p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("新增資金", "Add Funding")}
                </Button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-6">
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("目前餘額", "Current Balance")}</h3>
                    <p className={`text-3xl font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(financialSummary.currentBalance)}
                    </p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <h3 className="text-sm font-medium text-muted-foreground">{t("總收入", "Total Income")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.totalIncome)}</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <h3 className="text-sm font-medium text-muted-foreground">{t("總支出", "Total Expense")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(financialSummary.totalExpense)}</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder={t("搜尋標題或來源...", "Search title or source...")}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg bg-background"
                    />
                </div>
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg bg-background"
                >
                    <option value="all">{t("所有類型", "All Types")}</option>
                    {FUNDING_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                            {language === "zh" ? type.label : type.labelEn}
                        </option>
                    ))}
                </select>
            </div>

            {/* Records Table */}
            <div className="rounded-xl border bg-card overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-4 font-medium">{t("日期", "Date")}</th>
                            <th className="text-left p-4 font-medium">{t("標題", "Title")}</th>
                            <th className="text-left p-4 font-medium">{t("類型", "Type")}</th>
                            <th className="text-left p-4 font-medium">{t("來源", "Source")}</th>
                            <th className="text-right p-4 font-medium">{t("金額", "Amount")}</th>
                            <th className="text-left p-4 font-medium">{t("記錄者", "Recorded By")}</th>
                            <th className="text-left p-4 font-medium">{t("操作", "Actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                    <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    {t("沒有資金記錄", "No funding records")}
                                </td>
                            </tr>
                        ) : (
                            filteredRecords.map((record) => (
                                <tr key={record.id} className="hover:bg-muted/20">
                                    <td className="p-4 text-muted-foreground">{formatDate(record.date)}</td>
                                    <td className="p-4">
                                        <div>
                                            <p className="font-medium">{record.title}</p>
                                            {record.description && (
                                                <p className="text-sm text-muted-foreground truncate max-w-xs">{record.description}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                                            {getTypeLabel(record.type)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{record.source || "-"}</td>
                                    <td className="p-4 text-right">
                                        <span className="font-semibold text-green-600">{formatCurrency(record.amount)}</span>
                                    </td>
                                    <td className="p-4 text-muted-foreground text-sm">{record.recordedBy}</td>
                                    <td className="p-4">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEditModal(record)}
                                                className="p-1.5 rounded hover:bg-muted"
                                                title={t("編輯", "Edit")}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                disabled={isPending}
                                                className="p-1.5 rounded hover:bg-red-50 text-red-600"
                                                title={t("刪除", "Delete")}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background rounded-xl border shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Plus className="h-5 w-5" />
                                {t("新增資金記錄", "Add Funding Record")}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setShowAddModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <form action={handleAddSubmit} className="p-4 space-y-4">
                            {addState.message && (
                                <div className={`p-3 rounded-lg text-sm ${addState.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                    {addState.message}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="title">{t("標題", "Title")} *</Label>
                                <Input id="title" name="title" placeholder={t("例如：XX公司贊助", "e.g. XX Corp Sponsorship")} required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">{t("金額 (TWD)", "Amount (TWD)")} *</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="10000" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">{t("類型", "Type")} *</Label>
                                <select id="type" name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                                    {FUNDING_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {language === "zh" ? type.label : type.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="source">{t("來源", "Source")}</Label>
                                <Input id="source" name="source" placeholder={t("贊助者名稱", "Sponsor name")} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">{t("入帳日期", "Date")}</Label>
                                <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{t("備註", "Notes")}</Label>
                                <textarea id="description" name="description" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder={t("補充說明...", "Additional notes...")} />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                                    {t("取消", "Cancel")}
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isPending}>
                                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("提交中...", "Submitting...")}</> : t("確認新增", "Add")}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background rounded-xl border shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Edit2 className="h-5 w-5" />
                                {t("編輯資金記錄", "Edit Funding Record")}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setEditingRecord(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">{t("標題", "Title")}</Label>
                                <Input id="edit-title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-amount">{t("金額", "Amount")}</Label>
                                <Input id="edit-amount" type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-type">{t("類型", "Type")}</Label>
                                <select id="edit-type" value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    {FUNDING_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {language === "zh" ? type.label : type.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-source">{t("來源", "Source")}</Label>
                                <Input id="edit-source" value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-date">{t("日期", "Date")}</Label>
                                <Input id="edit-date" type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description">{t("備註", "Notes")}</Label>
                                <textarea id="edit-description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingRecord(null)}>
                                    {t("取消", "Cancel")}
                                </Button>
                                <Button type="button" className="flex-1" onClick={handleUpdate} disabled={isPending}>
                                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("更新中...", "Updating...")}</> : t("確認更新", "Update")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
