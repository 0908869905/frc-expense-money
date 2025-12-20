"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { saveDraft, loadDraft, removeDraft } from "@/lib/draft-storage";

interface UseAutoSaveOptions {
    key: string;
    debounceMs?: number;
    onRestore?: (data: any) => void;
}

// 自動儲存 Hook
export function useAutoSave<T>({ key, debounceMs = 1000, onRestore }: UseAutoSaveOptions) {
    const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
    const [showRestorePrompt, setShowRestorePrompt] = useState(false);
    const [savedDraft, setSavedDraft] = useState<T | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 檢查是否有已儲存的草稿
    useEffect(() => {
        const draft = loadDraft<T>(key);
        if (draft) {
            setSavedDraft(draft);
            setShowRestorePrompt(true);
        }
    }, [key]);

    // 儲存資料 (debounced)
    const save = useCallback((data: T) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = setTimeout(() => {
            saveDraft(key, data);
        }, debounceMs);
    }, [key, debounceMs]);

    // 立即儲存
    const saveNow = useCallback((data: T) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        saveDraft(key, data);
    }, [key]);

    // 清除草稿
    const clear = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        removeDraft(key);
        setSavedDraft(null);
        setShowRestorePrompt(false);
    }, [key]);

    // 恢復草稿
    const restore = useCallback(() => {
        if (savedDraft && onRestore) {
            onRestore(savedDraft);
            setHasRestoredDraft(true);
        }
        setShowRestorePrompt(false);
    }, [savedDraft, onRestore]);

    // 忽略草稿
    const dismiss = useCallback(() => {
        setShowRestorePrompt(false);
        clear();
    }, [clear]);

    // 清理
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        save,
        saveNow,
        clear,
        restore,
        dismiss,
        hasRestoredDraft,
        showRestorePrompt,
        savedDraft,
    };
}

// 網路狀態 Hook
export function useOnlineStatus() {
    const [isOnline, setIsOnline] = useState(
        typeof window !== "undefined" ? navigator.onLine : true
    );

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return isOnline;
}

// 重試機制 Hook
export function useRetry() {
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 2000; // 2 秒

    const executeWithRetry = useCallback(async <T>(
        fn: () => Promise<T>,
        options?: { maxRetries?: number; delay?: number }
    ): Promise<T> => {
        const maxRetries = options?.maxRetries ?? MAX_RETRIES;
        const delay = options?.delay ?? RETRY_DELAY;

        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                setRetryCount(attempt);
                setIsRetrying(attempt > 0);

                const result = await fn();
                setRetryCount(0);
                setIsRetrying(false);
                return result;
            } catch (error) {
                lastError = error as Error;

                if (attempt < maxRetries) {
                    // 等待後重試
                    await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
                }
            }
        }

        setRetryCount(0);
        setIsRetrying(false);
        throw lastError;
    }, []);

    return {
        executeWithRetry,
        retryCount,
        isRetrying,
    };
}
