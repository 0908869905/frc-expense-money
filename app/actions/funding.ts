"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { FundingType } from "@prisma/client"

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

const FINANCE_ROLES = ["FINANCE", "ADMIN"] as const;

async function requireFinanceAccess(): Promise<{ userId: string; userName: string } | null> {
  const session = await auth()

  if (!session?.user?.id) return null

  const role = session.user.role || ""
  if (!FINANCE_ROLES.includes(role as typeof FINANCE_ROLES[number])) return null

  return {
    userId: session.user.id,
    userName: session.user.name || session.user.email || "Unknown"
  }
}

function revalidateFundingPaths(): void {
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/reports")
}

export async function createFundingRecord(
  prevState: FundingState,
  formData: FormData
): Promise<FundingState> {
  const access = await requireFinanceAccess()
  if (!access) {
    return { success: false, message: "未授權或權限不足" }
  }

  const rawData = {
    title: formData.get("title"),
    amount: parseFloat(formData.get("amount") as string),
    type: formData.get("type"),
    source: (formData.get("source") as string) || undefined,
    description: (formData.get("description") as string) || undefined,
    date: formData.get("date") ? new Date(formData.get("date") as string) : new Date(),
  }

  const validatedFields = fundingRecordSchema.safeParse(rawData)

  if (!validatedFields.success) {
    return {
      success: false,
      message: "驗證失敗",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { title, amount, type, source, description, date } = validatedFields.data

  try {
    await prisma.fundingRecord.create({
      data: {
        title,
        amount,
        type: type as FundingType,
        source,
        description,
        date: date ?? new Date(),
        recordedBy: access.userName,
      },
    })

    revalidateFundingPaths()
    return { success: true, message: "資金記錄已新增" }
  } catch (error) {
    console.error("Failed to create funding record:", error)
    return { success: false, message: "新增失敗，請稍後再試" }
  }
}

export async function getFundingRecords() {
  const session = await auth()
  if (!session?.user?.id) return []

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

type FinancialSummary = {
  totalIncome: number
  totalExpense: number
  currentBalance: number
}

const EMPTY_SUMMARY: FinancialSummary = {
  totalIncome: 0,
  totalExpense: 0,
  currentBalance: 0,
}

export async function getFinancialSummary(): Promise<FinancialSummary> {
  const session = await auth()
  if (!session?.user?.id) return EMPTY_SUMMARY

  try {
    const [fundingResult, expenseResult] = await Promise.all([
      prisma.fundingRecord.aggregate({ _sum: { amount: true } }),
      prisma.expenseReport.aggregate({
        where: { status: "PAID" },
        _sum: { totalAmount: true },
      }),
    ])

    const totalIncome = fundingResult._sum.amount ?? 0
    const totalExpense = expenseResult._sum.totalAmount ?? 0

    return {
      totalIncome,
      totalExpense,
      currentBalance: totalIncome - totalExpense,
    }
  } catch (error) {
    console.error("Failed to calculate financial summary:", error)
    return EMPTY_SUMMARY
  }
}

export async function deleteFundingRecord(id: string): Promise<FundingState> {
  const access = await requireFinanceAccess()
  if (!access) {
    return { success: false, message: "未授權或權限不足" }
  }

  try {
    await prisma.fundingRecord.delete({ where: { id } })
    revalidateFundingPaths()
    return { success: true, message: "記錄已刪除" }
  } catch (error) {
    console.error("Failed to delete funding record:", error)
    return { success: false, message: "刪除失敗" }
  }
}

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
  const access = await requireFinanceAccess()
  if (!access) {
    return { success: false, message: "未授權或權限不足" }
  }

  const validatedFields = fundingRecordSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      success: false,
      message: "驗證失敗",
      errors: validatedFields.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { title, amount, type, source, description, date } = validatedFields.data

  try {
    await prisma.fundingRecord.update({
      where: { id },
      data: {
        title,
        amount,
        type: type as FundingType,
        source,
        description,
        date: date ?? new Date(),
      },
    })

    revalidateFundingPaths()
    return { success: true, message: "資金記錄已更新" }
  } catch (error) {
    console.error("Failed to update funding record:", error)
    return { success: false, message: "更新失敗，請稍後再試" }
  }
}
