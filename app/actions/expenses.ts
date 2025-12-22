"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { expenseReportSchema } from "@/lib/schemas";
import { revalidatePath } from "next/cache";

// We use the imported 'prisma' instance directly.

export type State = {
  success: boolean;
  message: string | null;
  errors?: {
    [K in keyof typeof expenseReportSchema.shape]?: string[];
  };
};

export async function createExpense(prevState: State, formData: FormData): Promise<State> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  // Debug: 確認 submitterId 存在於 User 表中
  const submitterId = session.user.id;
  console.log("Session user ID:", submitterId);

  const userExists = await prisma.user.findUnique({
    where: { id: submitterId },
    select: { id: true, email: true }
  });

  if (!userExists) {
    console.error("User not found in database:", submitterId);
    return { success: false, message: `User not found: ${submitterId}` };
  }
  console.log("User found:", userExists);


  // Extract complex data structures (React Hook Form will likely pass these as JSON strings if we structure the payload manually, 
  // or we parse standard formData naming conventions. 
  // For robustness with dynamic arrays, we expect a 'data' field containing the JSON string of values)
  const rawData = formData.get("data");
  const organizationId = formData.get("organizationId") as string || "frc-6998";

  if (!rawData || typeof rawData !== "string") {
    return { success: false, message: "Invalid form data submission" };
  }

  const parsedData = JSON.parse(rawData);
  const validatedFields = expenseReportSchema.safeParse(parsedData);

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Validation failed",
      errors: validatedFields.error.flatten().fieldErrors as any,
    };
  }

  const { title, description, items } = validatedFields.data;
  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);
  const amountCentsValue = Math.round(totalAmount * 100);

  // Debug: 追蹤 amountCents 值
  console.log("Creating expense report with:", {
    title,
    totalAmount,
    amountCentsValue,
    submitterId,
    organizationId,
    itemsCount: items.length
  });

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create the Report with organizationId
      const report = await tx.expenseReport.create({
        data: {
          title,
          description: description || "",
          submitterId: session.user.id!,
          organizationId, // 資料隔離：依組織分開
          status: "DRAFT", // Or PENDING_MANAGER depending on business logic
          totalAmount,
          amountCents: amountCentsValue, // 使用預先計算的值
          items: {
            create: items.map((item) => {
              // 確保日期是有效的 Date 物件
              let parsedDate: Date;
              try {
                parsedDate = item.date instanceof Date ? item.date : new Date(item.date);
                // 檢查日期是否有效（防止 Invalid Date）
                if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() > 3000) {
                  parsedDate = new Date(); // 使用當前日期作為後備
                }
              } catch {
                parsedDate = new Date();
              }

              return {
                date: parsedDate,
                category: item.category,
                description: item.description,
                amount: item.amount,
                receiptUrl: item.receiptUrl,
              };
            }),
          },
        },
      });

      // 2. Create Audit Log
      await tx.auditLog.create({
        data: {
          entityType: "ExpenseReport",
          entityId: report.id,
          action: "CREATE",
          actorId: session.user.id!,
          newData: JSON.parse(JSON.stringify(report)) as any,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");

    return { success: true, message: "Expense report created successfully!" };
  } catch (error) {
    console.error("Failed to create expense report:", error);
    return { success: false, message: "Database error: Failed to create report." };
  }
}

// Update report (Admin only)
export async function updateReport(
  reportId: string,
  data: {
    title?: string;
    description?: string;
    status?: string;
  }
): Promise<State> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  // Only ADMIN can update any report
  if (session.user.role !== "ADMIN") {
    return { success: false, message: "Only admins can edit reports" };
  }

  try {
    const report = await prisma.expenseReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return { success: false, message: "Report not found" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.expenseReport.update({
        where: { id: reportId },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.status && { status: data.status as any }),
        },
      });

      await tx.auditLog.create({
        data: {
          entityType: "ExpenseReport",
          entityId: reportId,
          action: "UPDATE",
          actorId: session.user.id!,
          oldData: JSON.parse(JSON.stringify(report)) as any,
          newData: data as any,
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/reports");

    return { success: true, message: "Report updated successfully!" };
  } catch (error) {
    console.error("Failed to update report:", error);
    return { success: false, message: "Database error: Failed to update report." };
  }
}

// Submit a draft report for approval
export async function submitReport(reportId: string): Promise<State> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const report = await prisma.expenseReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return { success: false, message: "Report not found" };
    }

    if (report.submitterId !== session.user.id) {
      return { success: false, message: "You can only submit your own reports" };
    }

    if (report.status !== "DRAFT") {
      return { success: false, message: "Only draft reports can be submitted" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.expenseReport.update({
        where: { id: reportId },
        data: { status: "PENDING_MANAGER" },
      });

      await tx.auditLog.create({
        data: {
          entityType: "ExpenseReport",
          entityId: reportId,
          action: "SUBMIT",
          actorId: session.user.id!,
          oldData: { status: "DRAFT" },
          newData: { status: "PENDING_MANAGER" },
        },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");

    return { success: true, message: "Report submitted for approval!" };
  } catch (error) {
    console.error("Failed to submit report:", error);
    return { success: false, message: "Database error: Failed to submit report." };
  }
}

// Delete a draft report
export async function deleteReport(reportId: string): Promise<State> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const report = await prisma.expenseReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return { success: false, message: "Report not found" };
    }

    if (report.submitterId !== session.user.id && session.user.role !== "ADMIN") {
      return { success: false, message: "You can only delete your own reports" };
    }

    if (report.status !== "DRAFT" && session.user.role !== "ADMIN") {
      return { success: false, message: "Only draft reports can be deleted" };
    }

    await prisma.$transaction(async (tx) => {
      // Delete expense items first
      await tx.expenseItem.deleteMany({
        where: { reportId },
      });

      // Delete the report
      await tx.expenseReport.delete({
        where: { id: reportId },
      });
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");

    return { success: true, message: "Report deleted!" };
  } catch (error) {
    console.error("Failed to delete report:", error);
    return { success: false, message: "Database error: Failed to delete report." };
  }
}