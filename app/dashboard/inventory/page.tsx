import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAllItems, getRestockList } from "@/app/actions/inventory"
import { InventoryContent } from "@/components/inventory-content"

function canAccessInventory(role: string, department: string | null): boolean {
    return department === "MECHANICAL" || role === "FINANCE" || role === "ADMIN"
}

export default async function InventoryPage(): Promise<React.JSX.Element> {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const userRole = session.user.role || "USER"
    const userDepartment = (session.user as { department?: string }).department ?? null

    if (!canAccessInventory(userRole, userDepartment)) {
        redirect("/dashboard")
    }

    const [items, restockItems] = await Promise.all([
        getAllItems(),
        getRestockList(),
    ])

    return (
        <InventoryContent
            items={items}
            restockItems={restockItems}
            userRole={userRole}
        />
    )
}
