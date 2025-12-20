"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 取得所有預算
export async function getBudgets() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const budgets = await prisma.budget.findMany({
            orderBy: { createdAt: "desc" },
        });

        return budgets;
    } catch (error) {
        console.error("取得預算失敗:", error);
        return [];
    }
}

// 取得單一預算
export async function getBudget(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    try {
        return await prisma.budget.findUnique({
            where: { id },
        });
    } catch (error) {
        console.error("取得預算失敗:", error);
        return null;
    }
}

// 建立預算
export async function createBudget(data: {
    name: string;
    category?: string;
    amount: number;
    currency?: string;
    startDate: Date;
    endDate: Date;
    alertThreshold?: number;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    // 只有 Admin 和 Finance 可以建立預算
    if (session.user.role !== "ADMIN" && session.user.role !== "FINANCE") {
        return { success: false, message: "Permission denied" };
    }

    try {
        const budget = await prisma.budget.create({
            data: {
                name: data.name,
                category: data.category || null,
                amount: data.amount,
                currency: data.currency || "TWD",
                startDate: data.startDate,
                endDate: data.endDate,
                alertThreshold: data.alertThreshold || 0.8,
                createdBy: session.user.id,
            },
        });

        revalidatePath("/dashboard/budgets");
        return { success: true, budget };
    } catch (error) {
        console.error("建立預算失敗:", error);
        return { success: false, message: "建立失敗" };
    }
}

// 更新預算
export async function updateBudget(
    id: string,
    data: Partial<{
        name: string;
        category: string;
        amount: number;
        spent: number;
        alertThreshold: number;
        startDate: Date;
        endDate: Date;
    }>
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    if (session.user.role !== "ADMIN" && session.user.role !== "FINANCE") {
        return { success: false, message: "Permission denied" };
    }

    try {
        await prisma.budget.update({
            where: { id },
            data,
        });

        revalidatePath("/dashboard/budgets");
        return { success: true };
    } catch (error) {
        console.error("更新預算失敗:", error);
        return { success: false, message: "更新失敗" };
    }
}

// 刪除預算
export async function deleteBudget(id: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    if (session.user.role !== "ADMIN") {
        return { success: false, message: "只有管理員可以刪除預算" };
    }

    try {
        await prisma.budget.delete({
            where: { id },
        });

        revalidatePath("/dashboard/budgets");
        return { success: true };
    } catch (error) {
        console.error("刪除預算失敗:", error);
        return { success: false, message: "刪除失敗" };
    }
}

// 檢查報帳是否超出預算
export async function checkBudgetForExpense(category: string, amount: number) {
    const session = await auth();
    if (!session?.user?.id) {
        return { allowed: true, warnings: [] };
    }

    const now = new Date();
    const warnings: string[] = [];

    try {
        // 找出該類別有效的預算
        const budgets = await prisma.budget.findMany({
            where: {
                OR: [
                    { category },
                    { category: null }, // 通用預算
                ],
                startDate: { lte: now },
                endDate: { gte: now },
            },
        });

        for (const budget of budgets) {
            const projectedSpent = budget.spent + amount;
            const usageRate = projectedSpent / budget.amount;

            if (usageRate > 1) {
                warnings.push(`⚠️ 此支出將超過「${budget.name}」預算 (剩餘: ${budget.amount - budget.spent})`);
            } else if (usageRate >= budget.alertThreshold) {
                const percentage = Math.round(usageRate * 100);
                warnings.push(`⚡ 此支出後「${budget.name}」預算使用率將達 ${percentage}%`);
            }
        }

        return {
            allowed: true,
            warnings,
        };
    } catch (error) {
        console.error("檢查預算失敗:", error);
        return { allowed: true, warnings: [] };
    }
}

// 更新預算已使用金額
export async function updateBudgetSpent(category: string, amount: number) {
    const now = new Date();

    try {
        // 更新所有相關預算的已使用金額
        await prisma.budget.updateMany({
            where: {
                OR: [
                    { category },
                    { category: null },
                ],
                startDate: { lte: now },
                endDate: { gte: now },
            },
            data: {
                spent: { increment: amount },
            },
        });
    } catch (error) {
        console.error("更新預算使用量失敗:", error);
    }
}
