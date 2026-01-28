import { Role } from "@prisma/client";

/**
 * 遮罩帳號：只顯示前 4 碼和後 4 碼
 */
export function maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 8) {
        return "****" + accountNumber.slice(-4);
    }
    return accountNumber.slice(0, 4) + "****" + accountNumber.slice(-4);
}

/**
 * 檢查是否可以查看完整帳號
 * - 自己的帳戶 → 完整
 * - FINANCE 或 ADMIN → 完整
 * - 其他 → 遮罩
 */
export function canViewFullAccount(
    viewerRole: Role,
    viewerId: string,
    ownerId: string
): boolean {
    if (viewerId === ownerId) return true;
    if (viewerRole === "FINANCE" || viewerRole === "ADMIN") return true;
    return false;
}
