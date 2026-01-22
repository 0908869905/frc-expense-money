"use server";

/**
 * OCR 發票辨識服務
 * 使用 Google Cloud Vision API 提取發票資訊
 */

import vision from "@google-cloud/vision";
import { toStorageUnit } from "@/lib/money";

const INTERNAL_IP_PATTERNS = [
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./,
    /^0\./,
];

const INTERNAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function isInternalIp(hostname: string): boolean {
    const lower = hostname.toLowerCase();
    return INTERNAL_HOSTS.has(lower) || INTERNAL_IP_PATTERNS.some((p) => p.test(hostname));
}

function isUrlSafe(urlString: string): { safe: boolean; error?: string } {
    try {
        const url = new URL(urlString);

        if (url.protocol !== "https:") {
            return { safe: false, error: "只允許 HTTPS URL" };
        }

        if (isInternalIp(url.hostname)) {
            return { safe: false, error: "不允許內部網路 URL" };
        }

        return { safe: true };
    } catch {
        return { safe: false, error: "無效的 URL 格式" };
    }
}

function getVisionClient() {
    const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (credentialsJson) {
        return new vision.ImageAnnotatorClient({
            credentials: JSON.parse(credentialsJson),
        });
    }

    return new vision.ImageAnnotatorClient();
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface InvoiceData {
    invoiceNumber: string | null;
    date: string | null;
    totalAmount: number | null;
    vendorName: string | null;
    items: InvoiceItem[];
    rawText: string;
    confidence: number;
}

type OcrResult = { success: true; data: InvoiceData } | { success: false; error: string };

const OCR_FEATURES = [
    { type: "TEXT_DETECTION" as const },
    { type: "DOCUMENT_TEXT_DETECTION" as const },
];

function buildImageRequest(imageSource: string): { request: object } | { error: string } {
    if (imageSource.startsWith("data:")) {
        const base64Data = imageSource.split(",")[1];
        return { request: { image: { content: base64Data }, features: OCR_FEATURES } };
    }

    if (imageSource.startsWith("http")) {
        const urlCheck = isUrlSafe(imageSource);
        if (!urlCheck.safe) {
            return { error: urlCheck.error ?? "URL 不被允許" };
        }
        return { request: { image: { source: { imageUri: imageSource } }, features: OCR_FEATURES } };
    }

    return { error: "無效的圖片來源" };
}

export async function recognizeInvoice(imageSource: string): Promise<OcrResult> {
    try {
        const buildResult = buildImageRequest(imageSource);
        if ("error" in buildResult) {
            return { success: false, error: buildResult.error };
        }

        const client = getVisionClient();
        const [result] = await client.annotateImage(buildResult.request);
        const fullText = result.fullTextAnnotation?.text ?? "";

        if (!fullText) {
            return { success: false, error: "無法從圖片中提取文字" };
        }

        return { success: true, data: parseInvoiceText(fullText) };
    } catch (error) {
        console.error("OCR 辨識失敗:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "OCR 服務錯誤",
        };
    }
}

const INVOICE_NUMBER_REGEX = /([A-Z]{2}[-]?\d{8})/i;

const DATE_PATTERNS = [
    /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,
    /(民國\s*)?(\d{2,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/,
];

const AMOUNT_REGEX = /(?:總[計額金]|合計|Total|小計|應付|NT\$?)\s*[：:\s]*\$?\s*([\d,]+)/gi;
const CURRENCY_REGEX = /\$\s*([\d,]+)/g;

function extractDate(text: string): string | null {
    for (const pattern of DATE_PATTERNS) {
        const match = text.match(pattern);
        if (match) return match[0];
    }
    return null;
}

function extractAmounts(text: string): number[] {
    const amounts: number[] = [];

    let match;
    while ((match = AMOUNT_REGEX.exec(text)) !== null) {
        amounts.push(parseInt(match[1].replace(/,/g, ""), 10));
    }

    while ((match = CURRENCY_REGEX.exec(text)) !== null) {
        const num = parseInt(match[1].replace(/,/g, ""), 10);
        if (num > 0) amounts.push(num);
    }

    return amounts;
}

function extractVendorName(lines: string[]): string | null {
    for (const line of lines.slice(0, 5)) {
        if (line.length > 3 && !/^[\d$]/.test(line)) {
            return line;
        }
    }
    return null;
}

function parseInvoiceText(text: string): InvoiceData {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    const invoiceMatch = text.match(INVOICE_NUMBER_REGEX);
    const dateStr = extractDate(text);
    const amounts = extractAmounts(text);
    const totalAmount = amounts.length > 0 ? Math.max(...amounts) : null;
    const vendorName = extractVendorName(lines);

    let confidence = 0;
    if (invoiceMatch) confidence += 0.3;
    if (dateStr) confidence += 0.2;
    if (totalAmount) confidence += 0.3;
    if (vendorName) confidence += 0.2;

    return {
        invoiceNumber: invoiceMatch?.[1] ?? null,
        date: dateStr,
        totalAmount: totalAmount !== null ? toStorageUnit(totalAmount, "TWD") : null,
        vendorName,
        items: [],
        rawText: text,
        confidence,
    };
}
