"use client"

import { OrganizationProvider } from "@/lib/organization-context"
import { LanguageProvider } from "@/lib/language-context"
import { OrganizationSwitcher } from "@/components/organization-switcher"

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <OrganizationProvider>
            <LanguageProvider>
                {children}
                <OrganizationSwitcher />
            </LanguageProvider>
        </OrganizationProvider>
    )
}
