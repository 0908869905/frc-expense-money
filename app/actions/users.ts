"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { TeamDepartment } from "@prisma/client"
import { validatePassword } from "@/lib/schemas"
import { requireAdmin as baseRequireAdmin, revalidateUsers } from "@/lib/actions/helpers"

type UserRole = "USER" | "VICE_LEADER" | "LEADER" | "FINANCE" | "ADMIN";

async function requireAdmin(): Promise<string> {
    const ctx = await baseRequireAdmin()
    return ctx.userId
}

export async function getUsers() {
    await requireAdmin()

    return prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            emailVerified: true,
            createdAt: true,
            _count: { select: { expenseReports: true } }
        },
        orderBy: { createdAt: "desc" }
    })
}

export async function updateUserRole(userId: string, role: UserRole): Promise<{ success: boolean }> {
    const adminId = await requireAdmin()

    if (userId === adminId) {
        throw new Error("Cannot change your own role")
    }

    await prisma.user.update({
        where: { id: userId },
        data: { role }
    })

    revalidateUsers()
    return { success: true }
}

export async function updateUserDepartment(
    userId: string,
    department: string | null
): Promise<{ success: boolean }> {
    await requireAdmin()

    await prisma.user.update({
        where: { id: userId },
        data: { department: department as TeamDepartment | null }
    })

    revalidateUsers()
    return { success: true }
}

export async function updateUserEmail(userId: string, email: string): Promise<{ success: boolean }> {
    await requireAdmin()

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

    revalidateUsers()
    return { success: true }
}

export async function updateUserPassword(userId: string, password: string): Promise<{ success: boolean }> {
    await requireAdmin()

    const validation = validatePassword(password)
    if (!validation.valid) {
        throw new Error(validation.message)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword }
    })

    revalidateUsers()
    return { success: true }
}

export async function verifyUserEmail(userId: string): Promise<{ success: boolean }> {
    await requireAdmin()

    await prisma.user.update({
        where: { id: userId },
        data: { emailVerified: new Date() }
    })

    revalidateUsers()
    return { success: true }
}

export async function deleteUser(userId: string): Promise<{ success: boolean }> {
    const adminId = await requireAdmin()

    if (userId === adminId) {
        throw new Error("Cannot delete yourself")
    }

    try {
        await prisma.$transaction(async (tx) => {
            await tx.expenseItem.deleteMany({
                where: { report: { submitterId: userId } }
            })

            await tx.approvalAction.deleteMany({ where: { actorId: userId } })

            await tx.approvalAction.deleteMany({
                where: { report: { submitterId: userId } }
            })

            await tx.expenseReport.deleteMany({ where: { submitterId: userId } })

            await tx.auditLog.deleteMany({ where: { actorId: userId } })

            await tx.account.deleteMany({ where: { userId } })

            await tx.session.deleteMany({ where: { userId } })

            await tx.user.delete({ where: { id: userId } })
        })

        revalidateUsers()
        return { success: true }
    } catch (error) {
        console.error("Delete user error:", error)
        throw new Error("Failed to delete user. User may have associated data.")
    }
}
