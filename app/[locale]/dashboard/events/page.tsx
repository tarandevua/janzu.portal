import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { EventCreateDrawer } from "@/features/events/components/event-create-drawer";
import { EventForm } from "@/features/events/components/event-form";
import { EventList } from "@/features/events/components/event-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { listEventsForDashboard } from "@/server/services/event.service";
import { getPrimaryRole, getRoleAccessList, hasPermission, hasRole } from "@/server/services/rbac.service";

type EventsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function EventsPage({ params, searchParams }: EventsPageProps) {
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

  const canManageEvents = hasPermission(roles, "events:manage");
  const canViewEvents = hasPermission(roles, "events:view");

  if (!canManageEvents && !canViewEvents) {
    redirect(`/${locale}/dashboard`);
  }

  const events = await listEventsForDashboard(supabase, roles, data.user.id);
  const shouldOpenCreateDrawer = status === "invalid" || status === "forbidden";

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.events.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          {canManageEvents ? (
            <div className="flex justify-end">
              <EventCreateDrawer
                defaultOpen={shouldOpenCreateDrawer}
                dictionary={{
                  ...dictionary.events,
                  cancel: dictionary.common.cancel,
                  close: dictionary.common.close,
                }}
              >
                <EventForm locale={locale} status={status} dictionary={dictionary.events} />
              </EventCreateDrawer>
            </div>
          ) : null}
          <EventList
            locale={locale}
            events={events}
            canManageEvents={canManageEvents}
            canDeleteEvents={hasRole(roles, "admin")}
            status={status}
            dictionary={dictionary.events}
          />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
