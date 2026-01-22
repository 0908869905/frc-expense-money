"use server";

/**
 * 智慧收據審核 Agent
 * 核心審核邏輯：比對 OCR 結果與報帳項目
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { recognizeInvoice } from "@/lib/agents/ocr";
import { toDisplayUnit } from "@/lib/money";
import type { AuditIssue, AuditResult, BatchAuditResult } from "@/types/audit";

export type {
    AuditIssueSeverity,
    AuditIssueType,
    AuditIssue,
    AuditResult,
    BatchAuditResult,
} from "@/types/audit";

const AMOUNT_TOLERANCE_PERCENT = 5;
const AMOUNT_TOLERANCE_ABSOLUTE = 10;
const DATE_TOLERANCE_DAYS = 7;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function normalizeInvoiceNumber(num: string): string {
    return num.replace(/-/g, "").toUpperCase();
}

function clampScore(score: number): number {
    return Math.max(0, Math.min(100, score));
}

function getDaysDiff(date1: Date, date2: Date): number {
    return Math.abs(Math.floor((date1.getTime() - date2.getTime()) / MS_PER_DAY));
}

interface ExpenseItemInput {
    id: string;
    amount: number;
    amountCents: number;
    date: Date;
    description: string;
    receiptUrl?: string | null;
}

export async function auditReceipt(
    expenseItem: ExpenseItemInput,
    receiptImage: string
): Promise<AuditResult> {
    const ocrResult = await recognizeInvoice(receiptImage);

    if (!ocrResult.success) {
        return {
            success: false,
            isValid: false,
            matchScore: 0,
            issues: [{
                type: "INVALID_FORMAT",
                severity: "error",
                message: ocrResult.error ?? "無法辨識收據內容",
            }],
            error: ocrResult.error,
        };
    }

    const extractedData = ocrResult.data;
    const issues: AuditIssue[] = [];
    let matchScore = 100;

    // 檢查 OCR 信心度
    if (extractedData.confidence < 0.5) {
        issues.push({
            type: "LOW_CONFIDENCE",
            severity: "warning",
            message: `OCR 信心度偏低 (${Math.round(extractedData.confidence * 100)}%)`,
        });
        matchScore -= 15;
    }

    // 比對金額
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

    // 比對日期
    if (extractedData.date) {
        const extractedDate = parseExtractedDate(extractedData.date);
        if (extractedDate) {
            const itemDate = new Date(expenseItem.date);
            const daysDiff = getDaysDiff(extractedDate, itemDate);

            if (daysDiff > DATE_TOLERANCE_DAYS) {
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

    // 檢查重複發票
    if (extractedData.invoiceNumber) {
        const isDuplicate = await checkDuplicateInvoice(extractedData.invoiceNumber, expenseItem.id);
        if (isDuplicate) {
            issues.push({
                type: "DUPLICATE_INVOICE",
                severity: "error",
                message: `發票號碼 ${extractedData.invoiceNumber} 已被其他項目使用`,
            });
            matchScore -= 50;
        }
    }

    const hasErrors = issues.some((i) => i.severity === "error");

    return {
        success: true,
        isValid: !hasErrors,
        matchScore: clampScore(matchScore),
        issues,
        extractedData,
    };
}

async function checkDuplicateInvoice(invoiceNumber: string, excludeItemId: string): Promise<boolean> {
    const existing = await prisma.receiptAudit.findFirst({
        where: {
            invoiceNumber: normalizeInvoiceNumber(invoiceNumber),
            expenseItemId: { not: excludeItemId },
        },
    });
    return existing !== null;
}

export async function saveAuditResult(expenseItemId: string, result: AuditResult): Promise<void> {
    const data = result.extractedData;
    const issuesJson = result.issues.length > 0
        ? (result.issues as unknown as Prisma.InputJsonValue)
        : Prisma.JsonNull;

    const auditData = {
        extractedAmount: data?.totalAmount ?? null,
        extractedDate: data?.date ? parseExtractedDate(data.date) : null,
        extractedVendor: data?.vendorName ?? null,
        invoiceNumber: data?.invoiceNumber ? normalizeInvoiceNumber(data.invoiceNumber) : null,
        rawText: data?.rawText ?? null,
        isValid: result.isValid,
        matchScore: result.matchScore,
        issues: issuesJson,
        confidence: data?.confidence ?? 0,
    };

    await prisma.receiptAudit.upsert({
        where: { expenseItemId },
        create: { expenseItemId, ...auditData },
        update: auditData,
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
                            message: "此項目缺少收據圖片",
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

function parseExtractedDate(dateStr: string): Date | null {
    const rocMatch = dateStr.match(/(\d{2,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (rocMatch) {
        return new Date(
            parseInt(rocMatch[1], 10) + 1911,
            parseInt(rocMatch[2], 10) - 1,
            parseInt(rocMatch[3], 10)
        );
    }

    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

function formatDate(date: Date): string {
    return date.toLocaleDateString("zh-TW", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
}
