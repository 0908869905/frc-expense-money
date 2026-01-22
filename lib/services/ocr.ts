"use server";

/**
 * OCR 發票辨識服務
 * 使用 Google Cloud Vision API 擷取發票資訊
 */

import vision from "@google-cloud/vision";
import { toStorageUnit } from "@/lib/utils/money";

// Google Vision Client（使用環境變數中的服務帳號金鑰）
function getVisionClient() {
    // 如果有 GOOGLE_APPLICATION_CREDENTIALS_JSON 環境變數，使用它
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

    if (credentials) {
        const parsedCredentials = JSON.parse(credentials);
        return new vision.ImageAnnotatorClient({
            credentials: parsedCredentials,
        });
    }

    // 否則使用預設的 GOOGLE_APPLICATION_CREDENTIALS 檔案路徑
    return new vision.ImageAnnotatorClient();
}

export interface InvoiceData {
    invoiceNumber: string | null;    // 發票號碼
    date: string | null;             // 發票日期
    totalAmount: number | null;      // 總金額（整數，最小貨幣單位）
    vendorName: string | null;       // 商家名稱
    items: InvoiceItem[];            // 明細項目
    rawText: string;                 // 原始 OCR 文字
    confidence: number;              // 辨識信心度 0-1
}

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

/**
 * 從圖片 URL 或 Base64 辨識發票
 */
export async function recognizeInvoice(
    imageSource: string
): Promise<{ success: boolean; data?: InvoiceData; error?: string }> {
    try {
        const client = getVisionClient();

        let request;
        if (imageSource.startsWith("data:")) {
            // Base64 格式
            const base64Data = imageSource.split(",")[1];
            request = {
                image: { content: base64Data },
                features: [
                    { type: "TEXT_DETECTION" as const },
                    { type: "DOCUMENT_TEXT_DETECTION" as const },
                ],
            };
        } else if (imageSource.startsWith("http")) {
            // URL 格式
            request = {
                image: { source: { imageUri: imageSource } },
                features: [
                    { type: "TEXT_DETECTION" as const },
                    { type: "DOCUMENT_TEXT_DETECTION" as const },
                ],
            };
        } else {
            return { success: false, error: "無效的圖片格式" };
        }

        const [result] = await client.annotateImage(request);
        const fullText = result.fullTextAnnotation?.text || "";

        if (!fullText) {
            return { success: false, error: "無法從圖片中擷取文字" };
        }

        // 解析發票內容
        const invoiceData = parseInvoiceText(fullText);

        return {
            success: true,
            data: invoiceData,
        };
    } catch (error) {
        console.error("OCR 辨識失敗:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "OCR 處理錯誤",
        };
    }
}

/**
 * 解析 OCR 文字擷取發票資訊
 */
function parseInvoiceText(text: string): InvoiceData {
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

    // 發票號碼解析（台灣統一發票格式：兩個字母 + 8 個數字）
    const invoiceNumberRegex = /([A-Z]{2}[-]?\d{8})/i;
    const invoiceMatch = text.match(invoiceNumberRegex);

    // 日期解析（支援多種格式）
    const datePatterns = [
        /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/,      // 2024/01/15
        /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/,      // 15/01/2024
        /(民國\s*)?(\d{2,3})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/, // 民國112年1月5日
    ];

    let dateStr: string | null = null;
    for (const pattern of datePatterns) {
        const match = text.match(pattern);
        if (match) {
            dateStr = match[0];
            break;
        }
    }

    // 金額解析（找最大數字作為總金額）
    const amountRegex = /(?:總[計價額]|合計|Total|小計|金額|NT\$?)\s*[：:\s]*\$?\s*([\d,]+)/gi;
    const amounts: number[] = [];
    let match;
    while ((match = amountRegex.exec(text)) !== null) {
        const numStr = match[1].replace(/,/g, "");
        amounts.push(parseInt(numStr, 10));
    }

    // 也找獨立金額數字（作為備選）
    const numericRegex = /\$\s*([\d,]+)/g;
    while ((match = numericRegex.exec(text)) !== null) {
        const numStr = match[1].replace(/,/g, "");
        const num = parseInt(numStr, 10);
        if (num > 0) amounts.push(num);
    }

    const totalAmount = amounts.length > 0 ? Math.max(...amounts) : null;

    // 商家名稱（通常在前幾行）
    let vendorName: string | null = null;
    for (const line of lines.slice(0, 5)) {
        // 排除日期、數字、金額行
        if (line.length > 3 && !/^\d/.test(line) && !/^\$/.test(line)) {
            vendorName = line;
            break;
        }
    }

    // 計算信心度（基於找到了多少關鍵資訊）
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
        items: [], // 明細解析較複雜，後續擴充
        rawText: text,
        confidence,
    };
}

/**
 * 驗證發票號碼格式
 */
function validateInvoiceNumber(number: string): boolean {
    // 台灣統一發票格式：兩個字母 + 8 個數字
    return /^[A-Z]{2}\d{8}$/i.test(number.replace(/-/g, ""));
}
