"use client"

import { ReactNode } from "react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"
import { useTheme } from "@/lib/theme-context"
import { Sun, Moon } from "lucide-react"

interface DashboardHeaderProps {
    userName: string
    children?: ReactNode
}

export function DashboardHeader({ userName, children }: DashboardHeaderProps) {
    const { t } = useLanguage()
    const { theme, toggleTheme } = useTheme()

    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/50 backdrop-blur transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
                {children}
                <div className="h-4 w-[1px] bg-border mx-2 hidden sm:block" />
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                    {t("welcome_back")}, {userName}
                </span>
            </div>
            <div className="flex items-center gap-2 px-4">
                {/* Theme Toggle Button */}
                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    title={theme === "dark" ? "切換至淺色模式" : "切換至深色模式"}
                >
                    {theme === "dark" ? (
                        <Sun className="h-5 w-5 text-yellow-500" />
                    ) : (
                        <Moon className="h-5 w-5 text-slate-700" />
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
