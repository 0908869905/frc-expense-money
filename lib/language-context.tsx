"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

type Language = "zh" | "en"

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const translations: Record<Language, Record<string, string>> = {
    zh: {
        // Common
        "dashboard": "儀表板",
        "my_expenses": "我的花費",
        "approvals": "審核",
        "all_reports": "所有報表",
        "profile": "個人資料",
        "settings": "設定",
        "sign_out": "登出",
        "welcome_back": "歡迎回來",

        // Dashboard
        "manage_expenses": "管理和追蹤你的報帳單",
        "total_reports": "報帳單數量",
        "total_items": "花費項目數",
        "total_amount": "總金額",
        "recent_reports": "近期報表",
        "no_reports": "還沒有報帳單",
        "create_first": "建立第一筆報帳單",
        "new_report": "+ 新增報帳單",

        // Expenses
        "view_manage_expenses": "查看和管理你的所有報帳單",
        "created_on": "建立於",
        "items_count": "筆花費",

        // Profile
        "account_info": "查看你的帳戶資訊",
        "user_id": "用戶 ID",
        "role": "角色",
        "created_at": "帳戶建立時間",
        "expense_stats": "報帳統計",
        "session_info": "Session 資訊",
    },
    en: {
        // Common
        "dashboard": "Dashboard",
        "my_expenses": "My Expenses",
        "approvals": "Approvals",
        "all_reports": "All Reports",
        "profile": "Profile",
        "settings": "Settings",
        "sign_out": "Sign Out",
        "welcome_back": "Welcome back",

        // Dashboard
        "manage_expenses": "Manage and track your expense reports",
        "total_reports": "Total Reports",
        "total_items": "Total Items",
        "total_amount": "Total Amount",
        "recent_reports": "Recent Reports",
        "no_reports": "No expense reports yet",
        "create_first": "Create your first report",
        "new_report": "+ New Report",

        // Expenses
        "view_manage_expenses": "View and manage all your expense reports",
        "created_on": "Created on",
        "items_count": "items",

        // Profile
        "account_info": "View your account information",
        "user_id": "User ID",
        "role": "Role",
        "created_at": "Account Created",
        "expense_stats": "Expense Statistics",
        "session_info": "Session Info",
    }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>("zh")

    useEffect(() => {
        const saved = localStorage.getItem("language") as Language
        if (saved && (saved === "zh" || saved === "en")) {
            setLanguageState(saved)
        }
    }, [])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
        localStorage.setItem("language", lang)
    }

    const t = (key: string): string => {
        return translations[language][key] || key
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error("useLanguage must be used within LanguageProvider")
    }
    return context
}
