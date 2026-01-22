"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAuth(): Promise<boolean> {
    const session = await auth();
    return !!session?.user?.id;
}

function aggregateByKey<T, K extends string>(
    items: T[],
    getKey: (item: T) => K,
    getValue: (item: T) => number
): Record<K, number> {
    const result = {} as Record<K, number>;
    for (const item of items) {
        const key = getKey(item);
        result[key] = (result[key] || 0) + getValue(item);
    }
    return result;
}

export async function getMonthlyExpenseStats(): Promise<{ month: string; amount: number }[]> {
    if (!(await requireAuth())) return [];

    try {
        const reports = await prisma.expenseReport.findMany({
            where: {
                status: { in: ["PAID", "PENDING_FINANCE", "PENDING_MANAGER"] },
            },
            select: { totalAmount: true, createdAt: true },
        });

        const monthlyData = aggregateByKey(
            reports,
            (r) => r.createdAt.toISOString().slice(0, 7),
            (r) => r.totalAmount
        );

        return Object.entries(monthlyData)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
        console.error("取得月份統計失敗:", error);
        return [];
    }
}

export async function getCategoryExpenseStats(): Promise<{ category: string; amount: number }[]> {
    if (!(await requireAuth())) return [];

    try {
        const items = await prisma.expenseItem.findMany({
            select: { category: true, amount: true },
        });

        const categoryData = aggregateByKey(
            items,
            (i) => i.category,
            (i) => i.amount
        );

        return Object.entries(categoryData)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    } catch (error) {
        console.error("取得類別統計失敗:", error);
        return [];
    }
}

export async function getStatusStats(): Promise<{ status: string; count: number; amount: number }[]> {
    if (!(await requireAuth())) return [];

    try {
        const reports = await prisma.expenseReport.groupBy({
            by: ["status"],
            _count: { id: true },
            _sum: { totalAmount: true },
        });

        return reports.map((r) => ({
            status: r.status,
            count: r._count.id,
            amount: r._sum.totalAmount || 0,
        }));
    } catch (error) {
        console.error("取得狀態統計失敗:", error);
        return [];
    }
}

export async function getOverviewStats(): Promise<{
    totalReports: number;
    totalItems: number;
    totalAmount: number;
    thisMonthAmount: number;
} | null> {
    if (!(await requireAuth())) return null;

    try {
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

        const [totalReports, totalItems, totalAmount, thisMonthAmount] = await Promise.all([
            prisma.expenseReport.count(),
            prisma.expenseItem.count(),
            prisma.expenseReport.aggregate({ _sum: { totalAmount: true } }),
            prisma.expenseReport.aggregate({
                _sum: { totalAmount: true },
                where: { createdAt: { gte: startOfMonth } },
            }),
        ]);

        return {
            totalReports,
            totalItems,
            totalAmount: totalAmount._sum.totalAmount || 0,
            thisMonthAmount: thisMonthAmount._sum.totalAmount || 0,
        };
    } catch (error) {
        console.error("取得總覽統計失敗:", error);
        return null;
    }
}
