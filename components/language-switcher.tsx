"use client"

import { useLanguage } from "@/lib/language-context"
import { Globe } from "lucide-react"

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()

    const toggleLanguage = () => {
        setLanguage(language === "zh" ? "en" : "zh")
    }

    return (
        <button
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border bg-background hover:bg-muted transition-colors"
            title={language === "zh" ? "Switch to English" : "切換至中文"}
        >
            <Globe className="h-4 w-4" />
            <span>{language === "zh" ? "EN" : "中"}</span>
        </button>
    )
}
