// 分頁工具 - Cursor-based Pagination

export interface PaginationParams {
    cursor?: string;
    limit?: number;
    direction?: "forward" | "backward";
}

export interface PaginatedResult<T> {
    items: T[];
    nextCursor: string | null;
    prevCursor: string | null;
    hasMore: boolean;
    totalCount?: number;
}

// 預設分頁大小
export const DEFAULT_PAGE_SIZE = 20;

// 建立 Prisma 分頁參數
export function buildPaginationQuery(params: PaginationParams) {
    const limit = Math.min(params.limit || DEFAULT_PAGE_SIZE, 100);

    if (!params.cursor) {
        return {
            take: limit + 1, // 多取一筆判斷是否有更多
            orderBy: { createdAt: "desc" as const },
        };
    }

    return {
        take: (params.direction === "backward" ? -1 : 1) * (limit + 1),
        cursor: { id: params.cursor },
        skip: 1, // 跳過 cursor 本身
        orderBy: { createdAt: "desc" as const },
    };
}

// 處理分頁結果
export function processPaginatedResult<T extends { id: string }>(
    items: T[],
    limit: number
): PaginatedResult<T> {
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;

    return {
        items: resultItems,
        nextCursor: hasMore ? resultItems[resultItems.length - 1]?.id || null : null,
        prevCursor: resultItems.length > 0 ? resultItems[0]?.id || null : null,
        hasMore,
    };
}

// 建立日期範圍查詢
export function buildDateRangeFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) return {};

    return {
        createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
        },
    };
}

// 建立搜尋條件
export function buildSearchFilter(searchTerm?: string, fields: string[] = ["title"]) {
    if (!searchTerm || searchTerm.trim() === "") return {};

    return {
        OR: fields.map(field => ({
            [field]: {
                contains: searchTerm,
                mode: "insensitive" as const,
            },
        })),
    };
}
