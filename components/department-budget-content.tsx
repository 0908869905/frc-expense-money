"use client"

import { useState, useTransition } from "react"
import { useLanguage } from "@/lib/language-context"
import { AlertTriangle, Edit2, Check, X, Building2 } from "lucide-react"
import { updateDepartmentBudget } from "@/app/actions/budget"

interface DepartmentSummary {
    budget: number
    spent: number
    remaining: number
    isOverspent: boolean
}

interface DepartmentBudgetContentProps {
    departmentSummary: Record<string, DepartmentSummary>
    userRole: string
    userDepartment?: string | null
}

const DEPARTMENTS = [
    { value: "ELECTRICAL", zh: "電資組", en: "Electrical" },
    { value: "MECHANICAL", zh: "機構組", en: "Mechanical" },
    { value: "DOCUMENTATION", zh: "文書組", en: "Documentation" },
    { value: "PR", zh: "公關組", en: "PR" },
    { value: "FINANCE", zh: "財管組", en: "Finance" },
    { value: "DESIGN", zh: "意象組", en: "Design" },
]

export function DepartmentBudgetContent({ departmentSummary, userRole, userDepartment }: DepartmentBudgetContentProps) {
    const { language } = useLanguage()
    const [isPending, startTransition] = useTransition()
    const [editingDept, setEditingDept] = useState<string | null>(null)
    const [editValue, setEditValue] = useState<number>(0)
    const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

    const t = (zh: string, en: string) => language === "zh" ? zh : en
    const canEdit = userRole === "FINANCE" || userRole === "ADMIN"

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("zh-TW", {
            style: "currency",
            currency: "TWD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount)
    }

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3000)
    }

    const handleEdit = (dept: string) => {
        setEditingDept(dept)
        setEditValue(departmentSummary[dept]?.budget || 0)
    }

    const handleSave = async (dept: string) => {
        startTransition(async () => {
            try {
                await updateDepartmentBudget(dept, editValue)
                showMessage("success", t("預算已更新", "Budget updated"))
                setEditingDept(null)
                // Force refresh
                window.location.reload()
            } catch (error: any) {
                showMessage("error", error.message)
            }
        })
    }

    // 過濾顯示的組別
    const visibleDepartments = DEPARTMENTS.filter(dept => {
        // 財務和管理員看到所有組別
        if (canEdit) return true
        // 如果用戶有指定組別，只看到自己的組別
        if (userDepartment) {
            return dept.value === userDepartment
        }
        // 沒有指定組別的 LEADER/VICE_LEADER 看到所有組別
        return true
    })

    const overspentDepts = DEPARTMENTS.filter(d => departmentSummary[d.value]?.isOverspent)

    return (
        <div className="space-y-6">
            {/* 超支警告 */}
            {canEdit && overspentDepts.length > 0 && (
                <div className="rounded-lg border border-danger/40 bg-danger/10 p-4">
                    <div className="flex items-center gap-2 text-danger">
                        <AlertTriangle className="h-4 w-4" />
                        <h3 className="font-semibold text-sm">
                            {t("超支警告", "Overspent Warning")}
                        </h3>
                    </div>
                    <div className="mt-2 space-y-1">
                        {overspentDepts.map(dept => {
                            const data = departmentSummary[dept.value]
                            return (
                                <p key={dept.value} className="text-sm text-danger">
                                    {dept[language as "zh" | "en"]}：
                                    {t("超支 ", "Overspent by ")}
                                    <span className="font-semibold font-mono tabular-nums">{formatCurrency(Math.abs(data.remaining))}</span>
                                </p>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* 訊息提示 */}
            {message && (
                <div className={`p-3 rounded-md border text-sm ${message.type === "success" ? "bg-ok/10 text-ok border-ok/30" : "bg-danger/10 text-danger border-danger/30"}`}>
                    {message.text}
                </div>
            )}

            {/* 標題 */}
            <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-lg font-semibold">
                    {t("組別預算", "Department Budgets")}
                </h2>
            </div>

            {/* 組別預算卡片 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {visibleDepartments.map(dept => {
                    const data = departmentSummary[dept.value] || { budget: 0, spent: 0, remaining: 0, isOverspent: false }
                    const progressPercent = data.budget > 0 ? Math.min((data.spent / data.budget) * 100, 100) : 0

                    return (
                        <div
                            key={dept.value}
                            className={`rounded-xl border p-4 bg-card ${data.isOverspent ? "border-danger/50" : ""}`}
                        >
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="font-semibold text-sm">{dept[language as "zh" | "en"]}</h3>
                                {data.isOverspent && (
                                    <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-danger">
                                        <span className="status-dot bg-danger" />
                                        {t("超支", "Overspent")}
                                    </span>
                                )}
                            </div>

                            {/* 預算金額 */}
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t("預算", "Budget")}</span>
                                    {editingDept === dept.value ? (
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                value={editValue}
                                                onChange={(e) => setEditValue(Number(e.target.value))}
                                                className="w-24 px-2 py-0.5 border rounded text-right text-sm"
                                            />
                                            <button
                                                onClick={() => handleSave(dept.value)}
                                                disabled={isPending}
                                                className="p-1 text-ok hover:bg-ok/10 rounded transition-colors"
                                            >
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setEditingDept(null)}
                                                className="p-1 text-danger hover:bg-danger/10 rounded transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium font-mono tabular-nums">{formatCurrency(data.budget)}</span>
                                            {canEdit && (
                                                <button
                                                    onClick={() => handleEdit(dept.value)}
                                                    className="p-1 text-muted-foreground hover:text-primary rounded"
                                                >
                                                    <Edit2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t("已用", "Spent")}</span>
                                    <span className="font-medium font-mono tabular-nums">{formatCurrency(data.spent)}</span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">{t("剩餘", "Remaining")}</span>
                                    <span className={`font-semibold font-mono tabular-nums ${data.isOverspent ? "text-danger" : "text-ok"}`}>
                                        {formatCurrency(data.remaining)}
                                    </span>
                                </div>
                            </div>

                            {/* 進度條 */}
                            <div className="mt-3">
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all ${data.isOverspent ? "bg-danger" : progressPercent > 80 ? "bg-warn" : "bg-ok"}`}
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                                <p className="font-mono text-xs text-muted-foreground mt-1 text-right tabular-nums">
                                    {progressPercent.toFixed(0)}% {t("已使用", "used")}
                                </p>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
