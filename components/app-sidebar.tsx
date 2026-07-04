"use client"

import * as React from "react"
import Link from "next/link"
import type { Route } from "next"
import {
  Shell,
  CalendarDaysIcon,
  ClipboardListIcon,
  DatabaseIcon,
  FileTextIcon,
  LayoutDashboardIcon,
  UsersIcon,
  MapIcon,
  MapPinnedIcon,
  UserCogIcon,
  SettingsIcon,
} from "lucide-react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import { useDashboardNavigationLoading } from "@/components/dashboard/dashboard-navigation-loading"
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
import type { Role, RoleAccess } from "@/server/models/rbac.model"

type SidebarDictionary = {
  roles: Record<Role, string>
  dashboard: string
  users: string
  settings: string
  clients: string
  sessions: string
  locations: string
  events: string
  community: string
  practitionerMap: string
  locationMap: string
  certification: string
  feedback: string
  profile: string
  notifications: string
  logout: string
  loggingOut: string
}

function getData(locale: Locale, access: RoleAccess[], dictionary: SidebarDictionary) {
  const canManageUsers = access.some((item) => item.permissions.includes("users:manage"))

  return {
    roleLinks: access.map((item) => ({
      title: dictionary.roles[item.role] + " " + dictionary.dashboard,
      url: `/${locale}/dashboard/${item.dashboardPath}`,
      icon: LayoutDashboardIcon,
    })),
    navMain: [
    ...(canManageUsers
      ? [
          {
            title: dictionary.users,
            url: `/${locale}/dashboard/users`,
            icon: UserCogIcon,
          },
        ]
      : []),
    
    {
      title: dictionary.clients,
      url: `/${locale}/dashboard/clients`,
      icon: UsersIcon,
    },
    {
      title: dictionary.sessions,
      url: `/${locale}/dashboard/sessions`,
      icon: ClipboardListIcon,
    },
    {
      title: dictionary.locations,
      url: `/${locale}/dashboard/locations`,
      icon: MapPinnedIcon,
    },
    ...(canManageUsers
      ? [
          {
            title: dictionary.events,
            url: `/${locale}/dashboard/events`,
            icon: CalendarDaysIcon,
          }
        ]
      : []),
  ],
  navSecondary: [
    {
      title: dictionary.settings,
      url: `/${locale}/dashboard/settings`,
      icon: SettingsIcon,
    }
  ],
  documents: [
    {
      name: dictionary.practitionerMap,
      url: `/${locale}/practitioners`,
      icon: MapIcon,
    },
    {
      name: dictionary.locationMap,
      url: `/${locale}/locations`,
      icon: MapPinnedIcon,
    },
    {
      name: dictionary.certification,
      url: `/${locale}/dashboard/certification`,
      icon: DatabaseIcon,
    },
    {
      name: dictionary.feedback,
      url: `/${locale}/dashboard/feedback`,
      icon: FileTextIcon,
    },
    {
      name: dictionary.events,
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
  dictionary: SidebarDictionary
}

export function AppSidebar({
  locale,
  access,
  user,
  dictionary,
  ...props
}: AppSidebarProps) {
  const data = getData(locale, access, dictionary)
  const navigationLoading = useDashboardNavigationLoading()
  const dashboardHref = `/${locale}/dashboard`

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <Link
                href={dashboardHref as Route}
                onClick={() => navigationLoading?.startNavigation(dashboardHref)}
              >
                <Shell className="h-5 w-5" />
                <span className="text-base font-semibold">Janzu Portal</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.roleLinks} />
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} label={dictionary.community} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser locale={locale} user={{ ...user, avatar: user.avatar ?? "" }} dictionary={dictionary} />
      </SidebarFooter>
    </Sidebar>
  )
}
