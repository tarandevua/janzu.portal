import { redirect } from "next/navigation";
import type { Route } from "next";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { UserInviteDrawer } from "@/features/user-management/components/user-invite-drawer";
import { DeletedUserList } from "@/features/user-management/components/deleted-user-list";
import { UserRoleManagementTable } from "@/features/user-management/components/user-role-management-table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPrimaryRole, getRoleAccessList, hasPermission } from "@/server/services/rbac.service";
import {
  listDeletedUsersForManagement,
  listUsersForManagement,
} from "@/server/services/user-management.service";
import { roles, type ManagedUserFilters, type ManagedUserProfileFilter, type Role } from "@/server/models/rbac.model";

const PAGE_SIZE = 10;
const profileFilters = ["with_profile", "without_profile", "public_profile", "private_profile"] as const;

type UsersPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    status?: string;
    usersPage?: string;
    q?: string;
    role?: string;
    profile?: string;
    view?: string;
  }>;
};

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseRoleFilter(value: string | undefined): Role | undefined {
  return roles.includes(value as Role) ? value as Role : undefined;
}

function parseProfileFilter(value: string | undefined): ManagedUserProfileFilter | undefined {
  return profileFilters.includes(value as ManagedUserProfileFilter)
    ? value as ManagedUserProfileFilter
    : undefined;
}

function buildUsersHref(locale: Locale, page: number, filters: ManagedUserFilters) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("usersPage", String(page));
  }

  if (filters.search) {
    params.set("q", filters.search);
  }

  if (filters.role) {
    params.set("role", filters.role);
  }

  if (filters.profile) {
    params.set("profile", filters.profile);
  }

  const query = params.toString();
  return `/${locale}/dashboard/users${query ? `?${query}` : ""}`;
}

function buildDeletedUsersHref(locale: Locale, page: number, search?: string) {
  const params = new URLSearchParams({ view: "deleted" });

  if (page > 1) {
    params.set("usersPage", String(page));
  }

  if (search) {
    params.set("q", search);
  }

  return `/${locale}/dashboard/users?${params.toString()}`;
}

export default async function UsersPage({ params, searchParams }: UsersPageProps) {
  const [{ locale }, { status, usersPage, q, role, profile, view }] = await Promise.all([params, searchParams]);
  const currentUsersPage = parsePage(usersPage);
  const isDeletedView = view === "deleted";
  const search = q?.trim() || undefined;
  const filters: ManagedUserFilters = {
    search,
    role: parseRoleFilter(role),
    profile: parseProfileFilter(profile),
  };
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

  const usersPageData = isDeletedView
    ? null
    : await listUsersForManagement(
        supabase,
        data.user.id,
        currentUsersPage,
        PAGE_SIZE,
        filters
      );
  const deletedUsersPageData = isDeletedView
    ? await listDeletedUsersForManagement(
        supabase,
        data.user.id,
        currentUsersPage,
        PAGE_SIZE,
        search
      )
    : null;

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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2" aria-label={dictionary.userManagement.userViews}>
              <Button variant={isDeletedView ? "outline" : "default"} asChild>
                <Link href={`/${locale}/dashboard/users`}>
                  {dictionary.userManagement.activeUsers}
                </Link>
              </Button>
              <Button variant={isDeletedView ? "default" : "outline"} asChild>
                <Link href={buildDeletedUsersHref(locale, 1) as Route}>
                  {dictionary.userManagement.deletedUsers}
                </Link>
              </Button>
            </div>
            {!isDeletedView ? (
              <UserInviteDrawer
                locale={locale}
                actorRoles={roles}
                dictionary={dictionary.userManagement}
                cancelLabel={dictionary.common.cancel}
                closeLabel={dictionary.common.close}
                defaultOpen={shouldOpenCreateDrawer}
              />
            ) : null}
          </div>
          {deletedUsersPageData ? (
            <DeletedUserList
              locale={locale}
              users={deletedUsersPageData.items}
              page={currentUsersPage}
              pageSize={PAGE_SIZE}
              totalCount={deletedUsersPageData.totalCount}
              search={search}
              previousHref={buildDeletedUsersHref(locale, currentUsersPage - 1, search)}
              nextHref={buildDeletedUsersHref(locale, currentUsersPage + 1, search)}
              dictionary={dictionary.userManagement}
            />
          ) : usersPageData ? (
            <UserRoleManagementTable
              locale={locale}
              users={usersPageData.items}
              actorUserId={data.user.id}
              actorRoles={roles}
              status={status}
              page={currentUsersPage}
              pageSize={PAGE_SIZE}
              totalCount={usersPageData.totalCount}
              filters={filters}
              resetHref={buildUsersHref(locale, 1, {})}
              previousHref={buildUsersHref(locale, currentUsersPage - 1, filters)}
              nextHref={buildUsersHref(locale, currentUsersPage + 1, filters)}
              dictionary={dictionary.userManagement}
            />
          ) : null}
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
