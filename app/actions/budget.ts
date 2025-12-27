"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

// 取得所有組別預算
export async function getDepartmentBudgets() {
    const session = await auth()
    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    // 取得所有預算記錄
    const budgets = await prisma.departmentBudget.findMany()

    // 為所有組別建立預設值
    const departments = ["ELECTRICAL", "MECHANICAL", "DOCUMENTATION", "PR", "FINANCE", "DESIGN"]
    const budgetMap: Record<string, { budget: number; updatedBy: string; updatedAt: Date | null }> = {}

    for (const dept of departments) {
        const found = budgets.find(b => b.department === dept)
        budgetMap[dept] = {
            budget: found?.budget || 0,
            updatedBy: found?.updatedBy || "",
            updatedAt: found?.updatedAt || null
        }
    }

    return budgetMap
}

// 取得各組已花費金額（已付款的報帳單）
export async function getDepartmentExpenses() {
    const session = await auth()
    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    // 取得已付款的報帳單按組別分組
    const expenses = await prisma.expenseReport.groupBy({
        by: ["department"],
        where: { status: "PAID" },
        _sum: { totalAmount: true }
    })

    const departments = ["ELECTRICAL", "MECHANICAL", "DOCUMENTATION", "PR", "FINANCE", "DESIGN"]
    const expenseMap: Record<string, number> = {}

    for (const dept of departments) {
        const found = expenses.find(e => e.department === dept)
        expenseMap[dept] = found?._sum.totalAmount || 0
    }

    return expenseMap
}

// 取得組別資金摘要（預算、已用、剩餘）
export async function getDepartmentFinancialSummary() {
    const session = await auth()
    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    const [budgets, expenses] = await Promise.all([
        getDepartmentBudgets(),
        getDepartmentExpenses()
    ])

    const departments = ["ELECTRICAL", "MECHANICAL", "DOCUMENTATION", "PR", "FINANCE", "DESIGN"]
    const summary: Record<string, { budget: number; spent: number; remaining: number; isOverspent: boolean }> = {}

    for (const dept of departments) {
        const budget = budgets[dept]?.budget || 0
        const spent = expenses[dept] || 0
        const remaining = budget - spent

        summary[dept] = {
            budget,
            spent,
            remaining,
            isOverspent: remaining < 0
        }
    }

    return summary
}

// 更新組別預算（財務/管理員專用）
export async function updateDepartmentBudget(department: string, budget: number) {
    const session = await auth()
    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    const role = session.user.role
    if (role !== "FINANCE" && role !== "ADMIN") {
        throw new Error("只有財務或管理員可以更新組別預算")
    }

    // 使用 upsert 來建立或更新
    await prisma.departmentBudget.upsert({
        where: { department: department as any },
        update: {
            budget,
            updatedBy: session.user.name || session.user.email || "Unknown"
        },
        create: {
            department: department as any,
            budget,
            updatedBy: session.user.name || session.user.email || "Unknown"
        }
    })

    revalidatePath("/dashboard/funding")
    return { success: true }
}

// 檢查是否有超支的組別
export async function getOverspentDepartments() {
    const summary = await getDepartmentFinancialSummary()
    const overspent: { department: string; budget: number; spent: number; overspentAmount: number }[] = []

    for (const [dept, data] of Object.entries(summary)) {
        if (data.isOverspent) {
            overspent.push({
                department: dept,
                budget: data.budget,
                spent: data.spent,
                overspentAmount: Math.abs(data.remaining)
            })
        }
    }

    return overspent
}
