/**
 * 收據審核相關類型定義
 * 此檔案不含 "use server"，可被客戶端元件安全 import
 */

import type { InvoiceData } from "@/lib/agents/ocr";

export type AuditIssueSeverity = "error" | "warning" | "info";

export type AuditIssueType =
    | "AMOUNT_MISMATCH"      // 金額不符
    | "DATE_MISMATCH"        // 日期不符
    | "DUPLICATE_INVOICE"    // 重複發票
    | "LOW_CONFIDENCE"       // OCR 信心度低
    | "MISSING_RECEIPT"      // 缺少收據
    | "INVALID_FORMAT";      // 無效格式

export interface AuditIssue {
    type: AuditIssueType;
    severity: AuditIssueSeverity;
    message: string;
    expected?: string;
    actual?: string;
}

export interface AuditResult {
    success: boolean;
    isValid: boolean;           // 審核是否通過（無 error 級問題）
    matchScore: number;         // 匹配分數 0-100
    issues: AuditIssue[];       // 發現的問題
    extractedData?: InvoiceData; // OCR 擷取的資料
    error?: string;
}

export interface BatchAuditResult {
    success: boolean;
    totalItems: number;
    auditedItems: number;
    passedItems: number;
    failedItems: number;
    results: Array<{
        itemId: string;
        description: string;
        result: AuditResult;
    }>;
    error?: string;
}
