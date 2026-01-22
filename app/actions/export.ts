"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// 取得報表資料用於匯出
export async function getReportsForExport(filters?: {
    startDate?: string;
    endDate?: string;
    status?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    // 只有 FINANCE 或 ADMIN 可以匯出所有報表
    const role = session.user.role;
    if (role !== "FINANCE" && role !== "ADMIN") {
        return [];
    }

    try {
        const where: any = {};

        // 日期篩選
        if (filters?.startDate || filters?.endDate) {
            where.createdAt = {};
            if (filters.startDate) {
                where.createdAt.gte = new Date(filters.startDate);
            }
            if (filters.endDate) {
                where.createdAt.lte = new Date(filters.endDate);
            }
        }

        // 狀態篩選
        if (filters?.status && filters.status !== "all") {
            where.status = filters.status;
        }

        const reports = await prisma.expenseReport.findMany({
            where,
            include: {
                submitter: {
                    select: { name: true, email: true },
                },
                items: true,
            },
            orderBy: { createdAt: "desc" },
        });

        // 轉換為匯出格式
        return reports.map((report) => ({
            報帳單編號: report.id,
            標題: report.title,
            提交者: report.submitter?.name || report.submitter?.email || "Unknown",
            提交者Email: report.submitter?.email || "",
            狀態: getStatusLabel(report.status),
            總金額: report.totalAmount,
            建立日期: report.createdAt.toISOString().split("T")[0],
            項目數: report.items.length,
            說明: report.description || "",
        }));
    } catch (error) {
        console.error("匯出資料取得失敗:", error);
        return [];
    }
}

// 取得報表細項用於匯出
export async function getItemsForExport(reportId?: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    const role = session.user.role;
    if (role !== "FINANCE" && role !== "ADMIN") {
        return [];
    }

    try {
        const where: any = {};
        if (reportId) {
            where.reportId = reportId;
        }

        const items = await prisma.expenseItem.findMany({
            where,
            include: {
                report: {
                    select: { title: true, submitter: { select: { name: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return items.map((item) => ({
            報帳單: item.report.title,
            提交者: item.report.submitter?.name || "Unknown",
            日期: item.date.toISOString().split("T")[0],
            類別: item.category,
            說明: item.description,
            金額: item.amount,
            收據: item.receiptUrl ? "有" : "無",
        }));
    } catch (error) {
        console.error("匯出細項取得失敗:", error);
        return [];
    }
}

// 取得庫存資料用於匯出
export async function getInventoryForExport() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const items = await prisma.inventoryItem.findMany({
            orderBy: { name: "asc" },
        });

        return items.map((item) => ({
            品名: item.name,
            料號: item.sku,
            類別: getCategoryLabel(item.category),
            儲存位置: item.storageLocation,
            當前數量: item.currentQuantity,
            安全庫存: item.safetyStockLevel,
            購買連結: item.vendorLink || "",
        }));
    } catch (error) {
        console.error("匯出庫存取得失敗:", error);
        return [];
    }
}

function getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
        DRAFT: "草稿",
        PENDING_MANAGER: "待主管審核",
        PENDING_FINANCE: "待財務審核",
        RETURNED: "已退回",
        PAID: "已付款",
        REJECTED: "已拒絕",
    };
    return labels[status] || status;
}

function getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
        MOTOR: "馬達",
        SENSOR: "感測器",
        PNEUMATIC: "氣壓",
        CONTROLLER: "控制器",
        HARDWARE: "五金",
        RAW_MATERIAL: "原料",
        TOOL: "工具",
    };
    return labels[category] || category;
}
