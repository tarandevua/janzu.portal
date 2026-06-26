"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowUpCircleIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  UsersIcon,
  MapIcon,
  MapPinnedIcon,
  UserCogIcon,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { Locale } from "@/lib/i18n/config"
import type { RoleAccess } from "@/server/models/rbac.model"

function getData(locale: Locale, access: RoleAccess[]) {
  const canManageUsers = access.some((item) => item.permissions.includes("users:manage"))

  return {
    roleLinks: access.map((item) => ({
      title: item.label,
      url: `/${locale}/dashboard/${item.dashboardPath}`,
      icon: LayoutDashboardIcon,
    })),
    navMain: [
    {
      title: "Dashboard",
      url: `/${locale}/dashboard`,
      icon: LayoutDashboardIcon,
    },
    ...(canManageUsers
      ? [
          {
            title: "Users",
            url: `/${locale}/dashboard/users`,
            icon: UserCogIcon,
          },
        ]
      : []),
    {
      title: "Clients",
      url: `/${locale}/dashboard/clients`,
      icon: UsersIcon,
    },
    {
      title: "Sessions",
      url: `/${locale}/dashboard/sessions`,
      icon: ClipboardListIcon,
    },
    {
      title: "Locations",
      url: `/${locale}/dashboard/locations`,
      icon: MapPinnedIcon,
    },
    {
      title: "Events",
      url: `/${locale}/dashboard/events`,
      icon: CalendarDaysIcon,
    },
  ],
  navSecondary: [],
  documents: [
    {
      name: "Practitioner Map",
      url: `/${locale}/practitioners`,
      icon: MapIcon,
    },
    {
      name: "Location Map",
      url: `/${locale}/locations`,
      icon: MapPinnedIcon,
    },
    {
      name: "Certification",
      url: `/${locale}/dashboard/certification`,
      icon: DatabaseIcon,
    },
    {
      name: "Feedback",
      url: "#",
      icon: FileTextIcon,
    },
    {
      name: "Events",
      url: `/${locale}/events`,
      icon: CalendarDaysIcon,
    },
  ],
  }
}

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  locale: Locale
  access: RoleAccess[]
  user: {
    name: string
    email: string
    avatar?: string
  }
}

export function AppSidebar({
  locale,
  access,
  user,
  ...props
}: AppSidebarProps) {
  const data = getData(locale, access)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link href={`/${locale}/dashboard`}>
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Janzu Portal</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.roleLinks} />
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser locale={locale} user={{ ...user, avatar: user.avatar ?? "" }} />
      </SidebarFooter>
    </Sidebar>
  )
}
