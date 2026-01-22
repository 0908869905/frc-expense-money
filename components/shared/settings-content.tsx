"use client"

import { useLanguage } from "@/lib/context/language-context"
import { signOut } from "next-auth/react"
import { LogOut, Globe, Bell } from "lucide-react"
import { useState } from "react"

interface SettingsContentProps {
    session: any
}

export function SettingsContent({ session }: SettingsContentProps) {
    const { t, language, setLanguage } = useLanguage()
    const [notifications, setNotifications] = useState(true)

    const handleLogout = async () => {
        try {
            await signOut({ callbackUrl: "/login" })
        } catch (error) {
            console.error("Logout error:", error)
            // Fallback: 直接清除 session 並導向
            window.location.href = "/login"
        }
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t("settings")}</h1>
                <p className="text-muted-foreground">
                    {language === "zh" ? "管理你的應用程式設定" : "Manage your application settings"}
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
                <div className="flex items-center justify-between py-3">
                    <div>
                        <p className="font-medium">{language === "zh" ? "電子郵件通知" : "Email Notifications"}</p>
                        <p className="text-sm text-muted-foreground">
                            {language === "zh" ? "接收報帳審核狀態更新" : "Receive expense approval status updates"}
                        </p>
                    </div>
                    <button
                        onClick={() => setNotifications(!notifications)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications ? "bg-primary" : "bg-muted"
                            }`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications ? "translate-x-6" : "translate-x-1"
                                }`}
                        />
                    </button>
                </div>
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
