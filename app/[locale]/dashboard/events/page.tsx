import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { EventCreateDrawer } from "@/features/events/components/event-create-drawer";
import { EventForm } from "@/features/events/components/event-form";
import { EventList } from "@/features/events/components/event-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { listEventsForManagement } from "@/server/services/event.service";
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

  if (!hasPermission(roles, "events:manage")) {
    redirect(`/${locale}/dashboard`);
  }

  const events = await listEventsForManagement(supabase, roles);
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
          <EventList
            locale={locale}
            events={events}
            canDeleteEvents={hasRole(roles, "admin")}
            status={status}
            dictionary={dictionary.events}
          />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
