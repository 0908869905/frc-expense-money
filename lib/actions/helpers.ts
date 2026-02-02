import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// --- 共用類型定義 ---

export interface ActionState {
    success: boolean;
    message: string | null;
    errors?: Record<string, string[]>;
}

export interface AuthContext {
    userId: string;
    userEmail: string;
    userName: string;
    userRole: string;
}

// --- 認證輔助函式 ---

/**
 * 取得已認證使用者的 ID，若未登入則回傳 null
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id || null;
}

/**
 * 要求使用者已登入，否則拋出錯誤
 */
export async function requireAuth(): Promise<AuthContext> {
    const session = await auth();

    if (!session?.user?.id) {
        throw new Error("Unauthorized");
    }

    return {
        userId: session.user.id,
        userEmail: session.user.email || "",
        userName: session.user.name || session.user.email || "Unknown",
        userRole: session.user.role || "USER",
    };
}

/**
 * 要求使用者具有管理員權限
 */
export async function requireAdmin(): Promise<AuthContext> {
    const ctx = await requireAuth();

    if (ctx.userRole !== "ADMIN") {
        throw new Error("Unauthorized: Admin access required");
    }

    return ctx;
}

/**
 * 要求使用者具有財務權限（FINANCE 或 ADMIN）
 */
export async function requireFinanceAccess(): Promise<AuthContext> {
    const ctx = await requireAuth();

    if (!FINANCE_ROLES.includes(ctx.userRole as typeof FINANCE_ROLES[number])) {
        throw new Error("Unauthorized: Finance access required");
    }

    return ctx;
}

const FINANCE_ROLES = ["FINANCE", "ADMIN"] as const;

export const INVENTORY_WRITE_ROLES = ["VICE_LEADER", "LEADER", "FINANCE", "ADMIN"] as const;

/**
 * 要求使用者具有庫存寫入權限
 */
export async function requireInventoryWrite(): Promise<AuthContext> {
    const ctx = await requireAuth();

    if (!INVENTORY_WRITE_ROLES.includes(ctx.userRole as typeof INVENTORY_WRITE_ROLES[number])) {
        throw new Error("InsufficientPermission");
    }

    return ctx;
}

/**
 * 檢查使用者是否具有財務權限（不拋錯，回傳 boolean）
 */
export async function hasFinanceAccess(): Promise<boolean> {
    const session = await auth();
    if (!session?.user?.id) return false;
    return FINANCE_ROLES.includes(session.user.role as typeof FINANCE_ROLES[number]);
}

// --- Revalidation 輔助函式 ---

export function revalidateDashboard(): void {
    revalidatePath("/dashboard");
}

export function revalidateExpenses(): void {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");
}

export function revalidateApprovals(): void {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/approvals");
}

export function revalidateFunding(): void {
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");
}

export function revalidateInventory(): void {
    revalidatePath("/dashboard/inventory");
}

export function revalidateUsers(): void {
    revalidatePath("/dashboard/users");
}

// --- 錯誤處理輔助 ---

/**
 * 建立未授權的 ActionState
 */
export function unauthorizedState(message = "未授權的操作"): ActionState {
    return { success: false, message };
}

/**
 * 建立成功的 ActionState
 */
export function successState(message: string): ActionState {
    return { success: true, message };
}

/**
 * 建立失敗的 ActionState
 */
export function errorState(message: string, errors?: Record<string, string[]>): ActionState {
    return { success: false, message, errors };
}
