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
      title: language === "zh" ? "快速提交" : "Fast Submit",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      title: language === "zh" ? "安全可靠" : "Secure",
      gradient: "from-blue-400 to-cyan-500",
    },
    {
      title: language === "zh" ? "即時分析" : "Analytics",
      gradient: "from-purple-400 to-pink-500",
    },
    {
      title: language === "zh" ? "快速審批" : "Quick Approve",
      gradient: "from-emerald-400 to-teal-500",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Main Content */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4">
        {/* Brand Name - HERO */}
        <div className="text-center space-y-6 max-w-4xl">
          {/* Main Title */}
          <h1 className="relative">
            <span className="block text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none">
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent drop-shadow-2xl">
                Expense
              </span>
            </span>
            <span className="block text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter leading-none -mt-2 md:-mt-4">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                Flow
              </span>
            </span>
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl font-light tracking-widest text-gray-400 uppercase">
            {language === "zh" ? "智慧報帳系統" : "Smart Expense System"}
          </p>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/50" />
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500/50" />
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-400 font-light">
            {language === "zh" ? "企業級財務管理解決方案" : "Enterprise Financial Management Solution"}
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4">
          <Link href="/login">
            <Button 
              size="lg" 
              className="h-14 px-10 text-base font-medium bg-white text-black hover:bg-gray-100 rounded-full shadow-xl shadow-white/10 transition-all duration-300 hover:scale-105 hover:shadow-white/20"
            >
              {language === "zh" ? "進入系統" : "Enter System"}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/about">
            <Button 
              variant="outline" 
              size="lg" 
              className="h-14 px-10 text-base font-medium border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-full transition-all duration-300"
            >
              {t("learn_more")}
            </Button>
          </Link>
        </div>

        {/* Feature Pills */}
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <span className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient}`} />
              <span className="text-sm font-medium text-gray-300">{feature.title}</span>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 px-6 mx-auto">
          <p className="text-xs text-gray-600">{t("footer_rights")}</p>
          <nav className="flex gap-6">
            <Link className="text-xs text-gray-600 hover:text-gray-400 transition-colors" href="/terms">
              {t("terms")}
            </Link>
            <Link className="text-xs text-gray-600 hover:text-gray-400 transition-colors" href="/privacy">
              {t("privacy")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}