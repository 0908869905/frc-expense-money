"use server";

/**
 * ?�慧?��?審核 Agent
 * ?��?審核?�輯：�?�?OCR 結�??�報帳�???
 */

import { prisma } from "@/lib/db/prisma";
import { recognizeInvoice } from "@/lib/services/ocr";
import { toDisplayUnit } from "@/lib/utils/money";
import type {
    AuditIssue,
    AuditResult,
    BatchAuditResult
} from "@/types/audit";

// ?�新導出類�?（�? Server Actions 使用�?
export type {
    AuditIssueSeverity,
    AuditIssueType,
    AuditIssue,
    AuditResult,
    BatchAuditResult
} from "@/types/audit";

// ========== ?��?容許誤差 ==========
const AMOUNT_TOLERANCE_PERCENT = 5; // 容許 5% 誤差
const AMOUNT_TOLERANCE_ABSOLUTE = 10; // ??$10 絕�?誤差

// ========== ?��?審核?�數 ==========

/**
 * 審核?��?費用?�目?�收??
 */
export async function auditReceipt(
    expenseItem: {
        id: string;
        amount: number;      // ?�帳?��?（顯示單位�?
        amountCents: number; // ?�帳?��?（儲存單位�?
        date: Date;
        description: string;
        receiptUrl?: string | null;
    },
    receiptImage: string  // Base64 ??URL
): Promise<AuditResult> {
    const issues: AuditIssue[] = [];
    let matchScore = 100;

    // 1. ?��? OCR 辨�?
    const ocrResult = await recognizeInvoice(receiptImage);

    if (!ocrResult.success || !ocrResult.data) {
        return {
            success: false,
            isValid: false,
            matchScore: 0,
            issues: [{
                type: "INVALID_FORMAT",
                severity: "error",
                message: ocrResult.error || "?��?辨�??��??�容",
            }],
            error: ocrResult.error,
        };
    }

    const extractedData = ocrResult.data;

    // 2. 檢查 OCR 信�?�?
    if (extractedData.confidence < 0.5) {
        issues.push({
            type: "LOW_CONFIDENCE",
            severity: "warning",
            message: `OCR 信�?度�?�?(${Math.round(extractedData.confidence * 100)}%)`,
        });
        matchScore -= 15;
    }

    // 3. 比�??��?
    if (extractedData.totalAmount !== null) {
        const extractedAmount = toDisplayUnit(extractedData.totalAmount, "TWD");
        const reportedAmount = expenseItem.amount;
        const amountDiff = Math.abs(extractedAmount - reportedAmount);
        const percentDiff = (amountDiff / reportedAmount) * 100;

        if (amountDiff > AMOUNT_TOLERANCE_ABSOLUTE && percentDiff > AMOUNT_TOLERANCE_PERCENT) {
            issues.push({
                type: "AMOUNT_MISMATCH",
                severity: "error",
                message: `?��?不符：收??$${extractedAmount}，報�?$${reportedAmount}`,
                expected: `$${reportedAmount}`,
                actual: `$${extractedAmount}`,
            });
            matchScore -= 40;
        } else if (amountDiff > 0) {
            // ?��?差異但在容許範�???
            matchScore -= 5;
        }
    } else {
        issues.push({
            type: "LOW_CONFIDENCE",
            severity: "warning",
            message: "?��?從收?�中?��??��?",
        });
        matchScore -= 20;
    }

    // 4. 比�??��?（�?許�?�?7 天�?
    if (extractedData.date) {
        const extractedDate = parseExtractedDate(extractedData.date);
        if (extractedDate) {
            const itemDate = new Date(expenseItem.date);
            const daysDiff = Math.abs(
                Math.floor((extractedDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24))
            );

            if (daysDiff > 7) {
                issues.push({
                    type: "DATE_MISMATCH",
                    severity: "warning",
                    message: `?��?差異較大：收??${formatDate(extractedDate)}，報�?${formatDate(itemDate)}`,
                    expected: formatDate(itemDate),
                    actual: formatDate(extractedDate),
                });
                matchScore -= 15;
            }
        }
    }

    // 5. 檢查?��??�票
    if (extractedData.invoiceNumber) {
        const duplicate = await checkDuplicateInvoice(
            extractedData.invoiceNumber,
            expenseItem.id
        );
        if (duplicate) {
            issues.push({
                type: "DUPLICATE_INVOICE",
                severity: "error",
                message: `?�票?�碼 ${extractedData.invoiceNumber} 已被?��??�目使用`,
            });
            matchScore -= 50;
        }
    }

    // 確�??�數??0-100 範�???
    matchScore = Math.max(0, Math.min(100, matchScore));

    // ?�斷?�否?��?：無 error 級�?�?
    const hasErrors = issues.some((i) => i.severity === "error");

    return {
        success: true,
        isValid: !hasErrors,
        matchScore,
        issues,
        extractedData,
    };
}

/**
 * 檢查?��??�票
 */
async function checkDuplicateInvoice(
    invoiceNumber: string,
    excludeItemId: string
): Promise<boolean> {
    const existing = await prisma.receiptAudit.findFirst({
        where: {
            invoiceNumber: invoiceNumber.replace(/-/g, "").toUpperCase(),
            expenseItemId: { not: excludeItemId },
        },
    });
    return !!existing;
}

/**
 * ?��?審核結�??��??�庫
 */
export async function saveAuditResult(
    expenseItemId: string,
    result: AuditResult
): Promise<void> {
    const data = result.extractedData;
    // �?issues 轉�???JSON ?�容?��?
    const issuesJson = result.issues as unknown as Record<string, unknown>[];

    await prisma.receiptAudit.upsert({
        where: { expenseItemId },
        create: {
            expenseItemId,
            extractedAmount: data?.totalAmount ?? null,
            extractedDate: data?.date ? parseExtractedDate(data.date) : null,
            extractedVendor: data?.vendorName ?? null,
            invoiceNumber: data?.invoiceNumber?.replace(/-/g, "").toUpperCase() ?? null,
            rawText: data?.rawText ?? null,
            isValid: result.isValid,
            matchScore: result.matchScore,
            issues: issuesJson,
            confidence: data?.confidence ?? 0,
        },
        update: {
            extractedAmount: data?.totalAmount ?? null,
            extractedDate: data?.date ? parseExtractedDate(data.date) : null,
            extractedVendor: data?.vendorName ?? null,
            invoiceNumber: data?.invoiceNumber?.replace(/-/g, "").toUpperCase() ?? null,
            rawText: data?.rawText ?? null,
            isValid: result.isValid,
            matchScore: result.matchScore,
            issues: issuesJson,
            confidence: data?.confidence ?? 0,
        },
    });
}

/**
 * ?�次審核?�帳??
 */
export async function batchAuditReport(reportId: string): Promise<BatchAuditResult> {
    try {
        const items = await prisma.expenseItem.findMany({
            where: { reportId },
            select: {
                id: true,
                amount: true,
                amountCents: true,
                date: true,
                description: true,
                receiptUrl: true,
            },
        });

        if (items.length === 0) {
            return {
                success: false,
                totalItems: 0,
                auditedItems: 0,
                passedItems: 0,
                failedItems: 0,
                results: [],
                error: "?�帳?�中沒�?費用?�目",
            };
        }

        const results: BatchAuditResult["results"] = [];
        let passedItems = 0;
        let auditedItems = 0;

        for (const item of items) {
            if (!item.receiptUrl) {
                results.push({
                    itemId: item.id,
                    description: item.description,
                    result: {
                        success: false,
                        isValid: false,
                        matchScore: 0,
                        issues: [{
                            type: "MISSING_RECEIPT",
                            severity: "error",
                            message: "此項目缺少收據",
                        }],
                    },
                });
                continue;
            }

            const auditResult = await auditReceipt(item, item.receiptUrl);

            // ?��?審核結�?
            if (auditResult.success) {
                await saveAuditResult(item.id, auditResult);
                auditedItems++;
                if (auditResult.isValid) passedItems++;
            }

            results.push({
                itemId: item.id,
                description: item.description,
                result: auditResult,
            });
        }

        return {
            success: true,
            totalItems: items.length,
            auditedItems,
            passedItems,
            failedItems: auditedItems - passedItems,
            results,
        };
    } catch (error) {
        console.error("?�次審核失�?:", error);
        return {
            success: false,
            totalItems: 0,
            auditedItems: 0,
            passedItems: 0,
            failedItems: 0,
            results: [],
            error: error instanceof Error ? error.message : "?�次審核失�?",
        };
    }
}

// ========== 工具?�數 ==========

/**
 * �?? OCR ?��??�日?��?�?
 */
function parseExtractedDate(dateStr: string): Date | null {
    // ?�試民�?年格�?
    const rocMatch = dateStr.match(/(\d{2,3})\s*年\s*(\d{1,2})\s*?�\s*(\d{1,2})\s*??);
    if (rocMatch) {
        const year = parseInt(rocMatch[1], 10) + 1911;
        const month = parseInt(rocMatch[2], 10) - 1;
        const day = parseInt(rocMatch[3], 10);
        return new Date(year, month, day);
    }

    // ?�試標�??��??��?
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * ?��??�日??
 */
function formatDate(date: Date): string {
    return date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}

