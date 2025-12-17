"use client"

import * as React from "react"
import {
  CheckSquare,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useLanguage } from "@/lib/language-context"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  userRole?: string
}

export function AppSidebar({ userRole, ...props }: AppSidebarProps) {
  const role = userRole || "USER"
  const { language } = useLanguage()

  const t = (zh: string, en: string) => language === "zh" ? zh : en

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Shield className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {t("報帳系統", "Expense System")}
                  </span>
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
            <SidebarMenuButton asChild tooltip={t("儀表板", "Dashboard")}>
              <a href="/dashboard">
                <LayoutDashboard />
                <span>{t("儀表板", "Dashboard")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("我的花費", "My Expenses")}>
              <a href="/dashboard/expenses">
                <CreditCard />
                <span>{t("我的花費", "My Expenses")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Manager / Admin Items */}
          {(role === "MANAGER" || role === "FINANCE" || role === "ADMIN") && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("審核", "Approvals")}>
                <a href="/dashboard/approvals">
                  <CheckSquare />
                  <span>{t("審核", "Approvals")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Finance / Admin Items */}
          {(role === "FINANCE" || role === "ADMIN") && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("所有報表", "All Reports")}>
                <a href="/dashboard/reports">
                  <FileText />
                  <span>{t("所有報表", "All Reports")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* Admin Only Items */}
          {role === "ADMIN" && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("用戶管理", "User Management")}>
                <a href="/dashboard/users">
                  <Users />
                  <span>{t("用戶管理", "Users")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("個人資料", "Profile")}>
              <a href="/dashboard/profile">
                <User />
                <span>{t("個人資料", "Profile")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("設定", "Settings")}>
              <a href="/dashboard/settings">
                <Settings />
                <span>{t("設定", "Settings")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("登出", "Sign Out")}
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut />
              <span>{t("登出", "Sign Out")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
