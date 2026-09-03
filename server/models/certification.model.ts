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

export const certificateStatuses = ["active", "replaced", "revoked"] as const;
export type CertificateStatus = (typeof certificateStatuses)[number];
export type CertificationLifecycleStatus = "pending" | "active" | "revoked";
export type CertificateAppealStatus = "pending" | "upheld" | "reinstated";
export type CertificateReplacementRequestStatus = "pending" | "approved" | "rejected";

export type CertificateWorkflowItem = {
  journeyId: string;
  memberUserId: string;
  memberName: string;
  currentOfficialName: string | null;
  journeyState: CertificationJourneyState;
  certificationStatus: CertificationLifecycleStatus;
  assessmentId: string | null;
  certificateId: string | null;
  certificateNumber: string | null;
  certificateStatus: CertificateStatus | null;
  certificateNameSnapshot: string | null;
  originalCertificationDate: string | null;
  issuedAt: string | null;
  lifecycleEffectiveAt: string | null;
  revokedAt: string | null;
  revocationReason: string | null;
  replacementRequestId: string | null;
  replacementRequestStatus: CertificateReplacementRequestStatus | null;
  replacementRequestReason: string | null;
  appealId: string | null;
  appealStatus: CertificateAppealStatus | null;
  appealReason: string | null;
  appealEvidenceReference: string | null;
  appealDecisionReason: string | null;
  templateReady: boolean;
  canIssue: boolean;
  canReplace: boolean;
  canRevoke: boolean;
  canRequestReplacement: boolean;
  canSubmitAppeal: boolean;
  canDecideAppeal: boolean;
  canDownload: boolean;
  nameMismatch: boolean;
};

export type CertificateGenerationContext = {
  operation: "issue" | "replace" | "reinstate";
  journeyId: string;
  assessmentId: string;
  memberUserId: string;
  officialName: string;
  originalCertificationDate: string;
  predecessorCertificateId: string | null;
  templateId: string;
  templateVersion: string;
  issuerName: string;
  signatoryOneName: string;
  signatoryOneObjectPath: string;
  signatoryOneSha256: string;
  signatoryTwoName: string;
  signatoryTwoObjectPath: string;
  signatoryTwoSha256: string;
  templateReady: boolean;
};

export type PreparedCertificateArtifact = {
  certificateId: string;
  certificateNumber: string;
  objectPath: string;
  sha256: string;
  sizeBytes: number;
  templateId: string;
  signatoryOneSha256: string;
  signatoryTwoSha256: string;
};
