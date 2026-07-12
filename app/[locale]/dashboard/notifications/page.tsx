import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { NotificationList } from "@/features/notifications/components/notification-list";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { listMyNotifications } from "@/server/services/notification.service";
import { getPrimaryRole, getRoleAccessList } from "@/server/services/rbac.service";

const PAGE_SIZE = 10;

type NotificationsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string; notificationsPage?: string }>;
};

function parsePage(value: string | undefined) {
  const parsed = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function buildNotificationsHref(locale: Locale, page: number) {
  const params = new URLSearchParams();

  if (page > 1) {
    params.set("notificationsPage", String(page));
  }

  const query = params.toString();
  return `/${locale}/dashboard/notifications${query ? `?${query}` : ""}`;
}

export default async function NotificationsPage({
  params,
  searchParams,
}: NotificationsPageProps) {
  const [{ locale }, { status, notificationsPage }] = await Promise.all([params, searchParams]);
  const currentPage = parsePage(notificationsPage);
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

  const summary = await listMyNotifications(supabase, data.user.id, currentPage, PAGE_SIZE);

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.notifications.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          <NotificationList
            locale={locale}
            notifications={summary.notifications}
            unreadCount={summary.unreadCount}
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalCount={summary.totalCount}
            previousHref={buildNotificationsHref(locale, currentPage - 1)}
            nextHref={buildNotificationsHref(locale, currentPage + 1)}
            status={status}
            dictionary={dictionary.notifications}
          />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
