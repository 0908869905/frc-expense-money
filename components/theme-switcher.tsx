"use client";

import { useTheme, THEMES, ThemeId } from "@/lib/theme-context";
import { useLanguage } from "@/lib/language-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface ThemeSwitcherProps {
    className?: string;
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
    const { themeId, setTheme } = useTheme();
    const { language } = useLanguage();

    const t = (zh: string, en: string) => language === "zh" ? zh : en;

    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>{t("系統主題", "System Theme")}</CardTitle>
                <CardDescription>
                    {t("選擇系統的品牌外觀（僅限管理員）", "Choose the branding appearance (Admin only)")}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                    {Object.entries(THEMES).map(([id, theme]) => (
                        <button
                            key={id}
                            onClick={() => setTheme(id as ThemeId)}
                            className={cn(
                                "relative flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all hover:bg-muted/50",
                                themeId === id
                                    ? "border-primary bg-primary/5"
                                    : "border-muted"
                            )}
                        >
                            {/* 選中標記 */}
                            {themeId === id && (
                                <div className="absolute top-2 right-2 rounded-full bg-primary p-1">
                                    <Check className="h-3 w-3 text-primary-foreground" />
                                </div>
                            )}

                            {/* Logo 預覽 */}
                            <div className={cn(
                                "flex h-16 w-16 items-center justify-center rounded-xl",
                                theme.bgColor
                            )}>
                                <img
                                    src={theme.logo}
                                    alt={theme.name}
                                    className="h-12 w-12 object-contain"
                                />
                            </div>

                            {/* 主題名稱 */}
                            <div className="text-center">
                                <div className="font-semibold">{theme.name}</div>
                                <div className="text-xs text-muted-foreground">{theme.subtitle}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
