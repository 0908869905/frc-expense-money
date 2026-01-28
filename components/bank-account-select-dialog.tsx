"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useLanguage } from "@/lib/language-context"
import { Building2, Star, Check, X, AlertCircle, Settings } from "lucide-react"
import Link from "next/link"
import type { BankAccountData } from "@/app/actions/bank-accounts"
import { maskAccountNumber } from "@/lib/utils/mask-account"
import { BUTTON_PRIMARY, BUTTON_MUTED } from "@/lib/ui-constants"

interface BankAccountSelectDialogProps {
    accounts: BankAccountData[]
    onConfirm: (accountId: string | undefined) => void
    onCancel: () => void
    isPending?: boolean
}

export function BankAccountSelectDialog({
    accounts,
    onConfirm,
    onCancel,
    isPending = false,
}: BankAccountSelectDialogProps): React.ReactElement | null {
    const { language } = useLanguage()
    const [mounted, setMounted] = useState(false)

    // 預設選中預設帳戶
    const defaultAccount = accounts.find((a) => a.isDefault)
    const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(
        defaultAccount?.id
    )

    useEffect(() => {
        setMounted(true)
    }, [])

    function getText(zh: string, en: string): string {
        return language === "zh" ? zh : en
    }

    const handleConfirm = () => {
        onConfirm(selectedAccountId)
    }

    if (!mounted) return null

    return createPortal(
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-card rounded-xl border shadow-lg w-full max-w-md flex flex-col max-h-[85vh]">
                {/* Fixed Header */}
                <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">{getText("選擇收款帳戶", "Select Bank Account")}</h3>
                    </div>
                    <button onClick={onCancel} className="p-1 hover:bg-muted rounded" disabled={isPending}>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 space-y-4 overflow-y-auto flex-1">
                    {accounts.length === 0 ? (
                        <div className="text-center py-6">
                            <AlertCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                            <p className="text-muted-foreground mb-4">
                                {getText(
                                    "您尚未設定收款帳戶",
                                    "You haven't set up any bank accounts"
                                )}
                            </p>
                            <Link
                                href="/dashboard/settings"
                                className={BUTTON_PRIMARY}
                            >
                                <Settings className="h-4 w-4" />
                                {getText("前往設定", "Go to Settings")}
                            </Link>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm text-muted-foreground">
                                {getText(
                                    "請選擇報帳款項匯入的帳戶：",
                                    "Select the account for receiving reimbursement:"
                                )}
                            </p>

                            <div className="space-y-2">
                                {accounts.map((account) => (
                                    <label
                                        key={account.id}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            selectedAccountId === account.id
                                                ? "border-primary bg-primary/5"
                                                : "hover:bg-muted/50"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="bankAccount"
                                            value={account.id}
                                            checked={selectedAccountId === account.id}
                                            onChange={() => setSelectedAccountId(account.id)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                            selectedAccountId === account.id
                                                ? "border-primary bg-primary"
                                                : "border-muted-foreground"
                                        }`}>
                                            {selectedAccountId === account.id && (
                                                <Check className="h-3 w-3 text-primary-foreground" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{account.bankName}</span>
                                                {account.branchName && (
                                                    <span className="text-muted-foreground text-sm">
                                                        - {account.branchName}
                                                    </span>
                                                )}
                                                {account.isDefault && (
                                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">
                                                        <Star className="h-3 w-3" />
                                                        {getText("預設", "Default")}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {maskAccountNumber(account.accountNumber)} • {account.accountHolder}
                                            </p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {/* Fixed Footer - only show when there are accounts */}
                {accounts.length > 0 && (
                    <div className="p-4 border-t flex gap-3 justify-end flex-shrink-0">
                        <button
                            onClick={onCancel}
                            disabled={isPending}
                            className={BUTTON_MUTED}
                        >
                            {getText("取消", "Cancel")}
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isPending || !selectedAccountId}
                            className={BUTTON_PRIMARY}
                        >
                            {getText("確認提交", "Confirm Submit")}
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    )
}
