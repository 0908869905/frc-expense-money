"use client"

import { ReactNode } from "react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"

interface DashboardHeaderProps {
    userName: string
    children?: ReactNode
}

export function DashboardHeader({ userName, children }: DashboardHeaderProps) {
    const { t } = useLanguage()
    
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
                <LanguageSwitcher />
            </div>
        </header>
    )
}

// DashboardWrapper no longer needs LanguageProvider since it's in root layout
export function DashboardWrapper({ children }: { children: ReactNode }) {
    return <>{children}</>
}
