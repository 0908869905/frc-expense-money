"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ArrowLeft } from "lucide-react"

export default function AboutPage() {
    const { language } = useLanguage()
    const t = (zh: string, en: string) => language === "zh" ? zh : en

    return (
        <div className="min-h-screen bg-black text-white">
            {/* Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center bg-black/80 backdrop-blur-sm">
                <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" />
                    {t("返回", "Back")}
                </Link>
                <LanguageSwitcher />
            </nav>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-6 pt-32 pb-20">
                {/* Header */}
                <header className="mb-20">
                    <p className="text-gray-500 text-sm mb-4">{t("關於", "About")}</p>
                    <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-2">
                        6998
                    </h1>
                    <p className="text-2xl text-gray-400 tracking-widest">UNIPARDS</p>
                </header>

                {/* Intro */}
                <section className="mb-16">
                    <p className="text-lg text-gray-300 leading-relaxed">
                        {t(
                            "我們是來自台南南科實中的 FRC 機器人團隊，也是台灣首間公立學校同時推動 FLL、FTC、FRC 三項 FIRST 計畫的學校。",
                            "We are an FRC robotics team from National Nanke International Experimental High School in Tainan — the first public school in Taiwan to run FLL, FTC, and FRC programs simultaneously."
                        )}
                    </p>
                </section>

                {/* Timeline */}
                <section className="mb-20">
                    <h2 className="text-sm text-gray-500 uppercase tracking-widest mb-8">
                        {t("歷程", "Timeline")}
                    </h2>
                    
                    <div className="space-y-12">
                        <TimelineItem 
                            year="2018" 
                            content={t(
                                "在台積電贊助下，南科實中成立 FRC 6998 UNIPARDS，成為新秀隊伍。",
                                "Founded FRC 6998 UNIPARDS at Nanke with TSMC sponsorship as a rookie team."
                            )}
                        />
                        <TimelineItem 
                            year="2019" 
                            content={t(
                                "Hawaii Regional 獲得 Entrepreneurship Award，首次獲得國際賽獎項。",
                                "Won the Entrepreneurship Award at Hawaii Regional — our first international award."
                            )}
                        />
                        <TimelineItem 
                            year="2022" 
                            content={t(
                                "New Taipei City Regional 獲 Chairman's Award 及 Quality Award，首次進入 FIRST Championship。",
                                "Earned Chairman's Award and Quality Award at NTPC Regional, advancing to FIRST Championship."
                            )}
                        />
                        <TimelineItem 
                            year="2023" 
                            content={t(
                                "Monterey Bay Regional Winner。世錦賽獲 Industrial Design Award (GM)，並獲教育部「創新教育領導獎」。",
                                "Regional Winners at Monterey Bay. Won Industrial Design Award at Worlds. Received Ministry of Education Innovation Award."
                            )}
                        />
                        <TimelineItem 
                            year="2024" 
                            content={t(
                                "Central Valley Regional 獲 Team Sustainability Award (Dow)。",
                                "Received Team Sustainability Award at Central Valley Regional."
                            )}
                        />
                        <TimelineItem 
                            year="2025" 
                            content={t(
                                "New Taipei City Regional 獲 Woodie Flowers Finalist Award（劉老師）。",
                                "Woodie Flowers Finalist Award at NTPC Regional — presented to mentor Yun-Shan Liu."
                            )}
                        />
                    </div>
                </section>

                {/* Quick Facts */}
                <section className="mb-20 py-8 border-y border-gray-800">
                    <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-400">
                        <span>{t("台南市", "Tainan, Taiwan")}</span>
                        <span>•</span>
                        <span>{t("成立於 2018", "Since 2018")}</span>
                        <span>•</span>
                        <span>{t("台積電贊助", "TSMC Sponsored")}</span>
                        <span>•</span>
                        <span>{t("10 項獎項", "10 Awards")}</span>
                    </div>
                </section>

                {/* Social Links */}
                <section className="mb-20">
                    <h2 className="text-sm text-gray-500 uppercase tracking-widest mb-6">
                        {t("追蹤我們", "Follow Us")}
                    </h2>
                    <div className="flex flex-wrap gap-4">
                        <SocialLink href="https://www.instagram.com/frc_6998/" label="Instagram" />
                        <SocialLink href="https://www.facebook.com/frc6998" label="Facebook" />
                        <SocialLink href="https://github.com/frc-6998" label="GitHub" />
                        <SocialLink href="https://www.youtube.com/@frc-fx4ig" label="YouTube" />
                    </div>
                </section>

                {/* CTA */}
                <section className="text-center py-12">
                    <Link 
                        href="/login"
                        className="inline-block px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-gray-200 transition-colors"
                    >
                        {t("進入系統", "Enter System")}
                    </Link>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-900 py-8 px-6">
                <div className="max-w-2xl mx-auto flex justify-between items-center text-sm text-gray-600">
                    <span>© 2025 FRC 6998</span>
                    <div className="flex gap-6">
                        <Link href="/terms" className="hover:text-gray-400">{t("條款", "Terms")}</Link>
                        <Link href="/privacy" className="hover:text-gray-400">{t("隱私", "Privacy")}</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}

function TimelineItem({ year, content }: { year: string; content: string }) {
    return (
        <div className="flex gap-6">
            <span className="text-sm text-gray-600 font-mono w-12 flex-shrink-0 pt-1">{year}</span>
            <p className="text-gray-300 leading-relaxed">{content}</p>
        </div>
    )
}

function SocialLink({ href, label }: { href: string; label: string }) {
    return (
        <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-gray-800 rounded-full text-sm text-gray-400 hover:text-white hover:border-gray-600 transition-colors"
        >
            {label}
        </a>
    )
}
