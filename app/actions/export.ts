"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// --- Type Definitions ---
interface ExportFilters {
    startDate?: string;
    endDate?: string;
    status?: string;
}

interface ReportExportRow {
    報帳單編號: string;
    標題: string;
    提交者: string;
    提交者Email: string;
    狀態: string;
    總金額: number;
    建立日期: string;
    項目數: number;
    說明: string;
}

interface ItemExportRow {
    報帳單: string;
    提交者: string;
    日期: string;
    類別: string;
    說明: string;
    金額: number;
    收據: string;
}

interface InventoryExportRow {
    品名: string;
    料號: string;
    類別: string;
    儲存位置: string;
    當前數量: number;
    安全庫存: number;
    購買連結: string;
}

// --- Label Mappings ---
const STATUS_LABELS: Record<string, string> = {
    DRAFT: "草稿",
    PENDING_MANAGER: "待主管審核",
    PENDING_FINANCE: "待財務審核",
    RETURNED: "已退回",
    PAID: "已付款",
    REJECTED: "已拒絕",
};

const CATEGORY_LABELS: Record<string, string> = {
    MOTOR: "馬達",
    SENSOR: "感測器",
    PNEUMATIC: "氣壓",
    CONTROLLER: "控制器",
    HARDWARE: "五金",
    RAW_MATERIAL: "原料",
    TOOL: "工具",
};

function getStatusLabel(status: string): string {
    return STATUS_LABELS[status] || status;
}

function getCategoryLabel(category: string): string {
    return CATEGORY_LABELS[category] || category;
}

// --- Helper Functions ---
async function hasFinanceAccess(): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.id) return false;

    const role = session.user.role;
    return role === "FINANCE" || role === "ADMIN";
}

async function isAuthenticated(): Promise<boolean> {
    const session = await auth();
    return !!session?.user?.id;
}

function formatDate(date: Date): string {
    return date.toISOString().split("T")[0];
}

// --- Export Functions ---

/**
 * 取得報表資料用於匯出
 * 需要 FINANCE 或 ADMIN 權限
 */
export async function getReportsForExport(filters?: ExportFilters): Promise<ReportExportRow[]> {
    if (!(await hasFinanceAccess())) return [];

    try {
        const where: Record<string, unknown> = {};

        if (filters?.startDate || filters?.endDate) {
            const createdAt: Record<string, Date> = {};
            if (filters.startDate) createdAt.gte = new Date(filters.startDate);
            if (filters.endDate) createdAt.lte = new Date(filters.endDate);
            where.createdAt = createdAt;
        }

        if (filters?.status && filters.status !== "all") {
            where.status = filters.status;
        }

        const reports = await prisma.expenseReport.findMany({
            where,
            include: {
                submitter: { select: { name: true, email: true } },
                items: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return reports.map((report) => ({
            報帳單編號: report.id,
            標題: report.title,
            提交者: report.submitter?.name || report.submitter?.email || "Unknown",
            提交者Email: report.submitter?.email || "",
            狀態: getStatusLabel(report.status),
            總金額: report.totalAmount,
            建立日期: formatDate(report.createdAt),
            項目數: report.items.length,
            說明: report.description || "",
        }));
    } catch (error) {
        console.error("匯出資料取得失敗:", error);
        return [];
    }
}

/**
 * 取得報表細項用於匯出
 * 需要 FINANCE 或 ADMIN 權限
 */
export async function getItemsForExport(reportId?: string): Promise<ItemExportRow[]> {
    if (!(await hasFinanceAccess())) return [];

    try {
        const where = reportId ? { reportId } : {};

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
            日期: formatDate(item.date),
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

/**
 * 取得庫存資料用於匯出
 * 需要登入權限
 */
export async function getInventoryForExport(): Promise<InventoryExportRow[]> {
    if (!(await isAuthenticated())) return [];

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
