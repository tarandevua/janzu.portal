import { redirect } from "next/navigation";
import { DashboardActionDrawer } from "@/components/dashboard/dashboard-action-drawer";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { LocationForm } from "@/features/locations/components/location-form";
import { LocationList } from "@/features/locations/components/location-list";
import { LocationReviewQueue } from "@/features/locations/components/location-review-queue";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  listLocationReviewQueue,
  listMyLocations,
} from "@/server/services/location.service";
import { getPrimaryRole, getRoleAccessList, hasPermission } from "@/server/services/rbac.service";

type LocationsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function LocationsPage({ params, searchParams }: LocationsPageProps) {
  const [{ locale }, { status }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);

  if (!data.user) {
    redirect(`/${locale}/login?status=auth-required`);
  }

  const [roles, practitioner] = await Promise.all([
    listUserRoles(supabase, data.user.id),
    getPractitionerProfileByUserId(supabase, data.user.id),
  ]);
  const primaryRole = getPrimaryRole(roles);
  const canApproveLocations = hasPermission(roles, "locations:approve");

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }

  if (!practitioner && !canApproveLocations) {
    redirect(`/${locale}/dashboard/profile`);
  }

  const [myLocations, reviewLocations] = await Promise.all([
    practitioner ? listMyLocations(supabase, data.user.id) : Promise.resolve([]),
    canApproveLocations ? listLocationReviewQueue(supabase) : Promise.resolve([]),
  ]);
  const shouldOpenCreateDrawer = status === "invalid";

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.locations.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          {practitioner ? (
            <div className="flex justify-end">
              <DashboardActionDrawer
                title={dictionary.locations.formTitle}
                description={dictionary.locations.formDescription}
                triggerLabel={dictionary.locations.formTitle}
                cancelLabel={dictionary.common.cancel}
                closeLabel={dictionary.common.close}
                defaultOpen={shouldOpenCreateDrawer}
              >
                <LocationForm
                  locale={locale}
                  status={status}
                  variant="plain"
                  dictionary={dictionary.locations}
                />
              </DashboardActionDrawer>
            </div>
          ) : null}
          <div className="grid gap-4">
            {practitioner ? (
              <LocationList locale={locale} locations={myLocations} dictionary={dictionary.locations} />
            ) : null}
            {canApproveLocations ? (
              <LocationReviewQueue
                locale={locale}
                locations={reviewLocations}
                status={status}
                dictionary={dictionary.locations}
              />
            ) : null}
          </div>
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
