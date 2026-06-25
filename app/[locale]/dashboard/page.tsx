import { redirect } from "next/navigation";
import type { Route } from "next";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPrimaryRole, getRoleAccessList, getRoleDashboardPath } from "@/server/services/rbac.service";

type DashboardPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale)
  ]);

  if (!data.user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const roles = await listUserRoles(supabase, data.user.id);
  const primaryRole = getPrimaryRole(roles);

  if (primaryRole) {
    redirect(getRoleDashboardPath(locale, primaryRole) as Route);
  }

  return (
    <DashboardShell locale={locale} access={getRoleAccessList(roles)}>
      <Card>
        <CardHeader>
          <CardTitle>{dictionary.dashboard.pendingTitle}</CardTitle>
          <CardDescription>{dictionary.dashboard.pendingDescription}</CardDescription>
        </CardHeader>
      </Card>
    </DashboardShell>
  );
}
