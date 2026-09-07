import { redirect } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PractitionerProfileRequiredAlert } from "@/components/dashboard/practitioner-profile-required-alert";
import { CertificationJourneyReview } from "@/features/certification/components/certification-journey-review";
import { CertificationProgressCard } from "@/features/certification/components/certification-progress-card";
import {
  AssessmentQueueSection,
  AssessorAuthorizationSection,
} from "@/features/certification/components/assessment-workflow";
import { CertificateWorkflow } from "@/features/certification/components/certificate-workflow";
import {
  CertificationDashboardTabs,
  type CertificationDashboardTab,
} from "@/features/certification/components/certification-dashboard-tabs";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getPractitionerProfileByUserId } from "@/server/repositories/practitioner.repository";
import { getLevel2ReadinessRequestById } from "@/server/repositories/certification.repository";
import { listUserRoles } from "@/server/repositories/rbac.repository";
import {
  getCertificationJourney,
  listCertificationJourneysForReview,
  getAssessmentQueue,
  getAssessorCandidates,
} from "@/server/services/certification.service";
import { listCertificateWorkflow } from "@/server/services/certificate.service";
import { getPrimaryRole, hasPermission } from "@/server/services/rbac.service";

type CertificationPageProps = {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ status?: string; traineeId?: string; journeyId?: string; decisionId?: string; assessmentId?: string; certificateId?: string }>;
};

export default async function CertificationPage({ params, searchParams }: CertificationPageProps) {
  const [{ locale }, { status, traineeId, journeyId, decisionId, assessmentId, certificateId }] = await Promise.all([params, searchParams]);
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
  const [journeyResult, reviewResult, decisionResult, assessmentResult, assessorResult, certificateResult] = await Promise.allSettled([
    practitioner
      ? getCertificationJourney(supabase, data.user.id, data.user.id)
      : Promise.resolve(null),
    canReview
      ? listCertificationJourneysForReview(supabase, data.user.id)
      : Promise.resolve([]),
    decisionId
      ? getLevel2ReadinessRequestById(supabase, decisionId)
      : Promise.resolve(null),
    getAssessmentQueue(supabase, data.user.id),
    canOverride ? getAssessorCandidates(supabase, data.user.id) : Promise.resolve([]),
    listCertificateWorkflow(supabase, data.user.id),
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
  const loadedAssessments = assessmentResult.status === "fulfilled" ? assessmentResult.value : [];
  const assessmentItems = assessmentId
    ? loadedAssessments.filter((item) => item.assessmentId === assessmentId || item.readinessRequestId === assessmentId)
    : traineeId
      ? loadedAssessments.filter((item) => item.traineeUserId === traineeId)
      : loadedAssessments;
  const assessorCandidates = assessorResult.status === "fulfilled" ? assessorResult.value : [];
  const loadedCertificates = certificateResult.status === "fulfilled" ? certificateResult.value : [];
  const certificateItems = certificateId
    ? loadedCertificates.filter((item) => item.certificateId === certificateId)
    : traineeId
      ? loadedCertificates.filter((item) => item.memberUserId === traineeId)
      : loadedCertificates;
  const reviewJourneys = traineeId
    ? loadedReviewJourneys.filter((item) => item.traineeUserId === traineeId)
    : decisionId
      ? loadedReviewJourneys.filter((item) => item.readinessRequestId === decisionId)
      : loadedReviewJourneys;
  const loadFailed = journeyResult.status === "rejected"
    || reviewResult.status === "rejected"
    || decisionResult.status === "rejected"
    || assessmentResult.status === "rejected"
    || assessorResult.status === "rejected"
    || certificateResult.status === "rejected";
  const practitionerProfileRequired = !practitioner && !canReview;
  const showProgress = Boolean(displayedJourney && (!journeyId || displayedJourney.id === journeyId) && (!decisionId || displayedJourney.readinessRequestId === decisionId));
  const certificationStatusTab: CertificationDashboardTab | undefined = status?.startsWith("certificate-")
    ? "certificates"
    : status?.startsWith("assessor-designation-")
      ? "authorization"
      : status?.startsWith("assessment-")
        ? "assessments"
        : status?.startsWith("readiness-") || status?.startsWith("decision-") || status?.startsWith("override-")
          ? canReview ? "reviews" : "progress"
          : undefined;
  const defaultTab: CertificationDashboardTab = certificateId
    ? "certificates"
    : assessmentId
      ? "assessments"
      : decisionId || traineeId
        ? canReview ? "reviews" : showProgress ? "progress" : "assessments"
        : certificationStatusTab ?? (showProgress ? "progress" : canReview ? "reviews" : "assessments");
  const sections = [
    ...(showProgress && displayedJourney ? [{
      id: "progress" as const,
      label: dictionary.certification.progressTab,
      content: (
        <CertificationProgressCard
          progress={displayedJourney}
          locale={locale}
          dictionary={dictionary.certification}
        />
      ),
    }] : []),
    ...(canReview ? [{
      id: "reviews" as const,
      label: dictionary.certification.reviewTitle,
      content: (
        <CertificationJourneyReview
          locale={locale}
          journeys={reviewJourneys}
          canOverride={canOverride}
          status={status}
          dictionary={dictionary.certification}
        />
      ),
    }] : []),
    ...(canOverride ? [{
      id: "authorization" as const,
      label: dictionary.certification.assessorAuthorizationTitle,
      content: (
        <AssessorAuthorizationSection
          locale={locale}
          candidates={assessorCandidates}
          dictionary={dictionary.certification}
        />
      ),
    }] : []),
    {
      id: "assessments" as const,
      label: dictionary.certification.assessmentTitle,
      content: (
        <AssessmentQueueSection
          locale={locale}
          items={assessmentItems}
          candidates={assessorCandidates}
          status={status}
          dictionary={dictionary.certification}
        />
      ),
    },
    {
      id: "certificates" as const,
      label: dictionary.certification.certificateTitle,
      content: (
        <CertificateWorkflow
          locale={locale}
          items={certificateItems}
          status={status}
          dictionary={dictionary.certification}
        />
      ),
    },
  ];

  return (
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
        <CertificationDashboardTabs defaultTab={defaultTab} sections={sections} />
      </div>
    </div>
  );
}
