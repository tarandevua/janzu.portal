import type { Route } from "next";
import { redirect } from "next/navigation";
import { DashboardActionDrawer } from "@/components/dashboard/dashboard-action-drawer";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import {
  LocationDashboardTabs,
  type LocationDashboardTab,
} from "@/features/locations/components/location-dashboard-tabs";
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
  searchParams: Promise<{ status?: string; tab?: string }>;
};

function parseTab(value: string | undefined): LocationDashboardTab {
  return value === "approvals" ? "approvals" : "submitted";
}

function buildLocationsHref(locale: Locale, tab: LocationDashboardTab) {
  const params = new URLSearchParams();

  if (tab !== "submitted") {
    params.set("tab", tab);
  }

  const query = params.toString();
  return `/${locale}/dashboard/locations${query ? `?${query}` : ""}`;
}

export default async function LocationsPage({ params, searchParams }: LocationsPageProps) {
  const [{ locale }, { status, tab }] = await Promise.all([params, searchParams]);
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
  const requestedTab = parseTab(tab);

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
  const availableTabs = [
    ...(practitioner
      ? [
          {
            value: "submitted" as const,
            label: dictionary.locations.listTitle,
            href: buildLocationsHref(locale, "submitted") as Route,
            content: (
              <LocationList locale={locale} locations={myLocations} dictionary={dictionary.locations} />
            ),
          },
        ]
      : []),
    ...(canApproveLocations
      ? [
          {
            value: "approvals" as const,
            label: dictionary.locations.reviewTitle,
            href: buildLocationsHref(locale, "approvals") as Route,
            content: (
              <LocationReviewQueue
                locale={locale}
                locations={reviewLocations}
                status={status}
                dictionary={dictionary.locations}
              />
            ),
          },
        ]
      : []),
  ];
  const activeTab = availableTabs.some((item) => item.value === requestedTab)
    ? requestedTab
    : availableTabs[0]?.value ?? "submitted";
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
          <LocationDashboardTabs activeTab={activeTab} tabs={availableTabs} />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
