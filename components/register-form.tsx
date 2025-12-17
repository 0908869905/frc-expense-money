"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { registerUser, RegisterState } from "@/app/actions/register"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, UserPlus, Mail, Lock, User } from "lucide-react"

function SubmitButton() {
    const { pending } = useFormStatus()

    return (
        <button
            type="submit"
            disabled={pending}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
            {pending ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    處理中...
                </>
            ) : (
                <>
                    <UserPlus className="h-4 w-4" />
                    註冊
                </>
            )}
        </button>
    )
}

export function RegisterForm() {
    const router = useRouter()
    const [state, formAction] = useFormState<RegisterState, FormData>(registerUser, {
        success: false,
        message: null,
    })

    // Redirect on success
    if (state.success) {
        setTimeout(() => router.push("/login?registered=true"), 1500)
    }

    return (
        <form action={formAction} className="space-y-5">
            {state.message && (
                <div className={`p-4 rounded-lg text-sm ${state.success
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}>
                    {state.message}
                </div>
            )}

            <div>
                <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                    姓名
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        placeholder="輸入你的姓名"
                    />
                </div>
                {state.errors?.name && (
                    <p className="mt-1 text-sm text-red-500">{state.errors.name[0]}</p>
                )}
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                    電子郵件
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        placeholder="name@example.com"
                    />
                </div>
                {state.errors?.email && (
                    <p className="mt-1 text-sm text-red-500">{state.errors.email[0]}</p>
                )}
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                    密碼
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={6}
                        className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        placeholder="至少 6 個字元"
                    />
                </div>
                {state.errors?.password && (
                    <p className="mt-1 text-sm text-red-500">{state.errors.password[0]}</p>
                )}
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
                    確認密碼
                </label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                        placeholder="再次輸入密碼"
                    />
                </div>
                {state.errors?.confirmPassword && (
                    <p className="mt-1 text-sm text-red-500">{state.errors.confirmPassword[0]}</p>
                )}
            </div>

            <SubmitButton />

            <p className="text-center text-sm text-muted-foreground">
                已有帳號？{" "}
                <Link href="/login" className="font-medium text-primary hover:underline">
                    登入
                </Link>
            </p>
        </form>
    )
}
