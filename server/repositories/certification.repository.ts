import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  CertificationJourney,
  CertificationJourneyState,
  CertificationOverride,
  Level2ReadinessDecision,
  AssessmentQueueItem,
  AssessorCandidate,
  AssessmentStatus,
  CertificateWorkflowItem,
  CertificateGenerationContext,
  PreparedCertificateArtifact,
} from "@/server/models/certification.model";

type JourneyRow = Database["public"]["Tables"]["certification_journeys"]["Row"];
type JourneyListRow =
  Database["public"]["Functions"]["list_certification_journeys"]["Returns"][number];
type JourneyContextRow =
  Database["public"]["Functions"]["get_certification_journey_context"]["Returns"][number];
type ContextArgs = Database["public"]["Functions"]["get_certification_journey_context"]["Args"];
type ListArgs = Database["public"]["Functions"]["list_certification_journeys"]["Args"];
type OverrideArgs =
  Database["public"]["Functions"]["override_certification_journey_state"]["Args"];

type CertificationRpcClient = {
  rpc(
    functionName: "get_certification_journey_context",
    args: ContextArgs
  ): Promise<{ data: JourneyContextRow[] | null; error: { message: string } | null }>;
  rpc(
    functionName: "list_certification_journeys",
    args: ListArgs
  ): Promise<{ data: JourneyListRow[] | null; error: { message: string } | null }>;
  rpc(
    functionName: "override_certification_journey_state",
    args: OverrideArgs
  ): Promise<{ data: JourneyRow | null; error: { message: string } | null }>;
  rpc(
    functionName: "request_level_2_readiness",
    args: Database["public"]["Functions"]["request_level_2_readiness"]["Args"]
  ): Promise<{ data: Database["public"]["Tables"]["level_2_readiness_requests"]["Row"] | null; error: { message: string } | null }>;
  rpc(
    functionName: "decide_level_2_readiness",
    args: Database["public"]["Functions"]["decide_level_2_readiness"]["Args"]
  ): Promise<{ data: Database["public"]["Tables"]["level_2_readiness_requests"]["Row"] | null; error: { message: string } | null }>;
};

type AssessmentQueueRow = {
  journey_id: string; trainee_user_id: string; trainee_name: string;
  journey_state: CertificationJourneyState; counted_sessions_count: number;
  readiness_request_id: string | null; readiness_status: AssessmentQueueItem["readinessStatus"];
  readiness_decision_reason: string | null; assessment_id: string | null; revision_number: number | null;
  assessor_user_id: string | null; assessor_name: string | null; scheduled_at: string | null;
  assessment_status: AssessmentQueueItem["assessmentStatus"]; assessed_at: string | null;
  notes: string | null; next_action: string | null; remediation_verified_at: string | null;
  can_request_readiness: boolean; can_decide_readiness: boolean; can_assign_assessor: boolean;
  can_schedule: boolean; can_record_outcome: boolean; can_verify_remediation: boolean;
};

type AssessmentRpcClient = {
  rpc(functionName: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
};

function assessmentRpc(supabase: SupabaseServerClient) {
  return supabase as unknown as AssessmentRpcClient;
}

function toAssessmentQueueItem(row: AssessmentQueueRow): AssessmentQueueItem {
  return {
    journeyId: row.journey_id, traineeUserId: row.trainee_user_id, traineeName: row.trainee_name,
    journeyState: row.journey_state, countedSessionsCount: row.counted_sessions_count,
    readinessRequestId: row.readiness_request_id, readinessStatus: row.readiness_status,
    readinessDecisionReason: row.readiness_decision_reason, assessmentId: row.assessment_id,
    revisionNumber: row.revision_number, assessorUserId: row.assessor_user_id,
    assessorName: row.assessor_name, scheduledAt: row.scheduled_at, assessmentStatus: row.assessment_status,
    assessedAt: row.assessed_at, notes: row.notes, nextAction: row.next_action,
    remediationVerifiedAt: row.remediation_verified_at, canRequestReadiness: row.can_request_readiness,
    canDecideReadiness: row.can_decide_readiness, canAssignAssessor: row.can_assign_assessor,
    canSchedule: row.can_schedule, canRecordOutcome: row.can_record_outcome,
    canVerifyRemediation: row.can_verify_remediation,
  };
}

function toJourney(
  row: JourneyRow | JourneyListRow | JourneyContextRow,
  traineeName: string | null = null
): CertificationJourney {
  return {
    id: row.id,
    traineeUserId: row.trainee_user_id,
    practitionerId: row.practitioner_id,
    traineeName: "trainee_name" in row ? row.trainee_name : traineeName,
    state: row.state as CertificationJourneyState,
    countedSessionsCount: row.counted_sessions_count,
    level1TrainingRecordId: row.level_1_training_record_id,
    level2TrainingRecordId: row.level_2_training_record_id,
    stateChangedAt: row.state_changed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    readinessRequestId: "readiness_request_id" in row ? row.readiness_request_id : null,
    readinessStatus: "readiness_status" in row ? row.readiness_status : null,
    readinessDecisionReason: "readiness_decision_reason" in row ? row.readiness_decision_reason : null,
    canRequestLevel2Review: "can_request_level_2_review" in row
      ? row.can_request_level_2_review
      : false,
    canReviewLevel2Request: "can_review_level_2_request" in row
      ? row.can_review_level_2_request
      : false,
  };
}

export async function syncCertificationJourney(
  supabase: SupabaseServerClient,
  actorUserId: string,
  traineeUserId: string
) {
  const rpcClient = supabase as unknown as CertificationRpcClient;
  const { data, error } = await rpcClient.rpc("get_certification_journey_context", {
    actor_user_id: actorUserId,
    target_trainee_user_id: traineeUserId,
  });

  if (error) throw new Error(error.message);
  if (!data?.[0]) throw new Error("Certification journey could not be synchronized.");

  return toJourney(data[0]);
}

export async function listCertificationJourneys(
  supabase: SupabaseServerClient,
  actorUserId: string
) {
  const rpcClient = supabase as unknown as CertificationRpcClient;
  const { data, error } = await rpcClient.rpc("list_certification_journeys", {
    actor_user_id: actorUserId,
  });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => toJourney(row));
}

export async function overrideCertificationJourney(
  supabase: SupabaseServerClient,
  actorUserId: string,
  override: CertificationOverride
) {
  const rpcClient = supabase as unknown as CertificationRpcClient;
  const { data, error } = await rpcClient.rpc("override_certification_journey_state", {
    actor_user_id: actorUserId,
    target_journey_id: override.journeyId,
    expected_state: override.expectedState,
    resulting_state: override.resultingState,
    override_reason: override.reason,
    supporting_evidence_reference: override.evidenceReference,
  });

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Certification override could not be saved.");

  return toJourney(data);
}

export async function requestLevel2Readiness(
  supabase: SupabaseServerClient,
  actorUserId: string,
  journeyId: string
) {
  const { data, error } = await (supabase as unknown as CertificationRpcClient).rpc(
    "request_level_2_readiness",
    { actor_user_id: actorUserId, target_journey_id: journeyId }
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The Level 2 readiness request could not be saved.");
  return data;
}

export async function decideLevel2Readiness(
  supabase: SupabaseServerClient,
  actorUserId: string,
  decision: Level2ReadinessDecision
) {
  const { data, error } = await (supabase as unknown as CertificationRpcClient).rpc(
    "decide_level_2_readiness",
    {
      actor_user_id: actorUserId,
      target_request_id: decision.requestId,
      target_status: decision.status,
      target_reason: decision.reason,
    }
  );
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The Level 2 readiness decision could not be saved.");
  return data;
}

export async function getLevel2ReadinessRequestById(
  supabase: SupabaseServerClient,
  requestId: string
) {
  const { data, error } = await supabase
    .from("level_2_readiness_requests")
    .select("*")
    .eq("id", requestId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Database["public"]["Tables"]["level_2_readiness_requests"]["Row"] | null;
}

async function mutateAssessment(supabase: SupabaseServerClient, functionName: string, args: Record<string, unknown>) {
  const { data, error } = await assessmentRpc(supabase).rpc(functionName, args);
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The assessment workflow could not be updated.");
  return data;
}

export async function listAssessmentQueue(supabase: SupabaseServerClient, actorUserId: string) {
  const { data, error } = await assessmentRpc(supabase).rpc("list_assessment_queue", { actor_user_id: actorUserId });
  if (error) throw new Error(error.message);
  return ((data ?? []) as AssessmentQueueRow[]).map(toAssessmentQueueItem);
}

export async function listAssessorCandidates(supabase: SupabaseServerClient, actorUserId: string) {
  const { data, error } = await assessmentRpc(supabase).rpc("list_assessor_candidates", { actor_user_id: actorUserId });
  if (error) throw new Error(error.message);
  return ((data ?? []) as { user_id: string; display_name: string; active: boolean }[]).map<AssessorCandidate>((row) => ({
    userId: row.user_id, displayName: row.display_name, active: row.active,
  }));
}

export const requestAssessmentReadiness = (supabase: SupabaseServerClient, actorUserId: string, journeyId: string) =>
  mutateAssessment(supabase, "request_assessment_readiness", { actor_user_id: actorUserId, target_journey_id: journeyId });
export const decideAssessmentReadiness = (supabase: SupabaseServerClient, actorUserId: string, requestId: string, approved: boolean, reason: string | null) =>
  mutateAssessment(supabase, "decide_assessment_readiness", { actor_user_id: actorUserId, target_request_id: requestId, approve_request: approved, target_reason: reason });
export const setAssessorDesignation = (supabase: SupabaseServerClient, actorUserId: string, userId: string, active: boolean, reason: string) =>
  mutateAssessment(supabase, "set_assessor_designation", { actor_user_id: actorUserId, target_user_id: userId, target_active: active, target_reason: reason });
export const assignAssessmentAssessor = (supabase: SupabaseServerClient, actorUserId: string, assessmentId: string, assessorUserId: string) =>
  mutateAssessment(supabase, "assign_assessment_assessor", { actor_user_id: actorUserId, target_assessment_id: assessmentId, target_assessor_user_id: assessorUserId });
export const saveAssessmentSchedule = (supabase: SupabaseServerClient, actorUserId: string, assessmentId: string, scheduledAt: string) =>
  mutateAssessment(supabase, "schedule_assessment", { actor_user_id: actorUserId, target_assessment_id: assessmentId, target_scheduled_at: scheduledAt });
export const saveAssessmentOutcome = (supabase: SupabaseServerClient, actorUserId: string, assessmentId: string, status: AssessmentStatus, notes: string | null, nextAction: string | null) =>
  mutateAssessment(supabase, "record_assessment_outcome", { actor_user_id: actorUserId, target_assessment_id: assessmentId, target_status: status, target_notes: notes, target_next_action: nextAction });
export const verifyAssessmentRemediation = (supabase: SupabaseServerClient, actorUserId: string, assessmentId: string) =>
  mutateAssessment(supabase, "verify_assessment_remediation", { actor_user_id: actorUserId, target_assessment_id: assessmentId });

type CertificateRpcClient = {
  rpc(functionName: string, args: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>;
};

function certificateRpc(supabase: SupabaseServerClient) {
  return supabase as unknown as CertificateRpcClient;
}

export async function listCertificateWorkflow(
  supabase: SupabaseServerClient,
  actorUserId: string
): Promise<CertificateWorkflowItem[]> {
  const { data, error } = await certificateRpc(supabase).rpc("list_certificate_workflow", {
    actor_user_id: actorUserId,
  });
  if (error) throw new Error(error.message);
  return ((data ?? []) as Database["public"]["Functions"]["list_certificate_workflow"]["Returns"]).map((row) => ({
    journeyId: row.journey_id,
    memberUserId: row.member_user_id,
    memberName: row.member_name,
    currentOfficialName: row.current_official_name,
    journeyState: row.journey_state,
    certificationStatus: row.certification_status,
    assessmentId: row.assessment_id,
    certificateId: row.certificate_id,
    certificateNumber: row.certificate_number,
    certificateStatus: row.certificate_status,
    certificateNameSnapshot: row.certificate_name_snapshot,
    originalCertificationDate: row.original_certification_date,
    issuedAt: row.issued_at,
    lifecycleEffectiveAt: row.lifecycle_effective_at,
    revokedAt: row.revoked_at,
    revocationReason: row.revocation_reason,
    replacementRequestId: row.replacement_request_id,
    replacementRequestStatus: row.replacement_request_status,
    replacementRequestReason: row.replacement_request_reason,
    appealId: row.appeal_id,
    appealStatus: row.appeal_status,
    appealReason: row.appeal_reason,
    appealEvidenceReference: row.appeal_evidence_reference,
    appealDecisionReason: row.appeal_decision_reason,
    templateReady: row.template_ready,
    canIssue: row.can_issue,
    canReplace: row.can_replace,
    canRevoke: row.can_revoke,
    canRequestReplacement: row.can_request_replacement,
    canSubmitAppeal: row.can_submit_appeal,
    canDecideAppeal: row.can_decide_appeal,
    canDownload: row.can_download,
    nameMismatch: row.name_mismatch,
  }));
}

export async function getCertificateGenerationContext(
  supabase: SupabaseServerClient,
  actorUserId: string,
  operation: CertificateGenerationContext["operation"],
  ids: { journeyId?: string; certificateId?: string; appealId?: string }
) {
  const { data, error } = await certificateRpc(supabase).rpc("get_certificate_generation_context", {
    actor_user_id: actorUserId,
    target_operation: operation,
    target_journey_id: ids.journeyId ?? null,
    target_certificate_id: ids.certificateId ?? null,
    target_appeal_id: ids.appealId ?? null,
  });
  if (error) throw new Error(error.message);
  const row = (data as Database["public"]["Functions"]["get_certificate_generation_context"]["Returns"] | null)?.[0];
  if (!row) throw new Error("Certificate generation context is unavailable.");
  return {
    operation: row.operation as CertificateGenerationContext["operation"],
    journeyId: row.journey_id,
    assessmentId: row.assessment_id,
    memberUserId: row.member_user_id,
    officialName: row.official_name ?? "",
    originalCertificationDate: row.original_certification_date,
    predecessorCertificateId: row.predecessor_certificate_id,
    templateId: row.template_id,
    templateVersion: row.template_version,
    issuerName: row.issuer_name,
    signatoryOneName: row.signatory_one_name,
    signatoryOneObjectPath: row.signatory_one_object_path ?? "",
    signatoryOneSha256: row.signatory_one_sha256 ?? "",
    signatoryTwoName: row.signatory_two_name,
    signatoryTwoObjectPath: row.signatory_two_object_path ?? "",
    signatoryTwoSha256: row.signatory_two_sha256 ?? "",
    templateReady: row.template_ready,
  } satisfies CertificateGenerationContext;
}

async function mutateCertificate(
  supabase: SupabaseServerClient,
  functionName: string,
  args: Record<string, unknown>
) {
  const { data, error } = await certificateRpc(supabase).rpc(functionName, args);
  if (error) throw new Error(error.message);
  if (!data) throw new Error("The certificate workflow could not be updated.");
  return data;
}

function artifactArgs(artifact: PreparedCertificateArtifact) {
  return {
    target_certificate_id: artifact.certificateId,
    target_certificate_number: artifact.certificateNumber,
    target_template_id: artifact.templateId,
    target_artifact_object_path: artifact.objectPath,
    target_artifact_sha256: artifact.sha256,
    target_artifact_size_bytes: artifact.sizeBytes,
    target_signatory_one_sha256: artifact.signatoryOneSha256,
    target_signatory_two_sha256: artifact.signatoryTwoSha256,
  };
}

export const commitCertificateIssuance = (
  supabase: SupabaseServerClient,
  actorUserId: string,
  journeyId: string,
  artifact: PreparedCertificateArtifact
) => mutateCertificate(supabase, "issue_certificate", {
  actor_user_id: actorUserId,
  target_journey_id: journeyId,
  ...artifactArgs(artifact),
});

export const commitCertificateReplacement = (
  supabase: SupabaseServerClient,
  actorUserId: string,
  predecessorCertificateId: string,
  reason: string,
  requestId: string | null,
  artifact: PreparedCertificateArtifact
) => mutateCertificate(supabase, "replace_certificate", {
  actor_user_id: actorUserId,
  target_predecessor_certificate_id: predecessorCertificateId,
  replacement_reason: reason,
  target_replacement_request_id: requestId,
  ...artifactArgs(artifact),
});

export const commitCertificateReinstatement = (
  supabase: SupabaseServerClient,
  actorUserId: string,
  appealId: string,
  reason: string,
  artifact: PreparedCertificateArtifact
) => mutateCertificate(supabase, "reinstate_certificate_from_appeal", {
  actor_user_id: actorUserId,
  target_appeal_id: appealId,
  target_decision_reason: reason,
  ...artifactArgs(artifact),
});

export const revokeCertificateRecord = (supabase: SupabaseServerClient, actorUserId: string, certificateId: string, reason: string, evidenceReference: string) =>
  mutateCertificate(supabase, "revoke_certificate", { actor_user_id: actorUserId, target_certificate_id: certificateId, target_reason: reason, target_evidence_reference: evidenceReference });
export const requestCertificateReplacementRecord = (supabase: SupabaseServerClient, actorUserId: string, certificateId: string, reason: string) =>
  mutateCertificate(supabase, "request_certificate_replacement", { actor_user_id: actorUserId, target_certificate_id: certificateId, target_reason: reason });
export const rejectCertificateReplacementRecord = (supabase: SupabaseServerClient, actorUserId: string, requestId: string, reason: string) =>
  mutateCertificate(supabase, "reject_certificate_replacement_request", { actor_user_id: actorUserId, target_request_id: requestId, target_reason: reason });
export const submitCertificateAppealRecord = (supabase: SupabaseServerClient, actorUserId: string, certificateId: string, reason: string, evidenceReference: string | null) =>
  mutateCertificate(supabase, "submit_certificate_appeal", { actor_user_id: actorUserId, target_certificate_id: certificateId, target_reason: reason, target_evidence_reference: evidenceReference });
export const upholdCertificateAppealRecord = (supabase: SupabaseServerClient, actorUserId: string, appealId: string, reason: string) =>
  mutateCertificate(supabase, "uphold_certificate_appeal", { actor_user_id: actorUserId, target_appeal_id: appealId, target_reason: reason });

export async function authorizeCertificateDownload(
  supabase: SupabaseServerClient,
  actorUserId: string,
  certificateId: string
) {
  const { data, error } = await certificateRpc(supabase).rpc("authorize_certificate_download", {
    actor_user_id: actorUserId,
    target_certificate_id: certificateId,
  });
  if (error) throw new Error(error.message);
  const row = (data as Database["public"]["Functions"]["authorize_certificate_download"]["Returns"] | null)?.[0];
  if (!row) throw new Error("Certificate download is unavailable.");
  return row;
}

export async function verifyCertificateNumber(supabase: SupabaseServerClient, certificateNumber: string) {
  const { data, error } = await certificateRpc(supabase).rpc("verify_certificate", {
    target_certificate_number: certificateNumber,
  });
  if (error) throw new Error(error.message);
  return (data as Database["public"]["Functions"]["verify_certificate"]["Returns"] | null)?.[0] ?? null;
}
