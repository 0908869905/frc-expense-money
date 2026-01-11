"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ArrowLeft, Trophy, Users, Lightbulb, Heart, Calendar, MapPin, Building2, Award } from "lucide-react"

// 獎項資料
const ACHIEVEMENTS = [
    { year: "2025", title: "Woodie Flowers Finalist Award", event: "New Taipei City Regional", icon: Award },
    { year: "2024", title: "Team Sustainability Award", event: "Central Valley Regional", icon: Trophy },
    { year: "2023", title: "Regional Engineering Inspiration Award", event: "Monterey Bay Regional", icon: Lightbulb },
    { year: "2023", title: "Industrial Design Award", event: "FIRST Championship", icon: Award },
    { year: "2022", title: "Regional Chairman's Award", event: "New Taipei City Regional", icon: Trophy },
    { year: "2022", title: "Quality Award", event: "FIRST Championship", icon: Award },
]

// 核心價值
const VALUES = [
    {
        icon: Lightbulb,
        titleZh: "創新",
        titleEn: "Innovation",
        descZh: "以創意工程解決方案突破技術邊界",
        descEn: "Pushing boundaries with creative engineering solutions",
    },
    {
        icon: Users,
        titleZh: "團隊合作",
        titleEn: "Collaboration",
        descZh: "相信團隊的力量大於個人",
        descEn: "Believing in the power of teamwork",
    },
    {
        icon: Heart,
        titleZh: "回饋社區",
        titleEn: "Community",
        descZh: "透過 STEAM 教育啟發下一代",
        descEn: "Inspiring the next generation through STEAM",
    },
]

// 統計數據
const STATS = [
    { value: "2018", labelZh: "成立年份", labelEn: "Founded" },
    { value: "12+", labelZh: "參賽場次", labelEn: "Events" },
    { value: "10", labelZh: "累積獎項", labelEn: "Awards" },
    { value: "20+", labelZh: "指導隊伍", labelEn: "Teams Mentored" },
]

export default function AboutPage() {
    const { language } = useLanguage()
    const t = (zh: string, en: string) => language === "zh" ? zh : en

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/50 backdrop-blur-lg border-b border-white/5">
                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">{t("返回首頁", "Back")}</span>
                </Link>
                <LanguageSwitcher />
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center px-6 pt-20">
                {/* Background Effects */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px]">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/30 via-blue-600/20 to-cyan-500/10 blur-[120px] animate-pulse" />
                    </div>
                    <div className="absolute top-20 right-20 w-64 h-64 rounded-full bg-purple-500/20 blur-[100px]" />
                    <div className="absolute bottom-20 left-20 w-48 h-48 rounded-full bg-blue-500/20 blur-[80px]" />
                </div>

                {/* Hero Content */}
                <div className="relative z-10 text-center max-w-4xl mx-auto">
                    <div className="mb-8">
                        <span className="inline-block px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 mb-8">
                            {t("關於我們", "About Us")}
                        </span>
                    </div>
                    
                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none mb-4">
                        <span className="bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                            FRC
                        </span>
                    </h1>
                    <h1 className="text-7xl md:text-9xl font-black tracking-tighter leading-none mb-6">
                        <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                            6998
                        </span>
                    </h1>
                    <p className="text-2xl md:text-3xl tracking-[0.4em] text-gray-300 uppercase font-light mb-8">
                        UNIPARDS
                    </p>
                    <p className="text-lg text-gray-500 max-w-xl mx-auto italic">
                        "Building Dreams, One Robot at a Time"
                    </p>
                </div>

                {/* Scroll Indicator */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-gray-500">
                    <span className="text-xs tracking-wider">{t("向下滾動", "SCROLL")}</span>
                    <div className="w-px h-8 bg-gradient-to-b from-gray-500 to-transparent animate-pulse" />
                </div>
            </section>

            {/* Team Story Section */}
            <section className="relative py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        {/* Left: Info Cards */}
                        <div className="space-y-6">
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="p-3 rounded-xl bg-purple-500/20">
                                        <Calendar className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold">{t("成立時間", "Founded")}</h3>
                                </div>
                                <p className="text-3xl font-bold text-white">2018</p>
                            </div>
                            
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="p-3 rounded-xl bg-blue-500/20">
                                        <MapPin className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold">{t("所在地", "Location")}</h3>
                                </div>
                                <p className="text-xl font-medium text-white">{t("台南市，台灣", "Tainan, Taiwan")}</p>
                            </div>
                            
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all group">
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="p-3 rounded-xl bg-cyan-500/20">
                                        <Building2 className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold">{t("所屬學校", "School")}</h3>
                                </div>
                                <p className="text-lg text-white">{t("國立南科國際實驗高級中學", "National Nanke International Experimental High School")}</p>
                            </div>
                        </div>

                        {/* Right: Story Text */}
                        <div>
                            <h2 className="text-4xl md:text-5xl font-bold mb-8">
                                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                    {t("我們的故事", "Our Story")}
                                </span>
                            </h2>
                            <div className="space-y-6 text-gray-300 leading-relaxed">
                                <p>
                                    {t(
                                        "FRC 6998 UNIPARDS 是台灣首間公立學校同時推動 FLL、FTC 及 FRC 計畫的先驅團隊。自 2018 年成立以來，我們在全球 FIRST 機器人競賽中屢創佳績。",
                                        "FRC 6998 UNIPARDS is the pioneer team from the first public school in Taiwan to implement FLL, FTC, and FRC programs. Since our founding in 2018, we have achieved remarkable success in global FIRST Robotics Competition."
                                    )}
                                </p>
                                <p>
                                    {t(
                                        "在台積電 (TSMC) 的支持下，我們不僅追求競賽卓越，更致力於透過「STEAM from seed」計畫將科技教育帶入偏鄉，啟發更多學生對 STEAM 的熱情。",
                                        "With the support of TSMC, we not only pursue excellence in competition but also dedicate ourselves to bringing tech education to underserved communities through our 'STEAM from seed' initiative."
                                    )}
                                </p>
                                <div className="pt-4">
                                    <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-sm">
                                        <Trophy className="w-4 h-4 text-yellow-400" />
                                        {t("2 次 FIRST 世界錦標賽", "2x FIRST Championship")}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Achievements Section */}
            <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-clip-text text-transparent">
                                {t("榮耀時刻", "Achievements")}
                            </span>
                        </h2>
                        <p className="text-gray-400">{t("累積 10 項國際賽事獎項", "10 International Awards & Counting")}</p>
                    </div>

                    {/* Achievement Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ACHIEVEMENTS.map((award, i) => (
                            <div 
                                key={i}
                                className="group p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:bg-white/10 transition-all duration-300 hover:scale-105"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20 group-hover:from-yellow-500/30 group-hover:to-orange-500/30 transition-all">
                                        <award.icon className="w-6 h-6 text-yellow-400" />
                                    </div>
                                    <div className="flex-1">
                                        <span className="text-sm text-purple-400 font-medium">{award.year}</span>
                                        <h3 className="text-lg font-semibold text-white mt-1 leading-tight">{award.title}</h3>
                                        <p className="text-sm text-gray-500 mt-2">{award.event}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="relative py-32 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                {t("核心價值", "Our Values")}
                            </span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {VALUES.map((value, i) => (
                            <div 
                                key={i}
                                className="text-center p-8 rounded-3xl bg-gradient-to-b from-white/5 to-transparent border border-white/10 hover:border-cyan-500/30 transition-all group"
                            >
                                <div className="inline-flex p-5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mb-6 group-hover:scale-110 transition-transform">
                                    <value.icon className="w-8 h-8 text-cyan-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3">
                                    {t(value.titleZh, value.titleEn)}
                                </h3>
                                <p className="text-gray-400">
                                    {t(value.descZh, value.descEn)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="relative py-32 px-6 bg-gradient-to-b from-transparent via-blue-950/20 to-black">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {STATS.map((stat, i) => (
                            <div key={i} className="text-center">
                                <p className="text-5xl md:text-6xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </p>
                                <p className="text-gray-400 text-sm tracking-wider uppercase">
                                    {t(stat.labelZh, stat.labelEn)}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-20 px-6">
                <div className="max-w-2xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-6">{t("加入我們的旅程", "Join Our Journey")}</h2>
                    <p className="text-gray-400 mb-8">
                        {t(
                            "無論是贊助、合作或只是想認識我們，都歡迎與我們聯繫！",
                            "Whether for sponsorship, collaboration, or just to say hello - we'd love to hear from you!"
                        )}
                    </p>
                    <Link 
                        href="/login"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white text-black font-semibold hover:bg-gray-100 transition-all hover:scale-105"
                    >
                        {t("進入系統", "Get Started")}
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-8 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-500">
                        © 2025 FRC 6998 UNIPARDS. {t("保留所有權利。", "All rights reserved.")}
                    </p>
                    <div className="flex gap-6 text-sm text-gray-500">
                        <Link href="/terms" className="hover:text-white transition-colors">{t("服務條款", "Terms")}</Link>
                        <Link href="/privacy" className="hover:text-white transition-colors">{t("隱私政策", "Privacy")}</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
