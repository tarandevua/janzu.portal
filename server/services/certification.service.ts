import type { SupabaseServerClient } from "@/lib/supabase/server";
import {
  certificationJourneyStates,
  type CertificationJourney,
  type CertificationJourneyState,
  type CertificationOverride,
} from "@/server/models/certification.model";
import {
  listCertificationJourneys,
  overrideCertificationJourney,
  syncCertificationJourney,
} from "@/server/repositories/certification.repository";

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
