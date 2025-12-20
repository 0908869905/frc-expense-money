"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// 取得按月份的支出統計
export async function getMonthlyExpenseStats() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const reports = await prisma.expenseReport.findMany({
            where: {
                status: { in: ["PAID", "PENDING_FINANCE", "PENDING_MANAGER"] },
            },
            select: {
                totalAmount: true,
                createdAt: true,
            },
        });

        // 按月份分組
        const monthlyData: Record<string, number> = {};
        reports.forEach((report) => {
            const month = report.createdAt.toISOString().slice(0, 7); // YYYY-MM
            monthlyData[month] = (monthlyData[month] || 0) + report.totalAmount;
        });

        // 轉換為陣列並排序
        return Object.entries(monthlyData)
            .map(([month, amount]) => ({ month, amount }))
            .sort((a, b) => a.month.localeCompare(b.month));
    } catch (error) {
        console.error("取得月份統計失敗:", error);
        return [];
    }
}

// 取得按類別的支出統計
export async function getCategoryExpenseStats() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const items = await prisma.expenseItem.findMany({
            select: {
                category: true,
                amount: true,
            },
        });

        // 按類別分組
        const categoryData: Record<string, number> = {};
        items.forEach((item) => {
            categoryData[item.category] = (categoryData[item.category] || 0) + item.amount;
        });

        // 轉換為陣列
        return Object.entries(categoryData)
            .map(([category, amount]) => ({ category, amount }))
            .sort((a, b) => b.amount - a.amount);
    } catch (error) {
        console.error("取得類別統計失敗:", error);
        return [];
    }
}

// 取得報表狀態統計
export async function getStatusStats() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

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

// 取得整體統計摘要
export async function getOverviewStats() {
    const session = await auth();
    if (!session?.user?.id) {
        return null;
    }

    try {
        const [totalReports, totalItems, totalAmount, thisMonthAmount] = await Promise.all([
            prisma.expenseReport.count(),
            prisma.expenseItem.count(),
            prisma.expenseReport.aggregate({ _sum: { totalAmount: true } }),
            prisma.expenseReport.aggregate({
                _sum: { totalAmount: true },
                where: {
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
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
