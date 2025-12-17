"use client"

import { ReactNode } from "react"
import { LanguageProvider } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"

interface DashboardHeaderProps {
    userName: string
    children?: ReactNode
}

export function DashboardHeader({ userName, children }: DashboardHeaderProps) {
    return (
        <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 bg-background/50 backdrop-blur transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
            <div className="flex items-center gap-2 px-4">
                {children}
                <div className="h-4 w-[1px] bg-border mx-2" />
                <span className="text-sm font-medium text-muted-foreground">
                    Welcome back, {userName}
                </span>
            </div>
            <div className="flex items-center gap-2 px-4">
                <LanguageSwitcher />
            </div>
        </header>
    )
}

export function DashboardWrapper({ children }: { children: ReactNode }) {
    return (
        <LanguageProvider>
            {children}
        </LanguageProvider>
    )
}
