import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SettingsContent } from "@/components/settings-content"
import { getBankAccounts, canUserManageBankAccounts } from "@/app/actions/bank-accounts"

export default async function SettingsPage(): Promise<React.JSX.Element> {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // 取得收款帳戶資料和權限
    const [bankAccounts, canManage] = await Promise.all([
        getBankAccounts(),
        canUserManageBankAccounts(),
    ])

    return (
        <SettingsContent
            session={session}
            bankAccounts={bankAccounts}
            canManageBankAccounts={canManage}
        />
    )
}
