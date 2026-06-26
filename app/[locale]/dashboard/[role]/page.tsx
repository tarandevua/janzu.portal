import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { JanzuDashboardBlock } from "@/components/dashboard/janzu-dashboard-block";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  canAccessDashboard,
  getPrimaryRole,
  getRoleAccessList,
  getRoleDashboardPath,
  isRole
} from "@/server/services/rbac.service";

type RoleDashboardPageProps = {
  params: Promise<{
    locale: Locale;
    role: string;
  }>;
};

export default async function RoleDashboardPage({ params }: RoleDashboardPageProps) {
  const { locale, role } = await params;

  if (!isRole(role)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale)
  ]);

  if (!data.user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const userRoles = await listUserRoles(supabase, data.user.id);

  if (!canAccessDashboard(userRoles, role)) {
    const primaryRole = getPrimaryRole(userRoles);

    if (primaryRole) {
      redirect(getRoleDashboardPath(locale, primaryRole) as Route);
    }

    redirect(`/${locale}/dashboard`);
  }

  const roleDictionary = dictionary.dashboard.roles[role];
  const access = getRoleAccessList(userRoles);

  return (
    <JanzuDashboardBlock
      locale={locale}
      access={access}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url
      }}
        title={roleDictionary.title}
    />
  );
}
