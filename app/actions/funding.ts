"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"

// Schema for funding record validation
const fundingRecordSchema = z.object({
  title: z.string().min(1, "標題為必填"),
  amount: z.number().positive("金額必須大於 0"),
  type: z.enum(["SPONSORSHIP", "DONATION", "GRANT", "FUNDRAISING", "OTHER"]),
  source: z.string().optional(),
  description: z.string().optional(),
  date: z.date().optional(),
})

export type FundingState = {
  success: boolean
  message: string | null
  errors?: Record<string, string[]>
}

// 新增資金記錄
export async function createFundingRecord(
  prevState: FundingState,
  formData: FormData
): Promise<FundingState> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, message: "未授權" }
  }

  // 只有 FINANCE 和 ADMIN 可以新增資金記錄
  if (!["FINANCE", "ADMIN"].includes(session.user.role || "")) {
    return { success: false, message: "權限不足" }
  }

  const rawData = {
    title: formData.get("title") as string,
    amount: parseFloat(formData.get("amount") as string),
    type: formData.get("type") as string,
    source: formData.get("source") as string || undefined,
    description: formData.get("description") as string || undefined,
    date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
  }

  const validatedFields = fundingRecordSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      message: "驗證失敗",
      errors: validatedFields.error.flatten().fieldErrors as any,
    }
  }

  const { title, amount, type, source, description, date } = validatedFields.data

  try {
    await prisma.fundingRecord.create({
      data: {
        title,
        amount,
        type: type as any,
        source,
        description,
        date: date || new Date(),
        recordedBy: session.user.name || session.user.email || "Unknown",
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")

    return { success: true, message: "資金記錄已新增" }
  } catch (error) {
    console.error("Failed to create funding record:", error)
    return { success: false, message: "新增失敗，請稍後再試" }
  }
}

// 取得資金記錄列表
export async function getFundingRecords() {
  const session = await auth()

  if (!session?.user?.id) {
    return []
  }

  try {
    return await prisma.fundingRecord.findMany({
      orderBy: { date: "desc" },
      take: 50,
    })
  } catch (error) {
    console.error("Failed to fetch funding records:", error)
    return []
  }
}

// 取得財務摘要 (餘額計算)
export async function getFinancialSummary() {
  try {
    // 計算總收入 (所有資金記錄)
    const fundingResult = await prisma.fundingRecord.aggregate({
      _sum: { amount: true },
    })
    const totalIncome = fundingResult._sum.amount || 0

    // 計算總支出 (已付款的報帳單)
    const expenseResult = await prisma.expenseReport.aggregate({
      where: { status: "PAID" },
      _sum: { totalAmount: true },
    })
    const totalExpense = expenseResult._sum.totalAmount || 0

    // 目前餘額
    const currentBalance = totalIncome - totalExpense

    return {
      totalIncome,
      totalExpense,
      currentBalance,
    }
  } catch (error) {
    console.error("Failed to calculate financial summary:", error)
    return {
      totalIncome: 0,
      totalExpense: 0,
      currentBalance: 0,
    }
  }
}

// 刪除資金記錄
export async function deleteFundingRecord(id: string): Promise<FundingState> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, message: "未授權" }
  }

  if (!["FINANCE", "ADMIN"].includes(session.user.role || "")) {
    return { success: false, message: "權限不足" }
  }

  try {
    await prisma.fundingRecord.delete({
      where: { id },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")

    return { success: true, message: "記錄已刪除" }
  } catch (error) {
    console.error("Failed to delete funding record:", error)
    return { success: false, message: "刪除失敗" }
  }
}

// 更新資金記錄
export async function updateFundingRecord(
  id: string,
  data: {
    title: string
    amount: number
    type: string
    source?: string
    description?: string
    date?: Date
  }
): Promise<FundingState> {
  const session = await auth()

  if (!session?.user?.id) {
    return { success: false, message: "未授權" }
  }

  if (!["FINANCE", "ADMIN"].includes(session.user.role || "")) {
    return { success: false, message: "權限不足" }
  }

  const validatedFields = fundingRecordSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      success: false,
      message: "驗證失敗",
      errors: validatedFields.error.flatten().fieldErrors as any,
    }
  }

  const { title, amount, type, source, description, date } = validatedFields.data

  try {
    await prisma.fundingRecord.update({
      where: { id },
      data: {
        title,
        amount,
        type: type as any,
        source,
        description,
        date: date || new Date(),
      },
    })

    revalidatePath("/dashboard")
    revalidatePath("/dashboard/reports")

    return { success: true, message: "資金記錄已更新" }
  } catch (error) {
    console.error("Failed to update funding record:", error)
    return { success: false, message: "更新失敗，請稍後再試" }
  }
}
