"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { ItemCategory, TransactionType } from "@prisma/client";

// ========== 類型定義 ==========

export type InventoryState = {
  success: boolean;
  message: string | null;
  errors?: Record<string, string[]>;
};

// 自定義例外：庫存不足
class InsufficientStockError extends Error {
  constructor(itemName: string, requested: number, available: number) {
    super(`庫存不足：${itemName} 目前只有 ${available}，無法扣除 ${Math.abs(requested)}`);
    this.name = "InsufficientStockError";
  }
}

// ========== 庫存調整 (核心業務邏輯) ==========

/**
 * 調整庫存數量
 * 
 * 此方法使用 Prisma Transaction 確保原子性：
 * 1. 更新 InventoryItem.currentQuantity
 * 2. 新增一筆 InventoryTransaction 紀錄
 * 3. 若更新後數量 < 0，拋出 InsufficientStockError 並回滾
 * 
 * @param itemId - 零件 ID
 * @param amount - 異動數量 (正=入庫，負=出庫)
 * @param type - 異動類型
 * @param projectId - 關聯專案 ID (選填)
 */
export async function adjustStock(
  itemId: string,
  amount: number,
  type: TransactionType,
  projectId?: string
): Promise<InventoryState> {
  // 驗證使用者身份
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "未授權的操作" };
  }

  const performedBy = session.user.name || session.user.email || "Unknown";

  try {
    // 使用 Transaction 確保原子性
    await prisma.$transaction(async (tx) => {
      // 步驟 1：取得目前零件資料並鎖定
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error("找不到指定的零件");
      }

      // 步驟 2：計算新數量
      const newQuantity = item.currentQuantity + amount;

      // 步驟 3：檢查庫存是否足夠 (若為扣除操作)
      if (newQuantity < 0) {
        throw new InsufficientStockError(item.name, amount, item.currentQuantity);
      }

      // 步驟 4：更新零件數量
      await tx.inventoryItem.update({
        where: { id: itemId },
        data: { currentQuantity: newQuantity },
      });

      // 步驟 5：建立異動紀錄
      await tx.inventoryTransaction.create({
        data: {
          itemId: itemId,
          changeAmount: amount,
          transactionType: type,
          relatedProjectId: projectId || null,
          performedBy: performedBy,
        },
      });
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, message: "庫存調整成功" };
  } catch (error) {
    console.error("庫存調整失敗:", error);
    
    if (error instanceof InsufficientStockError) {
      return { success: false, message: error.message };
    }
    
    return { success: false, message: error instanceof Error ? error.message : "資料庫錯誤" };
  }
}

// ========== 取得需補貨清單 ==========

/**
 * 查詢所有 currentQuantity <= safetyStockLevel 的零件清單
 * 用於提醒管理者哪些零件需要補貨
 */
export async function getRestockList() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  try {
    // 查詢庫存低於安全水位的零件
    const items = await prisma.inventoryItem.findMany({
      where: {
        currentQuantity: {
          lte: prisma.inventoryItem.fields.safetyStockLevel,
        },
      },
      orderBy: [
        { currentQuantity: "asc" }, // 數量最少的排前面
      ],
    });

    // 由於 Prisma 不支援直接比較兩個欄位，使用 rawQuery 或過濾
    const allItems = await prisma.inventoryItem.findMany({
      orderBy: { currentQuantity: "asc" },
    });

    // 手動過濾：currentQuantity <= safetyStockLevel
    return allItems.filter((item) => item.currentQuantity <= item.safetyStockLevel);
  } catch (error) {
    console.error("取得補貨清單失敗:", error);
    return [];
  }
}

// ========== CRUD 操作 ==========

/**
 * 取得所有零件清單
 */
export async function getAllItems() {
  const session = await auth();
  if (!session?.user?.id) {
    return [];
  }

  try {
    const items = await prisma.inventoryItem.findMany({
      include: {
        transactions: {
          orderBy: { timestamp: "desc" },
          take: 5, // 只取最近 5 筆異動
        },
      },
      orderBy: { name: "asc" },
    });

    return items;
  } catch (error) {
    console.error("取得零件清單失敗:", error);
    return [];
  }
}

/**
 * 取得單一零件及其異動紀錄
 */
export async function getItemWithTransactions(itemId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  try {
    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        transactions: {
          orderBy: { timestamp: "desc" },
        },
      },
    });

    return item;
  } catch (error) {
    console.error("取得零件詳情失敗:", error);
    return null;
  }
}

/**
 * 新增零件
 */
export async function createItem(data: {
  name: string;
  sku: string;
  category: ItemCategory;
  storageLocation: string;
  currentQuantity?: number;
  safetyStockLevel?: number;
  vendorLink?: string;
}): Promise<InventoryState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "未授權的操作" };
  }

  try {
    // 檢查 SKU 是否已存在
    const existing = await prisma.inventoryItem.findUnique({
      where: { sku: data.sku },
    });

    if (existing) {
      return { success: false, message: `料號 ${data.sku} 已存在` };
    }

    await prisma.inventoryItem.create({
      data: {
        name: data.name,
        sku: data.sku,
        category: data.category,
        storageLocation: data.storageLocation,
        currentQuantity: data.currentQuantity || 0,
        safetyStockLevel: data.safetyStockLevel || 0,
        vendorLink: data.vendorLink || null,
      },
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, message: "零件新增成功" };
  } catch (error) {
    console.error("新增零件失敗:", error);
    return { success: false, message: "資料庫錯誤" };
  }
}

/**
 * 更新零件資料
 */
export async function updateItem(
  itemId: string,
  data: {
    name?: string;
    sku?: string;
    category?: ItemCategory;
    storageLocation?: string;
    safetyStockLevel?: number;
    vendorLink?: string;
  }
): Promise<InventoryState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "未授權的操作" };
  }

  try {
    // 若要更新 SKU，檢查是否與其他零件衝突
    if (data.sku) {
      const existing = await prisma.inventoryItem.findFirst({
        where: {
          sku: data.sku,
          NOT: { id: itemId },
        },
      });

      if (existing) {
        return { success: false, message: `料號 ${data.sku} 已被其他零件使用` };
      }
    }

    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: data,
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, message: "零件更新成功" };
  } catch (error) {
    console.error("更新零件失敗:", error);
    return { success: false, message: "資料庫錯誤" };
  }
}

/**
 * 刪除零件 (會連同刪除所有異動紀錄)
 */
export async function deleteItem(itemId: string): Promise<InventoryState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, message: "未授權的操作" };
  }

  // 只有 ADMIN 可以刪除零件
  if (session.user.role !== "ADMIN") {
    return { success: false, message: "只有管理員可以刪除零件" };
  }

  try {
    await prisma.inventoryItem.delete({
      where: { id: itemId },
    });

    revalidatePath("/dashboard/inventory");
    return { success: true, message: "零件已刪除" };
  } catch (error) {
    console.error("刪除零件失敗:", error);
    return { success: false, message: "資料庫錯誤" };
  }
}
