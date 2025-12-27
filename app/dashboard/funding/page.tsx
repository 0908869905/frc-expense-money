import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getFundingRecords, getFinancialSummary } from "@/app/actions/funding"
import { getDepartmentFinancialSummary } from "@/app/actions/budget"
import { FundingContent } from "@/components/funding-content"
import { DepartmentBudgetContent } from "@/components/department-budget-content"

export default async function FundingPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const role = session.user.role || "USER"
    const userDepartment = (session.user as any).department || null

    // 副組長、組長、財務、管理員可以存取
    if (!["VICE_LEADER", "LEADER", "FINANCE", "ADMIN"].includes(role)) {
        redirect("/dashboard")
    }

    const [fundingRecords, financialSummary, departmentSummary] = await Promise.all([
        getFundingRecords(),
        getFinancialSummary(),
        getDepartmentFinancialSummary(),
    ])

    const canViewFullFunding = role === "FINANCE" || role === "ADMIN"

    return (
        <div className="space-y-8">
            {/* 組別預算（所有可存取用戶都能看到） */}
            <DepartmentBudgetContent
                departmentSummary={departmentSummary}
                userRole={role}
                userDepartment={userDepartment}
            />

            {/* 完整資金記錄（僅財務和管理員） */}
            {canViewFullFunding && (
                <FundingContent
                    fundingRecords={fundingRecords}
                    financialSummary={financialSummary}
                />
            )}
        </div>
    )
}
