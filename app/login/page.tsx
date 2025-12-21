"use client"

import React, { useState, Suspense } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"
import { Loader2, Sparkles } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useOrganization } from "@/lib/organization-context"

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError(t("login_error"))
        setLoading(false)
      } else if (result?.ok) {
        // 暫時跳轉到測試頁進行 debug
        window.location.replace("/test")
      }
    } catch (err) {
      setError(t("login_error"))
      setLoading(false)
    }
  }

  return (
    <>
      {registered && (
        <div className="mb-4 p-4 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-xl text-sm backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t("register_success")}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 rounded-xl text-sm backdrop-blur-sm">
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
            className="h-12 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200"
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
            className="h-12 rounded-xl border-2 border-border/50 bg-background/50 backdrop-blur-sm focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-200"
          />
        </div>
        <Button
          className="w-full h-12 rounded-xl text-base font-semibold btn-gold"
          type="submit"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {t("login_button")}
        </Button>
      </form>
    </>
  )
}

export default function LoginPage() {
  const { t } = useLanguage()
  const { org } = useOrganization()

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-background to-teal-50/30 dark:from-amber-950/20 dark:via-background dark:to-teal-950/20" />

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '-1.5s' }} />
      <div className="absolute top-1/2 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />

      {/* Language Switcher - Top Right */}
      <div className="absolute top-6 right-6 z-10">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md px-4 relative z-10">
        {/* Logo with glow effect */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="group flex items-center gap-3 hover-lift">
            <div className={`flex aspect-square size-14 items-center justify-center rounded-2xl overflow-hidden glow-gold ${org.bgColor}`}>
              <img src={org.logo} alt={org.name} className="size-10 object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight group-hover:text-gradient-gold transition-all duration-300">
                {org.name}
              </span>
              <span className="text-sm text-muted-foreground">{org.subtitle}</span>
            </div>
          </Link>
        </div>

        {/* Glass Card */}
        <Card className="glass-card border-0 shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-2">
            <CardTitle className="text-3xl font-bold tracking-tight">{t("login")}</CardTitle>
            <CardDescription className="text-base">{t("login_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Suspense fallback={<div className="animate-pulse h-48 bg-muted/50 rounded-xl" />}>
              <LoginForm />
            </Suspense>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-4 text-muted-foreground font-medium">or</span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                {t("no_account")}{" "}
                <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                  {t("register_now")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-8">
          {t("footer_rights")}
        </p>
      </div>
    </div>
  )
}