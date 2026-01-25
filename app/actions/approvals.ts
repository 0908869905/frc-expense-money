"use server";

import { prisma } from "@/lib/prisma";
import { ReportStatus } from "@prisma/client";
import { requireAuth, revalidateApprovals, revalidateExpenses } from "@/lib/actions/helpers";

export async function approveReport(reportId: string): Promise<void> {
  const ctx = await requireAuth();

  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  const role = ctx.userRole;
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

  await prisma.$transaction(async (tx) => {
    await tx.expenseReport.update({
      where: { id: reportId },
      data: { status: nextStatus },
    });

    await tx.approvalAction.create({
      data: { reportId, actorId: ctx.userId, action: "APPROVE" },
    });

    await tx.auditLog.create({
      data: {
        entityType: "ExpenseReport",
        entityId: reportId,
        action: "APPROVE",
        actorId: ctx.userId,
        newData: { status: nextStatus },
      },
    });
  });

  revalidateApprovals();
}

export async function rejectReport(reportId: string, comment: string): Promise<void> {
  const ctx = await requireAuth();

  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  // 驗證報帳單狀態與角色權限
  if (report.status === "PENDING_MANAGER") {
    if (ctx.userRole !== "LEADER" && ctx.userRole !== "ADMIN") {
      throw new Error("Only Leaders can reject at this stage");
    }
  } else if (report.status === "PENDING_FINANCE") {
    if (ctx.userRole !== "FINANCE" && ctx.userRole !== "ADMIN") {
      throw new Error("Only Finance can reject at this stage");
    }
  } else {
    throw new Error("Report cannot be rejected in its current state");
  }

  await prisma.$transaction(async (tx) => {
    await tx.expenseReport.update({
      where: { id: reportId },
      data: { status: "REJECTED" },
    });

    await tx.approvalAction.create({
      data: { reportId, actorId: ctx.userId, action: "REJECT", comment },
    });

    await tx.auditLog.create({
      data: {
        entityType: "ExpenseReport",
        entityId: reportId,
        action: "REJECT",
        actorId: ctx.userId,
        newData: { status: "REJECTED", rejectionReason: comment },
      },
    });
  });

  revalidateApprovals();
}

export async function returnForRevision(reportId: string, comment: string): Promise<void> {
  const ctx = await requireAuth();

  const report = await prisma.expenseReport.findUnique({
    where: { id: reportId },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  if (ctx.userRole !== "LEADER" && ctx.userRole !== "FINANCE" && ctx.userRole !== "ADMIN") {
    throw new Error("Insufficient permissions to return for revision");
  }

  if (!report.status.includes("PENDING")) {
    throw new Error("Only pending reports can be returned for revision");
  }

  await prisma.$transaction(async (tx) => {
    await tx.expenseReport.update({
      where: { id: reportId },
      data: { status: "RETURNED" },
    });

    await tx.approvalAction.create({
      data: { reportId, actorId: ctx.userId, action: "RETURN", comment },
    });

    await tx.auditLog.create({
      data: {
        entityType: "ExpenseReport",
        entityId: reportId,
        action: "RETURN_FOR_REVISION",
        actorId: ctx.userId,
        newData: { status: "RETURNED", returnReason: comment },
      },
    });
  });

  revalidateApprovals();
  revalidateExpenses();
}