"use client"

import { useState, useTransition } from "react"
import { useLanguage } from "@/lib/language-context"
import { Wallet, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Loader2, X, Search } from "lucide-react"
import { deleteFundingRecord, updateFundingRecord, createFundingRecord, FundingState } from "@/app/actions/funding"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFormState } from "react-dom"
import { useMessage } from "@/hooks/useMessage"
import type { Language } from "@/lib/constants/expense-status"
import {
    FUNDING_TYPES,
    getTypeLabel,
    formatCurrency,
    formatDate,
    type FundingRecord,
} from "@/lib/constants/funding"

interface FundingContentProps {
    fundingRecords: FundingRecord[]
    financialSummary: {
        totalIncome: number
        totalExpense: number
        currentBalance: number
    }
}

export function FundingContent({ fundingRecords, financialSummary }: FundingContentProps) {
    const { language } = useLanguage()
    const [isPending, startTransition] = useTransition()
    const [searchTerm, setSearchTerm] = useState("")
    const [typeFilter, setTypeFilter] = useState<string>("all")
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingRecord, setEditingRecord] = useState<FundingRecord | null>(null)
    const { message, showMessage } = useMessage()

    // Add form state
    const [addState, addFormAction] = useFormState<FundingState, FormData>(
        createFundingRecord,
        { success: false, message: null }
    )

    // Add form type tracking for custom type input
    const [addFormType, setAddFormType] = useState("SPONSORSHIP")
    const [addCustomType, setAddCustomType] = useState("")

    // Edit form state
    const [editForm, setEditForm] = useState({
        title: "",
        amount: 0,
        type: "SPONSORSHIP",
        customType: "",
        source: "",
        description: "",
        date: "",
    })

    const t = (zh: string, en: string) => language === "zh" ? zh : en

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
            customType: "",
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
            {/* ── 期別標頭 ─────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-border pb-5">
                <div className="space-y-1.5">
                    <p className="ledger-label text-primary">Statement</p>
                    <h1 className="text-2xl font-semibold tracking-tight">
                        {t("資金記錄", "Funding Records")}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {t("管理贊助、捐款和其他收入來源", "Manage sponsorships, donations, and other income sources")}
                    </p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="gap-2 shrink-0">
                    <Plus className="h-4 w-4" />
                    {t("新增資金", "Add Funding")}
                </Button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-md border text-sm ${message.type === "success" ? "bg-ok/10 text-ok border-ok/30" : "bg-danger/10 text-danger border-danger/30"}`}>
                    {message.text}
                </div>
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 rounded-lg border border-border bg-card overflow-hidden">
                <div className="p-4 border-b sm:border-b-0 sm:border-r border-border">
                    <h3 className="ledger-label">{t("目前餘額", "Current Balance")}</h3>
                    <p className={`mt-2 text-2xl font-semibold tech-number ${isPositive ? "text-foreground" : "text-danger"}`}>
                        {formatCurrency(financialSummary.currentBalance)}
                    </p>
                </div>
                <div className="p-4 border-b sm:border-b-0 sm:border-r border-border">
                    <h3 className="ledger-label flex items-center gap-2">
                        <TrendingUp className="h-3.5 w-3.5 text-ok" />
                        {t("總收入", "Total Income")}
                    </h3>
                    <p className="mt-2 text-2xl font-semibold tech-number text-ok">{formatCurrency(financialSummary.totalIncome)}</p>
                </div>
                <div className="p-4">
                    <h3 className="ledger-label flex items-center gap-2">
                        <TrendingDown className="h-3.5 w-3.5 text-danger" />
                        {t("總支出", "Total Expense")}
                    </h3>
                    <p className="mt-2 text-2xl font-semibold tech-number text-danger">{formatCurrency(financialSummary.totalExpense)}</p>
                </div>
            </div>

            {/* ── 對帳單：工具列 + 表格一體 ─────────────── */}
            <div className="rounded-lg border bg-card overflow-hidden">
                <div className="flex flex-col sm:flex-row gap-2 px-3 py-2.5 border-b border-border">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t("搜尋標題或來源...", "Search title or source...")}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-9 pl-10 pr-4 border border-input rounded-md bg-card text-sm"
                        />
                    </div>
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="h-9 px-3 border border-input rounded-md bg-card text-sm"
                    >
                        <option value="all">{t("所有類型", "All Types")}</option>
                        {FUNDING_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {language === "zh" ? type.labelZh : type.labelEn}
                            </option>
                        ))}
                    </select>
                    <span className="ledger-label self-center hidden lg:inline whitespace-nowrap px-1">
                        {filteredRecords.length} {t("筆", "entries")}
                    </span>
                </div>

                <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("日期", "Date")}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("標題", "Title")}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("類型", "Type")}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("來源", "Source")}</th>
                            <th className="text-right px-4 py-2.5 ledger-label">{t("金額", "Amount")}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("記錄者", "Recorded By")}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("操作", "Actions")}</th>
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
                                <tr key={record.id} className="hover:bg-accent/60 transition-colors">
                                    <td className="p-4 text-muted-foreground font-mono text-xs">{formatDate(record.date)}</td>
                                    <td className="p-4">
                                        <div>
                                            <p className="font-medium text-sm">{record.title}</p>
                                            {record.description && (
                                                <p className="text-sm text-muted-foreground truncate max-w-xs">{record.description}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[11px] text-muted-foreground">
                                            {getTypeLabel(record.type, language as Language)}
                                        </span>
                                    </td>
                                    <td className="p-4 text-muted-foreground">{record.source || "-"}</td>
                                    <td className="p-4 text-right">
                                        <span className="font-medium font-mono tabular-nums text-ok">{formatCurrency(record.amount)}</span>
                                    </td>
                                    <td className="p-4 text-muted-foreground text-sm">{record.recordedBy}</td>
                                    <td className="p-4">
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => openEditModal(record)}
                                                className="p-1.5 rounded hover:bg-accent transition-colors"
                                                title={t("編輯", "Edit")}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                disabled={isPending}
                                                className="p-1.5 rounded hover:bg-danger/10 text-danger transition-colors"
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
            </div>

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-card rounded-lg border shadow-[0_8px_24px_rgb(0_0_0_/_0.25)] w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
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
                                <div className={`p-3 rounded-md border text-sm ${addState.success ? "bg-ok/10 text-ok border-ok/30" : "bg-danger/10 text-danger border-danger/30"}`}>
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
                                <select
                                    id="type"
                                    name="type"
                                    value={addFormType}
                                    onChange={(e) => setAddFormType(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    required
                                >
                                    {FUNDING_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {language === "zh" ? type.labelZh : type.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 自訂類型輸入框 - 當選擇其他時顯示 */}
                            {addFormType === "OTHER" && (
                                <div className="space-y-2">
                                    <Label htmlFor="customType">{t("自訂類型", "Custom Type")} *</Label>
                                    <Input
                                        id="customType"
                                        name="customType"
                                        value={addCustomType}
                                        onChange={(e) => setAddCustomType(e.target.value)}
                                        placeholder={t("輸入類型名稱", "Enter type name")}
                                        required
                                    />
                                </div>
                            )}

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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-card rounded-lg border shadow-[0_8px_24px_rgb(0_0_0_/_0.25)] w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
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
                                <select
                                    id="edit-type"
                                    value={editForm.type}
                                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {FUNDING_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {language === "zh" ? type.labelZh : type.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 自訂類型輸入框 - 當選擇其他時顯示 */}
                            {editForm.type === "OTHER" && (
                                <div className="space-y-2">
                                    <Label htmlFor="edit-customType">{t("自訂類型", "Custom Type")}</Label>
                                    <Input
                                        id="edit-customType"
                                        value={editForm.customType}
                                        onChange={(e) => setEditForm({ ...editForm, customType: e.target.value })}
                                        placeholder={t("輸入類型名稱", "Enter type name")}
                                    />
                                </div>
                            )}

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
