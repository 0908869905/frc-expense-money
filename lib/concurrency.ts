"use server";

/**
 * 並發安全工具函數
 * 
 * 用於處理競爭條件敏感的操作（如餘額扣減）
 * 採用資料庫層級的原子操作和悲觀鎖
 */

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * 原子性預算扣減
 * 直接在資料庫層執行扣減，避免 Check-Then-Act 競爭條件
 * 
 * @param budgetId 預算 ID
 * @param amount 扣減金額（整數，最小貨幣單位）
 * @returns 成功返回新的 spent 值，失敗返回 null
 */
export async function atomicBudgetDeduction(
    budgetId: string,
    amount: number
): Promise<{ success: boolean; newSpent?: number; message?: string }> {
    try {
        // 使用原子操作：只有 spent + amount <= amount 時才更新
        const result = await prisma.$executeRaw`
      UPDATE "Budget"
      SET "spent" = "spent" + ${amount},
          "updatedAt" = NOW()
      WHERE "id" = ${budgetId}
        AND ("spent" + ${amount}) <= "amount"
    `;

        if (result === 0) {
            // 沒有更新任何行，可能是預算不足或 ID 不存在
            const budget = await prisma.budget.findUnique({
                where: { id: budgetId },
                select: { amount: true, spent: true },
            });

            if (!budget) {
                return { success: false, message: "預算不存在" };
            }

            const remaining = budget.amount - budget.spent;
            return {
                success: false,
                message: `預算餘額不足（剩餘: ${remaining}）`
            };
        }

        // 取得更新後的值
        const updated = await prisma.budget.findUnique({
            where: { id: budgetId },
            select: { spent: true },
        });

        return { success: true, newSpent: updated?.spent };
    } catch (error) {
        console.error("原子預算扣減失敗:", error);
        return { success: false, message: "系統錯誤" };
    }
}

/**
 * 使用悲觀鎖執行關鍵操作
 * 適用於需要 Read-Modify-Write 的複雜操作
 * 
 * @param budgetId 預算 ID
 * @param operation 要執行的操作函數
 */
export async function withBudgetLock<T>(
    budgetId: string,
    operation: (budget: { id: string; amount: number; spent: number }) => Promise<T>
): Promise<T> {
    return prisma.$transaction(async (tx) => {
        // SELECT ... FOR UPDATE 鎖定該筆資料
        const [budget] = await tx.$queryRaw<Array<{
            id: string;
            amount: number;
            spent: number;
        }>>`
      SELECT "id", "amount", "spent" 
      FROM "Budget" 
      WHERE "id" = ${budgetId} 
      FOR UPDATE
    `;

        if (!budget) {
            throw new Error("預算不存在");
        }

        // 執行用戶操作
        return operation(budget);
    }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        maxWait: 5000,
        timeout: 10000,
    });
}

/**
 * 安全的庫存扣減
 * 使用原子操作防止超賣
 */
export async function atomicInventoryDeduction(
    itemId: string,
    quantity: number
): Promise<{ success: boolean; newQuantity?: number; message?: string }> {
    try {
        const result = await prisma.$executeRaw`
      UPDATE "InventoryItem"
      SET "currentQuantity" = "currentQuantity" - ${quantity},
          "updatedAt" = NOW()
      WHERE "id" = ${itemId}
        AND "currentQuantity" >= ${quantity}
    `;

        if (result === 0) {
            const item = await prisma.inventoryItem.findUnique({
                where: { id: itemId },
                select: { currentQuantity: true },
            });

            if (!item) {
                return { success: false, message: "物品不存在" };
            }

            return {
                success: false,
                message: `庫存不足（現有: ${item.currentQuantity}）`
            };
        }

        const updated = await prisma.inventoryItem.findUnique({
            where: { id: itemId },
            select: { currentQuantity: true },
        });

        return { success: true, newQuantity: updated?.currentQuantity };
    } catch (error) {
        console.error("原子庫存扣減失敗:", error);
        return { success: false, message: "系統錯誤" };
    }
}
