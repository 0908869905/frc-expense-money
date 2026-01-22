import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { SettingsContent } from "@/components/settings-content"

export default async function SettingsPage(): Promise<React.JSX.Element> {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return <SettingsContent session={session} />
}
