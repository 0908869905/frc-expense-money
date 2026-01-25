"use server";

import { prisma } from "@/lib/prisma";
import { getAuthenticatedUserId, unauthorizedState, successState, errorState } from "@/lib/actions/helpers";

export type NotificationState = {
    success: boolean;
    message: string | null;
};

type NotificationFrequency = "INSTANT" | "DAILY_DIGEST" | "OFF";

const DEFAULT_FREQUENCY: NotificationFrequency = "INSTANT";

export async function updateNotificationFrequency(
    frequency: NotificationFrequency
): Promise<NotificationState> {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
        return unauthorizedState() as NotificationState;
    }

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { notificationFrequency: frequency },
        });

        return successState("通知設定已更新") as NotificationState;
    } catch (error) {
        console.error("Update notification frequency error:", error);
        return errorState("更新通知設定時發生錯誤") as NotificationState;
    }
}

export async function getNotificationFrequency(): Promise<NotificationFrequency> {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
        return DEFAULT_FREQUENCY;
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { notificationFrequency: true },
        });

        return (user?.notificationFrequency as NotificationFrequency) ?? DEFAULT_FREQUENCY;
    } catch (error) {
        console.error("Get notification frequency error:", error);
        return DEFAULT_FREQUENCY;
    }
}
