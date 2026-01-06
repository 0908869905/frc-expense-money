"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useOrganization } from "@/lib/organization-context"

export default function TermsPage() {
    const { language } = useLanguage()
    const { org } = useOrganization()

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
                <div className="container flex h-16 items-center px-4 md:px-6">
                    <Link href="/" className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            {language === "zh" ? "返回首頁" : "Back to Home"}
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Content */}
            <main className="container max-w-4xl py-12 px-4 md:px-6">
                <h1 className="text-3xl font-bold mb-8">
                    {language === "zh" ? "服務條款" : "Terms of Service"}
                </h1>

                <div className="prose prose-invert max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "1. 服務說明" : "1. Service Description"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? `${org.name} 報帳系統（以下簡稱「本系統」）是專為 FRC 機器人競賽團隊設計的內部費用報銷管理平台。本系統提供費用申報、審核、追蹤等功能，僅供團隊成員內部使用。`
                                : `The ${org.name} Expense System (hereinafter referred to as "the System") is an internal expense reimbursement management platform designed for FRC robotics competition teams. The System provides expense submission, approval, and tracking functions for internal team use only.`
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "2. 使用資格" : "2. Eligibility"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "本系統僅供經團隊管理員授權的成員使用。使用者必須提供真實、準確的個人資訊進行註冊。未經授權的訪問或使用將被禁止。"
                                : "The System is only available to members authorized by team administrators. Users must provide true and accurate personal information for registration. Unauthorized access or use is prohibited."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "3. 使用者責任" : "3. User Responsibilities"}
                        </h2>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2">
                            <li>{language === "zh" ? "妥善保管帳號密碼，不得與他人共享" : "Safeguard account credentials and do not share with others"}</li>
                            <li>{language === "zh" ? "提交真實、準確的報帳資料" : "Submit true and accurate expense information"}</li>
                            <li>{language === "zh" ? "上傳清晰可辨識的收據或發票" : "Upload clear and legible receipts or invoices"}</li>
                            <li>{language === "zh" ? "遵守團隊的財務報銷政策" : "Comply with team financial reimbursement policies"}</li>
                            <li>{language === "zh" ? "不得進行任何欺詐或虛假報帳行為" : "Do not engage in any fraudulent or false expense claims"}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "4. 系統使用規範" : "4. System Usage Rules"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "使用者不得嘗試破解、干擾或破壞系統的正常運作。任何惡意行為將導致帳號停用，並可能追究相關責任。"
                                : "Users must not attempt to hack, interfere with, or disrupt the normal operation of the System. Any malicious behavior will result in account suspension and may lead to further consequences."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "5. 智慧財產權" : "5. Intellectual Property"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "本系統的所有內容、設計、程式碼及商標均為團隊所有。未經書面許可，不得複製、修改或分發。"
                                : "All content, design, code, and trademarks of the System are owned by the team. Reproduction, modification, or distribution without written permission is prohibited."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "6. 免責聲明" : "6. Disclaimer"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "本系統按「現狀」提供，不對系統的持續可用性或無錯誤運行作出保證。團隊不對因系統使用而產生的任何直接或間接損失負責。"
                                : "The System is provided \"as is\" without warranty of continuous availability or error-free operation. The team is not responsible for any direct or indirect damages arising from the use of the System."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "7. 條款修改" : "7. Modifications"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "團隊保留隨時修改本服務條款的權利。修改後的條款將在本頁面公布，繼續使用本系統即表示接受修改後的條款。"
                                : "The team reserves the right to modify these Terms of Service at any time. Modified terms will be posted on this page, and continued use of the System constitutes acceptance of the modified terms."
                            }
                        </p>
                    </section>

                    <p className="text-sm text-muted-foreground mt-8 pt-4 border-t">
                        {language === "zh" ? "最後更新：2026/01/06" : "Last updated: 2026/01/06"}
                    </p>
                </div>
            </main>
        </div>
    )
}
