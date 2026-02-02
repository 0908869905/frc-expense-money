"use server";

import { prisma } from "@/lib/prisma";
import { ItemCategory, TransactionType } from "@prisma/client";
import { z } from "zod";
import {
  requireInventoryWrite,
  getAuthenticatedUserId,
  revalidateInventory,
  unauthorizedState,
  successState,
  errorState,
  type ActionState
} from "@/lib/actions/helpers";
import { inventoryItemSchema, TransactionTypeEnum } from "@/lib/schemas";
import type { BatchResult } from "@/types/inventory";

// ========== 類型定義 ==========

export type InventoryState = ActionState;

// 自定義例外
class ItemNotFoundError extends Error {
  constructor() {
    super("找不到指定的零件");
    this.name = "ItemNotFoundError";
  }
}

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
  let ctx;
  try {
    ctx = await requireInventoryWrite();
  } catch {
    return unauthorizedState();
  }

  try {
    // 使用 Transaction 確保原子性
    await prisma.$transaction(async (tx) => {
      // 步驟 1：取得目前零件資料並鎖定
      const item = await tx.inventoryItem.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new ItemNotFoundError();
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
          performedBy: ctx.userName,
        },
      });
    });

    revalidateInventory();
    return successState("庫存調整成功");
  } catch (error) {
    console.error("庫存調整失敗:", error instanceof Error ? error.message : "Unknown error");

    if (error instanceof InsufficientStockError || error instanceof ItemNotFoundError) {
      return errorState(error.message);
    }
    return errorState("庫存調整失敗，請稍後再試");
  }
}

// ========== 取得需補貨清單 ==========

/**
 * 查詢所有 currentQuantity <= safetyStockLevel 的零件清單
 * 用於提醒管理者哪些零件需要補貨
 */
export async function getRestockList() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return [];
  }

  try {
    const allItems = await prisma.inventoryItem.findMany({
      orderBy: { currentQuantity: "asc" },
    });

    return allItems.filter((item) => item.currentQuantity <= item.safetyStockLevel);
  } catch (error) {
    console.error("取得補貨清單失敗:", error instanceof Error ? error.message : "Unknown error");
    return [];
  }
}

// ========== CRUD 操作 ==========

/**
 * 取得所有零件清單
 */
export async function getAllItems() {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return [];
  }

  try {
    return await prisma.inventoryItem.findMany({
      include: {
        transactions: {
          orderBy: { timestamp: "desc" },
          take: 5,
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("取得零件清單失敗:", error instanceof Error ? error.message : "Unknown error");
    return [];
  }
}

/**
 * 取得單一零件及其異動紀錄
 */
export async function getItemWithTransactions(itemId: string) {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return null;
  }

  try {
    return await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      include: {
        transactions: {
          orderBy: { timestamp: "desc" },
        },
      },
    });
  } catch (error) {
    console.error("取得零件詳情失敗:", error instanceof Error ? error.message : "Unknown error");
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
  try {
    await requireInventoryWrite();
  } catch {
    return unauthorizedState();
  }

  const parsed = inventoryItemSchema.safeParse(data);
  if (!parsed.success) {
    return errorState("輸入資料驗證失敗", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    const existing = await prisma.inventoryItem.findUnique({
      where: { sku: parsed.data.sku },
    });

    if (existing) {
      return errorState(`料號 ${parsed.data.sku} 已存在`);
    }

    await prisma.inventoryItem.create({
      data: {
        name: parsed.data.name,
        sku: parsed.data.sku,
        category: parsed.data.category as ItemCategory,
        storageLocation: parsed.data.storageLocation,
        currentQuantity: parsed.data.currentQuantity ?? 0,
        safetyStockLevel: parsed.data.safetyStockLevel ?? 0,
        vendorLink: parsed.data.vendorLink || null,
      },
    });

    revalidateInventory();
    return successState("零件新增成功");
  } catch (error) {
    console.error("新增零件失敗:", error instanceof Error ? error.message : "Unknown error");
    return errorState("資料庫錯誤");
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
  try {
    await requireInventoryWrite();
  } catch {
    return unauthorizedState();
  }

  const parsed = inventoryItemSchema.partial().safeParse(data);
  if (!parsed.success) {
    return errorState("輸入資料驗證失敗", parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  try {
    if (parsed.data.sku) {
      const existing = await prisma.inventoryItem.findFirst({
        where: { sku: parsed.data.sku, NOT: { id: itemId } },
      });

      if (existing) {
        return errorState(`料號 ${parsed.data.sku} 已被其他零件使用`);
      }
    }

    // 明確挑選允許更新的欄位，避免 mass assignment
    const updateData: Record<string, unknown> = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.sku !== undefined) updateData.sku = parsed.data.sku;
    if (parsed.data.category !== undefined) updateData.category = parsed.data.category;
    if (parsed.data.storageLocation !== undefined) updateData.storageLocation = parsed.data.storageLocation;
    if (parsed.data.safetyStockLevel !== undefined) updateData.safetyStockLevel = parsed.data.safetyStockLevel;
    if (parsed.data.vendorLink !== undefined) updateData.vendorLink = parsed.data.vendorLink || null;

    await prisma.inventoryItem.update({
      where: { id: itemId },
      data: updateData,
    });

    revalidateInventory();
    return successState("零件更新成功");
  } catch (error) {
    console.error("更新零件失敗:", error instanceof Error ? error.message : "Unknown error");
    return errorState("資料庫錯誤");
  }
}

/**
 * 刪除零件 (會連同刪除所有異動紀錄)
 */
export async function deleteItem(itemId: string): Promise<InventoryState> {
  let ctx;
  try {
    ctx = await requireInventoryWrite();
  } catch {
    return unauthorizedState();
  }

  // 只有 ADMIN 可以刪除零件
  if (ctx.userRole !== "ADMIN") {
    return errorState("只有管理員可以刪除零件");
  }

  try {
    await prisma.inventoryItem.delete({
      where: { id: itemId },
    });

    revalidateInventory();
    return successState("零件已刪除");
  } catch (error) {
    console.error("刪除零件失敗:", error instanceof Error ? error.message : "Unknown error");
    return errorState("資料庫錯誤");
  }
}

// ========== QR Code 掃描相關 ==========

const MAX_SKU_LENGTH = 200;

/**
 * 驗證 SKU 格式（允許任何字符，只檢查空值和長度）
 */
function validateSku(sku: string): { valid: boolean; error?: string } {
  if (!sku || sku.trim() === "") {
    return { valid: false, error: "請提供料號" };
  }

  if (sku.trim().length > MAX_SKU_LENGTH) {
    return { valid: false, error: `料號長度不可超過 ${MAX_SKU_LENGTH} 個字符` };
  }

  return { valid: true };
}

// ========== 批量操作 ==========

const MAX_BATCH_SIZE = 50;

function unauthorizedBatchResult(): BatchResult {
  return { success: false, message: "未授權", totalCount: 0, successCount: 0, failedCount: 0, results: [] };
}

function invalidBatchSizeResult(count: number): BatchResult {
  return {
    success: false,
    message: `批量數量須介於 1-${MAX_BATCH_SIZE} 之間`,
    totalCount: count,
    successCount: 0,
    failedCount: count,
    results: [],
  };
}

function buildBatchResult(totalCount: number, successCount: number, failedCount: number, results: BatchResult["results"], verb = "處理"): BatchResult {
  const allSuccess = failedCount === 0;
  const message = allSuccess
    ? `全部 ${successCount} 筆${verb}成功`
    : `${successCount} 筆成功，${failedCount} 筆失敗`;
  return { success: allSuccess, message, totalCount, successCount, failedCount, results };
}

/**
 * 批量新增零件
 */
export async function batchCreateItems(
  items: Array<{
    name: string;
    sku: string;
    category: string;
    storageLocation: string;
    currentQuantity?: number;
    safetyStockLevel?: number;
    vendorLink?: string;
  }>
): Promise<BatchResult> {
  try {
    await requireInventoryWrite();
  } catch {
    return unauthorizedBatchResult();
  }

  const batchSchema = z.array(inventoryItemSchema).min(1).max(MAX_BATCH_SIZE);
  const parsed = batchSchema.safeParse(items);
  if (!parsed.success) {
    return invalidBatchSizeResult(items.length);
  }

  // 設計決策：使用逐筆 create + P2002 catch 而非 createMany，
  // 以支援部分成功語義（前面成功的不回滾，後面失敗的個別報錯）。
  // 行內 SKU 重複預檢
  const skus = items.map((i) => i.sku.trim());
  const skuSet = new Set<string>();
  const duplicateSkus = new Set<string>();
  for (const sku of skus) {
    if (skuSet.has(sku)) {
      duplicateSkus.add(sku);
    }
    skuSet.add(sku);
  }

  // 資料庫 SKU 唯一性預檢
  const existingItems = await prisma.inventoryItem.findMany({
    where: { sku: { in: Array.from(skuSet) } },
    select: { sku: true },
  });
  const existingSkuSet = new Set(existingItems.map((i) => i.sku));

  const results: BatchResult["results"] = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const sku = item.sku.trim();

    // 檢查行內重複
    if (duplicateSkus.has(sku)) {
      results.push({ index: i, success: false, message: `料號 ${sku} 在批次內重複`, sku });
      failedCount++;
      continue;
    }

    // 檢查資料庫重複
    if (existingSkuSet.has(sku)) {
      results.push({ index: i, success: false, message: `料號 ${sku} 已存在`, sku });
      failedCount++;
      continue;
    }

    try {
      await prisma.inventoryItem.create({
        data: {
          name: item.name.trim(),
          sku,
          category: item.category as ItemCategory,
          storageLocation: item.storageLocation.trim(),
          currentQuantity: item.currentQuantity ?? 0,
          safetyStockLevel: item.safetyStockLevel ?? 0,
          vendorLink: item.vendorLink?.trim() || null,
        },
      });
      // 成功後加入 existingSkuSet 避免後續行再次建立同 SKU
      existingSkuSet.add(sku);
      results.push({ index: i, success: true, message: "新增成功", sku });
      successCount++;
    } catch (error: unknown) {
      // 捕獲 P2002 唯一約束衝突
      const prismaError = error as { code?: string };
      if (prismaError.code === "P2002") {
        results.push({ index: i, success: false, message: `料號 ${sku} 已存在`, sku });
      } else {
        results.push({ index: i, success: false, message: "資料庫錯誤", sku });
      }
      failedCount++;
    }
  }

  revalidateInventory();
  return buildBatchResult(items.length, successCount, failedCount, results, "新增");
}

/**
 * 批量庫存調整
 */
const batchAdjustItemSchema = z.object({
  itemId: z.string().min(1),
  amount: z.number().int().refine((val) => val !== 0, "數量不能為 0"),
  transactionType: TransactionTypeEnum,
  projectId: z.string().optional(),
});

export async function batchAdjustStock(
  adjustments: Array<{
    itemId: string;
    amount: number;
    transactionType: string;
    projectId?: string;
  }>
): Promise<BatchResult> {
  let ctx;
  try {
    ctx = await requireInventoryWrite();
  } catch {
    return unauthorizedBatchResult();
  }

  const batchSchema = z.array(batchAdjustItemSchema).min(1).max(MAX_BATCH_SIZE);
  const parsed = batchSchema.safeParse(adjustments);
  if (!parsed.success) {
    return invalidBatchSizeResult(adjustments.length);
  }

  const results: BatchResult["results"] = [];
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < adjustments.length; i++) {
    const adj = adjustments[i];

    try {
      await prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findUnique({
          where: { id: adj.itemId },
        });

        if (!item) {
          throw new ItemNotFoundError();
        }

        const newQuantity = item.currentQuantity + adj.amount;

        if (newQuantity < 0) {
          throw new InsufficientStockError(item.name, adj.amount, item.currentQuantity);
        }

        await tx.inventoryItem.update({
          where: { id: adj.itemId },
          data: { currentQuantity: newQuantity },
        });

        await tx.inventoryTransaction.create({
          data: {
            itemId: adj.itemId,
            changeAmount: adj.amount,
            transactionType: adj.transactionType as TransactionType,
            relatedProjectId: adj.projectId || null,
            performedBy: ctx.userName,
          },
        });
      });

      results.push({ index: i, success: true, message: "調整成功" });
      successCount++;
    } catch (error) {
      const isKnownError = error instanceof InsufficientStockError || error instanceof ItemNotFoundError;
      const msg = isKnownError ? (error as Error).message : "庫存調整失敗";
      results.push({ index: i, success: false, message: msg });
      failedCount++;
    }
  }

  revalidateInventory();
  return buildBatchResult(adjustments.length, successCount, failedCount, results, "調整");
}

/**
 * 根據 SKU 取得零件資料
 * 用於 QR Code 掃描後查詢
 */
export async function getItemBySku(sku: string): Promise<{
  success: boolean;
  item?: {
    id: string;
    name: string;
    sku: string;
    category: string;
    storageLocation: string;
    currentQuantity: number;
    safetyStockLevel: number;
    vendorLink: string | null;
  };
  message?: string;
}> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, message: "未授權" };
  }

  // 驗證 SKU 格式
  const validation = validateSku(sku);
  if (!validation.valid) {
    return { success: false, message: validation.error };
  }

  const sanitizedSku = sku.trim();

  try {
    // 大小寫不敏感查詢
    const item = await prisma.inventoryItem.findFirst({
      where: {
        sku: {
          equals: sanitizedSku,
          mode: "insensitive",
        },
      },
    });

    if (!item) {
      return { success: false, message: "找不到指定的料號" };
    }

    return {
      success: true,
      item: {
        id: item.id,
        name: item.name,
        sku: item.sku,
        category: item.category,
        storageLocation: item.storageLocation,
        currentQuantity: item.currentQuantity,
        safetyStockLevel: item.safetyStockLevel,
        vendorLink: item.vendorLink,
      },
    };
  } catch (error) {
    console.error("查詢零件失敗:", error instanceof Error ? error.message : "Unknown error");
    return { success: false, message: "資料庫錯誤" };
  }
}
