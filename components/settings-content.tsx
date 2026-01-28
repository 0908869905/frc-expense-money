"use client"

import Image from "next/image"
import { useLanguage } from "@/lib/language-context"
import { signOut } from "next-auth/react"
import { LogOut, Globe, Bell, Lock, User, Camera, X, Check, Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { changePassword, type ChangePasswordState } from "@/app/actions/password"
import { uploadAvatar, removeAvatar } from "@/app/actions/avatar"
import { updateNotificationFrequency, getNotificationFrequency } from "@/app/actions/notifications"
import { BankAccountSettings } from "@/components/bank-account-settings"
import type { BankAccountData } from "@/app/actions/bank-accounts"
import { BUTTON_PRIMARY, BUTTON_MUTED, INPUT_CLASS } from "@/lib/ui-constants"

type NotificationFrequency = "INSTANT" | "DAILY_DIGEST" | "OFF"
type MessageState = { type: "success" | "error"; text: string } | null

function SubmitButton({ children }: { children: React.ReactNode }): React.ReactElement {
    const { pending } = useFormStatus()
    return (
        <button type="submit" disabled={pending} className={BUTTON_PRIMARY}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            {children}
        </button>
    )
}

interface SettingsContentProps {
    session: { user?: { name?: string | null; email?: string | null; image?: string | null; role?: string } }
    bankAccounts?: BankAccountData[]
    canManageBankAccounts?: boolean
}

export function SettingsContent({ session, bankAccounts = [], canManageBankAccounts = false }: SettingsContentProps): React.ReactElement {
    const { t, language, setLanguage } = useLanguage()
    const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>("INSTANT")
    const [avatar, setAvatar] = useState<string | null>(session?.user?.image || null)
    const [avatarLoading, setAvatarLoading] = useState(false)
    const [avatarMessage, setAvatarMessage] = useState<MessageState>(null)
    const [notificationLoading, setNotificationLoading] = useState(false)
    const [notificationMessage, setNotificationMessage] = useState<MessageState>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        getNotificationFrequency().then(setNotificationFrequency)
    }, [])

    const [passwordState, passwordAction] = useFormState(changePassword, { success: false, message: null })

    function getText(zh: string, en: string): string {
        return language === "zh" ? zh : en
    }

    function getInitials(): string {
        const name = session?.user?.name || session?.user?.email || "U"
        return name.charAt(0).toUpperCase()
    }

    async function handleLogout(): Promise<void> {
        try {
            await signOut({ callbackUrl: "/login" })
        } catch (error) {
            console.error("Logout error:", error)
            window.location.href = "/login"
        }
    }

    async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>): Promise<void> {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith("image/")) {
            setAvatarMessage({ type: "error", text: getText("請選擇圖片檔案", "Please select an image file") })
            return
        }

        setAvatarLoading(true)
        setAvatarMessage(null)

        const reader = new FileReader()
        reader.onload = async (event) => {
            const base64 = event.target?.result as string
            const result = await uploadAvatar(base64)

            if (result.success) {
                setAvatar(result.imageUrl || null)
                setAvatarMessage({ type: "success", text: getText("頭像已更新", "Avatar updated") })
            } else {
                setAvatarMessage({ type: "error", text: result.message || "Error" })
            }
            setAvatarLoading(false)
        }
        reader.onerror = () => {
            setAvatarMessage({ type: "error", text: getText("上傳失敗", "Upload failed") })
            setAvatarLoading(false)
        }
        reader.readAsDataURL(file)
    }

    async function handleRemoveAvatar(): Promise<void> {
        setAvatarLoading(true)
        setAvatarMessage(null)

        const result = await removeAvatar()
        setAvatar(result.success ? null : avatar)
        setAvatarMessage({
            type: result.success ? "success" : "error",
            text: result.success ? getText("頭像已移除", "Avatar removed") : (result.message || "Error")
        })
        setAvatarLoading(false)
    }

    async function handleNotificationChange(frequency: NotificationFrequency): Promise<void> {
        setNotificationLoading(true)
        setNotificationMessage(null)

        const result = await updateNotificationFrequency(frequency)
        if (result.success) {
            setNotificationFrequency(frequency)
        }
        setNotificationMessage({
            type: result.success ? "success" : "error",
            text: result.success ? getText("設定已更新", "Settings updated") : (result.message || "Error")
        })
        setNotificationLoading(false)
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
                <p className="text-muted-foreground">
                    {language === "zh" ? "管理你的應用程式設定" : "Manage your application settings"}
                </p>
            </div>

            {/* Avatar Settings */}
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{language === "zh" ? "個人頭像" : "Profile Avatar"}</h3>
                </div>
                <div className="flex items-center gap-6">
                    {/* Avatar Preview */}
                    <div className="relative">
                        {avatar ? (
                            <Image
                                src={avatar}
                                alt="Avatar"
                                width={80}
                                height={80}
                                className="w-20 h-20 rounded-full object-cover border-2 border-border"
                            />
                        ) : (
                            <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold border-2 border-border">
                                {getInitials()}
                            </div>
                        )}
                        {avatarLoading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                        )}
                    </div>
                    
                    {/* Upload/Remove Buttons */}
                    <div className="flex flex-col gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarLoading}
                            className={BUTTON_PRIMARY}
                        >
                            <Camera className="h-4 w-4" />
                            {getText("上傳頭像", "Upload")}
                        </button>
                        {avatar && (
                            <button onClick={handleRemoveAvatar} disabled={avatarLoading} className={BUTTON_MUTED}>
                                <X className="h-4 w-4" />
                                {getText("移除", "Remove")}
                            </button>
                        )}
                    </div>
                </div>
                {avatarMessage && (
                    <p className={`mt-3 text-sm ${avatarMessage.type === "success" ? "text-green-500" : "text-destructive"}`}>
                        {avatarMessage.text}
                    </p>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                    {getText("建議使用正方形圖片，檔案大小不超過 500KB", "Square image recommended, max size 500KB")}
                </p>
            </div>

            {/* Language Settings */}
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{getText("語言設定", "Language Settings")}</h3>
                </div>
                <div className="flex items-center justify-between py-3">
                    <div>
                        <p className="font-medium">{getText("介面語言", "Interface Language")}</p>
                        <p className="text-sm text-muted-foreground">
                            {getText("選擇你偏好的語言", "Choose your preferred language")}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {(["zh", "en"] as const).map((lang) => (
                            <button
                                key={lang}
                                onClick={() => setLanguage(lang)}
                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                    language === lang
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/80"
                                }`}
                            >
                                {lang === "zh" ? "中文" : "English"}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{getText("通知設定", "Notification Settings")}</h3>
                </div>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        {getText("選擇接收通知的頻率", "Choose how often you receive notifications")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {([
                            { value: "INSTANT", zh: "即時通知", en: "Instant" },
                            { value: "DAILY_DIGEST", zh: "每日摘要", en: "Daily Digest" },
                            { value: "OFF", zh: "關閉", en: "Off" },
                        ] as const).map((option) => {
                            const isSelected = notificationFrequency === option.value
                            return (
                                <button
                                    key={option.value}
                                    onClick={() => handleNotificationChange(option.value)}
                                    disabled={notificationLoading}
                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50 ${
                                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                                    }`}
                                >
                                    {isSelected && <Check className="h-4 w-4" />}
                                    {getText(option.zh, option.en)}
                                </button>
                            )
                        })}
                    </div>
                    {notificationMessage && (
                        <p className={`text-sm ${notificationMessage.type === "success" ? "text-green-500" : "text-destructive"}`}>
                            {notificationMessage.text}
                        </p>
                    )}
                </div>
            </div>

            {/* Bank Account Settings - 只對 VICE_LEADER 以上角色顯示 */}
            {canManageBankAccounts && (
                <div className="rounded-xl border bg-card p-6">
                    <BankAccountSettings initialAccounts={bankAccounts} />
                </div>
            )}

            {/* Change Password */}
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{getText("更改密碼", "Change Password")}</h3>
                </div>
                <form action={passwordAction} className="space-y-4">
                    <PasswordField
                        id="currentPassword"
                        label={getText("目前密碼", "Current Password")}
                        error={passwordState.errors?.currentPassword?.[0]}
                    />
                    <PasswordField
                        id="newPassword"
                        label={getText("新密碼", "New Password")}
                        minLength={6}
                        error={passwordState.errors?.newPassword?.[0]}
                    />
                    <PasswordField
                        id="confirmPassword"
                        label={getText("確認新密碼", "Confirm New Password")}
                        error={passwordState.errors?.confirmPassword?.[0]}
                    />
                    {passwordState.message && (
                        <p className={`text-sm ${passwordState.success ? "text-green-500" : "text-destructive"}`}>
                            {passwordState.message}
                        </p>
                    )}
                    <SubmitButton>{getText("更新密碼", "Update Password")}</SubmitButton>
                </form>
            </div>

            {/* Account Actions */}
            <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">{getText("帳戶操作", "Account Actions")}</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b">
                        <div>
                            <p className="font-medium">{getText("登出", "Sign Out")}</p>
                            <p className="text-sm text-muted-foreground">{session.user?.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-medium"
                        >
                            <LogOut className="h-4 w-4" />
                            {getText("登出", "Sign Out")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

interface PasswordFieldProps {
    id: string
    label: string
    minLength?: number
    error?: string
}

function PasswordField({ id, label, minLength, error }: PasswordFieldProps): React.ReactElement {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="text-sm font-medium">{label}</label>
            <input
                id={id}
                name={id}
                type="password"
                required
                minLength={minLength}
                className={INPUT_CLASS}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    )
}
