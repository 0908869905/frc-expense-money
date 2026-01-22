"use server";

/**
 * 智慧收據審核 Agent
 * 核心審核邏輯：比對 OCR 結果與報帳資料
 */

import { prisma } from "@/lib/db/prisma";
import { recognizeInvoice } from "@/lib/services/ocr";
import { toDisplayUnit } from "@/lib/utils/money";
import type {
    AuditIssue,
    AuditResult,
    BatchAuditResult
} from "@/types/audit";

// 重新導出類型（供 Server Actions 使用）
export type {
    AuditIssueSeverity,
    AuditIssueType,
    AuditIssue,
    AuditResult,
    BatchAuditResult
} from "@/types/audit";

// ========== 設定容許誤差 ==========
const AMOUNT_TOLERANCE_PERCENT = 5; // 容許 5% 誤差
const AMOUNT_TOLERANCE_ABSOLUTE = 10; // 或 $10 絕對誤差

// ========== 核心審核函數 ==========

/**
 * 審核單一費用項目的收據
 */
export async function auditReceipt(
    expenseItem: {
        id: string;
        amount: number;      // 報帳金額（顯示單位）
        amountCents: number; // 報帳金額（儲存單位）
        date: Date;
        description: string;
        receiptUrl?: string | null;
    },
    receiptImage: string  // Base64 或 URL
): Promise<AuditResult> {
    const issues: AuditIssue[] = [];
    let matchScore = 100;

    // 1. 執行 OCR 辨識
    const ocrResult = await recognizeInvoice(receiptImage);

    if (!ocrResult.success || !ocrResult.data) {
        return {
            success: false,
            isValid: false,
            matchScore: 0,
            issues: [{
                type: "INVALID_FORMAT",
                severity: "error",
                message: ocrResult.error || "無法辨識收據內容",
            }],
            error: ocrResult.error,
        };
    }

    const extractedData = ocrResult.data;

    // 2. 檢查 OCR 信心度
    if (extractedData.confidence < 0.5) {
        issues.push({
            type: "LOW_CONFIDENCE",
            severity: "warning",
            message: `OCR 信心度較低 (${Math.round(extractedData.confidence * 100)}%)`,
        });
        matchScore -= 15;
    }

    // 3. 比對金額
    if (extractedData.totalAmount !== null) {
        const extractedAmount = toDisplayUnit(extractedData.totalAmount, "TWD");
        const reportedAmount = expenseItem.amount;
        const amountDiff = Math.abs(extractedAmount - reportedAmount);
        const percentDiff = (amountDiff / reportedAmount) * 100;

        if (amountDiff > AMOUNT_TOLERANCE_ABSOLUTE && percentDiff > AMOUNT_TOLERANCE_PERCENT) {
            issues.push({
                type: "AMOUNT_MISMATCH",
                severity: "error",
                message: `金額不符：收據 $${extractedAmount}，報帳 $${reportedAmount}`,
                expected: `$${reportedAmount}`,
                actual: `$${extractedAmount}`,
            });
            matchScore -= 40;
        } else if (amountDiff > 0) {
            // 有些差異但在容許範圍內
            matchScore -= 5;
        }
    } else {
        issues.push({
            type: "LOW_CONFIDENCE",
            severity: "warning",
            message: "無法從收據中擷取金額",
        });
        matchScore -= 20;
    }

    // 4. 比對日期（允許前後 7 天）
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
                    message: `日期差異較大：收據 ${formatDate(extractedDate)}，報帳 ${formatDate(itemDate)}`,
                    expected: formatDate(itemDate),
                    actual: formatDate(extractedDate),
                });
                matchScore -= 15;
            }
        }
    }

    // 5. 檢查重複發票
    if (extractedData.invoiceNumber) {
        const duplicate = await checkDuplicateInvoice(
            extractedData.invoiceNumber,
            expenseItem.id
        );
        if (duplicate) {
            issues.push({
                type: "DUPLICATE_INVOICE",
                severity: "error",
                message: `發票號碼 ${extractedData.invoiceNumber} 已被其他項目使用`,
            });
            matchScore -= 50;
        }
    }

    // 確保分數在 0-100 範圍內
    matchScore = Math.max(0, Math.min(100, matchScore));

    // 判斷是否有效：無 error 級別問題
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
 * 檢查重複發票
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
 * 儲存審核結果到資料庫
 */
export async function saveAuditResult(
    expenseItemId: string,
    result: AuditResult
): Promise<void> {
    const data = result.extractedData;
    // 將 issues 轉換為 JSON 相容格式
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
 * 批次審核報帳單
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
                error: "報帳單中沒有費用項目",
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

            // 儲存審核結果
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
        console.error("批次審核失敗:", error);
        return {
            success: false,
            totalItems: 0,
            auditedItems: 0,
            passedItems: 0,
            failedItems: 0,
            results: [],
            error: error instanceof Error ? error.message : "批次審核失敗",
        };
    }
}

// ========== 工具函數 ==========

/**
 * 解析 OCR 擷取的日期字串
 */
function parseExtractedDate(dateStr: string): Date | null {
    // 嘗試民國年格式
    const rocMatch = dateStr.match(/(\d{2,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (rocMatch) {
        const year = parseInt(rocMatch[1], 10) + 1911;
        const month = parseInt(rocMatch[2], 10) - 1;
        const day = parseInt(rocMatch[3], 10);
        return new Date(year, month, day);
    }

    // 嘗試標準日期格式
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * 格式化日期
 */
function formatDate(date: Date): string {
    return date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}
