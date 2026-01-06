"use client"

import { useLanguage } from "@/lib/language-context"
import { signOut } from "next-auth/react"
import { LogOut, Globe, Bell, Lock, User, Camera, X, Check, Loader2 } from "lucide-react"
import { useState, useRef, useTransition, useEffect, useActionState } from "react"
import { changePassword, type ChangePasswordState } from "@/app/actions/password"
import { uploadAvatar, removeAvatar } from "@/app/actions/avatar"
import { updateNotificationFrequency, getNotificationFrequency } from "@/app/actions/notifications"

interface SettingsContentProps {
    session: any
}

export function SettingsContent({ session }: SettingsContentProps) {
    const { t, language, setLanguage } = useLanguage()
    const [notificationFrequency, setNotificationFrequency] = useState<"INSTANT" | "DAILY_DIGEST" | "OFF">("INSTANT")
    const [avatar, setAvatar] = useState<string | null>(session?.user?.image || null)
    const [avatarLoading, setAvatarLoading] = useState(false)
    const [avatarMessage, setAvatarMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const [notificationLoading, setNotificationLoading] = useState(false)
    const [notificationMessage, setNotificationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // 載入通知頻率設定
    useEffect(() => {
        getNotificationFrequency().then(setNotificationFrequency)
    }, [])

    // 更改密碼 Form Action
    const initialState: ChangePasswordState = { success: false, message: null }
    const [passwordState, passwordAction, passwordPending] = useActionState(changePassword, initialState)

    const handleLogout = async () => {
        try {
            await signOut({ callbackUrl: "/login" })
        } catch (error) {
            console.error("Logout error:", error)
            window.location.href = "/login"
        }
    }

    // 頭像上傳處理
    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // 驗證檔案類型
        if (!file.type.startsWith("image/")) {
            setAvatarMessage({ type: "error", text: language === "zh" ? "請選擇圖片檔案" : "Please select an image file" })
            return
        }

        setAvatarLoading(true)
        setAvatarMessage(null)

        try {
            // 轉換為 Base64
            const reader = new FileReader()
            reader.onload = async (event) => {
                const base64 = event.target?.result as string
                const result = await uploadAvatar(base64)
                
                if (result.success) {
                    setAvatar(result.imageUrl || null)
                    setAvatarMessage({ type: "success", text: language === "zh" ? "頭像已更新" : "Avatar updated" })
                } else {
                    setAvatarMessage({ type: "error", text: result.message || "Error" })
                }
                setAvatarLoading(false)
            }
            reader.readAsDataURL(file)
        } catch (error) {
            setAvatarMessage({ type: "error", text: language === "zh" ? "上傳失敗" : "Upload failed" })
            setAvatarLoading(false)
        }
    }

    // 移除頭像
    const handleRemoveAvatar = async () => {
        setAvatarLoading(true)
        setAvatarMessage(null)
        
        const result = await removeAvatar()
        if (result.success) {
            setAvatar(null)
            setAvatarMessage({ type: "success", text: language === "zh" ? "頭像已移除" : "Avatar removed" })
        } else {
            setAvatarMessage({ type: "error", text: result.message || "Error" })
        }
        setAvatarLoading(false)
    }

    // 通知頻率更新
    const handleNotificationChange = async (frequency: "INSTANT" | "DAILY_DIGEST" | "OFF") => {
        setNotificationLoading(true)
        setNotificationMessage(null)
        
        const result = await updateNotificationFrequency(frequency)
        if (result.success) {
            setNotificationFrequency(frequency)
            setNotificationMessage({ type: "success", text: language === "zh" ? "設定已更新" : "Settings updated" })
        } else {
            setNotificationMessage({ type: "error", text: result.message || "Error" })
        }
        setNotificationLoading(false)
    }

    // 取得用戶姓名首字母
    const getInitials = () => {
        const name = session?.user?.name || session?.user?.email || "U"
        return name.charAt(0).toUpperCase()
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
                            <img 
                                src={avatar} 
                                alt="Avatar" 
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
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                        >
                            <Camera className="h-4 w-4" />
                            {language === "zh" ? "上傳頭像" : "Upload"}
                        </button>
                        {avatar && (
                            <button
                                onClick={handleRemoveAvatar}
                                disabled={avatarLoading}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors text-sm font-medium disabled:opacity-50"
                            >
                                <X className="h-4 w-4" />
                                {language === "zh" ? "移除" : "Remove"}
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
                    {language === "zh" ? "建議使用正方形圖片，檔案大小不超過 500KB" : "Square image recommended, max size 500KB"}
                </p>
            </div>

            {/* Language Settings */}
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{language === "zh" ? "語言設定" : "Language Settings"}</h3>
                </div>
                <div className="flex items-center justify-between py-3">
                    <div>
                        <p className="font-medium">{language === "zh" ? "介面語言" : "Interface Language"}</p>
                        <p className="text-sm text-muted-foreground">
                            {language === "zh" ? "選擇你偏好的語言" : "Choose your preferred language"}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setLanguage("zh")}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${language === "zh"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                                }`}
                        >
                            中文
                        </button>
                        <button
                            onClick={() => setLanguage("en")}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${language === "en"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80"
                                }`}
                        >
                            English
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{language === "zh" ? "通知設定" : "Notification Settings"}</h3>
                </div>
                <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                        {language === "zh" ? "選擇接收通知的頻率" : "Choose how often you receive notifications"}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {[
                            { value: "INSTANT" as const, label: language === "zh" ? "即時通知" : "Instant" },
                            { value: "DAILY_DIGEST" as const, label: language === "zh" ? "每日摘要" : "Daily Digest" },
                            { value: "OFF" as const, label: language === "zh" ? "關閉" : "Off" },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => handleNotificationChange(option.value)}
                                disabled={notificationLoading}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                                    notificationFrequency === option.value
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/80"
                                } disabled:opacity-50`}
                            >
                                {notificationFrequency === option.value && <Check className="h-4 w-4" />}
                                {option.label}
                            </button>
                        ))}
                    </div>
                    {notificationMessage && (
                        <p className={`text-sm ${notificationMessage.type === "success" ? "text-green-500" : "text-destructive"}`}>
                            {notificationMessage.text}
                        </p>
                    )}
                </div>
            </div>

            {/* Change Password */}
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-3 mb-4">
                    <Lock className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{language === "zh" ? "更改密碼" : "Change Password"}</h3>
                </div>
                <form action={passwordAction} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="currentPassword" className="text-sm font-medium">
                            {language === "zh" ? "目前密碼" : "Current Password"}
                        </label>
                        <input
                            id="currentPassword"
                            name="currentPassword"
                            type="password"
                            required
                            className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {passwordState.errors?.currentPassword && (
                            <p className="text-sm text-destructive">{passwordState.errors.currentPassword[0]}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="newPassword" className="text-sm font-medium">
                            {language === "zh" ? "新密碼" : "New Password"}
                        </label>
                        <input
                            id="newPassword"
                            name="newPassword"
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {passwordState.errors?.newPassword && (
                            <p className="text-sm text-destructive">{passwordState.errors.newPassword[0]}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <label htmlFor="confirmPassword" className="text-sm font-medium">
                            {language === "zh" ? "確認新密碼" : "Confirm New Password"}
                        </label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            className="w-full px-3 py-2 rounded-md border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                        {passwordState.errors?.confirmPassword && (
                            <p className="text-sm text-destructive">{passwordState.errors.confirmPassword[0]}</p>
                        )}
                    </div>
                    {passwordState.message && (
                        <p className={`text-sm ${passwordState.success ? "text-green-500" : "text-destructive"}`}>
                            {passwordState.message}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={passwordPending}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                        {passwordPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        {language === "zh" ? "更新密碼" : "Update Password"}
                    </button>
                </form>
            </div>

            {/* Account Actions */}
            <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">{language === "zh" ? "帳戶操作" : "Account Actions"}</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 border-b">
                        <div>
                            <p className="font-medium">{language === "zh" ? "登出" : "Sign Out"}</p>
                            <p className="text-sm text-muted-foreground">
                                {session.user?.email}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm font-medium"
                        >
                            <LogOut className="h-4 w-4" />
                            {language === "zh" ? "登出" : "Sign Out"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
