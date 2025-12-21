"use client";

import { useState } from "react";
import { useOrganization, ORGANIZATIONS } from "@/lib/organization-context";
import { useLanguage } from "@/lib/language-context";
import { Home, Building2, X, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export function OrganizationSwitcher() {
    const { org, orgId, switchToFamily, switchToFrc } = useOrganization();
    const { language } = useLanguage();
    const [showModal, setShowModal] = useState(false);
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const t = (zh: string, en: string) => language === "zh" ? zh : en;

    const handleSwitch = () => {
        if (orgId === "frc") {
            // 切換到家庭需要密碼
            setShowModal(true);
            setPassword("");
            setError("");
        } else {
            // 切換回 FRC 不需要密碼
            switchToFrc();
        }
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const success = switchToFamily(password);
        if (success) {
            setShowModal(false);
            setPassword("");
        } else {
            setError(t("密碼錯誤", "Incorrect password"));
        }
    };

    const targetOrg = orgId === "frc" ? ORGANIZATIONS.family : ORGANIZATIONS.frc;

    return (
        <>
            {/* 浮動切換按鈕 */}
            <button
                onClick={handleSwitch}
                className={cn(
                    "fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg transition-all hover:scale-105",
                    orgId === "frc"
                        ? "bg-gradient-to-r from-orange-500 to-teal-500 text-white"
                        : "bg-black text-white"
                )}
            >
                {orgId === "frc" ? (
                    <>
                        <Home className="h-4 w-4" />
                        <span className="text-sm font-medium">{t("切換到家庭", "Switch to Family")}</span>
                    </>
                ) : (
                    <>
                        <Building2 className="h-4 w-4" />
                        <span className="text-sm font-medium">{t("切換到 FRC", "Switch to FRC")}</span>
                    </>
                )}
            </button>

            {/* 密碼輸入 Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="relative w-full max-w-sm rounded-xl bg-card p-6 shadow-2xl">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="mb-4 flex flex-col items-center gap-2">
                            <div className={cn("rounded-full p-3", targetOrg.bgColor)}>
                                <Lock className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold">{t("進入家庭記帳", "Enter Family Expense")}</h3>
                            <p className="text-sm text-muted-foreground text-center">
                                {t("請輸入密碼以切換到家庭記帳系統", "Enter password to switch to Family system")}
                            </p>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t("輸入密碼...", "Enter password...")}
                                    className="w-full rounded-lg border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    autoFocus
                                />
                                {error && (
                                    <p className="mt-1 text-sm text-destructive">{error}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                className="w-full rounded-lg bg-primary py-2 font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                            >
                                {t("確認", "Confirm")}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
