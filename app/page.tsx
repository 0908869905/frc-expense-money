"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ArrowRight, Zap, Shield, BarChart3, Clock, Sparkles } from "lucide-react"
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
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: language === "zh" ? "安全可靠" : "Secure & Reliable",
      desc: language === "zh" ? "企業級資料保護" : "Enterprise-grade security",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: language === "zh" ? "即時分析" : "Real-time Analytics",
      desc: language === "zh" ? "追蹤支出趨勢" : "Track spending trends",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: language === "zh" ? "快速審批" : "Quick Approval",
      desc: language === "zh" ? "簡化審批流程" : "Streamlined approval workflow",
      gradient: "from-green-500 to-emerald-500",
    },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0f] text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full bg-purple-600/30 blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] right-[-10%] h-[400px] w-[400px] rounded-full bg-blue-600/20 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-[-10%] left-[30%] h-[450px] w-[450px] rounded-full bg-cyan-600/20 blur-[100px] animate-pulse" style={{ animationDelay: "2s" }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative py-20 md:py-32">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center text-center space-y-10">
              {/* Logo with glow */}
              <Link className="flex items-center gap-4 group" href="/">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className={`relative flex h-16 w-16 items-center justify-center rounded-2xl ${org.bgColor} border border-white/10 backdrop-blur-sm`}>
                    <img src={org.logo} alt={org.name} className="h-10 w-10 object-contain" />
                  </div>
                </div>
                <span className="font-bold text-3xl bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  {org.name}
                </span>
              </Link>

              {/* Title with gradient */}
              <div className="space-y-6 max-w-4xl">
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                  <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                    {language === "zh" ? "智慧" : "Smart"}
                  </span>
                  <br />
                  <span className="text-white">
                    {language === "zh" ? "報帳管理" : "Expense Management"}
                  </span>
                </h1>
                <p className="mx-auto max-w-2xl text-lg text-gray-400 md:text-xl leading-relaxed">
                  {language === "zh"
                    ? "簡化您的費用報銷流程。快速提交、智能審批、即時追蹤。"
                    : "Streamline your expense workflow. Submit fast, approve smart, track in real-time."}
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <Link href="/login">
                  <Button 
                    size="lg" 
                    className="h-14 px-8 text-base bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-0 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105"
                  >
                    <Sparkles className="mr-2 h-5 w-5" />
                    {t("get_started")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="h-14 px-8 text-base border-white/20 bg-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-white/30 transition-all duration-300"
                  >
                    {t("learn_more")}
                  </Button>
                </Link>
                <LanguageSwitcher />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-24 border-t border-white/5">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                {language === "zh" ? "核心功能" : "Key Features"}
              </h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="group relative flex flex-col items-center text-center p-8 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/20 transition-all duration-300 hover:scale-105"
                >
                  {/* Glow effect on hover */}
                  <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${feature.gradient} opacity-0 blur-xl group-hover:opacity-20 transition-opacity duration-300`} />
                  
                  <div className={`relative mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r ${feature.gradient} text-white shadow-lg`}>
                    {feature.icon}
                  </div>
                  <h3 className="relative mb-3 font-semibold text-xl text-white">{feature.title}</h3>
                  <p className="relative text-sm text-gray-400">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-white/5 py-8 bg-black/20 backdrop-blur-sm">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4 px-4 md:px-6 mx-auto">
          <p className="text-sm text-gray-500">{t("footer_rights")}</p>
          <nav className="flex gap-6">
            <Link className="text-sm text-gray-500 hover:text-white transition-colors" href="/terms">
              {t("terms")}
            </Link>
            <Link className="text-sm text-gray-500 hover:text-white transition-colors" href="/privacy">
              {t("privacy")}
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}