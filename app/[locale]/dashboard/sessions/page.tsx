import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { SessionRequestList } from "@/features/session-requests/components/session-request-list";
import { SessionForm } from "@/features/sessions/components/session-form";
import { SessionList } from "@/features/sessions/components/session-list";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listClientsByPractitionerId } from "@/server/repositories/client.repository";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import { listSessionRequestsByPractitionerId } from "@/server/repositories/session-request.repository";
import { listSessionsByPractitionerId } from "@/server/repositories/session.repository";
import { findFeedbackForSessions } from "@/server/services/feedback.service";
import { getPrimaryRole, getRoleAccessList } from "@/server/services/rbac.service";

type SessionsPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string }>;
};

export default async function SessionsPage({ params, searchParams }: SessionsPageProps) {
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

  if (!primaryRole) {
    redirect(`/${locale}/dashboard`);
  }

  if (!practitioner) {
    redirect(`/${locale}/dashboard/profile`);
  }

  const [clients, sessions, sessionRequests] = await Promise.all([
    listClientsByPractitionerId(supabase, practitioner.id),
    listSessionsByPractitionerId(supabase, practitioner.id),
    listSessionRequestsByPractitionerId(supabase, practitioner.id),
  ]);
  const feedbackLinks = await findFeedbackForSessions(
    supabase,
    sessions.map((session) => session.id)
  );
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000";

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.sessions.title}
      user={{
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main grid flex-1 gap-4 p-4 md:grid-cols-[360px_1fr] md:p-6">
          <SessionForm
            locale={locale}
            clients={clients}
            status={status}
            dictionary={dictionary.sessions}
          />
          <SessionList
            locale={locale}
            sessions={sessions}
            clients={clients}
            feedbackLinks={feedbackLinks}
            siteUrl={siteUrl.replace(/\/$/, "")}
            dictionary={dictionary.sessions}
          />
          <SessionRequestList
            locale={locale}
            requests={sessionRequests}
            status={status}
            dictionary={dictionary.sessionRequests}
          />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
