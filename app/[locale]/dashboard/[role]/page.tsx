import { notFound, redirect } from "next/navigation";
import type { Route } from "next";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { JanzuDashboardBlock } from "@/components/dashboard/janzu-dashboard-block";
import { PractitionerDashboard } from "@/components/dashboard/practitioner-dashboard";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getAdminDashboardData } from "@/server/services/admin-dashboard.service";
import { getPractitionerDashboardData } from "@/server/services/practitioner-dashboard.service";
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
  const user = {
    id: data.user.id,
    name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
    email: data.user.email ?? "",
    avatar: data.user.user_metadata.avatar_url
  };

  if (role === "practitioner") {
    const dashboardData = await getPractitionerDashboardData(supabase, data.user.id);

    return (
      <PractitionerDashboard
        locale={locale}
        access={access}
        user={user}
        title={roleDictionary.title}
        data={dashboardData}
        dictionary={dictionary.dashboard.practitionerData}
      />
    );
  }

  if (role === "admin") {
    const dashboardData = await getAdminDashboardData(supabase, data.user.id);

    return (
      <AdminDashboard
        locale={locale}
        access={access}
        user={user}
        title={roleDictionary.title}
        data={dashboardData}
        dictionary={dictionary.dashboard.adminData}
      />
    );
  }

  return (
    <JanzuDashboardBlock
      locale={locale}
      access={access}
      user={user}
      title={roleDictionary.title}
    />
  );
}
