"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";

function revalidateApprovalPaths(): void {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/approvals");
}

export async function approveReport(reportId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  const role = session.user.role;
  let nextStatus: ReportStatus;

  if (report.status === "PENDING_MANAGER") {
    if (role !== "LEADER" && role !== "ADMIN") {
      throw new Error("Insufficient permissions: Leader approval required");
    }
    nextStatus = "PENDING_FINANCE";
  } else if (report.status === "PENDING_FINANCE") {
    if (role !== "FINANCE" && role !== "ADMIN") {
      throw new Error("Insufficient permissions: Finance approval required");
    }
    nextStatus = "PAID";
  } else {
    throw new Error("Report is not in a pending state");
  }

  const actorId = session.user.id;

  await prisma.$transaction(async (tx) => {
    await tx.expenseReport.update({
      where: { id: reportId },
      data: { status: nextStatus },
    });

    await tx.approvalAction.create({
      data: { reportId, actorId, action: "APPROVE" },
    });

    await tx.auditLog.create({
      data: {
        entityType: "ExpenseReport",
        entityId: reportId,
        action: "APPROVE",
        actorId,
        newData: { status: nextStatus },
      },
    });
  });

  revalidateApprovalPaths();
}

export async function rejectReport(reportId: string, comment: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  const role = session.user.role;

  // 驗證報帳單狀態與角色權限
  if (report.status === "PENDING_MANAGER") {
    if (role !== "LEADER" && role !== "ADMIN") {
      throw new Error("Only Leaders can reject at this stage");
    }
  } else if (report.status === "PENDING_FINANCE") {
    if (role !== "FINANCE" && role !== "ADMIN") {
      throw new Error("Only Finance can reject at this stage");
    }
  } else {
    throw new Error("Report cannot be rejected in its current state");
  }

  const actorId = session.user.id;

  await prisma.$transaction(async (tx) => {
    await tx.expenseReport.update({
      where: { id: reportId },
      data: { status: "REJECTED" },
    });

    await tx.approvalAction.create({
      data: { reportId, actorId, action: "REJECT", comment },
    });

    await tx.auditLog.create({
      data: {
        entityType: "ExpenseReport",
        entityId: reportId,
        action: "REJECT",
        actorId,
        newData: { status: "REJECTED", rejectionReason: comment },
      },
    });
  });

  revalidateApprovalPaths();
}

export async function returnForRevision(reportId: string, comment: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  const role = session.user.role;

  if (role !== "LEADER" && role !== "FINANCE" && role !== "ADMIN") {
    throw new Error("Insufficient permissions to return for revision");
  }

  if (!report.status.includes("PENDING")) {
    throw new Error("Only pending reports can be returned for revision");
  }

  const actorId = session.user.id;

  await prisma.$transaction(async (tx) => {
    await tx.expenseReport.update({
      where: { id: reportId },
      data: { status: "RETURNED" },
    });

    await tx.approvalAction.create({
      data: { reportId, actorId, action: "RETURN", comment },
    });

    await tx.auditLog.create({
      data: {
        entityType: "ExpenseReport",
        entityId: reportId,
        action: "RETURN_FOR_REVISION",
        actorId,
        newData: { status: "RETURNED", returnReason: comment },
      },
    });
  });

  revalidateApprovalPaths();
  revalidatePath("/dashboard/expenses");
}