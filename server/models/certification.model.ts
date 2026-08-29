export const certificationJourneyStates = [
  "level_1_in_progress",
  "level_1_completed",
  "practicum_in_progress",
  "sessions_25_reached",
  "level_2_review_eligible",
  "level_2_completed",
  "advanced_practicum_in_progress",
  "sessions_50_reached",
  "assessment_available",
  "assessment_in_progress",
  "revision_required",
  "assessment_passed",
  "certification_approved",
  "facilitator_activated",
] as const;

export type CertificationJourneyState = (typeof certificationJourneyStates)[number];

export const level2ReadinessStatuses = [
  "pending",
  "approved",
  "rejected",
  "revision_required",
  "invalidated",
] as const;

export type Level2ReadinessStatus = (typeof level2ReadinessStatuses)[number];

export type CertificationJourney = {
  id: string;
  traineeUserId: string;
  practitionerId: string;
  traineeName: string | null;
  state: CertificationJourneyState;
  countedSessionsCount: number;
  level1TrainingRecordId: string | null;
  level2TrainingRecordId: string | null;
  stateChangedAt: string;
  createdAt: string;
  updatedAt: string;
  readinessRequestId: string | null;
  readinessStatus: Level2ReadinessStatus | null;
  readinessDecisionReason: string | null;
  canRequestLevel2Review: boolean;
  canReviewLevel2Request: boolean;
};

export type CertificationJourneySummary = CertificationJourney & {
  currentStateIndex: number;
  nextState: CertificationJourneyState | null;
  sessionMilestone: 25 | 50;
  remainingSessionsCount: number;
  percentComplete: number;
  validatedSessionsCount: number;
  requiredSessionsCount: number;
};

export type CertificationSummary = CertificationJourneySummary;

export type CertificationOverride = {
  journeyId: string;
  expectedState: CertificationJourneyState;
  resultingState: CertificationJourneyState;
  reason: string;
  evidenceReference: string;
};

export type Level2ReadinessDecision = {
  requestId: string;
  status: Extract<Level2ReadinessStatus, "approved" | "rejected" | "revision_required">;
  reason: string | null;
};

export const assessmentReadinessStatuses = ["pending", "approved", "rejected", "invalidated"] as const;
export type AssessmentReadinessStatus = (typeof assessmentReadinessStatuses)[number];

export const assessmentStatuses = [
  "awaiting_assessor",
  "scheduled",
  "incomplete",
  "revision_required",
  "failed",
  "passed",
] as const;
export type AssessmentStatus = (typeof assessmentStatuses)[number];

export type AssessmentQueueItem = {
  journeyId: string;
  traineeUserId: string;
  traineeName: string;
  journeyState: CertificationJourneyState;
  countedSessionsCount: number;
  readinessRequestId: string | null;
  readinessStatus: AssessmentReadinessStatus | null;
  readinessDecisionReason: string | null;
  assessmentId: string | null;
  revisionNumber: number | null;
  assessorUserId: string | null;
  assessorName: string | null;
  scheduledAt: string | null;
  assessmentStatus: AssessmentStatus | null;
  assessedAt: string | null;
  notes: string | null;
  nextAction: string | null;
  remediationVerifiedAt: string | null;
  canRequestReadiness: boolean;
  canDecideReadiness: boolean;
  canAssignAssessor: boolean;
  canSchedule: boolean;
  canRecordOutcome: boolean;
  canVerifyRemediation: boolean;
};

export type AssessorCandidate = {
  userId: string;
  displayName: string;
  active: boolean;
};
