"use client"

import { useState, useTransition } from "react"
import { TrendingUp, TrendingDown, Wallet, ChevronDown, ChevronUp, Edit2, Trash2, Loader2, X } from "lucide-react"
import { deleteFundingRecord, updateFundingRecord } from "@/app/actions/funding"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    FUNDING_TYPES,
    getTypeLabel,
    formatCurrency,
    formatDate,
    type FundingRecord,
} from "@/lib/constants/funding"

interface BalanceCardProps {
    totalIncome: number
    totalExpense: number
    currentBalance: number
    fundingRecords?: FundingRecord[]
}

export function BalanceCard({ totalIncome, totalExpense, currentBalance, fundingRecords = [] }: BalanceCardProps) {
    const [expanded, setExpanded] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [editingRecord, setEditingRecord] = useState<FundingRecord | null>(null)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    // Edit form state
    const [editForm, setEditForm] = useState({
        title: "",
        amount: 0,
        type: "SPONSORSHIP",
        source: "",
        description: "",
        date: "",
    })

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3000)
    }

    const handleDelete = (id: string) => {
        if (!confirm("確定要刪除此資金記錄嗎？")) return
        startTransition(async () => {
            const result = await deleteFundingRecord(id)
            if (result.success) {
                showMessage("success", result.message || "已刪除")
                window.location.reload()
            } else {
                showMessage("error", result.message || "刪除失敗")
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
                showMessage("success", result.message || "已更新")
                setEditingRecord(null)
                window.location.reload()
            } else {
                showMessage("error", result.message || "更新失敗")
            }
        })
    }

    const isPositive = currentBalance >= 0

    return (
        <>
            <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        財務摘要
                    </h3>
                    {fundingRecords.length > 0 && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
                        >
                            {expanded ? "收起" : "展開記錄"}
                            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>
                    )}
                </div>

                {/* 目前餘額 - 大標題 */}
                <div className="mb-6">
                    <p className="text-sm text-muted-foreground mb-1">目前餘額</p>
                    <p
                        className={`text-3xl font-bold ${isPositive ? "text-green-600" : "text-red-600"
                            }`}
                    >
                        {formatCurrency(currentBalance)}
                    </p>
                </div>

                {/* 收入/支出 明細 */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">總收入</p>
                            <p className="text-sm font-semibold text-green-600">
                                {formatCurrency(totalIncome)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                            <TrendingDown className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">總支出</p>
                            <p className="text-sm font-semibold text-red-600">
                                {formatCurrency(totalExpense)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 資金記錄列表 */}
                {expanded && fundingRecords.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                        <h4 className="text-sm font-medium mb-3">資金記錄</h4>
                        {message && (
                            <div className={`mb-3 p-2 rounded text-sm ${message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>
                                {message.text}
                            </div>
                        )}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {fundingRecords.map((record) => (
                                <div
                                    key={record.id}
                                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium truncate">{record.title}</p>
                                            <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded">
                                                {getTypeLabel(record.type)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(record.date)} • {record.source || "未知來源"} • {record.recordedBy}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-2">
                                        <p className="font-semibold text-green-600 whitespace-nowrap">
                                            {formatCurrency(record.amount)}
                                        </p>
                                        <button
                                            onClick={() => openEditModal(record)}
                                            className="p-1.5 rounded hover:bg-muted"
                                            title="編輯"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(record.id)}
                                            disabled={isPending}
                                            className="p-1.5 rounded hover:bg-red-50 text-red-600"
                                            title="刪除"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingRecord && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background rounded-xl border shadow-lg w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-4 border-b">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Edit2 className="h-5 w-5" />
                                編輯資金記錄
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => setEditingRecord(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">標題</Label>
                                <Input
                                    id="edit-title"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-amount">金額</Label>
                                <Input
                                    id="edit-amount"
                                    type="number"
                                    value={editForm.amount}
                                    onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) || 0 })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-type">類型</Label>
                                <select
                                    id="edit-type"
                                    value={editForm.type}
                                    onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                >
                                    {FUNDING_TYPES.map((type) => (
                                        <option key={type.value} value={type.value}>
                                            {type.labelZh}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-source">來源</Label>
                                <Input
                                    id="edit-source"
                                    value={editForm.source}
                                    onChange={(e) => setEditForm({ ...editForm, source: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-date">日期</Label>
                                <Input
                                    id="edit-date"
                                    type="date"
                                    value={editForm.date}
                                    onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="edit-description">備註</Label>
                                <textarea
                                    id="edit-description"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setEditingRecord(null)}
                                >
                                    取消
                                </Button>
                                <Button
                                    type="button"
                                    className="flex-1"
                                    onClick={handleUpdate}
                                    disabled={isPending}
                                >
                                    {isPending ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            更新中...
                                        </>
                                    ) : (
                                        "確認更新"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
