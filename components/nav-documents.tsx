"use client"

import Link from "next/link"
import type { Route } from "next"
import { type LucideIcon } from "lucide-react"
import { useDashboardNavigationLoading } from "@/components/dashboard/dashboard-navigation-loading"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavDocuments({
  items,
  label,
}: {
  items: {
    name: string
    url: string
    icon: LucideIcon
  }[]
  label: string
}) {
  const navigationLoading = useDashboardNavigationLoading()

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link
                href={item.url as Route}
                onClick={() => navigationLoading?.startNavigation(item.url)}
              >
                <item.icon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
