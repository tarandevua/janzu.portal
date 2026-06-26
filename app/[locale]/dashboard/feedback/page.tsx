import { redirect } from "next/navigation";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { DashboardFeedbackList } from "@/features/feedback/components/dashboard-feedback-list";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  findDashboardFeedback,
  findFeedbackParticipants,
} from "@/server/services/feedback.service";
import { getPrimaryRole, getRoleAccessList, hasAnyRole } from "@/server/services/rbac.service";

const PAGE_SIZE = 10;

type FeedbackDashboardPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ participantId?: string; page?: string }>;
};

function normalizeParticipantId(value: string | undefined) {
  return value && value !== "all" ? value : null;
}

function parsePage(value: string | undefined) {
  const page = Number.parseInt(value ?? "1", 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function buildFeedbackHref(locale: Locale, page: number, participantId: string | null) {
  const params = new URLSearchParams();

  if (participantId) {
    params.set("participantId", participantId);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return `/${locale}/dashboard/feedback${query ? `?${query}` : ""}`;
}

export default async function FeedbackDashboardPage({
  params,
  searchParams,
}: FeedbackDashboardPageProps) {
  const [{ locale }, { participantId, page }] = await Promise.all([params, searchParams]);
  const currentPage = parsePage(page);
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

  const canFilterParticipants = hasAnyRole(roles, ["admin", "manager"]);
  const selectedParticipantId = canFilterParticipants
    ? normalizeParticipantId(participantId)
    : null;
  const [feedbackPage, participants] = await Promise.all([
    findDashboardFeedback(
      supabase,
      data.user.id,
      selectedParticipantId,
      currentPage,
      PAGE_SIZE
    ),
    findFeedbackParticipants(supabase, data.user.id),
  ]);

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.feedback.dashboardTitle}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          <DashboardFeedbackList
            locale={locale}
            feedback={feedbackPage.items}
            participants={participants}
            selectedParticipantId={selectedParticipantId ?? undefined}
            canFilterParticipants={canFilterParticipants}
            page={currentPage}
            pageSize={PAGE_SIZE}
            totalCount={feedbackPage.totalCount}
            previousHref={buildFeedbackHref(locale, currentPage - 1, selectedParticipantId)}
            nextHref={buildFeedbackHref(locale, currentPage + 1, selectedParticipantId)}
            dictionary={dictionary.feedback}
          />
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
