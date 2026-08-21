import type { Route } from "next";
import { redirect } from "next/navigation";
import { DashboardActionDrawer } from "@/components/dashboard/dashboard-action-drawer";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { PractitionerProfileRequiredAlert } from "@/components/dashboard/practitioner-profile-required-alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionRequestList } from "@/features/session-requests/components/session-request-list";
import { AdminSessionList } from "@/features/sessions/components/admin-session-list";
import { SessionAvailabilityManager } from "@/features/sessions/components/session-availability-manager";
import { SessionDashboardTabs, type SessionDashboardTab } from "@/features/sessions/components/session-dashboard-tabs";
import { SessionForm } from "@/features/sessions/components/session-form";
import { SessionList } from "@/features/sessions/components/session-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listClientsByPractitionerId } from "@/server/repositories/client.repository";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import { listUpcomingAvailabilitySlotsByPractitionerId } from "@/server/repositories/session-availability.repository";
import { listSessionRequestsByPractitionerIdPage } from "@/server/repositories/session-request.repository";
import {
  listAdminSessionParticipants,
  listAdminSessionsPage,
  listSessionsByPractitionerIdPage,
} from "@/server/repositories/session.repository";
import { findFeedbackForSessions } from "@/server/services/feedback.service";
import { getPrimaryRole, getRoleAccessList, hasPermission, hasRole } from "@/server/services/rbac.service";
import type { AdminSessionFilters, SessionValidationFilter } from "@/server/models/session.model";

const PAGE_SIZE = 10;
const sessionTabs = ["history", "requests", "availability", "all"] as const;
const validationFilters = ["all", "validated", "pending"] as const;

type SessionsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    status?: string;
    sessionsPage?: string;
    requestsPage?: string;
    allSessionsPage?: string;
    tab?: string;
    participantId?: string;
    validation?: string;
  }>;
};

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function parseTab(value: string | undefined): SessionDashboardTab {
  return sessionTabs.includes(value as SessionDashboardTab) ? value as SessionDashboardTab : "history";
}

function parseValidationFilter(value: string | undefined): SessionValidationFilter {
  return validationFilters.includes(value as SessionValidationFilter)
    ? value as SessionValidationFilter
    : "all";
}

function setTabParam(params: URLSearchParams, tab: SessionDashboardTab) {
  if (tab !== "history") {
    params.set("tab", tab);
  }
}

function buildSessionsHref(
  locale: Locale,
  nextSessionsPage: number,
  requestsPage: number,
  tab: SessionDashboardTab,
  allSessionsPage = 1,
  adminFilters: AdminSessionFilters = {}
) {
  const params = new URLSearchParams();
  setTabParam(params, tab);

  if (nextSessionsPage > 1) {
    params.set("sessionsPage", String(nextSessionsPage));
  }

  if (requestsPage > 1) {
    params.set("requestsPage", String(requestsPage));
  }

  if (allSessionsPage > 1) {
    params.set("allSessionsPage", String(allSessionsPage));
  }

  if (adminFilters.practitionerId) {
    params.set("participantId", adminFilters.practitionerId);
  }

  if (adminFilters.validation && adminFilters.validation !== "all") {
    params.set("validation", adminFilters.validation);
  }

  const query = params.toString();
  return `/${locale}/dashboard/sessions${query ? `?${query}` : ""}`;
}

function buildRequestsHref(
  locale: Locale,
  sessionsPage: number,
  nextRequestsPage: number,
  tab: SessionDashboardTab,
  allSessionsPage = 1,
  adminFilters: AdminSessionFilters = {}
) {
  const params = new URLSearchParams();
  setTabParam(params, tab);

  if (sessionsPage > 1) {
    params.set("sessionsPage", String(sessionsPage));
  }

  if (nextRequestsPage > 1) {
    params.set("requestsPage", String(nextRequestsPage));
  }

  if (allSessionsPage > 1) {
    params.set("allSessionsPage", String(allSessionsPage));
  }

  if (adminFilters.practitionerId) {
    params.set("participantId", adminFilters.practitionerId);
  }

  if (adminFilters.validation && adminFilters.validation !== "all") {
    params.set("validation", adminFilters.validation);
  }

  const query = params.toString();
  return `/${locale}/dashboard/sessions${query ? `?${query}` : ""}`;
}

function buildTabHref(
  locale: Locale,
  tab: SessionDashboardTab,
  sessionsPage: number,
  requestsPage: number,
  allSessionsPage: number,
  adminFilters: AdminSessionFilters
) {
  if (tab === "history") {
    return buildSessionsHref(locale, sessionsPage, requestsPage, tab, allSessionsPage, adminFilters);
  }

  return buildRequestsHref(locale, sessionsPage, requestsPage, tab, allSessionsPage, adminFilters);
}

function PublicProfileRequiredMessage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default async function SessionsPage({ params, searchParams }: SessionsPageProps) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  const { status } = search;
  const sessionsPage = parsePage(search.sessionsPage);
  const requestsPage = parsePage(search.requestsPage);
  const allSessionsPage = parsePage(search.allSessionsPage);
  const adminFilters: AdminSessionFilters = {
    practitionerId: search.participantId || undefined,
    validation: parseValidationFilter(search.validation),
  };
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
  const canReviewAllSessions = hasPermission(roles, "users:manage");
  const parsedTab = parseTab(search.tab);
  const canUseSessionHistory =
    hasRole(roles, "apprentice") || hasRole(roles, "practitioner") || hasRole(roles, "facilitator");
  const canUsePublicSessionTools = hasRole(roles, "practitioner") || hasRole(roles, "facilitator");

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }

  const practitionerProfileRequired = !practitioner && !canReviewAllSessions;

  const availableTabValues: SessionDashboardTab[] = [
    ...(canUseSessionHistory && practitioner ? (["history"] as const) : []),
    ...(canUsePublicSessionTools && practitioner ? (["requests", "availability"] as const) : []),
    ...(canReviewAllSessions ? (["all"] as const) : []),
  ];
  const activeTab = availableTabValues.includes(parsedTab)
    ? parsedTab
    : availableTabValues[0] ?? "history";
  const isPublicProfile = practitioner?.isPublic === true;

  const [
    clients,
    sessionsPageData,
    sessionRequestsPageData,
    availabilitySlots,
    adminSessionsPageData,
    adminSessionParticipants,
  ] = await Promise.all([
    practitioner ? listClientsByPractitionerId(supabase, practitioner.id) : Promise.resolve([]),
    practitioner
      ? listSessionsByPractitionerIdPage(
          supabase,
          practitioner.id,
          sessionsPage,
          PAGE_SIZE,
          adminFilters.validation
        )
      : Promise.resolve({ items: [], totalCount: 0 }),
    practitioner
      ? listSessionRequestsByPractitionerIdPage(
          supabase,
          practitioner.id,
          requestsPage,
          PAGE_SIZE
        )
      : Promise.resolve({ items: [], totalCount: 0 }),
    practitioner
      ? listUpcomingAvailabilitySlotsByPractitionerId(supabase, practitioner.id, 200)
      : Promise.resolve([]),
    canReviewAllSessions
      ? listAdminSessionsPage(supabase, allSessionsPage, PAGE_SIZE, adminFilters)
      : Promise.resolve({ items: [], totalCount: 0 }),
    canReviewAllSessions ? listAdminSessionParticipants(supabase) : Promise.resolve([]),
  ]);
  const sessions = sessionsPageData.items;
  const adminSessions = adminSessionsPageData.items;
  const sessionRequests = sessionRequestsPageData.items;
  const feedbackLinks = await findFeedbackForSessions(
    supabase,
    [...new Set([...sessions.map((session) => session.id), ...adminSessions.map((session) => session.id)])]
  );
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";
  const shouldOpenCreateDrawer = status === "invalid";

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.sessions.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          {practitionerProfileRequired ? (
            <PractitionerProfileRequiredAlert
              href={`/${locale}/dashboard/profile`}
              title={dictionary.clients.profileRequiredTitle}
              description={dictionary.clients.profileRequiredDescription}
              actionLabel={dictionary.clients.profileRequiredAction}
            />
          ) : (
            <>
              {practitioner ? (
                <div className="flex justify-end">
                  <DashboardActionDrawer
                    title={dictionary.sessions.formTitle}
                    description={dictionary.sessions.formDescription}
                    triggerLabel={dictionary.sessions.formTitle}
                    cancelLabel={dictionary.common.cancel}
                    closeLabel={dictionary.common.close}
                    defaultOpen={shouldOpenCreateDrawer}
                  >
                    <SessionForm
                      locale={locale}
                      clients={clients}
                      status={status}
                      variant="plain"
                      dictionary={dictionary.sessions}
                    />
                  </DashboardActionDrawer>
                </div>
              ) : null}
              <SessionDashboardTabs
            activeTab={activeTab}
            tabs={{
              ...(canUseSessionHistory && practitioner
                ? {
                    history: {
                      label: dictionary.sessions.listTitle,
                      href: buildTabHref(locale, "history", sessionsPage, requestsPage, allSessionsPage, adminFilters) as Route,
                      content: (
                        <SessionList
                          locale={locale}
                          sessions={sessions}
                          clients={clients}
                          feedbackLinks={feedbackLinks}
                          siteUrl={siteUrl.replace(/\/$/, "")}
                          page={sessionsPage}
                          pageSize={PAGE_SIZE}
                          totalCount={sessionsPageData.totalCount}
                          validationFilter={adminFilters.validation ?? "all"}
                          resetHref={buildTabHref(locale, "history", 1, requestsPage, allSessionsPage, {
                            ...adminFilters,
                            validation: "all",
                          })}
                          previousHref={buildSessionsHref(locale, sessionsPage - 1, requestsPage, "history", allSessionsPage, adminFilters)}
                          nextHref={buildSessionsHref(locale, sessionsPage + 1, requestsPage, "history", allSessionsPage, adminFilters)}
                          dictionary={dictionary.sessions}
                          feedbackDictionary={dictionary.feedback}
                        />
                      ),
                    },
                  }
                : {}),
              ...(canUsePublicSessionTools && practitioner
                ? {
                    requests: {
                      label: dictionary.sessionRequests.listTitle,
                      href: buildTabHref(locale, "requests", sessionsPage, requestsPage, allSessionsPage, adminFilters) as Route,
                      content: isPublicProfile ? (
                        <SessionRequestList
                          locale={locale}
                          requests={sessionRequests}
                          page={requestsPage}
                          pageSize={PAGE_SIZE}
                          totalCount={sessionRequestsPageData.totalCount}
                          previousHref={buildRequestsHref(locale, sessionsPage, requestsPage - 1, "requests", allSessionsPage, adminFilters)}
                          nextHref={buildRequestsHref(locale, sessionsPage, requestsPage + 1, "requests", allSessionsPage, adminFilters)}
                          status={status}
                          dictionary={dictionary.sessionRequests}
                        />
                      ) : (
                        <PublicProfileRequiredMessage
                          title={dictionary.sessionRequests.listTitle}
                          description={dictionary.sessions.publicProfileRequired}
                        />
                      ),
                    },
                    availability: {
                      label: dictionary.sessions.availabilityTitle,
                      href: buildTabHref(locale, "availability", sessionsPage, requestsPage, allSessionsPage, adminFilters) as Route,
                      content: isPublicProfile ? (
                        <SessionAvailabilityManager
                          locale={locale}
                          slots={availabilitySlots}
                          status={status}
                          dictionary={dictionary.sessions}
                        />
                      ) : (
                        <PublicProfileRequiredMessage
                          title={dictionary.sessions.availabilityTitle}
                          description={dictionary.sessions.publicProfileRequired}
                        />
                      ),
                    },
                  }
                : {}),
              ...(canReviewAllSessions
                ? {
                    all: {
                      label: dictionary.sessions.allSessionsTitle,
                      href: buildTabHref(locale, "all", sessionsPage, requestsPage, allSessionsPage, adminFilters) as Route,
                      content: (
                        <AdminSessionList
                          locale={locale}
                          sessions={adminSessions}
                          feedbackLinks={feedbackLinks}
                          participants={adminSessionParticipants}
                          filters={adminFilters}
                          page={allSessionsPage}
                          pageSize={PAGE_SIZE}
                          totalCount={adminSessionsPageData.totalCount}
                          resetHref={buildTabHref(locale, "all", sessionsPage, requestsPage, 1, {})}
                          previousHref={buildSessionsHref(locale, sessionsPage, requestsPage, "all", allSessionsPage - 1, adminFilters)}
                          nextHref={buildSessionsHref(locale, sessionsPage, requestsPage, "all", allSessionsPage + 1, adminFilters)}
                          dictionary={dictionary.sessions}
                          feedbackDictionary={dictionary.feedback}
                        />
                      ),
                    },
                  }
                : {}),
            }}
              />
            </>
          )}
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
