"use server";

/**
 * OCR ?�票辨�??��?
 * 使用 Google Cloud Vision API ?��??�票資�?
 */

import vision from "@google-cloud/vision";
import { toStorageUnit } from "@/lib/utils/money";

// Google Vision Client（使?�環境�??�中?��??�帳?��??��?
function getVisionClient() {
    // 如�???GOOGLE_APPLICATION_CREDENTIALS_JSON ?��?變數，使?��?
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (credentials) {
        const parsedCredentials = JSON.parse(credentials);
        return new vision.ImageAnnotatorClient({
            credentials: parsedCredentials,
        });
    }

    // ?��?使用?�設??GOOGLE_APPLICATION_CREDENTIALS 檔�?路�?
    return new vision.ImageAnnotatorClient();
}

export interface InvoiceData {
    invoiceNumber: string | null;    // ?�票?�碼
    date: string | null;             // ?�票?��?
    totalAmount: number | null;      // 總�?額�??�數，�?小貨�?��位�?
    vendorName: string | null;       // ?�家?�稱
    items: InvoiceItem[];            // ?�細?�目
    rawText: string;                 // ?��? OCR ?��?
    confidence: number;              // 辨�?信�?�?0-1
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

/**
 * 從�???URL ??Base64 辨�??�票
 */
export async function recognizeInvoice(
    imageSource: string
): Promise<{ success: boolean; data?: InvoiceData; error?: string }> {
    try {
        const client = getVisionClient();

        let request;
        if (imageSource.startsWith("data:")) {
            // Base64 ?��?
            const base64Data = imageSource.split(",")[1];
            request = {
                image: { content: base64Data },
                features: [
                    { type: "TEXT_DETECTION" as const },
                    { type: "DOCUMENT_TEXT_DETECTION" as const },
                ],
            };
        } else if (imageSource.startsWith("http")) {
            // URL ?��?
            request = {
                image: { source: { imageUri: imageSource } },
                features: [
                    { type: "TEXT_DETECTION" as const },
                    { type: "DOCUMENT_TEXT_DETECTION" as const },
                ],
            };
        } else {
            return { success: false, error: "?��??��??��?�? };
        }

        const [result] = await client.annotateImage(request);
        const fullText = result.fullTextAnnotation?.text || "";

        if (!fullText) {
            return { success: false, error: "?��?從�??�中?��??��?" };
        }

        // �???�票?�容
        const invoiceData = parseInvoiceText(fullText);

        return {
            success: true,
            data: invoiceData,
        };
    } catch (error) {
        console.error("OCR 辨�?失�?:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "OCR ?��??�誤",
        };
    }
}

/**
 * �?? OCR ?��??��??�票資�?
 */
function parseInvoiceText(text: string): InvoiceData {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // ?�票?�碼�??（台??��一?�票?��?�? ?��?字�? + 8 ?��?�?
    const invoiceNumberRegex = /([A-Z]{2}[-]?\d{8})/i;
    const invoiceMatch = text.match(invoiceNumberRegex);

    // ?��?�??（支?��?種格式�?
    const datePatterns = [
        /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,      // 2024/01/15
        /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,      // 15/01/2024
        /(民�?\s*)?(\d{2,3})\s*年\s*(\d{1,2})\s*?�\s*(\d{1,2})\s*??, // 民�?112�???5??
    ];

    let dateStr: string | null = null;
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            dateStr = match[0];
            break;
        }
    }

    // ?��?�??（找?�大�??��?作為總�?額�?
    const amountRegex = /(?:總[計�??�]|?��?|Total|小�?|?��?|NT\$?)\s*[�?\s]*\$?\s*([\d,]+)/gi;
    const amounts: number[] = [];
    let match;
    while ((match = amountRegex.exec(text)) !== null) {
        const numStr = match[1].replace(/,/g, "");
        amounts.push(parseInt(numStr, 10));
    }

    // 也找?�獨?��?額數字�?作為?�選�?
    const numericRegex = /\$\s*([\d,]+)/g;
    while ((match = numericRegex.exec(text)) !== null) {
        const numStr = match[1].replace(/,/g, "");
        const num = parseInt(numStr, 10);
        if (num > 0) amounts.push(num);
    }

    const totalAmount = amounts.length > 0 ? Math.max(...amounts) : null;

    // ?�家?�稱（通常?��?幾�?�?
    let vendorName: string | null = null;
    for (const line of lines.slice(0, 5)) {
        // ?�除?��??�數字�??��?�?
        if (line.length > 3 && !/^\d/.test(line) && !/^\$/.test(line)) {
            vendorName = line;
            break;
        }
    }

    // 計�?信�?度�??�於?�到了�?少�??��?訊�?
    let confidence = 0;
    if (invoiceMatch) confidence += 0.3;
    if (dateStr) confidence += 0.2;
    if (totalAmount) confidence += 0.3;
    if (vendorName) confidence += 0.2;

    return {
        invoiceNumber: invoiceMatch ? invoiceMatch[1] : null,
        date: dateStr,
        totalAmount: totalAmount ? toStorageUnit(totalAmount, "TWD") : null,
        vendorName,
        items: [], // ?�細�??較�??��??��?續�?�?
        rawText: text,
        confidence,
    };
}

/**
 * 驗�??�票?�碼?��?
 */
function validateInvoiceNumber(number: string): boolean {
    // ?�灣統�??�票?��?�? ?��?字�? + 8 ?��?
    return /^[A-Z]{2}\d{8}$/i.test(number.replace(/-/g, ""));
}

