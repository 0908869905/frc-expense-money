"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export type NotificationState = {
    success: boolean;
    message: string | null;
};

type NotificationFrequency = "INSTANT" | "DAILY_DIGEST" | "OFF";

export async function updateNotificationFrequency(
    frequency: NotificationFrequency
): Promise<NotificationState> {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "未授權的操作" };
    }

    try {
        await prisma.user.update({
            where: { id: session.user.id },
            data: { notificationFrequency: frequency },
        });

        return { success: true, message: "通知設定已更新" };
    } catch (error) {
        console.error("Update notification frequency error:", error);
        return { success: false, message: "更新通知設定時發生錯誤" };
    }
}

export async function getNotificationFrequency(): Promise<NotificationFrequency> {
    const session = await auth();
    if (!session?.user?.id) {
        return "INSTANT";
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { notificationFrequency: true },
        });

        return (user?.notificationFrequency as NotificationFrequency) || "INSTANT";
    } catch (error) {
        console.error("Get notification frequency error:", error);
        return "INSTANT";
    }
}
