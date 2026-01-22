"use server";

import { auth } from "@/auth";
import { recognizeInvoice, InvoiceData } from "@/lib/agents/ocr";
import { revalidatePath } from "next/cache";

/**
 * SSRF 保護：檢查 URL 是否指向內部網路
 */
function isInternalUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        const hostname = url.hostname.toLowerCase();

        // 阻止 localhost 和相關變體
        if (
            hostname === "localhost" ||
            hostname === "127.0.0.1" ||
            hostname === "0.0.0.0" ||
            hostname === "[::1]" ||
            hostname.endsWith(".localhost")
        ) {
            return true;
        }

        // 阻止私有 IP 範圍
        // 10.0.0.0 - 10.255.255.255
        // 172.16.0.0 - 172.31.255.255
        // 192.168.0.0 - 192.168.255.255
        // 169.254.0.0 - 169.254.255.255 (link-local)
        const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        const match = hostname.match(ipv4Regex);
        if (match) {
            const [, a, b] = match.map(Number);
            if (
                a === 10 ||
                a === 127 ||
                (a === 172 && b >= 16 && b <= 31) ||
                (a === 192 && b === 168) ||
                (a === 169 && b === 254) ||
                a === 0
            ) {
                return true;
            }
        }

        // 阻止內部網域
        if (
            hostname.endsWith(".local") ||
            hostname.endsWith(".internal") ||
            hostname.endsWith(".corp") ||
            hostname.endsWith(".lan")
        ) {
            return true;
        }

        // 阻止 metadata endpoints (雲端服務)
        if (
            hostname === "metadata.google.internal" ||
            hostname === "169.254.169.254" ||
            hostname.includes("metadata")
        ) {
            return true;
        }

        return false;
    } catch {
        return true; // 無效 URL 視為不安全
    }
}

export type OCRResult = {
    success: boolean;
    data?: InvoiceData;
    error?: string;
};

/**
 * OCR 發票辨識 Server Action
 * 
 * @param imageBase64 Base64 編碼的圖片（含 data:image/... 前綴）
 */
export async function scanInvoice(imageBase64: string): Promise<OCRResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    // 驗證圖片格式
    if (!imageBase64.startsWith("data:image/")) {
        return { success: false, error: "無效的圖片格式" };
    }

    // 檢查圖片大小（限制 5MB）
    const base64Size = imageBase64.length * 0.75; // Base64 約為原檔 1.33 倍
    if (base64Size > 5 * 1024 * 1024) {
        return { success: false, error: "圖片大小超過限制 (5MB)" };
    }

    try {
        const result = await recognizeInvoice(imageBase64);

        if (!result.success) {
            return { success: false, error: result.error };
        }

        return {
            success: true,
            data: result.data,
        };
    } catch (error) {
        console.error("OCR Action 錯誤:", error);
        return {
            success: false,
            error: "OCR 處理失敗，請稍後再試",
        };
    }
}

/**
 * 從 URL 辨識發票
 */
export async function scanInvoiceFromUrl(imageUrl: string): Promise<OCRResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    // 驗證 URL 格式
    if (!imageUrl.startsWith("https://")) {
        return { success: false, error: "僅支援 HTTPS URL" };
    }

    // SSRF 保護：阻止內部網路請求
    if (isInternalUrl(imageUrl)) {
        return { success: false, error: "不允許存取內部網路位址" };
    }

    try {
        const result = await recognizeInvoice(imageUrl);
        return result;
    } catch (error) {
        console.error("OCR URL Action 錯誤:", error);
        return {
            success: false,
            error: "OCR 處理失敗",
        };
    }
}

// ========== 智慧審核 Actions ==========

import {
    auditReceipt,
    saveAuditResult,
    batchAuditReport,
    AuditResult,
    BatchAuditResult,
} from "@/lib/agents/receipt-audit";
import { prisma } from "@/lib/prisma";

/**
 * 審核單筆費用項目
 */
export async function auditExpenseItem(
    itemId: string,
    receiptImage: string
): Promise<AuditResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return {
            success: false,
            isValid: false,
            matchScore: 0,
            issues: [],
            error: "Unauthorized",
        };
    }

    try {
        // 取得費用項目資料
        const item = await prisma.expenseItem.findUnique({
            where: { id: itemId },
            select: {
                id: true,
                amount: true,
                amountCents: true,
                date: true,
                description: true,
                receiptUrl: true,
                report: {
                    select: {
                        submitterId: true,
                        submitterEmail: true,
                    },
                },
            },
        });

        if (!item) {
            return {
                success: false,
                isValid: false,
                matchScore: 0,
                issues: [],
                error: "找不到費用項目",
            };
        }

        // 權限檢查：只有提交者、ADMIN、FINANCE 可以審核
        const userRole = session.user.role;
        const isOwner =
            item.report?.submitterId === session.user.id ||
            item.report?.submitterEmail === session.user.email;
        const isPrivileged = userRole === "ADMIN" || userRole === "FINANCE";

        if (!isOwner && !isPrivileged) {
            return {
                success: false,
                isValid: false,
                matchScore: 0,
                issues: [],
                error: "權限不足",
            };
        }

        // 執行審核
        const result = await auditReceipt(item, receiptImage);

        // 儲存審核結果
        if (result.success) {
            await saveAuditResult(itemId, result);
        }

        return result;
    } catch (error) {
        console.error("審核失敗:", error);
        return {
            success: false,
            isValid: false,
            matchScore: 0,
            issues: [],
            error: error instanceof Error ? error.message : "審核處理失敗",
        };
    }
}

/**
 * 批次審核整個報帳單
 */
export async function batchAuditExpenseReport(
    reportId: string
): Promise<BatchAuditResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return {
            success: false,
            totalItems: 0,
            auditedItems: 0,
            passedItems: 0,
            failedItems: 0,
            results: [],
            error: "Unauthorized",
        };
    }

    try {
        // 取得報帳單
        const report = await prisma.expenseReport.findUnique({
            where: { id: reportId },
            select: {
                submitterId: true,
                submitterEmail: true,
            },
        });

        if (!report) {
            return {
                success: false,
                totalItems: 0,
                auditedItems: 0,
                passedItems: 0,
                failedItems: 0,
                results: [],
                error: "找不到報帳單",
            };
        }

        // 權限檢查
        const userRole = session.user.role;
        const isOwner =
            report.submitterId === session.user.id ||
            report.submitterEmail === session.user.email;
        const isPrivileged = userRole === "ADMIN" || userRole === "FINANCE";

        if (!isOwner && !isPrivileged) {
            return {
                success: false,
                totalItems: 0,
                auditedItems: 0,
                passedItems: 0,
                failedItems: 0,
                results: [],
                error: "權限不足",
            };
        }

        // 執行批次審核
        return await batchAuditReport(reportId);
    } catch (error) {
        console.error("批次審核失敗:", error);
        return {
            success: false,
            totalItems: 0,
            auditedItems: 0,
            passedItems: 0,
            failedItems: 0,
            results: [],
            error: error instanceof Error ? error.message : "批次審核處理失敗",
        };
    }
}

