"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useOrganization } from "@/lib/organization-context"
import { TransitionButton } from "@/components/transitions/transition-button"

export default function LandingPage() {
  const { t, language } = useLanguage()
  const { org } = useOrganization()

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* 藍圖網格背景 */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.5) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* 左上：系統代號 */}
      <div className="absolute top-6 left-6 z-50">
        <span className="ledger-label">BudgetFlow</span>
      </div>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Main Content */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 z-10">
        {/* Team Name - HERO */}
        <div className="text-center space-y-6 max-w-4xl">
          {/* Eyebrow */}
          <p className="font-mono text-sm text-primary tracking-[0.25em] uppercase">
            FIRST Robotics Competition
          </p>

          {/* Main Title */}
          <h1 className="relative">
            <span className="block text-8xl md:text-9xl lg:text-[11rem] font-bold tracking-tight leading-none">
              FRC
            </span>
            <span className="block font-mono text-8xl md:text-9xl lg:text-[11rem] font-semibold tracking-tight leading-none -mt-2 md:-mt-4 text-primary">
              6998
            </span>
          </h1>

          {/* Team English Name */}
          <p className="font-mono text-xl md:text-2xl tracking-[0.35em] text-muted-foreground uppercase">
            UNIPARDS
          </p>

          {/* Divider */}
          <div className="flex items-center justify-center py-2">
            <div className="h-px w-24 bg-primary" />
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground">
            {language === "zh" ? "團隊財務管理系統" : "Team Financial Management System"}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 relative z-20">
          <TransitionButton language={language} />
          <Link href="/about">
            <Button
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base font-medium"
            >
              {t("learn_more")}
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 px-6 mx-auto">
          <p className="text-xs text-muted-foreground/70 font-mono">{t("footer_rights")}</p>
          <nav className="flex gap-6">
            <Link className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="/terms">
              {t("terms")}
            </Link>
            <Link className="text-xs text-muted-foreground hover:text-foreground transition-colors" href="/privacy">
              {t("privacy")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
