import { notFound, redirect } from "next/navigation"
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame"
import { KnowledgeBaseShell } from "@/components/knowledge-base/knowledge-layout"
import type { Locale } from "@/lib/i18n/config"
import { isLocale } from "@/lib/i18n/config"
import { getDictionary } from "@/lib/i18n/dictionaries"
import { getKnowledgeSections } from "@/lib/knowledge-base/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { listUserRoles } from "@/server/repositories/rbac.repository"
import { getRoleAccessList } from "@/server/services/rbac.service"

export const dynamic = "force-dynamic"

export default async function KnowledgeBaseLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale: localeParam } = await params
  if (!isLocale(localeParam)) notFound()
  const locale: Locale = localeParam

  const supabase = await createSupabaseServerClient()
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ])
  if (!data.user) redirect(`/${locale}/login?status=auth-required`)

  const userRoles = await listUserRoles(supabase, data.user.id)
  const sections = await getKnowledgeSections(locale, userRoles)

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(userRoles)}
      title={dictionary.knowledgeBase.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <KnowledgeBaseShell sections={sections} labels={dictionary.knowledgeBase}>
        {children}
      </KnowledgeBaseShell>
    </JanzuDashboardFrame>
  )
}
