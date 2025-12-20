"use client";

import { useState, useCallback, useRef } from "react";

// 簡易 SWR-like 快取 Hook
interface UseCacheOptions<T> {
    key: string;
    fetcher: () => Promise<T>;
    ttl?: number; // Time to live in milliseconds
    revalidateOnFocus?: boolean;
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

export function useCache<T>({
    key,
    fetcher,
    ttl = 60000, // 預設 1 分鐘
    revalidateOnFocus = true,
}: UseCacheOptions<T>) {
    const [data, setData] = useState<T | null>(() => {
        const cached = cache.get(key);
        if (cached && Date.now() - cached.timestamp < ttl) {
            return cached.data;
        }
        return null;
    });
    const [isLoading, setIsLoading] = useState(!data);
    const [error, setError] = useState<Error | null>(null);
    const fetchingRef = useRef(false);

    const mutate = useCallback(async (newData?: T | ((prev: T | null) => T)) => {
        if (newData !== undefined) {
            const resolved = typeof newData === "function"
                ? (newData as (prev: T | null) => T)(data)
                : newData;
            setData(resolved);
            cache.set(key, { data: resolved, timestamp: Date.now() });
            return resolved;
        }

        // Revalidate from server
        if (fetchingRef.current) return;
        fetchingRef.current = true;

        try {
            setIsLoading(true);
            const result = await fetcher();
            setData(result);
            cache.set(key, { data: result, timestamp: Date.now() });
            setError(null);
            return result;
        } catch (e) {
            setError(e as Error);
            throw e;
        } finally {
            setIsLoading(false);
            fetchingRef.current = false;
        }
    }, [key, fetcher, data]);

    // 初次載入
    const refresh = useCallback(() => {
        if (!data && !fetchingRef.current) {
            mutate();
        }
    }, [data, mutate]);

    // Focus revalidation
    if (typeof window !== "undefined" && revalidateOnFocus) {
        // 使用 visibilitychange 事件來實現
    }

    return {
        data,
        isLoading,
        error,
        mutate,
        refresh,
    };
}

// 清除特定快取
export function invalidateCache(key: string) {
    cache.delete(key);
}

// 清除所有快取
export function clearCache() {
    cache.clear();
}

// 帶前綴的快取 key 清除
export function invalidateCacheByPrefix(prefix: string) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}

// 無限滾動 Hook
interface UseInfiniteScrollOptions<T> {
    fetcher: (cursor?: string) => Promise<{
        items: T[];
        nextCursor: string | null;
        hasMore: boolean;
    }>;
}

export function useInfiniteScroll<T>({ fetcher }: UseInfiniteScrollOptions<T>) {
    const [items, setItems] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const cursorRef = useRef<string | null>(null);

    const loadInitial = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await fetcher();
            setItems(result.items);
            cursorRef.current = result.nextCursor;
            setHasMore(result.hasMore);
        } catch (e) {
            setError(e as Error);
        } finally {
            setIsLoading(false);
        }
    }, [fetcher]);

    const loadMore = useCallback(async () => {
        if (isLoadingMore || !hasMore || !cursorRef.current) return;

        setIsLoadingMore(true);
        try {
            const result = await fetcher(cursorRef.current);
            setItems(prev => [...prev, ...result.items]);
            cursorRef.current = result.nextCursor;
            setHasMore(result.hasMore);
        } catch (e) {
            setError(e as Error);
        } finally {
            setIsLoadingMore(false);
        }
    }, [fetcher, hasMore, isLoadingMore]);

    const reset = useCallback(() => {
        setItems([]);
        cursorRef.current = null;
        setHasMore(true);
        loadInitial();
    }, [loadInitial]);

    return {
        items,
        isLoading,
        isLoadingMore,
        error,
        hasMore,
        loadInitial,
        loadMore,
        reset,
    };
}
