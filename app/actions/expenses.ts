"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { expenseReportSchema } from "@/lib/schemas";
import { toStorageUnit } from "@/lib/money";
import { revalidatePath } from "next/cache";

// --- Types ---
export type State = {
    success: boolean;
    message: string | null;
    errors?: {
        [K in keyof typeof expenseReportSchema.shape]?: string[];
    };
};

interface UpdateReportData {
    title?: string;
    description?: string;
    status?: string;
}

// --- Constants ---
const SUBMIT_MESSAGES: Record<string, string> = {
    PAID: "報帳單已直接核准付款！",
    PENDING_FINANCE: "報帳單已提交至財務審核！",
    PENDING_MANAGER: "報帳單已提交至組長審核！",
};

// --- Helper Functions ---
function revalidateExpensePaths(): void {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");
}

function parseItemDate(dateInput: Date | string): Date {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const isInvalidDate = isNaN(date.getTime()) || date.getFullYear() > 3000;
    return isInvalidDate ? new Date() : date;
}

function determineSubmitStatus(role: string): { status: string; skipMessage: string } {
    // ADMIN, FINANCE -> 直接付款
    // LEADER -> 跳過組長審核，進入財務審核
    // VICE_LEADER 或其他 -> 正常流程
    if (role === "ADMIN" || role === "FINANCE") {
        return { status: "PAID", skipMessage: "（管理員/財務直接付款）" };
    }
    if (role === "LEADER") {
        return { status: "PENDING_FINANCE", skipMessage: "（組長跳過組長審核）" };
    }
    return { status: "PENDING_MANAGER", skipMessage: "" };
}

function canAccessReport(report: { submitterEmail: string }, userEmail: string, userRole: string): boolean {
    return report.submitterEmail === userEmail || userRole === "ADMIN";
}

// --- Server Actions ---

/**
 * 建立新的報帳單
 */
export async function createExpense(prevState: State, formData: FormData): Promise<State> {
    const session = await auth();

    if (!session?.user) {
        return { success: false, message: "Unauthorized" };
    }

    // USER 角色不能新增報帳單
    if (session.user.role === "USER") {
        return { success: false, message: "您沒有權限新增報帳單" };
    }

    // 解析表單資料
    const rawData = formData.get("data");
    if (!rawData || typeof rawData !== "string") {
        return { success: false, message: "Invalid form data submission" };
    }

    let parsedData: unknown;
    try {
        parsedData = JSON.parse(rawData);
    } catch {
        return { success: false, message: "無效的 JSON 資料格式" };
    }

    const validatedFields = expenseReportSchema.safeParse(parsedData);
    if (!validatedFields.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validatedFields.error.flatten().fieldErrors as State["errors"],
        };
    }

    const { title, description, items } = validatedFields.data;
    const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
    const totalAmountCents = items.reduce((sum, item) => sum + toStorageUnit(item.amount), 0);

    // 從 session 取得提交者資訊
    const submitterName = session.user.name || session.user.email || "Unknown";
    const submitterEmail = session.user.email || "";
    const submitterId = session.user.id || null;
    const userDepartment = (session.user as { department?: string }).department || null;

    try {
        await prisma.$transaction(async (tx) => {
            const report = await tx.expenseReport.create({
                data: {
                    title,
                    description: description || "",
                    ...(userDepartment && { department: userDepartment }),
                    submitterName,
                    submitterEmail,
                    submitterId,
                    status: "DRAFT",
                    totalAmount,
                    amountCents: totalAmountCents,
                    items: {
                        create: items.map((item) => ({
                            date: parseItemDate(item.date),
                            category: item.category,
                            description: item.description,
                            amount: item.amount,
                            amountCents: toStorageUnit(item.amount),
                            receiptUrl: item.receiptUrl,
                        })),
                    },
                },
            });

            if (submitterId) {
                await tx.auditLog.create({
                    data: {
                        entityType: "ExpenseReport",
                        entityId: report.id,
                        action: "CREATE",
                        actorId: submitterId,
                        newData: JSON.parse(JSON.stringify(report)),
                    },
                });
            }
        });

        revalidateExpensePaths();
        return { success: true, message: "報帳單建立成功！" };
    } catch (error) {
        console.error("Failed to create expense report:", error);
        return { success: false, message: "資料庫錯誤：建立報帳單失敗" };
    }
}

/**
 * 更新報帳單（僅限 ADMIN）
 */
export async function updateReport(reportId: string, data: UpdateReportData): Promise<State> {
    const session = await auth();

    if (!session?.user) {
        return { success: false, message: "Unauthorized" };
    }

    if (session.user.role !== "ADMIN") {
        return { success: false, message: "Only admins can edit reports" };
    }

    try {
        const report = await prisma.expenseReport.findUnique({
            where: { id: reportId },
        });

        if (!report) {
            return { success: false, message: "Report not found" };
        }

        await prisma.$transaction(async (tx) => {
            await tx.expenseReport.update({
                where: { id: reportId },
                data: {
                    ...(data.title && { title: data.title }),
                    ...(data.description !== undefined && { description: data.description }),
                    ...(data.status && { status: data.status as typeof report.status }),
                },
            });

            if (session.user.id) {
                await tx.auditLog.create({
                    data: {
                        entityType: "ExpenseReport",
                        entityId: reportId,
                        action: "UPDATE",
                        actorId: session.user.id,
                        oldData: JSON.parse(JSON.stringify(report)),
                        newData: data,
                    },
                });
            }
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/reports");

        return { success: true, message: "Report updated successfully!" };
    } catch (error) {
        console.error("Failed to update report:", error);
        return { success: false, message: "Database error: Failed to update report." };
    }
}

/**
 * 提交草稿報帳單以進行審核
 */
export async function submitReport(reportId: string): Promise<State> {
    const session = await auth();

    if (!session?.user) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const report = await prisma.expenseReport.findUnique({
            where: { id: reportId },
        });

        if (!report) {
            return { success: false, message: "Report not found" };
        }

        if (!canAccessReport(report, session.user.email || "", session.user.role || "")) {
            return { success: false, message: "You can only submit your own reports" };
        }

        if (report.status !== "DRAFT") {
            return { success: false, message: "Only draft reports can be submitted" };
        }

        const { status: newStatus, skipMessage } = determineSubmitStatus(session.user.role || "");

        await prisma.$transaction(async (tx) => {
            await tx.expenseReport.update({
                where: { id: reportId },
                data: { status: newStatus as typeof report.status },
            });

            if (session.user.id) {
                await tx.auditLog.create({
                    data: {
                        entityType: "ExpenseReport",
                        entityId: reportId,
                        action: "SUBMIT",
                        actorId: session.user.id,
                        oldData: { status: "DRAFT" },
                        newData: { status: newStatus, skipMessage },
                    },
                });
            }
        });

        revalidateExpensePaths();
        return { success: true, message: SUBMIT_MESSAGES[newStatus] || "Report submitted!" };
    } catch (error) {
        console.error("Failed to submit report:", error);
        return { success: false, message: "Database error: Failed to submit report." };
    }
}

/**
 * 刪除草稿報帳單
 */
export async function deleteReport(reportId: string): Promise<State> {
    const session = await auth();

    if (!session?.user) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        const report = await prisma.expenseReport.findUnique({
            where: { id: reportId },
        });

        if (!report) {
            return { success: false, message: "Report not found" };
        }

        if (!canAccessReport(report, session.user.email || "", session.user.role || "")) {
            return { success: false, message: "You can only delete your own reports" };
        }

        const isAdmin = session.user.role === "ADMIN";
        if (report.status !== "DRAFT" && !isAdmin) {
            return { success: false, message: "Only draft reports can be deleted" };
        }

        await prisma.$transaction(async (tx) => {
            await tx.expenseItem.deleteMany({
                where: { reportId },
            });
            await tx.expenseReport.delete({
                where: { id: reportId },
            });
        });

        revalidateExpensePaths();
        return { success: true, message: "Report deleted!" };
    } catch (error) {
        console.error("Failed to delete report:", error);
        return { success: false, message: "Database error: Failed to delete report." };
    }
}
