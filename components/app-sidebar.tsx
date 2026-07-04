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
import { NavigationLink } from "@/components/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
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

// 選單項目：依「帳冊分區」分組（總覽 / 財務 / 營運 / 系統）
interface MenuItem {
  href: string
  icon: React.ElementType
  labelZh: string
  labelEn: string
  roles?: string[]
  departments?: string[]
}

interface MenuGroup {
  labelZh: string
  labelEn: string
  /** mono 分區代號，工程圖框式 */
  code: string
  items: MenuItem[]
}

const MENU_GROUPS: MenuGroup[] = [
  {
    labelZh: "總覽",
    labelEn: "Overview",
    code: "00",
    items: [
      {
        href: "/dashboard",
        icon: LayoutDashboard,
        labelZh: "儀表板",
        labelEn: "Dashboard",
      },
    ],
  },
  {
    labelZh: "財務",
    labelEn: "Finance",
    code: "01",
    items: [
      {
        href: "/dashboard/expenses",
        icon: CreditCard,
        labelZh: "我的花費",
        labelEn: "My Expenses",
        roles: ["VICE_LEADER", "LEADER", "FINANCE", "ADMIN"],
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
    ],
  },
  {
    labelZh: "營運",
    labelEn: "Operations",
    code: "02",
    items: [
      {
        href: "/dashboard/inventory",
        icon: Package,
        labelZh: "庫存管理",
        labelEn: "Inventory",
        roles: ["FINANCE", "ADMIN"],
        departments: ["MECHANICAL"],
      },
    ],
  },
  {
    labelZh: "系統",
    labelEn: "System",
    code: "03",
    items: [
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
    ],
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
      <SidebarHeader className="border-b border-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <NavigationLink href="/dashboard">
                <div className={`flex aspect-square size-8 items-center justify-center rounded-md overflow-hidden border border-border ${org.bgColor}`}>
                  <Image src={org.logo} alt={org.name} width={24} height={24} className="size-6 object-contain" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {t(org.title, org.titleEn)}
                  </span>
                  <span className="truncate font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{org.subtitle}</span>
                </div>
              </NavigationLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {MENU_GROUPS.map((group) => {
          const visibleItems = group.items.filter(isMenuItemVisible)
          if (visibleItems.length === 0) return null

          return (
            <SidebarGroup key={group.code}>
              <SidebarGroupLabel className="ledger-label flex items-baseline gap-2 px-2">
                <span className="text-primary/70">{group.code}</span>
                <span>{t(group.labelZh, group.labelEn)}</span>
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map((item) => {
                    const Icon = item.icon
                    const active = isActive(item.href)

                    return (
                      <SidebarMenuItem key={item.href}>
                        <SidebarMenuButton
                          asChild
                          tooltip={t(item.labelZh, item.labelEn)}
                          className={active ? "sidebar-item-active" : "sidebar-item"}
                        >
                          <NavigationLink href={item.href} className="relative">
                            {active && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary" />
                            )}
                            <Icon className={active ? "text-primary" : ""} />
                            <span className={active ? "font-medium text-primary" : ""}>
                              {t(item.labelZh, item.labelEn)}
                            </span>
                          </NavigationLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>

      <SidebarFooter className="border-t border-border">
        <SidebarMenu>
          {/* 用戶資訊 + 登出：單列緊湊配置 */}
          <SidebarMenuItem>
            <div className="flex items-center gap-2 px-1 py-1">
              <SidebarMenuButton asChild tooltip={userName || userEmail || t("用戶", "User")} className="flex-1 min-w-0">
                <NavigationLink href="/dashboard/profile" className="flex items-center gap-2.5">
                  {userImage ? (
                    <Image
                      src={userImage}
                      alt="Avatar"
                      width={28}
                      height={28}
                      className="w-7 h-7 rounded-full object-cover border border-border shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground text-xs font-semibold shrink-0">
                      {getInitials()}
                    </div>
                  )}
                  <div className="flex-1 text-left text-xs leading-tight min-w-0">
                    <span className="truncate font-medium block">{userName || t("未設定名稱", "No name")}</span>
                    <span className="truncate text-muted-foreground block font-mono text-[10px]">{userEmail}</span>
                  </div>
                </NavigationLink>
              </SidebarMenuButton>
              <button
                onClick={handleLogout}
                title={t("登出", "Sign Out")}
                className="p-2 rounded-md text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors shrink-0 group-data-[collapsible=icon]:hidden"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
