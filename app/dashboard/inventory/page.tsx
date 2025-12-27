import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getAllItems, getRestockList } from "@/app/actions/inventory"
import { InventoryContent } from "@/components/inventory-content"

export default async function InventoryPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    const userRole = session.user.role || "USER"
    const userDepartment = (session.user as any).department || null

    // 只有機構組用戶、財務、管理員可以存取
    const canAccess = userDepartment === "MECHANICAL" || userRole === "FINANCE" || userRole === "ADMIN"
    if (!canAccess) {
        redirect("/dashboard")
    }

    // 取得所有零件和需補貨清單
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
