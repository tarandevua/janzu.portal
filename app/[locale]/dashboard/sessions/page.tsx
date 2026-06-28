import { redirect } from "next/navigation";
import { DashboardActionDrawer } from "@/components/dashboard/dashboard-action-drawer";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { SessionRequestList } from "@/features/session-requests/components/session-request-list";
import { SessionAvailabilityManager } from "@/features/sessions/components/session-availability-manager";
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
import { listSessionsByPractitionerIdPage } from "@/server/repositories/session.repository";
import { findFeedbackForSessions } from "@/server/services/feedback.service";
import { getPrimaryRole, getRoleAccessList } from "@/server/services/rbac.service";

const PAGE_SIZE = 10;

type SessionsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{
    status?: string;
    sessionsPage?: string;
    requestsPage?: string;
  }>;
};

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function buildSessionsHref(
  locale: Locale,
  nextSessionsPage: number,
  requestsPage: number
) {
  const params = new URLSearchParams();

  if (nextSessionsPage > 1) {
    params.set("sessionsPage", String(nextSessionsPage));
  }

  if (requestsPage > 1) {
    params.set("requestsPage", String(requestsPage));
  }

  const query = params.toString();
  return `/${locale}/dashboard/sessions${query ? `?${query}` : ""}`;
}

function buildRequestsHref(
  locale: Locale,
  sessionsPage: number,
  nextRequestsPage: number
) {
  const params = new URLSearchParams();

  if (sessionsPage > 1) {
    params.set("sessionsPage", String(sessionsPage));
  }

  if (nextRequestsPage > 1) {
    params.set("requestsPage", String(nextRequestsPage));
  }

  const query = params.toString();
  return `/${locale}/dashboard/sessions${query ? `?${query}` : ""}`;
}

export default async function SessionsPage({ params, searchParams }: SessionsPageProps) {
  const [{ locale }, search] = await Promise.all([params, searchParams]);
  const { status } = search;
  const sessionsPage = parsePage(search.sessionsPage);
  const requestsPage = parsePage(search.requestsPage);
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

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }

  if (!practitioner) {
    redirect(`/${locale}/dashboard/profile`);
  }

  const [clients, sessionsPageData, sessionRequestsPageData, availabilitySlots] = await Promise.all([
    listClientsByPractitionerId(supabase, practitioner.id),
    listSessionsByPractitionerIdPage(supabase, practitioner.id, sessionsPage, PAGE_SIZE),
    listSessionRequestsByPractitionerIdPage(
      supabase,
      practitioner.id,
      requestsPage,
      PAGE_SIZE
    ),
    listUpcomingAvailabilitySlotsByPractitionerId(supabase, practitioner.id),
  ]);
  const sessions = sessionsPageData.items;
  const sessionRequests = sessionRequestsPageData.items;
  const feedbackLinks = await findFeedbackForSessions(
    supabase,
    sessions.map((session) => session.id)
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
          <div className="flex justify-end">
            <DashboardActionDrawer
              title={dictionary.sessions.formTitle}
              description={dictionary.sessions.formDescription}
              triggerLabel={dictionary.sessions.formTitle}
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
          <SessionAvailabilityManager
            locale={locale}
            slots={availabilitySlots}
            status={status}
            dictionary={dictionary.sessions}
          />
          <SessionList
            locale={locale}
            sessions={sessions}
            clients={clients}
            feedbackLinks={feedbackLinks}
            siteUrl={siteUrl.replace(/\/$/, "")}
            page={sessionsPage}
            pageSize={PAGE_SIZE}
            totalCount={sessionsPageData.totalCount}
            previousHref={buildSessionsHref(locale, sessionsPage - 1, requestsPage)}
            nextHref={buildSessionsHref(locale, sessionsPage + 1, requestsPage)}
            dictionary={dictionary.sessions}
          />
          <SessionRequestList
            locale={locale}
            requests={sessionRequests}
            page={requestsPage}
            pageSize={PAGE_SIZE}
            totalCount={sessionRequestsPageData.totalCount}
            previousHref={buildRequestsHref(locale, sessionsPage, requestsPage - 1)}
            nextHref={buildRequestsHref(locale, sessionsPage, requestsPage + 1)}
            status={status}
            dictionary={dictionary.sessionRequests}
          />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
