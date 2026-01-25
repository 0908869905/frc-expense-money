"use client"

import { ReactNode } from "react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"
import { useTheme } from "@/lib/theme-context"
import { Sun, Moon, Sparkles } from "lucide-react"

interface DashboardHeaderProps {
    userName: string
    children?: ReactNode
}

export function DashboardHeader({ userName, children }: DashboardHeaderProps) {
    const { t } = useLanguage()
    const { theme, toggleTheme } = useTheme()

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/50 px-4 header-glass transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
                {children}
                <div className="h-4 w-[1px] bg-border mx-2 hidden sm:block" />
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline flex items-center gap-1.5">
                    {t("welcome_back")}, <span className="text-foreground">{userName}</span>
                    <Sparkles className="h-3 w-3 text-primary/60" />
                </span>
            </div>
            <div className="flex items-center gap-2 px-4">
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="theme-toggle-btn p-2.5 rounded-xl transition-all duration-300"
                    title={theme === "dark" ? "切換至淺色模式" : "切換至深色模式"}
                >
                    {theme === "dark" ? (
                        <Sun className="h-5 w-5 text-amber-400" />
                    ) : (
                        <Moon className="h-5 w-5 text-slate-600" />
                    )}
                </button>
                <LanguageSwitcher />
            </div>
        </header>
    )
}

// DashboardWrapper no longer needs LanguageProvider since it's in root layout
export function DashboardWrapper({ children }: { children: ReactNode }) {
    return <>{children}</>
}
