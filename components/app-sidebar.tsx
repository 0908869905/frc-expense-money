import * as React from "react"
import {
  Briefcase,
  CheckSquare,
  CreditCard,
  FileText,
  LayoutDashboard,
  Settings,
  Shield,
  User,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { auth } from "@/auth"

export async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const session = await auth()
  const user = session?.user

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">Ultimate Expense</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu className="mt-4 px-2">
          {/* Common Items */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Dashboard">
              <a href="/dashboard">
                <LayoutDashboard />
                <span>Dashboard</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="My Expenses">
              <a href="/dashboard/expenses">
                <CreditCard />
                <span>My Expenses</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Manager / Admin Items */}
          {(user?.role === "MANAGER" || user?.role === "FINANCE" || user?.role === "ADMIN") && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Approvals">
                <a href="/dashboard/approvals">
                  <CheckSquare />
                  <span>Approvals</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

           {/* Finance / Admin Items */}
           {(user?.role === "FINANCE" || user?.role === "ADMIN") && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="All Reports">
                <a href="/dashboard/reports">
                  <FileText />
                  <span>All Reports</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem className="mt-auto">
            <SidebarMenuButton asChild tooltip="Settings">
              <a href="/dashboard/settings">
                <Settings />
                <span>Settings</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  )
}
