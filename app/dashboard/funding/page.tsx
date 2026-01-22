import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getFinancialSummary, getFundingRecords } from "@/app/actions/funding"
import { getDepartmentFinancialSummary } from "@/app/actions/budget"
import { FundingContent } from "@/components/funding-content"
import { DepartmentBudgetContent } from "@/components/department-budget-content"

const ALLOWED_ROLES = ["VICE_LEADER", "LEADER", "FINANCE", "ADMIN"]
const FULL_FUNDING_ROLES = ["FINANCE", "ADMIN"]

export default async function FundingPage(): Promise<React.JSX.Element> {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const role = session.user.role || "USER"
    const userDepartment = (session.user as { department?: string }).department ?? null

    if (!ALLOWED_ROLES.includes(role)) {
        redirect("/dashboard")
    }

    const [fundingRecords, financialSummary, departmentSummary] = await Promise.all([
        getFundingRecords(),
        getFinancialSummary(),
        getDepartmentFinancialSummary(),
    ])

    const canViewFullFunding = FULL_FUNDING_ROLES.includes(role)

    return (
        <div className="space-y-8">
            <DepartmentBudgetContent
                departmentSummary={departmentSummary}
                userRole={role}
                userDepartment={userDepartment}
            />

            {canViewFullFunding && (
                <FundingContent
                    fundingRecords={fundingRecords}
                    financialSummary={financialSummary}
                />
            )}
        </div>
    )
}
