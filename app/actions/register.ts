"use server"

import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

const registerSchema = z.object({
    name: z.string().min(2, "名稱至少需要 2 個字元"),
    email: z.string().email("請輸入有效的電子郵件"),
    password: z.string().min(6, "密碼至少需要 6 個字元"),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "密碼不一致",
    path: ["confirmPassword"],
})

export type RegisterState = {
    success: boolean
    message: string | null
    errors?: {
        name?: string[]
        email?: string[]
        password?: string[]
        confirmPassword?: string[]
    }
}

export async function registerUser(
    prevState: RegisterState,
    formData: FormData
): Promise<RegisterState> {
    const rawFormData = {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
        confirmPassword: formData.get("confirmPassword") as string,
    }

    // 取得組織 ID（從表單傳入，預設 frc-6998）
    const organizationId = (formData.get("organizationId") as string) || "frc-6998"

    // Validate form data
    const validatedFields = registerSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
        return {
            success: false,
            message: "請修正表單錯誤",
            errors: validatedFields.error.flatten().fieldErrors,
        }
    }

    const { name, email, password } = validatedFields.data

    try {
        // Check if user already exists in the same organization
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                organizationId, // 同一組織內 email 不能重複
            },
        })

        if (existingUser) {
            return {
                success: false,
                message: "此電子郵件已被註冊",
                errors: { email: ["此電子郵件已被註冊"] },
            }
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user with organizationId
        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: "USER",
                organizationId, // 用戶歸屬當前組織
            },
        })

        return {
            success: true,
            message: "註冊成功！請登入",
        }
    } catch (error) {
        console.error("Registration error:", error)
        return {
            success: false,
            message: "註冊失敗，請稍後再試",
        }
    }
}

