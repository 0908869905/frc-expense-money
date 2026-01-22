"use server";

import { auth } from "@/auth";
import { recognizeInvoice, InvoiceData } from "@/lib/agents/ocr";
import {
    auditReceipt,
    saveAuditResult,
    batchAuditReport,
    AuditResult,
    BatchAuditResult,
} from "@/lib/agents/receipt-audit";
import { prisma } from "@/lib/prisma";

// --- Types ---
export type OCRResult = {
    success: boolean;
    data?: InvoiceData;
    error?: string;
};

// --- Constants ---
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const BASE64_SIZE_RATIO = 0.75; // Base64 約為原檔 1.33 倍

const LOCALHOST_PATTERNS = ["localhost", "127.0.0.1", "0.0.0.0", "[::1]"];
const INTERNAL_DOMAIN_SUFFIXES = [".localhost", ".local", ".internal", ".corp", ".lan"];
const METADATA_HOSTNAMES = ["metadata.google.internal", "169.254.169.254"];

// --- Helper Functions ---

/**
 * 建立未授權的 AuditResult
 */
function createUnauthorizedAuditResult(error: string): AuditResult {
    return {
        success: false,
        isValid: false,
        matchScore: 0,
        issues: [],
        error,
    };
}

/**
 * 建立未授權的 BatchAuditResult
 */
function createUnauthorizedBatchResult(error: string): BatchAuditResult {
    return {
        success: false,
        totalItems: 0,
        auditedItems: 0,
        passedItems: 0,
        failedItems: 0,
        results: [],
        error,
    };
}

/**
 * 檢查是否有審核權限
 */
function hasAuditPermission(
    report: { submitterId: string | null; submitterEmail: string },
    userId: string,
    userEmail: string,
    userRole: string
): boolean {
    const isOwner = report.submitterId === userId || report.submitterEmail === userEmail;
    const isPrivileged = userRole === "ADMIN" || userRole === "FINANCE";
    return isOwner || isPrivileged;
}

/**
 * SSRF 保護：檢查 URL 是否指向內部網路
 */
function isInternalUrl(urlString: string): boolean {
    try {
        const url = new URL(urlString);
        const hostname = url.hostname.toLowerCase();

        // 檢查 localhost 變體
        if (LOCALHOST_PATTERNS.includes(hostname)) {
            return true;
        }

        // 檢查內部網域後綴
        if (INTERNAL_DOMAIN_SUFFIXES.some((suffix) => hostname.endsWith(suffix))) {
            return true;
        }

        // 檢查 metadata endpoints
        if (METADATA_HOSTNAMES.includes(hostname) || hostname.includes("metadata")) {
            return true;
        }

        // 檢查私有 IP 範圍
        const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
        if (ipv4Match) {
            const [, a, b] = ipv4Match.map(Number);
            const isPrivateIP =
                a === 10 ||
                a === 127 ||
                a === 0 ||
                (a === 172 && b >= 16 && b <= 31) ||
                (a === 192 && b === 168) ||
                (a === 169 && b === 254);

            if (isPrivateIP) {
                return true;
            }
        }

        return false;
    } catch {
        return true; // 無效 URL 視為不安全
    }
}

// --- OCR Server Actions ---

/**
 * OCR 發票辨識（Base64 圖片）
 * @param imageBase64 Base64 編碼的圖片（含 data:image/... 前綴）
 */
export async function scanInvoice(imageBase64: string): Promise<OCRResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    if (!imageBase64.startsWith("data:image/")) {
        return { success: false, error: "無效的圖片格式" };
    }

    const estimatedSize = imageBase64.length * BASE64_SIZE_RATIO;
    if (estimatedSize > MAX_IMAGE_SIZE_BYTES) {
        return { success: false, error: "圖片大小超過限制 (5MB)" };
    }

    try {
        const result = await recognizeInvoice(imageBase64);

        if (!result.success) {
            return { success: false, error: result.error };
        }

        return { success: true, data: result.data };
    } catch (error) {
        console.error("OCR Action 錯誤:", error);
        return { success: false, error: "OCR 處理失敗，請稍後再試" };
    }
}

/**
 * 從 URL 辨識發票（僅支援 HTTPS）
 */
export async function scanInvoiceFromUrl(imageUrl: string): Promise<OCRResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, error: "Unauthorized" };
    }

    if (!imageUrl.startsWith("https://")) {
        return { success: false, error: "僅支援 HTTPS URL" };
    }

    if (isInternalUrl(imageUrl)) {
        return { success: false, error: "不允許存取內部網路位址" };
    }

    try {
        return await recognizeInvoice(imageUrl);
    } catch (error) {
        console.error("OCR URL Action 錯誤:", error);
        return { success: false, error: "OCR 處理失敗" };
    }
}

// --- Audit Server Actions ---

/**
 * 審核單筆費用項目
 */
export async function auditExpenseItem(
    itemId: string,
    receiptImage: string
): Promise<AuditResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return createUnauthorizedAuditResult("Unauthorized");
    }

    try {
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
            return createUnauthorizedAuditResult("找不到費用項目");
        }

        if (!item.report) {
            return createUnauthorizedAuditResult("找不到關聯的報帳單");
        }

        const canAudit = hasAuditPermission(
            item.report,
            session.user.id,
            session.user.email || "",
            session.user.role || ""
        );

        if (!canAudit) {
            return createUnauthorizedAuditResult("權限不足");
        }

        const result = await auditReceipt(item, receiptImage);

        if (result.success) {
            await saveAuditResult(itemId, result);
        }

        return result;
    } catch (error) {
        console.error("審核失敗:", error);
        const errorMessage = error instanceof Error ? error.message : "審核處理失敗";
        return createUnauthorizedAuditResult(errorMessage);
    }
}

/**
 * 批次審核整個報帳單
 */
export async function batchAuditExpenseReport(reportId: string): Promise<BatchAuditResult> {
    const session = await auth();
    if (!session?.user?.id) {
        return createUnauthorizedBatchResult("Unauthorized");
    }

    try {
        const report = await prisma.expenseReport.findUnique({
            where: { id: reportId },
            select: {
                submitterId: true,
                submitterEmail: true,
            },
        });

        if (!report) {
            return createUnauthorizedBatchResult("找不到報帳單");
        }

        const canAudit = hasAuditPermission(
            report,
            session.user.id,
            session.user.email || "",
            session.user.role || ""
        );

        if (!canAudit) {
            return createUnauthorizedBatchResult("權限不足");
        }

        return await batchAuditReport(reportId);
    } catch (error) {
        console.error("批次審核失敗:", error);
        const errorMessage = error instanceof Error ? error.message : "批次審核處理失敗";
        return createUnauthorizedBatchResult(errorMessage);
    }
}
