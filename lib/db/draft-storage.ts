"use client";

// 草稿儲存管理 - 使用 localStorage 防止資料遺失

const DRAFT_PREFIX = "expense_draft_";
const DRAFT_EXPIRY_HOURS = 24;

interface DraftData<T> {
    data: T;
    timestamp: number;
}

// 儲存草稿
export function saveDraft<T>(key: string, data: T): void {
    if (typeof window === "undefined") return;

    try {
        const draftData: DraftData<T> = {
            data,
            timestamp: Date.now(),
        };
        localStorage.setItem(DRAFT_PREFIX + key, JSON.stringify(draftData));
    } catch (error) {
        console.warn("無法儲存草稿:", error);
    }
}

// 讀取草稿
export function loadDraft<T>(key: string): T | null {
    if (typeof window === "undefined") return null;

    try {
        const stored = localStorage.getItem(DRAFT_PREFIX + key);
        if (!stored) return null;

        const draftData: DraftData<T> = JSON.parse(stored);

        // 檢查是否過期
        const expiryTime = DRAFT_EXPIRY_HOURS * 60 * 60 * 1000;
        if (Date.now() - draftData.timestamp > expiryTime) {
            removeDraft(key);
            return null;
        }

        return draftData.data;
    } catch (error) {
        console.warn("無法讀取草稿:", error);
        return null;
    }
}

// 刪除草稿
export function removeDraft(key: string): void {
    if (typeof window === "undefined") return;

    try {
        localStorage.removeItem(DRAFT_PREFIX + key);
    } catch (error) {
        console.warn("無法刪除草稿:", error);
    }
}

// 取得所有草稿 key
export function getAllDraftKeys(): string[] {
    if (typeof window === "undefined") return [];

    try {
        const keys: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith(DRAFT_PREFIX)) {
                keys.push(key.replace(DRAFT_PREFIX, ""));
            }
        }
        return keys;
    } catch (error) {
        console.warn("無法取得草稿列表:", error);
        return [];
    }
}

// 清除所有過期草稿
export function clearExpiredDrafts(): void {
    if (typeof window === "undefined") return;

    try {
        const expiryTime = DRAFT_EXPIRY_HOURS * 60 * 60 * 1000;
        const now = Date.now();

        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key?.startsWith(DRAFT_PREFIX)) {
                const stored = localStorage.getItem(key);
                if (stored) {
                    const draftData = JSON.parse(stored);
                    if (now - draftData.timestamp > expiryTime) {
                        localStorage.removeItem(key);
                    }
                }
            }
        }
    } catch (error) {
        console.warn("無法清除過期草稿:", error);
    }
}
