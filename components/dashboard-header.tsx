"use client"

import { ReactNode } from "react"
import { usePathname } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"
import { useTheme } from "@/lib/theme-context"
import { useNavigationProgress } from "@/lib/navigation-progress-context"
import { cn } from "@/lib/utils"
import { Moon, Sun } from "lucide-react"

interface DashboardHeaderProps {
    userName: string
    children?: ReactNode
}

// 路徑 → 頁面名稱（mono 麵包屑用）
const PATH_LABELS: Record<string, { zh: string; en: string }> = {
    "/dashboard": { zh: "儀表板", en: "Dashboard" },
    "/dashboard/expenses": { zh: "我的花費", en: "My Expenses" },
    "/dashboard/expenses/new": { zh: "新增報帳單", en: "New Report" },
    "/dashboard/approvals": { zh: "審核", en: "Approvals" },
    "/dashboard/funding": { zh: "資金記錄", en: "Funding" },
    "/dashboard/reports": { zh: "所有報表", en: "All Reports" },
    "/dashboard/analytics": { zh: "數據分析", en: "Analytics" },
    "/dashboard/inventory": { zh: "庫存管理", en: "Inventory" },
    "/dashboard/inventory/scan": { zh: "掃描", en: "Scan" },
    "/dashboard/stats": { zh: "系統統計", en: "Stats" },
    "/dashboard/users": { zh: "用戶管理", en: "Users" },
    "/dashboard/profile": { zh: "個人資料", en: "Profile" },
    "/dashboard/settings": { zh: "設定", en: "Settings" },
}

export function DashboardHeader({ userName, children }: DashboardHeaderProps) {
    const { language } = useLanguage()
    const { theme, toggleTheme } = useTheme()
    const pathname = usePathname()

    // 組合 mono 麵包屑：BUDGETFLOW / 頁面（子頁顯示雙層）
    const segments: string[] = []
    const parts = pathname.split("/").filter(Boolean)
    for (let i = 2; i <= parts.length; i++) {
        const p = "/" + parts.slice(0, i).join("/")
        const label = PATH_LABELS[p]
        if (label) segments.push(language === "zh" ? label.zh : label.en)
    }

    return (
        <header className="sticky top-0 z-40 flex h-12 shrink-0 items-center justify-between gap-2 border-b border-border px-4 header-glass">
            <div className="flex items-center gap-3 min-w-0">
                {children}
                <div className="h-4 w-px bg-border hidden sm:block" />
                <nav className="flex items-baseline gap-2 font-mono text-xs text-muted-foreground min-w-0 truncate" aria-label="Breadcrumb">
                    <span className="uppercase tracking-[0.14em]">BudgetFlow</span>
                    {segments.map((seg, i) => (
                        <span key={i} className="flex items-baseline gap-2 min-w-0">
                            <span className="text-border">/</span>
                            <span className={cn("truncate", i === segments.length - 1 && "text-foreground font-medium")}>{seg}</span>
                        </span>
                    ))}
                </nav>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={toggleTheme}
                    className="theme-toggle-btn p-2 rounded-md"
                    title={theme === "dark" ? "切換至淺色模式" : "切換至深色模式"}
                >
                    {theme === "dark" ? (
                        <Sun className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <Moon className="h-4 w-4 text-muted-foreground" />
                    )}
                </button>
                <LanguageSwitcher />
            </div>
        </header>
    )
}

// DashboardWrapper with navigation transition effect
export function DashboardWrapper({ children }: { children: ReactNode }) {
    const { isNavigating } = useNavigationProgress()

    return (
        <div className={cn(
            "flex flex-1 flex-col transition-opacity duration-200",
            isNavigating ? "opacity-50 pointer-events-none" : "opacity-100"
        )}>
            {children}
        </div>
    )
}
