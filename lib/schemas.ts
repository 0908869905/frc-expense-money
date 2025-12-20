import { z } from "zod";

// 費用類別
export const ExpenseCategoryEnum = z.enum([
  'Food',
  'Transport',
  'Housing',
  'Entertainment',
  'Utilities',
  'Health',
  'Office Supplies',
  'Travel',
  'Other'
]);

// 費用項目 Schema
export const expenseItemSchema = z.object({
  date: z.coerce.date({ required_error: "日期為必填" }),
  category: ExpenseCategoryEnum,
  description: z.string().min(2, "說明至少需要 2 個字元"),
  amount: z.coerce.number().positive("金額必須大於 0"),
  receiptUrl: z.string().optional().nullable(),
});

// 費用報告 Schema
export const expenseReportSchema = z.object({
  title: z.string().min(3, "標題至少需要 3 個字元"),
  description: z.string().optional(),
  items: z.array(expenseItemSchema).min(1, "至少需要一個費用項目"),
});

export type ExpenseReportFormValues = z.infer<typeof expenseReportSchema>;

// 庫存類別
export const ItemCategoryEnum = z.enum([
  'MOTOR',
  'SENSOR',
  'PNEUMATIC',
  'CONTROLLER',
  'HARDWARE',
  'RAW_MATERIAL',
  'TOOL'
]);

// 異動類型
export const TransactionTypeEnum = z.enum([
  'PURCHASE_IN',
  'PROJECT_USE',
  'DAMAGED',
  'LOST',
  'AUDIT_ADJUSTMENT'
]);

// 庫存項目 Schema
export const inventoryItemSchema = z.object({
  name: z.string().min(1, "品名為必填"),
  sku: z.string().min(1, "料號為必填").regex(/^[A-Za-z0-9-]+$/, "料號只能包含英數字和破折號"),
  category: ItemCategoryEnum,
  storageLocation: z.string().min(1, "儲存位置為必填"),
  currentQuantity: z.coerce.number().int().min(0, "數量不能為負數").default(0),
  safetyStockLevel: z.coerce.number().int().min(0, "安全庫存不能為負數").default(0),
  vendorLink: z.string().url("請輸入有效的 URL").optional().or(z.literal("")),
});

export type InventoryItemFormValues = z.infer<typeof inventoryItemSchema>;

// 庫存調整 Schema
export const stockAdjustmentSchema = z.object({
  amount: z.coerce.number().int().refine((val) => val !== 0, "數量不能為 0"),
  type: TransactionTypeEnum,
  projectId: z.string().optional(),
});

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>;

// 使用者 Schema
export const userSchema = z.object({
  name: z.string().min(2, "姓名至少需要 2 個字元"),
  email: z.string().email("請輸入有效的 Email"),
  password: z.string().min(6, "密碼至少需要 6 個字元").optional(),
});

// 登入 Schema
export const loginSchema = z.object({
  email: z.string().email("請輸入有效的 Email"),
  password: z.string().min(1, "密碼為必填"),
});

// 註冊 Schema
export const registerSchema = z.object({
  name: z.string().min(2, "姓名至少需要 2 個字元"),
  email: z.string().email("請輸入有效的 Email"),
  password: z.string().min(6, "密碼至少需要 6 個字元"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密碼不一致",
  path: ["confirmPassword"],
});
