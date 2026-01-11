"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ArrowLeft } from "lucide-react"
import { Playfair_Display, Inter } from "next/font/google"
import { cn } from "@/lib/utils"

// Load Fonts
const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "900"], variable: "--font-serif" })
const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500"], variable: "--font-sans" })

// Noise Texture SVG
const NOISE_SVG = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E`

export default function AboutPage() {
    const { language } = useLanguage()
    const t = (zh: string, en: string) => language === "zh" ? zh : en

    return (
        <div className={cn("min-h-screen bg-[#0a0a0a] text-[#e5e5e5] selection:bg-white selection:text-black", playfair.variable, inter.variable, "font-sans")}>
            
            {/* Noise Overlay */}
            <div 
                className="fixed inset-0 z-50 pointer-events-none mix-blend-overlay opacity-50vh"
                style={{ backgroundImage: `url("${NOISE_SVG}")` }}
            />

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-40 px-6 py-6 md:px-12 flex justify-between items-center mix-blend-difference text-white">
                <Link href="/" className="group flex items-center gap-3 text-sm tracking-widest uppercase hover:opacity-70 transition-opacity">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    {t("返回", "Back")}
                </Link>
                <LanguageSwitcher />
            </nav>

            <main className="relative z-10">
                {/* Hero Section - Magazine Cover Style */}
                <section className="min-h-screen flex flex-col justify-end pb-20 px-6 md:px-12 pt-32 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-white/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                    
                    <div className="max-w-[90vw]">
                        <p className="text-sm md:text-base tracking-[0.2em] text-gray-400 mb-4 ml-2 uppercase">
                            Since 2018 — Tainan, Taiwan
                        </p>
                        <h1 className="font-serif text-[14vw] md:text-[16vw] leading-none font-black tracking-tight text-white mix-blend-difference pb-8">
                            6998
                        </h1>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 md:-mt-4">
                            <h2 className="font-serif text-[8vw] md:text-[6vw] leading-none text-gray-500 italic">
                                Unipards
                            </h2>
                            <p className="max-w-md text-gray-400 text-sm md:text-base leading-relaxed text-justify md:mb-4">
                                {t(
                                    "南科實中首支 FRC 隊伍。我們不只是建造機器人，我們建造夢想，並將 STEM 教育的種子播撒至偏鄉。",
                                    "NNKIEH's first FRC team. We don't just build robots; we build dreams and sow the heavy seeds of STEM education into underserved communities."
                                )}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Sticky Timeline Section */}
                <section className="px-6 md:px-12 py-32 border-t border-white/10">
                    <div className="grid md:grid-cols-12 gap-12">
                        {/* Sticky Header */}
                        <div className="md:col-span-4 relative">
                            <div className="sticky top-32">
                                <h3 className="font-serif text-5xl md:text-6xl mb-4">{t("歷程", "History")}</h3>
                                <p className="text-sm tracking-widest text-gray-500 uppercase">
                                    {t("我們的足跡", "Our Journey")}
                                </p>
                                <div className="mt-12 hidden md:block w-px h-32 bg-gradient-to-b from-white/20 to-transparent" />
                            </div>
                        </div>

                        {/* Timeline Content */}
                        <div className="md:col-span-8 space-y-24">
                            <TimelineEntry 
                                year="2018"
                                title={t("起源", "The Origin")}
                                content={t(
                                    "在國科會的支持下，國立南科國際實驗高級中學成立了 FRC 6998 UNIPARDS。作為全台首間同時推動 FLL、FTC 與 FRC 的公立學校，我們前往 Southern Cross Regional，開啟了這段不凡的旅程。",
                                    "With the support of TSMC, National Nanke International Experimental High School founded FRC 6998 UNIPARDS. As the first public school in Taiwan to run FLL, FTC, and FRC, we competed at the Southern Cross Regional, beginning our extraordinary journey."
                                )}
                            />
                            <TimelineEntry 
                                year="2019"
                                title={t("初試啼聲", "First Echo")}
                                content={t(
                                    "在 Hawaii Regional，我們展現了強大的商業潛力，獲得了 Entrepreneurship Award，這是我們的首個國際獎項，證明了技術與商業思維並重的重要性。",
                                    "At the Hawaii Regional, we demonstrated strong business potential, winning the Entrepreneurship Award—our first international accolade, proving the importance of balancing technology with business acumen."
                                )}
                            />
                            <TimelineEntry 
                                year="2020–2021"
                                title={t("蟄伏", "The Pause")}
                                content={t(
                                    "全球疫情迫使 FRC 賽季取消，但我們並沒有停下腳步。這段期間我們持續精進技術、培訓新血、強化社區推廣，為未來的回歸做好準備。",
                                    "The global pandemic forced the cancellation of FRC seasons, but we never stopped. We continued refining our skills, training new members, and strengthening community outreach, preparing for our return."
                                )}
                            />
                            <TimelineEntry 
                                year="2022"
                                title={t("王者歸來", "The Return")}
                                content={t(
                                    "疫情並沒有澆熄我們的熱情。重返賽場後，我們在 New Taipei City x Hon Hai Regional 斬獲最高榮譽 Regional Chairman's Award 以及 Quality Award，蔡汶鴻老師獲得 Woodie Flowers Finalist Award，並首度取得前往 FIRST Championship 世界錦標賽的門票。",
                                    "The pandemic didn't extinguish our passion. Returning to the field, we clinched the Regional Chairman's Award and Quality Award at the New Taipei City x Hon Hai Regional. Mentor Wen-Hung Tsai received the Woodie Flowers Finalist Award. We secured our first FIRST Championship ticket."
                                )}
                            />
                            <TimelineEntry 
                                year="2023"
                                title={t("世界舞台", "World Stage")}
                                content={t(
                                    "豐收的一年。我們成為 Monterey Bay Regional Winner 並獲得 Engineering Inspiration Award，再次晉級世錦賽。在休士頓奪得 Industrial Design Award。同時榮獲教育部「創新教育領導獎」。",
                                    "A year of harvest. We became Monterey Bay Regional Winners with the Engineering Inspiration Award, qualifying for Worlds again. In Houston, we won the Industrial Design Award. We also received the Ministry of Education's Innovation Leadership Award."
                                )}
                            />
                            <TimelineEntry 
                                year="2024"
                                title={t("永續發展", "Sustainability")}
                                content={t(
                                    "在 Central Valley Regional，我們獲頒 Team Sustainability Award，肯定我們對環境保護與團隊永續經營的承諾。",
                                    "At the Central Valley Regional, we earned the Team Sustainability Award, recognizing our commitment to environmental protection and team sustainability."
                                )}
                            />
                            <TimelineEntry 
                                year="2025"
                                title={t("傳承", "Legacy")}
                                content={t(
                                    "在 New Taipei City Regional，劉昀珊老師獲得 Woodie Flowers Finalist Award，使我們成為台灣第一支擁有兩位獲此殊榮導師的隊伍。這是對卓越教學與啟發的最高肯定，我們帶著使命繼續前進。",
                                    "At the New Taipei City Regional, mentor Yun-Shan Liu received the Woodie Flowers Finalist Award, making us the first team in Taiwan with two mentors receiving this honor. We continue forward with our mission."
                                )}
                            />
                        </div>
                    </div>
                </section>

                {/* Philosophy Section */}
                <section className="py-40 bg-white text-black px-6 md:px-12 relative overflow-hidden">
                    <div className="max-w-5xl mx-auto text-right">
                        <p className="text-sm tracking-widest uppercase mb-6 text-gray-500">
                            {t("核心哲學", "Philosophy")}
                        </p>
                        <h3 className="font-serif text-6xl md:text-8xl font-bold leading-tight mb-8">
                            "Beyond <br/> the <span className="italic text-gray-400">Metal</span>."
                        </h3>
                        <p className="text-xl md:text-2xl text-gray-800 leading-relaxed max-w-2xl ml-auto font-light">
                            {t(
                                "機器人只是載體。我們真正的產品是那些具備解決問題能力、擁有同理心與領導力的未來領袖。",
                                "The robot is just a vehicle. Our true products are future leaders equipped with problem-solving skills, empathy, and leadership."
                            )}
                        </p>
                    </div>
                </section>

                {/* Socials / Footer - Brutalist List Style */}
                <footer className="bg-[#0a0a0a] text-white pt-32 pb-12 px-6 md:px-12 border-t border-white/10">
                    <div className="grid md:grid-cols-2 gap-20 mb-32">
                        <div>
                            <h4 className="font-serif text-4xl mb-8">{t("保持聯繫", "Connect")}</h4>
                            <div className="flex flex-col gap-4">
                                <SocialLink href="mailto:frc6998@ms.nnkieh.tn.edu.tw" label="Email" id="frc6998@ms.nnkieh.tn.edu.tw" />
                                <SocialLink href="https://www.instagram.com/frc_6998/" label="Instagram" id="@frc_6998" />
                                <SocialLink href="https://www.facebook.com/frc6998" label="Facebook" id="frc6998" />
                                <SocialLink href="https://github.com/frc-6998" label="GitHub" id="frc-6998" />
                                <SocialLink href="https://www.youtube.com/@FRC-6998Unipards" label="YouTube" id="@FRC-6998Unipards" />
                            </div>
                        </div>
                        
                        <div className="flex flex-col justify-end">
                             <div className="text-8xl md:text-[10rem] font-serif font-black leading-none opacity-10 select-none">
                                6998
                             </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-end border-t border-white/10 pt-8 gap-4 text-xs tracking-widest text-gray-500 uppercase">
                        <div className="flex gap-8">
                            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        </div>
                        <p>© 2025 UNIPARDS. All Rights Reserved.</p>
                    </div>
                </footer>
            </main>
        </div>
    )
}

function TimelineEntry({ year, title, content }: { year: string, title: string, content: string }) {
    return (
        <div className="group border-l border-white/20 pl-8 md:pl-16 relative pb-12 last:pb-0">
            {/* Dot */}
            <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 bg-white rounded-full opacity-20 group-hover:opacity-100 group-hover:bg-purple-500 transition-all duration-500" />
            
            <span className="block font-serif text-2xl md:text-3xl text-gray-500 italic mb-2 group-hover:text-white transition-colors duration-300">
                {year}
            </span>
            <h4 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-wider">
                {title}
            </h4>
            <p className="text-gray-400 leading-relaxed text-lg max-w-2xl group-hover:text-gray-300 transition-colors duration-300">
                {content}
            </p>
        </div>
    )
}

function SocialLink({ href, label, id }: { href: string, label: string, id: string }) {
    return (
        <a 
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-baseline border-b border-white/10 py-4 hover:border-white transition-colors"
        >
            <span className="w-32 text-sm text-gray-500 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
            <span className="font-serif text-xl md:text-2xl italic text-gray-300 group-hover:translate-x-4 transition-transform duration-300">{id}</span>
        </a>
    )
}
