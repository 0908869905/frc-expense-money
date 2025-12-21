"use client"

import * as React from "react"
import {
  BarChart3,
  CheckSquare,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  Shield,
  User,
  Users,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useLanguage } from "@/lib/language-context"
import { brand } from "@/lib/brand"

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
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden bg-black">
                  <img src="/logo.png" alt="UNIPARDS" className="size-6 object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {t("FRC 6998 報帳", "FRC 6998 Expense")}
                  </span>
                  <span className="truncate text-xs">UNIPARDS</span>
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
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("庫存管理", "Inventory")}>
              <a href="/dashboard/inventory">
                <Package />
                <span>{t("庫存管理", "Inventory")}</span>
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
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t("所有報表", "All Reports")}>
                  <a href="/dashboard/reports">
                    <FileText />
                    <span>{t("所有報表", "All Reports")}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t("數據分析", "Analytics")}>
                  <a href="/dashboard/analytics">
                    <BarChart3 />
                    <span>{t("數據分析", "Analytics")}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
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
