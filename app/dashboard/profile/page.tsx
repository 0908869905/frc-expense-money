import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export default async function ProfilePage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    // Fetch user details from database
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
            _count: {
                select: {
                    expenseReports: true,
                }
            }
        }
    })

    // Calculate user stats
    const stats = await prisma.expenseReport.aggregate({
        where: { submitterId: session.user.id },
        _sum: { totalAmount: true },
        _count: true
    })

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">個人資料</h1>
                <p className="text-muted-foreground">查看你的帳戶資訊</p>
            </div>

            {/* Profile Card */}
            <div className="rounded-xl border bg-card p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-bold text-primary">
                            {(user?.name || user?.email || "U")[0].toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{user?.name || "未設定名稱"}</h2>
                        <p className="text-muted-foreground">{user?.email}</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">用戶 ID</span>
                        <span className="font-mono text-sm">{user?.id}</span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">角色</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user?.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                user?.role === 'MANAGER' ? 'bg-blue-100 text-blue-700' :
                                    user?.role === 'FINANCE' ? 'bg-green-100 text-green-700' :
                                        'bg-gray-100 text-gray-700'
                            }`}>
                            {user?.role || "USER"}
                        </span>
                    </div>
                    <div className="flex justify-between py-3 border-b">
                        <span className="text-muted-foreground">帳戶建立時間</span>
                        <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-TW') : "N/A"}</span>
                    </div>
                </div>
            </div>

            {/* Stats Card */}
            <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">報帳統計</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">報帳單數量</p>
                        <p className="text-2xl font-bold">{stats._count}</p>
                    </div>
                    <div className="p-4 bg-muted/30 rounded-lg">
                        <p className="text-sm text-muted-foreground">總報帳金額</p>
                        <p className="text-2xl font-bold">${Number(stats._sum.totalAmount || 0).toFixed(2)}</p>
                    </div>
                </div>
            </div>

            {/* Session Info (Debug) */}
            <div className="rounded-xl border bg-card p-6">
                <h3 className="font-semibold mb-4">Session 資訊</h3>
                <pre className="text-xs bg-muted p-4 rounded-lg overflow-auto">
                    {JSON.stringify(session.user, null, 2)}
                </pre>
            </div>
        </div>
    )
}
