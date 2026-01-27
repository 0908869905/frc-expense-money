"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { FundingType } from "@prisma/client"
import {
  getAuthenticatedUserId,
  requireFinanceAccess,
  revalidateFunding,
  unauthorizedState,
  successState,
  errorState,
  type ActionState,
  type AuthContext
} from "@/lib/actions/helpers"

const fundingRecordSchema = z.object({
  title: z.string().min(1, "標題為必填"),
  amount: z.number().positive("金額必須大於 0"),
  type: z.enum(["SPONSORSHIP", "DONATION", "GRANT", "FUNDRAISING", "OTHER"]),
  source: z.string().optional(),
  description: z.string().optional(),
  date: z.date().optional(),
})

export type FundingState = ActionState

async function getFinanceContext(): Promise<AuthContext | null> {
  try {
    return await requireFinanceAccess()
  } catch {
    return null
  }
}

export async function createFundingRecord(
  prevState: FundingState,
  formData: FormData
): Promise<FundingState> {
  const ctx = await getFinanceContext()
  if (!ctx) {
    return unauthorizedState("未授權或權限不足")
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
    return errorState("驗證失敗", validatedFields.error.flatten().fieldErrors as Record<string, string[]>)
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
        recordedBy: ctx.userName,
      },
    })

    revalidateFunding()
    return successState("資金記錄已新增")
  } catch (error) {
    console.error("Failed to create funding record:", error)
    return errorState("新增失敗，請稍後再試")
  }
}

export async function getFundingRecords() {
  const userId = await getAuthenticatedUserId()
  if (!userId) return []

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
  const userId = await getAuthenticatedUserId()
  if (!userId) return EMPTY_SUMMARY

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
  const ctx = await getFinanceContext()
  if (!ctx) {
    return unauthorizedState("未授權或權限不足")
  }

  try {
    await prisma.fundingRecord.delete({ where: { id } })
    revalidateFunding()
    return successState("記錄已刪除")
  } catch (error) {
    console.error("Failed to delete funding record:", error)
    return errorState("刪除失敗")
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
  const ctx = await getFinanceContext()
  if (!ctx) {
    return unauthorizedState("未授權或權限不足")
  }

  const validatedFields = fundingRecordSchema.safeParse(data)

  if (!validatedFields.success) {
    return errorState("驗證失敗", validatedFields.error.flatten().fieldErrors as Record<string, string[]>)
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

    revalidateFunding()
    return successState("資金記錄已更新")
  } catch (error) {
    console.error("Failed to update funding record:", error)
    return errorState("更新失敗，請稍後再試")
  }
}
