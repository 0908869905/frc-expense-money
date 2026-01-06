"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { compare, hash } from "bcryptjs";
import { z } from "zod";

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "請輸入目前密碼"),
    newPassword: z.string().min(6, "新密碼至少需要 6 個字元"),
    confirmPassword: z.string().min(1, "請確認新密碼"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "新密碼與確認密碼不一致",
    path: ["confirmPassword"],
});

export type ChangePasswordState = {
    success: boolean;
    message: string | null;
    errors?: Record<string, string[]>;
};

export async function changePassword(
    prevState: ChangePasswordState,
    formData: FormData
): Promise<ChangePasswordState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "未授權的操作" };
    }

    const validatedFields = changePasswordSchema.safeParse({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
        confirmPassword: formData.get("confirmPassword"),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: "驗證失敗",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    try {
        // 取得用戶資料
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { password: true },
        });

        if (!user || !user.password) {
            return { success: false, message: "無法驗證用戶" };
        }

        // 驗證目前密碼
        const isCurrentPasswordValid = await compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return { success: false, message: "目前密碼不正確" };
        }

        // 雜湊新密碼並更新
        const hashedNewPassword = await hash(newPassword, 12);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedNewPassword },
        });

        return { success: true, message: "密碼已成功更新" };
    } catch (error) {
        console.error("Change password error:", error);
        return { success: false, message: "更新密碼時發生錯誤" };
    }
}
