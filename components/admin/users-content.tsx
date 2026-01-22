"use client"

import { useLanguage } from "@/lib/context/language-context"
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

    const getRoleColor = (role: string) => {
        switch (role) {
            case "ADMIN": return "bg-purple-100 text-purple-700"
            case "LEADER": return "bg-blue-100 text-blue-700"
            case "VICE_LEADER": return "bg-cyan-100 text-cyan-700"
            case "FINANCE": return "bg-green-100 text-green-700"
            default: return "bg-gray-100 text-gray-700"
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
        if (!dept) return t("未設定", "Not Set")
        const labels: Record<string, { zh: string, en: string, icon: string }> = {
            ELECTRICAL: { zh: "電控組", en: "Electrical", icon: "⚡" },
            MECHANICAL: { zh: "機構組", en: "Mechanical", icon: "⚙️" },
            DOCUMENTATION: { zh: "文書組", en: "Documentation", icon: "📝" },
            PR: { zh: "公關組", en: "PR", icon: "📢" },
            FINANCE: { zh: "財管組", en: "Finance", icon: "💰" },
            DESIGN: { zh: "形象組", en: "Design", icon: "🎨" },
        }
        const found = labels[dept]
        return found ? `${found.icon} ${found[language as "zh" | "en"]}` : dept
    }

    const DEPARTMENTS = [
        { value: "ELECTRICAL", zh: "電控組", en: "Electrical", icon: "⚡" },
        { value: "MECHANICAL", zh: "機構組", en: "Mechanical", icon: "⚙️" },
        { value: "DOCUMENTATION", zh: "文書組", en: "Documentation", icon: "📝" },
        { value: "PR", zh: "公關組", en: "PR", icon: "📢" },
        { value: "FINANCE", zh: "財管組", en: "Finance", icon: "💰" },
        { value: "DESIGN", zh: "形象組", en: "Design", icon: "🎨" },
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
        if (!confirm(t("確定要刪除此帳戶嗎？此操作無法復原。", "Are you sure you want to delete this user? This action cannot be undone."))) {
            return
        }
        startTransition(async () => {
            try {
                await deleteUser(userId)
                setLocalUsers(prev => prev.filter(u => u.id !== userId))
                showMessage("success", t("帳戶已刪除", "User deleted"))
            } catch (error: any) {
                showMessage("error", error.message)
            }
        })
    }

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Users className="h-8 w-8" />
                    {t("使用者管理", "User Management")}
                </h1>
                <p className="text-muted-foreground">
                    {t("管理所有用戶帳號及權限", "Manage all user accounts and permissions")}
                </p>
            </div>

            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{t("總用戶", "Total Users")}</p>
                    <p className="text-2xl font-bold">{localUsers.length}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{t("管理員", "Admins")}</p>
                    <p className="text-2xl font-bold">{localUsers.filter(u => u.role === "ADMIN").length}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{t("組長", "Leaders")}</p>
                    <p className="text-2xl font-bold">{localUsers.filter(u => u.role === "LEADER").length}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{t("副組長", "Vice Leaders")}</p>
                    <p className="text-2xl font-bold">{localUsers.filter(u => u.role === "VICE_LEADER").length}</p>
                </div>
                <div className="rounded-xl border bg-card p-4">
                    <p className="text-sm text-muted-foreground">{t("已驗證", "Verified")}</p>
                    <p className="text-2xl font-bold">{localUsers.filter(u => u.emailVerified).length}</p>
                </div>
            </div>

            {/* Users Table */}
            <div className="rounded-xl border bg-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="text-left p-4 font-medium">{t("使用者", "User")}</th>
                            <th className="text-left p-4 font-medium">{t("角色", "Role")}</th>
                            <th className="text-left p-4 font-medium">{t("組別", "Dept")}</th>
                            <th className="text-left p-4 font-medium">{t("狀態", "Status")}</th>
                            <th className="text-left p-4 font-medium">{t("報表數", "Reports")}</th>
                            <th className="text-left p-4 font-medium">{t("建立時間", "Created")}</th>
                            <th className="text-left p-4 font-medium">{t("操作", "Actions")}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {localUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-muted/20">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="text-sm font-bold text-primary">
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
                                                    <button onClick={() => handleUpdateEmail(user.id)} className="text-green-600 hover:text-green-700">
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => { setEditingUser(null); setEditField(null) }} className="text-red-600 hover:text-red-700">
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
                                                    className={`px-2 py-1 rounded text-xs font-medium ${getRoleColor(role)} hover:opacity-80 disabled:opacity-50`}
                                                >
                                                    {getRoleLabel(role)}
                                                </button>
                                            ))}
                                            <button onClick={() => { setEditingUser(null); setEditField(null) }} className="text-red-600 hover:text-red-700 ml-1">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
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
                                                className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 hover:opacity-80 disabled:opacity-50"
                                            >
                                                {t("無", "None")}
                                            </button>
                                            {DEPARTMENTS.map((dept) => (
                                                <button
                                                    key={dept.value}
                                                    onClick={() => handleUpdateDepartment(user.id, dept.value)}
                                                    disabled={isPending}
                                                    className="px-2 py-1 rounded text-xs font-medium bg-primary/10 text-primary hover:opacity-80 disabled:opacity-50"
                                                >
                                                    {dept.icon} {dept[language as "zh" | "en"]}
                                                </button>
                                            ))}
                                            <button onClick={() => { setEditingUser(null); setEditField(null) }} className="text-red-600 hover:text-red-700 ml-1">
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
                                        <span className="flex items-center gap-1 text-green-600 text-sm">
                                            <UserCheck className="h-4 w-4" />
                                            {t("已驗證", "Verified")}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">{t("未驗證", "Unverified")}</span>
                                    )}
                                </td>
                                <td className="p-4 text-muted-foreground">
                                    {user._count.expenseReports}
                                </td>
                                <td className="p-4 text-muted-foreground text-sm">
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
                                            <button onClick={() => handleUpdatePassword(user.id)} className="text-green-600 hover:text-green-700">
                                                <Check className="h-4 w-4" />
                                            </button>
                                            <button onClick={() => { setEditingUser(null); setEditField(null); setInputValue("") }} className="text-red-600 hover:text-red-700">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => { setEditingUser(user.id); setEditField("email"); setInputValue(user.email || "") }}
                                                className="p-1.5 rounded hover:bg-muted"
                                                title={t("編輯 Email", "Edit Email")}
                                            >
                                                <Mail className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => { setEditingUser(user.id); setEditField("password"); setInputValue("") }}
                                                className="p-1.5 rounded hover:bg-muted"
                                                title={t("修改密碼", "Change Password")}
                                            >
                                                <Key className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => { setEditingUser(user.id); setEditField("role") }}
                                                className="p-1.5 rounded hover:bg-muted"
                                                title={t("修改角色", "Change Role")}
                                            >
                                                <Shield className="h-4 w-4" />
                                            </button>
                                            {!user.emailVerified && (
                                                <button
                                                    onClick={() => handleVerifyEmail(user.id)}
                                                    disabled={isPending}
                                                    className="p-1.5 rounded hover:bg-muted text-green-600"
                                                    title={t("驗證 Email", "Verify Email")}
                                                >
                                                    <UserCheck className="h-4 w-4" />
                                                </button>
                                            )}
                                            {user.id !== currentUserId && (
                                                <button
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    disabled={isPending}
                                                    className="p-1.5 rounded hover:bg-red-50 text-red-600"
                                                    title={t("刪除帳戶", "Delete User")}
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

