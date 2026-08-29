import type { SupabaseServerClient } from "@/lib/supabase/server";
import {
  certificationJourneyStates,
  type CertificationJourney,
  type CertificationJourneyState,
  type CertificationOverride,
  type Level2ReadinessDecision,
} from "@/server/models/certification.model";
import {
  listCertificationJourneys,
  overrideCertificationJourney,
  syncCertificationJourney,
  requestLevel2Readiness,
  decideLevel2Readiness,
  listAssessmentQueue,
  listAssessorCandidates,
  requestAssessmentReadiness,
  decideAssessmentReadiness,
  setAssessorDesignation,
  assignAssessmentAssessor,
  saveAssessmentSchedule,
  saveAssessmentOutcome,
  verifyAssessmentRemediation,
} from "@/server/repositories/certification.repository";
import type { AssessmentStatus } from "@/server/models/certification.model";

const protectedApprovalStates = new Set<CertificationJourneyState>([
  "assessment_passed",
  "certification_approved",
  "facilitator_activated",
]);

export function getCertificationStateIndex(state: CertificationJourneyState) {
  return certificationJourneyStates.indexOf(state);
}

export function getNextOverrideState(state: CertificationJourneyState) {
  const nextState = certificationJourneyStates[getCertificationStateIndex(state) + 1] ?? null;
  return nextState && !protectedApprovalStates.has(nextState) ? nextState : null;
}

export function toCertificationJourneySummary(journey: CertificationJourney) {
  const currentStateIndex = getCertificationStateIndex(journey.state);
  const sessionMilestone = currentStateIndex < 5 ? 25 : 50;

  return {
    ...journey,
    currentStateIndex,
    nextState: getNextOverrideState(journey.state),
    sessionMilestone: sessionMilestone as 25 | 50,
    remainingSessionsCount: Math.max(sessionMilestone - journey.countedSessionsCount, 0),
    percentComplete: Math.min(
      Math.round((journey.countedSessionsCount / sessionMilestone) * 100),
      100
    ),
    validatedSessionsCount: journey.countedSessionsCount,
    requiredSessionsCount: sessionMilestone,
  };
}

export async function getCertificationJourney(
  supabase: SupabaseServerClient,
  actorUserId: string,
  traineeUserId: string
) {
  return toCertificationJourneySummary(
    await syncCertificationJourney(supabase, actorUserId, traineeUserId)
  );
}

export async function listCertificationJourneysForReview(
  supabase: SupabaseServerClient,
  actorUserId: string
) {
  return (await listCertificationJourneys(supabase, actorUserId)).map(
    toCertificationJourneySummary
  );
}

export async function overrideCertificationState(
  supabase: SupabaseServerClient,
  actorUserId: string,
  override: CertificationOverride
) {
  return toCertificationJourneySummary(
    await overrideCertificationJourney(supabase, actorUserId, override)
  );
}

export function submitLevel2ReadinessRequest(
  supabase: SupabaseServerClient,
  actorUserId: string,
  journeyId: string
) {
  return requestLevel2Readiness(supabase, actorUserId, journeyId);
}

export function submitLevel2ReadinessDecision(
  supabase: SupabaseServerClient,
  actorUserId: string,
  decision: Level2ReadinessDecision
) {
  return decideLevel2Readiness(supabase, actorUserId, decision);
}

export const getAssessmentQueue = listAssessmentQueue;
export const getAssessorCandidates = listAssessorCandidates;
export const submitAssessmentReadinessRequest = requestAssessmentReadiness;
export const submitAssessmentReadinessDecision = decideAssessmentReadiness;
export const updateAssessorDesignation = setAssessorDesignation;
export const submitAssessmentAssessor = assignAssessmentAssessor;
export const submitAssessmentSchedule = saveAssessmentSchedule;
export function submitAssessmentOutcome(
  supabase: SupabaseServerClient,
  actorUserId: string,
  assessmentId: string,
  status: AssessmentStatus,
  notes: string | null,
  nextAction: string | null
) {
  return saveAssessmentOutcome(supabase, actorUserId, assessmentId, status, notes, nextAction);
}
export const submitAssessmentRemediationVerification = verifyAssessmentRemediation;
