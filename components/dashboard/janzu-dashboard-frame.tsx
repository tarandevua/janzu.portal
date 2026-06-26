import type { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import type { Locale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import type { RoleAccess } from "@/server/models/rbac.model"
import { countMyUnreadNotifications } from "@/server/services/notification.service"

type DashboardUser = {
  id: string
  name: string
  email: string
  avatar?: string
}

type JanzuDashboardFrameProps = {
  locale: Locale
  access: RoleAccess[]
  user: DashboardUser
  title: string
  children: ReactNode
}

export async function JanzuDashboardFrame({
  locale,
  access,
  user,
  title,
  children,
}: JanzuDashboardFrameProps) {
  const [unreadCount, dictionary] = await Promise.all([
    createSupabaseServerClient()
      .then((supabase) => countMyUnreadNotifications(supabase, user.id))
      .catch(() => 0),
    getDictionary(locale),
  ])

  return (
    <SidebarProvider>
      <AppSidebar
        variant="inset"
        locale={locale}
        access={access}
        user={user}
        dictionary={dictionary.dashboard.sidebar}
      />
      <SidebarInset>
        <SiteHeader title={title} locale={locale} unreadCount={unreadCount} />
        {children}
      </SidebarInset>
    </SidebarProvider>
  )
}
