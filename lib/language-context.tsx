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
        // Common / Navigation
        "dashboard": "儀表板",
        "my_expenses": "我的花費",
        "approvals": "審核",
        "all_reports": "所有報表",
        "profile": "個人資料",
        "settings": "設定",
        "sign_out": "登出",
        "welcome_back": "歡迎回來",
        "loading": "載入中...",

        // Dashboard
        "manage_expenses": "管理和追蹤你的報帳單",
        "total_reports": "報帳單數量",
        "total_items": "花費項目數",
        "total_amount": "總金額",
        "recent_reports": "近期報表",
        "no_reports": "還沒有報帳單",
        "no_reports_yet": "你還沒有任何報帳單",
        "create_first": "建立第一筆報帳單",
        "new_report": "+ 新增報帳單",

        // Expenses Page
        "view_manage_expenses": "查看和管理你的所有報帳單",
        "created_on": "建立於",
        "items_count": "筆花費",
        "expense_items": "花費項目",

        // Profile Page
        "account_info": "查看你的帳戶資訊",
        "user_id": "用戶 ID",
        "role": "角色",
        "created_at": "帳戶建立時間",
        "expense_stats": "報帳統計",
        "session_info": "Session 資訊",
        "name_not_set": "未設定名稱",
        "total_expense_amount": "總報帳金額",

        // Status
        "status_draft": "草稿",
        "status_pending_manager": "待主管審核",
        "status_pending_finance": "待財務審核",
        "status_approved": "已核准",
        "status_rejected": "已拒絕",
        "status_paid": "已付款",

        // Categories
        "category_food": "餐飲",
        "category_transport": "交通",
        "category_housing": "住宿",
        "category_entertainment": "娛樂",
        "category_utilities": "水電",
        "category_health": "醫療",
        "category_other": "其他",

        // Actions
        "submit": "提交",
        "cancel": "取消",
        "save": "儲存",
        "delete": "刪除",
        "edit": "編輯",
        "view": "查看",
        "approve": "核准",
        "reject": "拒絕",

        // Form Labels
        "title": "標題",
        "description": "說明",
        "amount": "金額",
        "date": "日期",
        "category": "類別",
        "receipt": "收據",

        // Messages
        "success": "成功",
        "error": "錯誤",
        "confirm_delete": "確定要刪除嗎？",
    },
    en: {
        // Common / Navigation
        "dashboard": "Dashboard",
        "my_expenses": "My Expenses",
        "approvals": "Approvals",
        "all_reports": "All Reports",
        "profile": "Profile",
        "settings": "Settings",
        "sign_out": "Sign Out",
        "welcome_back": "Welcome back",
        "loading": "Loading...",

        // Dashboard
        "manage_expenses": "Manage and track your expense reports",
        "total_reports": "Total Reports",
        "total_items": "Total Items",
        "total_amount": "Total Amount",
        "recent_reports": "Recent Reports",
        "no_reports": "No expense reports yet",
        "no_reports_yet": "You don't have any expense reports yet",
        "create_first": "Create your first report",
        "new_report": "+ New Report",

        // Expenses Page
        "view_manage_expenses": "View and manage all your expense reports",
        "created_on": "Created on",
        "items_count": "items",
        "expense_items": "Expense Items",

        // Profile Page
        "account_info": "View your account information",
        "user_id": "User ID",
        "role": "Role",
        "created_at": "Account Created",
        "expense_stats": "Expense Statistics",
        "session_info": "Session Info",
        "name_not_set": "Name not set",
        "total_expense_amount": "Total Expense Amount",

        // Status
        "status_draft": "Draft",
        "status_pending_manager": "Pending Manager",
        "status_pending_finance": "Pending Finance",
        "status_approved": "Approved",
        "status_rejected": "Rejected",
        "status_paid": "Paid",

        // Categories
        "category_food": "Food",
        "category_transport": "Transport",
        "category_housing": "Housing",
        "category_entertainment": "Entertainment",
        "category_utilities": "Utilities",
        "category_health": "Health",
        "category_other": "Other",

        // Actions
        "submit": "Submit",
        "cancel": "Cancel",
        "save": "Save",
        "delete": "Delete",
        "edit": "Edit",
        "view": "View",
        "approve": "Approve",
        "reject": "Reject",

        // Form Labels
        "title": "Title",
        "description": "Description",
        "amount": "Amount",
        "date": "Date",
        "category": "Category",
        "receipt": "Receipt",

        // Messages
        "success": "Success",
        "error": "Error",
        "confirm_delete": "Are you sure you want to delete?",
    }
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>("zh")
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
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

    // Prevent hydration mismatch
    if (!mounted) {
        return <>{children}</>
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
        // Return default values if not in provider
        return {
            language: "zh" as Language,
            setLanguage: () => { },
            t: (key: string) => translations.zh[key] || key
        }
    }
    return context
}

// Export translations for server components
export const getTranslation = (lang: Language, key: string): string => {
    return translations[lang][key] || key
}
