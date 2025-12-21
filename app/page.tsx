"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ArrowRight, Zap, Shield, BarChart3, Clock } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useOrganization } from "@/lib/organization-context"

export default function LandingPage() {
  const { t, language } = useLanguage()
  const { org } = useOrganization()

  const features = [
    {
      icon: <Zap className="h-6 w-6" />,
      title: language === "zh" ? "快速提交" : "Fast Submission",
      desc: language === "zh" ? "幾秒內完成報帳申請" : "Submit expenses in seconds",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: language === "zh" ? "安全可靠" : "Secure & Reliable",
      desc: language === "zh" ? "企業級資料保護" : "Enterprise-grade security",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: language === "zh" ? "即時分析" : "Real-time Analytics",
      desc: language === "zh" ? "追蹤支出趨勢" : "Track spending trends",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: language === "zh" ? "快速審批" : "Quick Approval",
      desc: language === "zh" ? "簡化審批流程" : "Streamlined approval workflow",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <Link className="flex items-center gap-3" href="/">
            <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${org.bgColor}`}>
              <img src={org.logo} alt={org.name} className="h-6 w-6 object-contain" />
            </div>
            <span className="font-bold text-lg">{org.name}</span>
          </Link>
          <nav className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link href="/login">
              <Button variant="ghost" size="sm">{t("sign_in")}</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">{language === "zh" ? "立即開始" : "Get Started"}</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-20 md:py-32">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-0 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
          </div>

          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center text-center space-y-8">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm font-medium shadow-sm">
                <Zap className="h-4 w-4 text-primary" />
                <span>{language === "zh" ? "全新升級體驗" : "New & Improved"}</span>
              </div>

              {/* Title */}
              <div className="space-y-4 max-w-3xl">
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  <span className="text-primary">{language === "zh" ? "智慧" : "Smart"}</span>
                  {language === "zh" ? "報帳管理" : " Expense Management"}
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
                  {language === "zh"
                    ? "簡化您的費用報銷流程。快速提交、智能審批、即時追蹤。"
                    : "Streamline your expense workflow. Submit fast, approve smart, track in real-time."}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-8 text-base shadow-lg">
                    {t("get_started")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                    {t("learn_more")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t bg-muted/30 py-20">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                {language === "zh" ? "核心功能" : "Key Features"}
              </h2>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group flex flex-col items-center text-center p-6 rounded-xl bg-card border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 font-semibold text-lg">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/20">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6">
          <p className="text-sm text-muted-foreground">{t("footer_rights")}</p>
          <nav className="flex gap-6">
            <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">
              {t("terms")}
            </Link>
            <Link className="text-sm text-muted-foreground hover:text-foreground transition-colors" href="#">
              {t("privacy")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}