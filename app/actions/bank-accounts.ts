"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { maskAccountNumber, canViewFullAccount } from "@/lib/utils/mask-account";

// --- Types ---
export type BankAccountState = {
    success: boolean;
    message: string | null;
    errors?: {
        bankName?: string[];
        branchName?: string[];
        accountNumber?: string[];
        accountHolder?: string[];
    };
};

export type BankAccountData = {
    id: string;
    bankName: string;
    branchName: string | null;
    accountNumber: string;
    accountHolder: string;
    isDefault: boolean;
    isActive: boolean;
};

// --- Schema ---
const bankAccountSchema = z.object({
    bankName: z.string().min(1, "銀行名稱為必填").max(50, "銀行名稱過長"),
    branchName: z.string().max(50, "分行名稱過長").optional(),
    accountNumber: z.string()
        .min(5, "帳號至少需要 5 位數")
        .max(30, "帳號過長")
        .regex(/^[0-9-]+$/, "帳號只能包含數字和連字號"),
    accountHolder: z.string().min(1, "戶名為必填").max(50, "戶名過長"),
    isDefault: z.boolean().optional(),
});

// --- Constants ---
const MINIMUM_ROLE_FOR_BANK_ACCOUNT: Role[] = ["VICE_LEADER", "LEADER", "FINANCE", "ADMIN"];

// --- Helper Functions ---
function canManageBankAccount(role: Role): boolean {
    return MINIMUM_ROLE_FOR_BANK_ACCOUNT.includes(role);
}

function revalidateBankAccounts(): void {
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/expenses");
}

// --- Server Actions ---

/**
 * 取得當前用戶的所有收款帳戶
 */
export async function getBankAccounts(): Promise<BankAccountData[]> {
    const session = await auth();

    if (!session?.user?.id) {
        return [];
    }

    const accounts = await prisma.bankAccount.findMany({
        where: {
            userId: session.user.id,
            isActive: true,
        },
        orderBy: [
            { isDefault: "desc" },
            { createdAt: "desc" },
        ],
    });

    return accounts.map((account) => ({
        id: account.id,
        bankName: account.bankName,
        branchName: account.branchName,
        accountNumber: account.accountNumber,
        accountHolder: account.accountHolder,
        isDefault: account.isDefault,
        isActive: account.isActive,
    }));
}

/**
 * 取得報帳單的收款帳戶資訊（含權限檢查）
 */
export async function getBankAccountForReport(reportId: string): Promise<{
    account: BankAccountData | null;
    masked: boolean;
}> {
    const session = await auth();

    if (!session?.user?.id) {
        return { account: null, masked: true };
    }

    const report = await prisma.expenseReport.findUnique({
        where: { id: reportId },
        include: {
            bankAccount: true,
        },
    });

    if (!report?.bankAccount) {
        return { account: null, masked: false };
    }

    const viewerRole = (session.user.role as Role) || "USER";
    const canViewFull = canViewFullAccount(
        viewerRole,
        session.user.id,
        report.submitterId || ""
    );

    const account: BankAccountData = {
        id: report.bankAccount.id,
        bankName: report.bankAccount.bankName,
        branchName: report.bankAccount.branchName,
        accountNumber: canViewFull
            ? report.bankAccount.accountNumber
            : maskAccountNumber(report.bankAccount.accountNumber),
        accountHolder: report.bankAccount.accountHolder,
        isDefault: report.bankAccount.isDefault,
        isActive: report.bankAccount.isActive,
    };

    return { account, masked: !canViewFull };
}

/**
 * 新增收款帳戶
 */
export async function createBankAccount(
    prevState: BankAccountState,
    formData: FormData
): Promise<BankAccountState> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, message: "未授權" };
    }

    const userRole = (session.user.role as Role) || "USER";
    if (!canManageBankAccount(userRole)) {
        return { success: false, message: "您沒有權限管理收款帳戶" };
    }

    const rawData = {
        bankName: formData.get("bankName"),
        branchName: formData.get("branchName") || undefined,
        accountNumber: formData.get("accountNumber"),
        accountHolder: formData.get("accountHolder"),
        isDefault: formData.get("isDefault") === "true",
    };

    const validatedFields = bankAccountSchema.safeParse(rawData);
    if (!validatedFields.success) {
        return {
            success: false,
            message: "驗證失敗",
            errors: validatedFields.error.flatten().fieldErrors as BankAccountState["errors"],
        };
    }

    const { bankName, branchName, accountNumber, accountHolder, isDefault } = validatedFields.data;

    try {
        await prisma.$transaction(async (tx) => {
            // 如果要設為預設，先取消其他預設帳戶
            if (isDefault) {
                await tx.bankAccount.updateMany({
                    where: {
                        userId: session.user.id,
                        isDefault: true,
                    },
                    data: { isDefault: false },
                });
            }

            // 檢查是否為第一個帳戶（自動設為預設）
            const existingCount = await tx.bankAccount.count({
                where: {
                    userId: session.user.id,
                    isActive: true,
                },
            });

            await tx.bankAccount.create({
                data: {
                    userId: session.user.id,
                    bankName,
                    branchName: branchName || null,
                    accountNumber,
                    accountHolder,
                    isDefault: isDefault || existingCount === 0,
                },
            });
        });

        revalidateBankAccounts();
        return { success: true, message: "收款帳戶新增成功！" };
    } catch (error) {
        console.error("Failed to create bank account:", error);
        return { success: false, message: "資料庫錯誤：新增帳戶失敗" };
    }
}

/**
 * 更新收款帳戶
 */
export async function updateBankAccount(
    accountId: string,
    data: {
        bankName?: string;
        branchName?: string;
        accountNumber?: string;
        accountHolder?: string;
    }
): Promise<BankAccountState> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, message: "未授權" };
    }

    // 權限檢查
    const userRole = (session.user.role as Role) || "USER";
    if (!canManageBankAccount(userRole)) {
        return { success: false, message: "您沒有權限管理收款帳戶" };
    }

    // 輸入驗證
    if (data.bankName !== undefined && data.bankName.length < 1) {
        return { success: false, message: "銀行名稱不可為空" };
    }
    if (data.accountNumber !== undefined && data.accountNumber.length < 5) {
        return { success: false, message: "帳號至少需要 5 位數" };
    }
    if (data.accountHolder !== undefined && data.accountHolder.length < 1) {
        return { success: false, message: "戶名不可為空" };
    }

    const account = await prisma.bankAccount.findUnique({
        where: { id: accountId },
    });

    if (!account) {
        return { success: false, message: "帳戶不存在" };
    }

    if (account.userId !== session.user.id) {
        return { success: false, message: "您只能編輯自己的帳戶" };
    }

    try {
        await prisma.bankAccount.update({
            where: { id: accountId },
            data: {
                ...(data.bankName && { bankName: data.bankName }),
                ...(data.branchName !== undefined && { branchName: data.branchName || null }),
                ...(data.accountNumber && { accountNumber: data.accountNumber }),
                ...(data.accountHolder && { accountHolder: data.accountHolder }),
            },
        });

        revalidateBankAccounts();
        return { success: true, message: "帳戶更新成功！" };
    } catch (error) {
        console.error("Failed to update bank account:", error);
        return { success: false, message: "資料庫錯誤：更新帳戶失敗" };
    }
}

/**
 * 刪除收款帳戶（軟刪除）
 */
export async function deleteBankAccount(accountId: string): Promise<BankAccountState> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, message: "未授權" };
    }

    // 權限檢查
    const userRole = (session.user.role as Role) || "USER";
    if (!canManageBankAccount(userRole)) {
        return { success: false, message: "您沒有權限管理收款帳戶" };
    }

    const account = await prisma.bankAccount.findUnique({
        where: { id: accountId },
    });

    if (!account) {
        return { success: false, message: "帳戶不存在" };
    }

    if (account.userId !== session.user.id) {
        return { success: false, message: "您只能刪除自己的帳戶" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 軟刪除：設定 isActive = false
            await tx.bankAccount.update({
                where: { id: accountId },
                data: {
                    isActive: false,
                    isDefault: false,
                },
            });

            // 如果刪除的是預設帳戶，自動將最舊的帳戶設為預設
            if (account.isDefault) {
                const oldestActive = await tx.bankAccount.findFirst({
                    where: {
                        userId: session.user.id,
                        isActive: true,
                        id: { not: accountId },
                    },
                    orderBy: { createdAt: "asc" },
                });

                if (oldestActive) {
                    await tx.bankAccount.update({
                        where: { id: oldestActive.id },
                        data: { isDefault: true },
                    });
                }
            }
        });

        revalidateBankAccounts();
        return { success: true, message: "帳戶已刪除" };
    } catch (error) {
        console.error("Failed to delete bank account:", error);
        return { success: false, message: "資料庫錯誤：刪除帳戶失敗" };
    }
}

/**
 * 設為預設帳戶
 */
export async function setDefaultBankAccount(accountId: string): Promise<BankAccountState> {
    const session = await auth();

    if (!session?.user?.id) {
        return { success: false, message: "未授權" };
    }

    // 權限檢查
    const userRole = (session.user.role as Role) || "USER";
    if (!canManageBankAccount(userRole)) {
        return { success: false, message: "您沒有權限管理收款帳戶" };
    }

    const account = await prisma.bankAccount.findUnique({
        where: { id: accountId },
    });

    if (!account) {
        return { success: false, message: "帳戶不存在" };
    }

    if (account.userId !== session.user.id) {
        return { success: false, message: "您只能設定自己的帳戶" };
    }

    if (!account.isActive) {
        return { success: false, message: "無法將停用的帳戶設為預設" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            // 先取消所有預設
            await tx.bankAccount.updateMany({
                where: {
                    userId: session.user.id,
                    isDefault: true,
                },
                data: { isDefault: false },
            });

            // 設定新預設
            await tx.bankAccount.update({
                where: { id: accountId },
                data: { isDefault: true },
            });
        });

        revalidateBankAccounts();
        return { success: true, message: "已設為預設帳戶" };
    } catch (error) {
        console.error("Failed to set default bank account:", error);
        return { success: false, message: "資料庫錯誤：設定預設帳戶失敗" };
    }
}

/**
 * 檢查用戶是否可以管理收款帳戶
 */
export async function canUserManageBankAccounts(): Promise<boolean> {
    const session = await auth();

    if (!session?.user?.id) {
        return false;
    }

    const userRole = (session.user.role as Role) || "USER";
    return canManageBankAccount(userRole);
}
