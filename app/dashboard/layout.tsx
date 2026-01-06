import React from "react"
import { cookies } from "next/headers"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader, DashboardWrapper } from "@/components/dashboard-header"
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

  const userName = session.user?.name || null
  const userEmail = session.user?.email || null
  const userImage = session.user?.image || null
  const userRole = session.user?.role || "USER"
  const userDepartment = (session.user as any)?.department || null

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar 
        userRole={userRole} 
        userDepartment={userDepartment}
        userImage={userImage}
        userName={userName}
        userEmail={userEmail}
      />
      <SidebarInset>
        <DashboardWrapper>
          <DashboardHeader userName={userName || userEmail || "User"}>
            <SidebarTrigger className="-ml-1" />
          </DashboardHeader>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-4">
            {children}
          </div>
        </DashboardWrapper>
      </SidebarInset>
    </SidebarProvider>
  )
}