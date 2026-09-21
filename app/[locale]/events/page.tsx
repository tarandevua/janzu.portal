import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { PublicEventList } from "@/features/events/components/public-event-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { listPublicEvents } from "@/server/services/event.service";
import { getRoleAccessList } from "@/server/services/rbac.service";

type PublicEventsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function PublicEventsPage({ params, searchParams }: PublicEventsPageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);
  const [events, roles] = await Promise.all([
    listPublicEvents(supabase, data.user?.id),
    data.user ? listUserRoles(supabase, data.user.id) : Promise.resolve([]),
  ]);

  const content = (
    <PublicEventList
      locale={locale}
      events={events}
      isSignedIn={Boolean(data.user)}
      embedded={Boolean(data.user)}
      status={status}
      dictionary={dictionary.events}
    />
  );

  if (!data.user) {
    return content;
  }

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.events.publicTitle}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu member",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="p-4 md:p-6">{content}</div>
    </JanzuDashboardFrame>
  );
}
