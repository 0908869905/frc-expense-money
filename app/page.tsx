"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Zap, Shield, BarChart3, Clock } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useOrganization } from "@/lib/organization-context"
import { TransitionButton } from "@/components/transitions/transition-button"

export default function LandingPage() {
  const { t, language } = useLanguage()
  const { org } = useOrganization()

  const features = [
    {
      icon: <Zap className="h-5 w-5" />,
      title: language === "zh" ? "快速提交" : "Fast Submit",
      gradient: "from-amber-400 to-orange-500",
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: language === "zh" ? "安全可靠" : "Secure",
      gradient: "from-blue-400 to-cyan-500",
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: language === "zh" ? "即時分析" : "Analytics",
      gradient: "from-purple-400 to-pink-500",
    },
    {
      icon: <Clock className="h-5 w-5" />,
      title: language === "zh" ? "快速審批" : "Quick Approve",
      gradient: "from-emerald-400 to-teal-500",
    },
  ]

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      {/* Artistic Background */}
      <div className="fixed inset-0 -z-10">
        {/* Large gradient circle - artistic focal point */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/40 via-blue-600/30 to-cyan-500/20 blur-3xl animate-pulse" />
          <div className="absolute inset-[100px] rounded-full bg-gradient-to-tr from-pink-500/30 via-purple-500/20 to-transparent blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
        </div>
        {/* Accent lights */}
        <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-purple-500/30 blur-3xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-blue-500/20 blur-3xl" />
        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
      </div>

      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-50">
        <LanguageSwitcher />
      </div>

      {/* Main Content */}
      <main className="relative min-h-screen flex flex-col items-center justify-center px-4 z-10">
        {/* Team Name - HERO */}
        <div className="text-center space-y-6 max-w-4xl">
          {/* Main Title */}
          <h1 className="relative">
            <span className="block text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tighter leading-none">
              <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent drop-shadow-2xl">
                FRC
              </span>
            </span>
            <span className="block text-8xl md:text-9xl lg:text-[12rem] font-black tracking-tighter leading-none -mt-4 md:-mt-8">
              <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                6998
              </span>
            </span>
          </h1>

          {/* Team English Name */}
          <p className="text-2xl md:text-3xl font-light tracking-[0.3em] text-gray-400 uppercase">
            UNIPARDS
          </p>

          {/* Divider */}
          <div className="flex items-center justify-center gap-4 py-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-purple-500/50" />
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-purple-500/50" />
          </div>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-gray-400 font-light">
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
              className="h-14 px-10 text-base font-medium border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 rounded-full transition-all duration-300"
            >
              {t("learn_more")}
            </Button>
          </Link>
        </div>


      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 left-0 right-0 py-6">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 px-6 mx-auto">
          <p className="text-xs text-gray-500">{t("footer_rights")}</p>
          <nav className="flex gap-6">
            <Link className="text-xs text-gray-500 hover:text-gray-300 transition-colors" href="/terms">
              {t("terms")}
            </Link>
            <Link className="text-xs text-gray-500 hover:text-gray-300 transition-colors" href="/privacy">
              {t("privacy")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}