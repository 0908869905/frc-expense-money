"use client"

import { useState, useTransition } from "react"
import { useFormState } from "react-dom"
import { createFundingRecord, FundingState } from "@/app/actions/funding"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, X, DollarSign } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

const FUNDING_TYPES = [
    { value: "SPONSORSHIP", label: "贊助" },
    { value: "DONATION", label: "捐款" },
    { value: "GRANT", label: "補助金" },
    { value: "FUNDRAISING", label: "募款活動" },
    { value: "OTHER", label: "其他" },
]

export function FundingDialog() {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const { t } = useLanguage()

    const [state, formAction] = useFormState<FundingState, FormData>(
        createFundingRecord,
        { success: false, message: null }
    )

    const handleSubmit = (formData: FormData) => {
        startTransition(() => {
            formAction(formData)
        })
    }

    // 成功後關閉對話框
    if (state.success && open) {
        setTimeout(() => {
            setOpen(false)
            window.location.reload()
        }, 500)
    }

    if (!open) {
        return (
            <Button 
                onClick={() => setOpen(true)} 
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-white"
            >
                <Plus className="h-4 w-4" />
                新增資金
            </Button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-xl border shadow-lg w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        新增資金記錄
                    </h2>
                    <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <form action={handleSubmit} className="p-4 space-y-4">
                    {state.message && (
                        <div
                            className={`p-3 rounded-lg text-sm ${state.success
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                        >
                            {state.message}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="title">標題 *</Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="例如：XX公司贊助"
                            required
                        />
                        {state.errors?.title && (
                            <p className="text-sm text-red-500">{state.errors.title[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">金額 (TWD) *</Label>
                        <Input
                            id="amount"
                            name="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="10000"
                            required
                        />
                        {state.errors?.amount && (
                            <p className="text-sm text-red-500">{state.errors.amount[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="type">類型 *</Label>
                        <select
                            id="type"
                            name="type"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            required
                        >
                            {FUNDING_TYPES.map((type) => (
                                <option key={type.value} value={type.value}>
                                    {type.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="source">來源 (公司/個人)</Label>
                        <Input id="source" name="source" placeholder="贊助者名稱" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">入帳日期</Label>
                        <Input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={new Date().toISOString().split("T")[0]}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">備註</Label>
                        <textarea
                            id="description"
                            name="description"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="補充說明..."
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setOpen(false)}
                        >
                            取消
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    提交中...
                                </>
                            ) : (
                                "確認新增"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
