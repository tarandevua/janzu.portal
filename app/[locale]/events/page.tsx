import { PublicEventList } from "@/features/events/components/public-event-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listPublicEvents } from "@/server/services/event.service";

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
  const events = await listPublicEvents(supabase, data.user?.id);

  return (
    <PublicEventList
      locale={locale}
      events={events}
      status={status}
      dictionary={dictionary.events}
    />
  );
}
