import { cookies } from "next/headers"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { DashboardHeader, DashboardWrapper } from "@/components/dashboard-header"
import { StatusBar } from "@/components/status-bar"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps): Promise<React.JSX.Element> {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar:state")?.value !== "false"

  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const { name: userName = null, email: userEmail = null, image: userImage = null, role: userRole = "USER" } = session.user
  const userDepartment = (session.user as { department?: string }).department ?? null

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <AppSidebar
        userRole={userRole}
        userDepartment={userDepartment}
        userImage={userImage}
        userName={userName}
        userEmail={userEmail}
      />
      <SidebarInset className="flex min-h-svh flex-col">
        <DashboardWrapper>
          <DashboardHeader userName={userName || userEmail || "User"}>
            <SidebarTrigger className="-ml-1" />
          </DashboardHeader>
          <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
            {children}
          </div>
          <StatusBar
            userEmail={userEmail || ""}
            userRole={userRole}
            userDepartment={userDepartment}
          />
        </DashboardWrapper>
      </SidebarInset>
    </SidebarProvider>
  )
}
