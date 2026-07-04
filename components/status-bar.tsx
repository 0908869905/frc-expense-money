"use client"

import { useLanguage } from "@/lib/language-context"

interface StatusBarProps {
    userEmail: string
    userRole: string
    userDepartment?: string | null
}

// 角色顯示標籤
const ROLE_LABELS: Record<string, { zh: string; en: string }> = {
    USER: { zh: "僅檢視", en: "View Only" },
    VICE_LEADER: { zh: "副組長", en: "Vice Leader" },
    LEADER: { zh: "組長", en: "Leader" },
    FINANCE: { zh: "財務", en: "Finance" },
    ADMIN: { zh: "管理員", en: "Admin" },
}

const DEPT_LABELS: Record<string, { zh: string; en: string }> = {
    ELECTRICAL: { zh: "電資組", en: "Electrical" },
    MECHANICAL: { zh: "機構組", en: "Mechanical" },
    DOCUMENTATION: { zh: "文書組", en: "Documentation" },
    PR: { zh: "公關組", en: "PR" },
    FINANCE: { zh: "財管組", en: "Finance" },
    DESIGN: { zh: "意象組", en: "Design" },
    MENTOR: { zh: "老師/導師", en: "Mentor" },
}

/** 底部狀態列：工程工具風的 session 資訊帶（桌面顯示） */
export function StatusBar({ userEmail, userRole, userDepartment }: StatusBarProps) {
    const { language } = useLanguage()
    const role = ROLE_LABELS[userRole]
    const dept = userDepartment ? DEPT_LABELS[userDepartment] : null

    return (
        <footer className="hidden md:flex h-7 shrink-0 items-center justify-between border-t border-border bg-background px-4 font-mono text-[11px] text-muted-foreground select-none">
            <div className="flex items-center gap-2 min-w-0">
                <span className="status-dot bg-ok" aria-hidden />
                <span className="truncate">{userEmail}</span>
                <span className="text-border">·</span>
                <span className="uppercase tracking-wider">
                    {role ? (language === "zh" ? role.zh : role.en) : userRole}
                </span>
                {dept && (
                    <>
                        <span className="text-border">·</span>
                        <span>{language === "zh" ? dept.zh : dept.en}</span>
                    </>
                )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="uppercase tracking-[0.14em]">FRC 6998 UNIPARDS</span>
                <span className="text-border">·</span>
                <span className="uppercase tracking-wider">BudgetFlow</span>
            </div>
        </footer>
    )
}
