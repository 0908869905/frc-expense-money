"use client";

import { useEffect } from "react";
import { useOrganization } from "@/lib/organization-context";

/**
 * 動態應用主題 class 到 body 元素
 * 根據當前組織切換 theme-frc / theme-family
 */
export function ThemeApplier() {
    const { org } = useOrganization();

    useEffect(() => {
        // 移除所有主題 class
        document.body.classList.remove("theme-frc", "theme-family");
        // 添加當前主題 class
        document.body.classList.add(org.themeClass);
    }, [org.themeClass]);

    return null;
}
