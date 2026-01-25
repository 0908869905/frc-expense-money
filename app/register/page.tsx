"use client"

import { useState, useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { registerUser, RegisterState } from "@/app/actions/register"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRight, User, Mail, Lock, Users, Check, LucideIcon } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/Button"

// Shared input styling
const INPUT_CLASS = "h-14 pl-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-purple-500/50 focus:ring-purple-500/20 rounded-xl transition-all text-base"

function getIconColor(isFocused: boolean): string {
    return isFocused ? "text-purple-400" : "text-gray-500"
}

const DEPARTMENTS = [
    { value: "ELECTRICAL", labelKey: "department_electrical" },
    { value: "MECHANICAL", labelKey: "department_mechanical" },
    { value: "DOCUMENTATION", labelKey: "department_documentation" },
    { value: "PR", labelKey: "department_pr" },
    { value: "FINANCE", labelKey: "department_finance" },
    { value: "DESIGN", labelKey: "department_design" },
    { value: "MENTOR", labelKey: "department_mentor" },
] as const

function SubmitButton() {
    const { pending } = useFormStatus()
    const { t } = useLanguage()

    return (
        <Button
            type="submit"
            disabled={pending}
            className="w-full h-14 bg-white text-black hover:bg-gray-100 border-0 rounded-xl shadow-lg shadow-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-white/20 text-base font-medium"
        >
            {pending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
                <>
                    {t("register_button")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                </>
            )}
        </Button>
    )
}

function DepartmentSelector({
    value,
    onChange
}: {
    value: string
    onChange: (value: string) => void
}) {
    const { t } = useLanguage()
    const [isOpen, setIsOpen] = useState(false)

    const selectedDept = DEPARTMENTS.find(d => d.value === value)

    return (
        <div className="relative" style={{ zIndex: isOpen ? 100 : 1 }}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full h-14 px-4 bg-white/5 border rounded-xl text-left transition-all flex items-center justify-between ${
                    isOpen
                        ? "border-purple-500/50 ring-2 ring-purple-500/20"
                        : "border-white/10 hover:border-white/20"
                } ${value ? "text-white" : "text-gray-500"}`}
            >
                <span className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-gray-400" />
                    {selectedDept ? t(selectedDept.labelKey) : t("select_department")}
                </span>
                <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0"
                        style={{ zIndex: 90 }}
                        onClick={() => setIsOpen(false)}
                    />
                    {/* Menu - opens upward to avoid being cut off */}
                    <div
                        className="absolute bottom-full mb-2 w-full py-2 bg-gray-900 border border-white/20 rounded-xl shadow-2xl shadow-black/50"
                        style={{ zIndex: 100 }}
                    >
                        {DEPARTMENTS.map((dept) => (
                            <button
                                key={dept.value}
                                type="button"
                                onClick={() => {
                                    onChange(dept.value)
                                    setIsOpen(false)
                                }}
                                className={`w-full px-4 py-3 flex items-center justify-between transition-all hover:bg-white/10 ${
                                    value === dept.value ? "bg-purple-500/20 text-purple-300" : "text-white"
                                }`}
                            >
                                <span>{t(dept.labelKey)}</span>
                                {value === dept.value && (
                                    <Check className="h-4 w-4 text-purple-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {/* Hidden input for form submission */}
            <input type="hidden" name="department" value={value} />
        </div>
    )
}

interface FormFieldProps {
    id: string
    label: string
    icon: LucideIcon
    type: string
    placeholder: string
    required?: boolean
    minLength?: number
    autoComplete?: string
    isFocused: boolean
    onFocus: () => void
    onBlur: () => void
    error?: string
}

function FormField({
    id,
    label,
    icon: Icon,
    type,
    placeholder,
    required,
    minLength,
    autoComplete,
    isFocused,
    onFocus,
    onBlur,
    error
}: FormFieldProps): React.ReactElement {
    return (
        <div className="space-y-2">
            <Label htmlFor={id} className="text-sm font-medium text-gray-300">
                {label}
            </Label>
            <div className="relative">
                <Icon className={`absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${getIconColor(isFocused)}`} />
                <Input
                    id={id}
                    name={id}
                    type={type}
                    autoComplete={autoComplete}
                    required={required}
                    minLength={minLength}
                    placeholder={placeholder}
                    onFocus={onFocus}
                    onBlur={onBlur}
                    className={INPUT_CLASS}
                />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
    )
}

function RegisterForm() {
    const router = useRouter()
    const { t } = useLanguage()
    const [department, setDepartment] = useState("")
    const [focusedField, setFocusedField] = useState<string | null>(null)
    const [state, formAction] = useFormState<RegisterState, FormData>(registerUser, {
        success: false,
        message: null,
    })

    // Redirect on success
    useEffect(() => {
        if (state.success) {
            const timer = setTimeout(() => router.push("/login?registered=true"), 1500)
            return () => clearTimeout(timer)
        }
    }, [state.success, router])

    return (
        <form action={formAction} className="space-y-5">
            {state.message && (
                <div className={`p-4 rounded-xl text-sm backdrop-blur-sm ${
                    state.success
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                }`}>
                    {state.message}
                </div>
            )}

            {/* Name Field */}
            <FormField
                id="name"
                label={t("name")}
                icon={User}
                type="text"
                placeholder={t("name")}
                required
                isFocused={focusedField === "name"}
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                error={state.errors?.name?.[0]}
            />

            {/* Email Field */}
            <FormField
                id="email"
                label={t("email")}
                icon={Mail}
                type="email"
                autoComplete="email"
                placeholder={t("email_placeholder")}
                required
                isFocused={focusedField === "email"}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                error={state.errors?.email?.[0]}
            />

            {/* Password Field */}
            <FormField
                id="password"
                label={t("password")}
                icon={Lock}
                type="password"
                autoComplete="new-password"
                placeholder={t("password_min_6")}
                required
                minLength={8}
                isFocused={focusedField === "password"}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                error={state.errors?.password?.[0]}
            />

            {/* Confirm Password Field */}
            <FormField
                id="confirmPassword"
                label={t("confirm_password")}
                icon={Lock}
                type="password"
                autoComplete="new-password"
                placeholder={t("confirm_password_placeholder")}
                required
                isFocused={focusedField === "confirmPassword"}
                onFocus={() => setFocusedField("confirmPassword")}
                onBlur={() => setFocusedField(null)}
                error={state.errors?.confirmPassword?.[0]}
            />

            {/* Department Field */}
            <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-300">
                    {t("department")}
                </Label>
                <DepartmentSelector value={department} onChange={setDepartment} />
                {state.errors?.department && (
                    <p className="text-sm text-red-400">{state.errors.department[0]}</p>
                )}
            </div>

            <div className="pt-2">
                <SubmitButton />
            </div>
        </form>
    )
}

export default function RegisterPage() {
    const { t, language } = useLanguage()

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
                    {/* Floating geometric shapes */}
                    <div className="absolute top-1/4 right-1/4 w-20 h-20 border border-white/10 rounded-lg rotate-45 animate-float" />
                    <div className="absolute bottom-1/3 left-1/4 w-16 h-16 border border-purple-500/20 rounded-full animate-float" style={{ animationDelay: "2s" }} />
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
                        {language === "zh" ? "加入我們的團隊" : "Join Our Team"}
                    </p>
                </div>
            </div>

            {/* Right Side - Register Form */}
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
                <div className="flex-1 flex items-center justify-center px-6 sm:px-12 lg:px-16 relative z-10 py-12">
                    <div className="w-full max-w-md">
                        {/* Mobile Logo */}
                        <div className="lg:hidden text-center mb-8">
                            <Link href="/">
                                <h1 className="text-5xl font-black tracking-tighter">
                                    <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">FRC </span>
                                    <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">6998</span>
                                </h1>
                            </Link>
                        </div>

                        {/* Welcome Text */}
                        <div className="mb-8">
                            <h2 className="text-3xl font-bold text-white mb-2">
                                {language === "zh" ? "建立帳號" : "Create Account"}
                            </h2>
                            <p className="text-gray-400">
                                {t("register_desc")}
                            </p>
                        </div>

                        {/* Register Form */}
                        <RegisterForm />

                        {/* Login Link */}
                        <div className="mt-8 text-center">
                            <p className="text-gray-500">
                                {t("have_account")}{" "}
                                <Link href="/login" className="text-white hover:text-purple-400 transition-colors font-medium">
                                    {t("login_now")}
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

            {/* Custom Animations */}
            <style jsx global>{`
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) rotate(45deg);
                    }
                    50% {
                        transform: translateY(-20px) rotate(45deg);
                    }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    )
}
