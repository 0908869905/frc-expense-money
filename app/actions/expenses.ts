"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { expenseReportSchema } from "@/lib/schemas";
import { toStorageUnit } from "@/lib/money";
import { revalidatePath } from "next/cache";

export type State = {
  success: boolean;
  message: string | null;
  errors?: {
    [K in keyof typeof expenseReportSchema.shape]?: string[];
  };
};

export async function createExpense(prevState: State, formData: FormData): Promise<State> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  // 權限檢查：USER 角色不能新增報帳單
  const userRole = session.user.role;
  if (userRole === "USER") {
    return { success: false, message: "您沒有權限新增報帳單" };
  }

  // 使用 session 中的資訊，類似 inventory 的 performedBy 模式
  const submitterName = session.user.name || session.user.email || "Unknown";
  const submitterEmail = session.user.email || "";
  const submitterId = session.user.id || null;
  // 使用管理員設定的用戶組別，而非表單輸入
  const userDepartment = (session.user as any).department || null;

  // 解析表單資料
  const rawData = formData.get("data");

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
  const totalAmountCents = items.reduce((sum, item) => sum + toStorageUnit(item.amount), 0);

  try {
    await prisma.$transaction(async (tx) => {
      // 1. 建立報帳單 - 使用用戶的組別設定
      const report = await tx.expenseReport.create({
        data: {
          title,
          description: description || "",
          ...(userDepartment && { department: userDepartment }), // 只在用戶有設定組別時才填入
          submitterName,
          submitterEmail,
          submitterId, // 可選的外鍵，可能為 null
          status: "DRAFT",
          totalAmount,
          amountCents: totalAmountCents,
          items: {
            create: items.map((item) => {
              let parsedDate: Date;
              try {
                parsedDate = item.date instanceof Date ? item.date : new Date(item.date);
                if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() > 3000) {
                  parsedDate = new Date();
                }
              } catch {
                parsedDate = new Date();
              }

              return {
                date: parsedDate,
                category: item.category,
                description: item.description,
                amount: item.amount,
                amountCents: toStorageUnit(item.amount),
                receiptUrl: item.receiptUrl,
              };
            }),
          },
        },
      });

      // 2. 建立審計日誌 - 也用可選方式
      if (submitterId) {
        await tx.auditLog.create({
          data: {
            entityType: "ExpenseReport",
            entityId: report.id,
            action: "CREATE",
            actorId: submitterId,
            newData: JSON.parse(JSON.stringify(report)) as any,
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");

    return { success: true, message: "報帳單建立成功！" };
  } catch (error) {
    console.error("Failed to create expense report:", error);
    return { success: false, message: "資料庫錯誤：建立報帳單失敗" };
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

  if (!session?.user) {
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

      if (session.user.id) {
        await tx.auditLog.create({
          data: {
            entityType: "ExpenseReport",
            entityId: reportId,
            action: "UPDATE",
            actorId: session.user.id,
            oldData: JSON.parse(JSON.stringify(report)) as any,
            newData: data as any,
          },
        });
      }
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

  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const report = await prisma.expenseReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return { success: false, message: "Report not found" };
    }

    // 檢查是否為提交者本人（用 email 比對）
    if (report.submitterEmail !== session.user.email && session.user.role !== "ADMIN") {
      return { success: false, message: "You can only submit your own reports" };
    }

    if (report.status !== "DRAFT") {
      return { success: false, message: "Only draft reports can be submitted" };
    }

    // 根據提交者角色決定狀態
    // ADMIN, FINANCE → 直接付款
    // LEADER → 跳過組長審核，進入財務審核
    // VICE_LEADER → 正常流程，從組長審核開始
    const submitterRole = session.user.role;
    let newStatus: string;
    let skipMessage: string = "";

    if (submitterRole === "ADMIN" || submitterRole === "FINANCE") {
      newStatus = "PAID";
      skipMessage = "（管理員/財務直接付款）";
    } else if (submitterRole === "LEADER") {
      newStatus = "PENDING_FINANCE";
      skipMessage = "（組長跳過組長審核）";
    } else {
      // VICE_LEADER 或其他
      newStatus = "PENDING_MANAGER";
    }

    await prisma.$transaction(async (tx) => {
      await tx.expenseReport.update({
        where: { id: reportId },
        data: { status: newStatus as any },
      });

      if (session.user.id) {
        await tx.auditLog.create({
          data: {
            entityType: "ExpenseReport",
            entityId: reportId,
            action: "SUBMIT",
            actorId: session.user.id,
            oldData: { status: "DRAFT" },
            newData: { status: newStatus, skipMessage },
          },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");

    const messages: Record<string, string> = {
      PAID: "報帳單已直接核准付款！",
      PENDING_FINANCE: "報帳單已提交至財務審核！",
      PENDING_MANAGER: "報帳單已提交至組長審核！",
    };

    return { success: true, message: messages[newStatus] || "Report submitted!" };
  } catch (error) {
    console.error("Failed to submit report:", error);
    return { success: false, message: "Database error: Failed to submit report." };
  }
}

// Delete a draft report
export async function deleteReport(reportId: string): Promise<State> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const report = await prisma.expenseReport.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return { success: false, message: "Report not found" };
    }

    // 檢查權限（用 email 比對）
    if (report.submitterEmail !== session.user.email && session.user.role !== "ADMIN") {
      return { success: false, message: "You can only delete your own reports" };
    }

    if (report.status !== "DRAFT" && session.user.role !== "ADMIN") {
      return { success: false, message: "Only draft reports can be deleted" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.expenseItem.deleteMany({
        where: { reportId },
      });
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
