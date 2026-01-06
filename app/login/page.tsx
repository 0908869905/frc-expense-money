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

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      setError(t("login_error"))
      setLoading(false)
    } else {
      window.location.href = "/dashboard"
    }
  }

  return (
    <>
      {registered && (
        <div className="mb-4 p-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl text-sm backdrop-blur-sm">
          {t("register_success")}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-sm backdrop-blur-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-300">{t("email")}</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={t("email_placeholder")}
            required
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-300">{t("password")}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={t("password_placeholder")}
            required
            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 transition-all"
          />
        </div>
        <Button 
          className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 border-0 shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-[1.02]" 
          type="submit" 
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f] text-white overflow-hidden p-4">
      {/* Animated Background */}
      <div className="fixed inset-0 -z-10">
        {/* Gradient orbs */}
        <div className="absolute top-[-10%] left-[-5%] h-[400px] w-[400px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[350px] w-[350px] rounded-full bg-blue-600/20 blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] h-[300px] w-[300px] rounded-full bg-cyan-600/10 blur-[80px] animate-pulse" style={{ animationDelay: "2s" }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]" />
      </div>

      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md relative">
        {/* Team Name */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="group">
            <span className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              {org.name}
            </span>
          </Link>
        </div>

        {/* Login Card with glassmorphism */}
        <Card className="border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-2">
            <CardTitle className="text-2xl font-bold text-white flex items-center justify-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-400" />
              {t("login")}
            </CardTitle>
            <CardDescription className="text-gray-400">{t("login_desc")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Suspense fallback={<div className="animate-pulse h-48 bg-white/5 rounded-lg" />}>
              <LoginForm />
            </Suspense>

            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-white/10" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#0a0a0f] px-2 text-gray-500">or</span>
                </div>
              </div>

              <p className="text-center text-sm text-gray-400 mt-6">
                {t("no_account")}{" "}
                <Link href="/register" className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                  {t("register_now")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-8">
          {t("footer_rights")}
        </p>
      </div>
    </div>
  )
}