import { redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { JanzuDashboardFrame } from "@/components/dashboard/janzu-dashboard-frame";
import { PractitionerProfileRequiredAlert } from "@/components/dashboard/practitioner-profile-required-alert";
import { CertificationJourneyReview } from "@/features/certification/components/certification-journey-review";
import { CertificationProgressCard } from "@/features/certification/components/certification-progress-card";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import { getLevel2ReadinessRequestById } from "@/server/repositories/certification.repository";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  getCertificationJourney,
  listCertificationJourneysForReview,
} from "@/server/services/certification.service";
import { getPrimaryRole, getRoleAccessList, hasPermission } from "@/server/services/rbac.service";

type CertificationPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string; traineeId?: string; journeyId?: string; decisionId?: string }>;
};

export default async function CertificationPage({ params, searchParams }: CertificationPageProps) {
  const [{ locale }, { status, traineeId, journeyId, decisionId }] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const [{ data }, dictionary] = await Promise.all([
    supabase.auth.getUser(),
    getDictionary(locale),
  ]);

  if (!data.user) redirect(`/${locale}/login?status=auth-required`);

  const [roles, practitioner] = await Promise.all([
    listUserRoles(supabase, data.user.id),
    getPractitionerProfileByUserId(supabase, data.user.id),
  ]);
  const primaryRole = getPrimaryRole(roles);
  if (!primaryRole) redirect(`/${locale}/dashboard`);

  const canOverride = hasPermission(roles, "certifications:approve");
  const canReview = canOverride || roles.includes("instructor");
  const [journeyResult, reviewResult, decisionResult] = await Promise.allSettled([
    practitioner
      ? getCertificationJourney(supabase, data.user.id, data.user.id)
      : Promise.resolve(null),
    canReview
      ? listCertificationJourneysForReview(supabase, data.user.id)
      : Promise.resolve([]),
    decisionId
      ? getLevel2ReadinessRequestById(supabase, decisionId)
      : Promise.resolve(null),
  ]);

  const journey = journeyResult.status === "fulfilled" ? journeyResult.value : null;
  const selectedDecision = decisionResult.status === "fulfilled" ? decisionResult.value : null;
  const displayedJourney = journey && selectedDecision?.journey_id === journey.id
    ? {
        ...journey,
        readinessRequestId: selectedDecision.id,
        readinessStatus: selectedDecision.status,
        readinessDecisionReason: selectedDecision.decision_reason,
      }
    : journey;
  const loadedReviewJourneys = reviewResult.status === "fulfilled" ? reviewResult.value : [];
  const reviewJourneys = traineeId
    ? loadedReviewJourneys.filter((item) => item.traineeUserId === traineeId)
    : decisionId
      ? loadedReviewJourneys.filter((item) => item.readinessRequestId === decisionId)
      : loadedReviewJourneys;
  const loadFailed = journeyResult.status === "rejected"
    || reviewResult.status === "rejected"
    || decisionResult.status === "rejected";
  const practitionerProfileRequired = !practitioner && !canReview;

  return (
    <JanzuDashboardFrame
      locale={locale}
      access={getRoleAccessList(roles)}
      title={dictionary.certification.title}
      user={{
        id: data.user.id,
        name: data.user.user_metadata.full_name ?? data.user.email ?? "Janzu Practitioner",
        email: data.user.email ?? "",
        avatar: data.user.user_metadata.avatar_url,
      }}
    >
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-4 p-4 md:p-6">
          {loadFailed ? (
            <Alert>
              <AlertDescription>{dictionary.certification.loadError}</AlertDescription>
            </Alert>
          ) : null}
          {practitionerProfileRequired ? (
            <PractitionerProfileRequiredAlert
              href={`/${locale}/dashboard/profile`}
              title={dictionary.clients.profileRequiredTitle}
              description={dictionary.clients.profileRequiredDescription}
              actionLabel={dictionary.clients.profileRequiredAction}
            />
          ) : null}
          {displayedJourney && (!journeyId || displayedJourney.id === journeyId) && (!decisionId || displayedJourney.readinessRequestId === decisionId) ? (
            <CertificationProgressCard
              progress={displayedJourney}
              locale={locale}
              dictionary={dictionary.certification}
            />
          ) : null}
          {canReview ? (
            <CertificationJourneyReview
              locale={locale}
              journeys={reviewJourneys}
              canOverride={canOverride}
              status={status}
              dictionary={dictionary.certification}
            />
          ) : null}
        </div>
      </div>
    </JanzuDashboardFrame>
  );
}
