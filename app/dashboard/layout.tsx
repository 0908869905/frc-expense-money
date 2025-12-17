import React from "react"
import { cookies } from "next/headers"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader } from "@/components/dashboard-header"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  let defaultOpen = true

  try {
    const cookieStore = await cookies()
    defaultOpen = cookieStore.get("sidebar:state")?.value !== "false"
  } catch (e) {
    // Ignore cookie errors
  }

  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const userName = session.user?.name || session.user?.email || "User"
  const userRole = session.user?.role || "USER"

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar userRole={userRole} />
      <SidebarInset>
        <DashboardHeader userName={userName}>
          <SidebarTrigger className="-ml-1" />
        </DashboardHeader>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}