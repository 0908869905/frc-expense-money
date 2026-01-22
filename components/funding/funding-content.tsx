"use client"

import { useState, useTransition } from "react"
import { useLanguage } from "@/lib/context/language-context"
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
    { value: "SPONSORSHIP", label: "Ë¥äÂä©", labelEn: "Sponsorship" },
    { value: "DONATION", label: "?êÊ¨æ", labelEn: "Donation" },
    { value: "GRANT", label: "Ë£úÂä©??, labelEn: "Grant" },
    { value: "FUNDRAISING", label: "?üÊ¨æÊ¥ªÂ?", labelEn: "Fundraising" },
    { value: "OTHER", label: "?∂‰?", labelEn: "Other" },
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
        if (!confirm(t("Á¢∫Â?Ë¶ÅÂà™?§Ê≠§Ë≥áÈ?Ë®òÈ??éÔ?", "Delete this funding record?"))) return
        startTransition(async () => {
            const result = await deleteFundingRecord(id)
            if (result.success) {
                showMessage("success", result.message || t("Â∑≤Âà™??, "Deleted"))
                window.location.reload()
            } else {
                showMessage("error", result.message || t("?™Èô§Â§±Ê?", "Delete failed"))
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
                showMessage("success", result.message || t("Â∑≤Êõ¥??, "Updated"))
                setEditingRecord(null)
                window.location.reload()
            } else {
                showMessage("error", result.message || t("?¥Êñ∞Â§±Ê?", "Update failed"))
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
                        {t("Ë≥áÈ?Ë®òÈ?", "Funding Records")}
                    </h1>
                    <p className="text-muted-foreground">
                        {t("ÁÆ°Á?Ë¥äÂä©?ÅÊ?Ê¨æÂ??∂‰??∂ÂÖ•‰æÜÊ?", "Manage sponsorships, donations, and other income sources")}
                    </p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("?∞Â?Ë≥áÈ?", "Add Funding")}
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
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">{t("?ÆÂ?È§òÈ?", "Current Balance")}</h3>
                    <p className={`text-3xl font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                        {formatCurrency(financialSummary.currentBalance)}
                    </p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <h3 className="text-sm font-medium text-muted-foreground">{t("Á∏ΩÊî∂??, "Total Income")}</h3>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(financialSummary.totalIncome)}</p>
                </div>
                <div className="rounded-xl border bg-card p-6">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingDown className="h-4 w-4 text-red-600" />
                        <h3 className="text-sm font-medium text-muted-foreground">{t("Á∏ΩÊîØ??, "Total Expense")}</h3>
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
                        placeholder={t("?úÂ?Ê®ôÈ??ñ‰?Ê∫?..", "Search title or source...")}
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
                    <option value="all">{t("?Ä?âÈ???, "All Types")}</option>
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
                            <th className="text-left p-4 font-medium">{t("?•Ê?", "Date")}</th>
                            <th className="text-left p-4 font-medium">{t("Ê®ôÈ?", "Title")}</th>
                            <th className="text-left p-4 font-medium">{t("È°ûÂ?", "Type")}</th>
                            <th className="text-left p-4 font-medium">{t("‰æÜÊ?", "Source")}</th>
                            <th className="text-right p-4 font-medium">{t("?ëÈ?", "Amount")}</th>
                            <th className="text-left p-4 font-medium">{t("Ë®òÈ???, "Recorded By")}</th>
                            <th className="text-left p-4 font-medium">{t("?ç‰?", "Actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {filteredRecords.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                    <Wallet className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    {t("Ê≤íÊ?Ë≥áÈ?Ë®òÈ?", "No funding records")}
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
                                                title={t("Á∑®ËºØ", "Edit")}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(record.id)}
                                                disabled={isPending}
                                                className="p-1.5 rounded hover:bg-red-50 text-red-600"
                                                title={t("?™Èô§", "Delete")}
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
                                {t("?∞Â?Ë≥áÈ?Ë®òÈ?", "Add Funding Record")}
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
                                <Label htmlFor="title">{t("Ê®ôÈ?", "Title")} *</Label>
                                <Input id="title" name="title" placeholder={t("‰æãÂ?ÔºöXX?¨Âè∏Ë¥äÂä©", "e.g. XX Corp Sponsorship")} required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="amount">{t("?ëÈ? (TWD)", "Amount (TWD)")} *</Label>
                                <Input id="amount" name="amount" type="number" step="0.01" min="0" placeholder="10000" required />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">{t("È°ûÂ?", "Type")} *</Label>
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
                                            {language === "zh" ? type.label : type.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* ?™Ë?È°ûÂ?Ëº∏ÂÖ•Ê°?- ?∂ÈÅ∏?áÂÖ∂‰ªñÊ?È°ØÁ§∫ */}
                            {addFormType === "OTHER" && (
                                <div className="space-y-2">
                                    <Label htmlFor="customType">{t("?™Ë?È°ûÂ?", "Custom Type")} *</Label>
                                    <Input
                                        id="customType"
                                        name="customType"
                                        value={addCustomType}
                                        onChange={(e) => setAddCustomType(e.target.value)}
                                        placeholder={t("Ëº∏ÂÖ•È°ûÂ??çÁ®±", "Enter type name")}
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="source">{t("‰æÜÊ?", "Source")}</Label>
                                <Input id="source" name="source" placeholder={t("Ë¥äÂä©?ÖÂ?Á®?, "Sponsor name")} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="date">{t("?•Â∏≥?•Ê?", "Date")}</Label>
                                <Input id="date" name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">{t("?ôË®ª", "Notes")}</Label>
                                <textarea id="description" name="description" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder={t("Ë£úÂ?Ë™™Ê?...", "Additional notes...")} />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>
                                    {t("?ñÊ?", "Cancel")}
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isPending}>
                                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("?ê‰∫§‰∏?..", "Submitting...")}</> : t("Á¢∫Ë??∞Â?", "Add")}
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
                                {t("Á∑®ËºØË≥áÈ?Ë®òÈ?", "Edit Funding Record")}
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setEditingRecord(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">{t("Ê®ôÈ?", "Title")}</Label>
                                <Input id="edit-title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-amount">{t("?ëÈ?", "Amount")}</Label>
                                <Input id="edit-amount" type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-type">{t("È°ûÂ?", "Type")}</Label>
                                <select
                                    id="edit-type"
                                    value={editForm.type}
                                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {FUNDING_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {language === "zh" ? type.label : type.labelEn}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* ?™Ë?È°ûÂ?Ëº∏ÂÖ•Ê°?- ?∂ÈÅ∏?áÂÖ∂‰ªñÊ?È°ØÁ§∫ */}
                            {editForm.type === "OTHER" && (
                                <div className="space-y-2">
                                    <Label htmlFor="edit-customType">{t("?™Ë?È°ûÂ?", "Custom Type")}</Label>
                                    <Input
                                        id="edit-customType"
                                        value={editForm.customType}
                                        onChange={(e) => setEditForm({ ...editForm, customType: e.target.value })}
                                        placeholder={t("Ëº∏ÂÖ•È°ûÂ??çÁ®±", "Enter type name")}
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="edit-source">{t("‰æÜÊ?", "Source")}</Label>
                                <Input id="edit-source" value={editForm.source} onChange={(e) => setEditForm({ ...editForm, source: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-date">{t("?•Ê?", "Date")}</Label>
                                <Input id="edit-date" type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description">{t("?ôË®ª", "Notes")}</Label>
                                <textarea id="edit-description" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button type="button" variant="outline" className="flex-1" onClick={() => setEditingRecord(null)}>
                                    {t("?ñÊ?", "Cancel")}
                                </Button>
                                <Button type="button" className="flex-1" onClick={handleUpdate} disabled={isPending}>
                                    {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t("?¥Êñ∞‰∏?..", "Updating...")}</> : t("Á¢∫Ë??¥Êñ∞", "Update")}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

