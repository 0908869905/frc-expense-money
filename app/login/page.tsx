"use client"

import React, { useState, Suspense, useCallback, useRef } from "react"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"
import { Loader2, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useOrganization } from "@/lib/organization-context"
import { LoadingScreen, LoginResult } from "@/components/loading/loading-screen"

interface LoginFormProps {
  onLoginStart: (email: string, password: string) => void
  error: string
}

function LoginForm({ onLoginStart, error }: LoginFormProps) {
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // 立即觸發載入動畫，同時在背景進行登入驗證
    onLoginStart(email, password)
  }

  return (
    <>
      {registered && (
        <div className="mb-6 p-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl text-sm backdrop-blur-sm">
          {t("register_success")}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl text-sm backdrop-blur-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-300">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("email_placeholder")}
            required
            className="h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl transition-all text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-300">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={t("password_placeholder")}
            required
            className="h-14 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl transition-all text-base"
          />
        </div>
        <Button
          className="w-full h-14 bg-white text-black hover:bg-gray-100 border-0 rounded-xl shadow-lg shadow-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-white/20 text-base font-medium"
          type="submit"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              {t("login_button")}
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </form>
    </>
  )
}

export default function LoginPage() {
  const { t, language } = useLanguage()
  const { org } = useOrganization()
  const [showLoading, setShowLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const loginPromiseRef = useRef<Promise<LoginResult> | null>(null)

  // 點擊登入按鈕時立即顯示載入動畫，同時開始登入
  const handleLoginStart = useCallback((email: string, password: string) => {
    setLoginError("")

    // 創建登入 Promise
    loginPromiseRef.current = new Promise<LoginResult>(async (resolve) => {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        resolve({ success: false, error: t("login_error") })
      } else {
        resolve({ success: true })
      }
    })

    // 立即顯示載入動畫
    setShowLoading(true)
  }, [t])

  // 載入動畫完成後的回調
  const handleLoadingComplete = useCallback((result: LoginResult) => {
    if (result.success) {
      // 登入成功，導向儀表板
      window.location.href = "/dashboard"
    } else {
      // 登入失敗，返回登入頁面顯示錯誤
      setShowLoading(false)
      setLoginError(result.error || t("login_error"))
    }
  }, [t])

  // 顯示載入畫面
  if (showLoading && loginPromiseRef.current) {
    return (
      <LoadingScreen
        language={language}
        onComplete={handleLoadingComplete}
        loginPromise={loginPromiseRef.current}
      />
    )
  }

  return (
    <div className="min-h-screen flex bg-black text-white overflow-hidden">
      {/* Left Side - Artistic Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center">
        {/* Artistic Background */}
        <div className="absolute inset-0">
          {/* Large gradient orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/50 via-blue-600/40 to-cyan-500/30 blur-3xl animate-pulse" />
            <div className="absolute inset-[80px] rounded-full bg-gradient-to-tr from-pink-500/40 via-purple-500/30 to-transparent blur-2xl animate-pulse" style={{ animationDelay: "1s" }} />
          </div>
          {/* Accent lights */}
          <div className="absolute top-20 left-20 w-40 h-40 rounded-full bg-purple-500/40 blur-3xl" />
          <div className="absolute bottom-20 right-20 w-32 h-32 rounded-full bg-blue-500/30 blur-3xl" />
          {/* Noise texture */}
          <div className="absolute inset-0 opacity-[0.015] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjMwMCIgaGVpZ2h0PSIzMDAiIGZpbHRlcj0idXJsKCNhKSIgb3BhY2l0eT0iMSIvPjwvc3ZnPg==')]" />
        </div>

        {/* Hero Text */}
        <div className="relative z-10 text-center px-12">
          <h1 className="text-7xl font-black tracking-tighter leading-none mb-4">
            <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
              FRC
            </span>
          </h1>
          <h1 className="text-7xl font-black tracking-tighter leading-none mb-8">
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              6998
            </span>
          </h1>
          <p className="text-xl tracking-[0.3em] text-gray-400 uppercase font-light">
            UNIPARDS
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-purple-500/50" />
            <div className="w-2 h-2 rounded-full bg-purple-500" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-purple-500/50" />
          </div>
          <p className="mt-8 text-gray-500 text-sm">
            {language === "zh" ? "團隊財務管理系統" : "Team Financial Management System"}
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative">
        {/* Background for mobile */}
        <div className="absolute inset-0 lg:hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-600/30 via-blue-600/20 to-transparent blur-3xl" />
        </div>

        {/* Language Switcher */}
        <div className="absolute top-6 right-6 z-50">
          <LanguageSwitcher />
        </div>

        {/* Form Container */}
        <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 relative z-10">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-12">
              <Link href="/">
                <h1 className="text-5xl font-black tracking-tighter">
                  <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">FRC </span>
                  <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">6998</span>
                </h1>
              </Link>
            </div>

            {/* Welcome Text */}
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-white mb-2">
                {language === "zh" ? "歡迎回來" : "Welcome back"}
              </h2>
              <p className="text-gray-400">
                {t("login_desc")}
              </p>
            </div>

            {/* Login Form */}
            <Suspense fallback={<div className="animate-pulse h-64 bg-white/5 rounded-2xl" />}>
              <LoginForm onLoginStart={handleLoginStart} error={loginError} />
            </Suspense>

            {/* Register Link */}
            <div className="mt-10 text-center">
              <p className="text-gray-500">
                {t("no_account")}{" "}
                <Link href="/register" className="text-white hover:text-purple-400 transition-colors font-medium">
                  {t("register_now")}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 px-6 text-center">
          <p className="text-xs text-gray-600">{t("footer_rights")}</p>
        </div>
      </div>
    </div>
  )
}
