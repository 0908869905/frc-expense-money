"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AvatarState = {
    success: boolean;
    message: string | null;
    imageUrl?: string;
};

// 最大圖片大小 500KB (Base64 會比原檔大約 33%)
const MAX_IMAGE_SIZE = 500 * 1024;

export async function uploadAvatar(imageBase64: string): Promise<AvatarState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "未授權的操作" };
    }

    try {
        // 驗證 Base64 格式
        if (!imageBase64.startsWith("data:image/")) {
            return { success: false, message: "無效的圖片格式" };
        }

        // 檢查圖片大小
        const base64Data = imageBase64.split(",")[1];
        const sizeInBytes = (base64Data.length * 3) / 4;
        
        if (sizeInBytes > MAX_IMAGE_SIZE) {
            return { success: false, message: "圖片大小不能超過 500KB" };
        }

        // 更新用戶頭像
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: imageBase64 },
        });

        return { success: true, message: "頭像已更新", imageUrl: imageBase64 };
    } catch (error) {
        console.error("Upload avatar error:", error);
        return { success: false, message: "上傳頭像時發生錯誤" };
    }
}

export async function removeAvatar(): Promise<AvatarState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "未授權的操作" };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { image: null },
        });

        return { success: true, message: "頭像已移除" };
    } catch (error) {
        console.error("Remove avatar error:", error);
        return { success: false, message: "移除頭像時發生錯誤" };
    }
}
