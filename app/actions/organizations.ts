"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// 取得所有組織
export async function getOrganizations() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const organizations = await prisma.organization.findMany({
            orderBy: { name: "asc" },
            include: {
                _count: {
                    select: { members: true, budgets: true },
                },
            },
        });

        return organizations;
    } catch (error) {
        console.error("取得組織失敗:", error);
        return [];
    }
}

// 建立組織
export async function createOrganization(data: {
    name: string;
    slug: string;
    description?: string;
    currency?: string;
}) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    if (session.user.role !== "ADMIN") {
        return { success: false, message: "只有管理員可以建立組織" };
    }

    try {
        // 檢查 slug 是否已存在
        const existing = await prisma.organization.findUnique({
            where: { slug: data.slug },
        });

        if (existing) {
            return { success: false, message: "此識別碼已被使用" };
        }

        const org = await prisma.organization.create({
            data: {
                name: data.name,
                slug: data.slug,
                description: data.description,
                currency: data.currency || "TWD",
            },
        });

        // 將創建者加入為 OWNER
        await prisma.organizationMember.create({
            data: {
                organizationId: org.id,
                userId: session.user.id,
                role: "OWNER",
            },
        });

        revalidatePath("/dashboard/organizations");
        return { success: true, organization: org };
    } catch (error) {
        console.error("建立組織失敗:", error);
        return { success: false, message: "建立失敗" };
    }
}

// 新增成員到組織
export async function addOrganizationMember(
    organizationId: string,
    userId: string,
    role: string = "MEMBER"
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        await prisma.organizationMember.create({
            data: {
                organizationId,
                userId,
                role,
            },
        });

        revalidatePath("/dashboard/organizations");
        return { success: true };
    } catch (error) {
        console.error("新增成員失敗:", error);
        return { success: false, message: "新增失敗" };
    }
}

// 移除成員
export async function removeOrganizationMember(
    organizationId: string,
    userId: string
) {
    const session = await auth();
    if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
    }

    try {
        await prisma.organizationMember.delete({
            where: {
                organizationId_userId: {
                    organizationId,
                    userId,
                },
            },
        });

        revalidatePath("/dashboard/organizations");
        return { success: true };
    } catch (error) {
        console.error("移除成員失敗:", error);
        return { success: false, message: "移除失敗" };
    }
}

// 取得用戶的組織
export async function getMyOrganizations() {
    const session = await auth();
    if (!session?.user?.id) {
        return [];
    }

    try {
        const memberships = await prisma.organizationMember.findMany({
            where: { userId: session.user.id },
            include: {
                organization: true,
            },
        });

        return memberships.map((m) => ({
            ...m.organization,
            role: m.role,
        }));
    } catch (error) {
        console.error("取得用戶組織失敗:", error);
        return [];
    }
}
