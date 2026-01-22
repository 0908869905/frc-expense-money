"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

const DEPARTMENTS = ["ELECTRICAL", "MECHANICAL", "DOCUMENTATION", "PR", "FINANCE", "DESIGN"] as const;

type DepartmentBudgetInfo = { budget: number; updatedBy: string; updatedAt: Date | null };
type DepartmentFinancialInfo = { budget: number; spent: number; remaining: number; isOverspent: boolean };

async function requireAuth(): Promise<void> {
    const session = await auth()
    if (!session?.user) {
        throw new Error("Unauthorized")
    }
}

export async function getDepartmentBudgets(): Promise<Record<string, DepartmentBudgetInfo>> {
    await requireAuth()

    const budgets = await prisma.departmentBudget.findMany()
    const budgetMap: Record<string, DepartmentBudgetInfo> = {}

    for (const dept of DEPARTMENTS) {
        const found = budgets.find(b => b.department === dept)
        budgetMap[dept] = {
            budget: found?.budget ?? 0,
            updatedBy: found?.updatedBy ?? "",
            updatedAt: found?.updatedAt ?? null
        }
    }

    return budgetMap
}

export async function getDepartmentExpenses(): Promise<Record<string, number>> {
    await requireAuth()

    const expenses = await prisma.expenseReport.groupBy({
        by: ["department"],
        where: { status: "PAID" },
        _sum: { totalAmount: true }
    })

    const expenseMap: Record<string, number> = {}

    for (const dept of DEPARTMENTS) {
        const found = expenses.find(e => e.department === dept)
        expenseMap[dept] = found?._sum.totalAmount ?? 0
    }

    return expenseMap
}

export async function getDepartmentFinancialSummary(): Promise<Record<string, DepartmentFinancialInfo>> {
    await requireAuth()

    const [budgets, expenses] = await Promise.all([
        getDepartmentBudgets(),
        getDepartmentExpenses()
    ])

    const summary: Record<string, DepartmentFinancialInfo> = {}

    for (const dept of DEPARTMENTS) {
        const budget = budgets[dept]?.budget ?? 0
        const spent = expenses[dept] ?? 0
        const remaining = budget - spent

        summary[dept] = { budget, spent, remaining, isOverspent: remaining < 0 }
    }

    return summary
}

export async function updateDepartmentBudget(
    department: string,
    budget: number
): Promise<{ success: boolean }> {
    const session = await auth()
    if (!session?.user) {
        throw new Error("Unauthorized")
    }

    const role = session.user.role
    if (role !== "FINANCE" && role !== "ADMIN") {
        throw new Error("只有財務或管理員可以更新組別預算")
    }

    const updatedBy = session.user.name || session.user.email || "Unknown"

    await prisma.departmentBudget.upsert({
        where: { department: department as typeof DEPARTMENTS[number] },
        update: { budget, updatedBy },
        create: { department: department as typeof DEPARTMENTS[number], budget, updatedBy }
    })

    revalidatePath("/dashboard/funding")
    return { success: true }
}

type OverspentDepartment = {
    department: string;
    budget: number;
    spent: number;
    overspentAmount: number;
};

export async function getOverspentDepartments(): Promise<OverspentDepartment[]> {
    const summary = await getDepartmentFinancialSummary()

    return Object.entries(summary)
        .filter(([, data]) => data.isOverspent)
        .map(([dept, data]) => ({
            department: dept,
            budget: data.budget,
            spent: data.spent,
            overspentAmount: Math.abs(data.remaining)
        }))
}
