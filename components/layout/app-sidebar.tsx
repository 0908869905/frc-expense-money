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
import { useOrganization } from "@/lib/context/organization-context"

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
      // Fallback: ?��??��???      window.location.href = "/login"
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
            <SidebarMenuButton asChild tooltip={t("?�表板", "Dashboard")}>
              <a href="/dashboard">
                <LayoutDashboard />
                <span>{t("?�表板", "Dashboard")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {/* ?��??�費 - USER 以�??��??�可�?*/}
          {role !== "USER" && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("?��??�費", "My Expenses")}>
                <a href="/dashboard/expenses">
                  <CreditCard />
                  <span>{t("?��??�費", "My Expenses")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
          {/* 庫�?管�? - 機�?組用??/ 財�? / 管�??�可�?*/}
          {(department === "MECHANICAL" || role === "FINANCE" || role === "ADMIN") && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("庫�?管�?", "Inventory")}>
                <a href="/dashboard/inventory">
                  <Package />
                  <span>{t("庫�?管�?", "Inventory")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* 組長 / 財�? / 管�????�審??*/}
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

          {/* ?��???/ 組長 / 財�? / 管�????�查?��???*/}
          {(role === "VICE_LEADER" || role === "LEADER" || role === "FINANCE" || role === "ADMIN") && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("資�?記�?", "Funding")}>
                <a href="/dashboard/funding">
                  <Wallet />
                  <span>{t("資�?記�?", "Funding")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {/* 財�? / 管�????��? */}
          {(role === "FINANCE" || role === "ADMIN") && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t("?�?�報�?, "All Reports")}>
                  <a href="/dashboard/reports">
                    <FileText />
                    <span>{t("?�?�報�?, "All Reports")}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t("?��??��?", "Analytics")}>
                  <a href="/dashboard/analytics">
                    <BarChart3 />
                    <span>{t("?��??��?", "Analytics")}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}

          {/* Admin Only Items */}
          {role === "ADMIN" && (
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={t("?�戶管�?", "User Management")}>
                <a href="/dashboard/users">
                  <Users />
                  <span>{t("?�戶管�?", "Users")}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("?�人資�?", "Profile")}>
              <a href="/dashboard/profile">
                <User />
                <span>{t("?�人資�?", "Profile")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={t("設�?", "Settings")}>
              <a href="/dashboard/settings">
                <Settings />
                <span>{t("設�?", "Settings")}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("?�出", "Sign Out")}
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <LogOut />
              <span>{t("?�出", "Sign Out")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}

