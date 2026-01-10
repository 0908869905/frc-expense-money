import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Shield, ArrowLeft, CheckCircle, Zap, Users, Lock, BarChart, Clock } from "lucide-react"

export default function AboutPage() {
    const features = [
        {
            icon: <Zap className="h-6 w-6" />,
            title: "快速報帳",
            titleEn: "Fast Expense Reporting",
            description: "只需幾分鐘即可提交報帳單，支援收據拍照上傳",
            descriptionEn: "Submit expense reports in minutes with receipt photo upload"
        },
        {
            icon: <Users className="h-6 w-6" />,
            title: "多級審核",
            titleEn: "Multi-level Approval",
            description: "從主管到財務，完整的審核流程確保合規性",
            descriptionEn: "From manager to finance, complete approval workflow ensures compliance"
        },
        {
            icon: <Lock className="h-6 w-6" />,
            title: "安全可靠",
            titleEn: "Secure & Reliable",
            description: "企業級安全防護，資料加密存儲",
            descriptionEn: "Enterprise-grade security with encrypted data storage"
        },
        {
            icon: <BarChart className="h-6 w-6" />,
            title: "即時報表",
            titleEn: "Real-time Reports",
            description: "視覺化報表讓您隨時掌握公司支出狀況",
            descriptionEn: "Visual reports let you monitor company spending anytime"
        },
        {
            icon: <Clock className="h-6 w-6" />,
            title: "快速審批",
            titleEn: "Quick Approval",
            description: "平均審批時間縮短 80%，加速資金週轉",
            descriptionEn: "80% faster approval time, accelerating cash flow"
        },
        {
            icon: <CheckCircle className="h-6 w-6" />,
            title: "自動化流程",
            titleEn: "Automated Workflow",
            description: "自動通知、自動分類、智能匹配政策",
            descriptionEn: "Auto notifications, auto categorization, smart policy matching"
        }
    ]

    return (
        <div className="flex min-h-screen flex-col">
            <header className="px-4 lg:px-6 h-14 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
                <Link className="flex items-center justify-center" href="/">
                    <Shield className="h-6 w-6 mr-2" />
                    <span className="font-bold">ExpenseFlow</span>
                </Link>
                <nav className="ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
                        Sign In
                    </Link>
                </nav>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="w-full py-12 md:py-20 lg:py-28 bg-gradient-to-b from-primary/5 to-background">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="flex flex-col items-center space-y-4 text-center">
                            <Link href="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
                                <ArrowLeft className="h-4 w-4 mr-1" />
                                返回首頁
                            </Link>
                            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                為什麼選擇 ExpenseFlow？
                            </h1>
                            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-lg">
                                我們致力於簡化企業報帳流程，讓財務管理變得更簡單、更高效
                            </p>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="w-full py-12 md:py-20">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                            {features.map((feature, index) => (
                                <div key={index} className="flex flex-col p-6 bg-card rounded-xl border hover:shadow-lg transition-shadow">
                                    <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-primary/10 text-primary mb-4">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground flex-1">{feature.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Stats Section */}
                <section className="w-full py-12 md:py-20 bg-muted/50">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">數字說話</h2>
                            <p className="text-muted-foreground mt-2">我們的客戶信任我們處理他們的財務流程</p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-4">
                            {[
                                { value: "10,000+", label: "活躍用戶" },
                                { value: "500+", label: "企業客戶" },
                                { value: "99.9%", label: "系統穩定度" },
                                { value: "< 24h", label: "平均審批時間" }
                            ].map((stat, index) => (
                                <div key={index} className="text-center">
                                    <p className="text-4xl font-bold text-primary">{stat.value}</p>
                                    <p className="text-muted-foreground mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* How It Works */}
                <section className="w-full py-12 md:py-20">
                    <div className="container px-4 md:px-6 mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl">如何運作</h2>
                            <p className="text-muted-foreground mt-2">只需三個簡單步驟</p>
                        </div>
                        <div className="grid gap-8 md:grid-cols-3">
                            {[
                                { step: "1", title: "提交報帳", description: "填寫費用明細，上傳收據照片" },
                                { step: "2", title: "等待審核", description: "主管和財務會收到通知並進行審核" },
                                { step: "3", title: "完成付款", description: "審核通過後，費用將快速撥付" }
                            ].map((item, index) => (
                                <div key={index} className="flex flex-col items-center text-center">
                                    <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold mb-4">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground">{item.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="w-full py-12 md:py-20 bg-primary text-primary-foreground">
                    <div className="container px-4 md:px-6 mx-auto text-center">
                        <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl mb-4">
                            準備好開始了嗎？
                        </h2>
                        <p className="mx-auto max-w-[500px] mb-6 opacity-90">
                            立即註冊，體驗更高效的報帳流程
                        </p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/register">
                                <Button variant="secondary" className="h-11 px-8">
                                    免費註冊
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="outline" className="h-11 px-8 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                                    登入
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
                <p className="text-xs text-gray-500 dark:text-gray-400">© 2024 ExpenseFlow Inc. All rights reserved.</p>
                <nav className="sm:ml-auto flex gap-4 sm:gap-6">
                    <Link className="text-xs hover:underline underline-offset-4" href="#">Terms of Service</Link>
                    <Link className="text-xs hover:underline underline-offset-4" href="#">Privacy</Link>
                </nav>
            </footer>
        </div>
    )
}
