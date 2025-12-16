import React from "react"
import { cookies } from "next/headers"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-background/50 backdrop-blur transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="h-4 w-[1px] bg-border mx-2" />
            <span className="text-sm font-medium text-muted-foreground">
              Welcome back, {userName}
            </span>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}