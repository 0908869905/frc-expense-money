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
