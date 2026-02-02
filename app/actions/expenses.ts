"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { expenseReportSchema } from "@/lib/schemas";
import { toStorageUnit } from "@/lib/money";
import { TeamDepartment, ReportStatus } from "@prisma/client";
import { revalidateExpenses, revalidateDashboard } from "@/lib/actions/helpers";

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

const SUBMIT_MESSAGES: Record<string, string> = {
    PAID: "報帳單已直接核准付款！",
    PENDING_FINANCE: "報帳單已提交至財務審核！",
    PENDING_MANAGER: "報帳單已提交至組長審核！",
};

function parseItemDate(dateInput: Date | string): Date {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    const isInvalidDate = isNaN(date.getTime()) || date.getFullYear() > 3000;
    return isInvalidDate ? new Date() : date;
}

function determineSubmitStatus(role: string): string {
    switch (role) {
        case "ADMIN":
        case "FINANCE":
            return "PAID";
        case "LEADER":
            return "PENDING_FINANCE";
        default:
            return "PENDING_MANAGER";
    }
}

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

    // 驗證 JSON 大小（含 base64 收據圖片，需較大空間）
    const MAX_JSON_SIZE = 10 * 1024 * 1024; // 10MB
    if (rawData.length > MAX_JSON_SIZE) {
        return { success: false, message: "資料過大，請減少項目數量" };
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
    const userDepartmentStr = (session.user as { department?: string }).department;
    const userDepartment = userDepartmentStr && Object.values(TeamDepartment).includes(userDepartmentStr as TeamDepartment)
        ? (userDepartmentStr as TeamDepartment)
        : undefined;

    const submitStatus = determineSubmitStatus(session.user.role || "");

    // 收款帳戶
    const bankAccountId = formData.get("bankAccountId") as string | null;
    if (bankAccountId) {
        const bankAccount = await prisma.bankAccount.findUnique({
            where: { id: bankAccountId },
        });
        if (!bankAccount || bankAccount.userId !== session.user.id) {
            return { success: false, message: "無效的收款帳戶" };
        }
        if (!bankAccount.isActive) {
            return { success: false, message: "收款帳戶已停用" };
        }
    }

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
                    status: submitStatus as "PENDING_MANAGER" | "PENDING_FINANCE" | "PAID",
                    totalAmount,
                    amountCents: totalAmountCents,
                    ...(bankAccountId && { bankAccountId }),
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

        revalidateExpenses();
        return { success: true, message: SUBMIT_MESSAGES[submitStatus] || "報帳單已提交！" };
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

    if (data.status && !Object.values(ReportStatus).includes(data.status as ReportStatus)) {
        return { success: false, message: "Invalid status value" };
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
                    ...(data.status && { status: data.status as ReportStatus }),
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
                        newData: JSON.parse(JSON.stringify(data)),
                    },
                });
            }
        });

        revalidateDashboard();
        revalidateExpenses();

        return { success: true, message: "Report updated successfully!" };
    } catch (error) {
        console.error("Failed to update report:", error);
        return { success: false, message: "Database error: Failed to update report." };
    }
}

/**
 * 刪除報帳單（僅限 ADMIN）
 */
export async function deleteReport(reportId: string): Promise<State> {
    const session = await auth();

    if (!session?.user) {
        return { success: false, message: "Unauthorized" };
    }

    if (session.user.role !== "ADMIN") {
        return { success: false, message: "只有管理員可以刪除報帳單" };
    }

    try {
        const report = await prisma.expenseReport.findUnique({
            where: { id: reportId },
        });

        if (!report) {
            return { success: false, message: "Report not found" };
        }

        await prisma.$transaction(async (tx) => {
            await tx.auditLog.create({
                data: {
                    entityType: "ExpenseReport",
                    entityId: reportId,
                    action: "DELETE",
                    actorId: session.user.id!,
                    oldData: JSON.parse(JSON.stringify(report)),
                },
            });
            await tx.expenseItem.deleteMany({ where: { reportId } });
            await tx.expenseReport.delete({ where: { id: reportId } });
        });

        revalidateExpenses();
        return { success: true, message: "Report deleted!" };
    } catch (error) {
        console.error("Failed to delete report:", error);
        return { success: false, message: "Database error: Failed to delete report." };
    }
}
