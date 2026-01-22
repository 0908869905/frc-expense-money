/**
 * 分頁工具 - Cursor-based Pagination
 */

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

export const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

interface PaginationQuery {
    take: number;
    orderBy: { createdAt: "desc" };
    cursor?: { id: string };
    skip?: number;
}

export function buildPaginationQuery(params: PaginationParams): PaginationQuery {
    const limit = Math.min(params.limit ?? DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
    const take = limit + 1;

    if (!params.cursor) {
        return { take, orderBy: { createdAt: "desc" } };
    }

    const direction = params.direction === "backward" ? -1 : 1;
    return {
        take: direction * take,
        cursor: { id: params.cursor },
        skip: 1,
        orderBy: { createdAt: "desc" },
    };
}

export function processPaginatedResult<T extends { id: string }>(
    items: T[],
    limit: number
): PaginatedResult<T> {
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;

    return {
        items: resultItems,
        nextCursor: hasMore ? resultItems.at(-1)?.id ?? null : null,
        prevCursor: resultItems[0]?.id ?? null,
        hasMore,
    };
}

export function buildDateRangeFilter(
    startDate?: Date,
    endDate?: Date
): { createdAt?: { gte?: Date; lte?: Date } } {
    if (!startDate && !endDate) return {};

    return {
        createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
        },
    };
}

export function buildSearchFilter(
    searchTerm?: string,
    fields: string[] = ["title"]
): { OR?: Array<Record<string, { contains: string; mode: "insensitive" }>> } {
    const trimmed = searchTerm?.trim();
    if (!trimmed) return {};

    return {
        OR: fields.map((field) => ({
            [field]: { contains: trimmed, mode: "insensitive" as const },
        })),
    };
}
