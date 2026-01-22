"use client"

import { useState, useTransition } from "react"
import { useFormState } from "react-dom"
import { createFundingRecord, FundingState } from "@/app/actions/funding"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, X, DollarSign } from "lucide-react"
import { useLanguage } from "@/lib/context/language-context"

const FUNDING_TYPES = [
    { value: "SPONSORSHIP", label: "Ë¥äÂä©" },
    { value: "DONATION", label: "?êÊ¨æ" },
    { value: "GRANT", label: "Ë£úÂä©?? },
    { value: "FUNDRAISING", label: "?üÊ¨æÊ¥ªÂ?" },
    { value: "OTHER", label: "?∂‰?" },
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

    // ?êÂ?ÂæåÈ??âÂ?Ë©±Ê?
    if (state.success && open) {
        setTimeout(() => {
            setOpen(false)
            window.location.reload()
        }, 500)
    }

    if (!open) {
        return (
            <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
                <Plus className="h-4 w-4" />
                ?∞Â?Ë≥áÈ?
            </Button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-background rounded-xl border shadow-lg w-full max-w-md mx-4">
                <div className="flex items-center justify-between p-4 border-b">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        ?∞Â?Ë≥áÈ?Ë®òÈ?
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
                        <Label htmlFor="title">Ê®ôÈ? *</Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="‰æãÂ?ÔºöXX?¨Âè∏Ë¥äÂä©"
                            required
                        />
                        {state.errors?.title && (
                            <p className="text-sm text-red-500">{state.errors.title[0]}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">?ëÈ? (TWD) *</Label>
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
                        <Label htmlFor="type">È°ûÂ? *</Label>
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
                        <Label htmlFor="source">‰æÜÊ? (?¨Âè∏/?ã‰∫∫)</Label>
                        <Input id="source" name="source" placeholder="Ë¥äÂä©?ÖÂ?Á®? />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">?•Â∏≥?•Ê?</Label>
                        <Input
                            id="date"
                            name="date"
                            type="date"
                            defaultValue={new Date().toISOString().split("T")[0]}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">?ôË®ª</Label>
                        <textarea
                            id="description"
                            name="description"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            placeholder="Ë£úÂ?Ë™™Ê?..."
                        />
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={() => setOpen(false)}
                        >
                            ?ñÊ?
                        </Button>
                        <Button type="submit" className="flex-1" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ?ê‰∫§‰∏?..
                                </>
                            ) : (
                                "Á¢∫Ë??∞Â?"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}

