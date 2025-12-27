"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"

// Get all users (Admin only)
export async function getUsers() {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            _count: {
                select: { expenseReports: true }
            }
        },
        orderBy: { createdAt: "desc" }
    })
}

// Update user role
export async function updateUserRole(userId: string, role: "USER" | "VICE_LEADER" | "LEADER" | "FINANCE" | "ADMIN") {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    // Prevent admin from changing their own role
    if (userId === session.user.id) {
        throw new Error("Cannot change your own role")
    }

    await prisma.user.update({
        where: { id: userId },
        data: { role }
    })

    revalidatePath("/dashboard/users")
    return { success: true }
}

// Update user department
export async function updateUserDepartment(userId: string, department: string | null) {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    await prisma.user.update({
        where: { id: userId },
        data: { department: department as any }
    })

    revalidatePath("/dashboard/users")
    return { success: true }
}

// Update user email
export async function updateUserEmail(userId: string, email: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    // Check if email already exists
    const existing = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } }
    })
    if (existing) {
        throw new Error("Email already in use")
    }

    await prisma.user.update({
        where: { id: userId },
        data: { email }
    })

    revalidatePath("/dashboard/users")
    return { success: true }
}

// Update user password
export async function updateUserPassword(userId: string, password: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    if (password.length < 6) {
        throw new Error("Password must be at least 6 characters")
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    })

    revalidatePath("/dashboard/users")
    return { success: true }
}

// Verify user email
export async function verifyUserEmail(userId: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() }
    })

    revalidatePath("/dashboard/users")
    return { success: true }
}

// Delete user
export async function deleteUser(userId: string) {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
        throw new Error("Unauthorized")
    }

    // Prevent admin from deleting themselves
    if (userId === session.user.id) {
        throw new Error("Cannot delete yourself")
    }

    try {
        // Use transaction to delete all related data first
        await prisma.$transaction(async (tx) => {
            // Delete expense items related to user's reports
            await tx.expenseItem.deleteMany({
                where: {
                    report: { submitterId: userId }
                }
            })

            // Delete approval actions by user
            await tx.approvalAction.deleteMany({
                where: { actorId: userId }
            })

            // Delete approval actions on user's reports
            await tx.approvalAction.deleteMany({
                where: {
                    report: { submitterId: userId }
                }
            })

            // Delete user's expense reports
            await tx.expenseReport.deleteMany({
                where: { submitterId: userId }
            })

            // Delete audit logs by user
            await tx.auditLog.deleteMany({
                where: { actorId: userId }
            })

            // Delete user's accounts (OAuth)
            await tx.account.deleteMany({
                where: { userId }
            })

            // Delete user's sessions
            await tx.session.deleteMany({
                where: { userId }
            })

            // Finally delete the user
            await tx.user.delete({
                where: { id: userId }
            })
        })

        revalidatePath("/dashboard/users")
        return { success: true }
    } catch (error) {
        console.error("Delete user error:", error)
        throw new Error("Failed to delete user. User may have associated data.")
    }
}
