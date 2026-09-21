import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { PublicLocationList } from "@/features/locations/components/public-location-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { listPublicLocations } from "@/server/services/location.service";
import { getRoleAccessList } from "@/server/services/rbac.service";

type PublicLocationsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function PublicLocationsPage({ params, searchParams }: PublicLocationsPageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);
  const [locations, roles] = await Promise.all([
    listPublicLocations(supabase, {
      communityReviewerUserId: data.user?.id ?? null,
    }),
    data.user ? listUserRoles(supabase, data.user.id) : Promise.resolve([]),
  ]);

  const content = (
    <PublicLocationList
      locale={locale}
      locations={locations}
      canReview={Boolean(data.user)}
      currentUserId={data.user?.id ?? null}
      embedded={Boolean(data.user)}
      status={status}
      dictionary={dictionary.locations}
    />
  );

  if (!data.user) {
    return content;
  }

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.locations.publicTitle}
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
