"use client"

import { RegisterForm } from "@/components/register-form"
import { Shield } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function RegisterPage() {
    const { t } = useLanguage()

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
            {/* Language Switcher - Top Right */}
            <div className="absolute top-4 right-4">
                <LanguageSwitcher />
            </div>

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="flex aspect-square size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                            <Shield className="size-6" />
                        </div>
                        <span className="text-2xl font-bold">{t("expense_system")}</span>
                    </Link>
                </div>

                {/* Register Card */}
                <div className="bg-card border rounded-2xl shadow-lg p-8">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold text-foreground">{t("register")}</h1>
                        <p className="text-muted-foreground mt-1">
                            {t("register_desc")}
                        </p>
                    </div>

                    <RegisterForm />
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-muted-foreground mt-6">
                    {t("footer_rights")}
                </p>
            </div>
        </div>
    )
}
