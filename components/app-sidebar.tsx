"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowUpCircleIcon,
  CalendarDaysIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileTextIcon,
  HelpCircleIcon,
  LayoutDashboardIcon,
  ListIcon,
  SettingsIcon,
  UsersIcon,
  MapIcon,
  MapPinnedIcon,
  UserCircleIcon,
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
    {
      title: "Profile",
      url: `/${locale}/dashboard/profile`,
      icon: UserCircleIcon,
    },
    {
      title: "Clients",
      url: `/${locale}/dashboard/clients`,
      icon: ListIcon,
    },
    {
      title: "Sessions",
      url: `/${locale}/dashboard/sessions`,
      icon: ClipboardListIcon,
    },
    {
      title: "Events",
      url: "#",
      icon: CalendarDaysIcon,
    },
    {
      title: "Community",
      url: "#",
      icon: UsersIcon,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: SettingsIcon,
    },
    {
      title: "Get Help",
      url: "#",
      icon: HelpCircleIcon,
    },
  ],
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
        <NavUser user={{ ...user, avatar: user.avatar ?? "" }} />
      </SidebarFooter>
    </Sidebar>
  )
}
