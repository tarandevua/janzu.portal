import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { HeaderActions } from "@/components/header-actions"
import type { Locale } from "@/lib/i18n/config"

type SiteHeaderProps = {
  title: string
  locale: Locale
  unreadCount: number
  latestNotifications: {
    id: string
    title: string
    body: string | null
    href: string | null
    createdAtLabel: string
  }[]
  notificationCount: number
  notificationDictionary: {
    title: string
    empty: string
    unread: string
    viewMore: string
  }
}

export function SiteHeader({
  title,
  locale,
  unreadCount,
  latestNotifications,
  notificationCount,
  notificationDictionary,
}: SiteHeaderProps) {
  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-12 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <HeaderActions
          locale={locale}
          unreadCount={unreadCount}
          latestNotifications={latestNotifications}
          notificationCount={notificationCount}
          dictionary={notificationDictionary}
        />
      </div>
    </header>
  )
}
