"use client"

import React, { useState, Suspense } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signIn } from "next-auth/react"
import { Loader2, Shield } from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const searchParams = useSearchParams()
  const registered = searchParams.get("registered")

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
      setError("電子郵件或密碼錯誤")
      setLoading(false)
    } else {
      window.location.href = "/dashboard"
    }
  }

  return (
    <>
      {registered && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">
          註冊成功！請使用你的帳號登入
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">電子郵件</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">密碼</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="輸入密碼"
            required
          />
        </div>
        <Button className="w-full" type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          登入
        </Button>
      </form>
    </>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex aspect-square size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Shield className="size-6" />
            </div>
            <span className="text-2xl font-bold">報帳系統</span>
          </Link>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">登入</CardTitle>
            <CardDescription>輸入你的帳號密碼登入系統</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="animate-pulse h-48 bg-muted rounded-lg" />}>
              <LoginForm />
            </Suspense>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">或</span>
                </div>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-4">
                還沒有帳號？{" "}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  立即註冊
                </Link>
              </p>

              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center mb-2">
                  Demo 帳號（密碼隨便填）：
                </p>
                <div className="text-xs text-center space-y-1">
                  <p>user@demo.com (一般用戶)</p>
                  <p>manager@demo.com (主管)</p>
                  <p>admin@demo.com (管理員)</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 報帳系統. All rights reserved.
        </p>
      </div>
    </div>
  )
}