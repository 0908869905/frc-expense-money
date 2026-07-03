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
        <div className="mb-6 p-3 bg-ok/10 text-ok border border-ok/30 rounded-md text-sm">
          {t("register_success")}
        </div>
      )}

      {error && (
        <div className="mb-6 p-3 bg-danger/10 text-danger border border-danger/30 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("email_placeholder")}
            required
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={t("password_placeholder")}
            required
            className="h-12 text-base"
          />
        </div>
        <Button
          className="w-full h-12 text-base font-medium"
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
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden">
      {/* Left Side - 工程圖框品牌面板 */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between border-r border-border p-12">
        {/* 藍圖網格背景 */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-60"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.5) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* 左上：系統代號 */}
        <div className="relative z-10">
          <span className="ledger-label">BudgetFlow</span>
        </div>

        {/* 中央：隊伍識別 */}
        <div className="relative z-10">
          <p className="font-mono text-sm text-primary mb-4 tracking-[0.2em] uppercase">
            FIRST Robotics Competition
          </p>
          <h1 className="text-7xl font-bold tracking-tight leading-none mb-2">
            FRC
          </h1>
          <h1 className="font-mono text-7xl font-semibold tracking-tight leading-none mb-6">
            6998
          </h1>
          <p className="font-mono text-xl tracking-[0.35em] text-muted-foreground uppercase">
            UNIPARDS
          </p>
          <div className="mt-8 h-px w-24 bg-primary" />
          <p className="mt-6 text-sm text-muted-foreground">
            {language === "zh" ? "團隊財務管理系統" : "Team Financial Management System"}
          </p>
        </div>

        {/* 左下：圖框 title block（工程圖標題欄） */}
        <div className="relative z-10 border border-border bg-card/80 rounded-md overflow-hidden max-w-xs">
          <div className="grid grid-cols-[auto_1fr] text-xs font-mono">
            <span className="px-3 py-1.5 border-b border-r border-border text-muted-foreground uppercase tracking-wider">Team</span>
            <span className="px-3 py-1.5 border-b border-border">{org.name} {org.subtitle}</span>
            <span className="px-3 py-1.5 border-b border-r border-border text-muted-foreground uppercase tracking-wider">System</span>
            <span className="px-3 py-1.5 border-b border-border">BudgetFlow</span>
            <span className="px-3 py-1.5 border-r border-border text-muted-foreground uppercase tracking-wider">Origin</span>
            <span className="px-3 py-1.5">Taiwan</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative">
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
                <h1 className="text-4xl font-bold tracking-tight">
                  FRC <span className="font-mono text-primary">6998</span>
                </h1>
                <p className="mt-2 font-mono text-xs tracking-[0.3em] text-muted-foreground uppercase">
                  UNIPARDS
                </p>
              </Link>
            </div>

            {/* Welcome Text */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-2">
                {language === "zh" ? "歡迎回來" : "Welcome back"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("login_desc")}
              </p>
            </div>

            {/* Login Form */}
            <Suspense fallback={<div className="animate-pulse h-64 bg-muted rounded-lg" />}>
              <LoginForm onLoginStart={handleLoginStart} error={loginError} />
            </Suspense>

            {/* Register Link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t("no_account")}{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  {t("register_now")}
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="py-6 px-6 text-center">
          <p className="text-xs text-muted-foreground/70 font-mono">{t("footer_rights")}</p>
        </div>
      </div>
    </div>
  )
}
