"use server";

import { auth } from "@/auth";
import { recognizeInvoice, InvoiceData } from "@/lib/ocr";
import { revalidatePath } from "next/cache";

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

    if (!imageUrl.startsWith("http")) {
        return { success: false, error: "無效的圖片 URL" };
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
