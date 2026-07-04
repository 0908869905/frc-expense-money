"use client"

import Link from "next/link"
import { useLanguage } from "@/lib/language-context"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ArrowLeft, ArrowUpRight } from "lucide-react"

export default function AboutPage() {
    const { language } = useLanguage()
    const t = (zh: string, en: string) => language === "zh" ? zh : en

    return (
        <div className="min-h-screen bg-background text-foreground">

            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-6 py-3 md:px-12">
                <Link href="/" className="group flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-3.5 h-3.5" />
                    {t("返回", "Back")}
                </Link>
                <span className="ledger-label hidden sm:inline">Team Logbook</span>
                <LanguageSwitcher />
            </nav>

            <main className="relative">
                {/* ── Hero：日誌封面 ─────────────────────── */}
                <section className="relative min-h-[92vh] flex flex-col justify-end px-6 md:px-12 pt-24 pb-16 overflow-hidden">
                    {/* 藍圖網格 */}
                    <div
                        aria-hidden
                        className="absolute inset-0 opacity-50"
                        style={{
                            backgroundImage:
                                "linear-gradient(hsl(var(--border) / 0.5) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border) / 0.5) 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                        }}
                    />

                    <div className="relative max-w-5xl">
                        <p className="font-mono text-sm text-primary tracking-[0.2em] uppercase mb-6">
                            Since 2018 — Tainan, Taiwan
                        </p>
                        <h1 className="font-mono text-[22vw] md:text-[16vw] font-semibold leading-none tracking-tight text-foreground">
                            6998
                        </h1>
                        <div className="mt-4 flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <h2 className="font-mono text-3xl md:text-5xl uppercase tracking-[0.25em] text-muted-foreground">
                                Unipards
                            </h2>
                            <p className="max-w-md text-sm md:text-base text-muted-foreground leading-relaxed">
                                {t(
                                    "南科實中首支 FRC 隊伍。我們不只是建造機器人，我們建造夢想，並將 STEAM 教育的種子播撒至偏鄉。",
                                    "NNKIEH's first FRC team. We don't just build robots; we build dreams and sow the heavy seeds of STEAM education into underserved communities."
                                )}
                            </p>
                        </div>

                        {/* 圖框 title block */}
                        <div className="mt-12 border border-border bg-card/80 rounded-md overflow-hidden max-w-sm">
                            <div className="grid grid-cols-[auto_1fr] text-xs font-mono">
                                <span className="px-3 py-1.5 border-b border-r border-border text-muted-foreground uppercase tracking-wider">Team</span>
                                <span className="px-3 py-1.5 border-b border-border">FRC 6998 UNIPARDS</span>
                                <span className="px-3 py-1.5 border-b border-r border-border text-muted-foreground uppercase tracking-wider">School</span>
                                <span className="px-3 py-1.5 border-b border-border">NNKIEH</span>
                                <span className="px-3 py-1.5 border-r border-border text-muted-foreground uppercase tracking-wider">Founded</span>
                                <span className="px-3 py-1.5">2018</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── 歷程：日誌分錄 ──────────────────────── */}
                <section className="px-6 md:px-12 py-24 border-t border-border">
                    <div className="grid md:grid-cols-12 gap-12 max-w-6xl mx-auto">
                        {/* Sticky Header */}
                        <div className="md:col-span-4 relative">
                            <div className="sticky top-24 space-y-3">
                                <p className="ledger-label text-primary">Logbook</p>
                                <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">{t("歷程", "History")}</h3>
                                <p className="font-mono text-xs uppercase tracking-[0.14em] text-muted-foreground">
                                    {t("我們的足跡", "Our Journey")}
                                </p>
                                <div className="h-px w-16 bg-primary" />
                            </div>
                        </div>

                        {/* Logbook Entries */}
                        <div className="md:col-span-8">
                            <LogEntry
                                code="LOG-2018"
                                year="2018"
                                title={t("起源", "The Origin")}
                                content={t(
                                    "在國科會的支持下，國立南科國際實驗高級中學成立了 FRC 6998 UNIPARDS，前往 Southern Cross Regional，開啟了這段不凡的旅程。",
                                    "With the support of the National Science and Technology Council (NSTC), National Nanke International Experimental High School founded FRC 6998 UNIPARDS. We competed at the Southern Cross Regional, beginning our extraordinary journey."
                                )}
                            />
                            <LogEntry
                                code="LOG-2019"
                                year="2019"
                                title={t("初試啼聲", "First Echo")}
                                content={t(
                                    "在 Hawaii Regional，我們展現了強大的商業潛力，獲得了 Entrepreneurship Award，這是我們的首個國際獎項，證明了技術與商業思維並重的重要性。",
                                    "At the Hawaii Regional, we demonstrated strong business potential, winning the Entrepreneurship Award—our first international accolade, proving the importance of balancing technology with business acumen."
                                )}
                            />
                            <LogEntry
                                code="LOG-2020"
                                year="2020–2021"
                                title={t("蟄伏", "The Pause")}
                                content={t(
                                    "全球疫情迫使 FRC 賽季取消，但我們並沒有停下腳步。這段期間我們持續精進技術、培訓新血、強化社區推廣，為未來的回歸做好準備。",
                                    "The global pandemic forced the cancellation of FRC seasons, but we never stopped. We continued refining our skills, training new members, and strengthening community outreach, preparing for our return."
                                )}
                            />
                            <LogEntry
                                code="LOG-2022"
                                year="2022"
                                title={t("王者歸來", "The Return")}
                                content={t(
                                    "疫情並沒有澆熄我們的熱情。重返賽場後，我們在 New Taipei City x Hon Hai Regional 斬獲最高榮譽 Regional Chairman's Award 以及 Quality Award，蔡汶鴻老師獲得 Woodie Flowers Finalist Award，並首度取得前往 FIRST Championship 世界錦標賽的門票。",
                                    "The pandemic didn't extinguish our passion. Returning to the field, we clinched the Regional Chairman's Award and Quality Award at the New Taipei City x Hon Hai Regional. Mentor Wen-Hung Tsai received the Woodie Flowers Finalist Award. We secured our first FIRST Championship ticket."
                                )}
                            />
                            <LogEntry
                                code="LOG-2023"
                                year="2023"
                                title={t("世界舞台", "World Stage")}
                                content={t(
                                    "豐收的一年。我們成為 Monterey Bay Regional Winner 並獲得 Engineering Inspiration Award，再次晉級世錦賽。在休士頓奪得 Industrial Design Award。同時榮獲教育部「創新教育領導獎」。",
                                    "A year of harvest. We became Monterey Bay Regional Winners with the Engineering Inspiration Award, qualifying for Worlds again. In Houston, we won the Industrial Design Award. We also received the Ministry of Education's Innovation Leadership Award."
                                )}
                            />
                            <LogEntry
                                code="LOG-2024"
                                year="2024"
                                title={t("永續發展", "Sustainability")}
                                content={t(
                                    "在 Central Valley Regional，我們獲頒 Team Sustainability Award，肯定我們對環境保護與團隊永續經營的承諾。",
                                    "At the Central Valley Regional, we earned the Team Sustainability Award, recognizing our commitment to environmental protection and team sustainability."
                                )}
                            />
                            <LogEntry
                                code="LOG-2025"
                                year="2025"
                                title={t("傳承", "Legacy")}
                                content={t(
                                    "在 New Taipei City Regional，劉昀珊老師獲得 Woodie Flowers Finalist Award，使我們成為台灣第一支擁有兩位獲此殊榮導師的隊伍。這是對卓越教學與啟發的最高肯定，我們帶著使命繼續前進。",
                                    "At the New Taipei City Regional, mentor Yun-Shan Liu received the Woodie Flowers Finalist Award, making us the first team in Taiwan with two mentors receiving this honor. We continue forward with our mission."
                                )}
                                last
                            />
                        </div>
                    </div>
                </section>

                {/* ── 核心哲學：反色帶 ─────────────────────── */}
                <section className="py-28 bg-foreground text-background px-6 md:px-12">
                    <div className="max-w-4xl mx-auto">
                        <p className="font-mono text-xs uppercase tracking-[0.2em] mb-8 opacity-60">
                            {t("核心哲學", "Philosophy")}
                        </p>
                        <h3 className="text-4xl md:text-6xl font-semibold leading-tight tracking-tight mb-8">
                            &ldquo;Beyond the <span className="text-primary">Metal</span>.&rdquo;
                        </h3>
                        <p className="text-lg md:text-xl leading-relaxed max-w-2xl opacity-80">
                            {t(
                                "機器人只是載體。我們真正的產品是那些具備解決問題能力、擁有同理心與領導力的未來領袖。",
                                "The robot is just a vehicle. Our true products are future leaders equipped with problem-solving skills, empathy, and leadership."
                            )}
                        </p>
                    </div>
                </section>

                {/* ── 聯繫 / Footer ───────────────────────── */}
                <footer className="pt-24 pb-10 px-6 md:px-12 border-t border-border">
                    <div className="max-w-6xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-16 mb-20">
                            <div>
                                <p className="ledger-label text-primary mb-2">Connect</p>
                                <h4 className="text-2xl font-semibold tracking-tight mb-6">{t("保持聯繫", "Connect")}</h4>
                                <div className="border-t border-border">
                                    <SocialLink href="mailto:frc6998@ms.nnkieh.tn.edu.tw" label="Email" id="frc6998@ms.nnkieh.tn.edu.tw" />
                                    <SocialLink href="https://www.instagram.com/frc_6998/" label="Instagram" id="@frc_6998" />
                                    <SocialLink href="https://www.facebook.com/frc6998" label="Facebook" id="frc6998" />
                                    <SocialLink href="https://github.com/frc-6998" label="GitHub" id="frc-6998" />
                                    <SocialLink href="https://www.youtube.com/@FRC-6998Unipards" label="YouTube" id="@FRC-6998Unipards" />
                                </div>
                            </div>

                            <div className="flex flex-col justify-end items-start md:items-end">
                                <div className="font-mono text-7xl md:text-9xl font-semibold leading-none text-muted-foreground/15 select-none">
                                    6998
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-t border-border pt-6 gap-3 font-mono text-xs text-muted-foreground">
                            <div className="flex gap-6 uppercase tracking-wider">
                                <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
                                <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
                            </div>
                            <p className="uppercase tracking-wider">© 2025 UNIPARDS. All Rights Reserved.</p>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    )
}

/** 日誌分錄：mono 年份代號 + 標題 + 內文，hairline 左欄線 */
function LogEntry({ code, year, title, content, last }: { code: string, year: string, title: string, content: string, last?: boolean }) {
    return (
        <article className={`group relative border-l border-border pl-8 md:pl-12 ${last ? "pb-2" : "pb-14"}`}>
            {/* 節點 */}
            <div className="absolute left-[-4.5px] top-1.5 w-2 h-2 rounded-full border border-border bg-background group-hover:bg-primary group-hover:border-primary transition-colors duration-300" />

            <p className="ledger-label mb-1.5">{code}</p>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mb-3">
                <span className="font-mono text-2xl md:text-3xl font-semibold tabular-nums text-foreground">
                    {year}
                </span>
                <h4 className="text-base md:text-lg font-semibold tracking-tight text-primary">
                    {title}
                </h4>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-2xl text-sm md:text-base">
                {content}
            </p>
        </article>
    )
}

function SocialLink({ href, label, id }: { href: string, label: string, id: string }) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 border-b border-border py-3.5 hover:bg-accent/60 transition-colors px-1"
        >
            <span className="w-24 shrink-0 ledger-label">{label}</span>
            <span className="flex-1 font-mono text-sm md:text-base text-foreground truncate">{id}</span>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
        </a>
    )
}
