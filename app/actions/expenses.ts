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

  // Extract complex data structures (React Hook Form will likely pass these as JSON strings if we structure the payload manually, 
  // or we parse standard formData naming conventions. 
  // For robustness with dynamic arrays, we expect a 'data' field containing the JSON string of values)
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

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create the Report
      const report = await tx.expenseReport.create({
        data: {
          title,
          description: description || "",
          submitterId: session.user.id!,
          status: "DRAFT", // Or PENDING_MANAGER depending on business logic
          totalAmount,
          items: {
            create: items.map((item) => ({
              date: item.date,
              category: item.category,
              description: item.description,
              amount: item.amount,
              receiptUrl: item.receiptUrl,
            })),
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