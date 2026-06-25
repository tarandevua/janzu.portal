import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { Locale } from "@/lib/i18n/config"
import type { Role, RoleAccess } from "@/server/models/rbac.model"

type DashboardUser = {
  name: string
  email: string
  avatar?: string
}

type JanzuDashboardFrameProps = {
  locale: Locale
  activeRole: Role
  access: RoleAccess[]
  user: DashboardUser
  title: string
  children: ReactNode
}

export function JanzuDashboardFrame({
  locale,
  activeRole,
  access,
  user,
  title,
  children,
}: JanzuDashboardFrameProps) {
  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        locale={locale}
        activeRole={activeRole}
        access={access}
        user={user}
      />
      <SidebarInset>
        <SiteHeader title={title} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
