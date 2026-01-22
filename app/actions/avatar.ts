"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type AvatarState = {
    success: boolean;
    message: string | null;
    imageUrl?: string;
};

const MAX_IMAGE_SIZE_BYTES = 500 * 1024;

async function getAuthenticatedUserId(): Promise<string | null> {
    const session = await auth();
    return session?.user?.id ?? null;
}

export async function uploadAvatar(imageBase64: string): Promise<AvatarState> {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
        return { success: false, message: "未授權的操作" };
    }

    if (!imageBase64.startsWith("data:image/")) {
        return { success: false, message: "無效的圖片格式" };
    }

    const base64Data = imageBase64.split(",")[1];
    const sizeInBytes = (base64Data.length * 3) / 4;

    if (sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
        return { success: false, message: "圖片大小不能超過 500KB" };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { image: imageBase64 },
        });

        return { success: true, message: "頭像已更新", imageUrl: imageBase64 };
    } catch (error) {
        console.error("Upload avatar error:", error);
        return { success: false, message: "上傳頭像時發生錯誤" };
    }
}

export async function removeAvatar(): Promise<AvatarState> {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
        return { success: false, message: "未授權的操作" };
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { image: null },
        });

        return { success: true, message: "頭像已移除" };
    } catch (error) {
        console.error("Remove avatar error:", error);
        return { success: false, message: "移除頭像時發生錯誤" };
    }
}
