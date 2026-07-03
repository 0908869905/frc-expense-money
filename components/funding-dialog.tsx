"use client"

import { useState, useTransition, useEffect } from "react"
import { useFormState } from "react-dom"
import { createFundingRecord, FundingState } from "@/app/actions/funding"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, X, DollarSign } from "lucide-react"
import { FUNDING_TYPES } from "@/lib/constants/funding"

const INITIAL_STATE: FundingState = { success: false, message: null }

export function FundingDialog(): React.ReactElement {
    const [open, setOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [state, formAction] = useFormState<FundingState, FormData>(createFundingRecord, INITIAL_STATE)

    function handleSubmit(formData: FormData): void {
        startTransition(() => {
            formAction(formData)
        })
    }

    useEffect(() => {
        if (state.success && open) {
            const timer = setTimeout(() => {
                setOpen(false)
                window.location.reload()
            }, 500)
            return () => clearTimeout(timer)
        }
    }, [state.success, open])

    if (!open) {
        return (
            <Button
                variant="outline"
                onClick={() => setOpen(true)}
                className="gap-2"
            >
                <Plus className="h-4 w-4" />
                新增資金
            </Button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-card rounded-lg border shadow-[0_8px_24px_rgb(0_0_0_/_0.25)] w-full max-w-md mx-4">
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
                            className={`p-3 rounded-md text-sm border ${
                                state.success
                                    ? "bg-ok/10 text-ok border-ok/30"
                                    : "bg-danger/10 text-danger border-danger/30"
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
                            <p className="text-sm text-danger">{state.errors.title[0]}</p>
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
                            <p className="text-sm text-danger">{state.errors.amount[0]}</p>
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
                                    {type.labelZh}
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
