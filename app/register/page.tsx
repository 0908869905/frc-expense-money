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

// Shared input styling（token 驅動，圖標留位）
const INPUT_CLASS = "h-12 pl-11 text-base"

function getIconColor(isFocused: boolean): string {
    return isFocused ? "text-primary" : "text-muted-foreground"
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
            className="w-full h-12 text-base font-medium"
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
                className={`w-full h-12 px-4 bg-card border rounded-md text-left transition-colors flex items-center justify-between ${
                    isOpen
                        ? "border-ring ring-2 ring-ring/20"
                        : "border-input hover:border-muted-foreground/50"
                } ${value ? "text-foreground" : "text-muted-foreground"}`}
            >
                <span className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    {selectedDept ? t(selectedDept.labelKey) : t("select_department")}
                </span>
                <svg
                    className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
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
                        className="absolute bottom-full mb-2 w-full py-1.5 bg-popover border border-border rounded-md shadow-[0_8px_24px_rgb(0_0_0_/_0.25)]"
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
                                className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-accent text-sm ${
                                    value === dept.value ? "bg-primary/10 text-primary" : "text-foreground"
                                }`}
                            >
                                <span>{t(dept.labelKey)}</span>
                                {value === dept.value && (
                                    <Check className="h-4 w-4 text-primary" />
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
            <Label htmlFor={id} className="text-sm font-medium">
                {label}
            </Label>
            <div className="relative">
                <Icon className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors ${getIconColor(isFocused)}`} />
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
            {error && <p className="text-sm text-danger">{error}</p>}
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
                <div className={`p-3 rounded-md text-sm border ${
                    state.success
                        ? "bg-ok/10 text-ok border-ok/30"
                        : "bg-danger/10 text-danger border-danger/30"
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
                <Label className="text-sm font-medium">
                    {t("department")}
                </Label>
                <DepartmentSelector value={department} onChange={setDepartment} />
                {state.errors?.department && (
                    <p className="text-sm text-danger">{state.errors.department[0]}</p>
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
                        {language === "zh" ? "加入我們的團隊" : "Join Our Team"}
                    </p>
                </div>

                {/* 左下：圖框 title block */}
                <div className="relative z-10 border border-border bg-card/80 rounded-md overflow-hidden max-w-xs">
                    <div className="grid grid-cols-[auto_1fr] text-xs font-mono">
                        <span className="px-3 py-1.5 border-b border-r border-border text-muted-foreground uppercase tracking-wider">Team</span>
                        <span className="px-3 py-1.5 border-b border-border">FRC 6998 UNIPARDS</span>
                        <span className="px-3 py-1.5 border-b border-r border-border text-muted-foreground uppercase tracking-wider">System</span>
                        <span className="px-3 py-1.5 border-b border-border">BudgetFlow</span>
                        <span className="px-3 py-1.5 border-r border-border text-muted-foreground uppercase tracking-wider">Origin</span>
                        <span className="px-3 py-1.5">Taiwan</span>
                    </div>
                </div>
            </div>

            {/* Right Side - Register Form */}
            <div className="w-full lg:w-1/2 flex flex-col relative">
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
                                {language === "zh" ? "建立帳號" : "Create Account"}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t("register_desc")}
                            </p>
                        </div>

                        {/* Register Form */}
                        <RegisterForm />

                        {/* Login Link */}
                        <div className="mt-8 text-center">
                            <p className="text-sm text-muted-foreground">
                                {t("have_account")}{" "}
                                <Link href="/login" className="text-primary hover:underline font-medium">
                                    {t("login_now")}
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
