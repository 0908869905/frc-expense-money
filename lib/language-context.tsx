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
        "users": "用戶管理",
        "user_management": "用戶管理",

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
        "submit_for_approval": "提交審核",
        "confirm_submit": "確定要提交此報帳單嗎？提交後將無法編輯。",
        "confirm_delete_report": "確定要刪除此報帳單嗎？此操作無法復原。",
        "report_submitted": "報帳單已提交",
        "report_deleted": "報帳單已刪除",

        // Profile Page
        "account_info": "查看你的帳戶資訊",
        "user_id": "用戶 ID",
        "role": "角色",
        "created_at": "帳戶建立時間",
        "expense_stats": "報帳統計",
        "session_info": "Session 資訊",
        "name_not_set": "未設定名稱",
        "total_expense_amount": "總報帳金額",
        "email": "電子郵件",
        "name": "姓名",

        // Settings Page
        "language_settings": "語言設定",
        "choose_language": "選擇你偏好的語言",
        "chinese": "中文",
        "english": "English",
        "notification_settings": "通知設定",
        "email_notifications": "電子郵件通知",
        "receive_email_updates": "接收報帳單狀態更新的電子郵件",
        "account_settings": "帳戶設定",
        "sign_out_desc": "登出你的帳戶",

        // User Management
        "manage_users": "管理所有用戶帳號和權限",
        "total_users": "總用戶",
        "admins": "管理員",
        "managers": "主管",
        "verified": "已驗證",
        "user": "用戶",
        "submitter": "提交者",
        "date": "日期",
        "amount": "金額",
        "status": "狀態",
        "actions": "操作",
        "edit_email": "編輯 Email",
        "change_password": "更改密碼",
        "change_role": "更改角色",
        "verify_email": "驗證 Email",
        "delete_user": "刪除用戶",
        "new_password": "新密碼",
        "email_updated": "Email 已更新",
        "password_updated": "密碼已更新",
        "role_updated": "角色已更新",
        "email_verified": "Email 已驗證",
        "user_deleted": "用戶已刪除",
        "unverified": "未驗證",
        "reports_count": "報表數",
        "created": "建立日期",
        "cannot_delete_self": "無法刪除自己",
        "confirm_delete_user": "確定要刪除此用戶嗎？此操作無法復原。",

        // Reports Page
        "view_manage_all": "查看和管理所有報帳單",
        "all": "全部",
        "pending": "待審核",
        "approved": "已核准",
        "rejected": "已拒絕",
        "no_expense_reports": "沒有報帳單",
        "title": "標題",
        "updated": "已更新",
        "deleted": "已刪除",

        // Status
        "status_draft": "草稿",
        "status_pending_manager": "待主管審核",
        "status_pending_finance": "待財務審核",
        "status_approved": "已核准",
        "status_rejected": "已拒絕",
        "status_paid": "已付款",
        "draft": "草稿",
        "pending_manager": "待主管審核",
        "pending_finance": "待財務審核",
        "paid": "已付款",

        // Roles
        "role_user": "一般用戶",
        "role_manager": "主管",
        "role_finance": "財務",
        "role_admin": "管理員",

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
        "close": "關閉",

        // Form Labels
        "description": "說明",
        "category": "類別",
        "receipt": "收據",

        // Messages
        "success": "成功",
        "error": "錯誤",
        "confirm_delete": "確定要刪除嗎？",
        "operation_failed": "操作失敗",
        "please_enter_valid_email": "請輸入有效的 Email",
        "password_min_6": "密碼至少 6 個字元",
        "rejection_reason": "請輸入拒絕原因：",

        // Login Page
        "login": "登入",
        "login_desc": "輸入你的帳號密碼登入系統",
        "email_placeholder": "name@example.com",
        "password": "密碼",
        "password_placeholder": "輸入密碼",
        "login_button": "登入",
        "no_account": "還沒有帳號？",
        "register_now": "立即註冊",
        "login_error": "電子郵件或密碼錯誤",
        "register_success": "註冊成功！請使用你的帳號登入",

        // Register Page
        "register": "註冊",
        "register_desc": "建立你的帳戶",
        "confirm_password": "確認密碼",
        "confirm_password_placeholder": "再次輸入密碼",
        "register_button": "註冊",
        "have_account": "已經有帳號？",
        "login_now": "立即登入",
        "passwords_not_match": "密碼不一致",

        // About Page
        "why_choose_us": "為什麼選擇 Ultimate Expense？",
        "about_desc": "我們致力於簡化企業報帳流程，讓財務管理變得更簡單、更高效",
        "back_home": "返回首頁",
        "feature_fast": "快速報帳",
        "feature_fast_desc": "只需幾分鐘即可提交報帳單，支援收據拍照上傳",
        "feature_approval": "多級審核",
        "feature_approval_desc": "從主管到財務，完整的審核流程確保合規性",
        "feature_secure": "安全可靠",
        "feature_secure_desc": "企業級安全防護，資料加密存儲",
        "feature_reports": "即時報表",
        "feature_reports_desc": "視覺化報表讓您隨時掌握公司支出狀況",
        "feature_quick": "快速審批",
        "feature_quick_desc": "平均審批時間縮短 80%，加速資金週轉",
        "feature_auto": "自動化流程",
        "feature_auto_desc": "自動通知、自動分類、智能匹配政策",
        "numbers_speak": "數字說話",
        "numbers_desc": "我們的客戶信任我們處理他們的財務流程",
        "active_users": "活躍用戶",
        "enterprise_clients": "企業客戶",
        "system_uptime": "系統穩定度",
        "avg_approval_time": "平均審批時間",
        "how_it_works": "如何運作",
        "simple_steps": "只需三個簡單步驟",
        "step1_title": "提交報帳",
        "step1_desc": "填寫費用明細，上傳收據照片",
        "step2_title": "等待審核",
        "step2_desc": "主管和財務會收到通知並進行審核",
        "step3_title": "完成付款",
        "step3_desc": "審核通過後，費用將快速撥付",
        "ready_to_start": "準備好開始了嗎？",
        "cta_desc": "立即註冊，體驗更高效的報帳流程",
        "free_register": "免費註冊",

        // Landing Page
        "expense_system": "報帳系統",
        "sign_in": "登入",
        "hero_title": "報帳管理。更簡單。",
        "hero_desc": "簡化審批流程，即時追蹤支出，更快獲得報銷。",
        "get_started": "開始使用",
        "learn_more": "了解更多",
        "footer_rights": "© 2026 測試公司 保留所有權利。",
        "terms": "服務條款",
        "privacy": "隱私政策",

        // Approvals Page
        "pending_approvals": "審核報帳單",
        "pending_count": "你有 {count} 個待審核的報帳單",
        "no_pending": "沒有待審核的報帳單",
        "submitted_by": "提交者",
        "expense_details": "費用明細",
        "more_items": "更多項目",
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
        "users": "Users",
        "user_management": "User Management",

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
        "submit_for_approval": "Submit for approval",
        "confirm_submit": "Are you sure you want to submit this report? It cannot be edited after submission.",
        "confirm_delete_report": "Are you sure you want to delete this report? This action cannot be undone.",
        "report_submitted": "Report submitted",
        "report_deleted": "Report deleted",

        // Profile Page
        "account_info": "View your account information",
        "user_id": "User ID",
        "role": "Role",
        "created_at": "Account Created",
        "expense_stats": "Expense Statistics",
        "session_info": "Session Info",
        "name_not_set": "Name not set",
        "total_expense_amount": "Total Expense Amount",
        "email": "Email",
        "name": "Name",

        // Settings Page
        "language_settings": "Language Settings",
        "choose_language": "Choose your preferred language",
        "chinese": "中文",
        "english": "English",
        "notification_settings": "Notification Settings",
        "email_notifications": "Email Notifications",
        "receive_email_updates": "Receive email updates about your expense reports",
        "account_settings": "Account Settings",
        "sign_out_desc": "Sign out of your account",

        // User Management
        "manage_users": "Manage all user accounts and permissions",
        "total_users": "Total Users",
        "admins": "Admins",
        "managers": "Managers",
        "verified": "Verified",
        "user": "User",
        "submitter": "Submitter",
        "date": "Date",
        "amount": "Amount",
        "status": "Status",
        "actions": "Actions",
        "edit_email": "Edit Email",
        "change_password": "Change Password",
        "change_role": "Change Role",
        "verify_email": "Verify Email",
        "delete_user": "Delete User",
        "new_password": "New password",
        "email_updated": "Email updated",
        "password_updated": "Password updated",
        "role_updated": "Role updated",
        "email_verified": "Email verified",
        "user_deleted": "User deleted",
        "unverified": "Unverified",
        "reports_count": "Reports",
        "created": "Created",
        "cannot_delete_self": "Cannot delete yourself",
        "confirm_delete_user": "Are you sure you want to delete this user? This action cannot be undone.",

        // Reports Page
        "view_manage_all": "View and manage all expense reports",
        "all": "All",
        "pending": "Pending",
        "approved": "Approved",
        "rejected": "Rejected",
        "no_expense_reports": "No expense reports",
        "title": "Title",
        "updated": "Updated",
        "deleted": "Deleted",

        // Status
        "status_draft": "Draft",
        "status_pending_manager": "Pending Manager",
        "status_pending_finance": "Pending Finance",
        "status_approved": "Approved",
        "status_rejected": "Rejected",
        "status_paid": "Paid",
        "draft": "Draft",
        "pending_manager": "Pending Manager",
        "pending_finance": "Pending Finance",
        "paid": "Paid",

        // Roles
        "role_user": "User",
        "role_manager": "Manager",
        "role_finance": "Finance",
        "role_admin": "Admin",

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
        "close": "Close",

        // Form Labels
        "description": "Description",
        "category": "Category",
        "receipt": "Receipt",

        // Messages
        "success": "Success",
        "error": "Error",
        "confirm_delete": "Are you sure you want to delete?",
        "operation_failed": "Operation failed",
        "please_enter_valid_email": "Please enter a valid email",
        "password_min_6": "Password must be at least 6 characters",
        "rejection_reason": "Please enter rejection reason:",

        // Login Page
        "login": "Login",
        "login_desc": "Enter your credentials to sign in",
        "email_placeholder": "name@example.com",
        "password": "Password",
        "password_placeholder": "Enter password",
        "login_button": "Sign In",
        "no_account": "Don't have an account?",
        "register_now": "Register Now",
        "login_error": "Invalid email or password",
        "register_success": "Registration successful! Please sign in",

        // Register Page
        "register": "Register",
        "register_desc": "Create your account",
        "confirm_password": "Confirm Password",
        "confirm_password_placeholder": "Re-enter password",
        "register_button": "Register",
        "have_account": "Already have an account?",
        "login_now": "Sign In",
        "passwords_not_match": "Passwords do not match",

        // About Page
        "why_choose_us": "Why Choose Ultimate Expense?",
        "about_desc": "We simplify enterprise expense management, making financial processes easier and more efficient",
        "back_home": "Back to Home",
        "feature_fast": "Fast Expense Reporting",
        "feature_fast_desc": "Submit expense reports in minutes with receipt photo upload",
        "feature_approval": "Multi-level Approval",
        "feature_approval_desc": "From manager to finance, complete approval workflow ensures compliance",
        "feature_secure": "Secure & Reliable",
        "feature_secure_desc": "Enterprise-grade security with encrypted data storage",
        "feature_reports": "Real-time Reports",
        "feature_reports_desc": "Visual reports let you monitor company spending anytime",
        "feature_quick": "Quick Approval",
        "feature_quick_desc": "80% faster approval time, accelerating cash flow",
        "feature_auto": "Automated Workflow",
        "feature_auto_desc": "Auto notifications, auto categorization, smart policy matching",
        "numbers_speak": "Numbers Speak",
        "numbers_desc": "Our customers trust us to handle their financial processes",
        "active_users": "Active Users",
        "enterprise_clients": "Enterprise Clients",
        "system_uptime": "System Uptime",
        "avg_approval_time": "Avg Approval Time",
        "how_it_works": "How It Works",
        "simple_steps": "Just three simple steps",
        "step1_title": "Submit Expense",
        "step1_desc": "Fill in expense details, upload receipt photos",
        "step2_title": "Wait for Review",
        "step2_desc": "Managers and finance will be notified and review",
        "step3_title": "Complete Payment",
        "step3_desc": "Once approved, expenses will be reimbursed quickly",
        "ready_to_start": "Ready to Start?",
        "cta_desc": "Sign up now for a more efficient expense process",
        "free_register": "Free Registration",

        // Landing Page
        "expense_system": "Expense System",
        "sign_in": "Sign In",
        "hero_title": "Expense Management. Perfected.",
        "hero_desc": "Streamline approvals, track spending in real-time, and get reimbursed faster than ever before.",
        "get_started": "Get Started",
        "learn_more": "Learn More",
        "footer_rights": "© 2026 Demo Corp All rights reserved.",
        "terms": "Terms of Service",
        "privacy": "Privacy",

        // Approvals Page
        "pending_approvals": "Pending Approvals",
        "pending_count": "You have {count} pending expense report(s)",
        "no_pending": "No pending expense reports",
        "submitted_by": "Submitted by",
        "expense_details": "Expense Details",
        "more_items": "more items",
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
