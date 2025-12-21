import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function TestPage() {
    const session = await auth()

    if (!session?.user) {
        redirect("/login")
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold">Test Page - Login Success!</h1>
            <p>User: {session.user.email}</p>
            <p>Role: {session.user.role}</p>
            <a href="/dashboard" className="text-blue-500 underline">Go to Dashboard</a>
        </div>
    )
}
