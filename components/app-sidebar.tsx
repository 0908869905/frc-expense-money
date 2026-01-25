"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Image from "next/image"
import {
  BarChart3,
  CheckSquare,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  User,
  Users,
  Wallet,
} from "lucide-react"
import { signOut } from "next-auth/react"
import { useLanguage } from "@/lib/language-context"
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
  userImage?: string | null
  userName?: string | null
  userEmail?: string | null
}

// 菜單項目配置
interface MenuItem {
  href: string
  icon: React.ElementType
  labelZh: string
  labelEn: string
  roles?: string[]
  departments?: string[]
}

const MENU_ITEMS: MenuItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    labelZh: "儀表板",
    labelEn: "Dashboard",
  },
  {
    href: "/dashboard/expenses",
    icon: CreditCard,
    labelZh: "我的花費",
    labelEn: "My Expenses",
    roles: ["VICE_LEADER", "LEADER", "FINANCE", "ADMIN"],
  },
  {
    href: "/dashboard/inventory",
    icon: Package,
    labelZh: "庫存管理",
    labelEn: "Inventory",
    roles: ["FINANCE", "ADMIN"],
    departments: ["MECHANICAL"],
  },
  {
    href: "/dashboard/approvals",
    icon: CheckSquare,
    labelZh: "審核",
    labelEn: "Approvals",
    roles: ["LEADER", "FINANCE", "ADMIN"],
  },
  {
    href: "/dashboard/funding",
    icon: Wallet,
    labelZh: "資金記錄",
    labelEn: "Funding",
    roles: ["VICE_LEADER", "LEADER", "FINANCE", "ADMIN"],
  },
  {
    href: "/dashboard/reports",
    icon: FileText,
    labelZh: "所有報表",
    labelEn: "All Reports",
    roles: ["FINANCE", "ADMIN"],
  },
  {
    href: "/dashboard/analytics",
    icon: BarChart3,
    labelZh: "數據分析",
    labelEn: "Analytics",
    roles: ["FINANCE", "ADMIN"],
  },
  {
    href: "/dashboard/users",
    icon: Users,
    labelZh: "用戶管理",
    labelEn: "Users",
    roles: ["ADMIN"],
  },
  {
    href: "/dashboard/profile",
    icon: User,
    labelZh: "個人資料",
    labelEn: "Profile",
  },
  {
    href: "/dashboard/settings",
    icon: Settings,
    labelZh: "設定",
    labelEn: "Settings",
  },
]

export function AppSidebar({ userRole, userDepartment, userImage, userName, userEmail, ...props }: AppSidebarProps): React.ReactElement {
  const role = userRole || "USER"
  const department = userDepartment || null
  const { language } = useLanguage()
  const { org } = useOrganization()
  const pathname = usePathname()

  function t(zh: string, en: string): string {
    return language === "zh" ? zh : en
  }

  function getInitials(): string {
    const name = userName || userEmail || "U"
    return name.charAt(0).toUpperCase()
  }

  async function handleLogout(): Promise<void> {
    try {
      await signOut({ callbackUrl: "/login" })
    } catch (error) {
      console.error("Logout error:", error)
      window.location.href = "/login"
    }
  }

  function isMenuItemVisible(item: MenuItem): boolean {
    if (!item.roles && !item.departments) return true
    if (item.roles?.includes(role)) return true
    if (item.departments && department && item.departments.includes(department)) return true
    if (item.href === "/dashboard/expenses" && role !== "USER") return true
    return false
  }

  function isActive(href: string): boolean {
    return href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href)
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/dashboard" className="group">
                <div className={`flex aspect-square size-8 items-center justify-center rounded-lg overflow-hidden ${org.bgColor} ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all`}>
                  <Image src={org.logo} alt={org.name} width={24} height={24} className="size-6 object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {t(org.title, org.titleEn)}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">{org.subtitle}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu className="mt-4 px-2 space-y-1">
          {MENU_ITEMS.filter(isMenuItemVisible).map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={t(item.labelZh, item.labelEn)}
                  className={active ? "sidebar-item-active" : "sidebar-item"}
                >
                  <a href={item.href} className="relative">
                    {active && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                    )}
                    <Icon className={active ? "text-primary" : ""} />
                    <span className={active ? "font-medium text-primary" : ""}>
                      {t(item.labelZh, item.labelEn)}
                    </span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          {/* 用戶資訊 */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={userName || userEmail || t("用戶", "User")}>
              <a href="/dashboard/profile" className="group flex items-center gap-3">
                {userImage ? (
                  <div className="relative">
                    <Image
                      src={userImage}
                      alt="Avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all"
                    />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                  </div>
                ) : (
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground text-sm font-bold ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                      {getInitials()}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-background" />
                  </div>
                )}
                <div className="flex-1 text-left text-xs leading-tight min-w-0">
                  <span className="truncate font-medium block">{userName || t("未設定名稱", "No name")}</span>
                  <span className="truncate text-muted-foreground block">{userEmail}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* 登出按鈕 */}
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={t("登出", "Sign Out")}
              onClick={handleLogout}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>{t("登出", "Sign Out")}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
