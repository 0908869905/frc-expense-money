"use client"

import { ReactNode } from "react"
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

export function DashboardHeader({ userName, children }: DashboardHeaderProps) {
    const { t } = useLanguage()
    const { theme, toggleTheme } = useTheme()

    return (
        <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/50 px-4 header-glass transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
                {children}
                <div className="h-4 w-[1px] bg-border mx-2 hidden sm:block" />
                <span className="text-sm font-medium text-muted-foreground hidden sm:inline">
                    {t("welcome_back")}, <span className="text-foreground">{userName}</span>
                </span>
            </div>
            <div className="flex items-center gap-2 px-4">
                {/* Theme Toggle Button */}
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
            "transition-opacity duration-200",
            isNavigating ? "opacity-50 pointer-events-none" : "opacity-100"
        )}>
            {children}
        </div>
    )
}
