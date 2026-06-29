import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { DashboardActionDrawer } from "@/components/dashboard/dashboard-action-drawer";
import { UserInviteForm } from "@/features/user-management/components/user-invite-form";
import { UserRoleManagementTable } from "@/features/user-management/components/user-role-management-table";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPrimaryRole, getRoleAccessList, hasPermission } from "@/server/services/rbac.service";
import { listUsersForManagement } from "@/server/services/user-management.service";

const PAGE_SIZE = 10;

type UsersPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string; usersPage?: string }>;
};

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function buildUsersHref(locale: Locale, page: number) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("usersPage", String(page));
  }

  const query = params.toString();
  return `/${locale}/dashboard/users${query ? `?${query}` : ""}`;
}

export default async function UsersPage({ params, searchParams }: UsersPageProps) {
  const [{ locale }, { status, usersPage }] = await Promise.all([params, searchParams]);
  const currentUsersPage = parsePage(usersPage);
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
  const shouldOpenCreateDrawer = status === "invalid";

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }

  if (!hasPermission(roles, "users:manage")) {
    redirect(`/${locale}/dashboard`);
  }

  const usersPageData = await listUsersForManagement(
    supabase,
    data.user.id,
    currentUsersPage,
    PAGE_SIZE
  );

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.userManagement.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          <div className="flex justify-end">
            <DashboardActionDrawer
              title={dictionary.userManagement.inviteTitle}
              description={dictionary.userManagement.inviteDescription}
              triggerLabel={dictionary.userManagement.invite}
              defaultOpen={shouldOpenCreateDrawer}
            >
              <UserInviteForm
                locale={locale}
                actorRoles={roles}
                status={status}
                dictionary={dictionary.userManagement}
              />
            </DashboardActionDrawer>
          </div>
          <UserRoleManagementTable
            locale={locale}
            users={usersPageData.items}
            actorRoles={roles}
            status={status}
            page={currentUsersPage}
            pageSize={PAGE_SIZE}
            totalCount={usersPageData.totalCount}
            previousHref={buildUsersHref(locale, currentUsersPage - 1)}
            nextHref={buildUsersHref(locale, currentUsersPage + 1)}
            dictionary={dictionary.userManagement}
          />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
