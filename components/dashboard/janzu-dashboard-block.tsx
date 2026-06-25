import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { DataTable } from "@/components/data-table"
import { janzuWorkflowData } from "@/components/dashboard/janzu-dashboard-data"
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame"
import { SectionCards } from "@/components/section-cards"
import type { Locale } from "@/lib/i18n/config"
import type { Role, RoleAccess } from "@/server/models/rbac.model"

type JanzuDashboardBlockProps = {
  locale: Locale
  activeRole: Role
  access: RoleAccess[]
  user: {
    name: string
    email: string
    avatar?: string
  }
  title: string
}

export function JanzuDashboardBlock({
  locale,
  activeRole,
  access,
  user,
  title,
}: JanzuDashboardBlockProps) {
  return (
    <JanzuDashboardFrame
      locale={locale}
      activeRole={activeRole}
      access={access}
      user={user}
      title={title}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <SectionCards />
            <div className="px-4 lg:px-6">
              <ChartAreaInteractive />
            </div>
            <DataTable data={janzuWorkflowData} />
          </div>
        </div>
      </div>
    </JanzuDashboardFrame>
  )
}
