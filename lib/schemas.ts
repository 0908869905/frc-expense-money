import { z } from "zod";

// ============================================
// 共用密碼 Schema（統一密碼強度要求）
// ============================================
export const passwordSchema = z.string()
    .min(8, "密碼至少需要 8 個字元")
    .regex(/[a-zA-Z]/, "密碼必須包含至少一個英文字母")
    .regex(/[0-9]/, "密碼必須包含至少一個數字");

// 密碼強度驗證函式（供非 Zod 場景使用，基於 passwordSchema）
export function validatePassword(password: string): { valid: boolean; message?: string } {
    const result = passwordSchema.safeParse(password);
    if (result.success) {
        return { valid: true };
    }
    return { valid: false, message: result.error.errors[0]?.message };
}

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

// 團隊組別
export const TeamGroupEnum = z.enum([
  'ELECTRICAL',  // 電資組
  'MECHANICAL',  // 機構組
  'DOCUMENTATION', // 文書組
  'PR',          // 公關組
  'FINANCE',     // 財管組
  'DESIGN',      // 意象組
]);

// 費用項目 Schema
export const expenseItemSchema = z.object({
  date: z.coerce.date({ required_error: "日期為必填" }),
  category: ExpenseCategoryEnum,
  customCategory: z.string().optional(), // 當選擇 Other 時的自定義類別
  description: z.string().min(2, "說明至少需要 2 個字元"),
  amount: z.coerce.number().positive("金額必須大於 0"),
  receiptUrl: z.string().optional().nullable(),
});

// 費用報告 Schema
export const expenseReportSchema = z.object({
  title: z.string().min(3, "標題至少需要 3 個字元"),
  description: z.string().optional(),
  department: TeamGroupEnum.optional(), // 組別（可選）
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
  password: passwordSchema.optional(),
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
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "密碼不一致",
  path: ["confirmPassword"],
});
