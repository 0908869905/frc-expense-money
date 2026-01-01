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
        "dashboard": "?€è¡¨æ¿",
        "my_expenses": "?‘ç??±è²»",
        "approvals": "å¯©æ ¸",
        "all_reports": "?€?‰å ±è¡?,
        "profile": "?‹äººè³‡æ?",
        "settings": "è¨­å?",
        "sign_out": "?»å‡º",
        "welcome_back": "æ­¡è??ä?",
        "loading": "è¼‰å…¥ä¸?..",
        "users": "?¨æˆ¶ç®¡ç?",
        "user_management": "?¨æˆ¶ç®¡ç?",

        // Dashboard
        "manage_expenses": "ç®¡ç??Œè¿½è¹¤ä??„å ±å¸³å–®",
        "total_reports": "?±å¸³?®æ•¸??,
        "total_items": "?±è²»?…ç›®??,
        "total_amount": "ç¸½é?é¡?,
        "recent_reports": "è¿‘æ??±è¡¨",
        "no_reports": "?„æ??‰å ±å¸³å–®",
        "no_reports_yet": "ä½ é?æ²’æ?ä»»ä??±å¸³??,
        "create_first": "å»ºç?ç¬¬ä?ç­†å ±å¸³å–®",
        "new_report": "+ ?°å??±å¸³??,

        // Expenses Page
        "view_manage_expenses": "?¥ç??Œç®¡?†ä??„æ??‰å ±å¸³å–®",
        "created_on": "å»ºç???,
        "items_count": "ç­†èŠ±è²?,
        "expense_items": "?±è²»?…ç›®",
        "submit_for_approval": "?äº¤å¯©æ ¸",
        "confirm_submit": "ç¢ºå?è¦æ?äº¤æ­¤?±å¸³?®å?ï¼Ÿæ?äº¤å?å°‡ç„¡æ³•ç·¨è¼¯ã€?,
        "confirm_delete_report": "ç¢ºå?è¦åˆª?¤æ­¤?±å¸³?®å?ï¼Ÿæ­¤?ä??¡æ?å¾©å???,
        "report_submitted": "?±å¸³?®å·²?äº¤",
        "report_deleted": "?±å¸³?®å·²?ªé™¤",

        // Profile Page
        "account_info": "?¥ç?ä½ ç?å¸³æˆ¶è³‡è?",
        "user_id": "?¨æˆ¶ ID",
        "role": "è§’è‰²",
        "created_at": "å¸³æˆ¶å»ºç??‚é?",
        "expense_stats": "?±å¸³çµ±è?",
        "session_info": "Session è³‡è?",
        "name_not_set": "?ªè¨­å®šå?ç¨?,
        "total_expense_amount": "ç¸½å ±å¸³é?é¡?,
        "email": "?»å??µä»¶",
        "name": "å§“å?",

        // Settings Page
        "language_settings": "èªè?è¨­å?",
        "choose_language": "?¸æ?ä½ å?å¥½ç?èªè?",
        "chinese": "ä¸­æ?",
        "english": "English",
        "notification_settings": "?šçŸ¥è¨­å?",
        "email_notifications": "?»å??µä»¶?šçŸ¥",
        "receive_email_updates": "?¥æ”¶?±å¸³?®ç??‹æ›´?°ç??»å??µä»¶",
        "account_settings": "å¸³æˆ¶è¨­å?",
        "sign_out_desc": "?»å‡ºä½ ç?å¸³æˆ¶",

        // User Management
        "manage_users": "ç®¡ç??€?‰ç”¨?¶å¸³?Ÿå?æ¬Šé?",
        "total_users": "ç¸½ç”¨??,
        "admins": "ç®¡ç???,
        "managers": "ä¸»ç®¡",
        "verified": "å·²é?è­?,
        "user": "?¨æˆ¶",
        "submitter": "?äº¤??,
        "date": "?¥æ?",
        "amount": "?‘é?",
        "status": "?€??,
        "actions": "?ä?",
        "edit_email": "ç·¨è¼¯ Email",
        "change_password": "?´æ”¹å¯†ç¢¼",
        "change_role": "?´æ”¹è§’è‰²",
        "verify_email": "é©—è? Email",
        "delete_user": "?ªé™¤?¨æˆ¶",
        "new_password": "?°å?ç¢?,
        "email_updated": "Email å·²æ›´??,
        "password_updated": "å¯†ç¢¼å·²æ›´??,
        "role_updated": "è§’è‰²å·²æ›´??,
        "email_verified": "Email å·²é?è­?,
        "user_deleted": "?¨æˆ¶å·²åˆª??,
        "unverified": "?ªé?è­?,
        "reports_count": "?±è¡¨??,
        "created": "å»ºç??¥æ?",
        "cannot_delete_self": "?¡æ??ªé™¤?ªå·±",
        "confirm_delete_user": "ç¢ºå?è¦åˆª?¤æ­¤?¨æˆ¶?ï?æ­¤æ?ä½œç„¡æ³•å¾©?Ÿã€?,

        // Reports Page
        "view_manage_all": "?¥ç??Œç®¡?†æ??‰å ±å¸³å–®",
        "all": "?¨éƒ¨",
        "pending": "å¾…å¯©??,
        "approved": "å·²æ ¸??,
        "rejected": "å·²æ?çµ?,
        "no_expense_reports": "æ²’æ??±å¸³??,
        "title": "æ¨™é?",
        "updated": "å·²æ›´??,
        "deleted": "å·²åˆª??,

        // Status
        "status_draft": "?‰ç¨¿",
        "status_pending_manager": "å¾…ä¸»ç®¡å¯©??,
        "status_pending_finance": "å¾…è²¡?™å¯©??,
        "status_approved": "å·²æ ¸??,
        "status_rejected": "å·²æ?çµ?,
        "status_paid": "å·²ä?æ¬?,
        "draft": "?‰ç¨¿",
        "pending_manager": "å¾…ä¸»ç®¡å¯©??,
        "pending_finance": "å¾…è²¡?™å¯©??,
        "paid": "å·²ä?æ¬?,

        // Roles
        "role_user": "ä¸€?¬ç”¨??,
        "role_manager": "ä¸»ç®¡",
        "role_finance": "è²¡å?",
        "role_admin": "ç®¡ç???,

        // Categories
        "category_food": "é¤é£²",
        "category_transport": "äº¤é€?,
        "category_housing": "ä½å®¿",
        "category_entertainment": "å¨›æ?",
        "category_utilities": "æ°´é›»",
        "category_health": "?«ç?",
        "category_other": "?¶ä?",

        // Actions
        "submit": "?äº¤",
        "cancel": "?–æ?",
        "save": "?²å?",
        "delete": "?ªé™¤",
        "edit": "ç·¨è¼¯",
        "view": "?¥ç?",
        "approve": "?¸å?",
        "reject": "?’ç?",
        "close": "?œé?",

        // Form Labels
        "description": "èªªæ?",
        "category": "é¡åˆ¥",
        "receipt": "?¶æ?",

        // Messages
        "success": "?å?",
        "error": "?¯èª¤",
        "confirm_delete": "ç¢ºå?è¦åˆª?¤å?ï¼?,
        "operation_failed": "?ä?å¤±æ?",
        "please_enter_valid_email": "è«‹è¼¸?¥æ??ˆç? Email",
        "password_min_6": "å¯†ç¢¼?³å? 6 ?‹å???,
        "rejection_reason": "è«‹è¼¸?¥æ?çµ•å?? ï?",

        // Login Page
        "login": "?»å…¥",
        "login_desc": "è¼¸å…¥ä½ ç?å¸³è?å¯†ç¢¼?»å…¥ç³»çµ±",
        "email_placeholder": "name@example.com",
        "password": "å¯†ç¢¼",
        "password_placeholder": "è¼¸å…¥å¯†ç¢¼",
        "login_button": "?»å…¥",
        "no_account": "?„æ??‰å¸³?Ÿï?",
        "register_now": "ç«‹å³è¨»å?",
        "login_error": "?»å??µä»¶?–å?ç¢¼éŒ¯èª?,
        "register_success": "è¨»å??å?ï¼è?ä½¿ç”¨ä½ ç?å¸³è??»å…¥",

        // Register Page
        "register": "è¨»å?",
        "register_desc": "å»ºç?ä½ ç?å¸³æˆ¶",
        "confirm_password": "ç¢ºè?å¯†ç¢¼",
        "confirm_password_placeholder": "?æ¬¡è¼¸å…¥å¯†ç¢¼",
        "register_button": "è¨»å?",
        "have_account": "å·²ç??‰å¸³?Ÿï?",
        "login_now": "ç«‹å³?»å…¥",
        "passwords_not_match": "å¯†ç¢¼ä¸ä???,

        // About Page
        "why_choose_us": "?ºä?éº¼é¸??Ultimate Expenseï¼?,
        "about_desc": "?‘å€‘è‡´?›æ–¼ç°¡å?ä¼æ¥­?±å¸³æµç?ï¼Œè?è²¡å?ç®¡ç?è®Šå??´ç°¡?®ã€æ›´é«˜æ?",
        "back_home": "è¿”å?é¦–é?",
        "feature_fast": "å¿«é€Ÿå ±å¸?,
        "feature_fast_desc": "?ªé?å¹¾å??˜å³?¯æ?äº¤å ±å¸³å–®ï¼Œæ”¯?´æ”¶?šæ??§ä???,
        "feature_approval": "å¤šç?å¯©æ ¸",
        "feature_approval_desc": "å¾ä¸»ç®¡åˆ°è²¡å?ï¼Œå??´ç?å¯©æ ¸æµç?ç¢ºä??ˆè???,
        "feature_secure": "å®‰å…¨?¯é?",
        "feature_secure_desc": "ä¼æ¥­ç´šå??¨é˜²è­·ï?è³‡æ?? å?å­˜å„²",
        "feature_reports": "?³æ??±è¡¨",
        "feature_reports_desc": "è¦–è¦º?–å ±è¡¨è??¨éš¨?‚æ??¡å…¬?¸æ”¯?ºç?æ³?,
        "feature_quick": "å¿«é€Ÿå¯©??,
        "feature_quick_desc": "å¹³å?å¯©æ‰¹?‚é?ç¸®çŸ­ 80%ï¼Œå??Ÿè??‘é€±è?",
        "feature_auto": "?ªå??–æ?ç¨?,
        "feature_auto_desc": "?ªå??šçŸ¥?è‡ª?•å?é¡ã€æ™º?½åŒ¹?æ”¿ç­?,
        "numbers_speak": "?¸å?èªªè©±",
        "numbers_desc": "?‘å€‘ç?å®¢æˆ¶ä¿¡ä»»?‘å€‘è??†ä??‘ç?è²¡å?æµç?",
        "active_users": "æ´»è??¨æˆ¶",
        "enterprise_clients": "ä¼æ¥­å®¢æˆ¶",
        "system_uptime": "ç³»çµ±ç©©å?åº?,
        "avg_approval_time": "å¹³å?å¯©æ‰¹?‚é?",
        "how_it_works": "å¦‚ä??‹ä?",
        "simple_steps": "?ªé?ä¸‰å€‹ç°¡?®æ­¥é©?,
        "step1_title": "?äº¤?±å¸³",
        "step1_desc": "å¡«å¯«è²»ç”¨?ç´°ï¼Œä??³æ”¶?šç…§??,
        "step2_title": "ç­‰å?å¯©æ ¸",
        "step2_desc": "ä¸»ç®¡?Œè²¡?™æ??¶åˆ°?šçŸ¥ä¸¦é€²è?å¯©æ ¸",
        "step3_title": "å®Œæ?ä»˜æ¬¾",
        "step3_desc": "å¯©æ ¸?šé?å¾Œï?è²»ç”¨å°‡å¿«?Ÿæ’¥ä»?,
        "ready_to_start": "æº–å?å¥½é?å§‹ä??ï?",
        "cta_desc": "ç«‹å³è¨»å?ï¼Œé?é©—æ›´é«˜æ??„å ±å¸³æ?ç¨?,
        "free_register": "?è²»è¨»å?",

        // Landing Page
        "expense_system": "?±å¸³ç³»çµ±",
        "sign_in": "?»å…¥",
        "hero_title": "?±å¸³ç®¡ç??‚æ›´ç°¡å–®??,
        "hero_desc": "ç°¡å?å¯©æ‰¹æµç?ï¼Œå³?‚è¿½è¹¤æ”¯?ºï??´å¿«?²å??±éŠ·??,
        "get_started": "?‹å?ä½¿ç”¨",
        "learn_more": "äº†è§£?´å?",
        "footer_rights": "Â© 2024 Ultimate Expense Inc. ä¿ç??€?‰æ??©ã€?,
        "terms": "?å?æ¢æ¬¾",
        "privacy": "?±ç??¿ç?",

        // Approvals Page
        "pending_approvals": "å¯©æ ¸?±å¸³??,
        "pending_count": "ä½ æ? {count} ?‹å?å¯©æ ¸?„å ±å¸³å–®",
        "no_pending": "æ²’æ?å¾…å¯©?¸ç??±å¸³??,
        "submitted_by": "?äº¤??,
        "expense_details": "è²»ç”¨?ç´°",
        "more_items": "?´å??…ç›®",
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
        "chinese": "ä¸­æ?",
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
        "footer_rights": "Â© 2024 Ultimate Expense Inc. All rights reserved.",
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

