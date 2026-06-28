import { PublicLocationList } from "@/features/locations/components/public-location-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listPublicLocations } from "@/server/services/location.service";

type PublicLocationsPageProps = {
  params: Promise<{ locale: Locale }>;
};

export default async function PublicLocationsPage({ params }: PublicLocationsPageProps) {
  const { locale } = await params;
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);
  const locations = await listPublicLocations(supabase, {
    communityReviewerUserId: data.user?.id ?? null,
  });

  return (
    <PublicLocationList
      locale={locale}
      locations={locations}
      canReview={Boolean(data.user)}
      currentUserId={data.user?.id ?? null}
      dictionary={dictionary.locations}
    />
  );
}
