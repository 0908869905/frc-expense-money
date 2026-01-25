"use client";

/**
 * 草稿儲存管理 - 使用 localStorage 防止資料遺失
 */

const DRAFT_PREFIX = "expense_draft_";
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 小時

interface DraftData<T> {
    data: T;
    timestamp: number;
}

function isClient(): boolean {
    return typeof window !== "undefined";
}

function getFullKey(key: string): string {
    return DRAFT_PREFIX + key;
}

export function saveDraft<T>(key: string, data: T): void {
    if (!isClient()) return;

    try {
        const draftData: DraftData<T> = { data, timestamp: Date.now() };
        localStorage.setItem(getFullKey(key), JSON.stringify(draftData));
    } catch (error) {
        console.warn("無法儲存草稿:", error);
    }
}

export function loadDraft<T>(key: string): T | null {
    if (!isClient()) return null;

    try {
        const stored = localStorage.getItem(getFullKey(key));
        if (!stored) return null;

        const draftData: DraftData<T> = JSON.parse(stored);
        const isExpired = Date.now() - draftData.timestamp > DRAFT_EXPIRY_MS;

        if (isExpired) {
            removeDraft(key);
            return null;
        }

        return draftData.data;
    } catch (error) {
        console.warn("無法讀取草稿:", error);
        return null;
    }
}

export function removeDraft(key: string): void {
    if (!isClient()) return;

    try {
        localStorage.removeItem(getFullKey(key));
    } catch (error) {
        console.warn("無法刪除草稿:", error);
    }
}
