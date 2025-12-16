import { z } from "zod";

// Match the ExpenseCategory enum from types.ts or define standard ones
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

export const expenseItemSchema = z.object({
  date: z.coerce.date({ required_error: "Date is required" }),
  category: ExpenseCategoryEnum,
  description: z.string().min(2, "Description is required"),
  amount: z.coerce.number().positive("Amount must be greater than 0"),
  receiptUrl: z.string().optional().nullable(),
});

export const expenseReportSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  items: z.array(expenseItemSchema).min(1, "At least one expense item is required"),
});

export type ExpenseReportFormValues = z.infer<typeof expenseReportSchema>;
