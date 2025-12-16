"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function approveReport(reportId: string) {
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
  let nextStatus = report.status;

  if (report.status === "PENDING_MANAGER") {
    if (role !== "MANAGER" && role !== "ADMIN") {
      throw new Error("Insufficient permissions: Manager approval required");
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
    // Update Report
    await tx.expenseReport.update({
      where: { id: reportId },
      data: { status: nextStatus },
    });

    // Create Approval Action Log
    await tx.approvalAction.create({
      data: {
        reportId,
        actorId: session.user.id!,
        action: "APPROVE",
      },
    });

    // Create Audit Log
    await tx.auditLog.create({
      data: {
        entityType: "ExpenseReport",
        entityId: reportId,
        action: "APPROVE",
        actorId: session.user.id!,
        newData: { status: nextStatus },
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/approvals");
}

export async function rejectReport(reportId: string, comment: string) {
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

  // Basic permission check
  if (role === "USER") {
    throw new Error("Insufficient permissions to reject");
  }

  // More granular checks based on stage
  if (report.status === "PENDING_MANAGER" && role !== "MANAGER" && role !== "ADMIN") {
      throw new Error("Only Managers can reject at this stage");
  }
  if (report.status === "PENDING_FINANCE" && role !== "FINANCE" && role !== "ADMIN") {
      throw new Error("Only Finance can reject at this stage");
  }

  await prisma.$transaction(async (tx) => {
    // Update Report
    await tx.expenseReport.update({
      where: { id: reportId },
      data: { status: "REJECTED" },
    });

    // Create Approval Action Log
    await tx.approvalAction.create({
      data: {
        reportId,
        actorId: session.user.id!,
        action: "REJECT",
        comment,
      },
    });

    // Create Audit Log
    await tx.auditLog.create({
      data: {
        entityType: "ExpenseReport",
        entityId: reportId,
        action: "REJECT",
        actorId: session.user.id!,
        newData: { status: "REJECTED", rejectionReason: comment },
      },
    });
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/approvals");
}