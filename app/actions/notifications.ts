"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 建立通知
export async function createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: "INFO" | "WARNING" | "SUCCESS" | "ERROR";
    link?: string;
}) {
    try {
        await prisma.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type || "INFO",
                link: data.link || null,
            },
        });
    } catch (error) {
        console.error("建立通知失敗:", error);
    }
}

// 取得當前用戶的通知
export async function getMyNotifications() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
            take: 20, // 最多取 20 筆
        });

        return notifications;
    } catch (error) {
        console.error("取得通知失敗:", error);
        return [];
    }
}

// 取得未讀通知數量
export async function getUnreadCount() {
    const session = await auth();
    if (!session?.user?.id) {
        return 0;
    }

    try {
        const count = await prisma.notification.count({
            where: {
                userId: session.user.id,
                isRead: false,
            },
        });

        return count;
    } catch (error) {
        console.error("取得未讀數量失敗:", error);
        return 0;
    }
}

// 標記通知為已讀
export async function markAsRead(notificationId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false };
    }

    try {
        await prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId: session.user.id, // 確保只能修改自己的通知
            },
            data: { isRead: true },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("標記已讀失敗:", error);
        return { success: false };
    }
}

// 標記所有通知為已讀
export async function markAllAsRead() {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false };
    }

    try {
        await prisma.notification.updateMany({
            where: {
                userId: session.user.id,
                isRead: false,
            },
            data: { isRead: true },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("標記所有已讀失敗:", error);
        return { success: false };
    }
}

// 刪除通知
export async function deleteNotification(notificationId: string) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false };
    }

    try {
        await prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId: session.user.id,
            },
        });

        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("刪除通知失敗:", error);
        return { success: false };
    }
}
