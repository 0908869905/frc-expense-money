// ?†é?å·¥å…· - Cursor-based Pagination

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

// ?è¨­?†é?å¤§å?
export const DEFAULT_PAGE_SIZE = 20;

// å»ºç? Prisma ?†é??ƒæ•¸
export function buildPaginationQuery(params: PaginationParams) {
    const limit = Math.min(params.limit || DEFAULT_PAGE_SIZE, 100);

    if (!params.cursor) {
        return {
            take: limit + 1, // å¤šå?ä¸€ç­†åˆ¤?·æ˜¯?¦é??‰æ›´å¤?
            orderBy: { createdAt: "desc" as const },
        };
    }

    return {
        take: (params.direction === "backward" ? -1 : 1) * (limit + 1),
        cursor: { id: params.cursor },
        skip: 1, // è·³é? cursor ?¬èº«
        orderBy: { createdAt: "desc" as const },
    };
}

// ?•ç??†é?çµæ?
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

// ?¼å??–æ—¥?Ÿç??æŸ¥è©?
export function buildDateRangeFilter(startDate?: Date, endDate?: Date) {
    if (!startDate && !endDate) return {};

    return {
        createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
        },
    };
}

// å»ºç??œå?æ¢ä»¶
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

