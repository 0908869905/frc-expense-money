"use client"

import { useState, useTransition, useEffect } from "react"
import { createPortal } from "react-dom"
import { useFormState, useFormStatus } from "react-dom"
import { useLanguage } from "@/lib/language-context"
import {
    createBankAccount,
    deleteBankAccount,
    setDefaultBankAccount,
    updateBankAccount,
    type BankAccountState,
    type BankAccountData
} from "@/app/actions/bank-accounts"
import { TAIWAN_BANKS } from "@/lib/constants/banks"
import { maskAccountNumber } from "@/lib/utils/mask-account"
import { Building2, Star, Trash2, Edit, Plus, X, Loader2, Check } from "lucide-react"
import { BUTTON_PRIMARY, BUTTON_MUTED, BUTTON_MUTED_SM, BUTTON_DESTRUCTIVE_SM, INPUT_CLASS } from "@/lib/ui-constants"

interface BankAccountSettingsProps {
    initialAccounts: BankAccountData[]
}

function SubmitButton({ children, className }: { children: React.ReactNode; className?: string }): React.ReactElement {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className={className || BUTTON_PRIMARY}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    )
}

export function BankAccountSettings({ initialAccounts }: BankAccountSettingsProps): React.ReactElement {
    const { language } = useLanguage()
    const [accounts, setAccounts] = useState<BankAccountData[]>(initialAccounts)
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [editingAccount, setEditingAccount] = useState<BankAccountData | null>(null)
    const [isPending, startTransition] = useTransition()
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [mounted, setMounted] = useState(false)

    const initialState: BankAccountState = { success: false, message: null }
    const [formState, formAction] = useFormState(createBankAccount, initialState)

    // For Portal - need to wait for client-side mount
    useEffect(() => {
        setMounted(true)
    }, [])

    function getText(zh: string, en: string): string {
        return language === "zh" ? zh : en
    }

    // 處理新增帳戶成功
    if (formState.success && formState.message) {
        // 重新載入頁面以取得最新帳戶列表
        window.location.reload()
    }

    const handleDelete = async (accountId: string) => {
        if (!confirm(getText(
            "確定要刪除此帳戶嗎？已使用此帳戶的報帳單仍會保留記錄。",
            "Are you sure you want to delete this account? Reports using this account will retain the record."
        ))) {
            return
        }

        startTransition(async () => {
            const result = await deleteBankAccount(accountId)
            if (result.success) {
                setAccounts((prev) => prev.filter((a) => a.id !== accountId))
                setMessage({ type: "success", text: result.message || getText("帳戶已刪除", "Account deleted") })
            } else {
                setMessage({ type: "error", text: result.message || getText("刪除失敗", "Delete failed") })
            }
        })
    }

    const handleSetDefault = async (accountId: string) => {
        startTransition(async () => {
            const result = await setDefaultBankAccount(accountId)
            if (result.success) {
                setAccounts((prev) =>
                    prev.map((a) => ({
                        ...a,
                        isDefault: a.id === accountId,
                    }))
                )
                setMessage({ type: "success", text: result.message || getText("已設為預設", "Set as default") })
            } else {
                setMessage({ type: "error", text: result.message || getText("設定失敗", "Failed to set default") })
            }
        })
    }

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        if (!editingAccount) return

        const formData = new FormData(e.currentTarget)
        const data = {
            bankName: formData.get("bankName") as string,
            branchName: (formData.get("branchName") as string) || undefined,
            accountNumber: formData.get("accountNumber") as string,
            accountHolder: formData.get("accountHolder") as string,
        }

        startTransition(async () => {
            const result = await updateBankAccount(editingAccount.id, data)
            if (result.success) {
                setAccounts((prev) =>
                    prev.map((a) =>
                        a.id === editingAccount.id
                            ? { ...a, ...data, branchName: data.branchName || null }
                            : a
                    )
                )
                setEditingAccount(null)
                setMessage({ type: "success", text: result.message || getText("帳戶已更新", "Account updated") })
            } else {
                setMessage({ type: "error", text: result.message || getText("更新失敗", "Update failed") })
            }
        })
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{getText("收款帳戶", "Bank Accounts")}</h3>
                </div>
                <button onClick={() => setShowAddDialog(true)} className={BUTTON_PRIMARY}>
                    <Plus className="h-4 w-4" />
                    {getText("新增帳戶", "Add Account")}
                </button>
            </div>

            {/* Message */}
            {message && (
                <div className={`p-3 rounded-lg text-sm ${
                    message.type === "success"
                        ? "bg-ok/10 text-ok border border-ok/30"
                        : "bg-danger/10 text-danger border border-danger/30"
                }`}>
                    {message.text}
                </div>
            )}

            {/* Account List */}
            {accounts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                    <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{getText("尚未設定收款帳戶", "No bank accounts set up")}</p>
                    <p className="text-sm mt-1">
                        {getText("新增帳戶以便在提交報帳單時選擇收款方式", "Add an account to select payment method when submitting reports")}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {accounts.map((account) => (
                        <div
                            key={account.id}
                            className={`rounded-lg border p-4 ${
                                account.isDefault ? "border-primary bg-primary/5" : "bg-card"
                            }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium">{account.bankName}</span>
                                        {account.branchName && (
                                            <span className="text-muted-foreground">- {account.branchName}</span>
                                        )}
                                        {account.isDefault && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                <Star className="h-3 w-3" />
                                                {getText("預設", "Default")}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {getText("帳號", "Account")}: {maskAccountNumber(account.accountNumber)}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {getText("戶名", "Holder")}: {account.accountHolder}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!account.isDefault && (
                                        <button
                                            onClick={() => handleSetDefault(account.id)}
                                            disabled={isPending}
                                            className={BUTTON_MUTED_SM}
                                            title={getText("設為預設", "Set as default")}
                                        >
                                            <Star className="h-4 w-4" />
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setEditingAccount(account)}
                                        disabled={isPending}
                                        className={BUTTON_MUTED_SM}
                                        title={getText("編輯", "Edit")}
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(account.id)}
                                        disabled={isPending}
                                        className={BUTTON_DESTRUCTIVE_SM}
                                        title={getText("刪除", "Delete")}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Account Dialog - rendered via Portal */}
            {mounted && showAddDialog && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-card rounded-xl border shadow-lg w-full max-w-md flex flex-col max-h-[85vh]">
                        {/* Fixed Header */}
                        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                            <h3 className="font-semibold">{getText("新增收款帳戶", "Add Bank Account")}</h3>
                            <button onClick={() => setShowAddDialog(false)} className="p-1 hover:bg-muted rounded">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {/* Scrollable Content */}
                        <form action={formAction} className="flex flex-col flex-1 min-h-0">
                            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                                <BankAccountFormFields getText={getText} />

                                {formState.message && !formState.success && (
                                    <p className="text-sm text-destructive">{formState.message}</p>
                                )}
                            </div>
                            {/* Fixed Footer */}
                            <div className="p-4 border-t flex gap-3 justify-end flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setShowAddDialog(false)}
                                    className={BUTTON_MUTED}
                                >
                                    {getText("取消", "Cancel")}
                                </button>
                                <SubmitButton>
                                    <Check className="h-4 w-4" />
                                    {getText("新增", "Add")}
                                </SubmitButton>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Edit Account Dialog - rendered via Portal */}
            {mounted && editingAccount && createPortal(
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
                    <div className="bg-card rounded-xl border shadow-lg w-full max-w-md flex flex-col max-h-[85vh]">
                        {/* Fixed Header */}
                        <div className="p-4 border-b flex items-center justify-between flex-shrink-0">
                            <h3 className="font-semibold">{getText("編輯收款帳戶", "Edit Bank Account")}</h3>
                            <button onClick={() => setEditingAccount(null)} className="p-1 hover:bg-muted rounded">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        {/* Scrollable Content */}
                        <form onSubmit={handleUpdate} className="flex flex-col flex-1 min-h-0">
                            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                                <BankAccountFormFields getText={getText} defaultValues={editingAccount} />
                            </div>
                            {/* Fixed Footer */}
                            <div className="p-4 border-t flex gap-3 justify-end flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setEditingAccount(null)}
                                    className={BUTTON_MUTED}
                                    disabled={isPending}
                                >
                                    {getText("取消", "Cancel")}
                                </button>
                                <button type="submit" disabled={isPending} className={BUTTON_PRIMARY}>
                                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                    <Check className="h-4 w-4" />
                                    {getText("儲存", "Save")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    )
}

interface BankAccountFormFieldsProps {
    getText: (zh: string, en: string) => string
    defaultValues?: BankAccountData
}

function BankAccountFormFields({ getText, defaultValues }: BankAccountFormFieldsProps): React.ReactElement {
    const [customBank, setCustomBank] = useState(false)
    const [selectedBank, setSelectedBank] = useState(defaultValues?.bankName || "")

    // 檢查是否為預設銀行列表中的銀行
    const isKnownBank = TAIWAN_BANKS.some((b) => b.name === selectedBank)

    return (
        <>
            {/* Bank Name */}
            <div className="space-y-2">
                <label htmlFor="bankName" className="text-sm font-medium">
                    {getText("銀行/郵局", "Bank")} *
                </label>
                {customBank || (defaultValues && !isKnownBank) ? (
                    <div className="flex gap-2">
                        <input
                            id="bankName"
                            name="bankName"
                            type="text"
                            required
                            defaultValue={defaultValues?.bankName}
                            className={INPUT_CLASS}
                            placeholder={getText("輸入銀行名稱", "Enter bank name")}
                        />
                        <button
                            type="button"
                            onClick={() => setCustomBank(false)}
                            className={BUTTON_MUTED}
                        >
                            {getText("選擇", "Select")}
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <select
                            id="bankName"
                            name="bankName"
                            required
                            value={selectedBank}
                            onChange={(e) => setSelectedBank(e.target.value)}
                            className={INPUT_CLASS}
                        >
                            <option value="">{getText("選擇銀行", "Select bank")}</option>
                            {TAIWAN_BANKS.map((bank) => (
                                <option key={bank.code} value={bank.name}>
                                    {bank.name} ({bank.code})
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => setCustomBank(true)}
                            className={BUTTON_MUTED}
                        >
                            {getText("其他", "Other")}
                        </button>
                    </div>
                )}
            </div>

            {/* Branch Name */}
            <div className="space-y-2">
                <label htmlFor="branchName" className="text-sm font-medium">
                    {getText("分行名稱", "Branch Name")}
                </label>
                <input
                    id="branchName"
                    name="branchName"
                    type="text"
                    defaultValue={defaultValues?.branchName || ""}
                    className={INPUT_CLASS}
                    placeholder={getText("例如：板橋分行", "e.g., Banqiao Branch")}
                />
            </div>

            {/* Account Number */}
            <div className="space-y-2">
                <label htmlFor="accountNumber" className="text-sm font-medium">
                    {getText("帳號", "Account Number")} *
                </label>
                <input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    required
                    minLength={5}
                    defaultValue={defaultValues?.accountNumber}
                    className={INPUT_CLASS}
                    placeholder={getText("輸入帳號", "Enter account number")}
                />
            </div>

            {/* Account Holder */}
            <div className="space-y-2">
                <label htmlFor="accountHolder" className="text-sm font-medium">
                    {getText("戶名", "Account Holder")} *
                </label>
                <input
                    id="accountHolder"
                    name="accountHolder"
                    type="text"
                    required
                    defaultValue={defaultValues?.accountHolder}
                    className={INPUT_CLASS}
                    placeholder={getText("輸入戶名", "Enter account holder name")}
                />
            </div>

            {/* Set as Default (only for new accounts) */}
            {!defaultValues && (
                <div className="flex items-center gap-2">
                    <input
                        id="isDefault"
                        name="isDefault"
                        type="checkbox"
                        value="true"
                        className="h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="isDefault" className="text-sm">
                        {getText("設為預設帳戶", "Set as default account")}
                    </label>
                </div>
            )}
        </>
    )
}
