"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { ArrowLeft } from "lucide-react"
import { useLanguage } from "@/lib/language-context"
import { useOrganization } from "@/lib/organization-context"

export default function PrivacyPage() {
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
                    {language === "zh" ? "隱私政策" : "Privacy Policy"}
                </h1>

                <div className="prose prose-invert max-w-none space-y-6">
                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "1. 資料收集" : "1. Data Collection"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? `使用 ${org.name} 報帳系統時，我們會收集以下資訊：`
                                : `When using the ${org.name} Expense System, we collect the following information:`
                            }
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                            <li>{language === "zh" ? "帳號資訊：姓名、電子郵件、密碼（加密儲存）" : "Account information: name, email, password (encrypted)"}</li>
                            <li>{language === "zh" ? "報帳資料：費用明細、日期、類別、說明" : "Expense data: expense details, dates, categories, descriptions"}</li>
                            <li>{language === "zh" ? "收據圖片：您上傳的發票或收據影像" : "Receipt images: invoices or receipts you upload"}</li>
                            <li>{language === "zh" ? "使用紀錄：登入時間、操作記錄（用於審計）" : "Usage logs: login times, operation records (for auditing)"}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "2. 資料用途" : "2. Data Usage"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "我們收集的資料僅用於以下目的："
                                : "The data we collect is used only for the following purposes:"
                            }
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                            <li>{language === "zh" ? "處理和管理您的報帳申請" : "Processing and managing your expense claims"}</li>
                            <li>{language === "zh" ? "身份驗證和帳號安全" : "Identity verification and account security"}</li>
                            <li>{language === "zh" ? "團隊財務記錄和報表生成" : "Team financial records and report generation"}</li>
                            <li>{language === "zh" ? "系統改進和問題排除" : "System improvement and troubleshooting"}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "3. 資料儲存與安全" : "3. Data Storage & Security"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "您的資料儲存於安全的雲端伺服器。我們採用以下安全措施保護您的資料："
                                : "Your data is stored on secure cloud servers. We employ the following security measures to protect your data:"
                            }
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                            <li>{language === "zh" ? "密碼使用 bcrypt 加密儲存" : "Passwords are encrypted using bcrypt"}</li>
                            <li>{language === "zh" ? "所有傳輸使用 HTTPS 加密" : "All transmissions use HTTPS encryption"}</li>
                            <li>{language === "zh" ? "定期資料備份" : "Regular data backups"}</li>
                            <li>{language === "zh" ? "存取權限控管" : "Access control management"}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "4. 資料分享" : "4. Data Sharing"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "我們不會將您的個人資料出售或分享給第三方，除非："
                                : "We do not sell or share your personal data with third parties, except:"
                            }
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                            <li>{language === "zh" ? "獲得您的明確同意" : "With your explicit consent"}</li>
                            <li>{language === "zh" ? "法律要求時" : "When required by law"}</li>
                            <li>{language === "zh" ? "與團隊財務管理相關的必要分享（僅限授權人員）" : "Necessary sharing related to team financial management (authorized personnel only)"}</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "5. Cookie 使用" : "5. Cookie Usage"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "本系統使用必要的 Cookie 來維持您的登入狀態和系統偏好設定。這些 Cookie 對於系統正常運作是必需的。"
                                : "The System uses essential cookies to maintain your login status and system preferences. These cookies are necessary for the proper functioning of the System."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "6. 您的權利" : "6. Your Rights"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "您擁有以下權利："
                                : "You have the following rights:"
                            }
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-2 mt-2">
                            <li>{language === "zh" ? "查看和更新您的個人資料" : "View and update your personal information"}</li>
                            <li>{language === "zh" ? "請求刪除您的帳號和相關資料" : "Request deletion of your account and related data"}</li>
                            <li>{language === "zh" ? "獲取您資料的副本" : "Obtain a copy of your data"}</li>
                        </ul>
                        <p className="text-muted-foreground leading-relaxed mt-2">
                            {language === "zh"
                                ? "如需行使上述權利，請聯繫團隊管理員。"
                                : "To exercise the above rights, please contact the team administrator."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "7. 政策更新" : "7. Policy Updates"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "我們可能會不時更新本隱私政策。更新後的政策將在本頁面公布，重大變更時我們會通知您。"
                                : "We may update this Privacy Policy from time to time. Updated policies will be posted on this page, and we will notify you of significant changes."
                            }
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold mb-4">
                            {language === "zh" ? "8. 聯絡我們" : "8. Contact Us"}
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {language === "zh"
                                ? "如對本隱私政策有任何疑問，請聯繫團隊管理員或財務組。"
                                : "If you have any questions about this Privacy Policy, please contact the team administrator or finance department."
                            }
                        </p>
                    </section>

                    <p className="text-sm text-muted-foreground mt-8 pt-4 border-t">
                        {language === "zh" ? "最後更新：2024 年 12 月" : "Last updated: December 2024"}
                    </p>
                </div>
            </main>
        </div>
    )
}
