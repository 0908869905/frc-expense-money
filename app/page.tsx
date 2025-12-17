"use client"

import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Shield, ArrowRight } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function LandingPage() {
  const { t } = useLanguage()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="#">
          <Shield className="h-6 w-6 mr-2" />
          <span className="font-bold">Ultimate Expense</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/login">
            {t("sign_in")}
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  {t("hero_title")}
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  {t("hero_desc")}
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                  <Button className="h-11 px-8">
                    {t("get_started")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/about">
                  <Button variant="outline" className="h-11 px-8">{t("learn_more")}</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">{t("footer_rights")}</p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">{t("terms")}</Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">{t("privacy")}</Link>
        </nav>
      </footer>
    </div>
  )
}