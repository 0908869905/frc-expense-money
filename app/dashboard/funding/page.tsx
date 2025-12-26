import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getFundingRecords, getFinancialSummary } from "@/app/actions/funding"
import { FundingContent } from "@/components/funding-content"

export default async function FundingPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const role = session.user.role || "USER"

    // 只有 FINANCE 和 ADMIN 可以存取
    if (!["FINANCE", "ADMIN"].includes(role)) {
        redirect("/dashboard")
    }

    const [fundingRecords, financialSummary] = await Promise.all([
        getFundingRecords(),
        getFinancialSummary(),
    ])

    return (
        <FundingContent
            fundingRecords={fundingRecords}
            financialSummary={financialSummary}
        />
    )
}
