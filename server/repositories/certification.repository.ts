import type { SupabaseServerClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type {
  CertificationJourney,
  CertificationJourneyState,
  CertificationOverride,
  Level2ReadinessDecision,
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
