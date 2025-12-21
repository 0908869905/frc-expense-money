"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * 根據組織 ID 取得報帳單列表
 * 實現資料隔離：不同組織看到不同的資料
 */
export async function getExpensesByOrganization(organizationId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return [];
    }

    try {
        const reports = await prisma.expenseReport.findMany({
            where: {
                organizationId,
                // 一般用戶只能看自己的，ADMIN/MANAGER 可看全部
                ...(session.user.role === "USER" ? { submitterId: session.user.id } : {}),
            },
            include: {
                items: true,
                submitter: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return reports;
    } catch (error) {
        console.error("Failed to fetch expenses by organization:", error);
        return [];
    }
}

/**
 * 取得組織統計資料
 */
export async function getOrganizationStats(organizationId: string) {
    const session = await auth();

    if (!session?.user?.id) {
        return null;
    }

    try {
        const [totalReports, pendingReports, approvedReports, totalAmount] = await Promise.all([
            prisma.expenseReport.count({
                where: { organizationId },
            }),
            prisma.expenseReport.count({
                where: { organizationId, status: { in: ["PENDING_MANAGER", "PENDING_FINANCE"] } },
            }),
            prisma.expenseReport.count({
                where: { organizationId, status: "PAID" },
            }),
            prisma.expenseReport.aggregate({
                where: { organizationId, status: "PAID" },
                _sum: { totalAmount: true },
            }),
        ]);

        return {
            totalReports,
            pendingReports,
            approvedReports,
            totalAmount: totalAmount._sum.totalAmount || 0,
        };
    } catch (error) {
        console.error("Failed to fetch organization stats:", error);
        return null;
    }
}

/**
 * 取得最近活動（依組織）
 */
export async function getRecentActivityByOrg(organizationId: string, limit = 5) {
    const session = await auth();

    if (!session?.user?.id) {
        return [];
    }

    try {
        const reports = await prisma.expenseReport.findMany({
            where: { organizationId },
            include: {
                submitter: {
                    select: { name: true, email: true },
                },
            },
            orderBy: { updatedAt: "desc" },
            take: limit,
        });

        return reports.map((r) => ({
            id: r.id,
            title: r.title,
            status: r.status,
            amount: r.totalAmount,
            submitter: r.submitter.name || r.submitter.email,
            date: r.updatedAt,
        }));
    } catch (error) {
        console.error("Failed to fetch recent activity:", error);
        return [];
    }
}
