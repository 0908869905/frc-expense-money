"use client"

import { useLanguage } from "@/lib/language-context"
import { useState, useTransition } from "react"
import { updateUserRole, updateUserDepartment, updateUserEmail, updateUserPassword, verifyUserEmail, deleteUser } from "@/app/actions/users"
import { Check, Edit2, Key, Mail, Shield, Trash2, UserCheck, Users, X, Building2 } from "lucide-react"

interface User {
    id: string
    name: string | null
    email: string | null
    role: string
    department: string | null
    emailVerified: Date | null
    createdAt: Date
    _count: { expenseReports: number }
}

interface UsersContentProps {
    users: User[]
    currentUserId: string
}

export function UsersContent({ users, currentUserId }: UsersContentProps) {
    const { language } = useLanguage()
    const [isPending, startTransition] = useTransition()
    const [editingUser, setEditingUser] = useState<string | null>(null)
    const [editField, setEditField] = useState<"email" | "password" | "role" | "department" | null>(null)
    const [inputValue, setInputValue] = useState("")
    const [localUsers, setLocalUsers] = useState(users)
    const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null)

    const t = (zh: string, en: string) => language === "zh" ? zh : en

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString(language === "zh" ? "zh-TW" : "en-US")
    }

    // 角色晶片：中性 hairline 晶片，僅 ADMIN 帶主色（60/30/10 原則）
    const getRoleColor = (role: string) => {
        switch (role) {
            case "ADMIN": return "border-primary/40 bg-primary/10 text-primary"
            case "LEADER": return "border-info/40 bg-info/10 text-info"
            case "VICE_LEADER": return "border-border bg-muted text-foreground"
            case "FINANCE": return "border-ok/40 bg-ok/10 text-ok"
            default: return "border-border bg-muted text-muted-foreground"
        }
    }

    const getRoleLabel = (role: string) => {
        const labels: Record<string, { zh: string, en: string }> = {
            USER: { zh: "僅檢視", en: "View Only" },
            VICE_LEADER: { zh: "副組長", en: "Vice Leader" },
            LEADER: { zh: "組長", en: "Leader" },
            FINANCE: { zh: "財務", en: "Finance" },
            ADMIN: { zh: "管理員", en: "Admin" },
        }
        return labels[role]?.[language as "zh" | "en"] || role
    }

    const getDepartmentLabel = (dept: string | null) => {
        if (!dept) return t("未指定", "Not Set")
        const labels: Record<string, { zh: string, en: string }> = {
            ELECTRICAL: { zh: "電資組", en: "Electrical" },
            MECHANICAL: { zh: "機構組", en: "Mechanical" },
            DOCUMENTATION: { zh: "文書組", en: "Documentation" },
            PR: { zh: "公關組", en: "PR" },
            FINANCE: { zh: "財管組", en: "Finance" },
            DESIGN: { zh: "意象組", en: "Design" },
            MENTOR: { zh: "老師", en: "Mentor" },
        }
        const found = labels[dept]
        return found ? found[language as "zh" | "en"] : dept
    }

    const DEPARTMENTS = [
        { value: "ELECTRICAL", zh: "電資組", en: "Electrical" },
        { value: "MECHANICAL", zh: "機構組", en: "Mechanical" },
        { value: "DOCUMENTATION", zh: "文書組", en: "Documentation" },
        { value: "PR", zh: "公關組", en: "PR" },
        { value: "FINANCE", zh: "財管組", en: "Finance" },
        { value: "DESIGN", zh: "意象組", en: "Design" },
        { value: "MENTOR", zh: "老師", en: "Mentor" },
    ]

    const showMessage = (type: "success" | "error", text: string) => {
        setMessage({ type, text })
        setTimeout(() => setMessage(null), 3000)
    }

    const handleUpdateRole = async (userId: string, role: "USER" | "VICE_LEADER" | "LEADER" | "FINANCE" | "ADMIN") => {
        startTransition(async () => {
            try {
                await updateUserRole(userId, role)
                setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
                showMessage("success", t("角色已更新", "Role updated"))
                setEditingUser(null)
                setEditField(null)
            } catch (error: any) {
                showMessage("error", error.message)
            }
        })
    }

    const handleUpdateDepartment = async (userId: string, department: string | null) => {
        startTransition(async () => {
            try {
                await updateUserDepartment(userId, department)
                setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, department } : u))
                showMessage("success", t("組別已更新", "Department updated"))
                setEditingUser(null)
                setEditField(null)
            } catch (error: any) {
                showMessage("error", error.message)
            }
        })
    }

    const handleUpdateEmail = async (userId: string) => {
        if (!inputValue.includes("@")) {
            showMessage("error", t("請輸入有效的 Email", "Please enter a valid email"))
            return
        }
        startTransition(async () => {
            try {
                await updateUserEmail(userId, inputValue)
                setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, email: inputValue } : u))
                showMessage("success", t("Email 已更新", "Email updated"))
                setEditingUser(null)
                setEditField(null)
                setInputValue("")
            } catch (error: any) {
                showMessage("error", error.message)
            }
        })
    }

    const handleUpdatePassword = async (userId: string) => {
        if (inputValue.length < 6) {
            showMessage("error", t("密碼至少 6 個字元", "Password must be at least 6 characters"))
            return
        }
        startTransition(async () => {
            try {
                await updateUserPassword(userId, inputValue)
                showMessage("success", t("密碼已更新", "Password updated"))
                setEditingUser(null)
                setEditField(null)
                setInputValue("")
            } catch (error: any) {
                showMessage("error", error.message)
            }
        })
    }

    const handleVerifyEmail = async (userId: string) => {
        startTransition(async () => {
            try {
                await verifyUserEmail(userId)
                setLocalUsers(prev => prev.map(u => u.id === userId ? { ...u, emailVerified: new Date() } : u))
                showMessage("success", t("Email 已驗證", "Email verified"))
            } catch (error: any) {
                showMessage("error", error.message)
            }
        })
    }

    const handleDeleteUser = async (userId: string) => {
        if (!confirm(t("確定要刪除此用戶嗎？此操作無法復原。", "Are you sure you want to delete this user? This action cannot be undone."))) {
            return
        }
        startTransition(async () => {
            try {
                await deleteUser(userId)
                setLocalUsers(prev => prev.filter(u => u.id !== userId))
                showMessage("success", t("用戶已刪除", "User deleted"))
            } catch (error: any) {
                showMessage("error", error.message)
            }
        })
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="space-y-1.5 border-b border-border pb-5">
                <p className="ledger-label text-primary">Roster</p>
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t("用戶管理", "User Management")}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {t("管理所有用戶帳號和權限", "Manage all user accounts and permissions")}
                </p>
            </div>

            {message && (
                <div className={`p-3 rounded-md border text-sm ${message.type === "success" ? "bg-ok/10 text-ok border-ok/30" : "bg-danger/10 text-danger border-danger/30"}`}>
                    {message.text}
                </div>
            )}

            {/* ── 合計帶 ──────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-5 rounded-lg border border-border bg-card overflow-hidden">
                <div className="p-4 border-b md:border-b-0 border-r border-border">
                    <p className="ledger-label">{t("總用戶", "Total Users")}</p>
                    <p className="text-2xl font-semibold tech-number mt-2">{localUsers.length}</p>
                </div>
                <div className="p-4 border-b md:border-b-0 md:border-r border-border">
                    <p className="ledger-label">{t("管理員", "Admins")}</p>
                    <p className="text-2xl font-semibold tech-number mt-2">{localUsers.filter(u => u.role === "ADMIN").length}</p>
                </div>
                <div className="p-4 border-b md:border-b-0 border-r border-border">
                    <p className="ledger-label">{t("組長", "Leaders")}</p>
                    <p className="text-2xl font-semibold tech-number mt-2">{localUsers.filter(u => u.role === "LEADER").length}</p>
                </div>
                <div className="p-4 border-b md:border-b-0 md:border-r border-border">
                    <p className="ledger-label">{t("副組長", "Vice Leaders")}</p>
                    <p className="text-2xl font-semibold tech-number mt-2">{localUsers.filter(u => u.role === "VICE_LEADER").length}</p>
                </div>
                <div className="p-4 col-span-2 md:col-span-1">
                    <p className="ledger-label">{t("已驗證", "Verified")}</p>
                    <p className="text-2xl font-semibold tech-number mt-2">{localUsers.filter(u => u.emailVerified).length}</p>
                </div>
            </div>

            {/* ── 名冊表格 ─────────────────────────────── */}
            <div className="rounded-lg border bg-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("用戶", "User")}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("角色", "Role")}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("組別", "Dept")}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("狀態", "Status")}</th>
                            <th className="text-right px-4 py-2.5 ledger-label">{t("報表數", "Reports")}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("建立日期", "Created")}</th>
                            <th className="text-left px-4 py-2.5 ledger-label">{t("操作", "Actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {localUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-accent/60 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-full bg-secondary border border-border flex items-center justify-center">
                                            <span className="text-sm font-semibold text-foreground">
                                                {(user.name || user.email || "U")[0].toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium">{user.name || t("未設定", "Not set")}</p>
                                            {editingUser === user.id && editField === "email" ? (
                                                <div className="flex gap-2 mt-1">
                                                    <input
                                                        type="email"
                                                        value={inputValue}
                                                        onChange={(e) => setInputValue(e.target.value)}
                                                        className="px-2 py-1 border rounded text-sm w-48"
                                                        placeholder={user.email || ""}
                                                    />
                                                    <button onClick={() => handleUpdateEmail(user.id)} className="text-ok hover:opacity-80">
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => { setEditingUser(null); setEditField(null) }} className="text-danger hover:opacity-80">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {editingUser === user.id && editField === "role" ? (
                                        <div className="flex gap-1 flex-wrap">
                                            {["USER", "VICE_LEADER", "LEADER", "FINANCE", "ADMIN"].map((role) => (
                                                <button
                                                    key={role}
                                                    onClick={() => handleUpdateRole(user.id, role as any)}
                                                    disabled={isPending}
                                                    className={`px-2 py-1 rounded border font-mono text-[11px] font-medium ${getRoleColor(role)} hover:opacity-80 disabled:opacity-50`}
                                                >
                                                    {getRoleLabel(role)}
                                                </button>
                                            ))}
                                            <button onClick={() => { setEditingUser(null); setEditField(null) }} className="text-danger hover:opacity-80 ml-1">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={`px-1.5 py-0.5 rounded border font-mono text-[11px] font-medium ${getRoleColor(user.role)}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4">
                                    {editingUser === user.id && editField === "department" ? (
                                        <div className="flex gap-1 flex-wrap">
                                            <button
                                                onClick={() => handleUpdateDepartment(user.id, null)}
                                                disabled={isPending}
                                                className="px-2 py-1 rounded border border-border bg-muted font-mono text-[11px] font-medium text-muted-foreground hover:opacity-80 disabled:opacity-50"
                                            >
                                                {t("無", "None")}
                                            </button>
                                            {DEPARTMENTS.map((dept) => (
                                                <button
                                                    key={dept.value}
                                                    onClick={() => handleUpdateDepartment(user.id, dept.value)}
                                                    disabled={isPending}
                                                    className="px-2 py-1 rounded border border-primary/40 bg-primary/10 font-mono text-[11px] font-medium text-primary hover:opacity-80 disabled:opacity-50"
                                                >
                                                    {dept[language as "zh" | "en"]}
                                                </button>
                                            ))}
                                            <button onClick={() => { setEditingUser(null); setEditField(null) }} className="text-danger hover:opacity-80 ml-1">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => { setEditingUser(user.id); setEditField("department") }}
                                            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                                        >
                                            <Building2 className="h-3 w-3" />
                                            {getDepartmentLabel(user.department)}
                                        </button>
                                    )}
                                </td>
                                <td className="p-4">
                                    {user.emailVerified ? (
                                        <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-ok">
                                            <span className="status-dot bg-ok" />
                                            {t("已驗證", "Verified")}
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                                            <span className="status-dot bg-muted-foreground/50" />
                                            {t("未驗證", "Unverified")}
                                        </span>
                                    )}
                                </td>
                                <td className="p-4 text-right text-muted-foreground font-mono tabular-nums">
                                    {user._count.expenseReports}
                                </td>
                                <td className="p-4 text-muted-foreground font-mono text-xs">
                                    {formatDate(user.createdAt)}
                                </td>
                                <td className="p-4">
                                    {editingUser === user.id && editField === "password" ? (
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                className="px-2 py-1 border rounded text-sm w-32"
                                                placeholder={t("新密碼", "New password")}
                                            />
                                            <button onClick={() => handleUpdatePassword(user.id)} className="text-ok hover:opacity-80">
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => { setEditingUser(null); setEditField(null); setInputValue("") }} className="text-danger hover:opacity-80">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setEditingUser(user.id); setEditField("email"); setInputValue(user.email || "") }}
                                                className="p-1.5 rounded hover:bg-accent transition-colors"
                                                title={t("編輯 Email", "Edit Email")}
                                            >
                                                <Mail className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => { setEditingUser(user.id); setEditField("password"); setInputValue("") }}
                                                className="p-1.5 rounded hover:bg-accent transition-colors"
                                                title={t("更改密碼", "Change Password")}
                                            >
                                                <Key className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => { setEditingUser(user.id); setEditField("role") }}
                                                className="p-1.5 rounded hover:bg-accent transition-colors"
                                                title={t("更改角色", "Change Role")}
                                            >
                                                <Shield className="h-4 w-4" />
                                            </button>
                                            {!user.emailVerified && (
                                                <button
                                                    onClick={() => handleVerifyEmail(user.id)}
                                                    disabled={isPending}
                                                    className="p-1.5 rounded hover:bg-ok/10 text-ok transition-colors"
                                                    title={t("驗證 Email", "Verify Email")}
                                                >
                                                    <UserCheck className="h-4 w-4" />
                                                </button>
                                            )}
                                            {user.id !== currentUserId && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={isPending}
                                                    className="p-1.5 rounded hover:bg-danger/10 text-danger transition-colors"
                                                    title={t("刪除用戶", "Delete User")}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div >
    )
}
