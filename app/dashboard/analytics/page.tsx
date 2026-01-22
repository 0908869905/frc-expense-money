import { auth } from "@/auth"
import { redirect } from "next/navigation"
import {
    getCategoryExpenseStats,
    getMonthlyExpenseStats,
    getOverviewStats,
    getStatusStats,
} from "@/app/actions/analytics"
import { AnalyticsContent } from "@/components/analytics-content"

export default async function AnalyticsPage(): Promise<React.JSX.Element> {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const [monthlyStats, categoryStats, statusStats, overview] = await Promise.all([
        getMonthlyExpenseStats(),
        getCategoryExpenseStats(),
        getStatusStats(),
        getOverviewStats(),
    ])

    return (
        <AnalyticsContent
            monthlyStats={monthlyStats}
            categoryStats={categoryStats}
            statusStats={statusStats}
            overview={overview}
        />
    )
}
