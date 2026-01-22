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
  Wallet,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useLanguage } from "@/lib/context/language-context"
import { useOrganization } from "@/lib/organization-context"

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
  userDepartment?: string | null
}

export function AppSidebar({ userRole, userDepartment, ...props }: AppSidebarProps) {
  const role = userRole || "USER"
  const department = userDepartment || null
  const { language } = useLanguage()
  const { org } = useOrganization()

  const t = (zh: string, en: string) => language === "zh" ? zh : en

  const handleLogout = async () => {
    try {
      await signOut({ callbackUrl: "/login" })
    } catch (error) {
      console.error("Logout error:", error)
      // Fallback: 直接導向
      window.location.href = "/login"
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard">
                <div className={`flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden ${org.bgColor}`}>
                  <img src={org.logo} alt={org.name} className="size-6 object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {t(org.title, org.titleEn)}
                  </span>
                  <span className="truncate text-xs">{org.subtitle}</span>
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
          {/* 我的費用 - USER 以外的都可見 */}
          {role !== "USER" && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("我的費用", "My Expenses")}>
                <a href="/dashboard/expenses">
                  <CreditCard />
                  <span>{t("我的費用", "My Expenses")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {/* 庫存管理 - 機械組用戶 / 財務 / 管理員可見 */}
          {(department === "MECHANICAL" || role === "FINANCE" || role === "ADMIN") && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("庫存管理", "Inventory")}>
                <a href="/dashboard/inventory">
                  <Package />
                  <span>{t("庫存管理", "Inventory")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* 組長 / 財務 / 管理員可見審核 */}
          {(role === "LEADER" || role === "FINANCE" || role === "ADMIN") && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("審核", "Approvals")}>
                <a href="/dashboard/approvals">
                  <CheckSquare />
                  <span>{t("審核", "Approvals")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* 副組長 / 組長 / 財務 / 管理員可見查看資金 */}
          {(role === "VICE_LEADER" || role === "LEADER" || role === "FINANCE" || role === "ADMIN") && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("資金記錄", "Funding")}>
                <a href="/dashboard/funding">
                  <Wallet />
                  <span>{t("資金記錄", "Funding")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* 財務 / 管理員專屬 */}
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
                <SidebarMenuButton asChild tooltip={t("統計分析", "Analytics")}>
                  <a href="/dashboard/analytics">
                    <BarChart3 />
                    <span>{t("統計分析", "Analytics")}</span>
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
