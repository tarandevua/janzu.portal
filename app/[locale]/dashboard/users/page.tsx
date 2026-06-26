import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { UserInviteForm } from "@/features/user-management/components/user-invite-form";
import { UserRoleManagementTable } from "@/features/user-management/components/user-role-management-table";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPrimaryRole, getRoleAccessList, hasPermission } from "@/server/services/rbac.service";
import { listUsersForManagement } from "@/server/services/user-management.service";

type UsersPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function UsersPage({ params, searchParams }: UsersPageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);

  if (!data.user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const roles = await listUserRoles(supabase, data.user.id);
  const primaryRole = getPrimaryRole(roles);

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }

  if (!hasPermission(roles, "users:manage")) {
    redirect(`/${locale}/dashboard`);
  }

  const users = await listUsersForManagement(supabase, data.user.id);

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.userManagement.title}
      user={{
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          <UserInviteForm
            locale={locale}
            actorRoles={roles}
            status={status}
            dictionary={dictionary.userManagement}
          />
          <UserRoleManagementTable
            locale={locale}
            users={users}
            actorRoles={roles}
            status={status}
            dictionary={dictionary.userManagement}
          />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
